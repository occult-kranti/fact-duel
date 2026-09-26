/**
 * HISAAB DO — regression tests from the code review (docs/hisaab/review/code.md).
 *
 * Guards that pass today pin the live-question timing contract (ENGINE §6.3): no answer before
 * `markShown()`, the elapsed time runs from `markShown()` on the monotonic clock, and `markShown()` is
 * idempotent per round. Tests marked `todo` reproduce a confirmed defect that is not fixed yet: each
 * names its finding in code.md. They report as TODO (the suite stays green) until the fix lands; then
 * drop the `todo` option so they guard the fix.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('../editions/hisaab/node-aliases.mjs', import.meta.url);
const ROOT_URL = new URL('../', import.meta.url).href;
// Vite-style resolution for the edition's TypeScript (as tests/hisaab-ui-foundation.test.mjs does).
register(
  `data:text/javascript,${encodeURIComponent(`
    const ROOT = ${JSON.stringify(ROOT_URL)};
    export async function resolve(specifier, context, next) {
      let spec = specifier.startsWith('@/') ? ROOT + specifier.slice(2) : specifier;
      try { return await next(spec, context); } catch (error) {
        if (!(spec.startsWith('.') || spec.startsWith('file:'))) throw error;
        for (const ext of ['.ts', '.tsx', '/index.ts']) {
          try { return await next(spec + ext, context); } catch {}
        }
        throw error;
      }
    }`)}`,
);

const { createDuelController } = await import('../editions/hisaab/engine/duel-controller.mjs');

/** A request() whose calls wait until the test settles them. */
function manualRequest() {
  const calls = [];
  const request = (body) =>
    new Promise((resolve, reject) => {
      calls.push({ body, resolve, reject });
    });
  return { calls, request };
}

const QUIET_POLLS = { active: 60_000, waiting: 60_000, hidden: 60_000 };
const ROOM_ID = 'a'.repeat(32);

function room(patch = {}) {
  return {
    id: ROOM_ID,
    revision: 1,
    seat: 0,
    phase: 'playing',
    roundIndex: 0,
    config: { mode: 'quick', duration: 10 },
    players: [
      { name: 'You', ready: false, kind: 'human' },
      { name: 'Lucky Guess · BOT', ready: false, kind: 'bot' },
    ],
    scores: [0, 0],
    settled: false,
    winner: null,
    reason: null,
    completedRounds: [],
    round: {
      id: `${ROOM_ID}:0`,
      scheduledAt: 0,
      issuedAt: 0,
      answerLocked: [false, false],
      question: { id: `${ROOM_ID}:0`, topic: 'Health', question: 'Q?', options: ['a', 'b', 'c', 'd'] },
      result: null,
    },
    ...patch,
  };
}

// ---- timing contract guards (pass today) ---------------------------------------------------------

test('timing contract: no answer before markShown(); elapsed runs from markShown() on the monotonic clock', async () => {
  const { calls, request } = manualRequest();
  let now = 1_000;
  const c = createDuelController({ request, perfNow: () => now, pollMs: QUIET_POLLS });
  c.adopt({ room: room() });
  assert.equal(await c.answer(1), false, 'a tap before the reveal marker is ignored');
  assert.equal(calls.length, 0, 'and nothing is sent');

  now = 2_000;
  c.markShown();
  now = 2_400;
  c.markShown(); // a second marker in the same round must not restart the clock
  assert.equal(c.snapshot().shownRoundId, `${ROOM_ID}:0`);

  now = 2_750;
  const sent = c.answer(2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.action, 'answer');
  assert.equal(calls[0].body.elapsedMs, 750, 'measured from the FIRST markShown() of the round');
  assert.equal(calls[0].body.choice, 2);
  assert.equal(await c.answer(3), false, 'first tap locks');
  calls[0].resolve({ room: room({ revision: 2, round: { ...room().round, answerLocked: [true, false] } }) });
  assert.equal(await sent, true);
  c.dispose();
});

test('timing contract: markShown() is a no-op once the result is in; an answer past the clock is refused locally', async () => {
  const { calls, request } = manualRequest();
  let now = 0;
  const c = createDuelController({ request, perfNow: () => now, pollMs: QUIET_POLLS });
  c.adopt({ room: room() });
  c.markShown();
  now = 10_000; // the 10 s clock has run out on this screen
  assert.equal(await c.answer(0), false);
  assert.equal(calls.length, 0);
  c.adopt({ room: room({ revision: 5, round: { ...room().round, result: { winner: null, reason: 'no-correct-answer' } } }) });
  c.markShown();
  assert.equal(c.snapshot().remainingMs, null, 'no clock after the result');
  c.dispose();
});

// ---- confirmed defects (todo until fixed) ----------------------------------------------------------

test(
  'duel controller: a poll that lands after reset() does not bring the old match back',
  { todo: 'code.md P2 — duel-controller accepts responses from before reset()/adopt() (no epoch check after await)' },
  async () => {
    const { calls, request } = manualRequest();
    const c = createDuelController({ request, pollMs: QUIET_POLLS });
    c.adopt({ room: room({ phase: 'complete', settled: true, reason: 'complete', revision: 7 }) });
    const inflight = c.refresh(); // e.g. a P2P poke, or a poll already on the wire
    c.reset(); // "Forget the match" (the rematch path in screens/room/index.tsx)
    assert.equal(c.room, null);
    calls[0].resolve({ room: room({ phase: 'complete', settled: true, reason: 'complete', revision: 8 }) });
    await inflight;
    const resurrected = c.room;
    c.dispose();
    assert.equal(resurrected, null, 'the forgotten room must stay forgotten');
  },
);

test(
  'duel controller: a response for the previous room does not replace a newly adopted room',
  { todo: 'code.md P2 — duel-controller accepts responses from before reset()/adopt() (no epoch check after await)' },
  async () => {
    const { calls, request } = manualRequest();
    const c = createDuelController({ request, pollMs: QUIET_POLLS });
    c.adopt({ room: room({ phase: 'waiting', round: null, revision: 3 }) });
    const inflight = c.refresh();
    const next = room({ id: 'b'.repeat(32), phase: 'waiting', round: null, revision: 1 });
    c.adopt({ room: next });
    calls[0].resolve({ room: room({ phase: 'waiting', round: null, revision: 4 }) });
    await inflight;
    const shown = c.room?.id;
    c.dispose();
    assert.equal(shown, 'b'.repeat(32), 'the adopted room stays on screen');
  },
);

test(
  'duel controller: no snapshot churn while the question is up (the 150 ms ticker only serves the countdown)',
  { todo: 'code.md P2 — duel-controller tick() calls changed() every 150 ms for the whole live question' },
  async () => {
    const { request } = manualRequest();
    let changes = 0;
    const c = createDuelController({ request, onChange: () => (changes += 1), pollMs: QUIET_POLLS });
    c.adopt({ room: room() }); // issuedAt is set: the question is out, the countdown is over
    c.markShown();
    changes = 0;
    await new Promise((resolve) => setTimeout(resolve, 700));
    c.dispose();
    assert.equal(changes, 0, 'nothing on the live card reads countdownMs/remainingMs from a re-render');
  },
);

function fakeClock() {
  let t = 0;
  let timers = [];
  return {
    now: () => t,
    setTimer: (fn, ms) => {
      const timer = { fn, at: t + ms };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      timers = timers.filter((x) => x !== timer);
    },
    tick(ms = 0) {
      const end = t + ms;
      for (;;) {
        const due = timers.filter((x) => x.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        timers = timers.filter((x) => x !== due);
        t = Math.max(t, due.at);
        due.fn();
      }
      t = end;
    },
  };
}

test(
  'budget: closing a sheet returns to the SAME screen visit — it does not grant the screen a second toast',
  { todo: 'code.md P2 — budget.ts useVisit cleanup calls newVisit(before), which resets the one-toast allowance' },
  async () => {
    const { createHisaabBudget } = await import('../editions/hisaab/app/budget.ts');
    const clock = fakeClock();
    const b = createHisaabBudget({ clock });
    b.newVisit('/receipts');
    const first = b.toast({ title: 'Quest done' });
    assert.ok(first, 'the Vault visit gets its one toast');
    clock.tick();
    b.dismissToast(first);
    clock.tick(5000);
    // What useVisit(open, 'receipt-sheet') does when a receipt sheet opens and closes:
    b.newVisit('/receipts#receipt-sheet');
    b.newVisit('/receipts');
    const second = b.toast({ title: 'Second quest done' });
    b.destroy();
    assert.equal(second, null, 'same screen visit: the second ask goes to Activity (bible §9 rule 1)');
  },
);
