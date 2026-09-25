#!/usr/bin/env node
// reddit-pulse — an AGGREGATE snapshot of what Indian subreddits are talking about, for HISAAB DO.
//
// Why: the edition's topic mix, Forward Court claims and tone are steered by what people actually
// argue about (docs/hisaab/research/discourse.md). The build environment cannot reach Reddit, so
// this script is meant to be run by the product owner on a machine where Reddit is reachable,
// roughly once a month (ROADMAP "Reddit pulse refresh").
//
// USAGE
//   node scripts/research/reddit-pulse.mjs --dry-run                 # built-in fixture, no network
//   node scripts/research/reddit-pulse.mjs --out=/tmp/pulse.json     # live run, default subreddits
//   node scripts/research/reddit-pulse.mjs --subs=india,IndiaSpeaks --pages=2 --out=pulse.json
//   node scripts/research/reddit-pulse.mjs --help
//
// OPTIONS
//   --dry-run            use the built-in fixture and a fake clock; no credentials, no network.
//                        Runs self-checks (privacy, rate spacing, banned-sub handling) and exits 1
//                        if any fails.
//   --subs=a,b,c         subreddits to scan (default: DEFAULT_SUBREDDITS below = the discourse table)
//   --subs-file=path     one subreddit per line; '#' starts a comment
//   --listings=top,hot   which listings to read (default top,hot); top uses --t
//   --t=month            time window for 'top': hour|day|week|month|year|all (default month)
//   --limit=100          posts per page, 1–100 (default 100)
//   --pages=1            pages per listing, 1–10 (default 1; each page is one request)
//   --min-interval=1100  minimum milliseconds between requests (never below 1100)
//   --top-n=25           how many keywords / bigrams / flairs / domains to keep per subreddit
//   --sample-titles=0    keep up to N highest-scoring TITLES per topic per subreddit for editorial
//                        context (default 0 = aggregate counts only). u/ mentions are scrubbed.
//   --redact-file=path   local file of terms (one per line) to mask as "[redacted]" in keyword and
//                        bigram output. Keep it OUTSIDE the repo. Also read from
//                        REDDIT_PULSE_REDACT_FILE. Raw keywords can contain slurs or profanity —
//                        review before pasting anything into docs/.
//   --out=path           write the JSON there (default: stdout). Progress goes to stderr.
//
// CREDENTIALS (environment variables ONLY — never pass them as flags, never commit them)
//   REDDIT_CLIENT_ID       "script" app id from https://www.reddit.com/prefs/apps
//   REDDIT_CLIENT_SECRET   that app's secret
//   REDDIT_USERNAME        the Reddit account that owns the app
//   REDDIT_PASSWORD        its password (accounts with 2FA: "password:123456" with a fresh code)
//   REDDIT_USER_AGENT      e.g. "script:hisaab-pulse:v1 (by /u/<your-account>)" — Reddit requires a
//                          descriptive UA; generic ones get throttled.
//   The script prints only WHICH variables are missing, never their values, and never prints the
//   OAuth token. See CHARTER §2.10: secrets never enter the repository.
//
// WHAT IT DOES
//   1. Password-grant OAuth at https://www.reddit.com/api/v1/access_token (script app).
//   2. For each subreddit: GET https://oauth.reddit.com/r/<sub>/top?t=<t> and /hot, polite:
//      ≥1.1 s between requests, spreads requests over x-ratelimit-remaining / x-ratelimit-reset,
//      waits out the window when remaining < 2, retries 429/5xx with backoff (max 3).
//   3. Reads ONLY these post fields: id (for de-duplication, in memory only), title, score,
//      num_comments, link_flair_text, domain, stickied, created_utc. It never reads author,
//      selftext, comments or any user field. Stickied (mod) posts are skipped.
//   4. Writes an aggregate JSON: per subreddit post counts, top keywords and bigrams (by number of
//      posts containing them), flair and link-domain counts, and hits against a topic dictionary
//      aligned to the bank SECTORS (editions/hisaab/bank/schema.mjs), named cases from the charter
//      lanes, and the label lexicon (Andhbhakt … Anti-National). Titles are stored only when
//      --sample-titles > 0.
//   A banned / private / quarantined subreddit is recorded with its status and skipped.
//
// Node 22+, no dependencies (global fetch).

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SECTORS } from '../../editions/hisaab/bank/schema.mjs';

export const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
export const API_BASE = 'https://oauth.reddit.com';
const MIN_INTERVAL_FLOOR_MS = 1100;
const ENV_KEYS = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USERNAME', 'REDDIT_PASSWORD', 'REDDIT_USER_AGENT'];

/** The discourse table in docs/hisaab/research/discourse.md (Chodi is banned; kept to record it). */
export const DEFAULT_SUBREDDITS = Object.freeze([
  'india', 'IndiaSpeaks', 'unitedstatesofindia', 'indianews', 'librandu', 'Chodi', 'bakchodi',
  'indiadiscussion', 'IndianDankMemes', 'indiameme', 'SaimanSays', 'dhruvrathee', 'Sham_Sharma_Show',
  'IndianModerate', 'AskIndia', 'indiasocial', 'IndiaInvestments', 'IndianStreetBets',
  'CriticalThinkingIndia', 'DesiMeta', 'IndiaTax', 'bangalore', 'mumbai', 'delhi', 'kolkata', 'Kerala',
  'TamilNadu', 'hyderabad', 'pune', 'bihar',
]);

// ── Dictionaries ────────────────────────────────────────────────────────────────────────────────
// Terms are matched as whole words/phrases on a normalised title (lower-case, punctuation → space),
// so "ED raids" matches 'ed raids' but not 'edited'. Add spelling variants explicitly.

/** Themes, each mapped to exactly one bank SECTOR. */
export const TOPICS = Object.freeze([
  { id: 'freebies-welfare', sector: 'Welfare & Subsidies', label: 'Freebies, cash transfers & welfare schemes',
    terms: ['freebie', 'freebies', 'revdi', 'rewari', 'cash transfer', 'dbt', 'subsidy', 'subsidies', 'ration', 'pds',
      'ladli behna', 'ladki bahin', 'mahtari vandan', 'mgnrega', 'nrega', 'manrega', 'ujjwala', 'pmay', 'awas yojana',
      'jan dhan', 'welfare scheme', 'free electricity', 'free bus', 'free bijli', 'yojana'] },
  { id: 'farm', sector: 'Farm & Food', label: 'Farmers, MSP & food prices',
    terms: ['msp', 'farmer', 'farmers', 'farm laws', 'kisan', 'pm kisan', 'fertiliser', 'fertilizer', 'urea',
      'crop insurance', 'fasal bima', 'onion price', 'onion prices', 'tomato price', 'tomato prices', 'food inflation'] },
  { id: 'health', sector: 'Health', label: 'Hospitals, drug prices & health schemes',
    terms: ['hospital', 'hospitals', 'ayushman', 'drug price', 'drug prices', 'medicine price', 'medicine prices',
      'cough syrup', 'aiims', 'health insurance', 'covid', 'oxygen', 'doctors'] },
  { id: 'exams-leaks', sector: 'Education & Exams', label: 'Exams, paper leaks & education',
    terms: ['neet', 'paper leak', 'paper leaks', 'nta', 'jee', 'cuet', 'upsc', 'ssc cgl', 're exam', 're neet', 'cbse',
      'question paper', 'exam cancelled', 'coaching', 'nep', 'ugc', 'पेपर लीक'] },
  { id: 'civic-infra', sector: 'Infrastructure', label: 'Potholes, floods, traffic & big projects',
    terms: ['pothole', 'potholes', 'flyover', 'bridge collapse', 'collapsed', 'waterlogging', 'flooded', 'flooding',
      'traffic', 'metro', 'highway', 'expressway', 'bullet train', 'vande bharat', 'train accident', 'derailment',
      'stampede', 'smart city', 'central vista', 'infrastructure'] },
  { id: 'banking-markets', sector: 'Banking & Finance', label: 'UPI charges, banks, loans & markets',
    terms: ['upi', 'mdr', 'bank', 'banks', 'npa', 'write off', 'written off', 'loan waiver', 'sebi', 'f o',
      'futures and options', 'stock market', 'sensex', 'nifty', 'rbi', 'demonetisation', 'demonetization',
      'notebandi', 'rupee', 'digital payments'] },
  { id: 'cronyism', sector: 'Banking & Finance', label: 'Crony capitalism (Adani / Ambani / billionaires)',
    terms: ['adani', 'ambani', 'hindenburg', 'crony', 'cronyism', 'crony capitalism', 'billionaire', 'billionaires',
      'dharavi'] },
  { id: 'fuel-energy', sector: 'Energy & Mining', label: 'Fuel, LPG, power & mining',
    terms: ['petrol', 'diesel', 'lpg', 'cylinder', 'fuel price', 'fuel prices', 'cng', 'hormuz', 'crude',
      'russian oil', 'ethanol', 'e20', 'power cut', 'power cuts', 'electricity bill', 'coal', 'illegal mining',
      'sand mining'] },
  { id: 'security-war', sector: 'Defence & Security', label: 'War, terror, borders & defence deals',
    terms: ['rafale', 'agnipath', 'agniveer', 'operation sindoor', 'sindoor', 'pahalgam', 'ceasefire', 'iran war',
      'pakistan', 'china', 'galwan', 'manipur', 'terror attack', 'terrorism', 'defence budget', 'army'] },
  { id: 'elections-integrity', sector: 'Elections & Funding', label: 'Voter rolls, EVMs & the Election Commission',
    terms: ['vote chori', 'vote chor', 'vote theft', 'evm', 'evms', 'vvpat', 'election commission', 'eci', 'cec',
      'special intensive revision', 'sir exercise', 'voter list', 'voters list', 'electoral roll', 'electoral rolls',
      'voter roll', 'names deleted', 'delimitation', 'one nation one election'] },
  { id: 'party-money', sector: 'Elections & Funding', label: 'Electoral bonds, party funding & defections',
    terms: ['electoral bond', 'electoral bonds', 'poll bonds', 'party funding', 'political donation',
      'political donations', 'electoral trust', 'horse trading', 'defection', 'defections', 'defected',
      'operation lotus', 'resort politics', 'चुनावी बॉन्ड'] },
  { id: 'media-speech', sector: 'Media & Speech', label: 'Godi media, press freedom & censorship',
    terms: ['godi', 'godi media', 'modia', 'anchor', 'anchors', 'press freedom', 'journalist', 'journalists',
      'news channel', 'paid media', 'prime time', 'sedition', 'uapa', 'censorship', 'free speech', 'comedian',
      'it cell', 'fact check', 'गोदी मीडिया'] },
  { id: 'agencies-probity', sector: 'Governance & Institutions', label: 'ED/CBI raids, "washing machine", scams & courts',
    terms: ['ed raid', 'ed raids', 'ed summons', 'ed arrest', 'enforcement directorate', 'cbi', 'washing machine',
      'income tax raid', 'lokpal', 'rti', 'cag', 'scam', 'scams', 'corruption', 'bribe', 'supreme court',
      'high court', 'governor', 'bulldozer', 'dynasty', 'dynastic', 'nepotism', 'parivarvaad'] },
  { id: 'federalism-language', sector: 'Governance & Institutions', label: 'Federalism, tax devolution & language',
    terms: ['hindi imposition', 'three language', 'language policy', 'tax devolution', 'devolution', 'federalism',
      'north south', 'kannada', 'marathi', 'tamil', 'hindi'] },
  { id: 'jobs-economy', sector: 'Jobs & Economy', label: 'Jobs, prices, taxes, GDP & tariffs',
    terms: ['unemployment', 'unemployed', 'jobless', 'berozgari', 'jobs', 'layoff', 'layoffs', 'govt job',
      'government job', 'government jobs', 'sarkari naukri', 'vacancy', 'vacancies', 'inflation', 'price rise',
      'price hike', 'mehngai', 'mehangai', 'gdp', 'economy', 'recession', 'fdi', 'gst', 'income tax', 'tax',
      'taxes', 'taxpayer', 'taxpayers', 'middle class', 'itr', 'tds', 'tariff', 'tariffs', 'trump tariff',
      'बेरोजगारी', 'महंगाई'] },
  { id: 'environment-land', sector: 'Environment & Land', label: 'Air, water, forests & land',
    terms: ['aqi', 'pollution', 'smog', 'air quality', 'stubble', 'heatwave', 'aravalli', 'aravallis', 'hasdeo',
      'great nicobar', 'deforestation', 'forest', 'yamuna', 'ganga', 'namami gange', 'landslide', 'encroachment',
      'land acquisition'] },
]);

/**
 * Measured but never turned into questions (CHARTER §2.6): how much of the conversation is
 * identity or crime. Counted so the editorial team can see the share it is NOT competing with.
 */
export const WATCH = Object.freeze([
  { id: 'identity-religion-caste', label: 'Religion, caste & identity (out of scope for questions)',
    terms: ['hindu', 'hindus', 'muslim', 'muslims', 'christian', 'sikh', 'temple', 'mosque', 'mandir', 'masjid',
      'communal', 'religion', 'caste', 'casteism', 'reservation', 'quota', 'dalit', 'brahmin', 'obc'] },
  { id: 'crime-safety', label: "Crime & women's safety (Governance only via public-money angles)",
    terms: ['rape', 'raped', 'gang rape', 'murder', 'murdered', 'police', 'custodial', 'encounter',
      "women's safety", 'women safety', 'nirbhaya', 'crime'] },
]);

/** Named cases/schemes from the charter lanes (CHARTER §4), each with its bank SECTOR. */
export const CASES = Object.freeze([
  { id: 'electoral-bonds', sector: 'Elections & Funding', terms: ['electoral bond', 'electoral bonds', 'poll bonds'] },
  { id: 'vote-chori-sir', sector: 'Elections & Funding', terms: ['vote chori', 'vote theft', 'special intensive revision', 'sir exercise'] },
  { id: 'adani-hindenburg', sector: 'Banking & Finance', terms: ['adani', 'hindenburg'] },
  { id: 'sebi-f-and-o', sector: 'Banking & Finance', terms: ['sebi', 'jane street', 'f o', 'futures and options'] },
  { id: 'upi-mdr', sector: 'Banking & Finance', terms: ['mdr', 'upi charge', 'upi charges', 'upi fee'] },
  { id: 'demonetisation', sector: 'Banking & Finance', terms: ['demonetisation', 'demonetization', 'notebandi', 'note ban'] },
  { id: 'bank-frauds', sector: 'Banking & Finance', terms: ['nirav modi', 'mehul choksi', 'mallya', 'pnb scam', 'yes bank', 'dhfl', 'il fs', 'ilfs', 'pmc bank', 'sahara'] },
  { id: 'chit-funds-wb', sector: 'Banking & Finance', terms: ['saradha', 'narada', 'rose valley', 'chit fund'] },
  { id: 'gst', sector: 'Jobs & Economy', terms: ['gst'] },
  { id: 'rafale-defence-deals', sector: 'Defence & Security', terms: ['rafale', 'agustawestland', 'agusta'] },
  { id: 'agnipath', sector: 'Defence & Security', terms: ['agnipath', 'agniveer'] },
  { id: 'pegasus', sector: 'Media & Speech', terms: ['pegasus'] },
  { id: 'pm-cares', sector: 'Governance & Institutions', terms: ['pm cares', 'pm cares fund'] },
  { id: 'washing-machine', sector: 'Governance & Institutions', terms: ['washing machine'] },
  { id: 'delhi-excise', sector: 'Governance & Institutions', terms: ['liquor policy', 'excise policy', 'liquor scam', 'sheesh mahal'] },
  { id: 'national-herald', sector: 'Governance & Institutions', terms: ['national herald'] },
  { id: 'mahadev-app', sector: 'Governance & Institutions', terms: ['mahadev app', 'mahadev betting'] },
  { id: 'tasmac', sector: 'Governance & Institutions', terms: ['tasmac'] },
  { id: 'neet-nta', sector: 'Education & Exams', terms: ['neet', 'nta', 're neet'] },
  { id: 'vyapam', sector: 'Education & Exams', terms: ['vyapam'] },
  { id: 'recruitment-scams', sector: 'Education & Exams', terms: ['ssc scam', 'recruitment scam', 'cash for jobs', 'school service commission', 'wbssc', 'skill development scam'] },
  { id: 'muda', sector: 'Environment & Land', terms: ['muda'] },
  { id: 'dharavi', sector: 'Environment & Land', terms: ['dharavi'] },
  { id: 'great-nicobar', sector: 'Environment & Land', terms: ['great nicobar'] },
  { id: 'coal', sector: 'Energy & Mining', terms: ['coal scam', 'coalgate', 'coal levy', 'coal block', 'coal blocks'] },
  { id: 'ujjwala', sector: 'Energy & Mining', terms: ['ujjwala'] },
  { id: 'kaleshwaram', sector: 'Infrastructure', terms: ['kaleshwaram', 'medigadda'] },
  { id: 'central-vista', sector: 'Infrastructure', terms: ['central vista'] },
  { id: 'forty-percent-commission', sector: 'Infrastructure', terms: ['40 commission', '40 percent commission'] },
  { id: 'jal-jeevan', sector: 'Infrastructure', terms: ['jal jeevan'] },
  { id: 'pm-kisan', sector: 'Farm & Food', terms: ['pm kisan'] },
  { id: 'farm-laws', sector: 'Farm & Food', terms: ['farm laws'] },
  { id: 'ration-scams', sector: 'Farm & Food', terms: ['ration scam', 'fodder scam', 'srijan'] },
  { id: 'mgnrega', sector: 'Welfare & Subsidies', terms: ['mgnrega', 'nrega', 'manrega'] },
  { id: 'valmiki-corporation', sector: 'Welfare & Subsidies', terms: ['valmiki corporation'] },
  { id: 'ayushman', sector: 'Health', terms: ['ayushman'] },
]);

/**
 * Political labels (never group slurs — CHARTER §2.6 forbids those even here). Counting them tells
 * us which ladder rungs are live vocabulary in each community.
 */
export const LABELS = Object.freeze([
  { id: 'andhbhakt', terms: ['andhbhakt', 'andhbhakts', 'andh bhakt', 'andhbhakti'] },
  { id: 'bhakt', terms: ['bhakt', 'bhakts'] },
  { id: 'it-cell', terms: ['it cell', 'itcell'] },
  { id: 'godi-media', terms: ['godi media', 'godi', 'modia'] },
  { id: 'whatsapp-university', terms: ['whatsapp university', 'whatsapp uni', 'whatsapp forward', 'whatsapp uncle'] },
  { id: 'urban-naxal', terms: ['urban naxal', 'urban naxals'] },
  { id: 'tukde-tukde', terms: ['tukde tukde', 'tukde'] },
  { id: 'anti-national', terms: ['anti national', 'antinational', 'anti nationals'] },
  { id: 'jumla', terms: ['jumla', 'jumlas', 'jumlebaaz'] },
  { id: 'pappu', terms: ['pappu'] },
  { id: 'feku', terms: ['feku'] },
  { id: 'presstitute', terms: ['presstitute', 'presstitutes'] },
  { id: 'librandu', terms: ['librandu', 'librandus'] },
  { id: 'sanghi', terms: ['sanghi', 'sanghis'] },
  { id: 'sickular', terms: ['sickular', 'sickulars'] },
  { id: 'libtard', terms: ['libtard', 'libtards'] },
  { id: 'toolkit-ecosystem', terms: ['toolkit', 'ecosystem'] },
  { id: 'andolanjeevi', terms: ['andolanjeevi', 'andolan jeevi'] },
  { id: 'vishwaguru', terms: ['vishwaguru', 'vishwa guru'] },
  { id: 'neutral-sab-chor', terms: ['sab chor hain', 'sab mile hue hain', 'neutral uncle'] },
  { id: 'two-rupee-troll', terms: ['2 rupee', '2 rs', 'two rupee'] },
  { id: 'cockroach', terms: ['cockroach', 'cockroaches', 'cockroach janta party'] },
]);

const STOPWORDS = new Set(`a an the and or but if then than so to of in on at by for from with without into onto over under about
after before during between against among as is are was were be been being am do does did done doing have has had having
it its it's this that these those there here what which who whom whose why how when where all any both each few more most
other some such no nor not only own same too very can will just should now i me my we our you your he him his she her they
them their also get got gets new one two up out off again further once via vs amp us s t re ll ve d m don didn doesn isn
aren wasn weren won wouldn couldn shouldn let lets like say says said make made take know see seen way even still much many
yet per ever every really day days week year years today people guys anyone someone something thing things time
hai hain ka ki ke ko se me mein aur ye yeh wo woh kya kyu kyun kyon nahi nahin nhi bhi ho hota hoti hote to toh par pe na
ek hi tha thi the kar karo kare karna karne raha rahe rahi gaya gayi gaye diya liya bhai yaar ab jab tab sab kuch koi apna
apne apni mera meri mere tera teri tere unka unki unke iska iski iske inka inki inke hum tum aap log wala wali wale
india indian indians reddit sub subreddit post posts thread discussion question help pls please oc meme memes`.split(/\s+/));

// ── Text helpers ────────────────────────────────────────────────────────────────────────────────

export function normalise(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\bu\/[a-z0-9_-]+/g, ' ')
    .replace(/[^a-z0-9ऀ-ॿ]+/g, ' ')
    .trim();
}

const compile = (entries) => entries.map((e) => ({ ...e, norm: [...new Set(e.terms.map(normalise))].filter(Boolean) }));
const C_TOPICS = compile(TOPICS);
const C_WATCH = compile(WATCH);
const C_CASES = compile(CASES);
const C_LABELS = compile(LABELS);

/** Which dictionary entries a title hits (each entry counted once per post). */
export function matchEntries(title, compiled) {
  const padded = ` ${normalise(title)} `;
  return compiled.filter((e) => e.norm.some((t) => padded.includes(` ${t} `))).map((e) => e.id);
}

/** Title words with dropped words (stopwords, short, numeric) kept as null, so bigrams never bridge them. */
function tokens(title) {
  return normalise(title)
    .split(' ')
    .map((w) => (w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w) ? w : null));
}

const scrubTitle = (title) => String(title).replace(/\bu\/[A-Za-z0-9_-]+/g, 'u/[user]').replace(/\s+/g, ' ').trim().slice(0, 200);

function checkDictionaries() {
  const bad = [...TOPICS, ...CASES].filter((e) => !SECTORS.includes(e.sector)).map((e) => `${e.id}→${e.sector}`);
  if (bad.length) throw new Error(`dictionary sectors not in SECTORS: ${bad.join(', ')}`);
}

// ── Aggregation ─────────────────────────────────────────────────────────────────────────────────

/** Keep only the fields we are allowed to look at. Nothing else from the API object survives. */
export function pickPost(raw) {
  const d = raw?.data ?? {};
  return {
    id: typeof d.id === 'string' ? d.id : undefined,
    title: typeof d.title === 'string' ? d.title : '',
    score: Number.isFinite(d.score) ? d.score : 0,
    comments: Number.isFinite(d.num_comments) ? d.num_comments : 0,
    flair: typeof d.link_flair_text === 'string' && d.link_flair_text.trim() ? d.link_flair_text.trim().slice(0, 60) : null,
    domain: typeof d.domain === 'string' ? d.domain.toLowerCase() : null,
    stickied: d.stickied === true,
    created: Number.isFinite(d.created_utc) ? d.created_utc : null,
  };
}

const topCounts = (map, n, redact) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([term, posts]) => ({ term: redact ? redact(term) : term, posts }));

/** Aggregate one subreddit's de-duplicated posts. Pure; used by live and dry runs alike. */
export function aggregate(posts, { topN = 25, sampleTitles = 0, redact } = {}) {
  const kw = new Map();
  const bi = new Map();
  const flairs = new Map();
  const domains = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  const tally = (compiled) => Object.fromEntries(compiled.map((e) => [e.id, { posts: 0, score: 0, comments: 0, samples: [] }]));
  const topics = tally(C_TOPICS);
  const watch = tally(C_WATCH);
  const cases = tally(C_CASES);
  const labels = tally(C_LABELS);
  const sectors = Object.fromEntries(SECTORS.map((s) => [s, 0]));
  let first = Infinity;
  let last = -Infinity;

  for (const p of posts) {
    const toks = tokens(p.title);
    for (const t of new Set(toks)) if (t) bump(kw, t);
    const pairs = new Set();
    for (let i = 0; i + 1 < toks.length; i += 1) if (toks[i] && toks[i + 1]) pairs.add(`${toks[i]} ${toks[i + 1]}`);
    for (const b of pairs) bump(bi, b);
    if (p.flair) bump(flairs, p.flair);
    if (p.domain && !p.domain.startsWith('self.')) bump(domains, p.domain);
    if (p.created) {
      first = Math.min(first, p.created);
      last = Math.max(last, p.created);
    }
    const hitSectors = new Set();
    for (const [compiled, table] of [[C_TOPICS, topics], [C_WATCH, watch], [C_CASES, cases], [C_LABELS, labels]]) {
      for (const id of matchEntries(p.title, compiled)) {
        const row = table[id];
        row.posts += 1;
        row.score += p.score;
        row.comments += p.comments;
        if (sampleTitles > 0) row.samples.push({ score: p.score, title: scrubTitle(p.title) });
        const sector = compiled.find((e) => e.id === id)?.sector;
        if (sector) hitSectors.add(sector);
      }
    }
    for (const s of hitSectors) sectors[s] += 1;
  }

  const finish = (table) =>
    Object.fromEntries(
      Object.entries(table)
        .filter(([, r]) => r.posts > 0)
        .sort((a, b) => b[1].posts - a[1].posts)
        .map(([id, r]) => {
          const out = { posts: r.posts, share: posts.length ? +(r.posts / posts.length).toFixed(4) : 0, score: r.score, comments: r.comments };
          if (sampleTitles > 0) out.sampleTitles = r.samples.sort((a, b) => b.score - a.score).slice(0, sampleTitles).map((s) => s.title);
          return [id, out];
        }),
    );

  return {
    posts: posts.length,
    span: Number.isFinite(first) ? { from: new Date(first * 1000).toISOString().slice(0, 10), to: new Date(last * 1000).toISOString().slice(0, 10) } : null,
    topics: finish(topics),
    sectors,
    cases: finish(cases),
    labels: finish(labels),
    watch: finish(watch),
    keywords: topCounts(kw, topN, redact),
    bigrams: topCounts(bi, topN, redact),
    flairs: topCounts(flairs, Math.min(topN, 15)).map(({ term, posts: n }) => ({ flair: term, posts: n })),
    domains: topCounts(domains, Math.min(topN, 15)).map(({ term, posts: n }) => ({ domain: term, posts: n })),
  };
}

/** Roll per-subreddit results into a cross-subreddit ranking. */
export function summarise(subs) {
  const ok = Object.values(subs).filter((s) => s.status === 'ok');
  const roll = (key, meta) => {
    const acc = new Map();
    for (const s of ok) {
      for (const [id, r] of Object.entries(s[key] ?? {})) {
        const a = acc.get(id) ?? { id, posts: 0, subreddits: 0, meanShare: 0 };
        a.posts += r.posts;
        a.subreddits += 1;
        a.meanShare += r.share / ok.length;
        acc.set(id, a);
      }
    }
    return [...acc.values()]
      .map((a) => ({ ...a, meanShare: +a.meanShare.toFixed(4), ...(meta?.get(a.id) ?? {}) }))
      .sort((a, b) => b.subreddits - a.subreddits || b.meanShare - a.meanShare);
  };
  const meta = (list) => new Map(list.map((e) => [e.id, { label: e.label, sector: e.sector }]));
  const sectors = Object.fromEntries(SECTORS.map((s) => [s, ok.reduce((n, x) => n + (x.sectors?.[s] ?? 0), 0)]));
  return {
    subredditsOk: ok.length,
    posts: ok.reduce((n, s) => n + s.posts, 0),
    topics: roll('topics', meta(TOPICS)),
    cases: roll('cases', meta(CASES)),
    labels: roll('labels'),
    watch: roll('watch', meta(WATCH)),
    sectors,
  };
}

// ── Politeness: rate limiter ────────────────────────────────────────────────────────────────────

export class Limiter {
  constructor({ minIntervalMs = MIN_INTERVAL_FLOOR_MS, sleep, now }) {
    this.min = Math.max(MIN_INTERVAL_FLOOR_MS, minIntervalMs);
    this.interval = this.min;
    this.sleep = sleep;
    this.now = now;
    this.last = -Infinity;
    this.blockedUntil = 0;
    this.stamps = [];
  }

  async wait() {
    const gap = this.last + this.interval - this.now();
    if (gap > 0) await this.sleep(gap);
    const block = this.blockedUntil - this.now();
    if (block > 0) await this.sleep(block);
    this.last = this.now();
    this.stamps.push(this.last);
  }

  /** Honour Reddit's x-ratelimit-* headers: spread what is left over the window; stop near zero. */
  update(headers) {
    const remaining = Number.parseFloat(headers.get('x-ratelimit-remaining') ?? '');
    const reset = Number.parseFloat(headers.get('x-ratelimit-reset') ?? '');
    if (!Number.isFinite(remaining) || !Number.isFinite(reset)) return;
    if (remaining < 2) {
      this.blockedUntil = this.now() + (reset + 1) * 1000;
      this.interval = this.min;
    } else {
      this.interval = Math.max(this.min, Math.ceil((reset * 1000) / remaining));
    }
  }

  backoff(seconds) {
    this.blockedUntil = Math.max(this.blockedUntil, this.now() + seconds * 1000);
  }
}

// ── Reddit client ───────────────────────────────────────────────────────────────────────────────

function missingEnv(env) {
  return ENV_KEYS.filter((k) => !env[k] || !String(env[k]).trim());
}

async function request(http, limiter, url, init, log) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await limiter.wait();
    let res;
    try {
      res = await http(url, init);
    } catch (e) {
      if (attempt === 4) throw new Error(`network error on ${new URL(url).pathname}: ${e?.name ?? 'Error'}`);
      limiter.backoff(2 ** attempt);
      continue;
    }
    limiter.update(res.headers);
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number.parseFloat(res.headers.get('retry-after') ?? '');
      const reset = Number.parseFloat(res.headers.get('x-ratelimit-reset') ?? '');
      const wait = Number.isFinite(retryAfter) ? retryAfter : Number.isFinite(reset) ? reset + 1 : 2 ** attempt * 5;
      log(`  HTTP ${res.status} on ${new URL(url).pathname} — waiting ${Math.round(wait)} s (attempt ${attempt}/3)`);
      if (attempt === 4) return res;
      limiter.backoff(wait);
      continue;
    }
    return res;
  }
  throw new Error('unreachable');
}

async function getToken({ env, http, limiter, now, log }) {
  const basic = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'password', username: env.REDDIT_USERNAME, password: env.REDDIT_PASSWORD });
  const res = await request(http, limiter, TOKEN_URL, {
    method: 'POST',
    headers: { authorization: `Basic ${basic}`, 'user-agent': env.REDDIT_USER_AGENT, 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }, log);
  if (res.status !== 200) throw new Error(`token request failed with HTTP ${res.status} (check the app type is "script" and the credentials)`);
  const j = await res.json();
  if (typeof j?.access_token !== 'string') {
    const why = typeof j?.error === 'string' && /^[a-z_]{1,40}$/i.test(j.error) ? j.error : 'no access_token in response';
    throw new Error(`token request refused: ${why}`);
  }
  const ttl = Number.isFinite(j.expires_in) ? j.expires_in : 3600;
  return { value: j.access_token, expiresAt: now() + (ttl - 60) * 1000 };
}

function statusFrom(httpStatus, body) {
  const reason = typeof body?.reason === 'string' ? body.reason.toLowerCase() : '';
  if (reason === 'banned') return 'banned';
  if (reason === 'quarantined') return 'quarantined';
  if (reason === 'private') return 'private';
  if (httpStatus === 404) return 'not_found';
  if (httpStatus >= 300 && httpStatus < 400) return 'not_found'; // Reddit redirects unknown subs to search
  if (httpStatus === 403) return 'forbidden';
  if (httpStatus === 451) return 'unavailable_legal';
  return 'error';
}

async function scanSubreddit(sub, ctx) {
  const { http, limiter, auth, opts, log } = ctx;
  const byId = new Map();
  const perListing = {};
  for (const listing of opts.listings) {
    perListing[listing] = 0;
    let after = null;
    for (let page = 0; page < opts.pages; page += 1) {
      const token = await auth();
      const q = new URLSearchParams({ limit: String(opts.limit), raw_json: '1' });
      if (listing === 'top') q.set('t', opts.t);
      if (after) q.set('after', after);
      const url = `${API_BASE}/r/${encodeURIComponent(sub)}/${listing}?${q}`;
      const res = await request(http, limiter, url, { headers: { authorization: `bearer ${token}`, 'user-agent': ctx.userAgent } }, log);
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (res.status !== 200) return { status: statusFrom(res.status, body), httpStatus: res.status };
      if (body?.kind !== 'Listing') return { status: 'error', httpStatus: res.status, note: 'not a listing (redirected to search? check the name)' };
      const children = Array.isArray(body?.data?.children) ? body.data.children : [];
      for (const child of children) {
        if (child?.kind !== 't3') continue;
        const p = pickPost(child);
        if (p.stickied || !p.id) continue;
        perListing[listing] += 1;
        if (!byId.has(p.id)) byId.set(p.id, p);
      }
      after = typeof body?.data?.after === 'string' ? body.data.after : null;
      if (!after) break;
    }
  }
  const agg = aggregate([...byId.values()], { topN: opts.topN, sampleTitles: opts.sampleTitles, redact: opts.redact });
  return { status: 'ok', httpStatus: 200, listings: perListing, ...agg };
}

export async function run(opts, { http, sleep, now, env, log }) {
  checkDictionaries();
  const limiter = new Limiter({ minIntervalMs: opts.minInterval, sleep, now });
  let token = null;
  const auth = async () => {
    if (!token || now() >= token.expiresAt) token = await getToken({ env, http, limiter, now, log });
    return token.value;
  };
  const subs = {};
  for (const sub of opts.subs) {
    log(`r/${sub} …`);
    try {
      subs[sub] = await scanSubreddit(sub, { http, limiter, auth, opts, log, userAgent: env.REDDIT_USER_AGENT });
    } catch (e) {
      if (/token request/.test(e.message)) throw e;
      subs[sub] = { status: 'error', note: e.message };
    }
    const s = subs[sub];
    log(`  ${s.status}${s.status === 'ok' ? ` — ${s.posts} posts` : ''}`);
  }
  return {
    tool: 'reddit-pulse',
    version: 1,
    mode: opts.dryRun ? 'dry-run (fixture — not real Reddit data)' : 'live',
    generatedAt: new Date(now()).toISOString(),
    window: { listings: opts.listings.map((l) => (l === 'top' ? `top:${opts.t}` : l)), limit: opts.limit, pages: opts.pages },
    privacy: {
      readFields: ['id (dedupe, not stored)', 'title', 'score', 'num_comments', 'link_flair_text', 'domain', 'stickied', 'created_utc'],
      usernames: 'never read, never stored',
      bodies: 'never read (no selftext, no comments)',
      titles: opts.sampleTitles > 0 ? `up to ${opts.sampleTitles} per topic per subreddit, u/ mentions scrubbed` : 'not stored (aggregate counts only)',
      keywords: opts.redact ? 'redaction list applied' : 'raw — review for slurs/profanity before quoting anywhere',
    },
    sectors: SECTORS,
    summary: summarise(subs),
    subreddits: subs,
    requestTimestampsMs: opts.dryRun ? limiter.stamps : undefined,
  };
}

// ── Dry-run fixture (synthetic; every title is invented for testing and says so) ───────────────

const FIXTURE_AUTHOR = 'FIXTURE_AUTHOR_must_not_leak';
const FIXTURE_BODY = 'FIXTURE_BODY_must_not_leak';
const FIXTURE_TOKEN = 'FIXTURE_TOKEN_must_not_leak';

function fixturePost(id, title, extra = {}) {
  return {
    kind: 't3',
    data: {
      id, title, score: 100 + id.length * 7, num_comments: 12, link_flair_text: extra.flair ?? 'Politics',
      domain: extra.domain ?? 'self.fixture', stickied: extra.stickied ?? false, created_utc: 1788000000 + id.length * 3600,
      author: FIXTURE_AUTHOR, author_fullname: `t2_${FIXTURE_AUTHOR}`, selftext: FIXTURE_BODY,
    },
  };
}

const FIXTURE = {
  india: {
    top: [
      fixturePost('a1', '[FIXTURE] NEET re-exam announced after paper leak probe; students demand NTA overhaul', { flair: 'Education' }),
      fixturePost('a2', '[FIXTURE] Electoral bonds data: which parties got how much, by year', { domain: 'thehindu.com' }),
      fixturePost('a3', '[FIXTURE] Potholes again after the monsoon — where did the road budget go?', { flair: 'Policy/Economy' }),
      fixturePost('a4', '[FIXTURE] Mod announcement: weekly thread', { stickied: true }),
      fixturePost('a5', '[FIXTURE] u/someone says unemployment numbers are fine. Are they?', { flair: 'Policy/Economy' }),
    ],
    hot: [
      fixturePost('a1', '[FIXTURE] NEET re-exam announced after paper leak probe; students demand NTA overhaul', { flair: 'Education' }),
      fixturePost('a6', '[FIXTURE] UPI MDR explained: who pays the charge, merchant or customer?', { flair: 'Business/Finance' }),
    ],
  },
  IndiaSpeaks: {
    top: [
      fixturePost('b1', '[FIXTURE] Freebies vs tax: the salaried middle class pays for everything', { flair: '#Economy/Policy' }),
      fixturePost('b2', '[FIXTURE] Godi media or anti-national media? Both sides call the same anchor names', { flair: '#Politics' }),
      fixturePost('b3', '[FIXTURE] GST collections hit a record; states want a bigger share (tax devolution)', { domain: 'livemint.com' }),
    ],
    hot: [
      fixturePost('b4', '[FIXTURE] ED raids and the washing machine meme: what the conviction data says', { flair: '#Politics' }),
    ],
  },
  Chodi: 'banned',
};

function fixtureHttp() {
  let calls = 0;
  let served429 = false;
  const headers = (h) => ({ get: (k) => h[k.toLowerCase()] ?? null });
  return async (url, init = {}) => {
    calls += 1;
    const u = new URL(url);
    if (u.href === TOKEN_URL) {
      if (!String(init.headers?.authorization ?? '').startsWith('Basic ')) throw new Error('fixture: token call without basic auth');
      return { status: 200, headers: headers({}), json: async () => ({ access_token: FIXTURE_TOKEN, expires_in: 3600, token_type: 'bearer' }) };
    }
    const m = u.pathname.match(/^\/r\/([^/]+)\/(top|hot)$/);
    const rl = { 'x-ratelimit-remaining': String(Math.max(0, 600 - calls)), 'x-ratelimit-reset': '540', 'x-ratelimit-used': String(calls) };
    if (!m) return { status: 404, headers: headers(rl), json: async () => ({ message: 'Not Found', error: 404 }) };
    const [, sub, listing] = m;
    if (sub === 'IndiaSpeaks' && listing === 'hot' && !served429) {
      served429 = true;
      return { status: 429, headers: headers({ ...rl, 'retry-after': '3' }), json: async () => ({ message: 'Too Many Requests' }) };
    }
    const data = FIXTURE[decodeURIComponent(sub)];
    if (data === 'banned') return { status: 404, headers: headers(rl), json: async () => ({ reason: 'banned', message: 'Not Found', error: 404 }) };
    if (!data) return { status: 404, headers: headers(rl), json: async () => ({ message: 'Not Found', error: 404 }) };
    return { status: 200, headers: headers(rl), json: async () => ({ kind: 'Listing', data: { after: null, children: data[listing] ?? [] } }) };
  };
}

function selfCheck(out, opts) {
  const problems = [];
  const text = JSON.stringify(out);
  for (const secret of [FIXTURE_AUTHOR, FIXTURE_BODY, FIXTURE_TOKEN]) if (text.includes(secret)) problems.push(`output leaks ${secret}`);
  if (/\bu\/someone\b/i.test(text)) problems.push('output leaks a u/ mention');
  const stamps = out.requestTimestampsMs ?? [];
  for (let i = 1; i < stamps.length; i += 1) {
    if (stamps[i] - stamps[i - 1] < MIN_INTERVAL_FLOOR_MS) problems.push(`requests ${i - 1}→${i} only ${stamps[i] - stamps[i - 1]} ms apart`);
  }
  const s = out.subreddits;
  if (s.Chodi?.status !== 'banned') problems.push(`Chodi should be 'banned', got ${s.Chodi?.status}`);
  if (s.india?.status !== 'ok' || s.india.posts !== 5) problems.push(`india should have 5 unique non-stickied posts, got ${s.india?.posts}`);
  if (!s.india?.topics?.['exams-leaks']) problems.push('india: exams-leaks topic not detected');
  if (!s.india?.cases?.['neet-nta'] || !s.india?.cases?.['electoral-bonds']) problems.push('india: NEET / electoral-bonds cases not detected');
  if (!s.IndiaSpeaks?.cases?.['washing-machine']) problems.push('IndiaSpeaks: washing-machine case not detected (429 retry path?)');
  if (!s.IndiaSpeaks?.labels?.['godi-media'] || !s.IndiaSpeaks?.labels?.['anti-national']) problems.push('IndiaSpeaks: labels not detected');
  if (!out.summary?.topics?.length) problems.push('summary has no topics');
  if (opts.sampleTitles === 0 && /\[FIXTURE\]/.test(text)) problems.push('titles stored although --sample-titles=0');
  return problems;
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = {
    dryRun: false, subs: null, listings: ['top', 'hot'], t: 'month', limit: 100, pages: 1,
    minInterval: MIN_INTERVAL_FLOOR_MS, topN: 25, sampleTitles: 0, redactFile: process.env.REDDIT_PULSE_REDACT_FILE || null,
    out: null, help: false,
  };
  const intIn = (v, lo, hi, name) => {
    const n = Number.parseInt(v, 10);
    if (!Number.isInteger(n) || n < lo || n > hi) throw new Error(`${name} must be an integer ${lo}–${hi}`);
    return n;
  };
  for (const arg of argv) {
    const [k, v] = arg.includes('=') ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)] : [arg, undefined];
    switch (k) {
      case '--dry-run': opts.dryRun = true; break;
      case '--help': case '-h': opts.help = true; break;
      case '--subs': opts.subs = String(v ?? '').split(',').map((s) => s.trim().replace(/^r\//i, '')).filter(Boolean); break;
      case '--subs-file':
        opts.subs = fs.readFileSync(String(v), 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim().replace(/^r\//i, '')).filter(Boolean);
        break;
      case '--listings': opts.listings = String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean); break;
      case '--t': opts.t = String(v); break;
      case '--limit': opts.limit = intIn(v, 1, 100, '--limit'); break;
      case '--pages': opts.pages = intIn(v, 1, 10, '--pages'); break;
      case '--min-interval': opts.minInterval = Math.max(MIN_INTERVAL_FLOOR_MS, intIn(v, 0, 600000, '--min-interval')); break;
      case '--top-n': opts.topN = intIn(v, 1, 200, '--top-n'); break;
      case '--sample-titles': opts.sampleTitles = intIn(v, 0, 20, '--sample-titles'); break;
      case '--redact-file': opts.redactFile = String(v); break;
      case '--out': opts.out = String(v); break;
      default: throw new Error(`unknown option ${arg} (try --help)`);
    }
  }
  if (!opts.listings.length || opts.listings.some((l) => !['top', 'hot'].includes(l))) throw new Error('--listings must be top, hot or top,hot');
  if (!['hour', 'day', 'week', 'month', 'year', 'all'].includes(opts.t)) throw new Error('--t must be hour|day|week|month|year|all');
  opts.subs ??= opts.dryRun ? Object.keys(FIXTURE) : [...DEFAULT_SUBREDDITS];
  const badNames = opts.subs.filter((s) => !/^[A-Za-z0-9_]{2,21}$/.test(s));
  if (badNames.length) throw new Error(`not valid subreddit names: ${badNames.join(', ')}`);
  if (opts.redactFile) {
    const terms = new Set(fs.readFileSync(opts.redactFile, 'utf8').split('\n').map((l) => normalise(l)).filter(Boolean));
    opts.redact = (term) => (term.split(' ').some((w) => terms.has(w)) || terms.has(term) ? '[redacted]' : term);
  }
  return opts;
}

function usage() {
  const src = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n');
  const end = src.findIndex((l) => l.startsWith('import '));
  return src.slice(1, end).map((l) => l.replace(/^\/\/ ?/, '')).join('\n');
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`reddit-pulse: ${e.message}`);
    process.exit(2);
  }
  if (opts.help) {
    console.log(usage());
    return;
  }
  const log = (msg) => process.stderr.write(`${msg}\n`);

  let deps;
  if (opts.dryRun) {
    let clock = Date.UTC(2026, 8, 1);
    deps = {
      http: fixtureHttp(),
      sleep: async (ms) => { clock += ms; },
      now: () => clock,
      env: { REDDIT_CLIENT_ID: 'fixture-id', REDDIT_CLIENT_SECRET: 'fixture-secret', REDDIT_USERNAME: 'fixture', REDDIT_PASSWORD: 'fixture', REDDIT_USER_AGENT: 'script:hisaab-pulse:dry-run' },
      log,
    };
    log('reddit-pulse: DRY RUN — built-in fixture, fake clock, no network, no credentials read.');
  } else {
    const missing = missingEnv(process.env);
    if (missing.length) {
      console.error(`reddit-pulse: missing environment variables: ${missing.join(', ')} (values are never printed). See --help.`);
      process.exit(2);
    }
    const env = Object.fromEntries(ENV_KEYS.map((k) => [k, String(process.env[k]).trim()]));
    deps = {
      http: (url, init) => fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(30000) }),
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      now: () => Date.now(),
      env,
      log,
    };
    log(`reddit-pulse: live run over ${opts.subs.length} subreddits, ≥${opts.minInterval} ms between requests.`);
  }

  let out;
  try {
    out = await run(opts, deps);
  } catch (e) {
    console.error(`reddit-pulse: ${e.message}`);
    process.exit(1);
  }

  if (opts.dryRun) {
    const problems = selfCheck(out, opts);
    if (problems.length) {
      for (const p of problems) console.error(`  ✗ ${p}`);
      console.error(`reddit-pulse: dry run FAILED (${problems.length} problem${problems.length === 1 ? '' : 's'}).`);
      process.exitCode = 1;
    } else {
      log(`reddit-pulse: dry run OK — ${out.summary.posts} fixture posts, ${out.requestTimestampsMs.length} requests all ≥${MIN_INTERVAL_FLOOR_MS} ms apart, no author/body/token in output.`);
    }
  }

  const json = `${JSON.stringify(out, null, 2)}\n`;
  if (opts.out) {
    fs.writeFileSync(opts.out, json);
    log(`reddit-pulse: wrote ${opts.out}`);
  } else {
    process.stdout.write(json);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
