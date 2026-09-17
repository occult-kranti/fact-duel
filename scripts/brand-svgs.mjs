// scripts/brand-svgs.mjs — draws the Jaanta Hai Kya (JHK) brand files into public/brand/ and public/favicon.svg.
//   node scripts/brand-svgs.mjs            # from the repo root
// One set of hand-drawn monoline geometric glyphs (cap height 100, x-height 70, stroke 20,
// descender 128; every centreline starts at x=0 and ink is offset by half the stroke) feeds the
// mark, the wordmarks, the lockups and the 1200×630 social card. The PNG exports (og.png,
// apple-touch-icon.png) are rendered from the SVGs with a headless browser; see docs/brand.md.
// The same MARK / WORD / JHK data is embedded in app/shell/brand-mark.tsx for the in-app mark.
import { writeFileSync, mkdirSync } from 'node:fs';

const S = 20; // stroke
const H = S / 2;
const VOLT = '#d4ff3a', BG0 = '#0a0e14', BG1 = '#121821', TEXT = '#f7f6ef', INK = '#1e2530';

/* ---- glyphs: [centreline extent, path (stroked), dots (filled circles)] ---- */
const G = {
  J: { w: 40, d: 'M40 10V70A20 20 0 0 1 0 70' },
  H: { w: 50, d: 'M0 10V90M50 10V90M0 50H50' },
  K: { w: 45, d: 'M0 10V90M45 10L0 55L45 90' },
  D: { w: 55, d: 'M0 10V90M0 10H15A40 40 0 0 1 15 90H0' },
  P: { w: 47, d: 'M0 90V10H25A22 22 0 0 1 25 54H0' },
  a: { w: 50, d: 'M50 65a25 25 0 1 0 -50 0a25 25 0 1 0 50 0M50 40V90' },
  n: { w: 50, d: 'M0 90V40M0 65A25 25 0 0 1 50 65V90' },
  t: { w: 35, d: 'M15 15V75A15 15 0 0 0 30 90M0 40H35' },
  i: { w: 0, d: 'M0 40V90', dots: [[0, 14]] },
  y: { w: 44, d: 'M0 40L22 90M44 40L9.7 118' },
  o: { w: 50, d: 'M50 65a25 25 0 1 0 -50 0a25 25 0 1 0 50 0' },
  w: { w: 48, d: 'M0 40L12 90L24 40L36 90L48 40' },
  r: { w: 22, d: 'M0 40V90M0 62A22 22 0 0 1 22 40' },
  v: { w: 44, d: 'M0 40L22 90L44 40' },
  e: { w: 50, d: 'M0 65H50A25 25 0 1 0 44.2 81.1' },
  u: { w: 50, d: 'M0 40V65A25 25 0 0 0 50 65V40M50 40V90' },
  k: { w: 40, d: 'M0 10V90M40 40L0 68L40 90' },
  '?': { w: 44, d: 'M0 32A22 22 0 1 1 22 54V68', dots: [[22, 90]] },
  '.': { w: 0, d: '', dots: [[0, 90]] },
  ' ': { w: 22, d: '' },
};
const TRACK = 12;

/** Lays out a string; returns {width, parts:[{d, dots, x}]} in ink space (each glyph shifted by H). */
function layout(text, track = TRACK) {
  let pen = 0;
  const parts = [];
  for (const ch of text) {
    const g = G[ch];
    if (!g) throw new Error('no glyph for ' + JSON.stringify(ch));
    if (ch === ' ') { pen += g.w + track; continue; }
    parts.push({ x: pen + H, d: g.d, dots: g.dots ?? [] });
    pen += g.w + S + track;
  }
  return { width: pen - track, parts };
}
/** Path data for a laid-out string, translated by (x0,y0) and scaled by k, as one <path d> + dots. */
function pathFor(text, { x0 = 0, y0 = 0, k = 1, track } = {}) {
  const { width, parts } = layout(text, track);
  const tx = (x, dx) => ((x + dx) * k + x0).toFixed(2);
  const ty = (y) => (y * k + y0).toFixed(2);
  let d = '';
  const dots = [];
  for (const p of parts) {
    // shift the path by translating every absolute coordinate pair: simplest is to wrap in a transform
    d += `<path transform="translate(${tx(p.x, 0)} ${ty(0)}) scale(${k})" d="${p.d}"/>`;
    for (const [cx, cy] of p.dots) dots.push(`<circle cx="${tx(p.x, cx)}" cy="${ty(cy)}" r="${(H * k).toFixed(2)}"/>`);
  }
  return { width: width * k, height: 128 * k, svg: d + dots.join(''), dotsSvg: dots.join(''), pathsSvg: d };
}

/* ---- the mark (64 grid): a question mark whose tail is the K's leg, one dot ---- */
const MARK_HOOK = 'M18 20C18 12 24 7 31 7C38 7 44 12 44 19C44 25 39 28 36 30C33 32 31 34 31 38V44';
const MARK_LEG = 'M31 44L45 58';
const MARK_DOT = { cx: 21, cy: 56, r: 4.5 };
const markGlyph = (color) =>
  `<g fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="${MARK_HOOK}"/><path d="${MARK_LEG}"/></g><circle cx="${MARK_DOT.cx}" cy="${MARK_DOT.cy}" r="${MARK_DOT.r}" fill="${color}"/>`;
const markTile = (bg = BG0) => `<rect width="64" height="64" rx="14" fill="${bg}"/>`;
const markSvg = ({ title, size = null }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"${size ? ` width="${size}" height="${size}"` : ''} role="img" aria-label="${title}">${markTile()}${markGlyph(VOLT)}</svg>\n`;

/* ---- wordmark files ---- */
function wordmarkSvg({ color, dark }) {
  const word = pathFor('Jaanta Hai Kya');
  const pad = 8;
  const w = Math.ceil(word.width + pad * 2), h = Math.ceil(word.height + pad * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Jaanta Hai Kya">` +
    (dark ? '' : '') +
    `<g transform="translate(${pad} ${pad})" fill="${color}" stroke="${color}" stroke-width="${S}" stroke-linecap="round" stroke-linejoin="round">` +
    `<g fill="none">${word.pathsSvg}</g><g stroke="none">${word.dotsSvg}</g></g></svg>\n`;
}
function lockupSvg({ color, tileBg }) {
  // mark tile 128px tall beside "JHK" small caps (caps at 78% cap height)
  const k = 0.78;
  const jhk = pathFor('JHK', { k, track: 18 });
  const pad = 8, gap = 24, tile = 128;
  const w = Math.ceil(pad + tile + gap + jhk.width + pad), h = tile + pad * 2;
  const y0 = pad + (tile - 100 * k) / 2 ;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="JHK — Jaanta Hai Kya">` +
    `<g transform="translate(${pad} ${pad}) scale(2)">${markTile(tileBg)}${markGlyph(VOLT)}</g>` +
    `<g transform="translate(${pad + tile + gap} ${y0})" fill="${color}" stroke="${color}" stroke-width="${S}" stroke-linecap="round" stroke-linejoin="round">` +
    `<g fill="none">${jhk.pathsSvg}</g><g stroke="none">${jhk.dotsSvg}</g></g></svg>\n`;
}
function ogSvg() {
  const W = 1200, Hh = 630;
  const word = pathFor('Jaanta Hai Kya', { k: 1 });
  const tag = pathFor('Do you know? Prove it.', { k: 0.56, track: 10 });
  const markSize = 176, left = 96;
  const wordY = 316, tagY = wordY + word.height + 28;
  const stroked = (p, color) => `<g fill="${color}" stroke="${color}" stroke-width="${S}" stroke-linecap="round" stroke-linejoin="round"><g fill="none">${p.pathsSvg}</g><g stroke="none">${p.dotsSvg}</g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="Jaanta Hai Kya — Do you know? Prove it.">` +
    `<rect width="${W}" height="${Hh}" fill="${BG0}"/>` +
    `<rect x="0" y="0" width="${W}" height="${Hh}" fill="url(#g)"/>` +
    `<defs><radialGradient id="g" cx="0.18" cy="0.2" r="0.8"><stop offset="0" stop-color="${VOLT}" stop-opacity="0.10"/><stop offset="1" stop-color="${VOLT}" stop-opacity="0"/></radialGradient></defs>` +
    `<g transform="translate(${left} 96) scale(${markSize / 64})">${markTile(BG1)}${markGlyph(VOLT)}</g>` +
    `<g transform="translate(${left} ${wordY})">${stroked(word, TEXT)}</g>` +
    `<g transform="translate(${left + 2} ${tagY})">${stroked(tag, VOLT)}</g>` +
    `<rect x="${left}" y="${Hh - 56}" width="56" height="4" rx="2" fill="${VOLT}"/>` +
    `</svg>\n`;
}

/* ---- write files ---- */
const out = process.argv[2] ?? '.';
mkdirSync(out + '/public/brand', { recursive: true });
writeFileSync(out + '/public/brand/jhk-mark.svg', markSvg({ title: 'Jaanta Hai Kya' }));
writeFileSync(out + '/public/brand/favicon.svg', markSvg({ title: 'Jaanta Hai Kya' }));
writeFileSync(out + '/public/favicon.svg', markSvg({ title: 'Jaanta Hai Kya' }));
writeFileSync(out + '/public/brand/jhk-wordmark.svg', wordmarkSvg({ color: TEXT }));
writeFileSync(out + '/public/brand/jhk-wordmark-dark.svg', wordmarkSvg({ color: INK, dark: true }));
writeFileSync(out + '/public/brand/jhk-lockup.svg', lockupSvg({ color: TEXT, tileBg: BG1 }));
writeFileSync(out + '/public/brand/jhk-lockup-dark.svg', lockupSvg({ color: INK, tileBg: BG0 }));
writeFileSync(out + '/public/brand/og.svg', ogSvg());

/* ---- inline React data: the mark paths and the wordmark as path data ---- */
const word = pathFor('Jaanta Hai Kya');
const jhk = pathFor('JHK', { track: 18 });
const data = {
  MARK: { hook: MARK_HOOK, leg: MARK_LEG, dot: MARK_DOT },
  WORD: { width: Math.ceil(word.width), height: 128, stroke: S, paths: layout('Jaanta Hai Kya').parts.map((p) => ({ x: p.x, d: p.d, dots: p.dots })) },
  JHK: { width: Math.ceil(jhk.width), height: 128, stroke: S, paths: layout('JHK', 18).parts.map((p) => ({ x: p.x, d: p.d, dots: p.dots })) },
};
// Inline React copy: app/shell/brand-mark.tsx embeds the same MARK/WORD/JHK data.
if (process.env.BRAND_DATA) writeFileSync(process.env.BRAND_DATA, JSON.stringify(data));
console.log('word width', word.width, 'jhk width', jhk.width);
