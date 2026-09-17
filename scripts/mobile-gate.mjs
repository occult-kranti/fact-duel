/**
 * scripts/mobile-gate.mjs — the phone gate for Jaanta Hai Kya.
 *
 * Usage:  node scripts/mobile-gate.mjs [outDir] [baseUrl]
 *   outDir   where the PNGs and report.json land (default outputs/mobile-gate)
 *   baseUrl  the running app (default http://localhost:5173/)
 *
 * It drives the real app with playwright-core against the pre-installed Chromium (the same
 * executable scripts/screens.mjs uses) across four phone widths, two locales and both themes,
 * and fails the build on the things that only break on a phone.
 *
 * WHAT IT ASSERTS, and why each threshold is the number it is
 * ----------------------------------------------------------
 * 1. No horizontal overflow: `document.scrollingElement.scrollWidth <= innerWidth + 1`. The 1px
 *    slack is sub-pixel rounding at deviceScaleFactor 1, not a budget for a stray card.
 * 2. Tap targets >= 44x44 CSS px for every visible button / a[href] / [role=button] / summary.
 *    WCAG 2.5.8 Target Size (Minimum) is the 24x24 floor; 2.5.5 Target Size (Enhanced) is 24x24's
 *    big sibling at 44x44 and is what this product holds itself to, because every one of these
 *    controls is a thumb target on a moving bus. Two WCAG 2.5.8 exceptions are honoured in code:
 *      - "Inline": a target inside a sentence whose size is constrained by the line-height of the
 *        surrounding text (our inline `.fd-link` buttons and prose links). Detected structurally:
 *        computed `display` starts with `inline` AND the parent holds text besides this element.
 *      - "User agent control": native controls the page does not size (none today, kept for honesty).
 *    Anything else needs a NAMED exception in EXCEPTIONS below, with a reason. The cap is 2.
 * 3. Body text >= 14px. "Body text" is an element carrying >= 25 characters of its OWN text — a
 *    phrase a person reads, not a chip, counter or tab label. Sub-14px labels stay legal; sub-14px
 *    sentences do not.
 * 4. Inputs >= 16px. iOS Safari zooms the page when a focused form control computes under 16px
 *    (web.dev, "Help users enter the right data in forms": use at least 1rem).
 * 5. Fixed bottom bars pad with the bottom safe-area inset. Checked by reading the CSS, not the
 *    computed box: a headless Chromium on a rectangular viewport reports every safe-area inset as
 *    0px and there is no way to emulate a notch, so a runtime check would pass vacuously. Every
 *    rule block that pins itself with `position: fixed|sticky` AND declares a `bottom` must name
 *    `env(safe-area-inset-bottom)` or the `--safe-bottom` token that wraps it (tokens.css).
 * 6. Full-height panels use dvh. Any `height/min-height/max-height` in `vh` must have a `dvh` or
 *    `svh` twin later in the same block (`vh` == `lvh`, the LARGE viewport, so a 100vh panel is
 *    taller than the screen while the URL bar is showing — MDN, CSS length, viewport units).
 * 7. Nothing fixed lies on the launch bar while an input is focused: the Play screen's Join view
 *    is opened, `#join-name` is focused, and every visible fixed element that is not the launch
 *    bar itself (and not a pointer-events:none paint layer) must not intersect its box.
 *
 * SCREENS: the profile gate, home, Play with each of the three formats selected, Player, Vault,
 * Events, Play rules / Rules of the coin / Trust, the settings sheet open, the Join view with a
 * focused field, and the finish screen reached by actually playing a bot duel (pick Bot, launch,
 * ready, answer, land on `[data-stage="finish"]`). The duel needs a build that can create a room:
 * on `run-framework.mjs dev` there is no D1 binding and `/api/duel` answers 503, so point the gate
 * at the static preview (`pnpm build:static && pnpm preview:static`) to cover the finish screen.
 * When the room never opens the screen is recorded as skipped WITH the server's reason, never as a
 * pass.
 *
 * 320x568 is the top-bar smoke width: the whole document is checked for overflow, and the target
 * and type rules are scoped to `.fd-topbar`.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(process.argv[2] || join(REPO, 'outputs/mobile-gate'));
const base = process.argv[3] || 'http://localhost:5173/';
const exe = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export const THRESHOLDS = Object.freeze({
  /** px of slack on scrollWidth vs innerWidth (sub-pixel rounding only). */
  overflowSlack: 1,
  /** WCAG 2.5.5 Target Size (Enhanced). 2.5.8 (Minimum) is 24; this product holds 44. */
  target: 44,
  /** Smallest computed font-size for an element carrying `bodyTextChars`+ characters of own text. */
  bodyText: 14,
  /** Below this a focused form control makes iOS Safari zoom the page. */
  input: 16,
  /** Own-text length at which a string counts as body text rather than a label or a chip. */
  bodyTextChars: 25,
});

/**
 * NAMED tap-target exceptions. Hard cap: 2. Anything else is a bug to fix, not to list.
 * `match` is a CSS selector the failing element is tested against with `Element.matches`/`closest`.
 */
export const EXCEPTIONS = Object.freeze([
  {
    match: "[data-slot='switch']",
    reason:
      'Radix switch. The visible track is 32x18 by design; the 56x44 hit area is painted by the ' +
      "`.fd-sheet [data-slot='switch']::after` pseudo-element in app/shell/shell.css, and a " +
      'pseudo-element has no box getBoundingClientRect can report. Verified by hand, not by the gate.',
  },
  {
    match: "[data-slot='slider'] [data-slot='slider-thumb'], [data-slot='slider'] [role='slider']",
    reason:
      'Radix slider thumb. WCAG 2.5.8 "User agent control"-shaped: the thumb is one end of a ' +
      'continuous control whose real target is the whole 44px-tall track, which the player can ' +
      'tap anywhere along. Growing the thumb to 44px would hide the value it points at.',
  },
]);

if (EXCEPTIONS.length > 2) throw new Error('mobile-gate: at most two named target-size exceptions.');

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, scope: '.fd-topbar', note: 'top bar only' },
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '414x896', width: 414, height: 896 },
];
const LOCALES = ['en', 'hi'];
const THEMES = ['dark', 'light'];

/* ------------------------------------------------------------------ 1. the CSS (static) checks */

function cssFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    const info = statSync(path);
    if (info.isDirectory()) cssFiles(path, found);
    else if (entry.endsWith('.css')) found.push(path);
  }
  return found;
}

/** Every `selector { ... }` block in a sheet, with the line its selector sits on. Comments are
 * blanked first (spaces, so line numbers survive): prose about `100vh` is not a declaration. */
function blocks(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const list = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const selector = m[1].trim();
    if (!selector || selector.startsWith('@')) continue;
    list.push({
      selector: selector.replace(/\s+/g, ' '),
      body: m[2],
      line: text.slice(0, m.index).split('\n').length,
    });
  }
  return list;
}

const declarations = (body) =>
  body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(':');
      return i < 0 ? null : { prop: d.slice(0, i).trim(), value: d.slice(i + 1).trim() };
    })
    .filter(Boolean);

const HEIGHT_PROPS = new Set(['height', 'min-height', 'max-height']);
const hasVh = (value) => /(^|[^a-z0-9-])\d*\.?\d+vh\b/i.test(value);
const hasDvh = (value) => /\d*\.?\d+(dvh|svh)\b/i.test(value);

/** `vh` is `lvh`: the LARGE viewport. A 100vh panel overshoots the screen while the URL bar shows. */
function checkDvh(files) {
  const failures = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const block of blocks(source)) {
      const decls = declarations(block.body);
      for (const [i, d] of decls.entries()) {
        if (!HEIGHT_PROPS.has(d.prop) || !hasVh(d.value)) continue;
        const twin = decls.slice(i + 1).some((later) => later.prop === d.prop && hasDvh(later.value));
        if (!twin) {
          failures.push({
            file: relative(REPO, file),
            line: block.line,
            selector: block.selector,
            detail: `${d.prop}: ${d.value} has no dvh/svh twin in the same block`,
          });
        }
      }
    }
  }
  return { name: 'dvh-not-vh', pass: failures.length === 0, failures };
}

const SAFE_BOTTOM = /env\(\s*safe-area-inset-bottom|var\(\s*--safe-bottom/;

/** A bar pinned to the bottom edge must pad past the home indicator / rounded corner. */
function checkSafeArea(files) {
  const failures = [];
  const checked = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const block of blocks(source)) {
      const decls = declarations(block.body);
      const pinned = decls.find((d) => d.prop === 'position' && /fixed|sticky/.test(d.value));
      if (!pinned) continue;
      const bottom = decls.find((d) => d.prop === 'bottom');
      // `inset: 0` covers the whole viewport: such a layer pads its CONTENT, and its own padding
      // declaration is what carries the inset (see .fd-gate, .fx-ceremony).
      if (!bottom || bottom.value === 'auto') continue;
      const entry = { file: relative(REPO, file), line: block.line, selector: block.selector };
      checked.push(entry);
      if (!SAFE_BOTTOM.test(block.body)) {
        failures.push({ ...entry, detail: `bottom: ${bottom.value} without env(safe-area-inset-bottom)` });
      }
    }
  }
  return { name: 'safe-area-bottom', pass: failures.length === 0, failures, checked };
}

/* ---------------------------------------------------------------- 2. the in-page audit (shared) */

/**
 * Runs inside the page. Returns every violation of rules 1-4 for `scope` (a selector or null for
 * the whole document). Kept as one function so it is injected once per call and never split.
 */
function auditInPage({ scope, target, bodyText, bodyTextChars, input, overflowSlack, exceptions }) {
  const root = scope ? document.querySelector(scope) : document.body;
  const fails = [];
  if (!root) return { fails: [{ rule: 'scope', detail: `scope ${scope} not found` }], counts: {} };

  const path = (el) => {
    const bits = [];
    for (let n = el; n && n.nodeType === 1 && bits.length < 4; n = n.parentElement) {
      const cls = typeof n.className === 'string' ? n.className.trim().split(/\s+/).slice(0, 2) : [];
      bits.unshift(n.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : ''));
    }
    return bits.join(' > ');
  };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);
  const shown = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    if (el.closest('[aria-hidden="true"], [inert], [hidden]')) return null;
    return { cs, r };
  };

  /* 1. horizontal overflow (always the whole document) */
  const docWidth = document.scrollingElement.scrollWidth;
  if (docWidth > window.innerWidth + overflowSlack) {
    const wide = [...document.querySelectorAll('body *')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.right > window.innerWidth + overflowSlack)
      .sort((a, b) => b.r.right - a.r.right)
      .slice(0, 5)
      .map(({ el, r }) => `${path(el)} right=${Math.round(r.right)}`);
    fails.push({ rule: 'overflow', detail: `scrollWidth ${docWidth} > innerWidth ${window.innerWidth}`, widest: wide });
  }

  /* 2. tap targets */
  const targets = [...root.querySelectorAll('button, a[href], [role="button"], summary, input[type="button"], input[type="submit"]')];
  let targetCount = 0;
  for (const el of targets) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
    const vis = shown(el);
    if (!vis) continue;
    targetCount += 1;
    const { cs, r } = vis;
    if (r.width >= target && r.height >= target) continue;
    /* WCAG 2.5.8 "Inline": the target sits in a sentence and is sized by the line-height of the
       text around it. Structural test, in three parts, all required:
         - the target lays out inline (inline, inline-block or inline-flex — our footer links are
           inline-flex only so they can carry a 44px min-height);
         - its parent is a TEXT container, not a flex/grid box. A flex child is blockified: the
           top bar's icon buttons are not "in a sentence" just because a coin chip sits beside them;
         - the parent really does hold other words (8+ characters beyond this target's own). */
    const inline = cs.display.startsWith('inline');
    const parent = el.parentElement;
    const parentDisplay = parent ? getComputedStyle(parent).display : '';
    const flowed = !parentDisplay.includes('flex') && !parentDisplay.includes('grid');
    const parentText = (parent?.textContent || '').trim().length;
    const ownText = (el.textContent || '').trim().length;
    if (inline && flowed && parentText > ownText + 8) continue;
    const named = exceptions.find((ex) => el.matches(ex.match) || el.closest(ex.match));
    if (named) continue;
    fails.push({
      rule: 'target',
      detail: `${Math.round(r.width)}x${Math.round(r.height)} < ${target}x${target}`,
      path: path(el),
      label: label(el),
    });
  }

  /* 3. body text — prose a player reads, not the words printed inside a control or a label.
     Excluded, deliberately: text inside a button / link / label / summary (that is the control's
     own name, sized with the control) and ALL-CAPS runs (eyebrows and section kickers, which are
     labels wearing letter-spacing). What is left is the fine print, and the fine print is where
     this product makes its honesty claims — so it is the text that most has to be readable. */
  let textCount = 0;
  for (const el of root.querySelectorAll('*')) {
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    if (own.length < bodyTextChars) continue;
    if (el.closest('button, a[href], [role="button"], label, summary')) continue;
    const vis = shown(el);
    if (!vis) continue;
    const caps = vis.cs.textTransform === 'uppercase' || (own === own.toUpperCase() && /[A-Z]/.test(own));
    if (caps) continue;
    textCount += 1;
    const size = parseFloat(vis.cs.fontSize);
    if (size + 0.01 < bodyText) {
      fails.push({ rule: 'body-text', detail: `${size}px < ${bodyText}px`, path: path(el), label: own.slice(0, 48) });
    }
  }

  /* 4. inputs */
  let inputCount = 0;
  for (const el of root.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select')) {
    const vis = shown(el);
    if (!vis) continue;
    inputCount += 1;
    const size = parseFloat(vis.cs.fontSize);
    if (size + 0.01 < input) {
      fails.push({ rule: 'input-text', detail: `${size}px < ${input}px`, path: path(el), label: el.id || label(el) });
    }
  }

  return { fails, counts: { targets: targetCount, bodyText: textCount, inputs: inputCount } };
}

/** Rule 7, run only on the Join view: what lies on the launch bar while a field has focus. */
function overlapInPage() {
  const bar = document.querySelector('.fd-launch');
  if (!bar) return { fails: [{ rule: 'launch-overlap', detail: '.fd-launch not rendered' }] };
  const b = bar.getBoundingClientRect();
  const focused = document.activeElement;
  if (!focused || !['INPUT', 'TEXTAREA'].includes(focused.tagName)) {
    return { fails: [{ rule: 'launch-overlap', detail: 'no input focused; test did not run' }] };
  }
  const fails = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el === bar || bar.contains(el) || el.contains(bar)) continue;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed') continue;
    if (cs.pointerEvents === 'none') continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
    const r = el.getBoundingClientRect();
    const w = Math.min(r.right, b.right) - Math.max(r.left, b.left);
    const h = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
    if (w > 1 && h > 1) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      fails.push({
        rule: 'launch-overlap',
        detail: `${Math.round(w)}x${Math.round(h)}px of ${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} over the launch bar`,
      });
    }
  }
  return { fails, focused: focused.id || focused.name || focused.tagName };
}

/* ------------------------------------------------------------------------- 3. driving the app */

const CLAIMED = { claimed: true, email: 'gate@example.com', skippedAt: [], visits: [] };

const wait = (page, ms) => page.waitForTimeout(ms);

/**
 * Scroll the control into the middle of the screen and click it on the element itself.
 *
 * Playwright's own click aims at a viewport point, and on a phone half this app's controls spend
 * some of their life under the fixed launch bar or the tab bar — at 360px the opponent segment
 * sits right under the launch bar until you scroll. A coordinate click there lands on the BAR and
 * silently starts a duel instead. The driver must not be the thing testing overlap; rule 7 is.
 */
async function tap(page, locator, settle = 650) {
  if (!(await locator.count())) return false;
  await locator.first().evaluate((el) => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    el.click();
  });
  await wait(page, settle);
  return true;
}

const tapNav = (page, id) => tap(page, page.locator(`[data-nav="${id}"]`).first(), 700);

/** Toasts and ceremonies cover the bars; close them before measuring anything. */
async function clearOverlays(page) {
  await page.evaluate(() => {
    for (const sel of ['.fx-ceremony-card button', '.fx-toast-close']) {
      for (const el of document.querySelectorAll(sel)) el.click();
    }
  });
  await wait(page, 200);
}

/**
 * Back to a plain screen before navigating. A Radix sheet is modal: with the settings sheet still
 * open, a tab-bar click lands on the overlay and the next screen silently never happens. Escape is
 * the sheet's own dismissal, and it is only sent when a sheet or dialog is actually open (in a
 * live room Escape is the leave prompt, which is not something to open by accident).
 */
async function closeSheets(page) {
  const open = await page.locator("[data-slot='sheet-content'], [role='dialog']").count();
  if (!open) return;
  await page.keyboard.press('Escape');
  await wait(page, 400);
}

/** Each screen: how to get there from a settled app. `fresh` reloads first. */
const SCREENS = [
  // The gate and the sheet are full-bleed layers over a live screen: the app behind them is still
  // in the DOM and still "visible" to getComputedStyle, so the audit is scoped to the layer that
  // actually has the player's thumb. Overflow is always measured on the whole document.
  { id: 'gate', gate: true, scope: '.fd-gate' },
  { id: 'home', go: (p) => tapNav(p, 'home') },
  { id: 'arena-quick', go: async (p) => (await tapNav(p, 'arena')) && pickMode(p, 'quick') },
  { id: 'arena-trilogy', go: async (p) => (await tapNav(p, 'arena')) && pickMode(p, 'trilogy') },
  { id: 'arena-gauntlet', go: async (p) => (await tapNav(p, 'arena')) && pickMode(p, 'gauntlet') },
  { id: 'passport', go: (p) => tapNav(p, 'passport') },
  { id: 'journal', go: (p) => tapNav(p, 'journal') },
  { id: 'events', go: openEvents },
  { id: 'rules', go: (p) => openFooter(p, 0) },
  { id: 'coin', go: (p) => openFooter(p, 1) },
  { id: 'trust', go: (p) => openFooter(p, 2) },
  { id: 'settings', go: openSettings, scope: "[data-slot='sheet-content']" },
  { id: 'join-focus', go: openJoinFocused, overlap: true },
  { id: 'finish', go: playBotDuel },
];

const pickMode = (page, mode) => tap(page, page.locator(`[data-mode="${mode}"]`).first(), 500);

async function openEvents(page) {
  if (!(await tapNav(page, 'home'))) return false;
  if (!(await tap(page, page.locator('.fd-ev-strip-all').first(), 800))) return false;
  return (await page.locator('.fd-events').count()) > 0;
}

async function openFooter(page, index) {
  if (!(await tapNav(page, 'home'))) return false;
  return tap(page, page.locator('.fd-footer .footer-rules').nth(index), 800);
}

async function openSettings(page) {
  if (!(await tapNav(page, 'home'))) return false;
  if (!(await tap(page, page.locator('.fd-topbar .fd-iconbtn').last(), 800))) return false;
  return (await page.locator("[data-slot='sheet-content']").count()) > 0;
}

/** Play > Join: the one place a phone shows a text field with the launch bar on screen. */
async function openJoinFocused(page) {
  if (!(await tapNav(page, 'arena'))) return false;
  const seg = page.locator('.fd-seg .fd-seg-btn');
  const n = await seg.count();
  if (!n) return false;
  if (!(await tap(page, seg.nth(n - 1)))) return false; // "Join" is always the last segment
  const field = page.locator('#join-name');
  if (!(await field.count())) return false;
  await field.focus();
  await wait(page, 400);
  return true;
}

/**
 * A real bot duel: Bot seat, Quick Draw, launch, ready, answer every question that appears, until
 * the room reports `[data-stage="finish"]`. Returns false (with the reason on the page) when the
 * room service cannot create a room — the finish screen is then recorded as skipped, not passed.
 */
async function playBotDuel(page) {
  if (!(await tapNav(page, 'arena'))) return false;
  await tap(page, page.locator('.fd-seg .fd-seg-btn').first()); // "Bot" is always the first segment
  await pickMode(page, 'quick');
  if (!(await tap(page, page.locator('.fd-launch-btn').first(), 300))) return false;
  for (let i = 0; i < 90; i += 1) {
    await wait(page, 500);
    const stage = await page.evaluate(() => {
      const room = document.querySelector('[data-stage]');
      return {
        stage: room ? room.getAttribute('data-stage') : null,
        answer: !!document.querySelector('.fd-answer:not([disabled])'),
        cta: !!document.querySelector('.fd-room .fd-cta:not([disabled])'),
      };
    });
    if (stage.stage === 'finish') {
      await wait(page, 900);
      await clearOverlays(page);
      return true;
    }
    if (stage.answer) {
      await tap(page, page.locator('.fd-answer:not([disabled])').first(), 200);
      continue;
    }
    if (stage.cta) {
      await tap(page, page.locator('.fd-room .fd-cta:not([disabled])').first(), 200);
      continue;
    }
    if (!stage.stage && i > 12) return false; // no room ever opened
  }
  return false;
}

/** Whatever the app is telling the player right now, for a skip reason that is not a guess. */
const pageNotice = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.notice-box, [role="alert"], .fd-error');
    return el ? el.textContent.trim().slice(0, 160) : '';
  });

/* --------------------------------------------------------------------------------- 4. the run */

mkdirSync(out, { recursive: true });
const sheets = cssFiles(join(REPO, 'app'))
  .concat(cssFiles(join(REPO, 'components')))
  .concat(cssFiles(join(REPO, 'static')))
  .sort();
const staticChecks = [checkDvh(sheets), checkSafeArea(sheets)];

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader'] });
const runs = [];

for (const vp of VIEWPORTS) {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      const tag = `${vp.width}-${locale}-${theme}`;
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        locale: locale === 'hi' ? 'hi-IN' : 'en-IN',
        colorScheme: theme,
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text().slice(0, 200));
      });
      await page.addInitScript(
        ([loc, th]) => {
          try {
            localStorage.setItem('fd-locale', loc);
            localStorage.setItem('fact-duel-online-theme', th);
            localStorage.setItem('fact-duel-online-sound', 'off');
            localStorage.setItem('fact-duel-motion', 'reduced');
            localStorage.setItem('fact-duel-name', 'Challenger');
          } catch {
            /* a blocked store is the app's problem, not the gate's */
          }
        },
        [locale, theme],
      );

      // The 320 width is the top-bar smoke test; everything else walks the whole screen list.
      const wanted = vp.scope ? ['home'] : SCREENS.map((s) => s.id);
      let claimed = false;
      for (const screen of SCREENS) {
        if (!wanted.includes(screen.id)) continue;
        const shot = `${tag}-${screen.id}.png`;
        const record = { viewport: vp.name, width: vp.width, locale, theme, screen: screen.id, shot };
        try {
          if (screen.gate) {
            await page.goto(base, { waitUntil: 'domcontentloaded' });
            await wait(page, 2200);
            if (!(await page.locator('.fd-gate').count())) {
              record.skipped = 'the profile gate did not open on a first landing';
            }
          } else {
            if (!claimed) {
              // localStorage belongs to an origin: land on the app before writing the claim, then
              // reload so the gate's one-decision-per-load store reads a settled record.
              if (!page.url().startsWith('http')) {
                await page.goto(base, { waitUntil: 'domcontentloaded' });
                await wait(page, 1200);
              }
              await page.evaluate((claim) => localStorage.setItem('fd-gate', JSON.stringify(claim)), CLAIMED);
              await page.goto(base, { waitUntil: 'domcontentloaded' });
              await wait(page, 2400);
              claimed = true;
            }
            await closeSheets(page);
            await clearOverlays(page);
            const arrived = await screen.go(page);
            if (!arrived) {
              record.skipped = (await pageNotice(page)) || 'screen not reachable from this build';
            }
            await clearOverlays(page);
          }
          await wait(page, 300);
          await page.screenshot({ path: join(out, shot), fullPage: false });
          if (!record.skipped) {
            const audit = await page.evaluate(auditInPage, {
              scope: vp.scope || screen.scope || null,
              target: THRESHOLDS.target,
              bodyText: THRESHOLDS.bodyText,
              bodyTextChars: THRESHOLDS.bodyTextChars,
              input: THRESHOLDS.input,
              overflowSlack: THRESHOLDS.overflowSlack,
              exceptions: EXCEPTIONS.map((e) => ({ match: e.match })),
            });
            record.counts = audit.counts;
            record.failures = audit.fails;
            if (screen.overlap) {
              const overlap = await page.evaluate(overlapInPage);
              record.failures = record.failures.concat(overlap.fails);
              record.focused = overlap.focused;
            }
          }
        } catch (e) {
          record.failures = [{ rule: 'driver', detail: String(e).slice(0, 200) }];
        }
        record.failures = record.failures || [];
        record.pass = !record.skipped && record.failures.length === 0;
        runs.push(record);
        const state = record.skipped ? `SKIP (${record.skipped})` : record.pass ? 'pass' : `FAIL ${record.failures.length}`;
        console.log(`${tag.padEnd(16)} ${screen.id.padEnd(16)} ${state}`);
        for (const f of record.failures.slice(0, 6)) console.log(`    ${f.rule}: ${f.detail}${f.path ? ` @ ${f.path}` : ''}${f.label ? ` "${f.label}"` : ''}`);
      }
      if (errors.length) console.log(`${tag.padEnd(16)} console errors: ${errors.length} — ${errors[0]}`);
      runs.push({ viewport: vp.name, locale, theme, screen: '(console)', pass: errors.length === 0, errors: errors.slice(0, 10), failures: [] });
      await ctx.close();
    }
  }
}
await browser.close();

const screenRuns = runs.filter((r) => r.screen !== '(console)');
const failed = screenRuns.filter((r) => !r.pass && !r.skipped);
const skipped = screenRuns.filter((r) => r.skipped);
const staticFailed = staticChecks.filter((c) => !c.pass);
const report = {
  startedAt: new Date().toISOString(),
  base,
  thresholds: THRESHOLDS,
  exceptions: EXCEPTIONS,
  viewports: VIEWPORTS,
  locales: LOCALES,
  themes: THEMES,
  static: staticChecks,
  runs,
  summary: {
    screens: screenRuns.length,
    passed: screenRuns.filter((r) => r.pass).length,
    failed: failed.length,
    skipped: skipped.length,
    staticFailed: staticFailed.length,
  },
};
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));

for (const check of staticChecks) {
  console.log(`css ${check.name}: ${check.pass ? 'pass' : `FAIL ${check.failures.length}`}`);
  for (const f of check.failures) console.log(`    ${f.file}:${f.line} ${f.selector} — ${f.detail}`);
}
console.log(
  `\n${report.summary.passed}/${report.summary.screens} screens pass, ${report.summary.failed} fail, ${report.summary.skipped} skipped. Report: ${join(out, 'report.json')}`,
);
process.exitCode = failed.length || staticFailed.length ? 1 : 0;
