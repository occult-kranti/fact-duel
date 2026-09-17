/**
 * The profile gate's ask-again rule. The claim under test is that the gate cannot nag: one ask on
 * a first landing, then silence for three visits after every skip, then silence forever once a
 * profile is claimed. Everything else here guards the persisted record — a device that has been
 * fiddled with, or written by an older build, must degrade to "ask once", never to a throw.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { GATE, emptyGate, gateDecision, noteClaim, noteSkip, noteVisit, readGate } from '../lib/profile-gate.mjs';

const T0 = Date.parse('2026-09-17T09:00:00Z');
const MIN = 60_000;
const visit = (gate, at) => noteVisit(gate, at);
const decide = (gate, now) => gateDecision({ ...gate, now });

test('a first landing asks; the record starts empty', () => {
  const gate = emptyGate();
  assert.deepEqual(gate, { claimed: false, email: null, skippedAt: [], visits: [] });
  assert.deepEqual(decide(visit(gate, T0), T0), { show: true, reason: 'first', sinceSkip: 0 });
});

test('after a skip the gate stays quiet for two visits and asks again on the third', () => {
  let gate = noteSkip(visit(emptyGate(), T0), T0);
  assert.deepEqual(gate.skippedAt, [T0]);
  assert.deepEqual(decide(gate, T0 + 1), { show: false, reason: 'waiting', sinceSkip: 0 }, 'not twice in one visit');

  gate = visit(gate, T0 + MIN);
  assert.deepEqual(decide(gate, T0 + MIN), { show: false, reason: 'waiting', sinceSkip: 1 });
  gate = visit(gate, T0 + 2 * MIN);
  assert.deepEqual(decide(gate, T0 + 2 * MIN), { show: false, reason: 'waiting', sinceSkip: 2 });
  gate = visit(gate, T0 + 3 * MIN);
  assert.deepEqual(decide(gate, T0 + 3 * MIN), { show: true, reason: 'ask-again', sinceSkip: 3 });
  assert.equal(GATE.askAgainAfterVisits, 3);
});

test('a second skip restarts the count from that skip, not from the first', () => {
  let gate = emptyGate();
  for (let i = 0; i <= 3; i++) gate = visit(gate, T0 + i * MIN);
  gate = noteSkip(gate, T0);
  gate = visit(gate, T0 + 4 * MIN);
  gate = visit(gate, T0 + 5 * MIN);
  gate = visit(gate, T0 + 6 * MIN);
  assert.equal(decide(gate, T0 + 6 * MIN).show, true);
  gate = noteSkip(gate, T0 + 6 * MIN);
  assert.deepEqual(gate.skippedAt, [T0, T0 + 6 * MIN]);
  assert.deepEqual(decide(gate, T0 + 6 * MIN), { show: false, reason: 'waiting', sinceSkip: 0 });
  gate = visit(gate, T0 + 7 * MIN);
  gate = visit(gate, T0 + 8 * MIN);
  assert.equal(decide(gate, T0 + 8 * MIN).show, false, 'the earlier visits do not count twice');
  gate = visit(gate, T0 + 9 * MIN);
  assert.equal(decide(gate, T0 + 9 * MIN).show, true);
});

test('a claimed profile is never asked again, whatever the visit and skip history says', () => {
  let gate = noteClaim(noteSkip(visit(emptyGate(), T0), T0), ' Pat@Example.com ');
  assert.equal(gate.claimed, true);
  assert.equal(gate.email, 'pat@example.com', 'trimmed and lowercased');
  for (let i = 1; i <= 10; i++) gate = visit(gate, T0 + i * MIN);
  assert.deepEqual(decide(gate, T0 + 10 * MIN), { show: false, reason: 'claimed', sinceSkip: 0 });
  assert.equal(noteSkip(gate, T0 + 11 * MIN), gate, 'a skip after a claim changes nothing');
});

test('the reducers are identity-preserving and the visit tail is bounded', () => {
  const gate = visit(emptyGate(), T0);
  assert.equal(noteVisit(gate, T0), gate, 'the same millisecond is the same visit');
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

  let long = emptyGate();
  for (let i = 0; i < GATE.maxVisits + 20; i++) long = visit(long, T0 + i);
  assert.equal(long.visits.length, GATE.maxVisits);
  assert.equal(long.visits[long.visits.length - 1], T0 + GATE.maxVisits + 19, 'the newest are kept');
  let many = emptyGate();
  for (let i = 0; i < GATE.maxSkips + 5; i++) many = noteSkip(many, T0 + i);
  assert.equal(many.skippedAt.length, GATE.maxSkips);
});

test('readGate round-trips a real record and answers empty for anything else', () => {
  let gate = emptyGate();
  for (let i = 0; i < 5; i++) gate = visit(gate, T0 + i * MIN);
  gate = noteSkip(gate, T0 + MIN);
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
  assert.equal(gateDecision({ skippedAt: [T0], visits: 2, now: T0 + MIN }).show, false);
  assert.equal(gateDecision({ skippedAt: [T0], visits: 3, now: T0 + MIN }).show, true);
  assert.equal(gateDecision({ skippedAt: [T0], visits: -4, now: T0 + MIN }).sinceSkip, 0);
  assert.equal(gateDecision({ skippedAt: [T0], visits: 'lots', now: T0 + MIN }).sinceSkip, 0);
  assert.deepEqual(gateDecision(), { show: true, reason: 'first', sinceSkip: 0 }, 'no argument is a first landing');
  assert.equal(Object.isFrozen(gateDecision()), true);
});
