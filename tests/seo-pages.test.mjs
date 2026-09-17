/**
 * The static quiz pages: what a crawler and a reader with scripts off will see. These pages are the
 * one acquisition channel that can pay back, so they must be honest to the bank, deterministic
 * across builds, and free of anything the vocabulary gate forbids.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, ALL_QUESTIONS } from '../lib/server/bank.mjs';
import { ENABLED_DOMAINS } from '../lib/content.mjs';
import {
  BANNED,
  DEFAULT_BASE,
  INTENTS,
  PAGE_SIZE,
  UI,
  VERIFIED_ASOF,
  alternatesOf,
  eligible,
  intentBySlug,
  fallbackLine,
  fnv1a32,
  pageUrl,
  pickQuestions,
  questionText,
  selectQuestions,
  sitemapEntries,
} from '../lib/seo/intents.mjs';
import { buildFiles, escapeHtml, renderHub, renderPage, renderSitemap } from '../scripts/seo-pages.mjs';

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
const count = (text, needle) => text.split(needle).length - 1;
const jsonLdOf = (html) => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1, 'exactly one JSON-LD block');
  return JSON.parse(blocks[0][1]);
};
/** Everything the page prints, tags stripped. */
const visible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ');

/* ------------------------------------------------------------------------------ the intents */

test('the intent list covers every cluster the launch lane named, with the right sport and language', () => {
  const want = {
    'football-quiz-with-answers': ['Football', 'en'],
    'cricket-quiz-questions': ['Cricket', 'en'],
    'f1-quiz-2026': ['Formula 1', 'en'],
    'nba-quiz-hard': ['Basketball', 'en'],
    'mlb-quiz-questions': ['Baseball', 'en'],
    'ipl-quiz-2026': ['Cricket', 'en'],
    'fussball-quiz-fragen': ['Football', 'de'],
    'quiz-foot': ['Football', 'fr'],
    'indian-cricket-quiz': ['Cricket', 'en'],
    'cricket-quiz-hindi': ['Cricket', 'hi'],
    'ipl-quiz-hindi': ['Cricket', 'hi'],
    'bharat-cricket-quiz': ['Cricket', 'hi'],
  };
  for (const [slug, [topic, lang]] of Object.entries(want)) {
    const intent = INTENTS.find((i) => i.slug === slug);
    assert.ok(intent, slug);
    assert.equal(intent.topic, topic);
    assert.equal(intent.lang, lang);
    for (const k of ['title', 'h1', 'description', 'query']) assert.ok(typeof intent[k] === 'string' && intent[k].length > 0, `${slug}.${k}`);
    assert.ok(UI[intent.lang], `${slug}: chrome for ${intent.lang}`);
  }
  assert.equal(new Set(INTENTS.map((i) => i.slug)).size, INTENTS.length, 'slugs are unique');
  assert.ok(Object.isFrozen(INTENTS) && INTENTS.every(Object.isFrozen));
  for (const i of INTENTS) assert.match(i.slug, /^[a-z0-9-]+$/, i.slug);
});

test('no chrome string, title or description carries a banned word or an exclamation mark', () => {
  const strings = [];
  for (const ui of Object.values(UI)) for (const v of Object.values(ui)) if (typeof v === 'string') strings.push(v);
  for (const i of INTENTS) strings.push(i.title, i.h1, i.description, i.query, i.fallback ?? '');
  for (const s of strings) {
    assert.doesNotMatch(s, BANNED, s);
    assert.doesNotMatch(s, /!/, s);
  }
});

/* ---------------------------------------------------------------------------- the selection */

test('every intent yields exactly ten distinct served questions of its sport, none with a banned word', () => {
  for (const intent of INTENTS) {
    const ids = pickQuestions(intent, QUESTIONS);
    assert.equal(ids.length, PAGE_SIZE, intent.slug);
    assert.equal(new Set(ids).size, PAGE_SIZE, `${intent.slug}: distinct`);
    for (const id of ids) {
      const q = byId.get(id);
      assert.ok(q, `${intent.slug}: ${id} is served`);
      assert.equal(q.topic, intent.topic, `${intent.slug}: ${id} topic`);
      assert.ok(ENABLED_DOMAINS.includes(q.domain), `${intent.slug}: ${id} domain`);
      assert.doesNotMatch(questionText(q), BANNED, `${intent.slug}: ${id}`);
    }
  }
});

test('the bank does hold banned-word questions, and the selection skips them rather than rewriting them', () => {
  const tainted = QUESTIONS.filter((q) => BANNED.test(questionText(q)));
  assert.ok(tainted.length > 0, 'the guard has something to guard against');
  for (const q of tainted) for (const intent of INTENTS) assert.equal(eligible(intent, q), false, `${intent.slug}: ${q.id}`);
});

test('selection is deterministic across runs and across call order, and changes only with the seed', () => {
  for (const intent of INTENTS) {
    const a = pickQuestions(intent, QUESTIONS);
    const b = pickQuestions(intent, [...QUESTIONS].reverse());
    const c = pickQuestions(intent, QUESTIONS, { seed: '' });
    assert.deepEqual(a, b, `${intent.slug}: input order`);
    assert.deepEqual(a, c, `${intent.slug}: default seed`);
    const d = pickQuestions(intent, QUESTIONS, { seed: 'week-2' });
    assert.equal(d.length, PAGE_SIZE);
    assert.notDeepEqual(a, d, `${intent.slug}: a seed reshuffles`);
  }
  assert.equal(fnv1a32('a'), 0xe40c292c, 'FNV-1a reference vector');
});

test('a hidden-domain question never appears, even when it is the only match', () => {
  const hidden = ALL_QUESTIONS.filter((q) => !ENABLED_DOMAINS.includes(q.domain));
  assert.ok(hidden.length > 0, 'the repo carries hidden questions');
  const fake = { ...hidden[0], topic: 'Football', id: 'zz999', question: 'Football quiz: which club won the 2020 Champions League?' };
  const intent = INTENTS.find((i) => i.slug === 'football-quiz-with-answers');
  assert.equal(eligible(intent, fake), false);
  assert.ok(!pickQuestions(intent, [...QUESTIONS, fake]).includes('zz999'));
  const onlyHidden = selectQuestions(intent, [fake]);
  assert.deepEqual(onlyHidden.questions, []);
});

test('the IPL page fills from cricket when fewer than ten IPL questions exist, and says so', () => {
  const intent = INTENTS.find((i) => i.slug === 'ipl-quiz-2026');
  const sel = selectQuestions(intent, QUESTIONS);
  const exact = QUESTIONS.filter((q) => eligible(intent, q) && intent.match.test(questionText(q)));
  assert.equal(sel.matched, exact.length);
  assert.equal(sel.questions.length, PAGE_SIZE);
  const lead = Math.min(exact.length, PAGE_SIZE);
  // Exact hits lead the page; once the bank holds ten or more, the whole page is exact hits.
  assert.ok(sel.questions.slice(0, lead).every((q) => intent.match.test(questionText(q))), 'exact hits lead the page');
  if (exact.length < PAGE_SIZE) for (const q of exact) assert.ok(sel.questions.includes(q), `${q.id} is an exact hit and leads the page`);
  if (exact.length < PAGE_SIZE) {
    assert.equal(sel.filled, true);
    const line = fallbackLine(intent, sel);
    assert.match(line, /and more cricket/);
    assert.match(line, new RegExp(`\\b${exact.length}\\b`));
  } else {
    assert.equal(sel.filled, false);
    assert.equal(fallbackLine(intent, sel), null);
  }
});

test('a filter that matches nothing still yields ten questions of the sport and the honest line', () => {
  const intent = { ...INTENTS.find((i) => i.slug === 'ipl-quiz-2026'), match: /\bNO SUCH TOURNAMENT\b/ };
  const sel = selectQuestions(intent, QUESTIONS);
  assert.equal(sel.questions.length, PAGE_SIZE);
  assert.equal(sel.matched, 0);
  assert.equal(sel.filled, true);
  assert.equal(fallbackLine(intent, sel), intent.fallback.replaceAll('{n}', '0'));
});

test('the hard NBA page takes the top difficulty tier first', () => {
  const intent = INTENTS.find((i) => i.slug === 'nba-quiz-hard');
  const sel = selectQuestions(intent, QUESTIONS);
  const extreme = QUESTIONS.filter((q) => eligible(intent, q) && q.difficulty === 'extreme').length;
  const want = Math.min(PAGE_SIZE, extreme);
  assert.equal(sel.questions.filter((q) => q.difficulty === 'extreme').length, want);
  assert.ok(want >= 1);
});

/* -------------------------------------------------------------------------------- the pages */

test('every page is well formed: lang, one h1, canonical, Open Graph, ten details, valid JSON-LD with ten Questions', () => {
  for (const intent of INTENTS) {
    const sel = selectQuestions(intent, QUESTIONS);
    const html = renderPage(intent, sel);
    const url = pageUrl(DEFAULT_BASE, intent.slug);
    assert.ok(html.startsWith('<!doctype html>\n<html lang="' + intent.lang + '">'), `${intent.slug}: lang`);
    assert.equal(count(html, '<h1>'), 1, `${intent.slug}: one h1`);
    assert.equal(count(html, '</h1>'), 1);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${intent.slug}: canonical`);
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`), `${intent.slug}: og:url`);
    assert.ok(html.includes('<meta property="og:title"'), `${intent.slug}: og:title`);
    assert.ok(html.includes('<meta name="description"'), `${intent.slug}: description`);
    assert.ok(html.includes('<meta name="viewport"'), `${intent.slug}: viewport`);
    assert.equal(count(html, '<details>'), PAGE_SIZE, `${intent.slug}: details`);
    assert.equal(count(html, '</details>'), PAGE_SIZE, `${intent.slug}: details closed`);
    assert.equal(count(html, '<summary>'), PAGE_SIZE);
    assert.equal(count(html, '<ol class="opts" type="A">'), PAGE_SIZE);
    const ld = jsonLdOf(html);
    assert.equal(ld['@type'], 'Quiz');
    assert.equal(ld.url, url);
    assert.equal(ld.hasPart.length, PAGE_SIZE);
    for (const [i, part] of ld.hasPart.entries()) {
      const q = sel.questions[i];
      assert.equal(part['@type'], 'Question');
      assert.equal(part.name, q.question);
      assert.equal(part.suggestedAnswer.length, 4);
      assert.equal(part.acceptedAnswer.text, q.options[q.correctIndex]);
      assert.equal(part.acceptedAnswer.citation, q.sourceUrl);
    }
    // Every question, its correct option and its source link are in the HTML, in page order.
    let cursor = 0;
    for (const q of sel.questions) {
      const at = html.indexOf(escapeHtml(q.question), cursor);
      assert.ok(at > cursor, `${intent.slug}: ${q.id} in order`);
      cursor = at;
      assert.ok(html.includes(`href="${escapeHtml(q.sourceUrl)}"`), `${intent.slug}: ${q.id} source link`);
    }
    // The answers are plain HTML, not behind JS: the only script is the JSON-LD data block.
    assert.equal(count(html, '<script'), 1, `${intent.slug}: no scripts`);
    assert.equal(count(html, '<script type="application/ld+json">'), 1);
    assert.ok(!/<link[^>]+href="https?:\/\/(?!occult-kranti\.github\.io\/fact-duel\/)/.test(html), `${intent.slug}: no external stylesheet`);
    assert.ok(!/<img\b/.test(html), `${intent.slug}: no image requests`);
    assert.ok(!/@import|url\(https?:/.test(html), `${intent.slug}: no CSS fetches`);
    // The CTA into the game, the footer line and the links to the other pages.
    assert.ok(html.includes(`<a class="cta" href="${DEFAULT_BASE}/">${UI[intent.lang].play}`), `${intent.slug}: CTA`);
    assert.ok(html.includes(UI[intent.lang].reviewed), `${intent.slug}: footer`);
    for (const other of INTENTS) if (other.slug !== intent.slug) assert.ok(html.includes(`href="${pageUrl(DEFAULT_BASE, other.slug)}"`), `${intent.slug} links ${other.slug}`);
    assert.ok(html.includes(`href="${pageUrl(DEFAULT_BASE, '')}"`), `${intent.slug}: hub link`);
    assert.ok(html.includes(VERIFIED_ASOF.slice(0, 4)), `${intent.slug}: dated`);
    // Vocabulary gate over the whole printed surface, chrome and questions alike.
    assert.doesNotMatch(visible(html), BANNED, intent.slug);
  }
});

test('the German, French and Hindi pages say the questions are in English, in their own language; English pages do not', () => {
  for (const intent of INTENTS) {
    const html = renderPage(intent, selectQuestions(intent, QUESTIONS));
    if (intent.lang === 'de') {
      assert.ok(html.includes('<html lang="de">'));
      assert.ok(html.includes('Die Fragen sind auf Englisch.'), intent.slug);
      assert.ok(html.includes('Antwort anzeigen'));
    } else if (intent.lang === 'fr') {
      assert.ok(html.includes('<html lang="fr">'));
      assert.ok(html.includes('Les questions sont en anglais.'), intent.slug);
      assert.ok(html.includes('Voir la réponse'));
    } else if (intent.lang === 'hi') {
      assert.ok(html.includes('<html lang="hi">'), intent.slug);
      assert.ok(html.includes('सवाल फ़िलहाल अंग्रेज़ी में हैं।'), `${intent.slug}: the honest line`);
      assert.ok(html.includes('जवाब देखें'), intent.slug);
      assert.ok(html.includes('Jaanta Hai Kya · क्रिकेट'), `${intent.slug}: kicker names the sport in Hindi`);
    } else {
      assert.ok(html.includes('<html lang="en">'));
      assert.ok(html.includes('Show the answer'));
      assert.ok(!html.includes('Englisch') && !html.includes('anglais') && !html.includes('अंग्रेज़ी'));
    }
  }
});

test('the Hindi intents: three pages, Devanagari titles, Latin digits, no exclamation mark, and the questions untouched', () => {
  const hindi = INTENTS.filter((i) => i.lang === 'hi');
  assert.deepEqual(
    hindi.map((i) => i.slug),
    ['cricket-quiz-hindi', 'ipl-quiz-hindi', 'bharat-cricket-quiz'],
  );
  assert.equal(intentBySlug('cricket-quiz-hindi').title, 'क्रिकेट क्विज़ — जवाब के साथ');
  for (const intent of hindi) {
    for (const k of ['title', 'h1', 'description', 'query']) {
      assert.match(intent[k], /[\u0900-\u097F]/, `${intent.slug}.${k} is Devanagari`);
      assert.doesNotMatch(intent[k], /[\u0966-\u096F]/, `${intent.slug}.${k} keeps Latin digits`);
      assert.doesNotMatch(intent[k], /!/, `${intent.slug}.${k}`);
    }
    assert.match(intent.description, /अंग्रेज़ी/, `${intent.slug}: the description says the questions are English`);
    const sel = selectQuestions(intent, QUESTIONS);
    const html = renderPage(intent, sel);
    for (const q of sel.questions) assert.ok(html.includes(escapeHtml(q.question)), `${intent.slug}: ${q.id} verbatim`);
    assert.doesNotMatch(visible(html), /[\u0966-\u096F]/, `${intent.slug}: no Devanagari digits anywhere`);
    assert.ok(html.includes('16 सितंबर 2026'), `${intent.slug}: the verification date in Hindi`);
    assert.ok(html.includes('font-family:\'Noto Sans Devanagari\''), `${intent.slug}: Devanagari font stack`);
    assert.ok(!/<link[^>]+fonts\.googleapis/.test(html), `${intent.slug}: still no external request`);
  }
  for (const v of Object.values(UI.hi)) if (typeof v === 'string') assert.doesNotMatch(v, /सट्टा|जुआ|दांव|दाँव/, v);
});

test('an English page and its Hindi twin carry matching hreflang alternates, with x-default on the English side', () => {
  const pairs = [
    ['cricket-quiz-questions', 'cricket-quiz-hindi'],
    ['ipl-quiz-2026', 'ipl-quiz-hindi'],
    ['indian-cricket-quiz', 'bharat-cricket-quiz'],
  ];
  for (const [enSlug, hiSlug] of pairs) {
    const en = intentBySlug(enSlug);
    const hi = intentBySlug(hiSlug);
    assert.equal(en.alternate, hiSlug);
    assert.equal(hi.alternate, enSlug);
    const want = [
      { hreflang: 'en', href: pageUrl(DEFAULT_BASE, enSlug) },
      { hreflang: 'hi', href: pageUrl(DEFAULT_BASE, hiSlug) },
      { hreflang: 'x-default', href: pageUrl(DEFAULT_BASE, enSlug) },
    ];
    assert.deepEqual(alternatesOf(en, DEFAULT_BASE), want, `${enSlug} alternates`);
    assert.deepEqual(alternatesOf(hi, DEFAULT_BASE), want, `${hiSlug} alternates`);
    for (const intent of [en, hi]) {
      const html = renderPage(intent, selectQuestions(intent, QUESTIONS));
      for (const a of want) assert.ok(html.includes(`<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}">`), `${intent.slug}: ${a.hreflang}`);
    }
  }
  const lone = intentBySlug('football-quiz-with-answers');
  assert.deepEqual(alternatesOf(lone, DEFAULT_BASE), [{ hreflang: 'en', href: pageUrl(DEFAULT_BASE, lone.slug) }]);
  const html = renderPage(lone, selectQuestions(lone, QUESTIONS));
  assert.equal(count(html, 'hreflang="x-default"'), 0);
  assert.equal(intentBySlug('nope'), null);
});

test('the Indian cricket pages take the India-region bank first, in both languages, and stay deterministic', () => {
  for (const slug of ['indian-cricket-quiz', 'bharat-cricket-quiz']) {
    const intent = intentBySlug(slug);
    assert.equal(intent.preferRegion, 'India');
    const sel = selectQuestions(intent, QUESTIONS);
    const india = QUESTIONS.filter((q) => eligible(intent, q) && q.region === 'India').length;
    assert.ok(india >= PAGE_SIZE, 'the bank holds an Indian cricket tranche');
    assert.equal(sel.questions.filter((q) => q.region === 'India').length, PAGE_SIZE, `${slug}: all ten from India`);
    assert.deepEqual(pickQuestions(intent, QUESTIONS), pickQuestions(intent, [...QUESTIONS].reverse()), `${slug}: order-independent`);
  }
  // The field is what does it: pointing it at the Global tranche fills the page from there instead.
  const global = { ...intentBySlug('indian-cricket-quiz'), preferRegion: 'Global' };
  assert.equal(selectQuestions(global, QUESTIONS).questions.filter((q) => q.region === 'Global').length, PAGE_SIZE);
});

test('the fallback line is printed on the two IPL pages and on no other', () => {
  for (const intent of INTENTS) {
    const sel = selectQuestions(intent, QUESTIONS);
    const html = renderPage(intent, sel);
    const line = fallbackLine(intent, sel);
    if (intent.slug === 'ipl-quiz-2026' && sel.filled) assert.ok(html.includes('and more cricket'), intent.slug);
    else if (intent.slug === 'ipl-quiz-hindi' && sel.filled) assert.ok(html.includes('और बाकी क्रिकेट'), intent.slug);
    else assert.equal(line, null, intent.slug);
  }
});

test('HTML special characters in questions are escaped, and JSON-LD cannot close its own script tag', () => {
  const intent = INTENTS[0];
  const q = {
    ...QUESTIONS.find((x) => x.topic === intent.topic),
    id: 'zz001',
    question: 'Tom & Jerry <b>"quoted"</b> \'single\'?',
    options: ['</script><script>alert(1)</script>', 'b & c', '<i>', '"d"'],
    correctIndex: 0,
    explanation: 'x </script> y',
    sourceUrl: 'https://example.org/?a=1&b=2',
  };
  const sel = { questions: Array(PAGE_SIZE).fill(q), matched: PAGE_SIZE, filled: false };
  const html = renderPage(intent, sel);
  const markup = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  assert.ok(!markup.includes('<script>alert'), 'option escaped in the markup');
  assert.ok(!markup.includes('</script>'), 'no script closer outside the data block');
  assert.ok(html.includes('Tom &amp; Jerry &lt;b&gt;&quot;quoted&quot;&lt;/b&gt; &#39;single&#39;?'));
  assert.ok(html.includes('href="https://example.org/?a=1&amp;b=2"'));
  const ld = jsonLdOf(html);
  assert.equal(ld.hasPart[0].suggestedAnswer[0].text, '</script><script>alert(1)</script>');
  assert.equal(count(html, '</script>'), 1, 'the data block is the only closer');
});

test('the base URL comes from SITE_BASE and a trailing slash is tolerated', () => {
  const intent = INTENTS[0];
  const sel = selectQuestions(intent, QUESTIONS);
  const a = renderPage(intent, sel, { base: 'https://example.com/' });
  const b = renderPage(intent, sel, { base: 'https://example.com' });
  assert.equal(a, b);
  assert.ok(a.includes('<link rel="canonical" href="https://example.com/quiz/football-quiz-with-answers/">'));
  assert.ok(a.includes('<a class="cta" href="https://example.com/">'));
  assert.ok(!a.includes('occult-kranti'));
});

/* ------------------------------------------------------------------------- hub and sitemap */

test('the hub links every page, once each, and is itself well formed', () => {
  const html = renderHub();
  assert.equal(count(html, '<h1>'), 1);
  assert.ok(html.includes(`<link rel="canonical" href="${pageUrl(DEFAULT_BASE, '')}">`));
  for (const i of INTENTS) assert.equal(count(html, `href="${pageUrl(DEFAULT_BASE, i.slug)}"`), 1, i.slug);
  const ld = jsonLdOf(html);
  assert.equal(ld['@type'], 'CollectionPage');
  assert.equal(ld.hasPart.length, INTENTS.length);
  assert.doesNotMatch(visible(html), BANNED);
  assert.equal(count(html, '<script'), 1);
});

test('the sitemap lists the hub and every page, with the bank date as lastmod', () => {
  const entries = sitemapEntries(INTENTS, DEFAULT_BASE);
  assert.equal(entries.length, INTENTS.length + 1);
  assert.equal(entries[0].loc, `${DEFAULT_BASE}/quiz/`);
  for (const i of INTENTS) assert.ok(entries.some((e) => e.loc === pageUrl(DEFAULT_BASE, i.slug)), i.slug);
  for (const e of entries) assert.equal(e.lastmod, VERIFIED_ASOF);
  const xml = renderSitemap();
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.equal(count(xml, '<url>'), INTENTS.length + 1);
  for (const e of entries) assert.ok(xml.includes(`<loc>${e.loc}</loc>`), e.loc);
  assert.equal(count(xml, '<urlset'), 1);
  assert.equal(count(xml, '</urlset>'), 1);
  // The paired pages repeat their hreflang alternates in the sitemap; the others carry none.
  assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  const paired = INTENTS.filter((i) => i.alternate);
  assert.equal(paired.length, 6);
  assert.equal(count(xml, 'hreflang="x-default"'), paired.length);
  assert.equal(count(xml, 'hreflang="hi"'), paired.length);
  for (const e of entries) {
    const intent = INTENTS.find((i) => pageUrl(DEFAULT_BASE, i.slug) === e.loc);
    if (intent?.alternate) assert.equal(e.alternates.length, 3, e.loc);
    else assert.equal(e.alternates, undefined, e.loc);
  }
});

test('the build produces one file per page plus the hub and the sitemap, byte-identical on repeat', () => {
  const a = buildFiles();
  const b = buildFiles();
  assert.deepEqual(Object.keys(a.files).sort(), [...INTENTS.map((i) => `${i.slug}/index.html`), 'index.html', 'sitemap.xml'].sort());
  assert.deepEqual(a.files, b.files);
  assert.equal(a.report.length, INTENTS.length);
  for (const r of a.report) assert.ok(r.matched >= 0);
  assert.throws(() => buildFiles({ questions: QUESTIONS.slice(0, 5) }), /need 10/);
});
