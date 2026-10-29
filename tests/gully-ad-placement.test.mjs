import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../app/ads/display-placement.tsx', import.meta.url), 'utf8');

function loadComponent(mode) {
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const imports = [];
  const sandboxRequire = (id) => {
    imports.push(id);
    if (id.endsWith('.css')) return {};
    if (id === 'react/jsx-runtime') return require(id);
    throw new Error(`Unexpected executable dependency: ${id}`);
  };
  new Function('require', 'module', 'exports', 'process', javascript)(sandboxRequire, module, module.exports, { env: { NODE_ENV: mode } });
  return { Component: module.exports.DisplayPlacement, imports };
}

test('default placement renders no DOM or gap; production cannot enable previews', () => {
  const development = loadComponent('development');
  assert.equal(development.Component({ placement: 'home-footer' }), null);
  const production = loadComponent('production');
  for (const placement of ['home-footer', 'learn-footer', 'results-footer'])
    assert.equal(production.Component({ placement, preview: true }), null);
});

test('explicit development previews are semantic noninteractive empty inventory', () => {
  const { Component, imports } = loadComponent('development');
  const { renderToStaticMarkup } = require('react-dom/server');
  for (const placement of ['home-footer', 'learn-footer', 'results-footer']) {
    const markup = renderToStaticMarkup(Component({ placement, preview: true }));
    assert.match(markup, /<aside/);
    assert.match(markup, new RegExp(`data-display-placement="${placement}"`));
    assert.match(markup, /Advertisements/);
    assert.match(markup, /no advertisement loaded/);
    assert.doesNotMatch(markup, /<(script|iframe|img|a|button|ins)\b|https?:\/\//i);
  }
  assert.equal(Component({ placement: 'question', preview: true }), null);
  assert.deepEqual([...new Set(imports)].sort(), ['./display-placement.css', 'react/jsx-runtime'].sort());
});

test('local in-memory result cannot mount a reload-backed H5 break', () => {
  const roomScreen = readFileSync(new URL('../app/screens/room-screen.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(roomScreen, /<CompletionAdBreak\b|import\s*\{\s*CompletionAdBreak\s*\}/);
  const humanScreen = readFileSync(new URL('../app/screens/online/live-duel-screen.tsx', import.meta.url), 'utf8');
  assert.match(humanScreen, /<CompletionAdBreak\b/);
});
