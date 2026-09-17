/**
 * The pop-up budget (components/fx/overlay-budget.ts) under a fake clock, plus the merge copy that
 * `app/screens/use-progression-feedback.tsx` writes on top of it.
 *
 * What is being proved: a reward burst can never bury the player. At most two weight units are on
 * screen, two overlays never arrive in the same instant, a ceremony fills the budget on its own,
 * same-kind toasts inside one burst collapse into a single overlay, dismissing frees the slot —
 * and nothing is ever dropped: every payload handed to the scheduler comes back out, once, either
 * as its own overlay or merged into one.
 *
 * Ordering is priority-then-FIFO, and that is here because of a real defect: a ceremony belongs to
 * the screen that raised it. Behind a queue of toasts the expedition stamp opened four to six
 * seconds late, full-screen, over whatever screen the player had moved to. So a ceremony jumps
 * queued toasts, sends on-screen toasts back to the queue (they return, unchanged), and does not
 * sit out the 1200 ms gap when the budget is empty.
 *
 * Time is injected, so every assertion here is about exact milliseconds rather than about "roughly".
 * The merge-copy tests transpile and run the SHIPPED .tsx, so no copy of that logic lives here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const {
  createOverlayBudget,
  OVERLAY_CAPACITY,
  OVERLAY_GAP_MS,
  OVERLAY_MERGE_WINDOW_MS,
  OVERLAY_PRIORITY,
  OVERLAY_WEIGHT,
} = await import('../components/fx/overlay-budget.ts');

const require = createRequire(import.meta.url);
const ts = require('typescript');
const ROOT = path.resolve(import.meta.dirname, '..');
const FEEDBACK_SOURCE = path.join(ROOT, 'app/screens/use-progression-feedback.tsx');
const PROGRESSION = await import('../lib/progression.mjs');

/** The shipped progression-feedback module with its React/3D/icon edges stubbed out. */
function loadFeedback() {
  const js = ts.transpileModule(readFileSync(FEEDBACK_SOURCE, 'utf8'), {
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
    if (id === '@/lib/progression.mjs') return PROGRESSION;
    if (id === 'react' || id.startsWith('@/') || id.startsWith('.')) return stub;
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

/** A clock whose timers only fire when the test says so. */
function fakeClock(start = 0) {
  let now = start;
  let nextId = 0;
  const timers = new Map();
  const clock = {
    now: () => now,
    setTimer: (fn, ms) => {
      nextId += 1;
      timers.set(nextId, { at: now + Math.max(0, ms), fn });
      return nextId;
    },
    clearTimer: (id) => void timers.delete(id),
  };
  /** Run every timer due at or before `target`, in due order, then land on `target`. */
  const runTo = (target) => {
    for (let guard = 0; guard < 10000; guard += 1) {
      let pick = null;
      for (const [id, entry] of timers) {
        if (entry.at > target) continue;
        if (pick === null || entry.at < timers.get(pick).at || (entry.at === timers.get(pick).at && id < pick)) {
          pick = id;
        }
      }
      if (pick === null) break;
      const entry = timers.get(pick);
      timers.delete(pick);
      now = Math.max(now, entry.at);
      entry.fn();
    }
    now = target;
  };
  return {
    clock,
    now: () => now,
    advance: (ms) => runTo(now + ms),
  };
}

/** Records every grant and the high-water mark of what was on screen. */
function watch(budget) {
  const grants = [];
  const seen = new Set();
  let peakUnits = 0;
  let peakCount = 0;
  const sample = () => {
    const snap = budget.getSnapshot();
    peakUnits = Math.max(peakUnits, snap.used);
    peakCount = Math.max(peakCount, snap.active.length);
    for (const g of snap.active) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      grants.push({ id: g.id, type: g.type, at: g.grantedAt, ids: g.ids.slice(), items: g.items.slice() });
    }
  };
  budget.subscribe(sample);
  sample();
  return {
    grants,
    sample,
    peakUnits: () => peakUnits,
    peakCount: () => peakCount,
  };
}

test('the constants are the ones the roadmap names', () => {
  assert.equal(OVERLAY_CAPACITY, 2);
  assert.equal(OVERLAY_GAP_MS, 1200);
  assert.equal(OVERLAY_MERGE_WINDOW_MS, 800);
  assert.deepEqual(OVERLAY_WEIGHT, { toast: 1, ceremony: 2 });
  assert.deepEqual(OVERLAY_PRIORITY, { toast: 0, ceremony: 1 });
});

test('a burst of 7 rewards: never more than two, never at once, in order, nothing lost', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  // Seven distinct rewards — different merge keys, so none of them collapse into each other.
  const asked = [];
  for (let i = 0; i < 7; i += 1) {
    asked.push(budget.request({ type: 'toast', id: `r${i}`, mergeKey: `k${i}`, payload: { n: i } }));
  }
  assert.deepEqual(asked, ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6']);

  // Drive time forward; each overlay auto-dismisses 3200 ms after it opened, like a real toast.
  for (let step = 0; step < 400; step += 1) {
    t.advance(50);
    spy.sample();
    for (const g of budget.getSnapshot().active) {
      if (g.grantedAt >= 0 && t.now() - g.grantedAt >= 3200) budget.release(g.id);
    }
    spy.sample();
  }

  assert.equal(spy.grants.length, 7, 'every reward opened');
  assert.deepEqual(
    spy.grants.map((g) => g.id),
    ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
    'deterministic FIFO order',
  );
  assert.ok(spy.peakUnits() <= OVERLAY_CAPACITY, `peak ${spy.peakUnits()} units exceeded the budget`);
  assert.ok(spy.peakCount() <= 2, `peak ${spy.peakCount()} overlays on screen`);

  for (let i = 1; i < spy.grants.length; i += 1) {
    const gap = spy.grants[i].at - spy.grants[i - 1].at;
    assert.ok(gap >= OVERLAY_GAP_MS, `grant ${i} opened ${gap} ms after the one before it`);
  }
  assert.equal(budget.getSnapshot().queued.length, 0, 'the queue drained');
});

test('the first overlay is immediate; the second waits out the gap', () => {
  const t = fakeClock(5_000);
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  budget.request({ type: 'toast', id: 'a', payload: 1 });
  budget.request({ type: 'toast', id: 'b', payload: 2 });
  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a']);
  assert.equal(spy.grants[0].at, 5_000);

  t.advance(1_199);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a'], 'still alone at +1199 ms');
  t.advance(1);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a', 'b']);
  assert.equal(spy.grants[1].at, 6_200);
  assert.equal(budget.getSnapshot().active.length, 2);
});

test('a ceremony fills the budget: it goes first, alone, and the toasts follow', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  budget.request({ type: 'toast', id: 'before', payload: 'toast' });
  budget.request({ type: 'ceremony', id: 'cer', payload: 'ceremony' });
  budget.request({ type: 'toast', id: 'after', payload: 'toast' });

  // Nothing was on screen yet, so the ceremony outranks both toasts and takes the whole budget
  // straight away — the toast asked for first is not lost, it is waiting.
  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['cer']);
  let snap = budget.getSnapshot();
  assert.equal(snap.active.length, 1);
  assert.equal(snap.used, 2, 'the ceremony is the whole budget');
  assert.deepEqual(snap.queued.map((g) => g.id), ['before', 'after']);

  // While it is open, the waiting toasts stay waiting however long we run the clock.
  t.advance(30_000);
  assert.deepEqual(spy.grants.map((g) => g.id), ['cer'], 'the ceremony is alone on screen');
  assert.deepEqual(budget.getSnapshot().active.map((g) => g.type), ['ceremony']);

  // A toast, unlike a ceremony, does wait out the gap after the ceremony settles.
  budget.release('cer');
  t.advance(OVERLAY_GAP_MS - 1);
  assert.deepEqual(spy.grants.map((g) => g.id), ['cer'], 'gap respected after the release');
  t.advance(1);
  assert.deepEqual(spy.grants.map((g) => g.id), ['cer', 'before']);
  t.advance(OVERLAY_GAP_MS);
  assert.deepEqual(spy.grants.map((g) => g.id), ['cer', 'before', 'after'], 'ask order among toasts');
  assert.ok(spy.peakUnits() <= OVERLAY_CAPACITY);
});

test('a ceremony asked for behind three queued toasts opens first', () => {
  const t = fakeClock();
  // Quiet holds the pump so all four are genuinely queued together, as they are when a player
  // leaves a room and both gates lift in one commit.
  const budget = createOverlayBudget({ clock: t.clock, quiet: true });
  const spy = watch(budget);

  budget.request({ type: 'toast', id: 't1', mergeKey: 'a', payload: 1 });
  budget.request({ type: 'toast', id: 't2', mergeKey: 'b', payload: 2 });
  budget.request({ type: 'toast', id: 't3', mergeKey: 'c', payload: 3 });
  budget.request({ type: 'ceremony', id: 'cer', payload: 'level-up' });
  assert.deepEqual(
    budget.getSnapshot().queued.map((g) => g.id),
    ['cer', 't1', 't2', 't3'],
    'priority first, then the order they were asked for',
  );

  budget.setQuiet(false);
  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['cer'], 'the ceremony did not queue behind them');

  // Every toast still opens, in the order it was asked for: jumping the queue drops nothing.
  budget.release('cer');
  for (let step = 0; step < 400; step += 1) {
    t.advance(50);
    spy.sample();
    for (const g of budget.getSnapshot().active) {
      if (g.grantedAt >= 0 && t.now() - g.grantedAt >= 3200) budget.release(g.id);
    }
    spy.sample();
  }
  assert.deepEqual(spy.grants.map((g) => g.id), ['cer', 't1', 't2', 't3']);
  assert.ok(spy.peakUnits() <= OVERLAY_CAPACITY);
});

test('the expedition stamp: a ceremony 280 ms behind a toast opens inside 300 ms', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  // The real sequence at the end of an expedition: the progression flush toasts
  // 'expedition-complete' as the finish screen mounts, and finish.tsx asks for the stamp 280 ms
  // later. Behind a strict FIFO queue that stamp opened at 4400 ms — on whatever screen the player
  // had tapped through to by then.
  budget.request({ type: 'toast', id: 'expedition-complete', mergeKey: 'prog:expedition', payload: 'toast' });
  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['expedition-complete']);

  t.advance(280);
  const askedAt = t.now();
  budget.request({ type: 'ceremony', id: 'stamp', payload: 'stamp' });
  t.advance(0);

  const stamp = spy.grants.find((g) => g.id === 'stamp');
  assert.ok(stamp, 'the stamp opened');
  assert.ok(stamp.at - askedAt <= 300, `the stamp opened ${stamp.at - askedAt} ms after it was asked for`);
  let snap = budget.getSnapshot();
  assert.deepEqual(snap.active.map((g) => g.id), ['stamp'], 'alone on screen');
  assert.equal(snap.used, 2);
  assert.deepEqual(
    snap.queued.map((g) => g.id),
    ['expedition-complete'],
    'the toast it displaced is back at the front of the queue, not dropped',
  );

  // The player reads the stamp and closes it; the toast returns with its payload intact.
  t.advance(4_000);
  budget.release('stamp');
  t.advance(OVERLAY_GAP_MS);
  snap = budget.getSnapshot();
  assert.deepEqual(snap.active.map((g) => g.id), ['expedition-complete']);
  assert.deepEqual(snap.active[0].items, ['toast']);
  assert.ok(spy.peakUnits() <= OVERLAY_CAPACITY);
});

test('an open ceremony is never preempted, and the next one does not wait on a blank screen', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  budget.request({ type: 'ceremony', id: 'c1', payload: 1 });
  t.advance(0);
  budget.request({ type: 'ceremony', id: 'c2', payload: 2 });
  t.advance(60_000);
  assert.deepEqual(spy.grants.map((g) => g.id), ['c1'], 'a ceremony never evicts a ceremony');
  assert.deepEqual(budget.getSnapshot().queued.map((g) => g.id), ['c2']);

  // The gap exists so two overlays do not land on top of each other; with the screen clear there
  // is nothing to land on, so the second ceremony opens at the release instant.
  budget.release('c1');
  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['c1', 'c2']);
  assert.equal(spy.grants[1].at, 60_000);
  assert.ok(spy.peakUnits() <= OVERLAY_CAPACITY);
});

test('cancelling a queued item wakes whatever was stuck behind it', () => {
  const t = fakeClock();
  // An overlay that cannot fit even on a clear screen: the budget will not evict for it (that
  // would loop forever), so it blocks the queue — the one state where `pump` arms no timer at all.
  const budget = createOverlayBudget({ clock: t.clock, weight: { ceremony: 3 } });
  const spy = watch(budget);

  budget.request({ type: 'ceremony', id: 'huge', payload: 1 });
  budget.request({ type: 'toast', id: 'b', payload: 2 });
  t.advance(60_000);
  assert.equal(spy.grants.length, 0, 'the head blocks the queue');

  // `release` of a still-queued id is a cancel; it has to re-arm the pump like every other
  // mutation, or the toast behind it waits for a request that may never come.
  assert.equal(budget.release('huge'), true);
  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['b'], 'the toast behind it opened on its own');
  assert.equal(budget.getSnapshot().queued.length, 0);
});

test('same-kind toasts inside one burst merge into a single overlay', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock, quiet: true });

  budget.request({ type: 'toast', id: 'q1', mergeKey: 'quest', payload: { xp: 60 } });
  t.advance(300);
  budget.request({ type: 'toast', id: 'q2', mergeKey: 'quest', payload: { xp: 50 } });
  t.advance(400);
  budget.request({ type: 'toast', id: 'q3', mergeKey: 'quest', payload: { xp: 30 } });

  let snap = budget.getSnapshot();
  assert.equal(snap.queued.length, 1, 'one overlay for the burst');
  assert.deepEqual(snap.queued[0].ids, ['q1', 'q2', 'q3']);
  assert.deepEqual(
    snap.queued[0].items.map((i) => i.xp),
    [60, 50, 30],
    'payloads kept in order so the caller can write "+3 quests · 140 XP"',
  );

  // 900 ms after the group started is outside the 800 ms burst window: a new overlay, not a merge.
  t.advance(200);
  budget.request({ type: 'toast', id: 'q4', mergeKey: 'quest', payload: { xp: 40 } });
  snap = budget.getSnapshot();
  assert.equal(snap.queued.length, 2);
  assert.deepEqual(snap.queued[1].ids, ['q4']);

  // A different key never merges, and neither do keyless toasts.
  budget.request({ type: 'toast', id: 'x1', mergeKey: 'xp', payload: { xp: 10 } });
  budget.request({ type: 'toast', id: 'n1', payload: { xp: 5 } });
  budget.request({ type: 'toast', id: 'n2', payload: { xp: 5 } });
  assert.equal(budget.getSnapshot().queued.length, 5);

  // A merged group costs one slot, and its handle is the first member's id.
  budget.setQuiet(false);
  t.advance(0);
  const active = budget.getSnapshot().active;
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 'q1');
  assert.equal(budget.getSnapshot().used, 1);
});

test('a ceremony never merges with another ceremony', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock, quiet: true });
  budget.request({ type: 'ceremony', id: 'c1', mergeKey: 'level', payload: 1 });
  budget.request({ type: 'ceremony', id: 'c2', mergeKey: 'level', payload: 2 });
  assert.equal(budget.getSnapshot().queued.length, 2);
});

test('release frees the slot — by group id or by any member id', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  budget.request({ type: 'toast', id: 'a', mergeKey: 'quest', payload: 1 });
  budget.request({ type: 'toast', id: 'b', mergeKey: 'quest', payload: 2 });
  budget.request({ type: 'toast', id: 'c', mergeKey: 'streak', payload: 3 });
  budget.request({ type: 'toast', id: 'd', mergeKey: 'xp', payload: 4 });

  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a']);
  t.advance(OVERLAY_GAP_MS);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a', 'c']);
  assert.equal(budget.getSnapshot().used, 2, 'full');

  // Nothing more opens while both slots are held, no matter how long we wait.
  t.advance(10_000);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a', 'c']);

  // 'b' merged into 'a': dismissing by the member id releases the whole overlay.
  assert.equal(budget.release('b'), true);
  assert.equal(budget.getSnapshot().used, 1);
  t.advance(OVERLAY_GAP_MS);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a', 'c', 'd']);

  assert.equal(budget.release('nope'), false, 'an unknown id is not a release');
});

test('quiet holds everything back and lets it through untouched', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  budget.setQuiet(true);
  budget.request({ type: 'toast', id: 'a', payload: 1 });
  budget.request({ type: 'ceremony', id: 'c', payload: 2 });
  t.advance(60_000);
  assert.equal(spy.grants.length, 0, 'a live question is never interrupted');
  assert.equal(budget.getSnapshot().queued.length, 2);
  assert.equal(budget.isQuiet(), true);

  budget.setQuiet(false);
  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['c'], 'the ceremony leads when the gate lifts');
  budget.release('c');
  t.advance(OVERLAY_GAP_MS);
  assert.deepEqual(spy.grants.map((g) => g.id), ['c', 'a'], 'nothing was lost in the quiet stretch');
});

test('a burst of 7 with repeated kinds: everything shows or merges, nothing twice', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  const burst = [
    { kind: 'quest', payload: 'quest-1' },
    { kind: 'quest', payload: 'quest-2' },
    { kind: 'quest', payload: 'quest-3' },
    { kind: 'xp', payload: 'xp-1' },
    { kind: 'xp', payload: 'xp-2' },
    { kind: 'achievement', payload: 'badge-1' },
    { kind: 'streak', payload: 'streak-1' },
  ];
  burst.forEach((item, i) => {
    budget.request({ type: 'toast', id: `b${i}`, mergeKey: item.kind, payload: item.payload });
  });

  for (let step = 0; step < 400; step += 1) {
    t.advance(50);
    spy.sample();
    for (const g of budget.getSnapshot().active) {
      if (g.grantedAt >= 0 && t.now() - g.grantedAt >= 3200) budget.release(g.id);
    }
    spy.sample();
  }

  assert.equal(spy.grants.length, 4, 'three quests and two XP lines collapsed');
  assert.deepEqual(
    spy.grants.map((g) => g.items),
    [['quest-1', 'quest-2', 'quest-3'], ['xp-1', 'xp-2'], ['badge-1'], ['streak-1']],
  );
  const delivered = spy.grants.flatMap((g) => g.items);
  assert.deepEqual(delivered.slice().sort(), burst.map((b) => b.payload).slice().sort(), 'nothing dropped');
  assert.equal(new Set(delivered).size, delivered.length, 'nothing shown twice');
  assert.ok(spy.peakUnits() <= OVERLAY_CAPACITY);
  for (let i = 1; i < spy.grants.length; i += 1) {
    assert.ok(spy.grants[i].at - spy.grants[i - 1].at >= OVERLAY_GAP_MS);
  }
});

test('re-requesting a live id updates it in place instead of taking a second slot', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  budget.request({ type: 'toast', id: 'wallet:notice', payload: 'first' });
  t.advance(0);
  assert.equal(budget.getSnapshot().active[0].items[0], 'first');

  const again = budget.request({ type: 'toast', id: 'wallet:notice', payload: 'second' });
  assert.equal(again, 'wallet:notice');
  t.advance(5_000);
  const snap = budget.getSnapshot();
  assert.equal(snap.active.length, 1);
  assert.equal(snap.used, 1);
  assert.equal(snap.active[0].items[0], 'second');
  assert.equal(snap.queued.length, 0);
});

test('clear drops what is waiting and what is up', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  budget.request({ type: 'ceremony', id: 'c', payload: 2 });
  t.advance(0);
  assert.deepEqual(budget.getSnapshot().active.map((g) => g.id), ['c']);
  budget.request({ type: 'toast', id: 'a', payload: 1 });

  budget.clear('toast');
  let snap = budget.getSnapshot();
  assert.equal(snap.queued.length, 0, 'the waiting toast is gone');
  assert.equal(snap.active.length, 1, 'the ceremony survived a toast-only clear');

  budget.clear();
  snap = budget.getSnapshot();
  assert.equal(snap.active.length, 0, 'and what was up goes too');
  assert.equal(snap.queued.length, 0);
  assert.equal(snap.used, 0);
});

test('destroy stops the timer and the notifications', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  let calls = 0;
  budget.subscribe(() => {
    calls += 1;
  });
  budget.request({ type: 'toast', id: 'a', payload: 1 });
  const before = calls;
  budget.destroy();
  t.advance(10_000);
  assert.equal(calls, before, 'nothing fires after unmount');
  assert.equal(budget.getSnapshot().active.length, 0);
});

/* ---------------------------------------------------------------------------------------------
 * The words on top of the budget: app/screens/use-progression-feedback.tsx.
 *
 * Defect pinned: 'quest' and 'quests-bonus' shared one merge key. lib/progression.mjs awards the
 * all-quests bonus in the SAME reducer call that completes the last daily quest, so the two always
 * arrive in one burst and merged into one toast whose headline counted log rows: finishing one
 * quest read "+2 quests". A number the player can check against their own quest card, and wrong.
 * ------------------------------------------------------------------------------------------- */

const questToast = (label, xp) => ({
  kind: 'quest',
  title: label,
  meta: { xp, one: 'quest', many: 'quests', label, kind: 'quest' },
});
const bonusToast = () => ({
  kind: 'quest',
  title: 'All daily quests complete',
  meta: {
    xp: PROGRESSION.XP.questBonus,
    one: 'bonus',
    many: 'bonuses',
    label: 'All daily quests complete',
    kind: 'quests-bonus',
  },
});

test('the all-quests bonus has its own merge key, so it never lands in the quest headline', () => {
  const { MERGE_GROUPS } = loadFeedback();
  assert.notEqual(
    MERGE_GROUPS.quest.key,
    MERGE_GROUPS['quests-bonus'].key,
    'the bonus must not merge into the quest group',
  );

  // Through the real scheduler, with the keys the screen builds: two overlays, not one.
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock, quiet: true });
  budget.request({ type: 'toast', id: 'q', mergeKey: `prog:${MERGE_GROUPS.quest.key}`, payload: questToast('Answer 3 questions correctly', 50) });
  budget.request({ type: 'toast', id: 'b', mergeKey: `prog:${MERGE_GROUPS['quests-bonus'].key}`, payload: bonusToast() });
  const queued = budget.getSnapshot().queued;
  assert.equal(queued.length, 2, 'the quest and the bonus are separate overlays');
  assert.deepEqual(queued.map((g) => g.ids), [['q'], ['b']]);
});

test('the merged quest headline counts quests, not log rows', () => {
  const { mergeProgressToasts } = loadFeedback();

  // Three real quests in one burst: the count and the XP are both the sum of what landed.
  const three = [
    questToast('Answer 3 questions correctly', 60),
    questToast('Get a 3-answer combo in one match', 50),
    questToast('Finish a duel', 30),
  ];
  const merged = mergeProgressToasts(three);
  assert.equal(merged.title, '+3 quests · 140 XP');
  assert.equal(merged.body, 'Answer 3 questions correctly · Get a 3-answer combo in one match · +1 more');

  // One quest on its own reads with the singular noun.
  assert.equal(mergeProgressToasts([questToast('Finish a duel', 40)]).title, '+1 quest · 40 XP');

  // And the belt-and-braces: even if a bonus row were ever grouped with quests again, the headline
  // counts the quests. The XP still sums the whole group, because all of it was really awarded.
  const withBonus = mergeProgressToasts([questToast('Finish a duel', 40), bonusToast()]);
  assert.equal(withBonus.title, `+1 quest · ${40 + PROGRESSION.XP.questBonus} XP`);
});
