'use client';
/**
 * useWallet() — the coin wallet as React state, and the context that hands it to the screens.
 *
 * WHY A HOOK OF ITS OWN. The wallet is deliberately not part of `usePlayer`: it lives in its own
 * IndexedDB database (lib/wallet-store.mjs) because server-held value must never enter the profile
 * blob. This hook is the only place the clock, the locale, the ad provider and the wallet server
 * are read; everything it does to the device wallet is a pure step from lib/economy/economy.mjs
 * with `at` passed in, queued so two taps can never interleave a read and a write.
 *
 * TWO MODES, ONE BALANCE. The hook starts in 'device' mode — the IndexedDB wallet, exactly as
 * before — and probes `/api/wallet` once on mount (lib/wallet-client.ts). When a server wallet
 * answers, the hook switches to 'server' mode: the coins and today's ad count on screen are the
 * server's, affordability is computed from that balance with the same config, and the ad flow
 * becomes issue-nonce → show → redeem-nonce, so the server, not the browser, mints the coins. The
 * device wallet is neither shown nor merged in server mode; a screen sees one balance, whichever
 * mode it is. The static build's client twin never answers the probe, so it stays in device mode.
 *
 * What the server cannot do yet is said plainly, never faked: it has no endpoint for the daily
 * grant, the floor, a practice entry or the free recap, so in server mode those actions resolve
 * with `reason: 'not_on_server'` and the card says they arrive with the next server release.
 * The exact endpoints are requested in scratchpad/requests/wallet-client.md.
 *
 * In device mode, on mount and in this order, before any ad is offered (the gamification lane's
 * reciprocity rule): the floor lifts a broke wallet, then the daily grant lands, once per local
 * day. Both are identity when nothing is owed, so a same-day revisit writes nothing. On focus the
 * same visit step runs again, so a tab left open across midnight still gets its day.
 *
 * Storage is honest, not required: when IndexedDB is unavailable the reducer runs on an in-memory
 * wallet for this visit and `persistent` is false, so the free path (floor + daily) still works.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_CONFIG,
  affordability,
  applyFloor,
  claimDaily as claimDailyReducer,
  dayKeyOf,
  doubleAdAvailable,
  earnFromAd,
  emptyWallet,
  enterPractice as enterPracticeReducer,
  enterRecap as enterRecapReducer,
  recapFreeToday,
} from '@/lib/economy/economy.mjs';
import { validReceipt } from '@/lib/ads/provider.mjs';
import { WebAdProvider } from '@/lib/ads/web-provider.mjs';
import { floorDueAt, regionOf, serverWalletView, transactWallet, visitStep } from '@/lib/wallet-store.mjs';
import { createWalletClient, type ServerOutcome, type ServerWallet, type WalletClient, type WalletMode } from '@/lib/wallet-client';

/** The reducer's wallet shape (economy.mjs `emptyWallet`), widened from its literal defaults. */
export type Wallet = Readonly<{
  coins: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  adsToday: number;
  dayKey: string;
  lastAdAt: number;
  lastDailyKey: string;
  lastFloorAt: number;
  questToday: number;
  lossStreak: number;
  lastDoubleKey: string;
  /** The local day the free recap was last entered ('' when never). */
  recapKey: string;
  adIds: readonly string[];
}>;
export type Affordability = ReturnType<typeof affordability>;
export type Placement = 'coins' | 'practice-entry' | 'duel-entry' | 'continue';
export type { WalletMode };

/** What every wallet action resolves with: the reducer's verdict, in the reducer's words. */
export type Outcome = {
  ok: boolean;
  /**
   * 'ad' | 'ad_double' | 'daily' | 'floor' | 'practice' | 'recap' on success; the refusal name
   * otherwise. Server mode adds 'pending' (the reward is owed and will be paid when the connection
   * returns) and 'not_on_server' (the server has no endpoint for that grant or entry yet).
   */
  reason: string;
  granted: number;
  spent: number;
  wallet: Wallet;
};

/** The provider contract the hook relies on (lib/ads/provider.mjs, typed for the screens). */
export type AdProvider = {
  name: string;
  serverVerified: boolean;
  available(): Promise<boolean>;
  show(request: { placement: Placement; nonceId?: string }): Promise<{
    completed: boolean;
    reason: string;
    receipt: { adId: string; placement: string; at: number; region: string } | null;
  }>;
};

export type WalletApi = {
  wallet: Wallet;
  /** The first read has landed (or failed over to memory) and the server probe has answered. */
  loaded: boolean;
  persistent: boolean;
  /** 'device': the IndexedDB wallet. 'server': the balance `/api/wallet` keeps for this principal. */
  mode: WalletMode;
  /** The guest id this device presents to the server (the same one the auth client uses). */
  principalId: string;
  region: string;
  tzOffset: number;
  config: typeof DEFAULT_CONFIG;
  affordability: Affordability;
  /** The daily grant is still owed today (computed against the local day at render). Never in server mode. */
  canClaimDaily: boolean;
  /** Epoch ms when the floor next lifts this wallet; 0 when it is not below the floor, or in server mode. */
  floorDueAt: number;
  /** A double-coin ad is owed right now (three staked losses, once per local day). Never in server mode. */
  doubleOwed: boolean;
  /** Today's free "Yesterday" recap has not been entered yet (computed against the local day). Never in server mode. */
  recapFree: boolean;
  /** An ad played but its reward has not reached the server yet; it is retried here and on the next mount. */
  pendingReward: boolean;
  /** The last outcome that happened without a tap (a pending reward settling on mount), for the card to say. */
  notice: Outcome | null;
  /** null until the provider has answered; false in a build with no ads. */
  adsAvailable: boolean | null;
  provider: AdProvider;
  claimDaily: () => Promise<Outcome>;
  claimFloor: () => Promise<Outcome>;
  enterPractice: () => Promise<Outcome>;
  /** The free recap entry: ok once per local day, refused with 'recap_played' after that. Never charges. */
  enterRecap: () => Promise<Outcome>;
  watchAd: (placement: Placement) => Promise<Outcome>;
  refreshAds: () => Promise<boolean>;
};

type Step = (wallet: Wallet) => Outcome;

const VISIT_THROTTLE_MS = 60_000;

/** The reducer's frozen result, read back as the typed outcome the screens consume. */
const outcomeOf = (result: unknown): Outcome => result as Outcome;

/** Placeholder region (see regionOf): the locale's region subtag, never the location. */
function deviceRegion() {
  return typeof navigator !== 'undefined' ? regionOf(navigator.language) : '*';
}


export function useWallet(config = DEFAULT_CONFIG): WalletApi {
  const [wallet, setWallet] = useState<Wallet>(() => emptyWallet()),
    [loaded, setLoaded] = useState(false),
    [persistent, setPersistent] = useState(true),
    [adsAvailable, setAdsAvailable] = useState<boolean | null>(null),
    // The clock, as of the last wallet change. Read there, not in render (a render must be pure),
    // and enough for the day-keyed flags: the day cannot roll without a visit changing the wallet.
    [stamp, setStamp] = useState(0),
    [mode, setMode] = useState<WalletMode>('device'),
    [server, setServer] = useState<ServerWallet | null>(null),
    // The region the server priced the last nonce for: its word beats the locale placeholder.
    [serverRegion, setServerRegion] = useState<string | null>(null),
    // Server-mode day flags, learned from replies: null until the server has said.
    [serverDailyKey, setServerDailyKey] = useState<string | null>(null),
    [serverFloorNextAt, setServerFloorNextAt] = useState<number | null>(null),
    [serverRecapKey, setServerRecapKey] = useState<string | null>(null),
    [pendingReward, setPendingReward] = useState(false),
    [notice, setNotice] = useState<Outcome | null>(null);
  // Read once, on the client. The server render sees '*' and offset 0; nothing money-shaped is
  // rendered until `loaded`, which only ever flips in the browser, so the two never disagree on screen.
  const [region] = useState(deviceRegion);
  const [tzOffset] = useState(() => new Date().getTimezoneOffset());
  const [client] = useState<WalletClient>(() => createWalletClient({ tzOffsetMinutes: tzOffset }));
  const provider = useMemo<AdProvider>(() => new WebAdProvider({ region }) as AdProvider, [region]);

  const current = useRef<Wallet>(wallet),
    serverRef = useRef<ServerWallet | null>(null),
    modeRef = useRef<WalletMode>('device'),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    storage = useRef(true),
    live = useRef(true),
    channel = useRef<BroadcastChannel | null>(null),
    lastVisit = useRef(0);

  const accept = useCallback((value: Wallet) => {
    if (!live.current) return;
    current.current = value;
    setWallet(value);
    setStamp(Date.now());
  }, []);

  /** The server's balance as of a reply; the view the screens read in server mode. */
  const acceptServer = useCallback((value: ServerWallet) => {
    if (!live.current) return;
    serverRef.current = value;
    modeRef.current = 'server';
    setServer(value);
    setMode('server');
    setStamp(Date.now());
  }, []);

  /** What the screens read in server mode: the same shape, the server's numbers. */
  const serverView = useCallback((): Wallet => serverWalletView(serverRef.current) as Wallet, []);

  /**
   * Run one pure step against the stored device wallet, serialised behind every earlier step. The
   * step returns the reducer's whole verdict; only its wallet goes to the store, and only if it is
   * a different object. When storage has failed the same step runs on the in-memory wallet.
   */
  const apply = useCallback(
    (step: Step): Promise<Outcome> => {
      const run = queue.current.then(async () => {
        let outcome: Outcome | undefined;
        if (storage.current) {
          try {
            await transactWallet<Wallet>((before) => {
              outcome = step(before);
              return outcome.wallet;
            });
          } catch {
            storage.current = false;
            setPersistent(false);
            outcome = undefined;
          }
        }
        if (!outcome) outcome = step(current.current);
        accept(outcome.wallet);
        channel.current?.postMessage('updated');
        return outcome;
      });
      queue.current = run.catch(() => {});
      return run;
    },
    [accept],
  );

  const visit = useCallback(() => {
    lastVisit.current = Date.now();
    const at = Date.now();
    return apply((w) => ({
      ok: true,
      reason: 'visit',
      granted: 0,
      spent: 0,
      wallet: visitStep({ at, tzOffsetMinutes: tzOffset }, config)(w) as Wallet,
    }));
  }, [apply, tzOffset, config]);

  /** Re-read the server balance; a failed read keeps the last one rather than falling back. */
  const syncServer = useCallback(async () => {
    const reply = await client.readWallet();
    if (reply) acceptServer(reply);
  }, [client, acceptServer]);

  /**
   * The redeem reply as an outcome, applied to the server view. A replay is success with nothing
   * new granted; a 'pending' refusal leaves the nonce in storage and flags it on the card.
   */
  const settleRedeem = useCallback(
    (reply: Awaited<ReturnType<WalletClient['redeemNonce']>>): Outcome => {
      if (reply.ok) {
        const before = serverRef.current;
        acceptServer({
          principalId: before?.principalId ?? client.principalId,
          coins: reply.coins,
          adsToday: (before?.adsToday ?? 0) + (reply.replayed ? 0 : 1),
          adDailyCap: before?.adDailyCap ?? config.adDailyCap,
          dayKey: before?.dayKey ?? '',
        });
        setPendingReward(false);
        return { ok: true, reason: 'ad', granted: reply.granted, spent: 0, wallet: serverView() };
      }
      setPendingReward(reply.reason === 'pending');
      return { ok: false, reason: reply.reason, granted: 0, spent: 0, wallet: serverView() };
    },
    [acceptServer, client, config.adDailyCap, serverView],
  );

  // Load: the device visit step IS the first read (floor, then daily), so a new player can play at
  // once; the server probe runs alongside it and, when a wallet answers, takes over the screen.
  // `loaded` waits for both, so the chip never shows a device balance that a server is about to
  // replace. A reward left pending by an earlier visit is retried once the server is confirmed.
  useEffect(() => {
    live.current = true;
    const device = visit();
    const probe = client.probe().then(async (reply) => {
      if (!live.current || !reply) return;
      acceptServer(reply);
      if (!client.pending()) return;
      setPendingReward(true);
      const settled = await client.settlePending();
      if (settled && live.current) setNotice(settleRedeem(settled));
    });
    void Promise.allSettled([device, probe]).then(() => {
      if (live.current) setLoaded(true);
    });
    const refresh = () => {
      if (modeRef.current === 'server') {
        void syncServer();
        return;
      }
      if (Date.now() - lastVisit.current >= VISIT_THROTTLE_MS) void visit();
      else if (storage.current) void transactWallet<Wallet>(null).then(accept).catch(() => {});
    };
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('fact-duel-wallet');
      channel.current.onmessage = () => {
        if (modeRef.current === 'server') void syncServer();
        else if (storage.current) void transactWallet<Wallet>(null).then(accept).catch(() => {});
      };
    }
    window.addEventListener('focus', refresh);
    return () => {
      live.current = false;
      channel.current?.close();
      channel.current = null;
      window.removeEventListener('focus', refresh);
    };
  }, [visit, accept, client, acceptServer, syncServer, settleRedeem]);

  const refreshAds = useCallback(async () => {
    let ok = false;
    try {
      ok = await provider.available();
    } catch {
      ok = false;
    }
    if (live.current) setAdsAvailable(ok);
    return ok;
  }, [provider]);

  useEffect(() => {
    void refreshAds();
  }, [refreshAds]);

  /**
   * A server grant or entry as an outcome: the reply's balance becomes the server view, the
   * server's reason is the outcome's reason, and a success carries the same word the device
   * reducer would ('daily' | 'floor' | 'practice' | 'recap') so the card reads the same.
   */
  const settleServer = useCallback(
    (reply: ServerOutcome, okReason: string): Outcome => {
      const before = serverRef.current;
      if (reply.coins >= 0 && before) acceptServer({ ...before, coins: reply.coins });
      const wallet = serverView();
      if (reply.ok) return { ok: true, reason: okReason, granted: reply.granted ?? 0, spent: reply.spent ?? 0, wallet };
      return { ok: false, reason: reply.reason ?? 'failed', granted: 0, spent: 0, wallet };
    },
    [acceptServer, serverView],
  );

  const claimDaily = useCallback(async () => {
    if (modeRef.current !== 'server') {
      const at = Date.now();
      return apply((w) => outcomeOf(claimDailyReducer(w, { at, tzOffsetMinutes: tzOffset }, config)));
    }
    const reply = await client.grantDaily();
    if (reply.ok || reply.reason === 'already_claimed') setServerDailyKey(serverRef.current?.dayKey ?? '');
    return settleServer(reply, 'daily');
  }, [apply, tzOffset, config, client, settleServer]);

  const claimFloor = useCallback(async () => {
    if (modeRef.current !== 'server') {
      const at = Date.now();
      return apply((w) => outcomeOf(applyFloor(w, { at }, config)));
    }
    const reply = await client.applyFloor();
    if (reply.nextAt) setServerFloorNextAt(reply.ok ? null : reply.nextAt);
    return settleServer(reply, 'floor');
  }, [apply, config, client, settleServer]);

  // A money-shaped request is when the floor fires (economy.mjs): lift first, then charge, so a
  // refused entry still leaves the floor's grant in the wallet. The server does the same in one
  // call; the drill session id is the idempotency key, so a retried tap never charges twice.
  const enterPractice = useCallback(async () => {
    if (modeRef.current !== 'server') {
      const at = Date.now();
      return apply((w) => outcomeOf(enterPracticeReducer(applyFloor(w, { at }, config).wallet, config)));
    }
    const sessionId = crypto.randomUUID().replaceAll('-', '');
    return settleServer(await client.enterPractice(sessionId), 'practice');
  }, [apply, config, client, settleServer]);

  // The recap is the free path: no floor, no charge, only the day stamp. A refusal is the screen's
  // cue to offer the ordinary practice entry, priced and labelled, never a silent charge.
  const enterRecap = useCallback(async () => {
    if (modeRef.current !== 'server') {
      const at = Date.now();
      return apply((w) => outcomeOf(enterRecapReducer(w, { at, tzOffsetMinutes: tzOffset })));
    }
    const reply = await client.enterRecap();
    if (reply.ok || reply.reason === 'recap_played') setServerRecapKey(serverRef.current?.dayKey ?? '');
    return settleServer(reply, 'recap');
  }, [apply, tzOffset, client, settleServer]);

  /**
   * Server mode: the server agrees to the ad first (a refusal here costs nobody any inventory and
   * reads exactly as the device wallet's would: 'daily_cap', 'cooldown'), the provider shows it,
   * and the completion is reported against the nonce. The server's reply is the balance.
   */
  const watchAdOnServer = useCallback(
    async (placement: Placement): Promise<Outcome> => {
      const issued = await client.issueNonce(placement);
      if (!issued.ok) return { ok: false, reason: issued.reason, granted: 0, spent: 0, wallet: serverView() };
      if (live.current) setServerRegion(issued.region);
      let shown: Awaited<ReturnType<AdProvider['show']>>;
      try {
        shown = await provider.show({ placement, nonceId: issued.nonce.id });
      } catch {
        shown = { completed: false, reason: 'failed', receipt: null };
      }
      if (!shown.completed)
        return { ok: false, reason: shown.reason || 'unavailable', granted: 0, spent: 0, wallet: serverView() };
      return settleRedeem(await client.redeemNonce(issued.nonce.id, placement));
    },
    [client, provider, serverView, settleRedeem],
  );

  /**
   * Ask the provider for an ad, and pay the receipt exactly once. A refusal comes back as an
   * outcome whose `reason` is the provider's word ('unavailable' | 'skipped' | 'failed' | …) so the
   * card can say it plainly; the wallet is untouched. `at` is the receipt's stamp, never the clock.
   */
  const watchAd = useCallback(
    async (placement: Placement): Promise<Outcome> => {
      if (modeRef.current === 'server') return watchAdOnServer(placement);
      let shown: Awaited<ReturnType<AdProvider['show']>>;
      try {
        shown = await provider.show({ placement });
      } catch {
        shown = { completed: false, reason: 'failed', receipt: null };
      }
      const receipt = shown.receipt;
      if (!shown.completed || !validReceipt(receipt) || !receipt)
        return { ok: false, reason: shown.reason || 'unavailable', granted: 0, spent: 0, wallet: current.current };
      return apply((w) =>
        outcomeOf(
          earnFromAd(
            w,
            {
              adId: receipt.adId,
              region,
              at: receipt.at,
              tzOffsetMinutes: tzOffset,
              double: doubleAdAvailable(w, { at: receipt.at, tzOffsetMinutes: tzOffset }, config),
            },
            config,
          ),
        ),
      );
    },
    [apply, provider, region, tzOffset, config, watchAdOnServer],
  );

  // The derived view, against the clock as of the last change (`stamp`), never the render's.
  return useMemo<WalletApi>(() => {
    const now = stamp;
    const onServer = mode === 'server';
    const shown = onServer ? (serverWalletView(server) as Wallet) : wallet;
    const priced = onServer ? (serverRegion ?? server?.region ?? region) : region;
    const serverDay = server?.dayKey ?? '';
    // Floor on the server: nothing to do above the floor; below it, ready now unless the last reply
    // named the next window; the server's own window end is the fallback when it said one.
    const serverFloorDue = !onServer
      ? 0
      : shown.coins >= config.floor.coins
        ? 0
        : serverFloorNextAt && serverFloorNextAt > now
          ? serverFloorNextAt
          : now;
    return {
      wallet: shown,
      loaded,
      persistent,
      mode,
      principalId: client.principalId,
      region: priced,
      tzOffset,
      config,
      affordability: affordability(shown, { region: priced }, config),
      canClaimDaily: onServer
        ? serverDailyKey !== serverDay && shown.coins < config.softCap
        : shown.lastDailyKey !== dayKeyOf(now, tzOffset) && shown.coins < config.softCap,
      floorDueAt: onServer ? serverFloorDue : floorDueAt(shown, config),
      doubleOwed: !onServer && doubleAdAvailable(shown, { at: now, tzOffsetMinutes: tzOffset }, config),
      recapFree: onServer ? serverRecapKey !== serverDay : recapFreeToday(shown, { at: now, tzOffsetMinutes: tzOffset }),
      pendingReward,
      notice,
      adsAvailable,
      provider,
      claimDaily,
      claimFloor,
      enterPractice,
      enterRecap,
      watchAd,
      refreshAds,
    };
  }, [
    wallet,
    server,
    serverRegion,
    serverDailyKey,
    serverFloorNextAt,
    serverRecapKey,
    mode,
    client,
    stamp,
    loaded,
    persistent,
    region,
    tzOffset,
    config,
    pendingReward,
    notice,
    adsAvailable,
    provider,
    claimDaily,
    claimFloor,
    enterPractice,
    enterRecap,
    watchAd,
    refreshAds,
  ]);
}

/**
 * The wallet travels by context so screens that already exist (Discovery, the top bar) can reach
 * it without every wrapper between arena.tsx and them learning a new prop. `null` means no wallet
 * is provided on this mount — a screen then behaves as it did before the economy (no gate).
 */
export const WalletContext = createContext<WalletApi | null>(null);

export function useWalletContext(): WalletApi | null {
  return useContext(WalletContext);
}
