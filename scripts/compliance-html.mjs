/* Render public/product/compliance/compliance.json into one standalone working page.
   Same relationship scripts/investor-deck-html.mjs has to deck-plan.json: every fact lives in the
   JSON, only presentation is authored here, so no citation is ever retyped.

   This page is an operational file, not marketing. Three people read it — the founder deciding what
   to do next, a lawyer reading top to bottom and printing it, and an investor checking whether the
   founder is kidding themselves — so the honest treatment of an unverified fact is to show it as
   unverified and turn it into a numbered question, never to hedge it into prose. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC = 'public/product/compliance/compliance.json';
const OUT = 'public/product/compliance/checklist.site.html';
const data = JSON.parse(readFileSync(SRC, 'utf8'));

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Money, durations and statute numbers read as data, not prose. UNVERIFIED is never dressed up. */
const marks = (s) =>
  esc(s)
    .replace(/\bUNVERIFIED\b/g, '<b class="unv">UNVERIFIED</b>')
    .replace(/(\$[\d,.]+(?:bn|m|M|k|K)?|€[\d,.]+(?:bn|m|M|k|K)?|₹[\d,.]+(?:crore|lakh)?)/g, '<b class="num">$1</b>')
    .replace(/(\b\d+\s?(?:days?|weeks?|months?|years?)\b)/gi, '<b class="num">$1</b>');

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return String(u);
  }
};

const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/* ---------------------------------------------------------------- status vocabulary */

/** Legal posture of a place or a model. Colour belongs to status; models carry letters only. */
const POSTURE = {
  lawful: { label: 'CLEAR', tone: 'volt', gloss: 'Lawful on the research as corrected. Still needs counsel sign-off.' },
  'licence-required': { label: 'LICENCE', tone: 'gold', gloss: 'Lawful only with an authorisation you do not yet hold.' },
  unsettled: { label: 'UNSETTLED', tone: 'cyan', gloss: 'Genuinely open. Needs an opinion, not a guess.' },
  unlawful: { label: 'CLOSED', tone: 'danger', gloss: 'Prohibited. No filing opens this.' },
  permitted: { label: 'CLEAR', tone: 'volt', gloss: 'Permitted in this subdivision.' },
  prohibited: { label: 'CLOSED', tone: 'danger', gloss: 'Prohibited in this subdivision.' },
  unclear: { label: 'UNSETTLED', tone: 'cyan', gloss: 'Not settled for this subdivision.' },
};
const posture = (k) => POSTURE[k] ?? { label: String(k ?? '?').toUpperCase(), tone: 'muted', gloss: '' };

const chip = (k) => {
  const p = posture(k);
  return `<span class="chip" data-tone="${p.tone}" title="${esc(p.gloss)}">${esc(p.label)}</span>`;
};

/* ---------------------------------------------------------------- derived collections */

const regions = data.regions ?? [];
const allItems = [
  ...(data.common ?? []).map((i) => ({ ...i, regionId: 'common', regionName: 'Common gate' })),
  ...regions.flatMap((r) => (r.checklist ?? []).map((i) => ({ ...i, regionId: r.id, regionName: r.name }))),
];

/** A stable reference code per item, so a lawyer can answer by number over email. */
allItems.forEach((item, n) => {
  item.ref = item.ref ?? `${(item.regionId ?? 'x').slice(0, 2).toUpperCase()}-${String(n + 1).padStart(3, '0')}`;
});

const isUnverified = (v) => /UNVERIFIED/i.test(String(v ?? ''));
const itemUnverified = (i) => ['cost', 'leadTime', 'notes', 'issuer'].some((k) => isUnverified(i[k]));
const unverifiedCount = allItems.filter(itemUnverified).length;

/** Every unverified fact becomes a numbered billable question rather than a hedge. */
const questions = [
  ...(data.questions ?? []).map((q) => (typeof q === 'string' ? { text: q } : q)),
  ...allItems.filter(itemUnverified).map((i) => ({
    text: `${i.item} — confirm ${['cost', 'leadTime'].filter((k) => isUnverified(i[k])).join(' and ') || 'the detail'} with ${i.issuer}.`,
    from: i.ref,
    region: i.regionName,
  })),
].map((q, n) => ({ ...q, id: `Q${n + 1}` }));

const STAGES = [
  'Stage 0 — Entity and money rails',
  'Stage 1 — Legal opinion / regulator engagement',
  'Stage 2 — Licences, registrations, notifications',
  'Stage 3 — Product controls that must ship before launch',
  'Stage 4 — Ongoing obligations after launch',
];
const KIND_STAGE = {
  entity: 0,
  service: 0,
  licence: 2,
  registration: 2,
  tax: 2,
  filing: 2,
  policy: 3,
  technical: 3,
};
const stageOf = (i) => (Number.isInteger(i.stage) ? i.stage : (KIND_STAGE[i.kind] ?? 4));

/* ---------------------------------------------------------------- components */

function checklistRow(i) {
  const facts = [
    ['ISSUER', i.issuer],
    ['COST', i.cost],
    ['LEAD TIME', i.leadTime],
    ['APPLIES TO', i.appliesTo],
  ].filter(([, v]) => v);
  return `<li class="row" id="item-${esc(i.ref)}" data-kind="${esc(i.kind ?? '')}"${
    itemUnverified(i) ? ' data-unverified="true"' : ''
  }>
  <label class="row-tick"><input type="checkbox" data-ref="${esc(i.ref)}"><span aria-hidden="true"></span><em class="sr">Mark ${esc(
    i.item,
  )} done</em></label>
  <div class="row-body">
    <p class="row-head"><span class="ref">${esc(i.ref)}</span> <strong>${marks(i.item)}</strong></p>
    <dl class="facts">${facts
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${marks(v)}</dd></div>`)
      .join('')}</dl>
    ${i.prerequisite && !/^none$/i.test(i.prerequisite) ? `<p class="pre"><span>NEEDS FIRST</span> ${marks(i.prerequisite)}</p>` : ''}
    ${i.notes ? `<p class="note">${marks(i.notes)}</p>` : ''}
  </div>
</li>`;
}

function checklistByStage(items) {
  const groups = STAGES.map((title, n) => ({ title, items: items.filter((i) => stageOf(i) === n) })).filter(
    (g) => g.items.length,
  );
  return groups
    .map(
      (g) => `<section class="stage">
  <h4>${esc(g.title)} <span class="count">${g.items.length}</span></h4>
  <ul class="rows">${g.items.map(checklistRow).join('')}</ul>
</section>`,
    )
    .join('');
}

/** 51 or 27 tiles. At 390px this becomes a two-column list; it is never a horizontal scroller. */
function grid(subdivisions, label) {
  if (!subdivisions?.length) return '';
  const counts = subdivisions.reduce((a, s) => ({ ...a, [s.status]: (a[s.status] ?? 0) + 1 }), {});
  return `<section class="grid-wrap">
  <h4>${esc(label)} <span class="count">${subdivisions.length}</span></h4>
  <p class="grid-key">${Object.entries(counts)
    .map(([k, n]) => `${chip(k)} <b class="num">${n}</b>`)
    .join(' &nbsp; ')}</p>
  <ul class="grid">${subdivisions
    .map(
      (s) => `<li class="tile" data-tone="${posture(s.status).tone}">
      <strong>${esc(s.name)}</strong>${chip(s.status)}
      <p>${marks(s.detail)}</p>
      ${s.authority ? `<p class="auth">${marks(s.authority)}</p>` : ''}
    </li>`,
    )
    .join('')}</ul>
</section>`;
}

function matrix() {
  const models = data.models ?? [];
  const cell = (m, r) => {
    const hit = (data.matrix ?? []).find((c) => c.model === m.id && slug(c.region) === slug(r.matrixKey ?? r.name));
    if (!hit) return `<td class="cell"><span class="chip" data-tone="muted">—</span></td>`;
    return `<td class="cell" data-tone="${posture(hit.verdict).tone}">
      <a href="#${esc(r.id)}">${chip(hit.verdict)}</a>
      <p>${marks(hit.summary)}</p>
    </td>`;
  };
  return `<div class="scroller"><table class="matrix">
  <caption class="sr">Legality of each candidate model in each region</caption>
  <thead><tr><th scope="col">Model</th>${regions
    .map((r) => `<th scope="col">${esc(r.name)}</th>`)
    .join('')}</tr></thead>
  <tbody>${models
    .map(
      (m) => `<tr><th scope="row"><span class="mid">${esc(m.id)}</span> ${esc(m.name)}<p>${marks(m.blurb)}</p></th>${regions
        .map((r) => cell(m, r))
        .join('')}</tr>`,
    )
    .join('')}</tbody>
</table></div>`;
}

function registerTable() {
  return `<div class="scroller"><table class="register">
  <caption class="sr">Every filing on this page in one sheet</caption>
  <thead><tr>
    <th>Ref</th><th>Where</th><th>Item</th><th>Issuer</th><th>Cost</th><th>Lead time</th><th>Needs first</th>
  </tr></thead>
  <tbody>${allItems
    .map(
      (i) => `<tr${itemUnverified(i) ? ' data-unverified="true"' : ''}>
      <td><a href="#item-${esc(i.ref)}" class="ref">${esc(i.ref)}</a></td>
      <td>${esc(i.regionName)}</td>
      <td>${marks(i.item)}</td>
      <td>${marks(i.issuer)}</td>
      <td>${marks(i.cost)}</td>
      <td>${marks(i.leadTime)}</td>
      <td>${marks(i.prerequisite)}</td>
    </tr>`,
    )
    .join('')}</tbody>
</table></div>`;
}

function regionSection(r) {
  const verdicts = (r.verdicts ?? [])
    .map(
      (v) => `<li><span class="mid">${esc(v.model)}</span> ${chip(v.verdict)}<p>${marks(v.summary ?? v.reasoning)}</p></li>`,
    )
    .join('');
  return `<section class="region" id="${esc(r.id)}">
  <header class="region-head">
    <h2>${esc(r.name)}</h2>
    ${r.posture ? `<p class="lede">${marks(r.posture)}</p>` : ''}
    ${verdicts ? `<ul class="verdicts">${verdicts}</ul>` : ''}
  </header>
  ${grid(r.subdivisions, r.gridLabel ?? 'Subdivisions')}
  ${r.checklist?.length ? checklistByStage(r.checklist) : ''}
  ${
    r.risks?.length
      ? `<section class="stage"><h4>Risks specific to ${esc(r.name)}</h4><ul class="bullets">${r.risks
          .map((x) => `<li>${marks(x)}</li>`)
          .join('')}</ul></section>`
      : ''
  }
</section>`;
}

/* ---------------------------------------------------------------- page */

const totalItems = allItems.length;
const html = `<title>FACT//DUEL Compliance</title>
<meta name="description" content="Operational compliance checklist for taking money in the USA, EU and India. Not legal advice.">
<meta name="robots" content="noindex">
<link rel="preload" as="font" type="font/woff2" crossorigin href="../fonts/bricolage-grotesque-latin-normal-500-800.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="../fonts/instrument-sans-latin-normal-400-700.woff2">
<link rel="stylesheet" href="../fonts/fonts.css">
<style>
:root{
  --bg-0:#0a0e14; --bg-1:#121821; --bg-2:#1a222e; --line:rgba(82,92,108,.6);
  --text:#f7f6ef; --muted:#a6adba; --dim:#6f7987;
  --volt:#d4ff3a; --ember:#ff7a2f; --cyan:#4ee1ff; --gold:#ffc83d; --magenta:#ff5ea8; --danger:#ff4d4d;
  --volt-soft:rgba(212,255,58,.12); --cyan-soft:rgba(78,225,255,.12); --gold-soft:rgba(255,200,61,.12);
  --danger-soft:rgba(255,77,77,.12); --magenta-soft:rgba(255,94,168,.12);
  --r-control:10px; --r-card:16px; --r-pill:999px; --gutter:16px;
  --fs-12:.75rem; --fs-14:.875rem; --fs-16:1rem; --fs-18:1.125rem;
  --fs-22:clamp(1.25rem,1.15rem + .5vw,1.375rem); --fs-28:clamp(1.5rem,1.3rem + 1vw,1.75rem);
  --fs-36:clamp(1.8rem,1.45rem + 1.7vw,2.25rem); --fs-48:clamp(2.15rem,1.6rem + 2.6vw,3rem);
  --font-display:'Bricolage Grotesque','Archivo Black',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-ui:'Instrument Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg-0);color:var(--text);font-family:var(--font-ui);font-size:var(--fs-16);line-height:1.55;-webkit-text-size-adjust:100%}
.wrap{max-width:1080px;margin:0 auto;padding-inline:var(--gutter);padding-block:0}
h1,h2,h3{font-family:var(--font-display);line-height:1.08;margin:0}
h1{font-size:var(--fs-48);letter-spacing:-.02em}
h2{font-size:var(--fs-36);letter-spacing:-.015em}
h3{font-size:var(--fs-22)}
h4{font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:28px 0 10px;font-weight:600}
p{margin:.5em 0}
a{color:var(--cyan);text-underline-offset:3px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.num,.ref{font-family:var(--font-mono);font-weight:600;color:var(--volt);font-style:normal}
.unv{font-family:var(--font-mono);font-size:.92em;font-style:normal;font-weight:600;color:var(--gold);background:var(--gold-soft);padding:1px 6px;border-radius:var(--r-pill)}
.count{font-family:var(--font-mono);color:var(--dim);font-size:var(--fs-12)}
.mid{display:inline-block;min-width:1.6em;text-align:center;font-family:var(--font-mono);font-weight:700;color:var(--bg-0);background:var(--text);border-radius:var(--r-pill);padding:0 .4em;margin-right:.4em}

header.masthead{border-bottom:1px solid var(--line);padding-block:40px 24px;background:linear-gradient(180deg,var(--bg-1),var(--bg-0))}
.kicker{font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.18em;text-transform:uppercase;color:var(--volt);margin:0 0 12px}
.facts-row{display:flex;flex-wrap:wrap;gap:8px 20px;font-family:var(--font-mono);font-size:var(--fs-12);color:var(--muted);margin-top:18px}
.disclaimer{margin-top:20px;padding:14px 16px;border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:var(--r-control);background:var(--bg-1);font-size:var(--fs-14);color:var(--muted)}
.disclaimer b{color:var(--text)}

nav.subbar{position:sticky;top:0;z-index:10;background:rgba(10,14,20,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
nav.subbar ul{display:flex;gap:6px;list-style:none;margin:0;padding:10px var(--gutter);overflow-x:auto;max-width:1080px;margin-inline:auto}
nav.subbar a{display:block;white-space:nowrap;font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);text-decoration:none;padding:7px 12px;border:1px solid var(--line);border-radius:var(--r-pill)}
nav.subbar a:hover,nav.subbar a:focus-visible{color:var(--text);border-color:var(--volt)}

section.band{padding-block:36px;border-bottom:1px solid var(--line)}
.lede{font-size:var(--fs-18);color:var(--muted);max-width:68ch}

.chip{display:inline-block;font-family:var(--font-mono);font-size:var(--fs-12);font-weight:700;letter-spacing:.08em;padding:2px 9px;border-radius:var(--r-pill);border:1px solid currentColor}
.chip[data-tone=volt]{color:var(--volt);background:var(--volt-soft)}
.chip[data-tone=gold]{color:var(--gold);background:var(--gold-soft)}
.chip[data-tone=cyan]{color:var(--cyan);background:var(--cyan-soft)}
.chip[data-tone=danger]{color:var(--danger);background:var(--danger-soft)}
.chip[data-tone=muted]{color:var(--dim)}

.scroller{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-inline:calc(var(--gutter) * -1);padding-inline:var(--gutter)}
table{border-collapse:collapse;width:100%;min-width:560px;font-size:var(--fs-14)}
th,td{text-align:left;vertical-align:top;padding:10px 12px;border-bottom:1px solid var(--line)}
thead th{font-family:var(--font-mono);font-size:var(--fs-12);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600}
.matrix tbody th{width:26%;font-weight:600}
.matrix tbody th p,.cell p{font-size:var(--fs-12);color:var(--muted);font-weight:400;margin:.35em 0 0}
.cell a{text-decoration:none}
.register tr[data-unverified] td:first-child{border-left:3px solid var(--gold)}

ul.verdicts{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:10px}
ul.verdicts li{padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-control);background:var(--bg-1)}
ul.verdicts p{margin:.35em 0 0;font-size:var(--fs-14);color:var(--muted)}

ul.grid{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.tile{padding:10px 12px;border:1px solid var(--line);border-left:3px solid currentColor;border-radius:var(--r-control);background:var(--bg-1);color:var(--dim)}
.tile[data-tone=volt]{color:var(--volt)}.tile[data-tone=gold]{color:var(--gold)}
.tile[data-tone=cyan]{color:var(--cyan)}.tile[data-tone=danger]{color:var(--danger)}
.tile strong{display:block;color:var(--text);font-size:var(--fs-14);margin-bottom:4px}
.tile p{margin:.4em 0 0;font-size:var(--fs-12);color:var(--muted)}
.tile .auth{color:var(--dim);font-family:var(--font-mono);font-size:11px}
.grid-key{font-family:var(--font-mono);font-size:var(--fs-12);color:var(--muted)}

ul.rows,ul.bullets{list-style:none;margin:0;padding:0;display:grid;gap:10px}
ul.bullets li{padding-left:1.1em;position:relative;color:var(--muted);font-size:var(--fs-14)}
ul.bullets li::before{content:'';position:absolute;left:0;top:.6em;width:5px;height:5px;background:var(--ember);border-radius:50%}
.row{display:flex;gap:12px;padding:14px;border:1px solid var(--line);border-radius:var(--r-card);background:var(--bg-1)}
.row[data-unverified]{border-left:3px solid var(--gold)}
.row-tick{flex:0 0 auto;cursor:pointer}
.row-tick input{position:absolute;opacity:0;width:0;height:0}
.row-tick span{display:block;width:22px;height:22px;border:1px solid var(--line);border-radius:6px;background:var(--bg-2);margin-top:2px}
.row-tick input:checked + span{background:var(--volt);border-color:var(--volt);box-shadow:inset 0 0 0 4px var(--bg-1)}
.row-tick input:focus-visible + span{outline:2px solid var(--cyan);outline-offset:2px}
.row[data-done] .row-body{opacity:.5}
.row-head{margin:0;font-size:var(--fs-16)}
.facts{display:flex;flex-wrap:wrap;gap:4px 18px;margin:8px 0 0}
.facts div{min-width:0}
.facts dt{font-family:var(--font-mono);font-size:11px;letter-spacing:.1em;color:var(--dim)}
.facts dd{margin:0;font-size:var(--fs-14)}
.pre{font-size:var(--fs-12);color:var(--muted);margin:8px 0 0}
.pre span{font-family:var(--font-mono);letter-spacing:.1em;color:var(--ember)}
.note{font-size:var(--fs-14);color:var(--muted);margin:8px 0 0}

ol.questions{margin:0;padding:0;list-style:none;display:grid;gap:10px;counter-reset:q}
ol.questions li{padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-control);background:var(--bg-1)}
ol.questions .qid{font-family:var(--font-mono);color:var(--gold);font-weight:700;margin-right:.5em}
.sources{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:var(--fs-12);font-family:var(--font-mono)}
.sources a{color:var(--muted)}
footer{padding-block:40px;color:var(--dim);font-size:var(--fs-12);font-family:var(--font-mono)}

@media (max-width:560px){
  ul.grid{grid-template-columns:1fr 1fr}
  .tile p{display:none}
  .tile[data-open] p{display:block}
  .row{flex-direction:row}
  .facts{gap:4px 12px}
}
@media print{
  nav.subbar{display:none}
  body{background:#fff;color:#000}
  .row,.tile,ul.verdicts li,ol.questions li{background:#fff;border-color:#999;break-inside:avoid}
  .scroller{overflow:visible}
  table{min-width:0}
  .tile p{display:block}
  a{color:#000;text-decoration:none}
  section.band{break-inside:auto;border-color:#999}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>

<a class="sr" href="#us">Skip to the regions</a>
<header class="masthead"><div class="wrap">
  <p class="kicker">FACT//DUEL · OPERATIONAL COMPLIANCE FILE</p>
  <h1>What it takes to take money</h1>
  <p class="lede">${marks(data.summary ?? '')}</p>
  <p class="facts-row">
    <span>AS OF ${esc(data.asOf)}</span><span>REGIONS ${regions.length}</span>
    <span>ITEMS ${totalItems}</span><span>UNVERIFIED ${unverifiedCount}</span>
    <span>OPEN QUESTIONS ${questions.length}</span>
  </p>
  <p class="disclaimer"><b>This is a working file, not legal advice.</b> ${marks(data.disclaimer ?? '')}</p>
</div></header>

<nav class="subbar"><ul>
  <li><a href="#matrix">Decision matrix</a></li>
  <li><a href="#closed">What is closed</a></li>
  <li><a href="#common">Common gate</a></li>
  ${regions.map((r) => `<li><a href="#${esc(r.id)}">${esc(r.short ?? r.name)}</a></li>`).join('')}
  <li><a href="#register">Filing register</a></li>
  <li><a href="#questions">For counsel</a></li>
  <li><a href="#evidence">Evidence</a></li>
</ul></nav>

${
  data.closed?.length
    ? `<section class="band" id="closed"><div class="wrap">
  <h2>Closed, not merely hard</h2>
  <p class="lede">No filing, budget or opinion opens these. They are here first so no plan is built on one.</p>
  <ul class="bullets">${data.closed.map((c) => `<li>${marks(c)}</li>`).join('')}</ul>
</div></section>`
    : ''
}

<section class="band" id="matrix"><div class="wrap">
  <h2>The decision matrix</h2>
  <p class="lede">Four candidate models against three regions. Colour is status; a model carries a letter and never a colour.</p>
  ${matrix()}
</div></section>

${
  data.criticalFindings?.length
    ? `<section class="band" id="findings"><div class="wrap">
  <h2>Findings that change the plan</h2>
  <ul class="bullets">${data.criticalFindings.map((f) => `<li>${marks(f)}</li>`).join('')}</ul>
</div></section>`
    : ''
}

${
  data.affectsProductToday?.length
    ? `<section class="band" id="today"><div class="wrap">
  <h2>Bears on the free product you already ship</h2>
  <p class="lede">These do not wait for a payment surface.</p>
  <ul class="bullets">${data.affectsProductToday.map((f) => `<li>${marks(f)}</li>`).join('')}</ul>
</div></section>`
    : ''
}

${
  data.common?.length
    ? `<section class="band" id="common"><div class="wrap">
  <h2>The common gate</h2>
  <p class="lede">Everything that must exist before any region-specific filing. It is the top of the prerequisite graph.</p>
  ${checklistByStage(data.common)}
</div></section>`
    : ''
}

${regions.map((r) => `<section class="band"><div class="wrap">${regionSection(r)}</div></section>`).join('')}

<section class="band" id="register"><div class="wrap">
  <h2>The filing register</h2>
  <p class="lede">Every item on this page in one sheet. A gold edge marks a row carrying an unverified figure.</p>
  ${registerTable()}
</div></section>

${
  data.sequencing?.length
    ? `<section class="band" id="path"><div class="wrap">
  <h2>Critical path</h2>
  <ol class="questions">${data.sequencing
    .map(
      (s, n) => `<li><span class="qid">${String(n + 1).padStart(2, '0')}</span><strong>${marks(s.step)}</strong>
    <p class="note"><b>Gate:</b> ${marks(s.gate)}</p><p class="note"><b>Blocks:</b> ${marks(s.blocks)}</p></li>`,
    )
    .join('')}</ol>
</div></section>`
    : ''
}

<section class="band" id="questions"><div class="wrap">
  <h2>Open questions for counsel</h2>
  <p class="lede">Every unverified fact on this page, turned into something answerable by number. The honest thing to do with a fact you cannot confirm is to bill someone to confirm it.</p>
  <ol class="questions">${questions
    .map(
      (q) => `<li><span class="qid">${esc(q.id)}</span>${marks(q.text)}
    ${q.from ? `<p class="note">From <a href="#item-${esc(q.from)}" class="ref">${esc(q.from)}</a>${q.region ? ` · ${esc(q.region)}` : ''}</p>` : ''}</li>`,
    )
    .join('')}</ol>
</div></section>

<section class="band" id="evidence"><div class="wrap">
  <h2>Evidence</h2>
  <p class="lede">Every source the research actually fetched, checked on ${esc(data.asOf)}. Where a lane relied on trade press rather than a primary instrument, the item above says so.</p>
  <ul class="sources">${(data.sources ?? [])
    .map((u) => `<li><a href="${esc(u)}" rel="noreferrer noopener">${esc(host(u))}</a> — ${esc(u)}</li>`)
    .join('')}</ul>
</div></section>

<footer><div class="wrap">
  <p>Generated from public/product/compliance/compliance.json · ${esc(data.asOf)} · ticks are stored in this browser only and are not a legal record.</p>
</div></footer>

<script>
/* Progressive enhancement only: with JS off, every row is visible and nothing is lost. */
(function () {
  var KEY = 'fd-compliance-ticks';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }
  var boxes = document.querySelectorAll('input[data-ref]');
  Array.prototype.forEach.call(boxes, function (box) {
    var ref = box.getAttribute('data-ref');
    if (state[ref]) { box.checked = true; box.closest('.row').setAttribute('data-done', 'true'); }
    box.addEventListener('change', function () {
      var row = box.closest('.row');
      if (box.checked) { state[ref] = 1; row.setAttribute('data-done', 'true'); }
      else { delete state[ref]; row.removeAttribute('data-done'); }
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    });
  });
  /* On a phone the tiles hide their detail to keep 51 of them scannable; tapping opens one. */
  Array.prototype.forEach.call(document.querySelectorAll('.tile'), function (tile) {
    tile.addEventListener('click', function () {
      if (tile.hasAttribute('data-open')) tile.removeAttribute('data-open');
      else tile.setAttribute('data-open', 'true');
    });
  });
})();
</script>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(
  `compliance page: ${regions.length} regions, ${totalItems} items, ${unverifiedCount} unverified, ${questions.length} questions, ${Buffer.byteLength(html)} bytes -> ${OUT}`,
);
