/**
 * The phone gate's CSS layer (scripts/mobile-gate.mjs).
 *
 * Three of the gate's rules are decided by reading the stylesheets rather than by measuring a
 * box, because a headless Chromium on a rectangular viewport reports every `env(safe-area-inset-*)`
 * as 0px and `100vh` is only wrong while a URL bar is on screen. That makes this layer the part of
 * the gate that can fail a build with no browser in the room — and the part that has to be pinned
 * by tests, because a parser that quietly returns nothing reads exactly like a pass.
 *
 * Importing the script must not start a browser: everything under `main()` is behind the
 * `process.argv[1]` guard, and this file importing it at all is the assertion.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blocks,
  declarations,
  bottomOffset,
  topOffset,
  checkDvh,
  checkSafeArea,
  checkSafeTop,
  allowedSkip,
  allowedError,
  sheetsOf,
  SKIP_ALLOW,
  CONSOLE_ALLOW,
  PINNED_BY_MARKUP,
  PAGE_STICKY,
  THRESHOLDS,
  EXCEPTIONS,
} from '../scripts/mobile-gate.mjs';

/** Check a fixture sheet without touching the disk: `read` is the seam the checks take. */
const on = (css, check) => check(['fixture.css'], () => css);

test('blocks: a plain rule carries its selector, its declarations and its line', () => {
  const css = [
    '/* a comment',
    '   with 100vh in the prose */',
    '.fd-bar {',
    '  position: fixed;',
    '  bottom: 0;',
    '}',
  ].join('\n');
  const found = blocks(css);
  assert.equal(found.length, 1);
  assert.equal(found[0].selector, '.fd-bar');
  assert.deepEqual(found[0].selectors, ['.fd-bar']);
  assert.equal(found[0].line, 3, 'the line of the selector, not of the comment above it');
  assert.deepEqual(declarations(found[0].body), [
    { prop: 'position', value: 'fixed' },
    { prop: 'bottom', value: '0' },
  ]);
});

test('blocks: a comment is blanked, so prose about 100vh is not a declaration', () => {
  const found = blocks('/* height: 100vh; bottom: 0 */\n.fd-bar { color: red }');
  assert.equal(found.length, 1);
  assert.deepEqual(declarations(found[0].body), [{ prop: 'color', value: 'red' }]);
});

test('blocks: a nested rule is its own block, and does not swallow its parent', () => {
  // The regex this parser replaced returned ONE block for this input, with the literal string
  // `position: fixed; bottom: 0; height: 100vh; padding-bottom: 12px; & .kid` as its selector —
  // so both static checks went silent on a bottom bar with no safe-area inset AND a bare 100vh.
  const css =
    '.fd-bar {\n  position: fixed;\n  bottom: 0;\n  height: 100vh;\n  padding-bottom: 12px;\n  & .kid { color: red }\n}';
  const found = blocks(css);
  assert.deepEqual(
    found.map((b) => b.selector),
    ['.fd-bar', '.fd-bar .kid'],
  );
  const parent = found.find((b) => b.selector === '.fd-bar');
  assert.deepEqual(
    declarations(parent.body).map((d) => d.prop),
    ['position', 'bottom', 'height', 'padding-bottom'],
    'the nested rule’s declarations belong to the nested rule',
  );
  assert.deepEqual(declarations(found[1].body), [{ prop: 'color', value: 'red' }]);
});

test('blocks: nesting without `&` composes as a descendant, and `&` substitutes the parent', () => {
  const found = blocks('.fd-card {\n  color: red;\n  .fd-kid { color: blue }\n  &:hover { color: green }\n}');
  assert.deepEqual(
    found.map((b) => b.selector),
    ['.fd-card', '.fd-card .fd-kid', '.fd-card:hover'],
  );
});

test('blocks: a selector list splits, and a top-level comma inside :is() does not', () => {
  const [block] = blocks('.a, .b:is(.c, .d) { color: red }');
  assert.deepEqual(block.selectors, ['.a', '.b:is(.c, .d)']);
});

test('blocks: @media children are real rules and carry the condition; @keyframes are skipped', () => {
  const css =
    '@media (max-width: 599px) {\n  .fd-nav { bottom: 8px }\n}\n@keyframes spin { from { bottom: 0 } to { bottom: 9px } }';
  const found = blocks(css);
  assert.deepEqual(
    found.map((b) => b.selector),
    ['.fd-nav'],
    'a keyframe percentage is not a selector and must not be measured as one',
  );
  assert.deepEqual(found[0].at, ['@media (max-width: 599px)']);
});

test('blocks: a brace inside a quoted string does not open a rule', () => {
  const found = blocks('.fd-x::after { content: "{"; color: red }');
  assert.equal(found.length, 1);
  assert.deepEqual(
    declarations(found[0].body).map((d) => d.prop),
    ['content', 'color'],
  );
});

test('bottomOffset / topOffset read the inset shorthands the app actually writes', () => {
  assert.equal(bottomOffset('bottom', '0'), '0');
  assert.equal(bottomOffset('inset-block-end', '4px'), '4px');
  assert.equal(bottomOffset('inset-block', '10px 20px'), '20px');
  assert.equal(bottomOffset('inset-block', '10px'), '10px');
  assert.equal(bottomOffset('inset', '0'), '0');
  assert.equal(bottomOffset('inset', 'auto 0'), 'auto', 'two values are block then inline');
  assert.equal(bottomOffset('inset', 'auto 0 0 0'), '0', 'the settings sheet');
  assert.equal(
    bottomOffset('inset', '0 auto calc(10px + var(--safe-bottom)) auto'),
    'calc(10px + var(--safe-bottom))',
  );
  assert.equal(bottomOffset('padding-bottom', '10px'), null);
  assert.equal(topOffset('inset', 'auto 0 0 0'), 'auto');
  assert.equal(topOffset('inset', '0'), '0');
  assert.equal(topOffset('top', '12px'), '12px');
});

test('checkDvh: a vh height with no dvh twin in the same block fails, and the pass is recorded', () => {
  const bad = on('.fd-shell { min-height: 100vh; }', checkDvh);
  assert.equal(bad.pass, false);
  assert.equal(bad.failures.length, 1);
  assert.match(bad.failures[0].detail, /no dvh\/svh twin/);

  const good = on('.fd-shell { min-height: 100vh; min-height: 100dvh; }', checkDvh);
  assert.equal(good.pass, true);
  assert.equal(good.checked.length, 1, 'the twin case is still counted as inspected, not as absent');
});

test('checkDvh: the twin has to come after, and has to be the same property', () => {
  assert.equal(on('.a { min-height: 100dvh; min-height: 100vh; }', checkDvh).pass, false);
  assert.equal(on('.a { min-height: 100vh; height: 100dvh; }', checkDvh).pass, false);
});

test('checkDvh: `vh` inside a nested rule is seen', () => {
  const r = on('.fd-card {\n  color: red;\n  & .panel { height: 100vh }\n}', checkDvh);
  assert.equal(r.pass, false);
  assert.equal(r.failures[0].selector, '.fd-card .panel');
});

test('checkSafeArea: a bottom bar with no safe-area inset fails', () => {
  const r = on('.fd-bar { position: fixed; bottom: 0; padding-bottom: 12px; }', checkSafeArea);
  assert.equal(r.pass, false);
  assert.equal(r.checked.length, 1);
  assert.match(r.failures[0].detail, /without env\(safe-area-inset-bottom\)/);
});

test('checkSafeArea: the `inset` shorthand is a bottom offset (the app’s only bottom sheet)', () => {
  // app/shell/shell.css pins the settings sheet with `inset: auto 0 0 0`; a check that only reads
  // `bottom` never looks at it, and deleting its --safe-bottom padding still printed "pass".
  const bad = on('.fd-sheet { position: fixed; inset: auto 0 0 0; padding-bottom: 20px; }', checkSafeArea);
  assert.equal(bad.pass, false);
  assert.equal(bad.checked.length, 1);

  const good = on(
    '.fd-sheet { position: fixed; inset: auto 0 0 0; padding-bottom: calc(20px + var(--safe-bottom)); }',
    checkSafeArea,
  );
  assert.equal(good.pass, true);
  assert.equal(good.checked.length, 1, 'still inspected — a pass here is a pass on something');
});

test('checkSafeArea: `position` is resolved per selector across blocks, including a media override', () => {
  const split = on(
    '.fd-bar { position: fixed; }\n.fd-bar { bottom: 0; padding-bottom: 12px; }',
    checkSafeArea,
  );
  assert.equal(split.pass, false, 'position in one rule and bottom in another is the same bar');

  const media = on(
    [
      '.fd-nav { position: fixed; bottom: 0; padding-bottom: var(--safe-bottom); }',
      '@media (max-width: 599px) {',
      '  .fd-nav { bottom: 8px; padding-bottom: 12px; }',
      '}',
    ].join('\n'),
    checkSafeArea,
  );
  assert.equal(media.pass, false, 'the viewport step is how this repo writes overrides');
  assert.equal(media.checked.length, 2);
});

test('checkSafeArea: `bottom: auto` un-pins, and a selector nothing pins is not checked', () => {
  const unpinned = on(
    '.fd-nav { position: fixed; bottom: 0; padding-bottom: var(--safe-bottom); }\n@media (min-width: 900px) { .fd-nav { position: sticky; bottom: auto; top: 10px; } }',
    checkSafeArea,
  );
  assert.equal(unpinned.pass, true);
  assert.equal(unpinned.checked.length, 1);

  const flowed = on('.fd-card { bottom: 0; }', checkSafeArea);
  assert.equal(flowed.checked.length, 0, 'a `bottom` on a statically positioned box does nothing');
});

test('checkSafeArea: a layer pinned at both edges is full-bleed, recorded and not required to pad', () => {
  const r = on('.fd-gate { position: fixed; inset: 0; }', checkSafeArea);
  assert.equal(r.pass, true);
  assert.equal(r.checked.length, 0);
  assert.equal(r.spanned.length, 1, 'recorded, so the report says what was seen and skipped');
  assert.equal(r.spanned[0].spans, true);
  assert.equal(r.spanned[0].bottom, '0', 'the offset it would have been judged on is recorded');
});

test('checkSafeArea: PINNED_BY_MARKUP covers a bar whose `position` lives in a class list', () => {
  const entry = PINNED_BY_MARKUP.find((p) => p.selector.includes('sheet-content'));
  assert.ok(entry, 'the Radix sheet takes `fixed` from components/ui/sheet.tsx, not from CSS');
  assert.match(entry.reason, /sheet\.tsx/);
  const r = on(`${entry.selector} { inset: auto 0 0 0; padding-bottom: 20px; }`, checkSafeArea);
  assert.equal(r.pass, false, 'no CSS block declares position for it, and it still has to be checked');
});

test('the repo’s own stylesheets pass both static checks, and both inspect something', () => {
  const sheets = sheetsOf();
  assert.ok(sheets.length > 20, `expected the app’s stylesheets, found ${sheets.length}`);
  const dvh = checkDvh(sheets);
  const safe = checkSafeArea(sheets);
  assert.deepEqual(dvh.failures, []);
  assert.deepEqual(safe.failures, []);
  // A vacuous check is a check that never looked: these two numbers are the evidence, and the
  // report prints them next to the word "pass".
  assert.ok(dvh.checked.length >= 5, `dvh inspected ${dvh.checked.length} declarations`);
  assert.ok(safe.checked.length >= 6, `safe-area inspected ${safe.checked.length} pinned blocks`);
  assert.ok(
    safe.checked.some((c) => c.selector.includes('sheet-content')),
    'the settings sheet is the bottom sheet this check exists for',
  );
});

test('checkSafeTop: a fixed bar at the top edge must pad past the notch', () => {
  const bad = on('.fd-bar { position: fixed; top: 0; padding-top: 8px; }', checkSafeTop);
  assert.equal(bad.pass, false);
  assert.match(bad.failures[0].detail, /without env\(safe-area-inset-top\)/);

  const good = on(
    '.fd-bar { position: fixed; top: 0; padding-top: calc(8px + var(--safe-top)); }',
    checkSafeTop,
  );
  assert.equal(good.pass, true);
  assert.equal(good.checked.length, 1);
});

test('checkSafeTop: a sticky box sticks inside its scroller, so only the page-level bars are gated', () => {
  // `env(safe-area-inset-top)` on a sticky TABLE HEADER opens a 47px hole inside the table on an
  // iPhone. The repo has four of those (ops, analytics, a desktop rail, a lab status chip).
  const header = on('.fd-table thead th { position: sticky; top: 0; }', checkSafeTop);
  assert.equal(header.pass, true);
  assert.equal(header.checked.length, 0);
  assert.equal(header.nested.length, 1, 'recorded as a nested sticky, not silently dropped');

  const named = PAGE_STICKY.find((p) => p.selector === '.fd-topbar');
  assert.ok(named, 'the app bar is sticky at the page scroll root: the notch lands on it');
  assert.match(named.reason, /scroll root/);
  const bar = on(`${named.selector} { position: sticky; top: 0; padding: 8px; }`, checkSafeTop);
  assert.equal(bar.pass, false, 'a named page-level sticky bar IS gated');
});

test('checkSafeTop: an off-screen parking offset is not a pin to the top edge', () => {
  const r = on('.skip-link { position: fixed; top: -100px; }', checkSafeTop);
  assert.equal(r.pass, true);
  assert.equal(r.checked.length, 0);
  assert.equal(r.offscreen.length, 1, 'the rule that MOVES it on focus is the one that gets checked');
});

test('checkSafeTop: the repo pads the app bar, the toast stack and the desktop rail', () => {
  const top = checkSafeTop(sheetsOf());
  assert.deepEqual(top.failures, []);
  assert.ok(top.checked.length >= 3, `top inspected ${top.checked.length} pinned blocks`);
  assert.ok(top.checked.some((c) => c.selector === '.fd-topbar'));
});

test('allowedSkip: only the named screen, with the app’s own reason, and with nothing else wrong', () => {
  const room = { screen: 'finish', skipped: 'The room service is busy or unavailable.', failures: [] };
  assert.ok(allowedSkip(room), 'the dev server has no D1 binding; /api/duel answers 503');
  assert.ok(allowedSkip({ ...room, screen: 'question' }));
  assert.equal(allowedSkip({ ...room, screen: 'events' }), null, 'an unreachable Events tab is a regression');
  assert.equal(allowedSkip({ ...room, skipped: 'screen not reachable from this build' }), null);
  assert.equal(
    allowedSkip({ ...room, failures: [{ rule: 'driver', detail: 'Timeout' }] }),
    null,
    'a driver exception under a skip is not the reason the screen was skipped',
  );
  assert.equal(allowedSkip({ screen: 'finish', failures: [] }), null, 'a screen that did not skip');
  for (const entry of SKIP_ALLOW) assert.ok(entry.reason.length > 40, 'every allowed skip states why');
});

test('allowedError: the dev server’s /api 503s pass, a 404 on an app asset does not', () => {
  const dev = { kind: 'response', url: 'http://localhost:5173/api/duel', text: 'HTTP 503' };
  assert.ok(allowedError(dev), 'the dev server has no D1 binding');
  assert.ok(
    allowedError({ ...dev, url: 'http://localhost:5174/fact-duel/api/auth', text: 'HTTP 404' }),
    'the static preview has no API at all',
  );
  assert.equal(
    allowedError({ ...dev, text: 'HTTP 500' }),
    null,
    'a 500 on /api/ is a server bug, not a missing server',
  );
  assert.equal(allowedError({ ...dev, text: 'HTTP 401' }), null);
  assert.equal(
    allowedError({ kind: 'response', url: 'http://localhost:5173/assets/hero.png', text: 'HTTP 404' }),
    null,
  );
  assert.equal(allowedError({ kind: 'pageerror', text: 'TypeError: cannot read properties of null' }), null);
  assert.ok(
    allowedError({
      kind: 'requestfailed',
      url: 'https://fonts.googleapis.com/css2?family=Noto',
      text: 'net::ERR_CERT_AUTHORITY_INVALID',
    }),
  );
  assert.ok(
    allowedError({
      kind: 'console',
      text: 'Failed to load resource: the server responded with a status of 503',
    }),
  );
  for (const entry of CONSOLE_ALLOW) assert.ok(entry.reason.length > 40, 'every allowed error states why');
});

test('the thresholds are the numbers the skill documents, and the exception cap holds', () => {
  assert.equal(THRESHOLDS.target, 44);
  assert.equal(THRESHOLDS.bodyText, 14);
  assert.equal(THRESHOLDS.input, 16);
  assert.ok(EXCEPTIONS.length <= 2, 'the named tap-target exceptions are capped at two');
  for (const e of EXCEPTIONS) assert.ok(e.reason.length > 40);
});
