import test from 'node:test';
import assert from 'node:assert/strict';
import { COHORT, dispatch, D1RoomStore, shapeCohortReport } from '../lib/server/duel-service.mjs';
import { handleDuelRequest } from '../lib/server/http-handler.mjs';
import { LocalD1 } from './d1-local.mjs';

/** A fixed server day, so every elapsed-window assertion is deterministic. */
const NOW = Date.UTC(2026, 8, 13, 12, 0, 0); // 2026-09-13
const anon = () => crypto.randomUUID().replaceAll('-', '');
const day = (d) => ({ day: d, sessions: 1, ms: 0, rounds: 0, matches: 0 });

function fixture(t) {
  const db = new LocalD1(),
    store = new D1RoomStore(db);
  t.after(() => db.close());
  let actor = 0;
  const call = (body, now = NOW) =>
    dispatch(store, body, { now, actor: `actor-${actor++}` /* fresh bucket per call */ });
  const ping = (body, now) => call({ action: 'cohort-ping', ...body }, now);
  const report = (now) => call({ action: 'cohort-report' }, now);
  const rows = (anonId) =>
    db.sqlite.prepare('SELECT * FROM cohort_days WHERE anon_id=? ORDER BY day').all(anonId);
  return { db, store, call, ping, report, rows };
}
const rejects = (promise, status = 400) =>
  assert.rejects(promise, (e) => {
    assert.equal(e.status, status, `${e.message} (status ${e.status})`);
    return true;
  });

test('cohort-ping stores each day and answers with a count and nothing else', async (t) => {
  const { ping, rows } = fixture(t);
  const id = anon();
  const result = await ping({
    anonId: id,
    installDay: '2026-09-01',
    days: [
      { day: '2026-09-01', sessions: 2, ms: 60000, rounds: 5, matches: 1 },
      { day: '2026-09-02', sessions: 1, ms: 30000, rounds: 3, matches: 0 },
    ],
  });
  assert.deepEqual(result, { ok: true, stored: 2 });
  assert.deepEqual(Object.keys(result), ['ok', 'stored']); // never echoes the payload back
  assert.ok(!JSON.stringify(result).includes(id));
  const stored = rows(id);
  assert.equal(stored.length, 2);
  assert.deepEqual(
    stored.map((r) => [r.day, r.install_day, r.sessions, r.ms, r.rounds, r.matches]),
    [
      ['2026-09-01', '2026-09-01', 2, 60000, 5, 1],
      ['2026-09-02', '2026-09-01', 1, 30000, 3, 0],
    ],
  );
  assert.equal(stored[0].updated_at, NOW);
});

test('cohort-ping rejects an id that is not 32 hex characters', async (t) => {
  const { ping } = fixture(t);
  const body = (anonId) => ({ anonId, installDay: '2026-09-01', days: [day('2026-09-01')] });
  for (const bad of [undefined, null, 42, 'ZZZ', 'a'.repeat(31), 'a'.repeat(33), anon().toUpperCase()])
    await rejects(ping(body(bad)));
  await assert.doesNotReject(ping(body(anon())));
});

test('cohort-ping rejects days that are not real calendar days', async (t) => {
  const { ping } = fixture(t);
  const id = anon();
  for (const bad of ['2026-02-30', '2026-13-01', '2026-9-1', '20260901', 'yesterday', '', 5, null])
    await rejects(ping({ anonId: id, installDay: '2026-09-01', days: [{ ...day('x'), day: bad }] }));
  await rejects(ping({ anonId: id, installDay: '2026-02-30', days: [day('2026-09-01')] }));
});

test('cohort-ping rejects an empty, oversized or malformed day list', async (t) => {
  const { ping } = fixture(t);
  const id = anon();
  const many = Array.from({ length: COHORT.maxDays + 1 }, (_, i) =>
    day(new Date(Date.UTC(2026, 6, 1) + i * 864e5).toISOString().slice(0, 10)),
  );
  await rejects(ping({ anonId: id, installDay: '2026-01-01', days: [] }));
  await rejects(ping({ anonId: id, installDay: '2026-01-01', days: many }));
  await rejects(ping({ anonId: id, installDay: '2026-01-01', days: 'a lot' }));
  await rejects(ping({ anonId: id, installDay: '2026-01-01', days: [null] }));
  await rejects(ping({ anonId: id, installDay: '2026-01-01', days: [['2026-01-01']] }));
  // Exactly the cap is accepted.
  const ok = await ping({ anonId: id, installDay: '2026-01-01', days: many.slice(0, COHORT.maxDays) });
  assert.equal(ok.stored, COHORT.maxDays);
});

test('cohort-ping rejects impossible counters, duplicate days and days outside the window', async (t) => {
  const { ping } = fixture(t);
  const id = anon();
  const one = (extra) => ({
    anonId: id,
    installDay: '2026-09-01',
    days: [{ ...day('2026-09-02'), ...extra }],
  });
  for (const bad of [-1, 1.5, NaN, Infinity, '3', null, undefined])
    await rejects(ping(one({ sessions: bad })));
  for (const bad of [-1, 2.5, '10']) await rejects(ping(one({ ms: bad })));
  await rejects(ping(one({ rounds: -0.0001 })));
  await rejects(ping(one({ matches: Number.MAX_VALUE })));
  // A day before the install day, and a day beyond tomorrow.
  await rejects(ping({ anonId: id, installDay: '2026-09-01', days: [day('2026-08-31')] }));
  await rejects(ping({ anonId: id, installDay: '2026-09-01', days: [day('2027-01-01')] }));
  // Duplicates would make the MAX upsert order-dependent, so they are refused outright.
  await rejects(ping({ anonId: id, installDay: '2026-09-01', days: [day('2026-09-02'), day('2026-09-02')] }));
});

test('counters are clamped to their ceiling rather than trusted', async (t) => {
  const { ping, rows } = fixture(t);
  const id = anon();
  await ping({
    anonId: id,
    installDay: '2026-09-01',
    days: [{ day: '2026-09-01', sessions: 1e9, ms: 1e12, rounds: 1e9, matches: 1e9 }],
  });
  const [row] = rows(id);
  assert.equal(row.sessions, COHORT.ceilings.sessions);
  assert.equal(row.ms, COHORT.ceilings.ms);
  assert.equal(row.rounds, COHORT.ceilings.rounds);
  assert.equal(row.matches, COHORT.ceilings.matches);
});

test('a stale or replayed ping can never lower a counter', async (t) => {
  const { ping, rows } = fixture(t);
  const id = anon();
  const high = { day: '2026-09-01', sessions: 9, ms: 900000, rounds: 40, matches: 4 };
  const low = { day: '2026-09-01', sessions: 1, ms: 1000, rounds: 0, matches: 0 };
  await ping({ anonId: id, installDay: '2026-09-01', days: [high] });
  await ping({ anonId: id, installDay: '2026-09-01', days: [low] }); // stale device state
  assert.deepEqual(
    rows(id).map((r) => [r.sessions, r.ms, r.rounds, r.matches]),
    [[9, 900000, 40, 4]],
  );
  // A replay of the same ping is a no-op on the totals and still reports what it sent.
  const replay = await ping({ anonId: id, installDay: '2026-09-01', days: [high] });
  assert.deepEqual(replay, { ok: true, stored: 1 });
  assert.equal(rows(id).length, 1);
  assert.deepEqual(
    rows(id).map((r) => [r.sessions, r.ms, r.rounds, r.matches]),
    [[9, 900000, 40, 4]],
  );
  // A later, higher ping does raise them.
  await ping({ anonId: id, installDay: '2026-09-01', days: [{ ...high, sessions: 11 }] }, NOW + 60000);
  assert.equal(rows(id)[0].sessions, 11);
  assert.equal(rows(id)[0].updated_at, NOW + 60000);
});

test('the install day of a device only ever moves earlier', async (t) => {
  const { ping, rows } = fixture(t);
  const id = anon();
  await ping({ anonId: id, installDay: '2026-09-01', days: [day('2026-09-05')] });
  await ping({ anonId: id, installDay: '2026-09-04', days: [day('2026-09-05')] }); // reinstalled
  assert.equal(rows(id)[0].install_day, '2026-09-01');
  await ping({ anonId: id, installDay: '2026-08-20', days: [day('2026-09-05')] });
  assert.equal(rows(id)[0].install_day, '2026-08-20');
});

test('cohort-ping is rate limited through the shared admission path', async (t) => {
  const { store } = fixture(t);
  const body = { action: 'cohort-ping', anonId: anon(), installDay: '2026-09-01', days: [day('2026-09-01')] };
  const call = () => dispatch(store, body, { now: NOW, actor: 'one-noisy-caller' });
  for (let i = 0; i < 30; i++) await call();
  await rejects(call(), 429);
  // A different caller in the same minute is unaffected.
  await assert.doesNotReject(dispatch(store, body, { now: NOW, actor: 'someone-else' }));
  // And the same caller is admitted again in the next minute bucket.
  await assert.doesNotReject(dispatch(store, body, { now: NOW + 60000, actor: 'one-noisy-caller' }));
});

test('both cohort actions answer 503 when there is no database binding', async () => {
  const post = (body) =>
    handleDuelRequest(
      new Request('https://duel.example/api/duel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      {},
    );
  for (const body of [
    { action: 'cohort-report' },
    { action: 'cohort-ping', anonId: anon(), installDay: '2026-09-01', days: [day('2026-09-01')] },
  ]) {
    const response = await post(body);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'service_unavailable');
  }
});

/** Seeds `count` devices installed on `installDay`, each active again on the given offsets. */
async function seed(ping, { installDay, count, returns = [], sessions = 2, ms = 3600000 }) {
  const ids = [];
  for (let i = 0; i < count; i++) {
    const id = anon();
    ids.push(id);
    const base = Date.UTC(...installDay.split('-').map((n, k) => (k === 1 ? Number(n) - 1 : Number(n))));
    const days = [{ day: installDay, sessions, ms, rounds: 0, matches: 0 }];
    for (const offset of returns[i] ?? [])
      days.push({
        day: new Date(base + offset * 864e5).toISOString().slice(0, 10),
        sessions: 1,
        ms: 0,
        rounds: 0,
        matches: 0,
      });
    await ping({ anonId: id, installDay, days });
  }
  return ids;
}

test('cohort-report aggregates D1/D7/D30 over devices whose window has elapsed', async (t) => {
  const { ping, report } = fixture(t);
  // Six devices installed on 2026-01-01: three came back on D1, two on D7, one on D30.
  await seed(ping, {
    installDay: '2026-01-01',
    count: 6,
    returns: [[1, 7, 30], [1, 7], [1], [], [], []],
  });
  const { cohort } = await report();
  assert.equal(cohort.devices, 6);
  assert.equal(cohort.generatedDay, '2026-09-13');
  assert.equal(cohort.minBucket, COHORT.minBucket);
  assert.deepEqual(cohort.byInstallDay, [{ day: '2026-01-01', devices: 6, suppressed: false }]);
  assert.deepEqual(cohort.retention.d1, { eligible: 6, returned: 3, rate: 0.5, suppressed: false });
  assert.deepEqual(cohort.retention.d7, { eligible: 6, returned: 2, rate: 0.333, suppressed: false });
  assert.deepEqual(cohort.retention.d30, { eligible: 6, returned: 1, rate: 0.167, suppressed: false });
  // 6 install days x 2 sessions, plus 3 + 2 + 1 return sessions.
  assert.equal(cohort.sessions, 18);
  assert.equal(cohort.engagedHours, 6);
  assert.equal(cohort.suppressed, false);
});

test('a window that has not fully elapsed is left out of the denominator, never scored as a miss', async (t) => {
  const { ping, report } = fixture(t);
  // Installed yesterday: D1 lands today and is not over, D7 and D30 are far away.
  await seed(ping, { installDay: '2026-09-12', count: 6 });
  const fresh = (await report()).cohort;
  assert.deepEqual(fresh.retention.d1, { eligible: null, returned: null, rate: null, suppressed: true });
  assert.deepEqual(fresh.retention.d7, { eligible: null, returned: null, rate: null, suppressed: true });
  // Six older devices make D1 eligible while D30 is still unfinished for the young ones.
  await seed(ping, { installDay: '2026-09-01', count: 6, returns: [[1], [1], [1], [1], [1], []] });
  const mixed = (await report()).cohort;
  assert.equal(mixed.devices, 12);
  assert.deepEqual(mixed.retention.d1, { eligible: 6, returned: 5, rate: 0.833, suppressed: false });
  assert.deepEqual(mixed.retention.d30, { eligible: null, returned: null, rate: null, suppressed: true });
});

test('buckets below the threshold are suppressed rather than reported as a small number', async (t) => {
  const { ping, report } = fixture(t);
  await seed(ping, { installDay: '2026-01-01', count: 4, returns: [[1], [1], [], []] });
  const tiny = (await report()).cohort;
  assert.equal(tiny.devices, 4);
  assert.equal(tiny.suppressed, true);
  assert.equal(tiny.sessions, null); // with four devices a sum is nearly a device
  assert.equal(tiny.engagedHours, null);
  assert.deepEqual(tiny.byInstallDay, [{ day: '2026-01-01', devices: null, suppressed: true }]);
  for (const n of COHORT.windows)
    assert.deepEqual(tiny.retention[`d${n}`], {
      eligible: null,
      returned: null,
      rate: null,
      suppressed: true,
    });
  // A second, larger install day is reported while the small one stays suppressed.
  await seed(ping, { installDay: '2026-02-01', count: 5 });
  const mixed = (await report()).cohort;
  assert.equal(mixed.devices, 9);
  assert.equal(mixed.suppressed, false);
  assert.deepEqual(mixed.byInstallDay, [
    { day: '2026-01-01', devices: null, suppressed: true },
    { day: '2026-02-01', devices: 5, suppressed: false },
  ]);
});

test('an empty cohort reports zero without inventing a rate', async (t) => {
  const { report } = fixture(t);
  const { cohort } = await report();
  assert.equal(cohort.devices, 0);
  assert.deepEqual(cohort.byInstallDay, []);
  assert.equal(cohort.sessions, null);
  for (const n of COHORT.windows) assert.equal(cohort.retention[`d${n}`].rate, null);
});

test('no cohort response can carry an anon id or a per-device row', async (t) => {
  const { ping, report } = fixture(t);
  const ids = await seed(ping, {
    installDay: '2026-01-01',
    count: 7,
    returns: [[1], [1], [1], [], [], [], []],
  });
  const pinged = await ping({ anonId: ids[0], installDay: '2026-01-01', days: [day('2026-01-02')] });
  const text = JSON.stringify(await report()) + JSON.stringify(pinged);
  for (const id of ids) assert.ok(!text.includes(id), 'a response leaked an anon id');
  assert.ok(!text.includes('anon'), 'a response mentions an anon id field');
  // Nothing in the report is longer than a day key, a count or the fixed note.
  const { cohort } = await report();
  assert.deepEqual(Object.keys(cohort).sort(), [
    'byInstallDay',
    'devices',
    'engagedHours',
    'generatedDay',
    'minBucket',
    'note',
    'retention',
    'sessions',
    'suppressed',
  ]);
});

test('shapeCohortReport suppresses small buckets without a database', () => {
  const raw = {
    devices: 4,
    sessions: 99,
    ms: 7200000,
    byInstallDay: [
      { day: '2026-01-01', devices: 4 },
      { day: '2026-02-01', devices: 5 },
    ],
    windows: {
      d1: { eligible: 4, returned: 4 },
      d7: { eligible: 5, returned: 1 },
      d30: { eligible: 0, returned: 0 },
    },
  };
  const small = shapeCohortReport(raw, '2026-09-13');
  assert.equal(small.sessions, null);
  assert.equal(small.engagedHours, null);
  assert.deepEqual(small.byInstallDay[0], { day: '2026-01-01', devices: null, suppressed: true });
  assert.deepEqual(small.byInstallDay[1], { day: '2026-02-01', devices: 5, suppressed: false });
  assert.equal(small.retention.d1.suppressed, true);
  assert.deepEqual(small.retention.d7, { eligible: 5, returned: 1, rate: 0.2, suppressed: false });
  const large = shapeCohortReport({ ...raw, devices: 40 }, '2026-09-13');
  assert.equal(large.sessions, 99);
  assert.equal(large.engagedHours, 2);
  assert.equal(large.suppressed, false);
});

test('the HTTP surface accepts a ping and returns only the aggregate', async (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  const post = (body) =>
    handleDuelRequest(
      new Request('https://duel.example/api/duel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { DB: db },
    );
  const id = anon();
  const pinged = await post({
    action: 'cohort-ping',
    anonId: id,
    installDay: '2026-09-01',
    days: [{ day: '2026-09-01', sessions: 1, ms: 1000, rounds: 2, matches: 0 }],
  });
  assert.equal(pinged.status, 200);
  assert.equal(pinged.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await pinged.json(), { ok: true, stored: 1 });
  const bad = await post({ action: 'cohort-ping', anonId: 'nope', installDay: '2026-09-01', days: [] });
  assert.equal(bad.status, 400);
  const reported = await post({ action: 'cohort-report' });
  assert.equal(reported.status, 200);
  const text = await reported.text();
  assert.ok(!text.includes(id));
  assert.equal(JSON.parse(text).cohort.devices, 1);
});

// ---------------------------------------------------------------------------------------------
// The client caller.
const { sendCohortPing, COHORT_PING_DAYS } = await import('../lib/cohort-client.ts');
const grantedState = (days) => ({
  consent: 'granted',
  anonId: anon(),
  installDay: '2026-01-01',
  days: Object.fromEntries(days.map((d) => [d, { sessions: 1, ms: 60000, rounds: 2, matches: 1 }])),
});

test('sendCohortPing sends nothing without consent, an id or a day', async () => {
  const calls = [];
  const spy = async (body) => {
    calls.push(body);
    return { ok: true, stored: 1 };
  };
  const state = grantedState(['2026-01-01']);
  assert.equal(await sendCohortPing(null, spy), 0);
  assert.equal(await sendCohortPing({ ...state, consent: 'unset' }, spy), 0);
  assert.equal(await sendCohortPing({ ...state, consent: 'denied' }, spy), 0);
  assert.equal(await sendCohortPing({ ...state, anonId: null }, spy), 0);
  assert.equal(await sendCohortPing({ ...state, anonId: 'not-hex' }, spy), 0);
  assert.equal(await sendCohortPing({ ...state, installDay: null }, spy), 0);
  assert.equal(await sendCohortPing({ ...state, days: {} }, spy), 0);
  assert.equal(calls.length, 0, 'nothing may leave the device before consent');
});

test('sendCohortPing sends at most the last 40 days and only day keys and counts', async (t) => {
  const { store } = fixture(t);
  const all = Array.from({ length: 60 }, (_, i) =>
    new Date(Date.UTC(2026, 0, 1) + i * 864e5).toISOString().slice(0, 10),
  );
  const state = grantedState(all);
  let sent = null;
  const transport = async (body) => {
    sent = body;
    return dispatch(store, body, { now: NOW, actor: 'client' });
  };
  assert.equal(await sendCohortPing(state, transport), COHORT_PING_DAYS);
  assert.equal(sent.days.length, COHORT_PING_DAYS);
  assert.equal(sent.days.at(-1).day, all.at(-1)); // the newest days, oldest first
  assert.equal(sent.days[0].day, all.at(-COHORT_PING_DAYS));
  assert.deepEqual(Object.keys(sent).sort(), ['action', 'anonId', 'days', 'installDay']);
  for (const row of sent.days)
    assert.deepEqual(Object.keys(row).sort(), ['day', 'matches', 'ms', 'rounds', 'sessions']);
  assert.ok(JSON.stringify(sent).length < 4096, 'a ping must fit the request size cap');
});

test('sendCohortPing swallows every failure so measurement can never break play', async () => {
  const state = grantedState(['2026-01-01']);
  const failures = [
    async () => {
      throw new Error('offline');
    },
    async () => {
      const e = new Error('Too many room requests.');
      e.status = 429;
      throw e;
    },
    async () => '<!doctype html><title>404</title>', // a static host, not our JSON
    async () => null,
    async () => ({ error: 'nope' }),
    async () => ({ ok: false, stored: 3 }),
    async () => ({ ok: true, stored: 'lots' }),
  ];
  for (const transport of failures) assert.equal(await sendCohortPing(state, transport), 0);
  assert.equal(await sendCohortPing(state, undefined), 0);
  assert.equal(await sendCohortPing(state, async () => ({ ok: true, stored: 1 })), 1);
});
