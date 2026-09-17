'use client';
/**
 * AdCard — the priced ad card: a top-up the player may choose, never a toll.
 *
 * The rules it implements are the gamification lane's core-loop findings (docs/money/ads/
 * lane-gamification.json, "(4) CORE LOOP"), each one visible on the card: the ad is priced and
 * labelled BEFORE the tap, in coins, from `affordability.perAd` (a); the free alternatives sit on
 * the same card — the daily grant, the floor with its real next time, winning a duel (a, d, h);
 * the daily cap is printed so it never reads as a hidden rule (f); a completed ad is reported as
 * "now that" — a top-up you chose — never "if you watch, then" (e); an ad that did not play is
 * not the player's fault and charges nothing, and the free paths are still right there (j); the
 * decline is a neutral "Not now" (N5, no confirmshaming). When the build has no ad provider the
 * card says so plainly and never pretends one played (provider.mjs's NullAdProvider contract).
 *
 * Server mode (wallet.mode === 'server', app/use-wallet.ts): the balance is the server's and the
 * ad is paid by it against a nonce. What the server cannot do yet — the daily grant, the floor, a
 * drill entry — is printed as exactly that, "arrives with the next server release", never as a
 * grant that quietly did not land. A reward the server has not confirmed yet is "pending", with
 * the same words the wallet uses when it retries.
 *
 * Vocabulary (decision.md §3): coins, entry, prize paid by the house — and none of the words the
 * decision rules out, in copy or in source.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Coins, Gift, LifeBuoy, Play, Swords } from 'lucide-react';
import { useJuice, useReducedMotion } from '@/components/fx';
import { usePress } from '../vault/press';
import type { Outcome, Placement, WalletApi } from '../../use-wallet';
import './economy.css';

export type AdCardProps = {
  wallet: WalletApi;
  /** Where the ad is being asked for. Only 'coins' and 'practice-entry' are offered by screens. */
  placement: Placement;
  /** The neutral decline. When absent the card has no decline control (it is inline, not a sheet). */
  onClose?: () => void;
  /** Extra actions the screen wants on the card (a "Back to Play", a "Find a duel"). */
  children?: ReactNode;
};

/** "2h 10m", "14m", or "under a minute" — the floor's real next time, never a fake countdown. */
export function untilText(ms: number): string {
  if (ms < 60_000) return 'under a minute';
  const minutes = Math.ceil(ms / 60_000),
    h = Math.floor(minutes / 60),
    m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/** The provider's and the reducer's refusals, in words. Every one says nothing was charged. */
function refusalText(reason: string, cap: number): string {
  switch (reason) {
    case 'unavailable':
      return 'No ad was available just now. Nothing was charged — the free paths below still work.';
    case 'skipped':
      return 'The ad closed early, so it paid nothing. Nothing was charged.';
    case 'daily_cap':
      return `That is today's ${cap} ad boosts. The counter starts again tomorrow.`;
    case 'cooldown':
      return 'One ad at a time. Give it a moment and try again.';
    case 'already_paid':
      return 'That ad was already paid.';
    case 'already_claimed':
      return 'Today’s grant is already in your wallet.';
    case 'soft_cap':
      return 'Your wallet is full enough that the free grants pause — ads still pay.';
    case 'above_floor':
    case 'floor_cooldown':
      return 'The floor has nothing to add right now.';
    case 'too_soon':
      return 'That ad ended too quickly to count, so it paid nothing. Nothing was charged.';
    case 'expired':
      return 'That ad took too long to report back, so it paid nothing. Nothing was charged.';
    case 'pending':
      return 'Reward pending — it is paid when the connection returns.';
    case 'not_on_server':
      return 'That arrives with the next server release. The server keeps your balance, and ads pay into it now.';
    default:
      return 'That ad did not play. Nothing was charged.';
  }
}

/** What just happened, as a ledger line. Grants are "now that", never "if you had". */
function outcomeText(o: Outcome, cap: number): { text: string; tone: 'good' | 'plain' } {
  if (!o.ok) return { text: refusalText(o.reason, cap), tone: 'plain' };
  switch (o.reason) {
    case 'ad_double':
      return { text: `+${o.granted} coins added — the double you were owed, now that the ad is done.`, tone: 'good' };
    case 'ad':
      return { text: `+${o.granted} coins added, now that the ad is done.`, tone: 'good' };
    case 'daily':
      return { text: `+${o.granted} coins — today’s grant.`, tone: 'good' };
    case 'floor':
      return { text: `+${o.granted} coins — the floor topped you up.`, tone: 'good' };
    default:
      return { text: `+${o.granted} coins added.`, tone: 'good' };
  }
}

/** A minute clock for the floor line, ticking only while the card is on screen. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function AdCard({ wallet, placement, onClose, children }: AdCardProps) {
  const juice = useJuice();
  const press = usePress();
  const reduced = useReducedMotion();
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<Outcome | null>(null);
  const offer = useRef<HTMLButtonElement | null>(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  // A late-loading integration is picked up when the card opens, not on the next page load.
  const { refreshAds } = wallet;
  useEffect(() => {
    void refreshAds();
  }, [refreshAds]);

  const { affordability: a, config, adsAvailable, canClaimDaily, floorDueAt, doubleOwed, pendingReward } = wallet;
  const onServer = wallet.mode === 'server';
  const coins = wallet.wallet.coins;
  const perAd = doubleOwed ? a.perAd * 2 : a.perAd;
  const capReached = a.adsLeftToday === 0;
  const floorReady = floorDueAt > 0 && floorDueAt <= now;

  const run = useCallback(
    async (action: () => Promise<Outcome>, element: HTMLElement | null) => {
      if (busy) return;
      setBusy(true);
      try {
        const outcome = await action();
        if (!live.current) return;
        setLast(outcome);
        if (outcome.ok && outcome.granted > 0) {
          juice.sound('gem');
          juice.haptic('light');
          if (element) {
            juice.burst(element, 'gem');
            juice.floatText(element, `+${outcome.granted} coins`, 'var(--gold-text)');
          }
        }
      } finally {
        if (live.current) setBusy(false);
      }
    },
    [busy, juice],
  );

  // In server mode a drill entry cannot be taken yet (no endpoint), so the card says that instead
  // of pricing an entry it could not accept; the ad offer is withheld there too, since a top-up
  // would not open the drill.
  const drillOffline = onServer && placement === 'practice-entry';
  const heading = drillOffline
    ? {
        title: 'Drill entries arrive with the next server release.',
        lede: `The server keeps your balance — ${coins} coins — but it cannot take a drill entry yet. Duels and ad top-ups work now.`,
      }
    : placement === 'practice-entry'
      ? {
          title: `This drill is ${a.practice.cost} coins. You have ${coins}.`,
          lede: 'Top up the way you like, or let the free paths do it — nothing here is a condition of playing.',
        }
      : {
          title: 'Your coins',
          lede: onServer
            ? 'A top-up if you want one. Your balance is kept by the server, and every path below is optional.'
            : 'A top-up if you want one. Every path below is optional, and the free ones are real.',
        };

  const status = last ? outcomeText(last, config.adDailyCap) : wallet.notice ? outcomeText(wallet.notice, config.adDailyCap) : null;
  const laterText = 'arrives with the next server release';

  return (
    <article className="fd-adcard" data-placement={placement} data-motion={reduced ? 'reduced' : 'full'}>
      <header className="fd-adcard__head">
        <p className="fd-adcard__eyebrow">
          <Coins aria-hidden="true" />
          Coins
        </p>
        <h2>{heading.title}</h2>
        <p className="fd-adcard__lede">{heading.lede}</p>
      </header>

      <div className="fd-adcard__offer">
        {drillOffline ? null : adsAvailable === true ? (
          <button
            ref={offer}
            type="button"
            className="fd-btn fd-btn--primary fd-adcard__watch"
            disabled={busy || capReached}
            onPointerDown={press}
            onClick={() => void run(() => wallet.watchAd(placement), offer.current)}
          >
            <Play aria-hidden="true" />
            <span>Watch a short ad</span>
            <ArrowRight aria-hidden="true" />
            <b>+{perAd} coins</b>
          </button>
        ) : (
          <p className="fd-adcard__none" role="status">
            {adsAvailable === null
              ? 'Checking for ads…'
              : onServer
                ? 'No ads in this build — your balance is kept by the server, and a duel win still pays.'
                : 'No ads in this build — the daily grant and the floor still work.'}
          </p>
        )}
        <p className="fd-adcard__cap">
          Ad boosts today: <b>{wallet.wallet.adsToday}</b> of {config.adDailyCap}
          {doubleOwed && adsAvailable === true && <span className="fd-adcard__double">· double today</span>}
        </p>
        {pendingReward && (
          <p className="fd-adcard__pending" role="status">
            Reward pending — it is paid when the connection returns.
          </p>
        )}
      </div>

      <ul className="fd-adcard__alts" aria-label="Free ways to get coins">
        <li>
          <Gift aria-hidden="true" />
          <span>
            Daily {config.daily} coins ·{' '}
            {onServer ? (
              laterText
            ) : canClaimDaily ? (
              <button
                type="button"
                className="fd-adcard__link"
                disabled={busy}
                onPointerDown={press}
                onClick={(e) => void run(() => wallet.claimDaily(), e.currentTarget)}
              >
                claim today’s
              </button>
            ) : (
              'claimed today'
            )}
          </span>
        </li>
        <li>
          <LifeBuoy aria-hidden="true" />
          <span>
            Floor top-up to {config.floor.coins} coins ·{' '}
            {onServer ? (
              laterText
            ) : floorDueAt === 0 ? (
              'there whenever you run low'
            ) : floorReady ? (
              <button
                type="button"
                className="fd-adcard__link"
                disabled={busy}
                onPointerDown={press}
                onClick={(e) => void run(() => wallet.claimFloor(), e.currentTarget)}
              >
                ready now
              </button>
            ) : (
              `in ${untilText(floorDueAt - now)}`
            )}
          </span>
        </li>
        <li>
          <Swords aria-hidden="true" />
          <span>Win a duel · the prize is paid by the house</span>
        </li>
      </ul>

      {status && (
        <p className="fd-adcard__status" role="status" data-tone={status.tone}>
          {status.text}
        </p>
      )}

      {(onClose || children) && (
        <footer className="fd-adcard__actions">
          {children}
          {onClose && (
            <button type="button" className="fd-btn fd-btn--ghost" onPointerDown={press} onClick={onClose}>
              Not now
            </button>
          )}
        </footer>
      )}
      <p className="fd-adcard__fine">
        {onServer
          ? 'Free simulated coins kept by the server · never money · never transferable'
          : 'Free simulated coins on this device · never money · never transferable'}
      </p>
    </article>
  );
}
