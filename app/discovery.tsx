'use client';
/**
 * Discovery — three untimed teaching cards for the configured topic.
 *
 * No clock, no opponent: choose once, see the answer, open the explanation, keep the fact. The
 * practice dispatch, the explanation open and the save are exactly the ones the profile reducer
 * already understands; this screen only adds the Floodlight finish and the feedback.
 *
 * THE ENTRY. A drill costs `practiceEntry` coins (economy.mjs), paid to the house before the cards
 * are asked for. The gate is a CLIENT POLICY over the device wallet and nothing more: the server's
 * `practice` action stays open content, because there is no server wallet yet and, on the web, a
 * server could only ever take the client's word for an ad anyway (docs/money/ads/decision.md §1).
 * A wallet that cannot cover the entry is not a locked door — the priced ad card takes the drill's
 * place, with the free paths (the floor, the daily grant) printed beside the ad, and the entry is
 * re-attempted the moment the wallet changes. When no wallet is provided (a mount outside the
 * arena) the drill loads as it always has.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  TriangleAlert,
  Vault,
  X,
} from 'lucide-react';
import { useJuice } from '@/components/fx';
import { request } from '@/lib/duel-client';
import { XP } from '@/lib/progression.mjs';
import { Choices, Dots, usePress } from './screens/vault';
import { useWalletContext } from './use-wallet';
import { useLocale } from './use-locale';
import { AdCard } from './screens/economy/ad-card';
import { clearFixtureDeal, peekFixtureDeal, type FixtureDeal } from './fixture-deal';
import './screens/vault/vault.css';

/** The entry's state for this session: unpaid yet, paid (and the drill loading or open), or refused. */
type Entry = { state: 'pending' } | { state: 'paid'; spent: number } | { state: 'insufficient' };

export default function Discovery({
  topic,
  onBack,
  onVault,
  player,
}: {
  topic: string;
  onBack: () => void;
  onVault?: () => void;
  player: any;
}) {
  const juice = useJuice();
  const press = usePress();
  const { t, topic: topicName } = useLocale();
  const wallet = useWalletContext();
  const [cards, setCards] = useState<any[]>([]),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState<number | null>(null),
    [results, setResults] = useState<boolean[]>([]),
    [error, setError] = useState(''),
    [finished, setFinished] = useState(false),
    [retry, setRetry] = useState(0),
    [entry, setEntry] = useState<Entry>({ state: 'pending' }),
    // The fixture set this drill was opened for (armed by a card on Events), or null for the plain
    // topic drill. Read once at mount and cleared right after, so nothing later inherits it.
    [fixture] = useState<FixtureDeal | null>(() => peekFixtureDeal()),
    // The free recap was already played today, so this run went through the ordinary practice entry.
    [recapPlayed, setRecapPlayed] = useState(false);
  const session = useRef(''),
    // The session whose entry has been paid: a wallet change re-runs the gate, and neither a paid
    // session nor one whose payment is in flight may be charged twice.
    paid = useRef<{ session: string; spent: number } | null>(null),
    charging = useRef(''),
    // An entry paid for cards that never arrived carries over to the retry: one entry, one drill.
    credit = useRef<number | null>(null),
    locked = useRef(false),
    heading = useRef<HTMLHeadingElement | null>(null),
    explanation = useRef<HTMLElement | null>(null);
  const label = fixture ? fixture.label : !topic || topic === 'all' ? t('disc.mixed') : topicName(topic);
  const recap = fixture?.kind === 'recap';
  const expected = fixture?.size ?? 3;
  const count = cards.length || expected;

  useEffect(() => {
    clearFixtureDeal();
  }, []);

  // A new session on every topic, retry or profile epoch: reset, then let the gate below pay and load.
  useEffect(() => {
    setError('');
    session.current = crypto.randomUUID();
    locked.current = false;
    setChoice(null);
    setResults([]);
    setCards([]);
    setIndex(0);
    setFinished(false);
    setEntry({ state: 'pending' });
  }, [topic, retry, player.profile.epoch]);

  // The gate. Runs after the reset above (same deps, declared later) and again whenever the wallet
  // changes, so an ad watched or a grant landed on the card re-attempts the entry by itself. It
  // only pays; loading is the next effect's job, keyed on the session, so a wallet change can never
  // cancel a request already in flight.
  const walletLoaded = wallet?.loaded ?? true,
    walletCoins = wallet?.wallet.coins ?? 0;
  useEffect(() => {
    if (!wallet) return;
    const mine = session.current;
    if (!walletLoaded || paid.current?.session === mine || charging.current === mine) return;
    if (credit.current !== null) {
      paid.current = { session: mine, spent: credit.current };
      credit.current = null;
      setEntry({ state: 'paid', spent: paid.current.spent });
      return;
    }
    charging.current = mine;
    // The recap is free once per local day and never routes through an ad. Only once today's free
    // run is spent does it fall back to the ordinary practice entry — priced, labelled, refusable.
    const charge = async () => {
      if (!recap) return wallet.enterPractice();
      const free = await wallet.enterRecap();
      if (free.ok || free.reason !== 'recap_played') return free;
      setRecapPlayed(true);
      return wallet.enterPractice();
    };
    void charge().then((outcome) => {
      charging.current = '';
      if (outcome.ok) paid.current = { session: mine, spent: outcome.spent };
      // Navigated on mid-payment: the new session pays for itself, and this one's cards are not asked for.
      if (session.current !== mine) return;
      setEntry(outcome.ok ? { state: 'paid', spent: outcome.spent } : { state: 'insufficient' });
    });
  }, [topic, retry, player.profile.epoch, wallet, walletLoaded, walletCoins, recap]);

  // The cards, asked for once the entry is paid (or at once when no wallet is provided). A fixture
  // set is dealt by the duel service from the calendar entry and the kind; the window is checked
  // there, in the viewer's local day, so the offset travels with the request.
  const entryPaid = !wallet || entry.state === 'paid';
  useEffect(() => {
    if (!entryPaid) return;
    let alive = true;
    const body = fixture
      ? { action: 'fixture', eventId: fixture.eventId, kind: fixture.kind, tzOffsetMinutes: new Date().getTimezoneOffset() }
      : { action: 'practice', topic };
    request(body)
      .then((d) => {
        if (alive) {
          setCards(d.cards);
          setIndex(0);
          setFinished(false);
        }
      })
      .catch((e) => {
        if (paid.current?.session === session.current) credit.current = paid.current.spent;
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [entryPaid, topic, retry, player.profile.epoch, fixture]);
  useEffect(() => {
    heading.current?.focus();
  }, [index, finished, cards.length]);

  const fact = cards[index],
    roundId = fact ? `practice:${session.current}:${index}` : '';
  const saved = !!fact && player.journal.saved.includes(fact.question);
  const remembered = results.filter(Boolean).length;

  const answer = (selected: number, element: HTMLButtonElement) => {
    if (locked.current || !fact) return;
    locked.current = true;
    setChoice(selected);
    const right = selected === fact.correctIndex;
    setResults((r) => [...r, right]);
    void player.dispatch({ type: 'practice', epoch: player.profile.epoch, fact, choice: selected, roundId });
    juice.burst(element, right ? 'correct' : 'wrong');
    juice.floatText(element, `+${right ? XP.discoveryCorrect : XP.discovery} XP`);
  };

  return (
    <section className="fd-learn fd-discovery">
      <div>
        <button type="button" className="fd-btn fd-btn--ghost" onPointerDown={press} onClick={onBack}>
          <ArrowLeft />
          {t('disc.back')}
        </button>
      </div>
      <header className="fd-learn__head">
        <p className="fd-eyebrow">{t('disc.eyebrow')}</p>
        <div className="fd-learn__title">
          <h1 ref={heading} tabIndex={-1}>
            {fixture ? label : t('disc.title', { label })}
          </h1>
          <span className="fd-tag fd-tag--cool">
            <Compass />
            {t('disc.takeTime')}
          </span>
          {entry.state === 'paid' && entry.spent > 0 && (
            <span className="fd-tag fd-discovery__entry" title={t('disc.paidTitle')}>
              {t('disc.entryTag', { n: entry.spent })}
            </span>
          )}
          {recap && entry.state === 'paid' && entry.spent === 0 && wallet && (
            <span className="fd-tag fd-discovery__entry" title={t('disc.recapFreeTitle')}>
              {t('disc.freeToday')}
            </span>
          )}
        </div>
        <p className="fd-lede">{finished ? t('disc.ledeDone') : t('disc.lede')}</p>
      </header>

      {finished ? (
        <div className="fd-qwrap">
          <div className="fd-summary">
            <span className="fd-summary__ring">
              {remembered}/{cards.length}
            </span>
            <h2>{t('disc.factsTitle', { n: count === 3 ? t('disc.three') : count })}</h2>
            <p>{t('disc.summary')}</p>
            <div className="fd-summary__scores">
              <span className="fd-tag fd-tag--cool">
                <Check />
                {t('disc.firstTry', { n: remembered })}
              </span>
              <span className="fd-tag">
                <BookOpen />
                {t('disc.kept', { n: cards.length })}
              </span>
            </div>
            <div className="fd-summary__actions">
              {onVault && (
                <button type="button" className="fd-btn" onPointerDown={press} onClick={onVault}>
                  <Vault />
                  {t('disc.openVault')}
                </button>
              )}
              <button type="button" className="fd-btn fd-btn--primary" onPointerDown={press} onClick={onBack}>
                {t('disc.back')}
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="fd-qwrap" role="alert">
          <div className="fd-summary">
            <span className="fd-summary__ring">
              <TriangleAlert />
            </span>
            <h2>{t('disc.couldnt')}</h2>
            <p>{error}</p>
            <div className="fd-summary__actions">
              <button
                type="button"
                className="fd-btn fd-btn--primary"
                onPointerDown={press}
                onClick={() => {
                  locked.current = false;
                  setChoice(null);
                  setRetry((n) => n + 1);
                }}
              >
                {t('disc.tryAgain')}
              </button>
            </div>
          </div>
        </div>
      ) : wallet && entry.state === 'insufficient' ? (
        <div className="fd-qwrap">
          {recapPlayed && (
            <p className="fd-note" role="status">
              {t('disc.recapPlayed', { n: wallet.config.practiceEntry })}
            </p>
          )}
          <AdCard wallet={wallet} placement="practice-entry" onClose={onBack} />
        </div>
      ) : !fact ? (
        <p className="fd-note" role="status">
          {entry.state === 'pending' && wallet
            ? recap
              ? t('disc.openingRecap')
              : t('disc.paying')
            : t('disc.openingFacts')}
        </p>
      ) : (
        <div className="fd-qwrap">
          <Dots total={cards.length} index={index} label={t('disc.factOf', { n: index + 1, of: cards.length })} />
          <div className="fd-qcard">
            <div className="fd-qcard__meta">
              <span className="fd-tag">{topicName(fact.topic)}</span>
              <span className="fd-tag">{fact.subtopic}</span>
            </div>
            <h2 className="fd-qcard__q">{fact.question}</h2>
            <p className="fd-note">{t('disc.chooseOnce')}</p>
            <Choices
              key={roundId}
              options={fact.options}
              correctIndex={fact.correctIndex}
              chosen={choice}
              disabled={!player.loaded}
              animate
              onChoose={answer}
            />
            {choice !== null && (
              <div className="fd-result" data-tone={choice === fact.correctIndex ? 'correct' : 'wrong'}>
                <strong className="fd-result__verdict" role="status">
                  {choice === fact.correctIndex ? <Check /> : <X />}
                  {choice === fact.correctIndex ? t('disc.found') : t('disc.newFact')}
                </strong>
                <p className="fd-result__answer">
                  <b>{t('disc.correctAnswer')}</b> {fact.options[fact.correctIndex]}
                </p>
                <details
                  className="fd-disclose"
                  onToggle={(e) => {
                    if (!e.currentTarget.open) return;
                    const first = player.passport?.facts?.[fact.factId]?.opened !== true;
                    player.open(roundId);
                    juice.sound('reveal');
                    if (first && explanation.current) juice.floatText(explanation.current, `+${XP.open} XP`);
                  }}
                >
                  <summary ref={explanation} onPointerDown={press}>
                    <ChevronRight className="fd-caret" aria-hidden="true" />
                    {t('disc.openExplanation')}
                  </summary>
                  <div className="fd-disclose__body">
                    <p>{fact.explanation}</p>
                    <a className="fd-source" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {t('disc.source', { label: fact.sourceLabel })}
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </div>
                </details>
                <div className="fd-result__actions">
                  <button
                    type="button"
                    className="fd-btn"
                    aria-pressed={saved}
                    onPointerDown={press}
                    onClick={(e) => {
                      const el = e.currentTarget;
                      const adding = !saved;
                      player.save(fact.question);
                      if (adding) {
                        juice.burst(el, 'gem');
                        juice.floatText(el, `+${XP.save} XP`, 'var(--gold-text)');
                      }
                    }}
                  >
                    {saved ? <BookmarkCheck /> : <Bookmark />}
                    {saved ? t('disc.saved') : t('disc.saveFact')}
                  </button>
                  <button
                    type="button"
                    className="fd-btn fd-btn--primary"
                    onPointerDown={press}
                    onClick={() => {
                      if (index + 1 < cards.length) {
                        locked.current = false;
                        setChoice(null);
                        setIndex(index + 1);
                      } else {
                        setFinished(true);
                        juice.sound('unlock');
                      }
                    }}
                  >
                    {index + 1 < cards.length ? t('disc.nextFact') : t('disc.complete')}
                    <ArrowRight />
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="fd-note">{t('disc.footnote')}</p>
        </div>
      )}
    </section>
  );
}
