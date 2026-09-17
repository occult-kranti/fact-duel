/**
 * The profile gate's ask-again rule. The claim under test is that the gate cannot nag: one ask on
 * a first landing, then silence until three SITTINGS and half an hour have passed since the skip,
 * then silence forever once a profile is claimed. A reload is not a sitting — that is the part
 * that keeps "3 visits" from meaning "3 presses of the reload key" seconds after a skip.
 * Everything else here guards the persisted record — a device that has been fiddled with, or
 * written by an older build, must degrade to "ask once", never to a throw.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_NAME, GATE, emptyGate, gateDecision, noteClaim, noteSkip, noteVisit, readGate } from '../lib/profile-gate.mjs';

const T0 = Date.parse('2026-09-17T09:00:00Z');
const MIN = 60_000;
const GAP = GATE.sessionGapMs;
const visit = (gate, at) => noteVisit(gate, at);
const decide = (gate, now) => gateDecision({ ...gate, now });

test('a first landing asks; the record starts empty', () => {
  const gate = emptyGate();
  assert.deepEqual(gate, { claimed: false, email: null, skippedAt: [], visits: [] });
  assert.deepEqual(decide(visit(gate, T0), T0), { show: true, reason: 'first', sinceSkip: 0 });
  assert.equal(DEFAULT_NAME, 'Challenger', 'the name arena starts with, shared so the gate does not pre-fill it');
});

test('after a skip the gate stays quiet for two sittings and asks again on the third', () => {
  let gate = noteSkip(visit(emptyGate(), T0), T0);
  assert.deepEqual(gate.skippedAt, [T0]);
  assert.deepEqual(decide(gate, T0 + 1), { show: false, reason: 'waiting', sinceSkip: 0 }, 'not twice in one visit');

  gate = visit(gate, T0 + GAP);
  assert.deepEqual(decide(gate, T0 + GAP), { show: false, reason: 'waiting', sinceSkip: 1 });
  gate = visit(gate, T0 + 2 * GAP);
  assert.deepEqual(decide(gate, T0 + 2 * GAP), { show: false, reason: 'waiting', sinceSkip: 2 });
  gate = visit(gate, T0 + 3 * GAP);
  assert.deepEqual(decide(gate, T0 + 3 * GAP), { show: true, reason: 'ask-again', sinceSkip: 3 });
  assert.equal(GATE.askAgainAfterVisits, 3);
});

test('reloads are not visits: a skipped gate cannot come back in the same sitting', () => {
  let gate = noteSkip(visit(emptyGate(), T0), T0);
  for (const at of [T0 + 1000, T0 + 2000, T0 + 5 * MIN, T0 + GAP - 1]) {
    const before = gate;
    gate = visit(gate, at);
    assert.equal(gate, before, `a landing ${at - T0}ms after the last counted one is the same sitting`);
    assert.equal(decide(gate, at).show, false, 'so the gate stays shut');
  }
  assert.deepEqual(gate.visits, [T0], 'one stamp for the whole burst');

  // Three sittings, but the clock floor is measured from the skip: 3 × the gap clears both.
  gate = visit(gate, T0 + GAP);
  gate = visit(gate, T0 + 2 * GAP);
  assert.equal(decide(gate, T0 + 2 * GAP).show, false);
  gate = visit(gate, T0 + 3 * GAP);
  assert.equal(decide(gate, T0 + 3 * GAP).show, true);
});

test('both clauses are needed: the counter alone and the clock alone each keep the gate shut', () => {
  // A bare counter (an older record) with three visits, but minutes after the skip: still quiet.
  assert.deepEqual(gateDecision({ skippedAt: [T0], visits: 9, now: T0 + 10 * MIN }), {
    show: false,
    reason: 'waiting',
    sinceSkip: 9,
  });
  assert.equal(gateDecision({ skippedAt: [T0], visits: 9, now: T0 + GATE.askAgainAfterMs }).show, true, 'the floor is inclusive');
  // Half an hour has passed, but this device has landed once since the skip.
  assert.equal(gateDecision({ skippedAt: [T0], visits: [T0 + 2 * GAP], now: T0 + 2 * GAP }).show, false);
  assert.equal(GATE.askAgainAfterMs, 30 * MIN);
  assert.equal(GATE.sessionGapMs, 30 * MIN);
});

test('a second skip restarts the count from that skip, not from the first', () => {
  let gate = emptyGate();
  for (let i = 0; i <= 3; i++) gate = visit(gate, T0 + i * GAP);
  gate = noteSkip(gate, T0);
  gate = visit(gate, T0 + 4 * GAP);
  gate = visit(gate, T0 + 5 * GAP);
  gate = visit(gate, T0 + 6 * GAP);
  assert.equal(decide(gate, T0 + 6 * GAP).show, true);
  gate = noteSkip(gate, T0 + 6 * GAP);
  assert.deepEqual(gate.skippedAt, [T0, T0 + 6 * GAP]);
  assert.deepEqual(decide(gate, T0 + 6 * GAP), { show: false, reason: 'waiting', sinceSkip: 0 });
  gate = visit(gate, T0 + 7 * GAP);
  gate = visit(gate, T0 + 8 * GAP);
  assert.equal(decide(gate, T0 + 8 * GAP).show, false, 'the earlier visits do not count twice');
  gate = visit(gate, T0 + 9 * GAP);
  assert.equal(decide(gate, T0 + 9 * GAP).show, true);
});

test('a claimed profile is never asked again, whatever the visit and skip history says', () => {
  let gate = noteClaim(noteSkip(visit(emptyGate(), T0), T0), ' Pat@Example.com ');
  assert.equal(gate.claimed, true);
  assert.equal(gate.email, 'pat@example.com', 'trimmed and lowercased');
  for (let i = 1; i <= 10; i++) gate = visit(gate, T0 + i * GAP);
  assert.deepEqual(decide(gate, T0 + 10 * GAP), { show: false, reason: 'claimed', sinceSkip: 0 });
  assert.equal(noteSkip(gate, T0 + 11 * GAP), gate, 'a skip after a claim changes nothing');
});

test('the reducers are identity-preserving and the visit tail is bounded', () => {
  const gate = visit(emptyGate(), T0);
  assert.equal(noteVisit(gate, T0), gate, 'the same millisecond is the same visit');
  assert.equal(noteVisit(gate, T0 - GAP), gate, 'a clock that went backwards is not a new sitting');
  assert.equal(noteVisit(gate, 0), gate);
  assert.equal(noteVisit(gate, 1.5), gate);
  assert.equal(noteVisit(gate, 'now'), gate);
  const skipped = noteSkip(gate, T0);
  assert.equal(noteSkip(skipped, T0), skipped);
  assert.equal(noteSkip(gate, -1), gate);
  const claimed = noteClaim(gate, 'pat@example.com');
  assert.equal(noteClaim(claimed, 'PAT@example.com'), claimed, 'the same address again');
  assert.notEqual(noteClaim(claimed, 'sam@example.com'), claimed, 'a different address is a change');
  assert.equal(noteClaim(claimed, 'sam@example.com').email, 'sam@example.com');
  assert.equal(noteClaim(claimed, null).email, null, 'a claim with no address is a settled gate, not an address');

  let long = emptyGate();
  for (let i = 0; i < GATE.maxVisits + 20; i++) long = visit(long, T0 + i * GAP);
  assert.equal(long.visits.length, GATE.maxVisits);
  assert.equal(long.visits[long.visits.length - 1], T0 + (GATE.maxVisits + 19) * GAP, 'the newest are kept');
  let many = emptyGate();
  for (let i = 0; i < GATE.maxSkips + 5; i++) many = noteSkip(many, T0 + i);
  assert.equal(many.skippedAt.length, GATE.maxSkips);
});

test('readGate round-trips a real record and answers empty for anything else', () => {
  let gate = emptyGate();
  for (let i = 0; i < 5; i++) gate = visit(gate, T0 + i * GAP);
  gate = noteSkip(gate, T0 + GAP);
  gate = noteClaim(gate, 'pat@example.com');
  assert.deepEqual(readGate(JSON.parse(JSON.stringify(gate))), gate);
  assert.deepEqual(readGate(JSON.parse(JSON.stringify(emptyGate()))), emptyGate());

  for (const junk of [null, undefined, 0, 'nope', [], [1, 2], true, NaN]) {
    assert.deepEqual(readGate(junk), emptyGate(), `junk: ${String(junk)}`);
  }
  assert.deepEqual(
    readGate({ claimed: 'yes', email: 42, skippedAt: 'x', visits: [T0, 'x', -1, 1.5, null, T0 - MIN] }),
    { claimed: false, email: null, skippedAt: [], visits: [T0 - MIN, T0] },
    'junk members are dropped, the good stamps survive and come back sorted',
  );
  assert.equal(readGate({ email: 'x'.repeat(300) }).email, null, 'an absurd address is not an address');
});

test('gateDecision ignores stamps from the future and takes a bare counter for visits', () => {
  const future = { claimed: false, skippedAt: [T0 + 10 * MIN], visits: [T0 + 11 * MIN], now: T0 };
  assert.deepEqual(gateDecision(future), { show: true, reason: 'first', sinceSkip: 0 }, 'a skip that has not happened yet is not a skip');
  assert.equal(gateDecision({ skippedAt: [T0], visits: 2, now: T0 + GAP }).show, false);
  assert.equal(gateDecision({ skippedAt: [T0], visits: 3, now: T0 + GAP }).show, true);
  assert.equal(gateDecision({ skippedAt: [T0], visits: -4, now: T0 + GAP }).sinceSkip, 0);
  assert.equal(gateDecision({ skippedAt: [T0], visits: 'lots', now: T0 + GAP }).sinceSkip, 0);
  assert.equal(gateDecision({ skippedAt: [T0], visits: 9 }).show, false, 'no clock is no elapsed time');
  assert.deepEqual(gateDecision(), { show: true, reason: 'first', sinceSkip: 0 }, 'no argument is a first landing');
  assert.equal(Object.isFrozen(gateDecision()), true);
});
