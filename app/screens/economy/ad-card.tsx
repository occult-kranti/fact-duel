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
import { DICTIONARIES, translate } from '@/lib/i18n/index.mjs';
import type { Outcome, Placement, WalletApi } from '../../use-wallet';
import { useLocale, type LocaleApi } from '../../use-locale';
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

type T = LocaleApi['t'];
/** The English lookup for callers without a locale (tests): the dictionary's own strings. */
const plainT: T = (key, vars) => translate(DICTIONARIES.en, key, vars);

/** "2h 10m", "14m", or "under a minute" — the floor's real next time, never a fake countdown. */
export function untilText(ms: number, t: T = plainT): string {
  if (ms < 60_000) return t('ad.under');
  const minutes = Math.ceil(ms / 60_000),
    h = Math.floor(minutes / 60),
    m = minutes % 60;
  return h > 0 ? (m > 0 ? t('ad.hm', { h, m }) : t('ad.h', { h })) : t('ad.m', { m });
}

/** The provider's and the reducer's refusals, in words. Every one says nothing was charged. */
function refusalText(reason: string, cap: number, t: T): string {
  switch (reason) {
    case 'unavailable':
      return t('ad.r.unavailable');
    case 'skipped':
      return t('ad.r.skipped');
    case 'daily_cap':
      return t('ad.r.dailyCap', { cap });
    case 'cooldown':
      return t('ad.r.cooldown');
    case 'already_paid':
      return t('ad.r.alreadyPaid');
    case 'already_claimed':
      return t('ad.r.alreadyClaimed');
    case 'soft_cap':
      return t('ad.r.softCap');
    case 'above_floor':
    case 'floor_cooldown':
      return t('ad.r.floor');
    case 'too_soon':
      return t('ad.r.tooSoon');
    case 'expired':
      return t('ad.r.expired');
    case 'pending':
      return t('ad.r.pending');
    default:
      return t('ad.r.default');
  }
}

/** What just happened, as a ledger line. Grants are "now that", never "if you had". */
function outcomeText(o: Outcome, cap: number, t: T): { text: string; tone: 'good' | 'plain' } {
  if (!o.ok) return { text: refusalText(o.reason, cap, t), tone: 'plain' };
  const n = o.granted;
  switch (o.reason) {
    case 'ad_double':
      return { text: t('ad.o.double', { n }), tone: 'good' };
    case 'ad':
      return { text: t('ad.o.ad', { n }), tone: 'good' };
    case 'daily':
      return { text: t('ad.o.daily', { n }), tone: 'good' };
    case 'floor':
      return { text: t('ad.o.floor', { n }), tone: 'good' };
    default:
      return { text: t('ad.o.default', { n }), tone: 'good' };
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
  const { t } = useLocale();
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
            juice.floatText(element, t('ad.plusCoins', { n: outcome.granted }), 'var(--gold-text)');
          }
        }
      } finally {
        if (live.current) setBusy(false);
      }
    },
    [busy, juice, t],
  );

  const drillOffline = false;
  const heading = placement === 'practice-entry'
      ? {
          title: t('ad.drillTitle', { cost: a.practice.cost, coins }),
          lede: t('ad.drillLede'),
        }
      : {
          title: t('ad.yourCoins'),
          lede: onServer ? t('ad.ledeServer') : t('ad.ledeDevice'),
        };

  const status = last
    ? outcomeText(last, config.adDailyCap, t)
    : wallet.notice
      ? outcomeText(wallet.notice, config.adDailyCap, t)
      : null;

  return (
    <article className="fd-adcard" data-placement={placement} data-motion={reduced ? 'reduced' : 'full'}>
      <header className="fd-adcard__head">
        <p className="fd-adcard__eyebrow">
          <Coins aria-hidden="true" />
          {t('ad.eyebrow')}
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
            <span>{t('ad.watch')}</span>
            <ArrowRight aria-hidden="true" />
            <b>{t('ad.plusCoins', { n: perAd })}</b>
          </button>
        ) : (
          <p className="fd-adcard__none" role="status">
            {adsAvailable === null ? t('ad.checking') : onServer ? t('ad.noneServer') : t('ad.noneDevice')}
          </p>
        )}
        <p className="fd-adcard__cap">
          {t('ad.capA')}
          <b>{wallet.wallet.adsToday}</b>
          {t('ad.capB', { cap: config.adDailyCap })}
          {doubleOwed && adsAvailable === true && <span className="fd-adcard__double">{t('ad.double')}</span>}
        </p>
        {pendingReward && (
          <p className="fd-adcard__pending" role="status">
            {t('ad.r.pending')}
          </p>
        )}
      </div>

      <ul className="fd-adcard__alts" aria-label={t('ad.altsAria')}>
        <li>
          <Gift aria-hidden="true" />
          <span>
            {t('ad.daily', { n: config.daily })}
            {canClaimDaily ? (
              <button
                type="button"
                className="fd-adcard__link"
                disabled={busy}
                onPointerDown={press}
                onClick={(e) => void run(() => wallet.claimDaily(), e.currentTarget)}
              >
                {t('ad.claimToday')}
              </button>
            ) : (
              t('ad.claimed')
            )}
          </span>
        </li>
        <li>
          <LifeBuoy aria-hidden="true" />
          <span>
            {t('ad.floor', { n: config.floor.coins })}
            {floorDueAt === 0 ? (
              t('ad.floorWhenever')
            ) : floorReady ? (
              <button
                type="button"
                className="fd-adcard__link"
                disabled={busy}
                onPointerDown={press}
                onClick={(e) => void run(() => wallet.claimFloor(), e.currentTarget)}
              >
                {t('ad.readyNow')}
              </button>
            ) : (
              t('ad.floorIn', { time: untilText(floorDueAt - now, t) })
            )}
          </span>
        </li>
        <li>
          <Swords aria-hidden="true" />
          <span>{t('ad.win')}</span>
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
              {t('ad.notNow')}
            </button>
          )}
        </footer>
      )}
      <p className="fd-adcard__fine">
        {onServer ? t('ad.fineServer') : t('ad.fineDevice')}
      </p>
    </article>
  );
}
