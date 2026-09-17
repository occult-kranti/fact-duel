'use client';
/**
 * Trust — the commitments a player can hold the game to: how opponents are found, what a bot is
 * and is not, that nothing in the game is a random reward, how a wrong question is handled, when
 * an ad may appear, and where the data lives. Where a commitment needs a server that does not
 * exist yet (a public queue, a public corrections page) the copy says so and shows what is real
 * today. Every ad number is derived from the economy config, never typed here.
 */
import { BadgeCheck, Bot, Dices, Flag, HardDrive, MessageSquare, Tv, Users } from 'lucide-react';
import { DEFAULT_CONFIG } from '@/lib/economy/economy.mjs';
import { describeConfig } from '@/lib/economy/changelog.mjs';
import { useWalletContext } from '../../use-wallet';
import './rules.css';

/** The Playbook's own description of the practice bot, quoted rather than paraphrased. */
export const BOT_POLICY_QUOTE =
  'It picks each answer uniformly at random and waits a random 1 second to half a second before the time limit. Choices and times are fixed before play; it does not adapt to your answers.';

/** The review target for a reported question. A commitment, not a measurement. */
export const REVIEW_TARGET_HOURS = 48;

export function Trust() {
  const wallet = useWalletContext();
  const config = wallet?.config ?? DEFAULT_CONFIG;
  const region = wallet?.region ?? '';
  const lines = describeConfig(config);
  const adLimits = lines.filter((l) => l.key === 'adDailyCap' || l.key === 'adCooldownMs');
  const myRate = lines.find((l) => l.key === 'adReward' && l.region === (region in config.adReward ? region : '*'));

  return (
    <section className="fd-rules fd-rules--trust" aria-labelledby="fd-trust-title">
      <div className="fd-rules__head">
        <p className="eyebrow">TRUST</p>
        <h1 id="fd-trust-title">What you can hold Jaanta Hai Kya to.</h1>
        <p className="fd-rules__lede">
          Short rules, stated once, kept. Where something is not built yet, this page says so rather
          than pretending.
        </p>
      </div>

      <p className="fd-rules__notice" role="note">
        <BadgeCheck aria-hidden="true" />
        <span>There is no random reward anywhere in the game. No spin, no chest, no mystery box.</span>
      </p>

      <div className="fd-rules__grid">
        <article className="fd-rules__section">
          <h2>
            <Users aria-hidden="true" />
            Matchmaking
          </h2>
          <ul>
            <li>
              <strong>Friend rooms by code.</strong> You create a room, you share the invite, a friend
              joins. Nobody else can enter.
            </li>
            <li>
              <strong>No hidden fill.</strong> An empty seat stays empty until a friend joins or you add
              the practice bot yourself. The game never seats a bot for you and never calls it a person.
            </li>
            <li>
              <strong>No public queue yet.</strong> Matching with strangers needs accounts, which do not
              exist yet. When the queue arrives it will be announced on the Rules of the coin page
              before it opens, with its own rules written down.
            </li>
          </ul>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Bot aria-hidden="true" />
            Bot policy
          </h2>
          <ul>
            <li>
              <strong>Always labelled.</strong> A practice bot is called a practice bot on the room
              screen, on the receipt and in your Vault. A bot is never shown as a person anywhere.
            </li>
            <li>
              <strong>Free matches only.</strong> A practice bot plays for no entry. No coin is staked
              against a bot and no prize is paid for beating one.
            </li>
            <li>
              <strong>Uniformly at random.</strong> From the Playbook, word for word:
            </li>
          </ul>
          <blockquote>
            {BOT_POLICY_QUOTE}
            <cite>Play rules, step one</cite>
          </blockquote>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Dices aria-hidden="true" />
            Random rewards
          </h2>
          <p>
            <strong>There is no random reward anywhere in the game.</strong> No spin, no chest, no
            mystery box. Every coin you receive has a stated reason: an ad you finished, the daily
            grant, the floor, a quest you completed, or a prize for a duel you won, and the amount is
            written on this device before you tap.
          </p>
          <p>
            The only randomness in the product is the order questions are drawn in and the practice
            bot’s answer, and neither one touches your wallet.
          </p>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Flag aria-hidden="true" />
            Question review
          </h2>
          <p>
            Every answer reveal has a Report button. The commitment: a reported question is reviewed
            within <strong>{REVIEW_TARGET_HOURS} hours</strong>, corrections are listed in public, and if a
            question is voided every entry it decided is refunded.
          </p>
          <p>
            What is real today: the Report button writes your report to the issues list in this
            device’s journal, where you can read and export it from the Vault. Nothing leaves the
            device yet, because there is no server to send it to. The public corrections page, and the
            refund path, arrive with accounts.
          </p>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Tv aria-hidden="true" />
            Ad policy
          </h2>
          <ul>
            <li>
              <strong>Opt-in only.</strong> An ad plays when you choose it from a card that shows its
              price in coins first. “Not now” is always there and costs nothing.
            </li>
            <li>
              <strong>Never inside a round, never before the receipt.</strong> The result of a duel is
              shown in full before any ad is offered.
            </li>
            {adLimits.map((l) => (
              <li key={l.key}>
                <strong>{l.label}.</strong> {l.text}
              </li>
            ))}
            {myRate && (
              <li>
                <strong>Your rate.</strong> On this device a completed ad pays{' '}
                {(myRate.value ?? 0).toLocaleString('en-US')} coins
                {region ? ` (region ${region}, read from the browser language, never your location)` : ''}.
              </li>
            )}
            <li>
              <strong>An ad that does not play charges nothing.</strong> The free paths, the daily grant
              and the floor, are on the same card.
            </li>
          </ul>
        </article>

        <article className="fd-rules__section">
          <h2>
            <HardDrive aria-hidden="true" />
            Your data
          </h2>
          <p>
            Everything the game knows about you lives in this browser, on this device: your wallet,
            your Vault of facts, your match journal and your reports. There is no account, so there
            is nothing to log in to and nothing on a server to leak.
          </p>
          <p>
            Export it as JSON or CSV from the Analytics screen, or reset it from Settings. A reset
            erases the local record and cannot be undone.
          </p>
        </article>

        <article className="fd-rules__section fd-rules__contact">
          <h2>
            <MessageSquare aria-hidden="true" />
            Contact
          </h2>
          <p>
            Questions: see the project page. <a href="/studio">Research &amp; roadmap</a> lists what
            is built, what is planned and what is untested.
          </p>
        </article>
      </div>
    </section>
  );
}
