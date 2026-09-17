/**
 * The pop-up budget (components/fx/overlay-budget.ts) under a fake clock.
 *
 * What is being proved: a reward burst can never bury the player. At most two weight units are on
 * screen, two overlays never arrive in the same instant, the order is the order things were asked
 * for, a ceremony fills the budget on its own, same-kind toasts inside one burst collapse into a
 * single overlay, dismissing frees the slot — and nothing is ever dropped: every payload handed to
 * the scheduler comes back out, once, either as its own overlay or merged into one.
 *
 * Time is injected, so every assertion here is about exact milliseconds rather than about "roughly".
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const {
  createOverlayBudget,
  OVERLAY_CAPACITY,
  OVERLAY_GAP_MS,
  OVERLAY_MERGE_WINDOW_MS,
  OVERLAY_WEIGHT,
} = await import('../components/fx/overlay-budget.ts');

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

test('a ceremony fills the budget: nothing opens beside it, and it waits its turn', () => {
  const t = fakeClock();
  const budget = createOverlayBudget({ clock: t.clock });
  const spy = watch(budget);

  budget.request({ type: 'toast', id: 'before', payload: 'toast' });
  budget.request({ type: 'ceremony', id: 'cer', payload: 'ceremony' });
  budget.request({ type: 'toast', id: 'after', payload: 'toast' });

  t.advance(0);
  assert.deepEqual(spy.grants.map((g) => g.id), ['before']);

  // The ceremony needs both units, so it cannot open while the toast is up — and FIFO keeps the
  // toast behind it from jumping the queue into the free slot.
  t.advance(5_000);
  assert.deepEqual(spy.grants.map((g) => g.id), ['before'], 'ceremony blocked, and it blocks the queue');
  assert.equal(budget.getSnapshot().queued.length, 2);

  budget.release('before');
  t.advance(1_199);
  assert.deepEqual(spy.grants.map((g) => g.id), ['before'], 'gap respected after the release');
  t.advance(1);
  assert.deepEqual(spy.grants.map((g) => g.id), ['before', 'cer']);

  const live = budget.getSnapshot();
  assert.equal(live.active.length, 1);
  assert.equal(live.used, 2, 'the ceremony is the whole budget');

  // While it is open, the waiting toast stays waiting however long we run the clock.
  t.advance(30_000);
  assert.deepEqual(spy.grants.map((g) => g.id), ['before', 'cer']);
  assert.deepEqual(
    budget.getSnapshot().active.map((g) => g.type),
    ['ceremony'],
    'the ceremony is alone on screen',
  );

  budget.release('cer');
  t.advance(OVERLAY_GAP_MS);
  assert.deepEqual(spy.grants.map((g) => g.id), ['before', 'cer', 'after']);
  assert.ok(spy.peakUnits() <= OVERLAY_CAPACITY);
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
  assert.deepEqual(spy.grants.map((g) => g.id), ['a'], 'order survived the quiet stretch');
  budget.release('a');
  t.advance(OVERLAY_GAP_MS);
  assert.deepEqual(spy.grants.map((g) => g.id), ['a', 'c']);
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
  budget.request({ type: 'toast', id: 'a', payload: 1 });
  budget.request({ type: 'ceremony', id: 'c', payload: 2 });
  t.advance(0);
  assert.equal(budget.getSnapshot().active.length, 1);

  budget.clear('toast');
  let snap = budget.getSnapshot();
  assert.equal(snap.active.length, 0);
  assert.equal(snap.queued.length, 1, 'the ceremony survived a toast-only clear');

  budget.clear();
  snap = budget.getSnapshot();
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
