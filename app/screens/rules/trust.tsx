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
import { useLocale } from '../../use-locale';
import './rules.css';

/** The Playbook's own description of the practice bot, quoted rather than paraphrased. */
export const BOT_POLICY_QUOTE =
  'It picks each answer uniformly at random and waits a random 1 second to half a second before the time limit. Choices and times are fixed before play; it does not adapt to your answers.';

/** The review target for a reported question. A commitment, not a measurement. */
export const REVIEW_TARGET_HOURS = 48;

export function Trust() {
  const { t, fmt } = useLocale();
  const wallet = useWalletContext();
  const config = wallet?.config ?? DEFAULT_CONFIG;
  const region = wallet?.region ?? '';
  const lines = describeConfig(config);
  const adLimits = lines.filter((l) => l.key === 'adDailyCap' || l.key === 'adCooldownMs');
  const myRate = lines.find((l) => l.key === 'adReward' && l.region === (region in config.adReward ? region : '*'));

  return (
    <section className="fd-rules fd-rules--trust" aria-labelledby="fd-trust-title">
      <div className="fd-rules__head">
        <p className="eyebrow">{t('trust.eyebrow')}</p>
        <h1 id="fd-trust-title">{t('trust.title')}</h1>
        <p className="fd-rules__lede">{t('trust.lede')}</p>
      </div>

      <p className="fd-rules__notice" role="note">
        <BadgeCheck aria-hidden="true" />
        <span>{t('trust.notice')}</span>
      </p>

      <div className="fd-rules__grid">
        <article className="fd-rules__section">
          <h2>
            <Users aria-hidden="true" />
            {t('trust.matchmaking')}
          </h2>
          <ul>
            <li>
              <strong>{t('trust.mmOne')}</strong>
              {t('trust.mmOneText')}
            </li>
            <li>
              <strong>{t('trust.mmTwo')}</strong>
              {t('trust.mmTwoText')}
            </li>
            <li>
              <strong>{t('trust.mmThree')}</strong>
              {t('trust.mmThreeText')}
            </li>
          </ul>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Bot aria-hidden="true" />
            {t('trust.bot')}
          </h2>
          <ul>
            <li>
              <strong>{t('trust.botOne')}</strong>
              {t('trust.botOneText')}
            </li>
            <li>
              <strong>{t('trust.botTwo')}</strong>
              {t('trust.botTwoText')}
            </li>
            <li>
              <strong>{t('trust.botThree')}</strong>
              {t('trust.botThreeText')}
            </li>
          </ul>
          <blockquote>
            {t('trust.quote')}
            <cite>{t('trust.cite')}</cite>
          </blockquote>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Dices aria-hidden="true" />
            {t('trust.random')}
          </h2>
          <p>
            <strong>{t('trust.randomStrong')}</strong>
            {t('trust.randomText')}
          </p>
          <p>{t('trust.randomTwo')}</p>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Flag aria-hidden="true" />
            {t('trust.review')}
          </h2>
          <p>
            {t('trust.reviewA')}
            <strong>{t('trust.hours', { n: REVIEW_TARGET_HOURS })}</strong>
            {t('trust.reviewB')}
          </p>
          <p>{t('trust.reviewTwo')}</p>
        </article>

        <article className="fd-rules__section">
          <h2>
            <Tv aria-hidden="true" />
            {t('trust.ad')}
          </h2>
          <ul>
            <li>
              <strong>{t('trust.adOne')}</strong>
              {t('trust.adOneText')}
            </li>
            <li>
              <strong>{t('trust.adTwo')}</strong>
              {t('trust.adTwoText')}
            </li>
            {adLimits.map((l) => (
              <li key={l.key}>
                <strong>{l.label}.</strong> {l.text}
              </li>
            ))}
            {myRate && (
              <li>
                <strong>{t('trust.yourRate')}</strong>
                {t('trust.yourRateText', {
                  n: fmt.number(myRate.value ?? 0),
                  region: region ? t('trust.regionPart', { region }) : '',
                })}
              </li>
            )}
            <li>
              <strong>{t('trust.adThree')}</strong>
              {t('trust.adThreeText')}
            </li>
          </ul>
        </article>

        <article className="fd-rules__section">
          <h2>
            <HardDrive aria-hidden="true" />
            {t('trust.data')}
          </h2>
          <p>{t('trust.dataOne')}</p>
          <p>{t('trust.dataTwo')}</p>
        </article>

        <article className="fd-rules__section fd-rules__contact">
          <h2>
            <MessageSquare aria-hidden="true" />
            {t('trust.contact')}
          </h2>
          <p>
            {t('trust.contactA')}
            <a href="/studio">{t('trust.contactLink')}</a>
            {t('trust.contactB')}
          </p>
        </article>
      </div>
    </section>
  );
}
