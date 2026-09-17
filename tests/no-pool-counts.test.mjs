/**
 * Pool sizes are never shown in the product. The player must not learn how many questions the bank,
 * a topic, a drill or a set holds — the SEO pages under public/quiz are the only exception and are
 * built elsewhere. This is a source grep over the app's screens: every hit against a banned pattern
 * must be on the allowlist below, with a reason, and every allowlist entry must still be in use so
 * the list cannot rot. Counts of the player's OWN record (facts met, cards answered, entries behind a
 * journal filter) and the length of a RUN about to be played ("6 cards", "5 questions") are fine.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const EXCLUDED = ['app/api/', 'app/studio/', 'app/three-lab/', 'app/fx-lab/'];

const BANNED = [
  { name: 'HIDDEN_COUNT', re: /HIDDEN_COUNT/ },
  { name: 'QUESTIONS.length', re: /QUESTIONS\.length/ },
  { name: 'catalogue.count', re: /catalogue\??\.count\b/ },
  { name: 'cat.count', re: /\bcat\??\.count\b/ },
  { name: 't.count', re: /\bt\??\.count\b/ },
  { name: 'sample questions', re: /sample questions/i },
  { name: 'N-question', re: /\b\d+-question/ },
  { name: 'N questions/cards/facts', re: /\b\d+ (questions?|cards?|facts?)\b/ },
  { name: '{x.length} questions/cards/facts', re: /\.length\} (questions?|cards?|facts?)\b/ },
  { name: '{count}', re: /\{count\}/ },
];

/** Deliberate keeps: file, the exact text on the line, and why it is not a pool size. */
const ALLOW = [
  { file: 'app/screens/vault/bits.tsx', text: '{count}', why: 'Chip count is the player’s own journal tally behind a filter' },
  { file: 'app/collections.tsx', text: '${met} facts met', why: 'facts the player has met, from their own passport' },
  { file: 'app/discovery.tsx', text: '{cards.length} facts kept', why: 'recap of the cards the player just attempted' },
  { file: 'app/journal.tsx', text: '${deck.length} cards', why: 'the recall deck built from the player’s own due entries' },
  { file: 'app/journal.tsx', text: '${dueIds.length} card', why: 'the player’s own entries due for review today' },
  { file: 'app/journal.tsx', text: 'Review {dueEntries.length} card', why: 'the player’s own entries due for review today' },
  { file: 'app/screens/expeditions/clubhouse.tsx', text: '1 question', why: 'rounds in the Quick Draw mode about to be played' },
  { file: 'app/screens/expeditions/brief.tsx', text: '6 cards', why: 'run length of the expedition about to be played' },
  { file: 'app/screens/expeditions/clubhouse.tsx', text: '5 questions', why: 'rounds in the Gauntlet mode about to be played' },
  { file: 'app/screens/expeditions/clubhouse.tsx', text: '6 questions', why: 'run length of an expedition' },
  { file: 'app/screens/expeditions/parts.tsx', text: '2 cards', why: 'chapter length inside a six-card run' },
  { file: 'app/screens/home/expedition-card.tsx', text: '6 questions', why: 'run length of the expedition on the card' },
];

const files = globSync('app/**/*.tsx', { cwd: ROOT })
  .map((f) => f.replaceAll('\\', '/'))
  .filter((f) => !EXCLUDED.some((dir) => f.startsWith(dir)))
  .sort();

test('the app has screens to check', () => {
  assert.ok(files.length > 20, `expected the app screens, found ${files.length} files`);
  for (const f of files) assert.ok(!EXCLUDED.some((d) => f.startsWith(d)), f);
});

test('no screen prints a pool size', () => {
  const used = new Set();
  const offenders = [];
  for (const file of files) {
    const lines = readFileSync(resolve(ROOT, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      // Code comments are not copy; the player never reads them.
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const { name, re } of BANNED) {
        if (!re.test(line)) continue;
        const allowed = ALLOW.find((a) => a.file === file && line.includes(a.text));
        if (allowed) used.add(allowed);
        else offenders.push(`${relative(ROOT, resolve(ROOT, file))}:${i + 1} [${name}] ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `pool sizes must not be shown:\n${offenders.join('\n')}`);
  const stale = ALLOW.filter((a) => !used.has(a));
  assert.deepEqual(stale, [], 'allowlist entries no longer match anything; remove them');
});

test('every allowlist entry names a real file and a reason', () => {
  for (const a of ALLOW) {
    assert.ok(files.includes(a.file), `${a.file} is not a checked screen`);
    assert.ok(a.why.length > 10, `${a.file}: ${a.text} needs a reason`);
  }
});
