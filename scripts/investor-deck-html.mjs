/* Render the fact-checked deck plan into a single reading page. Content comes from deck-plan.json
   verbatim so no number is retyped; only the presentation is authored here. */
import { readFileSync, writeFileSync } from 'node:fs';

const plan = JSON.parse(readFileSync('public/product/investor/deck-plan.json', 'utf8'));
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Mark money, plan-flags and multipliers so figures read as data, not prose.
const marks = (s) =>
  esc(s)
    .replace(/\(P\)/g, '<b class="p">(P)</b>')
    .replace(/(\$[\d,.]+(?:bn|M|K|k)?)/g, '<b class="num">$1</b>')
    .replace(/(\b\d[\d,.]*(?:%|×|x\b))/g, '<b class="num">$1</b>');

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};

const core = plan.slides.filter((s) => s.n <= 14);
const appendix = plan.slides.filter((s) => s.n > 14);
const APPENDIX_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const label = (s) => (s.n <= 14 ? String(s.n).padStart(2, '0') : (APPENDIX_LETTERS[s.n - 15] ?? String(s.n)));

const section = (s) => {
  const parts = [];
  parts.push(`<section class="slide" id="s${s.n}">`);
  parts.push(`<div class="rail"><span class="rail-n">${esc(label(s))}</span></div>`);
  parts.push('<div class="slide-body">');
  if (s.kicker) parts.push(`<p class="kicker">${esc(s.kicker)}</p>`);
  parts.push(`<h2>${esc(s.title)}</h2>`);
  if (s.n === 1 && plan.deck.subtitle) parts.push(`<p class="lede">${esc(plan.deck.subtitle)}</p>`);
  if (s.body?.length) {
    parts.push('<ul class="points">');
    for (const b of s.body) parts.push(`<li>${marks(b)}</li>`);
    parts.push('</ul>');
  }
  if (s.chart) {
    parts.push(
      `<figure class="chart"><img src="charts/${esc(s.chart)}.png" alt="${esc(s.title)}" loading="lazy" width="2000" height="1200"></figure>`,
    );
  }
  if (s.image) {
    const file = s.image.split('/').pop();
    parts.push(
      `<figure class="shot"><img src="shots/${esc(file)}" alt="FACT//DUEL screen" loading="lazy"></figure>`,
    );
  }
  if (s.table) {
    parts.push('<div class="table-wrap"><table><thead><tr>');
    for (const h of s.table.headers) parts.push(`<th>${esc(h)}</th>`);
    parts.push('</tr></thead><tbody>');
    for (const row of s.table.rows) {
      parts.push('<tr>');
      for (const cell of row) parts.push(`<td>${marks(cell)}</td>`);
      parts.push('</tr>');
    }
    parts.push('</tbody></table></div>');
  }
  if (s.notes) {
    parts.push(
      `<details class="notes"><summary>Speaker notes</summary><div class="notes-body">${marks(s.notes)}</div></details>`,
    );
  }
  if (s.sources?.length) {
    parts.push('<ul class="sources">');
    for (const u of s.sources)
      parts.push(
        `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(host(u))}</a></li>`,
      );
    parts.push('</ul>');
  }
  parts.push('</div></section>');
  return parts.join('\n');
};

const nav = plan.slides
  .map((s) => `<a href="#s${s.n}"><span>${esc(label(s))}</span>${esc(s.kicker || s.title.slice(0, 30))}</a>`)
  .join('\n');

// Two font sources, chosen by where the page will live. On the published site the repository's own
// woff2 files sit one directory up, so the page has no external dependency at all; a standalone copy
// (e.g. an artifact host) has no such files and falls back to Google Fonts.
const SELF_HOSTED = process.argv.includes('--self-hosted');
const fontHead = SELF_HOSTED
  ? `<link rel="icon" href="../favicon.svg">
<link rel="preload" as="font" type="font/woff2" crossorigin href="../fonts/bricolage-grotesque-latin-normal-500-800.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="../fonts/instrument-sans-latin-normal-400-700.woff2">
<link rel="stylesheet" href="../fonts/fonts.css">`
  : `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap">`;

const html = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>FACT//DUEL Seed Round</title>
${fontHead}
<style>
/* One committed dark identity: the product's own Floodlight palette, and the charts are dark-ground
   images that would fight a light page. Every colour is painted explicitly. */
:root{
  --ground:#0a0e14; --panel:#121821; --raised:#19212c; --line:#27303d;
  --text:#f7f6ef; --muted:#a3abb8; --dim:#6f7987;
  --volt:#d4ff3a; --gold:#ffc83d; --cyan:#4ee1ff; --ember:#ff7a2f; --magenta:#ff5ea8;
  --display:"Bricolage Grotesque","Archivo Black",system-ui,sans-serif;
  --ui:"Instrument Sans",system-ui,-apple-system,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace;
  color-scheme:dark;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--text);font-family:var(--ui);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--volt)}
img{max-width:100%;height:auto;display:block}

.shell{display:grid;grid-template-columns:1fr;gap:0}
@media (min-width:1080px){ .shell{grid-template-columns:216px minmax(0,1fr);} }

/* Contents rail: a deck has a reading order, so the numbering is the structure, not decoration. */
.toc{display:none}
@media (min-width:1080px){
  .toc{display:block;position:sticky;top:0;align-self:start;height:100dvh;overflow-y:auto;padding:28px 0 28px 24px;border-right:1px solid var(--line);background:var(--ground)}
  .toc h1{font-family:var(--display);font-size:19px;letter-spacing:-.02em;margin:0 0 4px}
  .toc .sub{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:.1em;text-transform:uppercase;margin:0 0 20px}
  .toc a{display:grid;grid-template-columns:26px 1fr;gap:8px;align-items:baseline;padding:5px 12px 5px 0;color:var(--muted);text-decoration:none;font-size:11.5px;line-height:1.35;border-left:2px solid transparent}
  .toc a span{font-family:var(--mono);font-size:10px;color:var(--dim)}
  .toc a:hover{color:var(--text);border-left-color:var(--volt)}
  .toc a:hover span{color:var(--volt)}
}
main{padding-block:0;padding-inline:max(16px,4vw);max-width:1000px}

header.cover{padding-block:72px 40px;border-bottom:1px solid var(--line)}
header.cover .mark{font-family:var(--display);font-weight:800;font-size:clamp(38px,7vw,64px);letter-spacing:-.035em;line-height:.95;margin:0}
header.cover .mark i{font-style:normal;color:var(--volt)}
header.cover .tag{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--volt);margin:0 0 14px}
header.cover .lede{font-size:clamp(17px,2.3vw,21px);color:var(--text);max-width:62ch;margin:20px 0 0;text-wrap:balance}
header.cover .meta{font-family:var(--mono);font-size:11px;color:var(--dim);margin-top:26px;max-width:70ch;line-height:1.7}

.slide{display:grid;grid-template-columns:1fr;gap:0;padding-block:44px;border-bottom:1px solid var(--line)}
@media (min-width:720px){ .slide{grid-template-columns:56px minmax(0,1fr);} }
.rail{display:none}
@media (min-width:720px){ .rail{display:block;padding-top:4px} }
.rail-n{font-family:var(--mono);font-size:12px;color:var(--dim)}
.slide-body{min-width:0;display:flex;flex-direction:column;gap:18px}
.kicker{font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--volt);margin:0}
.slide h2{font-family:var(--display);font-weight:700;font-size:clamp(23px,3.3vw,33px);line-height:1.15;letter-spacing:-.02em;margin:0;text-wrap:balance;max-width:26ch}
.lede{color:var(--muted);font-size:18px;margin:0;max-width:62ch}
.points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;max-width:68ch}
.points li{position:relative;padding-left:18px;color:var(--muted);font-size:15.5px}
.points li::before{content:"";position:absolute;left:0;top:.62em;width:7px;height:1px;background:var(--line)}
.num{font-family:var(--mono);font-weight:700;color:var(--gold);font-variant-numeric:tabular-nums}
.p{font-family:var(--mono);font-size:.85em;color:var(--cyan);font-weight:700}

figure{margin:0}
.chart img{border:1px solid var(--line);border-radius:10px;background:var(--panel)}
.shot img{max-height:560px;width:auto;border:1px solid var(--line);border-radius:12px}

.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px}
table{border-collapse:collapse;width:100%;min-width:520px;font-size:13.5px}
th{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--volt);text-align:left;padding:11px 14px;background:var(--raised);white-space:nowrap}
td{padding:11px 14px;border-top:1px solid var(--line);color:var(--muted);vertical-align:top}
tbody tr:nth-child(odd){background:var(--panel)}

.notes{border-top:1px dashed var(--line);padding-top:12px}
.notes summary{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);cursor:pointer}
.notes summary:hover{color:var(--volt)}
.notes-body{margin-top:12px;color:var(--muted);font-size:14px;max-width:72ch;border-left:2px solid var(--line);padding-left:16px}

.sources{list-style:none;display:flex;flex-wrap:wrap;gap:6px 10px;margin:0;padding:0}
.sources a{font-family:var(--mono);font-size:10.5px;color:var(--dim);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:1px}
.sources a:hover{color:var(--volt);border-bottom-color:var(--volt)}

.divider{padding-block:40px 8px}
.divider p{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin:0;display:flex;align-items:center;gap:14px}
.divider p::after{content:"";flex:1;height:1px;background:var(--line)}

footer.end{padding-block:44px 72px;color:var(--dim);font-family:var(--mono);font-size:11px;line-height:1.8;max-width:74ch}
:focus-visible{outline:2px solid var(--volt);outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>

<div class="shell">
<nav class="toc" aria-label="Contents">
  <h1>FACT<i>//</i>DUEL</h1>
  <p class="sub">Seed round · Sep 2026</p>
  ${nav}
</nav>
<main>
  <header class="cover">
    <p class="tag">Seed round · ${esc(plan.deck.date)}</p>
    <p class="mark">FACT<i>//</i>DUEL</p>
    <p class="lede">${esc(plan.deck.subtitle)}</p>
    <p class="meta">${esc(plan.deck.confidentiality)}</p>
  </header>
  ${core.map(section).join('\n')}
  <div class="divider"><p>Appendix</p></div>
  ${appendix.map(section).join('\n')}
  <footer class="end">
    Every figure in this deck is traceable to a named source, and figures marked (P) are a plan built
    on third-party benchmarks rather than a forecast. FACT//DUEL has no users and no revenue; the
    round buys the retention evidence the deck does not have.<br><br>
    Deck, charts and the full evidence base live in the repository under public/product/investor.
  </footer>
</main>
</div>
`;

const outPath = SELF_HOSTED ? 'public/product/investor/deck.site.html' : 'public/product/investor/deck.html';
writeFileSync(outPath, html);
console.log('wrote', outPath, html.length, 'chars |', core.length, 'core +', appendix.length, 'appendix slides');
