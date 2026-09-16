/**
 * The pure parts of useWallet(), tested without a DOM.
 *
 * The React hook (app/use-wallet.ts) owns only wiring: state, a queue, the clock and the locale.
 * Every decision it makes lives in a module a node test can reach — the visit step and the floor's
 * next time (lib/wallet-store.mjs), the region placeholder, and the web ad provider that is the
 * null provider until a host page installs `window.__fdAds`. Those are what this file checks,
 * end to end into the economy reducer where a receipt is involved.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { floorDueAt, regionOf, visitStep } from '../lib/wallet-store.mjs';
import { WebAdProvider } from '../lib/ads/web-provider.mjs';
import { NullAdProvider, assertProvider, validReceipt } from '../lib/ads/provider.mjs';
import { DEFAULT_CONFIG, emptyWallet, earnFromAd, affordability } from '../lib/economy/economy.mjs';

const cfg = DEFAULT_CONFIG;
const T0 = Date.parse('2026-09-16T10:00:00Z');
const HOUR = 3_600_000;

/* ------------------------------------------------------------------ region placeholder */

test('the region placeholder reads the locale subtag and falls to the wildcard otherwise', () => {
  assert.equal(regionOf('en-IN'), 'IN');
  assert.equal(regionOf('pt-BR'), 'BR');
  assert.equal(regionOf('zh-Hant-TW'), 'TW', 'a script subtag is skipped');
  assert.equal(regionOf('de_DE'), 'DE', 'underscore locales too');
  assert.equal(regionOf('en'), '*');
  assert.equal(regionOf('es-419'), '*', 'a UN M.49 area is not a country');
  assert.equal(regionOf(undefined), '*');
  assert.equal(regionOf(''), '*');
  assert.equal(affordability(emptyWallet(), { region: regionOf('en-GB') }, cfg).perAd, cfg.adReward.GB);
});

/* ------------------------------------------------------------------ visit step and the floor */

test('a visit floors then grants, in that order, and is identity once both are done', () => {
  const step = visitStep({ at: T0, tzOffsetMinutes: -330 }, cfg);
  const w = step(emptyWallet());
  assert.equal(w.coins, cfg.floor.coins + cfg.daily);
  assert.equal(w.lastDailyKey, '2026-09-16', 'India at 15:30 local is still the 16th');
  assert.equal(step(w), w, 'nothing owed, same object');

  // A wallet above the floor gets only the daily; one above the soft cap gets nothing at all.
  const rich = Object.freeze({ ...emptyWallet(), coins: 100 });
  assert.equal(step(rich).coins, 100 + cfg.daily);
  const capped = Object.freeze({ ...emptyWallet(), coins: cfg.softCap });
  assert.equal(step(capped).coins, cfg.softCap, 'the daily and the floor pause at the soft cap');
  assert.equal(step(capped).lastDailyKey, '', 'and nothing was claimed');
});

test('the floor’s next time is honest: never counting down to nothing', () => {
  assert.equal(floorDueAt(Object.freeze({ ...emptyWallet(), coins: cfg.floor.coins }), cfg), 0);
  assert.equal(floorDueAt(Object.freeze({ ...emptyWallet(), coins: 5 }), cfg), 1, 'never floored: due now');
  const floored = Object.freeze({ ...emptyWallet(), coins: 3, lastFloorAt: T0 });
  assert.equal(floorDueAt(floored, cfg), T0 + cfg.floor.everyMs);
  assert.ok(floorDueAt(floored, cfg) > T0 + 5 * HOUR);
});

/* ------------------------------------------------------------------ the web provider */

const withHook = async (hook, fn) => {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const previous = globalThis.window;
  globalThis.window = { __fdAds: hook };
  try {
    return await fn();
  } finally {
    if (had) globalThis.window = previous;
    else delete globalThis.window;
  }
};

test('with no host hook the web provider is the null provider, word for word', async () => {
  const p = assertProvider(new WebAdProvider({ region: 'US', now: () => T0 }));
  const nil = new NullAdProvider();
  assert.equal(p.serverVerified, false);
  assert.equal(await p.available(), await nil.available());
  assert.deepEqual(await p.show({ placement: 'coins' }), await nil.show({ placement: 'coins' }));
});

test('a host hook’s completion becomes a receipt the economy pays exactly once', async () => {
  let t = T0;
  const p = new WebAdProvider({ region: 'GB', now: () => (t += 60_000) });
  await withHook(
    {
      available: () => true,
      show: async ({ placement }) => ({ completed: true, adId: `gpt-${placement}-1` }),
    },
    async () => {
      assert.equal(await p.available(), true);
      const out = await p.show({ placement: 'practice-entry' });
      assert.equal(out.completed, true);
      assert.ok(validReceipt(out.receipt));
      assert.equal(out.receipt.adId, 'gpt-practice-entry-1');
      assert.equal(out.receipt.region, 'GB');
      assert.equal(out.receipt.at, T0 + 60_000, 'stamped by the injected clock, not the host');

      const paid = earnFromAd(
        emptyWallet(),
        { adId: out.receipt.adId, region: out.receipt.region, at: out.receipt.at },
        cfg,
      );
      assert.equal(paid.granted, cfg.adReward.GB);
      const again = earnFromAd(paid.wallet, { adId: out.receipt.adId, region: 'GB', at: out.receipt.at + HOUR }, cfg);
      assert.equal(again.reason, 'already_paid');
    },
  );
});

test('a host that skips, throws, lies or is asked for an unknown placement pays nothing', async () => {
  const p = new WebAdProvider({ region: 'US', now: () => T0 });
  await withHook({ show: async () => ({ completed: false, reason: 'skipped' }) }, async () => {
    assert.equal(await p.available(), true, 'a hook without available() is assumed ready');
    assert.equal((await p.show({ placement: 'coins' })).reason, 'skipped');
  });
  await withHook({ available: () => true, show: async () => ({ completed: false }) }, async () => {
    assert.equal((await p.show({ placement: 'coins' })).reason, 'skipped', 'no reason given reads as a skip');
  });
  await withHook(
    {
      available: () => {
        throw new Error('no network');
      },
      show: async () => {
        throw new Error('no network');
      },
    },
    async () => {
      assert.equal(await p.available(), false);
      assert.equal((await p.show({ placement: 'coins' })).reason, 'failed');
    },
  );
  await withHook({ show: async () => 'yes' }, async () => {
    assert.equal((await p.show({ placement: 'coins' })).reason, 'failed', 'a non-object answer is a failure');
  });
  await withHook({ show: async () => ({ completed: true }) }, async () => {
    assert.equal((await p.show({ placement: 'nope' })).reason, 'failed', 'placements are a closed list');
    const out = await p.show({ placement: 'coins' });
    assert.equal(out.completed, true);
    assert.ok(validReceipt(out.receipt), 'a host that returns no id still gets a per-session one');
    assert.match(out.receipt.adId, /^web-1-/);
  });
  await withHook({ available: () => true }, async () => {
    assert.equal(await p.available(), false, 'a hook with no show() is no hook');
    assert.equal((await p.show({ placement: 'coins' })).reason, 'unavailable');
  });
});
