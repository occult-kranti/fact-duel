/**
 * Live presence over each game mode: the server's two counts, the 5 s ingress cache, and the
 * client loop that reads them.
 *
 * The honesty rules this file pins, because they are the reason the feature exists at all:
 *  - `inQueue` counts LIVE, UNPAIRED queue rows only. A row nobody has touched for 30 s is gone,
 *    and a row carrying a `paired:` assignment has left the queue for a room, so neither is
 *    company anybody can still meet.
 *  - `inGame` counts rooms that are actually mid-match (phase scheduled/playing/between) and have
 *    not expired. A lobby waiting for a guest, a finished room and a cancelled room are not games
 *    in progress, and an expired row is not anything.
 *  - every format is reported, at zero when nobody is there. Zero is a number the product prints.
 *  - the client never turns a failure into a number: a 404 page, a 503 or a half-read body is a
 *    failure, the last good answer stands, and it stops being called live after 15 s.
 *  - the static twin polls nothing and answers null, so a build with no server shows no line.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as tick } from 'node:timers/promises';
import { IN_GAME_PHASES, PRESENCE_MODES, presence } from '../lib/server/matchmaking.mjs';
import { PRESENCE_CACHE_MS, cachedPresence, handleQueueRequest } from '../lib/server/http-queue.mjs';
import { LocalD1 } from './d1-local.mjs';
import {
  PRESENCE_BACKOFF_MS,
  PRESENCE_FAILURES_BEFORE_BACKOFF,
  PRESENCE_FRESH_MS,
  PRESENCE_POLL_MS,
  isFresh,
  readPresence,
  startPresence,
} from '../lib/presence-client.ts';
import * as staticTwin from '../lib/presence-client-static.ts';

const T0 = 1_700_000_000_000;
const pid = (letter) => `anon_${letter.repeat(24)}`;
const hex = (letter) => letter.repeat(32);

/* ------------------------------------------------------------------ seeding */

function queueRow(db, { who, mode, lastSeen = T0, ticket = hex('1'), sport = 'Football', stake = 0 }) {
  return db
    .prepare(
      'INSERT INTO match_queue (principal_id,sport,mode,stake,rating,enqueued_at,last_seen_at,ticket) VALUES (?,?,?,?,1000,?,?,?)',
    )
    .bind(who, sport, mode, stake, lastSeen, lastSeen, ticket)
    .run();
}
function roomRow(db, { id, phase, mode, expiresAt = T0 + 60_000 }) {
  const state = JSON.stringify({ id, phase, config: { mode, opponent: 'friend', stake: 0 } });
  return db
    .prepare('INSERT INTO rooms (id,revision,state,expires_at,created_at) VALUES (?,0,?,?,?)')
    .bind(id, state, expiresAt, T0)
    .run();
}
/** The `paired:` ticket shape matchmaking writes; only the prefix matters to the count. */
const pairedTicket = (roomId) =>
  `paired:${JSON.stringify({ ticket: hex('9'), roomId, token: hex('a'), invite: hex('b'), seat: 1, at: T0 })}`;

/* ------------------------------------------------------------------ the server counts */

test('an empty database reports every format at zero, and nothing else', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const view = await presence(db, { now: T0 });
  assert.deepEqual(Object.keys(view.modes).sort(), ['gauntlet', 'quick', 'trilogy']);
  assert.deepEqual(PRESENCE_MODES.slice().sort(), ['gauntlet', 'quick', 'trilogy']);
  assert.deepEqual(IN_GAME_PHASES.slice(), ['scheduled', 'playing', 'between']);
  for (const mode of PRESENCE_MODES) assert.deepEqual(view.modes[mode], { inQueue: 0, inGame: 0 });
  assert.equal(view.asOf, T0);
  assert.deepEqual(Object.keys(view).sort(), ['asOf', 'modes'], 'counts and a clock, no ids');
});

test('inQueue counts live unpaired rows per mode: stale rows and paired rows are not company', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  await queueRow(db, { who: pid('a'), mode: 'quick', ticket: hex('1') });
  await queueRow(db, { who: pid('b'), mode: 'quick', lastSeen: T0 - 29_999, ticket: hex('2') });
  await queueRow(db, { who: pid('c'), mode: 'trilogy', ticket: hex('3') });
  // Exactly at the edge, last_seen_at = now - staleMs, is still live — the same `>=` the pairing
  // query and `liveCount` use, so a card can never disagree with the search it launches.
  await queueRow(db, { who: pid('d'), mode: 'quick', lastSeen: T0 - 30_000, ticket: hex('4') });
  await queueRow(db, { who: pid('e'), mode: 'quick', lastSeen: T0 - 30_001, ticket: hex('5') });
  await queueRow(db, { who: pid('h'), mode: 'quick', lastSeen: T0 - 90_000, ticket: hex('7') });
  await queueRow(db, { who: pid('f'), mode: 'quick', ticket: pairedTicket(hex('c')) });
  await queueRow(db, { who: pid('g'), mode: 'gauntlet', lastSeen: T0 - 45_000, ticket: hex('6') });
  const view = await presence(db, { now: T0 });
  assert.equal(view.modes.quick.inQueue, 3, 'three live unpaired rows: two stale and one paired are not');
  assert.equal(view.modes.trilogy.inQueue, 1);
  assert.equal(view.modes.gauntlet.inQueue, 0, 'a stale row is nobody');
  for (const mode of PRESENCE_MODES) assert.equal(view.modes[mode].inGame, 0, 'no rooms were seeded');
});

test('inGame counts rooms mid-match per mode: lobbies, finished, cancelled and expired rooms are not', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  await roomRow(db, { id: hex('1'), phase: 'scheduled', mode: 'quick' });
  await roomRow(db, { id: hex('2'), phase: 'playing', mode: 'quick' });
  await roomRow(db, { id: hex('3'), phase: 'between', mode: 'trilogy' });
  await roomRow(db, { id: hex('4'), phase: 'waiting', mode: 'quick' });
  await roomRow(db, { id: hex('5'), phase: 'complete', mode: 'quick' });
  await roomRow(db, { id: hex('6'), phase: 'cancelled', mode: 'trilogy' });
  await roomRow(db, { id: hex('7'), phase: 'playing', mode: 'gauntlet', expiresAt: T0 - 1 });
  // expires_at exactly at `now` has not expired yet.
  await roomRow(db, { id: hex('8'), phase: 'playing', mode: 'gauntlet', expiresAt: T0 });
  const view = await presence(db, { now: T0 });
  assert.equal(view.modes.quick.inGame, 2);
  assert.equal(view.modes.trilogy.inGame, 1);
  assert.equal(view.modes.gauntlet.inGame, 1, 'the expired room is not a game, the one at the edge is');
  for (const mode of PRESENCE_MODES) assert.equal(view.modes[mode].inQueue, 0, 'no queue rows were seeded');
});

test('a room whose mode is not a served format is counted under no format at all', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  await roomRow(db, { id: hex('1'), phase: 'playing', mode: 'marathon' });
  await roomRow(db, { id: hex('2'), phase: 'playing', mode: 'quick' });
  await queueRow(db, { who: pid('a'), mode: 'marathon', ticket: hex('1') });
  const view = await presence(db, { now: T0 });
  assert.equal(Object.keys(view.modes).length, 3);
  assert.equal(view.modes.quick.inGame, 1);
  assert.equal(
    Object.values(view.modes).reduce((n, m) => n + m.inQueue + m.inGame, 0),
    1,
    'the unknown mode added nothing anywhere',
  );
});

test('the queue and the room counts are read from the same clock and agree with a real pairing', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const { enqueue, poll } = await import('../lib/server/matchmaking.mjs');
  const { D1RoomStore } = await import('../lib/server/duel-service.mjs');
  const deps = { store: new D1RoomStore(db), actor: 'test' };
  const a = await enqueue(db, { principalId: pid('a'), sport: 'Football', mode: 'quick', stake: 0, rating: 1000, now: T0 });
  const b = await enqueue(db, { principalId: pid('b'), sport: 'Football', mode: 'quick', stake: 0, rating: 1000, now: T0 });
  const waiting = await presence(db, { now: T0 });
  assert.equal(waiting.modes.quick.inQueue, 2, 'both are waiting');
  assert.equal(waiting.modes.quick.inGame, 0, 'and nothing is being played');
  await poll(db, { principalId: pid('a'), ticket: a.ticket, name: 'Ana', now: T0 + 1000 }, deps);
  await poll(db, { principalId: pid('b'), ticket: b.ticket, name: 'Bo', now: T0 + 1000 }, deps);
  const paired = await presence(db, { now: T0 + 1000 });
  assert.equal(paired.modes.quick.inQueue, 0, 'a paired row has left the queue');
  assert.equal(paired.modes.quick.inGame, 0, 'and the room is a lobby until the round is scheduled');
});

/* ------------------------------------------------------------------ the 5 s cache */

test('the ingress serves one presence answer per 5 s and shares the in-flight query', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  await queueRow(db, { who: pid('a'), mode: 'quick', ticket: hex('1') });
  const cache = new Map();
  let clock = T0;
  const now = () => clock;
  const statements = () => db.metrics.statements;

  const before = statements();
  const [first, twin] = await Promise.all([cachedPresence(db, { cache, now }), cachedPresence(db, { cache, now })]);
  assert.equal(first.modes.quick.inQueue, 1);
  assert.equal(twin, first, 'concurrent callers share one answer');
  assert.equal(statements() - before, 2, 'one queue count and one room count, once');

  // A row arrives, but the cached answer is still inside its window: the count does not move.
  await queueRow(db, { who: pid('b'), mode: 'quick', ticket: hex('2') });
  const mid = statements();
  clock = T0 + PRESENCE_CACHE_MS - 1;
  const cached = await cachedPresence(db, { cache, now });
  assert.equal(cached, first, 'the same object, not a re-count');
  assert.equal(statements(), mid, 'no statement ran');

  clock = T0 + PRESENCE_CACHE_MS;
  const fresh = await cachedPresence(db, { cache, now });
  assert.notEqual(fresh, first);
  assert.equal(fresh.modes.quick.inQueue, 2);
  assert.equal(fresh.asOf, clock, 'the answer is stamped with the clock it was counted at');
});

test('a failed count is dropped from the cache, so the next caller retries rather than inheriting it', async () => {
  const cache = new Map();
  const broken = {
    prepare() {
      throw new Error('the database is down');
    },
  };
  await assert.rejects(() => cachedPresence(broken, { cache, now: () => T0 }), /down/);
  assert.equal(cache.size, 0);
});

/* ------------------------------------------------------------------ the ingress */

test('POST /api/queue {action:"presence"} needs no principal and answers counts only', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  await queueRow(db, { who: pid('a'), mode: 'trilogy', ticket: hex('1') });
  await roomRow(db, { id: hex('2'), phase: 'playing', mode: 'quick' });
  const call = (body, headers = {}, deps = {}) =>
    handleQueueRequest(
      new Request('https://duel.test/api/queue', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
      }),
      { DB: db },
      deps,
    );
  const anonymous = await call({ action: 'presence' }, {}, { presenceCache: new Map(), now: () => T0 });
  assert.equal(anonymous.status, 200, 'no guest header, no cookie, still answered');
  const view = await anonymous.json();
  assert.deepEqual(Object.keys(view).sort(), ['asOf', 'modes']);
  assert.equal(view.modes.trilogy.inQueue, 1);
  assert.equal(view.modes.quick.inGame, 1);
  assert.equal(JSON.stringify(view).includes(pid('a')), false, 'no principal is echoed');
  // The other actions still need one.
  const poll = await call({ action: 'poll', ticket: hex('1'), name: 'Ana' });
  assert.equal(poll.status, 401);
  assert.equal((await poll.json()).code, 'sign_in_required');
  // And a worker without a database still refuses before it looks at the action.
  const noDb = await handleQueueRequest(
    new Request('https://duel.test/api/queue', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'presence' }),
    }),
    {},
  );
  assert.equal(noDb.status, 503);
});

/* ------------------------------------------------------------------ the client sanitiser */

test('readPresence takes only two safe non-negative integers per mode, and nothing else', () => {
  const good = { asOf: T0, modes: { quick: { inQueue: 3, inGame: 12 }, trilogy: { inQueue: 0, inGame: 0 } } };
  const read = readPresence(good);
  assert.deepEqual(read, good);
  assert.ok(Object.isFrozen(read) && Object.isFrozen(read.modes) && Object.isFrozen(read.modes.quick));
  for (const bad of [
    null,
    undefined,
    'nope',
    '<!doctype html><html></html>',
    {},
    { asOf: T0 },
    { asOf: 0, modes: { quick: { inQueue: 1, inGame: 1 } } },
    { asOf: -1, modes: { quick: { inQueue: 1, inGame: 1 } } },
    { asOf: 1.5, modes: { quick: { inQueue: 1, inGame: 1 } } },
    { asOf: T0, modes: {} },
    { asOf: T0, modes: { quick: null } },
    { asOf: T0, modes: { quick: { inQueue: -1, inGame: 0 } } },
    { asOf: T0, modes: { quick: { inQueue: 1.5, inGame: 0 } } },
    { asOf: T0, modes: { quick: { inQueue: '3', inGame: 0 } } },
    { asOf: T0, modes: { quick: { inQueue: 1, inGame: 1 }, trilogy: { inQueue: 1 } } },
    { error: 'Unknown action.', code: 'invalid_request' },
  ])
    assert.equal(readPresence(bad), null, JSON.stringify(bad) ?? String(bad));
});

test('an answer is live for 15 s and not a millisecond longer', () => {
  assert.equal(PRESENCE_FRESH_MS, 15_000);
  assert.equal(isFresh(T0, T0), true);
  assert.equal(isFresh(T0, T0 + 14_999), true);
  assert.equal(isFresh(T0, T0 + 15_000), false);
  assert.equal(isFresh(T0, T0 + 60_000), false);
});

/* ------------------------------------------------------------------ the client loop */

/** A hand-wound clock and timer queue, so the loop's cadence is tested rather than waited out. */
function fakeTimers(start = T0) {
  let at = start,
    seq = 0;
  const timers = new Map();
  const drain = async () => {
    for (let i = 0; i < 12; i += 1) await tick();
  };
  return {
    now: () => at,
    pending: () => timers.size,
    setTimeout: (fn, ms) => {
      const id = ++seq;
      timers.set(id, { at: at + ms, fn });
      return id;
    },
    clearTimeout: (id) => {
      timers.delete(id);
    },
    async settle() {
      await drain();
    },
    async advance(ms) {
      const target = at + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        at = due[1].at;
        due[1].fn();
        await drain();
      }
      at = target;
      await drain();
    },
  };
}

/** A visibility source a test can flip, wired the way the Page Visibility API is. */
function fakeVisibility(initial = true) {
  let visible = initial;
  const listeners = new Set();
  return {
    visible: () => visible,
    subscribeVisibility: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    listeners: () => listeners.size,
    set(next) {
      visible = next;
      for (const listener of [...listeners]) listener();
    },
  };
}

const answer = (asOf, quick = 3, inGame = 12) => ({
  asOf,
  modes: { quick: { inQueue: quick, inGame }, trilogy: { inQueue: 0, inGame: 0 }, gauntlet: { inQueue: 0, inGame: 0 } },
});

function harness({ replies, start = T0, visibleAt = true } = {}) {
  const timers = fakeTimers(start);
  const vis = fakeVisibility(visibleAt);
  const views = [];
  let calls = 0;
  const request = async () => {
    calls += 1;
    return replies(calls, timers.now());
  };
  const handle = startPresence((view) => views.push(view), {
    request,
    now: timers.now,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    visible: vis.visible,
    subscribeVisibility: vis.subscribeVisibility,
  });
  return { timers, vis, views, handle, calls: () => calls };
}

test('the loop polls once on mount and then every 10 s while the page is visible', async () => {
  assert.equal(PRESENCE_POLL_MS, 10_000);
  const h = harness({ replies: (n, now) => answer(now, n) });
  await h.timers.settle();
  assert.equal(h.calls(), 1, 'a visible mount reads at once, not after the first interval');
  assert.deepEqual(h.views.at(-1), { modes: answer(T0, 1).modes, asOf: T0, at: T0, fresh: true });

  await h.timers.advance(PRESENCE_POLL_MS - 1);
  assert.equal(h.calls(), 1);
  await h.timers.advance(1);
  assert.equal(h.calls(), 2);
  assert.equal(h.views.at(-1).modes.quick.inQueue, 2);
  assert.equal(h.views.at(-1).at, T0 + PRESENCE_POLL_MS);

  await h.timers.advance(PRESENCE_POLL_MS * 3);
  assert.equal(h.calls(), 5);
  h.handle.stop();
  await h.timers.advance(PRESENCE_POLL_MS * 5);
  assert.equal(h.calls(), 5, 'stop() ends the loop');
  assert.equal(h.timers.pending(), 0, 'and drops its timer');
  assert.equal(h.vis.listeners(), 0, 'and its visibility listener');
});

test('a hidden page polls nothing at all, and becoming visible polls at once', async () => {
  const h = harness({ replies: (n, now) => answer(now, n) });
  await h.timers.settle();
  assert.equal(h.calls(), 1);

  h.vis.set(false);
  await h.timers.settle();
  assert.equal(h.timers.pending(), 0, 'no timer survives going hidden');
  await h.timers.advance(PRESENCE_POLL_MS * 30);
  assert.equal(h.calls(), 1, 'five minutes hidden cost nothing');

  h.vis.set(true);
  await h.timers.settle();
  assert.equal(h.calls(), 2, 'coming back reads immediately');
  assert.equal(h.views.at(-1).fresh, true);
  await h.timers.advance(PRESENCE_POLL_MS);
  assert.equal(h.calls(), 3, 'and the cadence resumes');
  h.handle.stop();
});

test('a page that mounts hidden never polls until it is looked at', async () => {
  const h = harness({ replies: (n, now) => answer(now, n), visibleAt: false });
  await h.timers.settle();
  assert.equal(h.calls(), 0);
  assert.equal(h.views.length, 0, 'and prints nothing: no line is honest, a zero would not be');
  await h.timers.advance(PRESENCE_POLL_MS * 10);
  assert.equal(h.calls(), 0);
  h.vis.set(true);
  await h.timers.settle();
  assert.equal(h.calls(), 1);
  h.handle.stop();
});

test('two failures in a row back the loop off to 30 s, and one success restores 10 s', async () => {
  assert.equal(PRESENCE_BACKOFF_MS, 30_000);
  assert.equal(PRESENCE_FAILURES_BEFORE_BACKOFF, 2);
  // Poll 1 succeeds; 2, 3 and 4 fail; 5 succeeds.
  const h = harness({ replies: (n, now) => (n === 1 || n >= 5 ? answer(now, n) : null) });
  await h.timers.settle();
  assert.equal(h.calls(), 1);

  await h.timers.advance(PRESENCE_POLL_MS);
  assert.equal(h.calls(), 2, 'the first failure keeps the 10 s cadence');
  assert.equal(h.views.at(-1).fresh, true, 'a 10 s old answer is still live');

  await h.timers.advance(PRESENCE_POLL_MS);
  assert.equal(h.calls(), 3, 'the second failure lands on time too');
  assert.equal(h.views.at(-1).fresh, false, '20 s without an answer is no longer live');
  assert.equal(h.views.at(-1).modes.quick.inQueue, 1, 'but the last real numbers still stand');

  await h.timers.advance(PRESENCE_BACKOFF_MS - 1);
  assert.equal(h.calls(), 3, 'the third poll waits out the back-off');
  await h.timers.advance(1);
  assert.equal(h.calls(), 4);

  await h.timers.advance(PRESENCE_BACKOFF_MS);
  assert.equal(h.calls(), 5, 'still backed off while it keeps failing');
  assert.equal(h.views.at(-1).fresh, true, 'the success is live again');
  assert.equal(h.views.at(-1).modes.quick.inQueue, 5);
  await h.timers.advance(PRESENCE_POLL_MS);
  assert.equal(h.calls(), 6, 'and the 10 s cadence is back');
  h.handle.stop();
});

test('a failure never becomes a number, and a malformed answer is a failure', async () => {
  const h = harness({
    replies: (n, now) => (n === 1 ? answer(now, 7) : { asOf: now, modes: { quick: { inQueue: 'many', inGame: 0 } } }),
  });
  await h.timers.settle();
  assert.equal(h.views.length, 1);
  await h.timers.advance(PRESENCE_POLL_MS * 2);
  assert.equal(h.calls(), 3);
  for (const view of h.views) assert.equal(view.modes.quick.inQueue, 7, 'only ever the one real count');
  assert.equal(h.views.at(-1).fresh, false);
  h.handle.stop();
});

test('a request that rejects is a failure like any other, and never escapes the loop', async () => {
  const h = harness({
    replies: (n) => {
      if (n > 1) throw new Error('network down');
      return answer(T0, 4);
    },
  });
  await h.timers.settle();
  await h.timers.advance(PRESENCE_POLL_MS * 2);
  assert.equal(h.calls(), 3);
  assert.equal(h.views.at(-1).modes.quick.inQueue, 4);
  h.handle.stop();
});

test('freshness is re-judged when the page comes back, before the new answer arrives', async () => {
  const h = harness({ replies: (n, now) => answer(now, n) });
  await h.timers.settle();
  assert.equal(h.views.at(-1).fresh, true);
  h.vis.set(false);
  await h.timers.advance(60_000);
  const before = h.views.length;
  h.vis.set(true);
  // The re-judge is emitted first, then the fresh answer.
  assert.equal(h.views[before].fresh, false, 'a minute-old answer is not live, even for a moment');
  await h.timers.settle();
  assert.equal(h.views.at(-1).fresh, true);
  h.handle.stop();
});

/* ------------------------------------------------------------------ the static twin */

test('the static twin never polls and always answers null', async () => {
  assert.equal(staticTwin.usePresence(), null);
  assert.equal(staticTwin.readPresence({ asOf: T0, modes: { quick: { inQueue: 1, inGame: 1 } } }), null);
  assert.equal(await staticTwin.requestPresence(), null);
  assert.equal(staticTwin.isFresh(T0, T0), false);

  let calls = 0,
    timers = 0,
    listeners = 0;
  const views = [];
  const handle = staticTwin.startPresence((view) => views.push(view), {
    request: async () => {
      calls += 1;
      return answer(T0);
    },
    now: () => T0,
    setTimeout: () => {
      timers += 1;
      return 1;
    },
    clearTimeout: () => {},
    visible: () => true,
    subscribeVisibility: () => {
      listeners += 1;
      return () => {};
    },
  });
  handle.stop();
  handle.stop();
  assert.deepEqual([calls, timers, listeners, views.length], [0, 0, 0, 0]);
});

test('the twin exports the same names as the real client, so the alias is a drop-in', async () => {
  const real = await import('../lib/presence-client.ts');
  for (const name of Object.keys(real)) assert.ok(name in staticTwin, `the twin exports ${name}`);
});
