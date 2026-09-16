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
import './rules.css';

type Line = ReturnType<typeof describeConfig>[number];

const num = (v: number) => v.toLocaleString('en-US');

export function CoinRules() {
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
        <p className="eyebrow">RULES OF THE COIN</p>
        <h1 id="fd-coin-rules-title">What a coin is, and what it is not.</h1>
        <p className="fd-rules__lede">
          Every number below is read from the same rule set the game runs on, at the moment this
          page opens. If the rules change, this page changes with them, and the change is announced
          here first.
        </p>
      </div>

      <p className="fd-rules__notice" role="note">
        <ShieldAlert aria-hidden="true" />
        <span>Coins are not money. They cannot be bought, sold, transferred or cashed out.</span>
      </p>

      <div className="fd-rules__grid">
        <article className="fd-rules__section">
          <h2>
            <Coins aria-hidden="true" />
            What a coin is
          </h2>
          <p>
            A coin is a score you spend. It is <strong>not money</strong>. It cannot be bought, and it
            cannot be cashed out, sold or given to another player. It buys entries to duels and
            practice drills inside this game and nothing else.
          </p>
          <p>
            Until accounts arrive, your coins live on this device, in this browser. Clearing the
            browser clears the wallet. When accounts land, the same rules move with them.
          </p>
        </article>

        <article className="fd-rules__section">
          <h2>
            <ListChecks aria-hidden="true" />
            Limits
          </h2>
          <ul>
            {limits.map((l) => (
              <li key={`${l.key}:${l.label}`}>
                <strong>{l.label}.</strong> {l.text}
              </li>
            ))}
          </ul>
          <p>
            None of these limits ever takes a coin away. They only decide when a grant is paid.
          </p>
        </article>

        <article className="fd-rules__section fd-rules__section--wide">
          <h2>
            <Coins aria-hidden="true" />
            How you earn
          </h2>
          <p>
            Four ways, and the only ones: a rewarded ad you choose to watch, a daily grant, a floor
            that stops anyone being locked out, and a prize for a duel you win. An ad pays a
            different number of coins in different places because an ad is worth a different amount
            in different places; one ad always buys at least one entry, everywhere.
          </p>
          <div className="fd-rules__table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col">Rule</th>
                </tr>
              </thead>
              <tbody>
                {earn.map((l) => {
                  const mine = !!region && l.key === 'adReward' && l.region === region;
                  return (
                    <tr key={`${l.key}:${l.label}`} data-mine={mine || undefined}>
                      <td>
                        {l.key === 'adReward' ? `Ad, ${l.label}` : l.label}
                        {mine && <span className="fd-rules__mine">you</span>}
                      </td>
                      <td>{l.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {region && !config.adReward[region as keyof typeof config.adReward] && (
            <p>
              This device reads as region {region}, which is not listed, so the “everywhere else”
              rate applies. The region comes from the browser language, never from your location.
            </p>
          )}
        </article>

        <article className="fd-rules__section fd-rules__section--wide">
          <h2>
            <Scale aria-hidden="true" />
            What a duel costs
          </h2>
          <p>
            Both players pay the same entry to the house. The two entries make the pot. The winner is
            paid a prize by the house: the pot, less the fee shown on the entry card before you tap.{' '}
            <strong>The house keeps the fee and nothing else. No coin ever moves from one player to
            another.</strong>{' '}
            A draw returns each entry whole.
          </p>
          <div className="fd-rules__table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Entry</th>
                  <th scope="col">Pot</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Prize</th>
                  <th scope="col">In words</th>
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
                      <td className="fd-rules__num">{fee === 0 ? 'none' : `${pct(bps)} · ${num(fee)}`}</td>
                      <td className="fd-rules__num">{num(prize)}</td>
                      <td>
                        Play for {num(amount)} → prize {num(prize)}
                      </td>
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
            What changes, and when
          </h2>
          <p>
            Any change to these rules is announced on this page at least{' '}
            <strong>{NOTICE_DAYS} days</strong> before it takes effect. One matchweek. No rule changes
            quietly, and no coin you already hold is ever devalued without that notice.
          </p>
          {upcoming.length === 0 ? (
            <p className="fd-rules__empty">Nothing is scheduled. The rules above are the rules in force.</p>
          ) : (
            <ul className="fd-rules__log">
              {upcoming.map((e) => (
                <li className="fd-rules__entry" key={`${e.date}|${e.title}`}>
                  <span className="fd-rules__when">Takes effect {formatDay(e.effective)}</span>
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
            Change log
          </h2>
          <ul className="fd-rules__log">
            {log.map((e) => (
              <li className="fd-rules__entry" key={`${e.date}|${e.title}`}>
                <span className="fd-rules__when">
                  Announced {formatDay(e.date)}
                  {e.effective !== e.date ? ` · effective ${formatDay(e.effective)}` : ''}
                </span>
                <h3>{e.title}</h3>
                <p>{e.body}</p>
                <ul className="fd-rules__keys" aria-label="Rules touched">
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
