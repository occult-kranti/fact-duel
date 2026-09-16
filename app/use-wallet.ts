'use client';
/**
 * useWallet() — the device wallet as React state, and the context that hands it to the screens.
 *
 * WHY A HOOK OF ITS OWN. The wallet is deliberately not part of `usePlayer`: it lives in its own
 * IndexedDB database (lib/wallet-store.mjs) because server-held value must never enter the profile
 * blob. This hook is the only place the clock, the locale and the ad provider are read; everything
 * it does to the wallet is a pure step from lib/economy/economy.mjs with `at` passed in, queued so
 * two taps can never interleave a read and a write.
 *
 * What it does on mount, in this order, before any ad is offered (the gamification lane's
 * reciprocity rule): the floor lifts a broke wallet, then the daily grant lands, once per local day.
 * Both are identity when nothing is owed, so a same-day revisit writes nothing. On focus the same
 * visit step runs again, so a tab left open across midnight still gets its day.
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
import { floorDueAt, regionOf, transactWallet, visitStep } from '@/lib/wallet-store.mjs';

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

/** What every wallet action resolves with: the reducer's verdict, in the reducer's words. */
export type Outcome = {
  ok: boolean;
  /** 'ad' | 'ad_double' | 'daily' | 'floor' | 'practice' | 'recap' on success; the refusal name otherwise. */
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
  show(request: { placement: Placement }): Promise<{
    completed: boolean;
    reason: string;
    receipt: { adId: string; placement: string; at: number; region: string } | null;
  }>;
};

export type WalletApi = {
  wallet: Wallet;
  /** The first read has landed (or failed over to memory); until then the chip stays quiet. */
  loaded: boolean;
  persistent: boolean;
  region: string;
  tzOffset: number;
  config: typeof DEFAULT_CONFIG;
  affordability: Affordability;
  /** The daily grant is still owed today (computed against the local day at render). */
  canClaimDaily: boolean;
  /** Epoch ms when the floor next lifts this wallet; 0 when it is not below the floor. */
  floorDueAt: number;
  /** A double-coin ad is owed right now (three staked losses, once per local day). */
  doubleOwed: boolean;
  /** Today's free "Yesterday" recap has not been entered yet (computed against the local day). */
  recapFree: boolean;
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
    [stamp, setStamp] = useState(0);
  // Read once, on the client. The server render sees '*' and offset 0; nothing money-shaped is
  // rendered until `loaded`, which only ever flips in the browser, so the two never disagree on screen.
  const [region] = useState(deviceRegion);
  const [tzOffset] = useState(() => new Date().getTimezoneOffset());
  const provider = useMemo<AdProvider>(() => new WebAdProvider({ region }) as AdProvider, [region]);

  const current = useRef<Wallet>(wallet),
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

  /**
   * Run one pure step against the stored wallet, serialised behind every earlier step. The step
   * returns the reducer's whole verdict; only its wallet goes to the store, and only if it is a
   * different object. When storage has failed the same step runs on the in-memory wallet.
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

  // Load: the visit step IS the first read (floor, then daily), so a new player can play at once.
  useEffect(() => {
    live.current = true;
    void visit().finally(() => {
      if (live.current) setLoaded(true);
    });
    const refresh = () => {
      if (Date.now() - lastVisit.current >= VISIT_THROTTLE_MS) void visit();
      else if (storage.current) void transactWallet<Wallet>(null).then(accept).catch(() => {});
    };
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('fact-duel-wallet');
      channel.current.onmessage = () => {
        if (storage.current) void transactWallet<Wallet>(null).then(accept).catch(() => {});
      };
    }
    window.addEventListener('focus', refresh);
    return () => {
      live.current = false;
      channel.current?.close();
      channel.current = null;
      window.removeEventListener('focus', refresh);
    };
  }, [visit, accept]);

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

  const claimDaily = useCallback(() => {
    const at = Date.now();
    return apply((w) => outcomeOf(claimDailyReducer(w, { at, tzOffsetMinutes: tzOffset }, config)));
  }, [apply, tzOffset, config]);

  const claimFloor = useCallback(() => {
    const at = Date.now();
    return apply((w) => outcomeOf(applyFloor(w, { at }, config)));
  }, [apply, config]);

  // A money-shaped request is when the floor fires (economy.mjs): lift first, then charge, so a
  // refused entry still leaves the floor's grant in the wallet.
  const enterPractice = useCallback(() => {
    const at = Date.now();
    return apply((w) => outcomeOf(enterPracticeReducer(applyFloor(w, { at }, config).wallet, config)));
  }, [apply, config]);

  // The recap is the free path: no floor, no charge, only the day stamp. A refusal is the screen's
  // cue to offer the ordinary practice entry, priced and labelled, never a silent charge.
  const enterRecap = useCallback(() => {
    const at = Date.now();
    return apply((w) => outcomeOf(enterRecapReducer(w, { at, tzOffsetMinutes: tzOffset })));
  }, [apply, tzOffset]);

  /**
   * Ask the provider for an ad, and pay the receipt exactly once. A refusal comes back as an
   * outcome whose `reason` is the provider's word ('unavailable' | 'skipped' | 'failed' | …) so the
   * card can say it plainly; the wallet is untouched. `at` is the receipt's stamp, never the clock.
   */
  const watchAd = useCallback(
    async (placement: Placement): Promise<Outcome> => {
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
    [apply, provider, region, tzOffset, config],
  );

  // The derived view, against the clock as of the last change (`stamp`), never the render's.
  return useMemo<WalletApi>(() => {
    const now = stamp;
    return {
      wallet,
      loaded,
      persistent,
      region,
      tzOffset,
      config,
      affordability: affordability(wallet, { region }, config),
      canClaimDaily: wallet.lastDailyKey !== dayKeyOf(now, tzOffset) && wallet.coins < config.softCap,
      floorDueAt: floorDueAt(wallet, config),
      doubleOwed: doubleAdAvailable(wallet, { at: now, tzOffsetMinutes: tzOffset }, config),
      recapFree: recapFreeToday(wallet, { at: now, tzOffsetMinutes: tzOffset }),
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
    stamp,
    loaded,
    persistent,
    region,
    tzOffset,
    config,
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
