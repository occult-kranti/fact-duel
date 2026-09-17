'use client';
/**
 * Rules of the coin — every number on this page is derived from the economy config at render
 * time (lib/economy/changelog.mjs `describeConfig`, and feeFor/prizeFor from the reducer itself),
 * so the page cannot drift from the code. Nothing in this file states a rate, a cap or a fee of
 * its own; tests/rules-of-the-coin.test.mjs greps it to make sure.
 *
 * The change log and the one-matchweek promise are the answer to the competitor complaint that
 * rules change "almost weekly" without notice (docs/money/ads/synthesis.json feature 17).
 */
import { useState } from 'react';
import { CalendarClock, Coins, History, ListChecks, Scale, ShieldAlert } from 'lucide-react';
import { DEFAULT_CONFIG, feeFor, prizeFor } from '@/lib/economy/economy.mjs';
import {
  KEY_LABELS,
  NOTICE_DAYS,
  changelogNewestFirst,
  describeConfig,
  formatDay,
  pct,
  upcomingChanges,
} from '@/lib/economy/changelog.mjs';
import { useWalletContext } from '../../use-wallet';
import { useLocale } from '../../use-locale';
import './rules.css';

type Line = ReturnType<typeof describeConfig>[number];

export function CoinRules() {
  const { t, fmt } = useLocale();
  const num = (v: number) => fmt.number(v);
  const wallet = useWalletContext();
  const config = wallet?.config ?? DEFAULT_CONFIG;
  const region = wallet?.region ?? '';
  // The clock is read once per mount, in the screen, never in the domain module.
  const [now] = useState(() => Date.now());
  const lines = describeConfig(config);
  const by = (section: Line['section']) => lines.filter((l) => l.section === section);
  const earn = by('earn'),
    limits = by('limits'),
    unlocks = lines.filter((l) => l.key === 'tierUnlock'),
    upcoming = upcomingChanges(now),
    log = changelogNewestFirst();

  return (
    <section className="fd-rules" aria-labelledby="fd-coin-rules-title">
      <div className="fd-rules__head">
        <p className="eyebrow">{t('coin.eyebrow')}</p>
        <h1 id="fd-coin-rules-title">{t('coin.title')}</h1>
        <p className="fd-rules__lede">{t('coin.lede')}</p>
      </div>

      <p className="fd-rules__notice" role="note">
        <ShieldAlert aria-hidden="true" />
        <span>{t('coin.notice')}</span>
      </p>

      <div className="fd-rules__grid">
        <article className="fd-rules__section">
          <h2>
            <Coins aria-hidden="true" />
            {t('coin.whatIs')}
          </h2>
          <p>
            {t('coin.whatIsA')}
            <strong>{t('coin.notMoney')}</strong>
            {t('coin.whatIsB')}
          </p>
          <p>{t('coin.whatIsTwo')}</p>
        </article>

        <article className="fd-rules__section">
          <h2>
            <ListChecks aria-hidden="true" />
            {t('coin.limits')}
          </h2>
          <ul>
            {limits.map((l) => (
              <li key={`${l.key}:${l.label}`}>
                <strong>{l.label}.</strong> {l.text}
              </li>
            ))}
          </ul>
          <p>{t('coin.limitsNote')}</p>
        </article>

        <article className="fd-rules__section fd-rules__section--wide">
          <h2>
            <Coins aria-hidden="true" />
            {t('coin.earn')}
          </h2>
          <p>{t('coin.earnText')}</p>
          <div className="fd-rules__table">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('coin.source')}</th>
                  <th scope="col">{t('coin.rule')}</th>
                </tr>
              </thead>
              <tbody>
                {earn.map((l) => {
                  const mine = !!region && l.key === 'adReward' && l.region === region;
                  return (
                    <tr key={`${l.key}:${l.label}`} data-mine={mine || undefined}>
                      <td>
                        {l.key === 'adReward' ? t('coin.adLabel', { label: l.label }) : l.label}
                        {mine && <span className="fd-rules__mine">{t('coin.you')}</span>}
                      </td>
                      <td>{l.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {region && !config.adReward[region as keyof typeof config.adReward] && (
            <p>{t('coin.regionNote', { region })}</p>
          )}
        </article>

        <article className="fd-rules__section fd-rules__section--wide">
          <h2>
            <Scale aria-hidden="true" />
            {t('coin.costs')}
          </h2>
          <p>
            {t('coin.costsA')}
            <strong>{t('coin.costsStrong')}</strong>
            {t('coin.costsB')}
          </p>
          <div className="fd-rules__table">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('coin.entry')}</th>
                  <th scope="col">{t('coin.pot')}</th>
                  <th scope="col">{t('coin.fee')}</th>
                  <th scope="col">{t('coin.prize')}</th>
                  <th scope="col">{t('coin.inWords')}</th>
                </tr>
              </thead>
              <tbody>
                {config.stakes.map((amount) => {
                  const fee = feeFor(amount, config),
                    prize = prizeFor(amount, config),
                    bps = config.feeBps[amount as keyof typeof config.feeBps] ?? 0;
                  return (
                    <tr key={amount}>
                      <td className="fd-rules__num">{num(amount)}</td>
                      <td className="fd-rules__num">{num(2 * amount)}</td>
                      <td className="fd-rules__num">{fee === 0 ? t('coin.none') : `${pct(bps)} · ${num(fee)}`}</td>
                      <td className="fd-rules__num">{num(prize)}</td>
                      <td>{t('coin.playFor', { n: num(amount), prize: num(prize) })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul>
            {lines
              .filter((l) => l.key === 'practiceEntry')
              .map((l) => (
                <li key={l.key}>
                  <strong>{l.label}.</strong> {l.text}
                </li>
              ))}
            {unlocks.map((l) => (
              <li key={`${l.key}:${l.label}`}>
                <strong>{l.label}.</strong> {l.text}
              </li>
            ))}
          </ul>
        </article>

        <article className="fd-rules__section">
          <h2>
            <CalendarClock aria-hidden="true" />
            {t('coin.changes')}
          </h2>
          <p>
            {t('coin.changesA')}
            <strong>{t('coin.days', { n: NOTICE_DAYS })}</strong>
            {t('coin.changesB')}
          </p>
          {upcoming.length === 0 ? (
            <p className="fd-rules__empty">{t('coin.nothing')}</p>
          ) : (
            <ul className="fd-rules__log">
              {upcoming.map((e) => (
                <li className="fd-rules__entry" key={`${e.date}|${e.title}`}>
                  <span className="fd-rules__when">{t('coin.takesEffect', { day: formatDay(e.effective) })}</span>
                  <h3>{e.title}</h3>
                  <p>{e.body}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="fd-rules__section">
          <h2>
            <History aria-hidden="true" />
            {t('coin.log')}
          </h2>
          <ul className="fd-rules__log">
            {log.map((e) => (
              <li className="fd-rules__entry" key={`${e.date}|${e.title}`}>
                <span className="fd-rules__when">
                  {t('coin.announced', { day: formatDay(e.date) })}
                  {e.effective !== e.date ? t('coin.effective', { day: formatDay(e.effective) }) : ''}
                </span>
                <h3>{e.title}</h3>
                <p>{e.body}</p>
                <ul className="fd-rules__keys" aria-label={t('coin.keysAria')}>
                  {e.keys.map((k) => (
                    <li key={k}>{KEY_LABELS[k as keyof typeof KEY_LABELS] ?? k}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
