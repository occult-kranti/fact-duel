/**
 * The search-intent clusters the static quiz pages answer, and the pure helpers that choose which
 * served questions each page shows.
 *
 * Why this exists: paid acquisition cannot pay back for an ad-funded trivia duel, so organic search
 * is the one channel that can (docs/money/ads/lane-launch.json, findings 5-6). Sporcle and JetPunk
 * own the "football quiz with answers" / "cricket quiz questions" / "nba quiz hard" intents today.
 * Each entry here becomes one crawlable, no-login page under `public/quiz/<slug>/`, generated at
 * build time by scripts/seo-pages.mjs from lib/server/bank.mjs, so the page can never drift from
 * the bank the game actually deals.
 *
 * Pure and dependency-light: no Date, no Math.random, no I/O. The selection is a hash order over
 * `seed:slug:id`, so two builds of the same bank produce byte-identical pages and a bank refresh
 * reshuffles nothing it does not have to.
 *
 * Honesty rules baked in:
 *   - only questions whose `domain` is enabled (lib/content.mjs) are ever eligible, so a hidden
 *     domain cannot leak onto a public page;
 *   - a question containing any word on the vocabulary ban list is skipped, never rewritten;
 *   - a page whose filter matches fewer than PAGE_SIZE questions says so in its intro and tops up
 *     from the same sport, rather than padding silently or inventing questions;
 *   - the German and French pages carry German and French chrome around ENGLISH questions and say
 *     so. There are no machine translations of the bank.
 */
import { domainEnabled } from '../content.mjs';

/** Questions per page. Ten is what the intent research measured demand for, and what a duel deals. */
export const PAGE_SIZE = 10;

/** The bank's own "authored and checked" date, from the header of lib/server/bank.mjs. */
export const VERIFIED_ASOF = '2026-09-16';

/** Where the static build is served from unless SITE_BASE says otherwise. No trailing slash. */
export const DEFAULT_BASE = 'https://occult-kranti.github.io/fact-duel';

/** The vocabulary ban list, mirrored from tests/rules-of-the-coin.test.mjs. */
export const BANNED =
  /\b(bet|bets|betting|wager|wagers|wagering|odds|jackpot|jackpots|casino|casinos|slots|multiplier|multipliers|gamble|gambling)\b/i;

/** The three difficulty tiers, hardest last, as lib/journal.mjs DIFFICULTIES orders them. */
const TIERS = Object.freeze(['simple', 'expert', 'extreme']);

/** 32-bit FNV-1a. A copy of lib/progression.mjs fnv1a32, kept local so this module stays leaf-like. */
export function fnv1a32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Page chrome per language. Every string a page shows that is not a question comes from here, so
 * the ban-list test can read the whole surface in one place. Product voice: plain, short, no
 * exclamation marks.
 */
export const UI = Object.freeze({
  en: Object.freeze({
    locale: 'en_GB',
    siteName: 'FACT//DUEL',
    hubTitle: 'Sports quiz questions with answers',
    hubIntro:
      'Every page below shows ten real questions from the FACT//DUEL bank, with the answer and the source under each one. Nothing to install and no sign-in. When you want the clock on, play the same questions as a five-second duel.',
    showAnswer: 'Show the answer',
    correct: 'Correct answer',
    source: 'Source',
    verified: 'Questions verified as of',
    difficulty: 'Difficulty',
    play: 'Play this as a duel',
    playHint: 'Same bank, five seconds a question, free to play.',
    more: 'More quizzes',
    hub: 'All quizzes',
    reviewed: 'Questions are reviewed and dated. Found a mistake? Report it in the game.',
    inEnglish: null,
  }),
  de: Object.freeze({
    locale: 'de_DE',
    siteName: 'FACT//DUEL',
    showAnswer: 'Antwort anzeigen',
    correct: 'Richtige Antwort',
    source: 'Quelle',
    verified: 'Fragen geprüft am',
    difficulty: 'Schwierigkeit',
    play: 'Als Duell spielen',
    playHint: 'Gleiche Fragen, fünf Sekunden pro Frage, kostenlos.',
    more: 'Weitere Quiz',
    hub: 'Alle Quiz',
    reviewed: 'Die Fragen sind geprüft und datiert. Fehler gefunden? Melde ihn im Spiel.',
    inEnglish: 'Die Fragen sind auf Englisch. Die Seite ist auf Deutsch, die Fragen selbst nicht.',
  }),
  fr: Object.freeze({
    locale: 'fr_FR',
    siteName: 'FACT//DUEL',
    showAnswer: 'Voir la réponse',
    correct: 'Bonne réponse',
    source: 'Source',
    verified: 'Questions vérifiées le',
    difficulty: 'Difficulté',
    play: 'Jouer en duel',
    playHint: 'Les mêmes questions, cinq secondes par question, gratuit.',
    more: 'Autres quiz',
    hub: 'Tous les quiz',
    reviewed: 'Les questions sont vérifiées et datées. Une erreur ? Signalez-la dans le jeu.',
    inEnglish: 'Les questions sont en anglais. La page est en français, les questions ne le sont pas.',
  }),
});

const IPL = /\b(IPL|Indian Premier League)\b/;

/**
 * One entry per intent cluster. Fields:
 *   slug         the path under /quiz/
 *   topic        the bank topic key (lib/journal.mjs TOPIC_DOMAINS)
 *   lang         page language: 'en' | 'de' | 'fr'
 *   title        <title> and og:title
 *   h1           the page heading
 *   description  meta description and the first paragraph
 *   query        the search phrase the page targets, for the hub and the report
 *   match        optional RegExp a question's text must match to count as an exact hit
 *   prefer       optional difficulty order, first preferred; used by the "hard" page
 *   fallback     the honest intro sentence used when `match` hits fewer than PAGE_SIZE questions;
 *                `{n}` is the number of exact hits
 */
export const INTENTS = Object.freeze(
  [
    {
      slug: 'football-quiz-with-answers',
      topic: 'Football',
      lang: 'en',
      title: 'Football quiz with answers: 10 questions',
      h1: 'Football quiz with answers',
      description:
        'Ten football (soccer) quiz questions with the answers and sources under each one. World Cup, Champions League, Premier League and more, from the bank a real duel deals.',
      query: 'football quiz with answers',
    },
    {
      slug: 'cricket-quiz-questions',
      topic: 'Cricket',
      lang: 'en',
      title: 'Cricket quiz questions with answers',
      h1: 'Cricket quiz questions',
      description:
        'Ten cricket quiz questions with answers: Tests, World Cups, the IPL and the records behind them. Every answer carries its source.',
      query: 'cricket quiz questions',
    },
    {
      slug: 'f1-quiz-2026',
      topic: 'Formula 1',
      lang: 'en',
      title: 'F1 quiz 2026: 10 questions with answers',
      h1: 'F1 quiz 2026',
      description:
        'Ten Formula 1 quiz questions with answers, checked in 2026. Drivers, constructors, circuits and the rulebook, each with a source you can open.',
      query: 'f1 quiz 2026',
    },
    {
      slug: 'nba-quiz-hard',
      topic: 'Basketball',
      lang: 'en',
      title: 'Hard NBA quiz: 10 questions with answers',
      h1: 'NBA quiz, hard',
      description:
        'Ten hard NBA quiz questions drawn from the top difficulty tier of the bank, with answers and sources. Not the easy ones.',
      query: 'nba quiz hard',
      prefer: ['extreme', 'expert', 'simple'],
    },
    {
      slug: 'mlb-quiz-questions',
      topic: 'Baseball',
      lang: 'en',
      title: 'MLB quiz questions with answers',
      h1: 'MLB quiz questions',
      description:
        'Ten baseball quiz questions with answers: World Series, records, rules and the players behind them. Sources under every answer.',
      query: 'mlb quiz questions',
    },
    {
      slug: 'ipl-quiz-2026',
      topic: 'Cricket',
      lang: 'en',
      title: 'IPL quiz 2026: questions with answers',
      h1: 'IPL quiz 2026',
      description:
        'IPL quiz questions with answers and sources, plus more cricket from the same bank. Ten questions, checked in 2026.',
      query: 'ipl quiz 2026',
      match: IPL,
      fallback:
        'The bank holds {n} questions that name the IPL or the Indian Premier League today, so this set is those {n} and more cricket. The IPL share grows as the bank does.',
    },
    {
      slug: 'fussball-quiz-fragen',
      topic: 'Football',
      lang: 'de',
      title: 'Fußball Quiz Fragen mit Antworten',
      h1: 'Fußball Quiz Fragen',
      description:
        'Zehn Fußball-Quizfragen mit Antworten und Quellen. WM, Champions League, Bundesliga und mehr. Die Fragen sind auf Englisch.',
      query: 'fußball quiz fragen',
    },
    {
      slug: 'quiz-foot',
      topic: 'Football',
      lang: 'fr',
      title: 'Quiz foot : 10 questions avec réponses',
      h1: 'Quiz foot',
      description:
        'Dix questions de quiz football avec les réponses et les sources. Coupe du monde, Ligue des champions et plus. Les questions sont en anglais.',
      query: 'quiz foot',
    },
  ].map(Object.freeze),
);

/** The text a ban-list or intent filter reads: everything a page would print for the question. */
export function questionText(q) {
  return [q?.question ?? '', ...(Array.isArray(q?.options) ? q.options : []), q?.explanation ?? ''].join('\n');
}

/**
 * A question a public page may show at all: served domain, the right sport, four options, a
 * source, and nothing from the ban list anywhere in what would be printed.
 */
export function eligible(intent, q) {
  return (
    q &&
    typeof q === 'object' &&
    domainEnabled(q.domain) &&
    q.topic === intent.topic &&
    typeof q.id === 'string' &&
    typeof q.question === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    Number.isInteger(q.correctIndex) &&
    typeof q.sourceUrl === 'string' &&
    !BANNED.test(questionText(q))
  );
}

/**
 * Choose the page's questions. Returns `{ questions, matched, filled }`:
 *   questions  up to PAGE_SIZE question objects, in page order
 *   matched    how many eligible questions hit `intent.match` (equals questions.length when there
 *              is no match filter)
 *   filled     true when the filter matched fewer than PAGE_SIZE and the rest came from the sport
 *
 * Order is deterministic: exact hits first, then preferred difficulty, then the FNV-1a hash of
 * `seed:slug:id`. Changing `seed` reshuffles; nothing else does.
 */
export function selectQuestions(intent, questions, { seed = '' } = {}) {
  const pool = (questions ?? []).filter((q) => eligible(intent, q));
  const hit = (q) => (intent.match ? intent.match.test(questionText(q)) : true);
  const rank = (q) => {
    const i = intent.prefer ? intent.prefer.indexOf(q.difficulty) : 0;
    return i < 0 ? TIERS.length : i;
  };
  const key = (q) => fnv1a32(`${seed}:${intent.slug}:${q.id}`);
  const ordered = pool
    .map((q) => ({ q, hit: hit(q) ? 0 : 1, rank: rank(q), h: key(q) }))
    .sort((a, b) => a.hit - b.hit || a.rank - b.rank || a.h - b.h || (a.q.id < b.q.id ? -1 : 1));
  const matched = ordered.filter((e) => e.hit === 0).length;
  const chosen = ordered.slice(0, PAGE_SIZE).map((e) => e.q);
  return { questions: chosen, matched, filled: Boolean(intent.match) && matched < chosen.length };
}

/** The ten ids a page shows, deterministic for a given bank and seed. */
export function pickQuestions(intent, questions, opts) {
  return selectQuestions(intent, questions, opts).questions.map((q) => q.id);
}

/** The honest intro line for a filtered page, or null when the filter filled the page on its own. */
export function fallbackLine(intent, selection) {
  if (!selection.filled || !intent.fallback) return null;
  return intent.fallback.replaceAll('{n}', String(selection.matched));
}

/** Absolute URL of a page. `base` has no trailing slash; the hub is `slug === ''`. */
export function pageUrl(base, slug) {
  return slug ? `${base}/quiz/${slug}/` : `${base}/quiz/`;
}

/** The sitemap rows: the hub first, then every intent, all with the bank's verification date. */
export function sitemapEntries(intents, base, { lastmod = VERIFIED_ASOF } = {}) {
  return [{ loc: pageUrl(base, ''), lastmod }, ...intents.map((i) => ({ loc: pageUrl(base, i.slug), lastmod }))];
}
