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
 *    0px and there is no way to emulate a notch, so a runtime check would pass vacuously. A
 *    selector is "pinned" when ANY block in the sheet set gives it `position: fixed|sticky` (this
 *    repo writes its viewport steps as `@media { .fd-nav { bottom: … } }`, and the Radix sheet
 *    takes its `fixed` from a Tailwind class in components/ui/sheet.tsx — see PINNED_BY_MARKUP);
 *    a bottom offset is read from `bottom`, `inset-block-end`, `inset-block` or the `inset`
 *    shorthand. Such a block must name `env(safe-area-inset-bottom)` or the `--safe-bottom` token
 *    that wraps it (tokens.css). A layer pinned at BOTH edges (`inset: 0`) is a full-bleed layer,
 *    not a bar: it is recorded in `spanned` and not required to pad, because its own padding does.
 * 5b. The same at the TOP edge ("no text under the notch"), with two narrowings that rule 5 does
 *    not need. `position: sticky` is relative to the nearest scrolling ancestor, and no stylesheet
 *    can say which that is: at the bottom, padding a nested sticky bar with the inset is invisible
 *    off a notched phone, but `env(safe-area-inset-top)` on a sticky TABLE HEADER would open a
 *    47px hole inside the table, so the top edge gates `position: fixed` plus the page-level bars
 *    named in PAGE_STICKY. And a negative offset (`.skip-link` at `top: -100px`) parks the element
 *    off screen; the rule that MOVES it is the one that gets checked.
 * 6. Full-height panels use dvh. Any `height/min-height/max-height` in `vh` must have a `dvh` or
 *    `svh` twin later in the same block (`vh` == `lvh`, the LARGE viewport, so a 100vh panel is
 *    taller than the screen while the URL bar is showing — MDN, CSS length, viewport units).
 * 7. Nothing fixed lies on the launch bar while an input is focused: the Play screen's Join view
 *    is opened, `#join-name` is focused, and every visible fixed element that is not the launch
 *    bar itself (and not a pointer-events:none paint layer) must not intersect its box.
 * 8. No page error, console error or failed request that is not on CONSOLE_ALLOW (with a reason).
 *    A React crash on a screen that still paints something is invisible to a screenshot pass.
 * 9. No screen skipped that is not on SKIP_ALLOW (with a reason). An unreachable screen is what a
 *    navigation regression looks like from here, so it fails rather than dropping out of the count.
 *
 * SCREENS (19): the profile gate, home, Expeditions (the atlas and a route's brief), Play with
 * each of the three formats selected, Player, Vault, Collections, Events, Play rules / Rules of
 * the coin / Trust, the coins card (the wallet chip's dialog), the settings sheet open, the Join
 * view with a focused field, a LIVE question stage (the duel is paused at `[data-stage="question"]`
 * with the answers enabled and nothing is tapped), and the finish screen reached by playing out.
 * The two duel screens need a build that can create a room: on `run-framework.mjs dev` there is
 * no D1 binding and `/api/duel` answers 503, so point the gate at the static preview
 * (`pnpm build:static && pnpm preview:static`) to cover them. When the room never opens the screen
 * is recorded as skipped WITH the server's reason, never as a pass, and only SKIP_ALLOW keeps that
 * skip from failing the run.
 *
 * NOT covered, named so nobody reads the run as the whole app: Discovery, Analytics, Showroom,
 * the ops dashboard, the Play rival-search state (it needs a second human in the queue), the
 * expedition run and finish views, and the ad card in its rewarded state (it needs a live ad).
 *
 * 320x568 is the top-bar smoke width: the whole document is checked for overflow, and the target
 * and type rules are scoped to `.fd-topbar`.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

/**
 * Screens allowed to record a SKIP without failing the run, and why each is allowed.
 *
 * A skip is NOT a pass and it is not free: an unreachable screen is what a navigation regression
 * looks like from here (rename a `data-nav`, drop `.fd-ev-strip-all`, leave a button `disabled`
 * and `tap()` returns false), so every skip fails the run unless it matches an entry here — same
 * screen, same reason in the app's own words — and carries no other failure.
 */
export const SKIP_ALLOW = Object.freeze([
  {
    screens: ['question', 'finish'],
    when: /room service|unavailable|busy|50[0-9]/i,
    reason:
      'Both screens need a room the server creates. `node scripts/run-framework.mjs dev` has no ' +
      'D1 binding, so POST /api/duel answers 503 and the lobby says so. Run the gate against the ' +
      'static preview (pnpm build:static && pnpm preview:static) to cover the live duel.',
  },
]);

/**
 * Errors a context may log without failing the run. Everything else — a React render crash, a
 * 404 on an app asset — fails, because a screen that still paints something is exactly the kind
 * of break a screenshot pass does not catch.
 *
 * Matched against `${kind} ${url} ${text}`, so an entry can name the request, not just the words
 * Chromium printed.
 */
export const CONSOLE_ALLOW = Object.freeze([
  {
    match: /^response \S*\/api\/\S*\sHTTP (503|404)$/,
    reason:
      'No server behind /api/, which both local targets say in their own way. The dev server ' +
      '(scripts/run-framework.mjs dev) has no D1 binding and answers 503; the static preview has ' +
      'no API routes at all and answers 404. The clients treat any non-2xx as "no server" and the ' +
      'UI says so in words. A 401, a 403 or a 500 on /api/ is NOT covered and fails the run.',
  },
  {
    match: /fonts\.(googleapis|gstatic)\.com/,
    reason:
      'The Devanagari webfont is fetched from Google Fonts at runtime (app/use-locale.tsx). In ' +
      'this sandbox the HTTPS proxy presents its own CA, which headless Chromium does not trust ' +
      '(ERR_CERT_AUTHORITY_INVALID); the Hindi locale falls back to a system Devanagari face, ' +
      'which is what the screenshots show. Not an app defect, and not reproducible off the sandbox.',
  },
  {
    match: /^requestfailed \S* net::ERR_ABORTED/,
    reason:
      'A cancelled request, not a failed one. The gate reloads the page twice during boot (land, ' +
      "write the gate claim, reload) and walks 19 screens back to back, so the app's own " +
      'in-flight fetches — every client in lib/ carries an AbortController — are cut off mid-air. ' +
      'Chromium reports a cancellation as a request failure; a real transport error arrives under ' +
      'its own net:: code and is not covered here.',
  },
  {
    match: /^console .*Failed to load resource/,
    reason:
      'Chromium prints a bare "Failed to load resource" for every failed request, with no URL. ' +
      'The `response` / `requestfailed` record for the same request carries the URL and the ' +
      'status, and that record is what the gate judges.',
  },
]);

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, scope: '.fd-topbar', note: 'top bar only' },
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '414x896', width: 414, height: 896 },
];
const LOCALES = ['en', 'hi'];
const THEMES = ['dark', 'light'];

/* ------------------------------------------------------------------ 1. the CSS (static) checks */

export function cssFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    const info = statSync(path);
    if (info.isDirectory()) cssFiles(path, found);
    else if (entry.endsWith('.css')) found.push(path);
  }
  return found;
}

/** Comments blanked to spaces, so every line number in this file survives the strip: prose about
 * `100vh` is not a declaration, and `/* … *\/` inside a selector list does not split it. */
const blankComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));

/** Line number of `index`, from a prefix table (a slice-per-block is O(n²) on a 2000-line sheet). */
function lineCounter(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text[i] === '\n') starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

/** Split on top-level whitespace: `calc(1px + 2px) 0` is two values, not four. */
function splitValues(value) {
  const parts = [];
  let depth = 0;
  let buf = '';
  for (const ch of value.trim()) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (!depth && /\s/.test(ch)) {
      if (buf) parts.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf) parts.push(buf);
  return parts;
}

/** Split a selector list on top-level commas (`:is(a, b)` stays one selector). */
function splitSelectors(list) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth += 1;
    if (ch === ')' || ch === ']') depth -= 1;
    if (ch === ',' && !depth) {
      if (buf.trim()) out.push(buf.trim().replace(/\s+/g, ' '));
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim().replace(/\s+/g, ' '));
  return out;
}

/** At-rules whose children are ordinary rules under a condition (the repo's viewport steps). */
const CONDITIONAL_AT = /^@(media|supports|container|layer|scope)\b/i;

/**
 * Every rule block in a sheet, nesting included, with the line its selector sits on.
 *
 * `body` is the block's OWN declarations — the text of a nested rule belongs to that nested rule,
 * not to its parent. A regex over `([^{}]+)\{([^{}]*)\}` cannot do this: given
 * `.fd-bar { position: fixed; bottom: 0; & .kid { … } }` it reports ONE block whose selector is
 * the literal string `position: fixed; bottom: 0; & .kid`, which matches no rule and silences
 * every check below it. The repo has no nesting today; this parser is what keeps the day someone
 * writes it from turning the two static checks off.
 *
 * Returns `{ selector, selectors, body, line, at }`: `selectors` is the composed list (`&` and
 * the descendant default applied against the enclosing rule), `at` the enclosing at-rule preludes.
 */
export function blocks(source) {
  const text = blankComments(source);
  const lineAt = lineCounter(text);
  const out = [];

  /** Walks one scope; returns the declarations that belong to it and pushes the rules inside. */
  const walk = (start, end, parents, at) => {
    let own = '';
    let i = start;
    let chunk = start;
    while (i < end) {
      const ch = text[i];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        i += 1;
        while (i < end && text[i] !== quote) i += text[i] === '\\' ? 2 : 1;
        i += 1;
        continue;
      }
      if (ch === ';') {
        i += 1;
        own += text.slice(chunk, i);
        chunk = i;
        continue;
      }
      if (ch === '{') {
        const raw = text.slice(chunk, i);
        const prelude = raw.trim();
        let depth = 1;
        let j = i + 1;
        while (j < end && depth) {
          const c = text[j];
          if (c === '"' || c === "'") {
            const quote = c;
            j += 1;
            while (j < end && text[j] !== quote) j += text[j] === '\\' ? 2 : 1;
          } else if (c === '{') depth += 1;
          else if (c === '}') depth -= 1;
          j += 1;
        }
        const innerStart = i + 1;
        const innerEnd = j - 1;
        if (prelude.startsWith('@')) {
          // `@media`/`@supports`/`@container`/`@layer`: the children are real rules under a
          // condition. `@keyframes`/`@font-face`/`@property` hold frames and descriptors, not
          // selectors, and are skipped whole.
          if (CONDITIONAL_AT.test(prelude))
            walk(innerStart, innerEnd, parents, at.concat(prelude.replace(/\s+/g, ' ')));
        } else if (prelude) {
          const parts = splitSelectors(prelude);
          const composed = parents.length
            ? parents.flatMap((p) => parts.map((s) => (s.includes('&') ? s.replace(/&/g, p) : `${p} ${s}`)))
            : parts;
          const body = walk(innerStart, innerEnd, composed, at);
          out.push({
            selector: composed.join(', '),
            selectors: composed,
            body,
            line: lineAt(chunk + (raw.length - raw.trimStart().length)),
            at,
          });
        }
        i = j;
        chunk = i;
        continue;
      }
      if (ch === '}') break;
      i += 1;
    }
    // A last declaration may have no semicolon before the closing brace.
    return own + text.slice(chunk, Math.min(i, end));
  };

  walk(0, text.length, [], []);
  return out.sort((a, b) => a.line - b.line);
}

export const declarations = (body) =>
  body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(':');
      return i < 0 ? null : { prop: d.slice(0, i).trim().toLowerCase(), value: d.slice(i + 1).trim() };
    })
    .filter(Boolean);

const HEIGHT_PROPS = new Set(['height', 'min-height', 'max-height']);
const hasVh = (value) => /(^|[^a-z0-9-])\d*\.?\d+vh\b/i.test(value);
const hasDvh = (value) => /\d*\.?\d+(dvh|svh)\b/i.test(value);

/** `vh` is `lvh`: the LARGE viewport. A 100vh panel overshoots the screen while the URL bar shows. */
export function checkDvh(files, read = (f) => readFileSync(f, 'utf8')) {
  const failures = [];
  const checked = [];
  for (const file of files) {
    for (const block of blocks(read(file))) {
      const decls = declarations(block.body);
      for (const [i, d] of decls.entries()) {
        if (!HEIGHT_PROPS.has(d.prop) || !hasVh(d.value)) continue;
        const entry = {
          file: relative(REPO, file),
          line: block.line,
          selector: block.selector,
          decl: `${d.prop}: ${d.value}`,
        };
        const twin = decls.slice(i + 1).some((later) => later.prop === d.prop && hasDvh(later.value));
        checked.push(entry);
        if (!twin)
          failures.push({ ...entry, detail: `${d.prop}: ${d.value} has no dvh/svh twin in the same block` });
      }
    }
  }
  return { name: 'dvh-not-vh', pass: failures.length === 0, failures, checked };
}

const SAFE_EDGE = {
  bottom: /env\(\s*safe-area-inset-bottom|var\(\s*--safe-bottom/,
  top: /env\(\s*safe-area-inset-top|var\(\s*--safe-top/,
};

/**
 * The bottom offset a declaration sets, or null when it sets none. `bottom` is not the only way
 * to hang a bar off the bottom edge: the settings sheet writes `inset: auto 0 0 0`, and a check
 * that only reads `bottom` never looks at the app's one bottom sheet.
 */
export function bottomOffset(prop, value) {
  const parts = splitValues(value);
  if (!parts.length) return null;
  if (prop === 'bottom' || prop === 'inset-block-end') return parts[0];
  if (prop === 'inset-block') return parts.length > 1 ? parts[1] : parts[0];
  if (prop === 'inset') {
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0];
    return parts[2];
  }
  return null;
}

/** The top offset the same declaration sets: `inset: 0` pins all four edges, and that is a
 * full-bleed layer (the gate, a ceremony), not a bar hanging off the bottom. */
export function topOffset(prop, value) {
  const parts = splitValues(value);
  if (!parts.length) return null;
  if (prop === 'top' || prop === 'inset-block-start') return parts[0];
  if (prop === 'inset-block' || prop === 'inset') return parts[0];
  return null;
}

const OFFSET_PROPS = new Set([
  'bottom',
  'top',
  'inset',
  'inset-block',
  'inset-block-start',
  'inset-block-end',
]);

/**
 * Selectors this repo pins from MARKUP rather than from CSS, with where the `position` comes from.
 * Without this the check cannot see the one bottom sheet in the app.
 */
export const PINNED_BY_MARKUP = Object.freeze([
  {
    selector: ".fd-sheet[data-slot='sheet-content']",
    reason:
      'Radix sheet content. `position: fixed` is a Tailwind utility in the class list at ' +
      'components/ui/sheet.tsx (`"fixed z-50 flex …"`), so no CSS block declares it; the bottom ' +
      'sheet is pinned with `inset: auto 0 0 0` in app/shell/shell.css.',
  },
]);

/** Which selectors this sheet set pins, and where that `position` was declared. */
function pinnedSelectors(parsed) {
  const pinned = new Map();
  for (const { file, blocks: list } of parsed) {
    for (const block of list) {
      const decls = declarations(block.body);
      const position = decls.find((d) => d.prop === 'position' && /\b(fixed|sticky)\b/.test(d.value));
      if (!position) continue;
      const kind = /fixed/.test(position.value) ? 'fixed' : 'sticky';
      for (const sel of block.selectors) {
        if (!pinned.has(sel)) pinned.set(sel, { kind, where: `${relative(REPO, file)}:${block.line}` });
      }
    }
  }
  for (const entry of PINNED_BY_MARKUP) pinned.set(entry.selector, { kind: 'fixed', where: 'markup' });
  return pinned;
}

/**
 * Sticky bars that stick to the VIEWPORT, because their scroll container is the page itself.
 * Everything else sticky (a table header, a desktop side rail) sticks inside a box, where the
 * notch is not a thing that can cover it.
 */
export const PAGE_STICKY = Object.freeze([
  {
    selector: '.fd-topbar',
    reason:
      'The app bar. app/shell/shell.css pins it `position: sticky; top: 0` as a direct child of ' +
      'the page scroll root (app/shell/app-shell.tsx), so its top edge IS the viewport top and ' +
      'the notch lands on it.',
  },
]);

/**
 * The shared body of the two safe-area checks: a block that pins a selector against `edge` must
 * name that edge's inset.
 *
 * `position` is resolved PER SELECTOR across the whole sheet set, not per block: this repo writes
 * its viewport steps as `@media { .fd-nav { bottom: … } }`, and a check that needs `position` and
 * `bottom` in one block skips every such override without a word.
 */
function checkSafeEdge(files, read, edge) {
  const near = edge === 'bottom' ? bottomOffset : topOffset;
  const far = edge === 'bottom' ? topOffset : bottomOffset;
  const parsed = files.map((file) => ({ file, blocks: blocks(read(file)) }));
  const pinned = pinnedSelectors(parsed);
  const failures = [];
  const checked = [];
  const spanned = [];
  const nested = [];
  const offscreen = [];
  for (const { file, blocks: list } of parsed) {
    for (const block of list) {
      const decls = declarations(block.body);
      if (!decls.some((d) => OFFSET_PROPS.has(d.prop))) continue;
      let mine = null;
      let other = null;
      for (const d of decls) {
        const a = near(d.prop, d.value);
        if (a !== null) mine = a;
        const b = far(d.prop, d.value);
        if (b !== null) other = b;
      }
      if (mine === null || mine === 'auto') continue;
      for (const sel of block.selectors) {
        const how = pinned.get(sel);
        if (!how) continue;
        // `sticky` is relative to the nearest SCROLLING ancestor, which no stylesheet can name.
        // At the bottom that costs nothing: padding a nested sticky bar with the bottom inset is
        // invisible off a notched phone, and the two sticky bottom bars in this app really do sit
        // over the home indicator. At the top it would be a bug — `env(safe-area-inset-top)` on a
        // sticky TABLE HEADER opens a 47px hole inside the table on an iPhone — so the top edge
        // gates `fixed` only, plus the page-level sticky bars named in PAGE_STICKY.
        if (edge === 'top' && how.kind === 'sticky' && !PAGE_STICKY.some((entry) => entry.selector === sel)) {
          nested.push({ file: relative(REPO, file), line: block.line, selector: sel, top: mine });
          continue;
        }
        // A negative offset parks the element off the screen until something moves it (the skip
        // link lives at -100px until it takes focus); the rule that moves it is what gets checked.
        if (String(mine).trim().startsWith('-')) {
          offscreen.push({ file: relative(REPO, file), line: block.line, selector: sel, [edge]: mine });
          continue;
        }
        const entry = {
          file: relative(REPO, file),
          line: block.line,
          selector: sel,
          [edge]: mine,
          position: how.where === 'markup' ? 'fixed (markup)' : `${how.kind} from ${how.where}`,
        };
        // Both edges pinned: a full-bleed layer, which pads its CONTENT — its own padding
        // declaration carries the inset (`.fd-gate`, `.fx-ceremony`). Recorded, not required.
        if (other !== null && other !== 'auto') {
          spanned.push({ ...entry, spans: true });
          continue;
        }
        checked.push(entry);
        if (!SAFE_EDGE[edge].test(block.body)) {
          failures.push({ ...entry, detail: `${edge}: ${mine} without env(safe-area-inset-${edge})` });
        }
      }
    }
  }
  return {
    name: `safe-area-${edge}`,
    pass: failures.length === 0,
    failures,
    checked,
    spanned,
    nested,
    offscreen,
  };
}

/** A bar pinned to the bottom edge must pad past the home indicator / the rounded corner. */
export function checkSafeArea(files, read = (f) => readFileSync(f, 'utf8')) {
  return checkSafeEdge(files, read, 'bottom');
}

/**
 * A bar pinned to the top edge must pad past the notch / the Dynamic Island — the roadmap's "no
 * text under the notch". Read from the CSS for the same reason as the bottom: a headless Chromium
 * on a rectangular viewport reports `env(safe-area-inset-top)` as 0px, so a bar that runs under
 * the camera looks perfect in every screenshot this script takes.
 */
export function checkSafeTop(files, read = (f) => readFileSync(f, 'utf8')) {
  return checkSafeEdge(files, read, 'top');
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
  const label = (el) =>
    (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);
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
    fails.push({
      rule: 'overflow',
      detail: `scrollWidth ${docWidth} > innerWidth ${window.innerWidth}`,
      widest: wide,
    });
  }

  /* 2. tap targets */
  const targets = [
    ...root.querySelectorAll(
      'button, a[href], [role="button"], summary, input[type="button"], input[type="submit"]',
    ),
  ];
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
      fails.push({
        rule: 'body-text',
        detail: `${size}px < ${bodyText}px`,
        path: path(el),
        label: own.slice(0, 48),
      });
    }
  }

  /* 4. inputs */
  let inputCount = 0;
  for (const el of root.querySelectorAll(
    'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select',
  )) {
    const vis = shown(el);
    if (!vis) continue;
    inputCount += 1;
    const size = parseFloat(vis.cs.fontSize);
    if (size + 0.01 < input) {
      fails.push({
        rule: 'input-text',
        detail: `${size}px < ${input}px`,
        path: path(el),
        label: el.id || label(el),
      });
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
      const cls =
        typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
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
  const open = await page.locator("[data-slot='sheet-content'], [role='dialog'], dialog[open]").count();
  if (!open) return;
  await page.keyboard.press('Escape');
  await wait(page, 400);
  // The coins card is a NATIVE <dialog> opened with showModal(), which makes the rest of the
  // document inert: while it is open a tap on the tab bar does nothing at all — not a miss, a
  // no-op — and the next screen would record a skip that means nothing. If Escape did not take,
  // close it the way the element itself would.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('dialog[open]')) el.close();
  });
  await wait(page, 250);
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
  { id: 'journeys', go: (p) => tapNav(p, 'journeys') },
  // The brief is where the Expeditions screen keeps its prose (how points work, the stake tiers)
  // and its sticky CTA; the atlas above it is cards. Both are walked.
  { id: 'journeys-brief', go: openExpeditionBrief },
  { id: 'passport', go: (p) => tapNav(p, 'passport') },
  { id: 'journal', go: (p) => tapNav(p, 'journal') },
  { id: 'collections', go: openCollections },
  { id: 'events', go: openEvents },
  { id: 'rules', go: (p) => openFooter(p, 0) },
  { id: 'coin', go: (p) => openFooter(p, 1) },
  { id: 'trust', go: (p) => openFooter(p, 2) },
  // The coins card is the one surface where coins are earned; the roadmap names it as a screen.
  { id: 'coins-card', go: openCoinsSheet, scope: '.fd-adsheet' },
  { id: 'settings', go: openSettings, scope: "[data-slot='sheet-content']" },
  { id: 'join-focus', go: openJoinFocused, overlap: true },
  // The live question stage: four answer buttons and the timer HUD, the most tap-target-critical
  // surface in the app. Both this and `finish` need a room the server will create.
  { id: 'question', go: (p) => playBotDuel(p, 'question'), needsRoom: true, live: true },
  { id: 'finish', go: (p) => playBotDuel(p, 'finish'), needsRoom: true },
];

const pickMode = (page, mode) => tap(page, page.locator(`[data-mode="${mode}"]`).first(), 500);

async function openEvents(page) {
  if (!(await tapNav(page, 'home'))) return false;
  if (!(await tap(page, page.locator('.fd-ev-strip-all').first(), 800))) return false;
  return (await page.locator('.fd-events').count()) > 0;
}

/** Expeditions > the first route's brief. `onSelect` opens it; the atlas is what tapNav lands on. */
async function openExpeditionBrief(page) {
  if (!(await tapNav(page, 'journeys'))) return false;
  if (!(await tap(page, page.locator('.fd-exp-card').first(), 800))) return false;
  return (await page.locator('.fd-exp-brief').count()) > 0;
}

/** Collections: Play > "see all subjects" (the `collections` tab is not in the phone tab bar). */
async function openCollections(page) {
  if (!(await tapNav(page, 'arena'))) return false;
  if (!(await tapNav(page, 'collections'))) return false;
  return (await page.locator('.fd-learn').count()) > 0;
}

async function openFooter(page, index) {
  if (!(await tapNav(page, 'home'))) return false;
  return tap(page, page.locator('.fd-footer .footer-rules').nth(index), 800);
}

/** The coins card: the wallet chip opens a native <dialog> holding the rewarded-ad card. */
async function openCoinsSheet(page) {
  if (!(await tapNav(page, 'home'))) return false;
  if (!(await tap(page, page.locator('.fd-topbar .fd-chip-top--coins').first(), 800))) return false;
  return (await page.locator('.fd-adsheet[open]').count()) > 0;
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
 * A real bot duel, driven to `stopAt`.
 *
 * `finish`: Bot seat, Quick Draw, launch, ready, answer every question that appears, until the
 * room reports `[data-stage="finish"]`.
 * `question`: the same drive, but it STOPS the first time a live question is on screen with its
 * answers enabled, and measures there. Nothing is answered, so the timer HUD, the four answer
 * buttons and the round note are audited exactly as a player meets them.
 *
 * Returns false (with the reason on the page) when the room service cannot create a room — the
 * screen is then recorded as skipped, and a skip only survives the exit code when SKIP_ALLOW
 * covers it.
 */
async function playBotDuel(page, stopAt = 'finish') {
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
    if (stopAt === 'question' && stage.stage === 'question' && stage.answer) {
      // No settle wait and no overlay sweep: the round clock is running and the point is to see
      // the stage as it is played. Nothing is tapped from here.
      return true;
    }
    if (stage.stage === 'finish') {
      if (stopAt !== 'finish') return false;
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

/**
 * Out of a live room, the way a player leaves one. With the room open the shell renders no tab
 * bar, so every screen after this one would record a false SKIP, and a reload does NOT help: the
 * seat is in sessionStorage and app/arena.tsx rejoins the room on load.
 *
 * It takes TWO taps on the same control, which is the app's own flow: the first opens the confirm
 * dialog and the confirm settles the room (the entry is refunded before the last round), but the
 * room stays mounted with its last stage on screen and the control relabelled "Back to play";
 * that second tap is the one that calls `resetLocal()` and hands the tab bar back. Measured on
 * the static preview: after the confirm, `[data-stage]` is still "question" and the seat is still
 * in sessionStorage.
 */
async function leaveRoom(page) {
  for (let i = 0; i < 3; i += 1) {
    if (!(await page.locator('[data-stage]').count())) return true;
    if (!(await page.locator('.fd-room-leave').count())) break;
    await tap(page, page.locator('.fd-room-leave').first(), 600);
    const action = page.locator("[data-slot='alert-dialog-action']");
    if (await action.count()) await tap(page, action.first(), 1200);
  }
  if (!(await page.locator('[data-stage]').count())) return true;
  // Last resort, so one stuck room cannot turn every later screen into a skip: drop the seat the
  // shell rejoins from and reload. The room is abandoned rather than left, which is not a thing a
  // player can do, so it is reported (`leftRoom: false`) rather than passed over.
  await page.evaluate(() => {
    try {
      sessionStorage.removeItem('fact-duel-online-seat');
    } catch {
      /* a blocked store is the app's problem, not the gate's */
    }
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await wait(page, 2400);
  return false;
}

/** Whatever the app is telling the player right now, for a skip reason that is not a guess. */
const pageNotice = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.notice-box, [role="alert"], .fd-error');
    return el ? el.textContent.trim().slice(0, 160) : '';
  });

/* --------------------------------------------------------------------------------- 4. the run */

/** Every stylesheet the app ships, in the order the static checks read them. */
export const sheetsOf = (repo = REPO) =>
  cssFiles(join(repo, 'app'))
    .concat(cssFiles(join(repo, 'components')))
    .concat(cssFiles(join(repo, 'static')))
    .sort();

/**
 * A screen gets this long before the driver gives up on it. A hung page — a renderer that stops
 * answering, a navigation that never settles — must FAIL that screen and let the run carry on;
 * `page.evaluate` has no timeout of its own, so without this one stuck screen hangs the whole
 * gate and CI waits forever for a report that is never written.
 */
export const SCREEN_TIMEOUT_MS = 90_000;

/** Rejects with `what` when `promise` has not settled inside `ms`. */
export function withTimeout(promise, ms, what) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`driver timed out after ${ms}ms on ${what}`)), ms);
    }),
  ]);
}

/** The allow-list entry that covers this error record, or null — then it fails the run. */
export const allowedError = (error) =>
  CONSOLE_ALLOW.find((a) => a.match.test(`${error.kind} ${error.url || ''} ${error.text || ''}`)) || null;

/**
 * The allow-list entry that covers this skip, or null — then it fails the run. A skip with any
 * failure recorded against it (a driver exception, say) is never allowed: the reason it gives is
 * not the reason it stopped.
 */
export const allowedSkip = (record) => {
  if (!record.skipped) return null;
  if ((record.failures || []).length) return null;
  return SKIP_ALLOW.find((a) => a.screens.includes(record.screen) && a.when.test(record.skipped)) || null;
};

async function main() {
  mkdirSync(out, { recursive: true });
  const sheets = sheetsOf();
  const staticChecks = [checkDvh(sheets), checkSafeArea(sheets), checkSafeTop(sheets)];

  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--no-sandbox', '--use-gl=swiftshader'],
  });
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
        // Four sources, because a console line that says "Failed to load resource" names no URL
        // and an allow-list cannot be honest about an error it cannot identify.
        const errors = [];
        page.on('pageerror', (e) => errors.push({ kind: 'pageerror', text: String(e).slice(0, 200) }));
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push({ kind: 'console', text: m.text().slice(0, 200) });
        });
        page.on('response', (r) => {
          if (r.status() >= 400)
            errors.push({ kind: 'response', url: r.url().slice(0, 200), text: `HTTP ${r.status()}` });
        });
        page.on('requestfailed', (r) =>
          errors.push({
            kind: 'requestfailed',
            url: r.url().slice(0, 200),
            text: (r.failure()?.errorText || 'failed').slice(0, 120),
          }),
        );
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
            await withTimeout(
              (async () => {
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
                    await page.evaluate(
                      (claim) => localStorage.setItem('fd-gate', JSON.stringify(claim)),
                      CLAIMED,
                    );
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
                  if (!screen.live) await clearOverlays(page);
                }
                await wait(page, screen.live ? 0 : 300);
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
              })(),
              SCREEN_TIMEOUT_MS,
              `${screen.id} on ${tag}`,
            );
          } catch (e) {
            record.failures = [{ rule: 'driver', detail: String(e).slice(0, 200) }];
          }
          record.failures = record.failures || [];
          // Leave the room before the next screen: with a room open the shell renders no tab bar,
          // so a room left behind turns every screen after it into a skip. Under the same deadline
          // as the screen itself — this walk drives a live page too, and it hung the run once.
          if (screen.live) {
            record.leftRoom = await withTimeout(
              leaveRoom(page),
              SCREEN_TIMEOUT_MS,
              `leaving the room after ${screen.id} on ${tag}`,
            ).catch((e) => {
              record.failures.push({ rule: 'driver', detail: String(e).slice(0, 200) });
              return false;
            });
          }
          const allowed = allowedSkip(record);
          if (record.skipped) record.skipAllowed = allowed ? allowed.reason : null;
          record.pass = !record.skipped && record.failures.length === 0;
          runs.push(record);
          const state = record.skipped
            ? `${allowed ? 'SKIP(allowed)' : 'SKIP'} (${record.skipped})`
            : record.pass
              ? 'pass'
              : `FAIL ${record.failures.length}`;
          console.log(`${tag.padEnd(16)} ${screen.id.padEnd(16)} ${state}`);
          for (const f of record.failures.slice(0, 6))
            console.log(
              `    ${f.rule}: ${f.detail}${f.path ? ` @ ${f.path}` : ''}${f.label ? ` "${f.label}"` : ''}`,
            );
        }
        const seen = [];
        for (const error of errors) {
          const allow = allowedError(error);
          seen.push({ ...error, allowed: !!allow, why: allow ? allow.reason : null });
        }
        const loud = seen.filter((e) => !e.allowed);
        if (seen.length)
          console.log(`${tag.padEnd(16)} page errors: ${seen.length} (${loud.length} not allowed)`);
        for (const e of loud.slice(0, 6))
          console.log(`    ${e.kind}: ${e.text}${e.url ? ` @ ${e.url}` : ''}`);
        runs.push({
          viewport: vp.name,
          locale,
          theme,
          screen: '(console)',
          pass: loud.length === 0,
          errors: seen.slice(0, 40),
          notAllowed: loud.length,
          failures: [],
        });
        await ctx.close();
      }
    }
  }
  await browser.close();

  const screenRuns = runs.filter((r) => r.screen !== '(console)');
  const consoleRuns = runs.filter((r) => r.screen === '(console)');
  const failed = screenRuns.filter((r) => !r.pass && !r.skipped);
  const skipped = screenRuns.filter((r) => r.skipped);
  const skippedLoud = skipped.filter((r) => !r.skipAllowed);
  const consoleFailed = consoleRuns.filter((r) => !r.pass);
  const staticFailed = staticChecks.filter((c) => !c.pass);
  const report = {
    startedAt: new Date().toISOString(),
    base,
    thresholds: THRESHOLDS,
    exceptions: EXCEPTIONS,
    skipAllow: SKIP_ALLOW.map((s) => ({ screens: s.screens, when: String(s.when), reason: s.reason })),
    consoleAllow: CONSOLE_ALLOW.map((c) => ({ match: String(c.match), reason: c.reason })),
    viewports: VIEWPORTS,
    locales: LOCALES,
    themes: THEMES,
    screens: SCREENS.map((s) => s.id),
    static: staticChecks,
    runs,
    summary: {
      screens: screenRuns.length,
      passed: screenRuns.filter((r) => r.pass).length,
      failed: failed.length,
      skipped: skipped.length,
      skippedNotAllowed: skippedLoud.length,
      consoleContextsFailed: consoleFailed.length,
      staticFailed: staticFailed.length,
    },
  };
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));

  for (const check of staticChecks) {
    console.log(
      `css ${check.name}: ${check.pass ? 'pass' : `FAIL ${check.failures.length}`} (${check.checked.length} blocks inspected${
        check.spanned ? `, ${check.spanned.length} full-bleed layers recorded and not required` : ''
      })`,
    );
    for (const f of check.failures) console.log(`    ${f.file}:${f.line} ${f.selector} — ${f.detail}`);
  }
  // Every skip, by screen AND by the reason the app gave, so a screen that skips for two reasons
  // cannot have one of them inherit the other's allow-list entry.
  const bySkip = new Map();
  for (const r of skipped) {
    const key = `${r.skipAllowed ? 'allowed' : 'NOT ALLOWED'} | ${r.screen} | ${r.skipped}`;
    bySkip.set(key, (bySkip.get(key) || 0) + 1);
  }
  for (const [key, count] of bySkip) console.log(`skip (${key.replace(' | ', ') ')} ${count}x`);
  if (consoleFailed.length) {
    console.log(
      `console: ${consoleFailed.length} of ${consoleRuns.length} contexts logged an error that is not allow-listed`,
    );
  }
  console.log(
    `\n${report.summary.passed}/${report.summary.screens} screens pass, ${report.summary.failed} fail, ` +
      `${report.summary.skipped} skipped (${report.summary.skippedNotAllowed} not allowed). Report: ${join(out, 'report.json')}`,
  );
  process.exitCode =
    failed.length || staticFailed.length || skippedLoud.length || consoleFailed.length ? 1 : 0;
}

// The CSS layer above is the part that gates a build without a browser, so it has to be importable
// without one: `node --test tests/mobile-gate.test.mjs` must not launch Chromium and walk 200
// screens. Everything under `main()` runs only when this file is the process entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
