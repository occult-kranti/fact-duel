import test from 'node:test';
import assert from 'node:assert/strict';
import { getPrefs, reducedMotion, setPref, PREF_STORAGE_KEYS } from '../lib/fx/prefs.ts';

test('effects off survives the public settings setter and getter as a distinct motion choice', () => {
  const savedWindow = globalThis.window;
  const values = new Map();
  globalThis.window = {
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    matchMedia: () => ({ matches: false }),
  };
  try {
    setPref('motion', 'off');
    assert.equal(values.get(PREF_STORAGE_KEYS.motion), 'off');
    assert.equal(getPrefs().motion, 'off');
    assert.equal(reducedMotion(), true);
    setPref('motion', 'reduced');
    assert.equal(getPrefs().motion, 'reduced');
    assert.equal(reducedMotion(), true);
    setPref('motion', 'full');
    assert.equal(getPrefs().motion, 'full');
    assert.equal(reducedMotion(), false);
  } finally {
    if (savedWindow === undefined) delete globalThis.window;
    else globalThis.window = savedWindow;
  }
});
