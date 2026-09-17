/**
 * tests/stress-edge.test.mjs — edge cases a stress hunt reproduced against the running app, pinned
 * here so they cannot come back.
 *
 * The subject is a .tsx component, so the shipped source itself is transpiled and run inside a
 * minimal hook runtime: no copy of the logic lives in this file, and deleting the guard from
 * app/screens/room/auto-advance.tsx fails these tests.
 *
 * Defect pinned: the between-rounds auto-advance window fired while the page was hidden. A player
 * who switched tabs during the fact review came back to rounds that had started, run and scored
 * without them — and the match-level refund in app/arena.tsx could not help, because it only runs at
 * the instant of hiding and only when a round is already live. Hiding mid-round refunded the whole
 * match; hiding between rounds silently played it out.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { DICTIONARIES, bind } from '../lib/i18n/index.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'app/screens/room/auto-advance.tsx');

/** Transpile the real component and hand it stubbed imports plus a hook runtime we control. */
function loadComponent() {
  const js = ts.transpileModule(readFileSync(SOURCE, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      jsxFactory: 'h',
      jsxFragmentFactory: 'Frag',
    },
  }).outputText;
  const react = {};
  const h = (type, props, ...kids) => ({ type, props: props || {}, kids: kids.flat() });
  const fakeRequire = (id) => {
    if (id === 'react') return react;
    if (id === 'lucide-react') return new Proxy({}, { get: () => () => ({ kids: [] }) });
    if (id.startsWith('.'))
      return {
        usePress: () => () => {},
        useJuice: () => ({ sound() {}, haptic() {} }),
        // The locale hook over the real English dictionary, so the countdown digits are printed.
        useLocale: () => ({ ...bind(DICTIONARIES.en, 'en'), locale: 'en' }),
      };
    throw new Error(`unexpected import ${id}`);
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'h', 'Frag', js)(fakeRequire, mod, mod.exports, h, 'frag');
  return { Component: mod.exports.AutoAdvance, react };
}

/** useState / useRef / useEffect / useCallback, with effects flushed after each render. */
function mount(Component, props, react) {
  const hooks = [];
  let idx = 0;
  let queue = [];
  let tree = null;
  const render = () => {
    idx = 0;
    queue = [];
    tree = Component(props);
    for (const fn of queue) fn();
  };
  Object.assign(react, {
    useState(init) {
      const i = idx++;
      if (!hooks[i]) hooks[i] = { v: typeof init === 'function' ? init() : init };
      const cell = hooks[i];
      return [
        cell.v,
        (u) => {
          cell.v = typeof u === 'function' ? u(cell.v) : u;
          render();
        },
      ];
    },
    useRef(init) {
      const i = idx++;
      if (!hooks[i]) hooks[i] = { current: init };
      return hooks[i];
    },
    useEffect(fn, deps) {
      const i = idx++;
      const cell = hooks[i] || (hooks[i] = { deps: undefined, cleanup: null, first: true });
      const changed =
        cell.first ||
        !deps ||
        !cell.deps ||
        deps.length !== cell.deps.length ||
        deps.some((d, k) => !Object.is(d, cell.deps[k]));
      if (changed) {
        queue.push(() => {
          if (cell.cleanup) cell.cleanup();
          cell.cleanup = fn() || null;
          cell.deps = deps;
          cell.first = false;
        });
      }
    },
    useCallback: (fn) => {
      idx++;
      return fn;
    },
    useMemo: (fn) => {
      idx++;
      return fn();
    },
  });
  render();
  const text = (n) =>
    n == null || n === false ? '' : typeof n === 'object' ? (n.kids || []).map(text).join('') : String(n);
  return {
    text: () => text(tree),
    unmount() {
      for (const cell of hooks) if (cell && cell.cleanup) cell.cleanup();
    },
  };
}

/** The two signals app/arena.tsx and the window read, plus the event that announces a change. */
function fakeDocument() {
  const listeners = new Set();
  return {
    hidden: false,
    visibilityState: 'visible',
    addEventListener: (type, fn) => {
      if (type === 'visibilitychange') listeners.add(fn);
    },
    removeEventListener: (type, fn) => {
      if (type === 'visibilitychange') listeners.delete(fn);
    },
    set(hidden) {
      this.hidden = hidden;
      this.visibilityState = hidden ? 'hidden' : 'visible';
      for (const fn of [...listeners]) fn();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WINDOW = 200; // stands in for AUTO_ADVANCE_MS; the guard is about visibility, not duration

/* `t` so the panel is always torn down, even when an assertion throws: a live interval would keep
 * the test runner's event loop alive and hang the whole suite instead of failing it. */
function arm(t, { totalMs = WINDOW } = {}) {
  const doc = fakeDocument();
  globalThis.document = doc;
  const fires = [];
  const { Component, react } = loadComponent();
  const t0 = Date.now();
  const view = mount(
    Component,
    { totalMs, onFire: () => fires.push({ at: Date.now() - t0, hidden: doc.hidden }), onHold: () => {} },
    react,
  );
  t.after(() => view.unmount());
  return { doc, fires, view };
}

test.after(() => {
  delete globalThis.document;
});

test('the auto-advance window does not start a round while the page is hidden', async (t) => {
  const { doc, fires } = arm(t);
  await sleep(40);
  doc.set(true); // player switches tabs during the fact review, before the window fires
  assert.ok(doc.listenerCount > 0, 'the window must watch visibilitychange to be able to hold shut');
  await sleep(WINDOW * 2);
  assert.deepEqual(fires, [], 'a round was started on a hidden page — no refund rule can reach it');
  doc.set(false); // the player comes back
  await sleep(WINDOW * 2);
  assert.equal(fires.length, 1, 'the window must restart and fire once the page is visible again');
  assert.equal(fires[0].hidden, false);
  assert.ok(
    fires[0].at >= WINDOW + 40,
    `the returning player gets a full window, not the tail of one (fired at ${fires[0].at}ms)`,
  );
});

test('a visible between-rounds panel still advances itself exactly once', async (t) => {
  const { doc, fires, view } = arm(t);
  await sleep(WINDOW * 2);
  assert.equal(fires.length, 1, 'the no-click advance is the point of the panel and must survive the guard');
  assert.ok(fires[0].at >= WINDOW - 30, `fired too early (${fires[0].at}ms)`);
  assert.equal(doc.hidden, false);
  view.unmount();
  await sleep(WINDOW * 2);
  assert.equal(fires.length, 1, 'unmounting is cancelling: no round may start after the panel is gone');
  assert.equal(doc.listenerCount, 0, 'the visibility listener must be removed with the panel');
});

test('visibility flapping cannot send a second ready for the same round', async (t) => {
  const { doc, fires } = arm(t);
  await sleep(WINDOW * 2);
  assert.equal(fires.length, 1);
  // onFire sends `ready` asynchronously and the unmount that follows is a render away; a hide/show
  // inside that gap must not re-arm the window on a round that is already on its way.
  doc.set(true);
  doc.set(false);
  await sleep(WINDOW * 2);
  assert.equal(fires.length, 1, 'the window re-armed after firing and would send a duplicate ready');
});

test('the countdown the player reads is restarted, not stale, when they come back', async (t) => {
  const { doc, view } = arm(t, { totalMs: 1000 });
  await sleep(600);
  doc.set(true);
  await sleep(600);
  doc.set(false);
  assert.match(
    view.text(),
    /in 1s\./,
    `countdown did not reset on return: ${JSON.stringify(view.text().slice(0, 60))}`,
  );
});

/* ------------------------------------------------------------------------------------------------
 * Defect pinned: on the Play tab the fixed launch bar lay on top of the shell footer, so both
 * footer controls were dead taps — a real touchscreen tap aimed at the "Research & roadmap" link
 * (href="/studio") hit `BUTTON.fd-launch-btn` underneath and started a Quick Draw match instead.
 * `.fd-play` reserves the bar's height for its own content, but `<footer class="fd-footer">` is
 * rendered outside `<main>` (app/arena.tsx passes it as a shell prop) and so never gets that
 * padding. The page was already at maximum scroll, so nothing could free the controls.
 *
 * These tests do not re-describe the rule in JS. They parse the SHIPPED CSS — app/shell/shell.css,
 * app/screens/play/play.css, app/expeditions.css, app/theme/tokens.css — resolve the cascade for
 * `.fd-shell .fd-footer` at a given viewport width, evaluate the winning calc()/max() arithmetic
 * with the real token values, and compare the reserved band against the launch bar's own fixed
 * geometry. Deleting the `--fd-stick-h` term from shell.css fails them.
 * ---------------------------------------------------------------------------------------------- */

const CSS = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

/** Split a declaration list or a shorthand value on top-level separators, respecting parens. */
function splitTop(src, sep) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of src) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** Flatten a stylesheet to `{ media, selector, prop, value }` rows in source order. */
function parseRules(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rows = [];
  const walk = (text, media) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open === -1) break;
      let depth = 1;
      let j = open + 1;
      for (; j < text.length && depth > 0; j++) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
      }
      const head = text.slice(i, open).trim();
      const body = text.slice(open + 1, j - 1);
      if (head.startsWith('@media')) walk(body, [...media, head.slice(6).trim()]);
      else if (head.startsWith('@')) {
        /* @supports and friends: descend, keeping the media stack. */
        walk(body, media);
      } else {
        for (const sel of head
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)) {
          for (const decl of splitTop(body, ';')) {
            const c = decl.indexOf(':');
            if (c === -1) continue;
            rows.push({
              media,
              selector: sel,
              prop: decl.slice(0, c).trim(),
              value: decl.slice(c + 1).trim(),
            });
          }
        }
      }
      i = j;
    }
  };
  walk(src, []);
  return rows;
}

/** Only the width queries matter here; anything else must not be silently treated as applying. */
function mediaApplies(conditions, width) {
  return conditions.every((cond) => {
    const min = /\(\s*min-width\s*:\s*(\d+)px\s*\)/.exec(cond);
    if (min) return width >= Number(min[1]);
    const max = /\(\s*max-width\s*:\s*(\d+)px\s*\)/.exec(cond);
    if (max) return width <= Number(max[1]);
    return false;
  });
}

/** Substitute var(--x[, fallback]) from `tokens`, honouring the fallback when unset. */
function resolveVars(value, tokens, depth = 0) {
  assert.ok(depth < 12, `var() nesting runaway in ${value}`);
  const at = value.indexOf('var(');
  if (at === -1) return value;
  let d = 0;
  let end = at + 3;
  for (; end < value.length; end++) {
    if (value[end] === '(') d++;
    else if (value[end] === ')' && --d === 0) break;
  }
  const inner = value.slice(at + 4, end);
  const [name, ...rest] = splitTop(inner, ',');
  const fallback = rest.join(',').trim();
  const have = Object.prototype.hasOwnProperty.call(tokens, name);
  assert.ok(have || fallback, `no value and no fallback for ${name}`);
  const sub = have ? tokens[name] : fallback;
  return resolveVars(value.slice(0, at) + sub + value.slice(end + 1), tokens, depth + 1);
}

/** Evaluate a resolved length expression (calc/max/min over px) to a number of px. */
function px(value, tokens) {
  const expr = resolveVars(String(value), tokens)
    .replace(/\bcalc\(/g, '(')
    .replace(/\bmax\(/g, 'Math.max(')
    .replace(/\bmin\(/g, 'Math.min(')
    .replace(/(\d(?:\.\d+)?)px\b/g, '$1');
  assert.match(expr, /^[-\d\s.+*/()a-zA-Z,]*$/, `unexpected characters in ${expr}`);
  assert.doesNotMatch(
    expr.replace(/Math\.(max|min)/g, ''),
    /[a-zA-Z]/,
    `unresolved unit or keyword in ${expr}`,
  );
  const n = Function('Math', `"use strict";return (${expr});`)(Math);
  assert.ok(Number.isFinite(n), `${value} did not evaluate to a length (got ${n})`);
  return n;
}

/** env() has no value off-device; the real tokens file defers to these defaults. */
const TOKENS = (() => {
  const t = {};
  for (const r of parseRules(CSS('app/theme/tokens.css'))) {
    if (r.selector === ':root' && r.prop.startsWith('--')) {
      t[r.prop] = r.value.replace(/env\(\s*safe-area-inset-[a-z]+\s*,\s*([^)]+)\)/g, '$1');
    }
  }
  return t;
})();

/** Winning padding-bottom for `.fd-shell .fd-footer` at `width`, in px. */
function footerPaddingBottom(width, tokens) {
  const rows = parseRules(CSS('app/shell/shell.css')).filter(
    (r) => r.selector === '.fd-shell .fd-footer' && mediaApplies(r.media, width),
  );
  assert.ok(rows.length, `no .fd-shell .fd-footer rule applies at ${width}px`);
  let value = null;
  for (const r of rows) {
    if (r.prop === 'padding-bottom') value = r.value;
    else if (r.prop === 'padding') {
      const parts = splitTop(r.value, ' ');
      value = parts.length >= 3 ? parts[2] : parts[parts.length === 2 ? 0 : 0];
    }
  }
  assert.ok(value !== null, `.fd-shell .fd-footer sets no padding at ${width}px`);
  return px(value, tokens);
}

/** Every screen that publishes a sticky-bar height on :root, and what it publishes. */
function publishedStickHeights(width) {
  const out = [];
  for (const file of ['app/screens/play/play.css', 'app/expeditions.css']) {
    const rows = parseRules(CSS(file)).filter(
      (r) => r.prop === '--fd-stick-h' && r.selector.startsWith(':root') && mediaApplies(r.media, width),
    );
    if (rows.length)
      out.push({
        file,
        selector: rows[rows.length - 1].selector,
        value: px(rows[rows.length - 1].value, TOKENS),
      });
  }
  return out;
}

const MOBILE = [390, 360, 320];

test('the Play tab footer clears the fixed launch bar instead of sitting under it', () => {
  /* The bar's own geometry, read off play.css rather than restated here. */
  const play = parseRules(CSS('app/screens/play/play.css'));
  const launch = play.filter((r) => r.selector === '.fd-play .fd-launch' && mediaApplies(r.media, 390));
  const position = launch.findLast((r) => r.prop === 'position')?.value;
  const bottom = launch.findLast((r) => r.prop === 'bottom')?.value;
  assert.equal(position, 'fixed', 'this test assumes the launch bar overlays the page');
  const height = px(
    play.findLast((r) => r.selector === '.fd-play' && r.prop === '--fd-launch-h').value,
    TOKENS,
  );

  for (const width of MOBILE) {
    const tokens = { ...TOKENS, '--fd-stick-h': `${height}px` }; // :root:has(.fd-play .fd-launch)
    const barTop = px(bottom, tokens) + height; // px of viewport bottom the bar covers
    const reserved = footerPaddingBottom(width, tokens);
    assert.ok(
      reserved >= barTop,
      `at ${width}px the footer reserves ${reserved}px but the launch bar covers the bottom ${barTop}px: ` +
        `its last ${barTop - reserved}px of controls are dead taps that fire the bar underneath`,
    );
  }
});

test('the footer reserves every sticky-bar height the screens publish', () => {
  for (const width of MOBILE) {
    const published = publishedStickHeights(width);
    assert.ok(
      published.length >= 2,
      `expected play.css and expeditions.css to publish --fd-stick-h, got ${published.length}`,
    );
    for (const { file, selector, value } of published) {
      assert.ok(value > 0, `${file} publishes --fd-stick-h: ${value}px at ${width}px`);
      const tokens = { ...TOKENS, '--fd-stick-h': `${value}px` };
      const reserved = footerPaddingBottom(width, tokens);
      const floor = px('calc(var(--nav-h) + var(--safe-bottom))', tokens) + value;
      assert.ok(
        reserved >= floor,
        `${selector} (${file}) publishes ${value}px but at ${width}px the shell footer reserves only ${reserved}px, ` +
          `short of the ${floor}px the bar occupies`,
      );
    }
  }
});

test('a screen with no sticky bar gets no dead band, and the rail layout is untouched', () => {
  /* Unset must fall back to 0px, or the four tabs with no bar grow a phantom gap. */
  const plain = footerPaddingBottom(390, TOKENS);
  const navBand = px('calc(var(--nav-h) + var(--safe-bottom))', TOKENS);
  assert.equal(
    plain,
    18 + navBand,
    `with no --fd-stick-h published the footer must reserve only its own padding plus the tab bar, got ${plain}px`,
  );
  assert.match(
    parseRules(CSS('app/shell/shell.css'))
      .filter((r) => r.selector === '.fd-shell .fd-footer' && r.prop === 'padding' && !r.media.length)
      .at(-1).value,
    /var\(\s*--fd-stick-h\s*,\s*0px\s*\)/,
    'the coupling must be an explicit var(--fd-stick-h, 0px) so an unset screen is unaffected',
  );

  /* From 900px the nav is a left rail, the bars unpin, and the footer must not keep the band. */
  for (const width of [900, 1200, 1440]) {
    for (const { value } of publishedStickHeights(width))
      assert.equal(value, 0, `--fd-stick-h must be 0px at ${width}px`);
    assert.equal(
      footerPaddingBottom(width, { ...TOKENS, '--fd-stick-h': '0px' }),
      18,
      `the ${width}px footer padding changed; the rail layout reserves nothing`,
    );
  }
});

// ---------------------------------------------------------------------------
// Defect pinned: the brain hero's fragment shader did not compile, so the brain mesh never rendered
// on any device. EMISSIVE_PATCH injected `totalEmissiveRadiance *= vColor;` — but three 0.185
// declares `varying vec4 vColor;` under USE_COLOR (which `vertexColors: true` sets) while
// totalEmissiveRadiance is a vec3, so the whole MeshStandardMaterial program failed to link with
// "cannot convert from 'in highp 4-component vector of float' to 'highp 3-component vector of
// float'". The hero degraded to an empty wireframe cage and said nothing but one console line.
//
// Nothing below hard-codes the expected types: vColor's width, totalEmissiveRadiance's width and
// every #include anchor are read out of the installed three, and the GLSL is read out of the shipped
// component. Put the bare `vColor` back and these fail; bump three so vColor changes shape again and
// they fail too.
// ---------------------------------------------------------------------------

const THREE = await import('three');

const BRAIN_SOURCE = path.join(ROOT, 'components/three/brain-core.tsx');
const brainSource = readFileSync(BRAIN_SOURCE, 'utf8');

const WIDTH = { float: 1, vec2: 2, vec3: 3, vec4: 4 };

/** Pull a GLSL template-literal constant out of the shipped component. */
function glslConst(name) {
  const match = brainSource.match(new RegExp('const ' + name + ' = `([^`]*)`'));
  assert.ok(match, `${name} is no longer a plain template literal in ${BRAIN_SOURCE}`);
  return match[1];
}

/** The anchors makeBrainMaterial rewrites, split by which shader they belong to. */
function patchAnchors() {
  const vertexAt = brainSource.indexOf('shader.vertexShader = shader.vertexShader');
  const fragmentAt = brainSource.indexOf('shader.fragmentShader = shader.fragmentShader');
  assert.ok(vertexAt > 0 && fragmentAt > vertexAt, 'makeBrainMaterial no longer patches both shaders');
  const anchors = { vertex: [], fragment: [] };
  for (const m of brainSource.matchAll(/\.replace\('(#include <[\w\d./]+>)'/g)) {
    (m.index > fragmentAt ? anchors.fragment : anchors.vertex).push(m[1]);
  }
  assert.ok(anchors.vertex.length > 0 && anchors.fragment.length > 0);
  return anchors;
}

/** three's own resolveIncludes, run against the installed ShaderChunks. */
function resolveIncludes(src) {
  return src.replace(/^[ \t]*#include +<([\w\d./]+)>/gm, (_, name) => {
    const chunk = THREE.ShaderChunk[name];
    assert.ok(chunk !== undefined, `three r${THREE.REVISION} has no ShaderChunk <${name}>`);
    return resolveIncludes(chunk);
  });
}

/** The shaders three would hand the driver for the brain material, patched exactly as it is shipped. */
function composed() {
  const anchors = patchAnchors();
  const declarations = glslConst('FRAGMENT_DECLARATIONS');
  const patch = glslConst('EMISSIVE_PATCH');
  let vertex = THREE.ShaderLib.physical.vertexShader;
  let fragment = THREE.ShaderLib.physical.fragmentShader;
  for (const anchor of anchors.vertex) {
    assert.ok(vertex.includes(anchor), `physical vertex shader has no ${anchor} to patch`);
  }
  for (const anchor of anchors.fragment) {
    assert.ok(fragment.includes(anchor), `physical fragment shader has no ${anchor} to patch`);
  }
  vertex = vertex
    .replace('#include <common>', '#include <common>\nattribute float aFlow;\nvarying float vFlow;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFlow = aFlow;');
  fragment = fragment
    .replace('#include <common>', `#include <common>${declarations}`)
    .replace('#include <emissivemap_fragment>', patch);
  return { vertex: resolveIncludes(vertex), fragment: resolveIncludes(fragment), patch };
}

/** name -> declared scalar/vector type, harvested from the resolved GLSL. */
function symbols(glsl) {
  const table = new Map();
  for (const m of glsl.matchAll(
    /\b(?:uniform|varying|attribute|in|out)?\s*(float|vec2|vec3|vec4)\s+(\w+)\s*(?=[;=,)])/g,
  )) {
    const [, type, name] = m;
    (table.get(name) ?? table.set(name, new Set()).get(name)).add(type);
  }
  return table;
}

function soleType(table, name) {
  const types = table.get(name);
  assert.ok(types, `${name} is not declared in the composed shader`);
  assert.equal(types.size, 1, `${name} is declared as ${[...types].join(' and ')}; a human has to pick`);
  return [...types][0];
}

/** Every vector identifier read in `expr`, with the width its swizzle narrows it to. */
function operandWidths(expr, table) {
  const widths = [];
  for (const m of expr.matchAll(/\b([A-Za-z_]\w*)\s*(?:\.\s*([xyzwrgbastpq]+)\b)?/g)) {
    const [, name, swizzle] = m;
    if (!table.has(name)) continue;
    widths.push({
      name,
      ref: swizzle ? `${name}.${swizzle}` : name,
      width: swizzle ? swizzle.length : WIDTH[soleType(table, name)],
    });
  }
  return widths;
}

test('the brain emissive patch type-checks against the vColor three actually declares', () => {
  const { fragment, patch } = composed();
  const table = symbols(fragment);
  const target = soleType(table, 'totalEmissiveRadiance');
  const targetWidth = WIDTH[target];

  // Ground truth, so the failure message names the real cause rather than the symptom.
  assert.ok(brainSource.includes('vertexColors: true'), 'the brain material no longer sets USE_COLOR');
  const vColorWidth = WIDTH[soleType(table, 'vColor')];

  for (const line of patch.split('\n')) {
    const write = line.match(/^\s*(totalEmissiveRadiance)\s*(\*=|\+=|-=|\/=|=)\s*(.+);\s*$/);
    if (!write) continue;
    for (const operand of operandWidths(write[3], table)) {
      assert.ok(
        operand.width === 1 || operand.width === targetWidth,
        `GLSL type error in EMISSIVE_PATCH: \`${line.trim()}\` combines ${target} totalEmissiveRadiance ` +
          `with ${operand.ref} (${operand.width} components; ${operand.name} is declared ` +
          `${soleType(table, operand.name)} by three r${THREE.REVISION}). The whole MeshStandardMaterial ` +
          `program fails to compile and the brain mesh never draws. vColor is ${vColorWidth} components ` +
          `here — narrow it with .rgb.`,
      );
    }
  }
});

test('the brain material still patches #include anchors that exist in the shipped three', () => {
  // A renamed chunk would make onBeforeCompile a silent no-op: the mesh would compile and light, and
  // the cavity glow, rim and breathing wave would all quietly vanish. composed() asserts each anchor.
  const { fragment, patch } = composed();
  assert.ok(
    fragment.includes(patch.trim().split('\n').pop()),
    'the emissive patch did not land in the shader',
  );
  assert.ok(
    fragment.includes('uniform vec3 uRimColor;'),
    'the patch declarations did not land in the shader',
  );
});

test('the brain geometry ships the colour width the patched shader reads', async () => {
  const { brainGeometry } = loadBrainCore();
  const geometry = brainGeometry(2);
  const { vertex } = composed();
  const table = symbols(vertex);

  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (!table.has(name)) continue;
    assert.equal(
      attribute.itemSize,
      WIDTH[soleType(table, name)],
      `geometry attribute "${name}" is ${attribute.itemSize} components but the shader declares ${soleType(table, name)}`,
    );
  }

  // colour is 3 components and three sets vColor = vec4(1.0) before multiplying .rgb into it, so the
  // alpha lane the broken line was multiplying by is a constant the geometry never supplies: taking
  // .rgb is lossless, and this is why the fix is a swizzle rather than a vec4 accumulator.
  assert.equal(geometry.getAttribute('color').itemSize, 3);
  assert.match(THREE.ShaderChunk.color_vertex, /vColor = vec4\( 1\.0 \)/);
  assert.match(THREE.ShaderChunk.color_vertex, /vColor\.rgb \*= color/);
  geometry.dispose();
});

/** Run the real component module (and the real ./shared it leans on) with the React/R3F edges stubbed. */
function loadBrainCore() {
  const stubs = {
    react: { memo: (f) => f, useEffect() {}, useLayoutEffect() {}, useMemo() {}, useRef() {}, useState() {} },
    '@react-three/fiber': { useFrame() {}, useThree() {} },
    './scene-frame': { useSceneState: () => ({ inView: true }) },
    './lazy-scene': {},
  };
  const cache = new Map();
  const loadFile = (file) => {
    if (cache.has(file)) return cache.get(file);
    const js = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
        jsxFactory: 'h',
        jsxFragmentFactory: 'Frag',
      },
    }).outputText;
    const exported = {};
    cache.set(file, exported);
    const localRequire = (id) => {
      if (id === 'three') return THREE;
      if (id.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), id);
        if (stubs[id]) return stubs[id];
        return loadFile(resolved.endsWith('.tsx') ? resolved : `${resolved}.tsx`);
      }
      if (id in stubs) return stubs[id];
      if (id.startsWith('@react-three/drei')) return {};
      throw new Error(`brain-core loader has no stub for ${id}`);
    };
    const h = (type, props, ...kids) => ({ type, props: props || {}, kids });
    new Function('exports', 'require', 'h', 'Frag', js)(exported, localRequire, h, 'Frag');
    return exported;
  };
  return loadFile(BRAIN_SOURCE);
}

/* ---------------------------------------------------------------------------------------------
 * Defect pinned: the expedition calibration read-back praised the most miscalibrated run in the game.
 *
 * `lowerClean` asked whether every tier below the missing tier satisfied `n === correct` — which a
 * tier with NO cards satisfies vacuously. Any run that played a single tier therefore took the
 * praise branch, so a player who called Called on all six and missed all six (run score -18, 0/6)
 * was told "You were right about what you knew — and right about what you did not." on the one
 * surface whose job is calibration honesty, in the exact loss state §6.6 bans esteem-propping from.
 * All six Bold and all wrong (-6) printed it too: any single-tier run above Steady hit it.
 *
 * The subject is the shipped `calibrationRead` out of app/screens/expeditions/finish.tsx, transpiled
 * and run against tallies built by the real `runTally` from lib/expeditions.mjs — no copy of the
 * branch lives in this file, and restoring the vacuous `lowerClean` fails these tests.
 * ------------------------------------------------------------------------------------------- */

const FINISH_SOURCE = path.join(ROOT, 'app/screens/expeditions/finish.tsx');
const EXPEDITIONS = await import('../lib/expeditions.mjs');
const PROGRESSION = await import('../lib/progression.mjs');

const PRAISE = 'You were right about what you knew';
const HONEST = 'Your calls ran ahead of what you knew this time.';

/** The shipped module, with only the React/3D/icon edges stubbed; the stake tables are the real ones. */
function loadFinish() {
  const js = ts.transpileModule(readFileSync(FINISH_SOURCE, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      jsxFactory: 'h',
      jsxFragmentFactory: 'Frag',
    },
  }).outputText;
  const stub = new Proxy({}, { get: () => () => null });
  const fakeRequire = (id) => {
    if (id === '@/lib/expeditions.mjs') return EXPEDITIONS;
    if (id === '@/lib/progression.mjs') return PROGRESSION;
    if (id === 'react') return { useEffect() {}, useMemo: (f) => f(), useRef: () => ({ current: null }) };
    if (id === 'lucide-react' || id.startsWith('@/components') || id.startsWith('.')) return stub;
    throw new Error(`unexpected import ${id}`);
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'h', 'Frag', js)(
    fakeRequire,
    mod,
    mod.exports,
    () => null,
    'Frag',
  );
  return mod.exports;
}

/** A finished six-card run: `picks` are the tier per card, `hits` whether that card landed. */
const runOf = (picks, hits) => ({
  cards: picks.map((_, i) => ({ factId: `f${i}`, correctIndex: 1 })),
  answers: picks.map((confidence, i) => ({ confidence, choice: hits[i] ? 1 : 0 })),
});
const tallyOf = (picks, hits) => EXPEDITIONS.runTally(runOf(picks, hits));
const readOf = (picks, hits) => loadFinish().calibrationRead(tallyOf(picks, hits));
const six = (tier) => Array(6).fill(tier);
const rights = (k) => Array.from({ length: 6 }, (_, i) => i < k);

test('the calibration read-back does not praise a run that only ever played one tier and lost it', () => {
  // The -18 floor run: six Called, six wrong. This printed the praise line before the fix.
  const worst = readOf(six('called'), rights(0));
  assert.ok(!worst.includes(PRAISE), `the floor run was told: "${worst}"`);
  assert.equal(worst, `${HONEST} Six of the six are worth a second look.`);

  // One right out of six Called (-11) — the reporter's second repro.
  assert.equal(readOf(six('called'), rights(1)), `${HONEST} Five of the six are worth a second look.`);

  // And the case the reporter under-scoped: all six Bold, all wrong (-6) took the same branch,
  // because slice(0, 1) is ['steady'] and an unplayed Steady is vacuously clean.
  assert.equal(readOf(six('bold'), rights(0)), `${HONEST} Six of the six are worth a second look.`);
});

test('the calibration read-back still praises the runs that earned it', () => {
  // §6.5's own worked example: Steady 3 of 3, Bold 1 of 1, Called 0 of 2.
  assert.equal(
    readOf(
      ['steady', 'steady', 'steady', 'bold', 'called', 'called'],
      [true, true, true, true, false, false],
    ),
    'You were right about what you knew — and right about what you did not. The two Called cards that missed are the facts worth re-reading.',
  );
  // Five of six Called (+17) clears Called's own 2/3 threshold, so the honest line would under-credit
  // a genuinely well-calibrated player: single-tier is not by itself a reason to withhold the praise.
  assert.match(readOf(six('called'), rights(5)), /^You were right about what you knew/);
  // The reporter's control: a mixed 2/2/2 run at 3 right keeps the honest line.
  assert.equal(
    readOf(['steady', 'steady', 'bold', 'bold', 'called', 'called'], [true, true, true, false, false, false]),
    `${HONEST} Three of the six are worth a second look.`,
  );
  // Neither branch may claim anything at 6/6 or when nothing was over-called.
  assert.equal(
    readOf(six('called'), rights(6)),
    'Every card landed. Your calls and what you knew agreed on all six.',
  );
  // Every card above Steady landed and the only miss was a Steady card: neither call branch applies.
  assert.equal(
    readOf(['steady', 'steady', 'steady', 'steady', 'steady', 'bold'], [true, true, true, true, false, true]),
    'You did not over-call a single card. One of the six is worth a second look.',
  );
});

test('no run in the whole space is told it was right about what it knew without evidence', () => {
  const { calibrationRead } = loadFinish();
  // The spec's published indifference points (§1.2 / D3): Steady->Bold at 1/2, Bold->Called at 2/3.
  const BREAK_EVEN = { steady: 0, bold: 1 / 2, called: 2 / 3 };
  const ORDER = ['steady', 'bold', 'called'];
  let praised = 0;
  for (let p = 0; p < 3 ** 6; p += 1) {
    const picks = Array.from({ length: 6 }, (_, i) => ORDER[Math.floor(p / 3 ** i) % 3]);
    for (let h = 0; h < 2 ** 6; h += 1) {
      const hits = Array.from({ length: 6 }, (_, i) => !!((h >> i) & 1));
      const tally = tallyOf(picks, hits);
      if (!calibrationRead(tally).includes(PRAISE)) continue;
      praised += 1;
      const correct = ORDER.reduce((n, id) => n + tally[id].correct, 0);
      assert.ok(correct > 0, `praised a run with nothing right: ${JSON.stringify(tally)}`);
      const used = ORDER.filter((id) => tally[id].n > 0);
      if (used.length === 1 && used[0] !== 'steady') {
        const [id] = used;
        assert.ok(
          tally[id].correct / tally[id].n >= BREAK_EVEN[id],
          `praised a single-tier ${id} run at ${tally[id].correct}/${tally[id].n}, below its ${BREAK_EVEN[id]} break-even`,
        );
      }
    }
  }
  assert.ok(praised > 0, 'the sweep proved nothing: the praise branch never fired at all');
});

test('the finish screen renders the guarded read-back, not a second copy of the branch', () => {
  const src = readFileSync(FINISH_SOURCE, 'utf8');
  assert.match(
    src,
    /const read = calibrationRead\(tally\)/,
    'the component no longer calls the tested helper',
  );
  // One template literal owns the praise line (the other mentions are prose in the two doc blocks),
  // so the branch this file exercises is the branch the screen prints.
  assert.equal(
    src.split(`\${word(missCount)}`).length - 1,
    1,
    'the praise line is written in more than one place',
  );
});
