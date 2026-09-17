/**
 * scripts/seo-pages.mjs — the crawlable quiz pages, generated from the served bank.
 *
 *   pnpm seo:pages                      # writes public/quiz/**, served at <site>/quiz/ by build:static
 *   SITE_BASE=https://example.com pnpm seo:pages
 *
 * One static, no-login HTML page per intent in lib/seo/intents.mjs, plus a hub and a sitemap. Each
 * page shows ten real questions from lib/server/bank.mjs QUESTIONS (the served bank, so a hidden
 * domain can never appear), the four options, and the answer with its source under a native
 * <details> element — visible to a crawler and to a reader with scripts off. Inline CSS only, no
 * scripts, no external requests. Run before `pnpm build:static`; the vite static config emits
 * everything under public/ except public/product, so the output lands at /quiz/... unchanged.
 *
 * The output directory is generated and git-ignored. Regenerate, never hand-edit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { QUESTIONS } from '../lib/server/bank.mjs';
import {
  DEFAULT_BASE,
  INTENTS,
  PAGE_SIZE,
  UI,
  VERIFIED_ASOF,
  alternatesOf,
  fallbackLine,
  pageUrl,
  selectQuestions,
  sitemapEntries,
} from '../lib/seo/intents.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT_DIR = path.join(repoRoot, 'public', 'quiz');

/** Strip a trailing slash so `${base}/quiz/` is always exactly one slash. */
export const normaliseBase = (base) => String(base ?? DEFAULT_BASE).replace(/\/+$/, '');

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** JSON-LD sits inside a script element: `</` must not be able to close it early. */
const jsonLd = (value) => JSON.stringify(value).replaceAll('</', '<\\/');

/** Two-digit day, month name, year, in the page language. Deterministic; no locale data needed. */
export function longDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
  }[lang];
  return lang === 'de' ? `${d}. ${months[m - 1]} ${y}` : `${d} ${months[m - 1]} ${y}`;
}

const TIER_LABEL = {
  en: { simple: 'simple', expert: 'expert', extreme: 'extreme' },
  de: { simple: 'einfach', expert: 'Experte', extreme: 'extrem' },
  fr: { simple: 'simple', expert: 'expert', extreme: 'extrême' },
  hi: { simple: 'आसान', expert: 'एक्सपर्ट', extreme: 'एक्सट्रीम' },
};

/* The Hindi pages rely on the reader's Devanagari system face (the app links Noto Sans Devanagari
   at runtime; these pages make no external request at all), so the font stack names the common
   ones first and lets the system fall through. */
const HI_FONT = "'Noto Sans Devanagari','Mukta','Nirmala UI',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/* ------------------------------------------------------------------------------------------ CSS */

const CSS = `
:root{color-scheme:light dark;--bg:#f6f7f9;--fg:#111418;--muted:#5b6470;--card:#fff;--line:#d9dee5;--accent:#0b5fff;--ok:#0a7a3d}
@media(prefers-color-scheme:dark){:root{--bg:#0a0e14;--fg:#e8ecf1;--muted:#98a2ae;--card:#131a23;--line:#243040;--accent:#7fb0ff;--ok:#5ad38a}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{max-width:720px;margin:0 auto;padding:24px 16px 48px}
header p.kicker{margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
h1{font-size:clamp(28px,6vw,40px);line-height:1.1;margin:0 0 12px}
h2{font-size:20px;margin:32px 0 8px}
p{margin:0 0 12px}
a{color:var(--accent)}
.note{color:var(--muted);font-size:14px}
.cta{display:block;margin:20px 0;padding:14px 18px;border-radius:12px;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;text-align:center}
.cta small{display:block;font-weight:400;opacity:.9;font-size:14px;margin-top:2px}
ol.quiz{list-style:none;padding:0;margin:16px 0;counter-reset:q}
ol.quiz>li{counter-increment:q;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 12px}
ol.quiz>li>p.q{font-weight:600;margin:0 0 8px}
ol.quiz>li>p.q::before{content:counter(q) ". ";color:var(--muted)}
ol.opts{margin:0 0 8px;padding-left:28px}
ol.opts li{margin:2px 0}
details{border-top:1px solid var(--line);padding-top:8px;margin-top:8px}
summary{cursor:pointer;font-weight:600;color:var(--accent)}
details p{margin:8px 0 0}
.ok{color:var(--ok);font-weight:600}
.meta{font-size:13px;color:var(--muted)}
ul.more{padding-left:20px}
footer{margin-top:32px;border-top:1px solid var(--line);padding-top:16px;font-size:14px;color:var(--muted)}
`.trim();

/* ---------------------------------------------------------------------------------- one page */

function head({ lang, title, description, url, base, locale, siteName, alternates = [] }) {
  const hreflang = alternates
    .map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${escapeHtml(a.href)}">`)
    .join('\n');
  const font = lang === 'hi' ? `<style>body{font-family:${HI_FONT};line-height:1.6}</style>` : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${escapeHtml(url)}">
${hreflang}
<link rel="icon" type="image/svg+xml" href="${escapeHtml(base)}/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(siteName)}">
<meta property="og:locale" content="${locale}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(base)}/brand/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<link rel="icon" type="image/svg+xml" href="${escapeHtml(base)}/favicon.svg">
<meta name="twitter:card" content="summary_large_image">
<style>${CSS}</style>${font}
</head>`;
}

function quizSchema(intent, questions, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: intent.title,
    description: intent.description,
    url,
    inLanguage: 'en',
    about: intent.topic,
    dateModified: VERIFIED_ASOF,
    publisher: { '@type': 'Organization', name: UI.en.siteName },
    hasPart: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      eduQuestionType: 'Multiple choice',
      learningResourceType: 'Quiz question',
      suggestedAnswer: q.options.map((text) => ({ '@type': 'Answer', text })),
      acceptedAnswer: { '@type': 'Answer', text: q.options[q.correctIndex], citation: q.sourceUrl },
    })),
  };
}

function otherPages(current, base, ui) {
  const items = INTENTS.filter((i) => i.slug !== current)
    .map((i) => `<li><a href="${escapeHtml(pageUrl(base, i.slug))}" hreflang="${i.lang}">${escapeHtml(i.h1)}</a></li>`)
    .join('\n');
  return `<h2>${escapeHtml(ui.more)}</h2>
<ul class="more">
${items}
<li><a href="${escapeHtml(pageUrl(base, ''))}">${escapeHtml(ui.hub)}</a></li>
</ul>`;
}

function questionItem(q, ui, lang) {
  const opts = q.options.map((o) => `<li>${escapeHtml(o)}</li>`).join('');
  return `<li>
<p class="q">${escapeHtml(q.question)}</p>
<ol class="opts" type="A">${opts}</ol>
<details>
<summary>${escapeHtml(ui.showAnswer)}</summary>
<p><span class="ok">${escapeHtml(ui.correct)}: ${escapeHtml(q.options[q.correctIndex])}</span></p>
<p>${escapeHtml(q.explanation)}</p>
<p class="meta">${escapeHtml(ui.source)}: <a href="${escapeHtml(q.sourceUrl)}" rel="nofollow noopener">${escapeHtml(q.sourceLabel)}</a> · ${escapeHtml(ui.difficulty)}: ${escapeHtml(TIER_LABEL[lang][q.difficulty] ?? q.difficulty)}</p>
</details>
</li>`;
}

/**
 * Render one intent page. `selection` is the result of selectQuestions; pass it in so the tests
 * and the build see the same choice.
 */
export function renderPage(intent, selection, { base = DEFAULT_BASE } = {}) {
  base = normaliseBase(base);
  const ui = UI[intent.lang];
  const url = pageUrl(base, intent.slug);
  const { questions } = selection;
  const fallback = fallbackLine(intent, selection);
  const intro = [
    `<p>${escapeHtml(intent.description)}</p>`,
    fallback ? `<p class="note">${escapeHtml(fallback)}</p>` : '',
    ui.inEnglish ? `<p class="note"><strong>${escapeHtml(ui.inEnglish)}</strong></p>` : '',
    `<p class="note">${escapeHtml(ui.verified)} ${escapeHtml(longDate(VERIFIED_ASOF, intent.lang))}.</p>`,
  ]
    .filter(Boolean)
    .join('\n');
  const cta = `<a class="cta" href="${escapeHtml(base)}/">${escapeHtml(ui.play)}<small>${escapeHtml(ui.playHint)}</small></a>`;
  const topicName = ui.topics?.[intent.topic] ?? intent.topic;
  return `${head({
    lang: intent.lang,
    title: intent.title,
    description: intent.description,
    url,
    base,
    locale: ui.locale,
    siteName: ui.siteName,
    alternates: alternatesOf(intent, base),
  })}
<body>
<main>
<header>
<p class="kicker">${escapeHtml(ui.siteName)} · ${escapeHtml(topicName)}</p>
<h1>${escapeHtml(intent.h1)}</h1>
${intro}
</header>
${cta}
<ol class="quiz">
${questions.map((q) => questionItem(q, ui, intent.lang)).join('\n')}
</ol>
${cta}
${otherPages(intent.slug, base, ui)}
<footer>
<p>${escapeHtml(ui.reviewed)}</p>
</footer>
</main>
<script type="application/ld+json">${jsonLd(quizSchema(intent, questions, url))}</script>
</body>
</html>
`;
}

/* -------------------------------------------------------------------------------------- the hub */

export function renderHub({ base = DEFAULT_BASE } = {}) {
  base = normaliseBase(base);
  const ui = UI.en;
  const url = pageUrl(base, '');
  const items = INTENTS.map(
    (i) =>
      `<li><a href="${escapeHtml(pageUrl(base, i.slug))}" hreflang="${i.lang}">${escapeHtml(i.h1)}</a><br><span class="note">${escapeHtml(i.description)}</span></li>`,
  ).join('\n');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: ui.hubTitle,
    url,
    hasPart: INTENTS.map((i) => ({ '@type': 'Quiz', name: i.title, url: pageUrl(base, i.slug) })),
  };
  return `${head({ lang: 'en', title: `${ui.hubTitle} | ${ui.siteName}`, description: ui.hubIntro, url, base, locale: ui.locale, siteName: ui.siteName })}
<body>
<main>
<header>
<p class="kicker">${escapeHtml(ui.siteName)}</p>
<h1>${escapeHtml(ui.hubTitle)}</h1>
<p>${escapeHtml(ui.hubIntro)}</p>
<p class="note">${escapeHtml(ui.verified)} ${escapeHtml(longDate(VERIFIED_ASOF, 'en'))}.</p>
</header>
<ul class="more">
${items}
</ul>
<a class="cta" href="${escapeHtml(base)}/">${escapeHtml(ui.play)}<small>${escapeHtml(ui.playHint)}</small></a>
<footer>
<p>${escapeHtml(ui.reviewed)}</p>
</footer>
</main>
<script type="application/ld+json">${jsonLd(schema)}</script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------------------------- the sitemap */

export function renderSitemap({ base = DEFAULT_BASE } = {}) {
  const rows = sitemapEntries(INTENTS, normaliseBase(base))
    .map((e) => {
      const links = (e.alternates ?? [])
        .map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escapeHtml(a.href)}"/>`)
        .join('');
      return `  <url><loc>${escapeHtml(e.loc)}</loc><lastmod>${e.lastmod}</lastmod>${links}</url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows}\n</urlset>\n`;
}

/* ------------------------------------------------------------------------------------- the build */

/** Every file the build writes, as `{ relativePath: contents }`, without touching the disk. */
export function buildFiles({ base = DEFAULT_BASE, questions = QUESTIONS } = {}) {
  const files = {};
  const report = [];
  for (const intent of INTENTS) {
    const selection = selectQuestions(intent, questions);
    if (selection.questions.length !== PAGE_SIZE)
      throw new Error(`${intent.slug}: only ${selection.questions.length} eligible ${intent.topic} questions, need ${PAGE_SIZE}`);
    files[`${intent.slug}/index.html`] = renderPage(intent, selection, { base });
    report.push({ slug: intent.slug, lang: intent.lang, topic: intent.topic, matched: selection.matched, filled: selection.filled });
  }
  files['index.html'] = renderHub({ base });
  files['sitemap.xml'] = renderSitemap({ base });
  return { files, report };
}

export function writePages({ base = DEFAULT_BASE, outDir = OUT_DIR } = {}) {
  const { files, report } = buildFiles({ base });
  fs.rmSync(outDir, { recursive: true, force: true });
  for (const [rel, contents] of Object.entries(files)) {
    const file = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
  return { files: Object.keys(files), report };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = normaliseBase(process.env.SITE_BASE);
  const { files, report } = writePages({ base });
  console.log(`Wrote ${files.length} files to ${path.relative(repoRoot, OUT_DIR)}/ for ${base}`);
  for (const r of report)
    console.log(`  /quiz/${r.slug}/  ${r.lang}  ${r.topic}${r.filled ? `  (${r.matched} exact hits, topped up from ${r.topic})` : ''}`);
}
