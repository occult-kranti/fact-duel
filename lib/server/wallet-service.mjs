/**
 * The server wallet: the coin balance a device cannot forge, and the rewarded-ad nonce that is the
 * only way a web client can mint one.
 *
 * What this is. The device wallet in `lib/wallet-store.mjs` is honest but local; nothing stops a
 * modified browser from writing any balance it likes into IndexedDB. Once coins are staked against
 * another human that balance has to be the server's, and the server has to know why each coin
 * exists. So every coin here is a `grant` on the play ledger (`lib/ledger`), posted through the
 * constraint-guarded store, and the only grant a client can ask for is "I finished an ad you told me
 * to watch" — against a nonce this service issued, bound to that principal, that placement, that
 * region and that reward at issue time.
 *
 * What it is not. Nothing here verifies that an ad was actually shown: no Google web product gives a
 * server-side completion callback ("Server-side verification is an app only feature"), so the ceiling
 * on a lying client is set by what the server chose to issue — one payout per nonce, no nonce inside
 * the cooldown, none past the daily cap, none before the ad could have finished, none after the
 * nonce died. The app builds add AdMob SSV on top; this module is the floor they stand on.
 *
 * Idempotency is two constraints deep. `ad_redemptions.nonce_id` is a primary key, so recording the
 * redemption collides on a replay; and the grant's operation key names the nonce, so the ledger
 * refuses the same payout as a `duplicate` on its own. A crash between the two is healed by the
 * retry: a redemption row with no grant behind it posts the grant on the next call, because the
 * grant's id does not depend on when it is posted.
 *
 * The principal is anonymous. It is an id the device minted; there is no session and no proof it
 * is the same device. That is the guest tier by design — a stolen guest id can spend that guest's
 * coins and nothing else — and M4 promotes it in place under a real session so nothing earned as a
 * guest is lost.
 */
import { DEFAULT_CONFIG, adRewardFor, dayKeyOf } from '../economy/economy.mjs';
import { issueNonce, redeemNonce, nonceAdId, NONCE_TTL_MS } from '../ads/nonce.mjs';
import { PLACEMENTS } from '../ads/provider.mjs';
import { grant, burn } from '../ledger/intents.mjs';
import { userAccount } from '../ledger/accounts.mjs';
import { GameError, requireValue } from './room-engine.mjs';
import { D1LedgerStore } from './ledger-store-d1.mjs';

/** A guest principal: a prefix the device chose, then 16-58 url-safe characters it minted. */
const PRINCIPAL = /^[a-z]{1,8}_[A-Za-z0-9_-]{16,58}$/;
const REGION = /^[A-Z]{2}$/;
const TZ_LIMIT = 14 * 60;

export const WALLET = Object.freeze({
  placements: PLACEMENTS,
  /** How long an unredeemed nonce is kept after it expires; the sweep deletes older ones. */
  nonceRetentionMs: 24 * 3_600_000,
});

export function readPrincipalId(value) {
  requireValue(typeof value === 'string' && PRINCIPAL.test(value), 'A guest id is required.', 400, 'invalid_request');
  return value;
}

export function readRegion(value) {
  return typeof value === 'string' && REGION.test(value) ? value : '*';
}

function readTz(value) {
  return Number.isInteger(value) && Math.abs(value) <= TZ_LIMIT ? value : 0;
}

function readPlacement(value) {
  requireValue(typeof value === 'string' && PLACEMENTS.includes(value), 'Unknown ad placement.', 400, 'invalid_request');
  return value;
}

/**
 * The D1 half. One class over the same session as the ledger store, so a nonce read and the grant
 * it pays are one consistent view.
 */
export class D1WalletStore {
  constructor(db) {
    this.db = typeof db.withSession === 'function' ? db.withSession('first-primary') : db;
    this.ledger = new D1LedgerStore(this.db);
  }

  async touchPrincipal(principalId, now) {
    await this.db.batch([
      this.db
        .prepare('INSERT OR IGNORE INTO principals (id, kind, created_at, last_seen_at, promoted_to) VALUES (?, ?, ?, ?, NULL)')
        .bind(principalId, 'anon', now, now),
      this.db.prepare('UPDATE principals SET last_seen_at = ? WHERE id = ?').bind(now, principalId),
    ]);
  }

  async adsOn(principalId, dayKey) {
    const row = await this.db
      .prepare('SELECT COUNT(*) AS n, MAX(at) AS last FROM ad_redemptions WHERE principal_id = ? AND day_key = ?')
      .bind(principalId, dayKey)
      .first();
    return { count: Number(row?.n ?? 0), lastAt: row?.last == null ? null : Number(row.last) };
  }

  async lastRedemptionAt(principalId) {
    const row = await this.db.prepare('SELECT MAX(at) AS last FROM ad_redemptions WHERE principal_id = ?').bind(principalId).first();
    return row?.last == null ? null : Number(row.last);
  }

  async insertNonce(nonce, { region, reward }) {
    await this.db
      .prepare(
        'INSERT INTO ad_nonces (id, principal_id, placement, region, reward, issued_at, expires_at, min_ms, redeemed_at) VALUES (?,?,?,?,?,?,?,?,NULL)',
      )
      .bind(nonce.id, nonce.principalId, nonce.placement, region, reward, nonce.issuedAt, nonce.expiresAt, nonce.minMs)
      .run();
  }

  async readNonce(id) {
    const row = await this.db
      .prepare('SELECT id, principal_id, placement, region, reward, issued_at, expires_at, min_ms, redeemed_at FROM ad_nonces WHERE id = ?')
      .bind(id)
      .first();
    if (!row) return null;
    return {
      nonce: Object.freeze({
        id: row.id,
        principalId: row.principal_id,
        placement: row.placement,
        issuedAt: Number(row.issued_at),
        expiresAt: Number(row.expires_at),
        minMs: Number(row.min_ms),
        redeemedAt: row.redeemed_at == null ? null : Number(row.redeemed_at),
      }),
      region: row.region,
      reward: Number(row.reward),
    };
  }

  /** The guard. Throws on a replay — the primary key is the nonce id. */
  async recordRedemption({ nonceId, principalId, dayKey, amount, at }) {
    await this.db.batch([
      this.db
        .prepare('INSERT INTO ad_redemptions (nonce_id, principal_id, day_key, amount, at) VALUES (?,?,?,?,?)')
        .bind(nonceId, principalId, dayKey, amount, at),
      this.db.prepare('UPDATE ad_nonces SET redeemed_at = ? WHERE id = ?').bind(at, nonceId),
    ]);
  }

  async redemptionExists(nonceId) {
    return !!(await this.db.prepare('SELECT nonce_id FROM ad_redemptions WHERE nonce_id = ?').bind(nonceId).first());
  }

  /** The once-only guard for a daily mark: the PK collision is the refusal. Returns false on replay. */
  async markOnce({ key, principalId, kind, at }) {
    try {
      await this.db.prepare('INSERT INTO daily_marks (key, principal_id, kind, at) VALUES (?,?,?,?)').bind(key, principalId, kind, at).run();
      return true;
    } catch (error) {
      if (/UNIQUE constraint failed: daily_marks\.key/.test(String(error?.message ?? ''))) return false;
      throw error;
    }
  }

  /** Bounded, like every other cleanup: a large backlog drains over several sweeps. */
  async cleanupNonces(now) {
    await this.db
      .prepare('DELETE FROM ad_nonces WHERE id IN (SELECT id FROM ad_nonces WHERE expires_at < ? LIMIT 200)')
      .bind(now - WALLET.nonceRetentionMs)
      .run();
  }
}

const isReplay = (error) => /UNIQUE constraint failed: ad_redemptions\.nonce_id/.test(String(error?.message ?? ''));

/** What the client sees of its own wallet: the server balance and today's ad count. */
export async function readWallet({ store, principalId, region = '*', now = Date.now(), tzOffsetMinutes = 0, config = DEFAULT_CONFIG } = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  const id = readPrincipalId(principalId);
  const account = userAccount('play', id);
  const dayKey = dayKeyOf(now, readTz(tzOffsetMinutes));
  const [balances, ads] = await Promise.all([store.ledger.balances([account]), store.adsOn(id, dayKey)]);
  const geo = readRegion(region);
  return Object.freeze({
    principalId: id,
    coins: balances.get(account) ?? 0,
    adsToday: ads.count,
    adDailyCap: config.adDailyCap,
    dayKey,
    region: geo,
    perAd: adRewardFor(geo, config),
    floorNextAt: floorWindowEnd(now, config),
  });
}

const floorWindowKey = (now, config) => Math.floor(now / config.floor.everyMs);
const floorWindowEnd = (now, config) => (floorWindowKey(now, config) + 1) * config.floor.everyMs;

async function balanceOf(store, id) {
  const account = userAccount('play', id);
  return (await store.ledger.balances([account])).get(account) ?? 0;
}

/** A grant that is refused as `duplicate` by the ledger is the "already happened" answer. */
async function postOnce(store, tx) {
  try {
    await store.ledger.post(tx);
    return true;
  } catch (error) {
    if (error?.code === 'duplicate') return false;
    throw error;
  }
}

/**
 * The daily grant on the server: one per local day, refused above the soft cap. The op key names
 * the day, so a retry is the ledger's `duplicate` and reads back as already claimed.
 */
export async function grantDaily({ store, principalId, now = Date.now(), tzOffsetMinutes = 0, config = DEFAULT_CONFIG } = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  const id = readPrincipalId(principalId);
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  const dayKey = dayKeyOf(now, readTz(tzOffsetMinutes));
  const before = await balanceOf(store, id);
  if (before >= config.softCap) return Object.freeze({ ok: false, reason: 'soft_cap', coins: before });
  const paid = await postOnce(store, grant({ principalId: id, amount: config.daily, opKey: `grant:daily:${id}:${dayKey}`, at: now, reason: 'daily grant' }));
  const coins = await balanceOf(store, id);
  return paid ? Object.freeze({ ok: true, granted: config.daily, coins }) : Object.freeze({ ok: false, reason: 'already_claimed', coins });
}

/**
 * The floor: below `floor.coins`, top up TO it, at most once per `floor.everyMs` window. The op
 * key names the window, so the cooldown is the ledger's `duplicate`, not a timestamp column.
 */
export async function applyFloor({ store, principalId, now = Date.now(), config = DEFAULT_CONFIG } = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  const id = readPrincipalId(principalId);
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  const nextAt = floorWindowEnd(now, config);
  const before = await balanceOf(store, id);
  if (before >= config.floor.coins) return Object.freeze({ ok: false, reason: 'above_floor', coins: before, nextAt });
  const amount = config.floor.coins - before;
  const paid = await postOnce(store, grant({ principalId: id, amount, opKey: `grant:floor:${id}:${floorWindowKey(now, config)}`, at: now, reason: 'floor top-up' }));
  const coins = await balanceOf(store, id);
  return paid ? Object.freeze({ ok: true, granted: amount, coins, nextAt }) : Object.freeze({ ok: false, reason: 'floor_cooldown', coins, nextAt });
}

/**
 * A drill entry: lift the floor first (the device hook does the same), then burn the entry. The
 * session id is the idempotency key, so a retried request never charges twice.
 */
export async function enterPractice({ store, principalId, sessionId, now = Date.now(), config = DEFAULT_CONFIG } = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  const id = readPrincipalId(principalId);
  requireValue(typeof sessionId === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(sessionId), 'Invalid request.');
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  await applyFloor({ store, principalId: id, now, config });
  const opKey = `burn:practice:${id}:${sessionId}`;
  let charged;
  try {
    await store.ledger.post(burn({ principalId: id, amount: config.practiceEntry, opKey, at: now, reason: 'drill entry' }));
    charged = true;
  } catch (error) {
    if (error?.code === 'duplicate') charged = false;
    else if (error?.code === 'overdraft') return Object.freeze({ ok: false, reason: 'insufficient', coins: await balanceOf(store, id) });
    else throw error;
  }
  return Object.freeze({ ok: true, spent: charged ? config.practiceEntry : 0, replayed: !charged, coins: await balanceOf(store, id) });
}

/** The free recap, once per local day. No coins move; the daily mark's primary key is the guard. */
export async function enterRecap({ store, principalId, now = Date.now(), tzOffsetMinutes = 0 } = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  const id = readPrincipalId(principalId);
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  const dayKey = dayKeyOf(now, readTz(tzOffsetMinutes));
  const first = await store.markOnce({ key: `recap:${id}:${dayKey}`, principalId: id, kind: 'recap', at: now });
  const coins = await balanceOf(store, id);
  return first ? Object.freeze({ ok: true, coins }) : Object.freeze({ ok: false, reason: 'recap_played', coins });
}

/**
 * Issue a nonce before the ad plays. Refuses when the cap or the cooldown says so, which is the
 * moment to refuse: a client that is told "no" before the ad wastes nobody's inventory.
 */
export async function issueAdNonce({
  store,
  principalId,
  placement,
  region = '*',
  now = Date.now(),
  tzOffsetMinutes = 0,
  config = DEFAULT_CONFIG,
  newId = () => crypto.randomUUID().replaceAll('-', ''),
} = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  const id = readPrincipalId(principalId);
  const where = readPlacement(placement);
  const geo = readRegion(region);
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');
  await store.touchPrincipal(id, now);

  const dayKey = dayKeyOf(now, readTz(tzOffsetMinutes));
  const ads = await store.adsOn(id, dayKey);
  if (ads.count >= config.adDailyCap) {
    return Object.freeze({ ok: false, reason: 'daily_cap', adsToday: ads.count, adDailyCap: config.adDailyCap });
  }
  const last = await store.lastRedemptionAt(id);
  if (last !== null && now - last < config.adCooldownMs) {
    return Object.freeze({ ok: false, reason: 'cooldown', retryAt: last + config.adCooldownMs });
  }

  const reward = adRewardFor(geo, config);
  const nonce = issueNonce({ id: newId(), principalId: id, placement: where, at: now });
  await store.insertNonce(nonce, { region: geo, reward });
  return Object.freeze({
    ok: true,
    nonce: { id: nonce.id, placement: where, expiresAt: nonce.expiresAt, minMs: nonce.minMs },
    reward,
    region: geo,
    ttlMs: NONCE_TTL_MS,
  });
}

/**
 * The client says the ad finished. The pure check decides whether that claim is even possible;
 * the two constraints decide whether it has already been paid. Every refusal is a reason from the
 * fixed vocabulary in `lib/ads/nonce.mjs`, so a log of them can be counted.
 */
export async function redeemAdNonce({
  store,
  principalId,
  nonceId,
  placement,
  now = Date.now(),
  tzOffsetMinutes = 0,
} = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  const id = readPrincipalId(principalId);
  const where = readPlacement(placement);
  requireValue(typeof nonceId === 'string' && nonceId.length >= 16 && nonceId.length <= 128, 'Invalid request.');
  requireValue(Number.isSafeInteger(now) && now > 0, 'Invalid request.');

  const found = await store.readNonce(nonceId);
  const check = redeemNonce(found?.nonce ?? null, { principalId: id, placement: where, at: now });
  // A nonce already marked redeemed is the replay path below, not a refusal: the client may be
  // retrying a call whose answer it never saw, and the honest answer is "paid, here is the balance".
  if (!check.ok && check.reason !== 'already_redeemed') {
    return Object.freeze({ ok: false, reason: check.reason });
  }

  const account = userAccount('play', id);
  const tx = grant({
    principalId: id,
    amount: found.reward,
    opKey: `grant:ad:${id}:${nonceId}`,
    at: now,
    reason: `rewarded ad · ${where} · ${found.region}`,
  });
  const dayKey = dayKeyOf(found.nonce.issuedAt, readTz(tzOffsetMinutes));

  let replayed = false;
  try {
    await store.recordRedemption({ nonceId, principalId: id, dayKey, amount: found.reward, at: now });
  } catch (error) {
    if (!isReplay(error)) throw error;
    replayed = true;
  }
  // Post the grant whether or not the redemption row was new: if a previous call recorded the
  // redemption and died before this line, this is the retry that pays it. The ledger's own
  // `duplicate` is what makes a paid grant a no-op.
  let paid = false;
  try {
    await store.ledger.post(tx);
    paid = true;
  } catch (error) {
    if (error?.code !== 'duplicate') throw error;
  }
  const balances = await store.ledger.balances([account]);
  return Object.freeze({
    ok: true,
    granted: paid ? found.reward : 0,
    replayed: replayed && !paid,
    adId: nonceAdId(found.nonce),
    coins: balances.get(account) ?? 0,
  });
}

/** For the sweep: expired nonces are noise, redemptions are evidence and are kept. */
export async function cleanupWallet({ store, now = Date.now() } = {}) {
  requireValue(store instanceof D1WalletStore, 'The wallet service is unavailable.', 503, 'service_unavailable');
  await store.cleanupNonces(now);
}

export { GameError };
