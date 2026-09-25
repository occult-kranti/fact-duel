/**
 * Cross-device profile sync, server side and the pure client merge.
 *
 * The property under test: the server keeps the highest revision it has seen and never lets a
 * lower one overwrite it, and it tells the stale device so by handing back its copy. The guard is
 * a read after the upsert, because on D1 a zero-row UPDATE is a success (tests/d1-batch-semantics),
 * so these tests check the row, not the change count. Then: only a session gets in, junk is
 * sanitised before it is stored, and a profile past the byte cap is refused before it is parsed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalD1 } from './d1-local.mjs';
import { PROFILE, getProfile, putProfile, requireSession } from '../lib/server/profile-service.mjs';
import { handleProfileRequest } from '../lib/server/http-profile.mjs';
import { sha256 } from '../lib/ledger/sha256.mjs';
import { emptyProfile, readProfile, reduceProfile } from '../lib/passport.mjs';
const { mergeOnSignIn, pushProfile, pullProfile, whoami, createProfilePusher, PUSH_DEBOUNCE_MS } = await import(
  '../lib/profile-sync.ts'
);

const T0 = Date.parse('2026-09-16T10:00:00Z');
const ME = 'p_0123456789abcdef0123456789abcdef';
const YOU = 'p_fedcba9876543210fedcba9876543210';
/** 48 url-safe characters, the shape `auth-service.mjs` mints and `sessionLookupFor` accepts. */
const SESSION = 'A'.repeat(20) + 'b-c_d'.repeat(5) + 'xyz';
assert.equal(SESSION.length, 48);

const opened = (t) => {
  const db = new LocalD1();
  t.after(() => db.close());
  return db;
};

/** A session row written exactly as `issueSession` writes it: the sha256 of the cookie value. */
const signIn = async (db, { sessionId = SESSION, principalId = ME, at = T0, expiresAt = T0 + 86_400_000, revoked = null } = {}) => {
  await db
    .prepare('INSERT INTO sessions (id_hash, principal_id, created_at, expires_at, last_seen_at, revoked_at) VALUES (?,?,?,?,?,?)')
    .bind(sha256(sessionId), principalId, at, expiresAt, at, revoked)
    .run();
};

const card = (i) => ({
  factId: `q${i}`,
  question: `Question ${i}?`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Explanation.',
  topic: 'Football',
  subtopic: 'World Cup',
  sourceUrl: 'https://example.org/fact',
  sourceLabel: 'Source',
});

/** A profile that has done `n` practice rounds, so it has content in every sub-record. */
const played = (n, epoch = 'e1') => {
  let p = { ...emptyProfile(epoch, T0), revision: 0 };
  for (let i = 0; i < n; i++)
    p = reduceProfile(p, { type: 'practice', epoch, at: T0 + i * 1000, fact: card(i), choice: i % 2, roundId: `practice:${i}` });
  return p;
};

const request = (body, { cookie = null, guest = null, origin = null, contentType = 'application/json' } = {}) => {
  const headers = { 'content-type': contentType };
  if (cookie) headers.cookie = `fd_session=${cookie}`;
  if (guest) headers['x-fd-principal'] = guest;
  if (origin) headers.origin = origin;
  return new Request('https://duel.example/api/profile', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
};

/* ------------------------------------------------------------------ service */

test('put then get round-trips a sanitised profile and pins the stored revision', async (t) => {
  const db = opened(t);
  assert.equal(await getProfile(db, ME), null);
  const p = played(5);
  assert.ok(p.revision > 0);
  const put = await putProfile(db, { principalId: ME, revision: p.revision, state: p, now: T0 });
  assert.deepEqual(put, { ok: true, revision: p.revision });
  const got = await getProfile(db, ME);
  assert.equal(got.revision, p.revision);
  assert.equal(got.updatedAt, T0);
  assert.deepEqual(got.state, readProfile(JSON.parse(JSON.stringify(p))), 'what comes back is the sanitised document');
  assert.equal(got.state.revision, p.revision, 'the row and the document agree on the revision');
  assert.equal(got.state.journal.rounds.length, 5);
  assert.equal(await getProfile(db, YOU), null, 'another principal sees nothing');
});

test('a lower revision is refused as stale with the server copy; an equal one is an accepted no-op', async (t) => {
  const db = opened(t);
  const newer = played(8);
  const older = played(3);
  assert.ok(older.revision < newer.revision);
  await putProfile(db, { principalId: ME, revision: newer.revision, state: newer, now: T0 });
  const stale = await putProfile(db, { principalId: ME, revision: older.revision, state: older, now: T0 + 1 });
  assert.equal(stale.ok, false);
  assert.equal(stale.reason, 'stale');
  assert.equal(stale.server.revision, newer.revision);
  assert.equal(stale.server.state.journal.rounds.length, 8, 'the stale device is handed the newer copy');
  const after = await getProfile(db, ME);
  assert.equal(after.revision, newer.revision);
  assert.equal(after.updatedAt, T0, 'the refused put touched nothing');

  const retry = await putProfile(db, { principalId: ME, revision: newer.revision, state: older, now: T0 + 2 });
  assert.deepEqual(retry, { ok: true, revision: newer.revision }, 'a retry of a landed push is not a conflict');
  assert.equal((await getProfile(db, ME)).state.journal.rounds.length, 8, 'and it changed nothing');

  const ahead = played(9);
  const moved = await putProfile(db, { principalId: ME, revision: ahead.revision, state: ahead, now: T0 + 3 });
  assert.equal(moved.ok, true);
  assert.equal((await getProfile(db, ME)).state.journal.rounds.length, 9);
});

test('junk state is stored as the sanitised document, never as sent', async (t) => {
  const db = opened(t);
  const junk = {
    version: 2,
    epoch: 'x'.repeat(500),
    revision: 'not a number',
    journal: 'nope',
    passport: { facts: { __proto__: { topic: 'Football' }, ok: { topic: 'Football', opened: 1 }, bad: { topic: 'Chemistry' } }, skin: 'gold' },
    progression: [],
    extra: { evil: true },
  };
  const put = await putProfile(db, { principalId: ME, revision: 4, state: junk, now: T0 });
  assert.equal(put.ok, true);
  const got = await getProfile(db, ME);
  const expected = readProfile(junk);
  expected.revision = 4;
  assert.deepEqual(got.state, expected);
  assert.equal(got.state.epoch, 'initial');
  assert.equal('extra' in got.state, false);
  assert.deepEqual(Object.keys(got.state.passport.facts), ['ok']);
  assert.equal(got.state.passport.facts.ok.opened, false, 'a truthy non-boolean does not count as opened');
  for (const state of [null, 'text', 42, [1, 2]])
    await assert.rejects(putProfile(db, { principalId: ME, revision: 5, state, now: T0 }), { status: 400 });
  for (const revision of [-1, 1.5, '3', Number.MAX_SAFE_INTEGER + 1])
    await assert.rejects(putProfile(db, { principalId: ME, revision, state: junk, now: T0 }), { status: 400 });
  assert.equal((await getProfile(db, ME)).revision, 4, 'none of the refused puts landed');
});

test('a profile above the byte cap is refused with 413 before anything is stored', async (t) => {
  const db = opened(t);
  const big = { ...emptyProfile('e1', T0), padding: 'x'.repeat(PROFILE.maxBytes) };
  await assert.rejects(putProfile(db, { principalId: ME, revision: 1, state: big, now: T0 }), { status: 413, code: 'too_large' });
  assert.equal(await getProfile(db, ME), null);
  // Bytes, not characters: a multi-byte string near the cap is over it.
  const wide = { ...emptyProfile('e1', T0), padding: 'é'.repeat(PROFILE.maxBytes - 400) };
  await assert.rejects(putProfile(db, { principalId: ME, revision: 1, state: wide, now: T0 }), { status: 413 });
  const fits = { ...emptyProfile('e1', T0), padding: 'x'.repeat(PROFILE.maxBytes - 16_000) };
  assert.equal((await putProfile(db, { principalId: ME, revision: 1, state: fits, now: T0 })).ok, true);
});

test('only a session principal passes the gate', () => {
  assert.equal(requireSession({ kind: 'session', principalId: ME }), ME);
  for (const principal of [
    { kind: 'guest', principalId: ME },
    { kind: 'anonymous', principalId: null },
    { kind: 'session', principalId: null },
    { kind: 'session' },
    null,
    undefined,
  ])
    assert.throws(() => requireSession(principal), { status: 401, code: 'sign_in_required' });
});

/* ------------------------------------------------------------------ HTTP */

test('HTTP: a guest header or no identity is 401 sign_in_required; no database is 503', async (t) => {
  const db = opened(t);
  const guest = await handleProfileRequest(request({ action: 'get' }, { guest: 'anon_0123456789abcdef0123456789abcdef' }), { DB: db });
  assert.equal(guest.status, 401);
  assert.deepEqual(await guest.json(), { error: 'Sign in to keep your profile across devices.', code: 'sign_in_required' });
  const nobody = await handleProfileRequest(request({ action: 'put', revision: 1, state: emptyProfile() }), { DB: db });
  assert.equal(nobody.status, 401);
  assert.equal((await nobody.json()).code, 'sign_in_required');
  const bogus = await handleProfileRequest(request({ action: 'get' }, { cookie: 'not-a-session' }), { DB: db });
  assert.equal(bogus.status, 401);
  const noDb = await handleProfileRequest(request({ action: 'get' }, { cookie: SESSION }), {});
  assert.equal(noDb.status, 503);
  assert.equal((await noDb.json()).code, 'service_unavailable');
  assert.equal(await getProfile(db, 'anon_0123456789abcdef0123456789abcdef'), null);
});

test('HTTP: a session cookie whose sha256 is a live sessions row reads and writes its own profile', async (t) => {
  // The handler reads the real clock (the session lookup, `putProfile`'s `now`); pin it to the session's T0.
  t.mock.timers.enable({ apis: ['Date'], now: T0 });
  const db = opened(t);
  await signIn(db);
  const empty = await handleProfileRequest(request({ action: 'get' }, { cookie: SESSION }), { DB: db });
  assert.equal(empty.status, 200);
  assert.equal(empty.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await empty.json(), { ok: true, profile: null });

  const p = played(4);
  const put = await handleProfileRequest(
    request({ action: 'put', revision: p.revision, state: p }, { cookie: SESSION, origin: 'https://duel.example' }),
    { DB: db },
  );
  assert.equal(put.status, 200);
  assert.deepEqual(await put.json(), { ok: true, revision: p.revision });
  const got = await (await handleProfileRequest(request({ action: 'get' }, { cookie: SESSION }), { DB: db })).json();
  assert.equal(got.ok, true);
  assert.equal(got.profile.revision, p.revision);
  assert.deepEqual(got.profile.state, readProfile(JSON.parse(JSON.stringify(p))));
  assert.equal((await getProfile(db, ME)).revision, p.revision, 'stored under the session principal, not a body field');

  const stale = await handleProfileRequest(request({ action: 'put', revision: 1, state: played(1) }, { cookie: SESSION }), { DB: db });
  assert.equal(stale.status, 200);
  const body = await stale.json();
  assert.equal(body.ok, false);
  assert.equal(body.reason, 'stale');
  assert.equal(body.server.revision, p.revision);

  // The session cookie wins over a guest header on the same request.
  const both = await handleProfileRequest(request({ action: 'get' }, { cookie: SESSION, guest: 'anon_0123456789abcdef0123456789abcdef' }), { DB: db });
  assert.equal((await both.json()).profile.revision, p.revision);
});

test('HTTP: an expired or revoked session is a guest again', async (t) => {
  const db = opened(t);
  await signIn(db, { sessionId: 'E'.repeat(48), expiresAt: 1 });
  await signIn(db, { sessionId: 'R'.repeat(48), revoked: T0 });
  for (const cookie of ['E'.repeat(48), 'R'.repeat(48)]) {
    const r = await handleProfileRequest(request({ action: 'get' }, { cookie }), { DB: db });
    assert.equal(r.status, 401);
  }
});

test('HTTP: the edge rejects cross-origin, non-JSON, oversized and unknown requests', async (t) => {
  // The handler reads the real clock (the session lookup, `putProfile`'s `now`); pin it to the session's T0.
  t.mock.timers.enable({ apis: ['Date'], now: T0 });
  const db = opened(t);
  await signIn(db);
  assert.equal((await handleProfileRequest(request({ action: 'get' }, { cookie: SESSION, origin: 'https://other.example' }), { DB: db })).status, 403);
  assert.equal((await handleProfileRequest(request('x', { cookie: SESSION, contentType: 'text/plain' }), { DB: db })).status, 415);
  assert.equal((await handleProfileRequest(request('{nope', { cookie: SESSION }), { DB: db })).status, 400);
  const unknown = await handleProfileRequest(request({ action: 'wallet' }, { cookie: SESSION }), { DB: db });
  assert.equal(unknown.status, 400);
  assert.equal((await unknown.json()).code, 'invalid_request');
  const huge = { action: 'put', revision: 1, state: { ...emptyProfile(), padding: 'x'.repeat(PROFILE.maxBytes + 5000) } };
  const tooBig = await handleProfileRequest(request(huge, { cookie: SESSION }), { DB: db });
  assert.equal(tooBig.status, 413);
  assert.equal((await tooBig.json()).code, 'too_large');
  const justOver = { action: 'put', revision: 1, state: { ...emptyProfile(), padding: 'x'.repeat(PROFILE.maxBytes) } };
  assert.equal((await handleProfileRequest(request(justOver, { cookie: SESSION }), { DB: db })).status, 413, 'the service cap holds inside the envelope slack');
  assert.equal(await getProfile(db, ME), null);
});

/* ------------------------------------------------------------------ the pure merge */

test('mergeOnSignIn keeps the higher revision whole; ties and junk keep the local copy by identity', () => {
  const local = played(3);
  const remote = played(6, 'e2');
  assert.ok(remote.revision > local.revision);
  const server = { revision: remote.revision, state: JSON.parse(JSON.stringify(remote)) };
  const won = mergeOnSignIn(local, server);
  assert.equal(won.source, 'server');
  assert.deepEqual(won.profile, readProfile(server.state));
  assert.equal(won.profile.revision, remote.revision);
  assert.equal(won.profile.epoch, 'e2', 'the document is taken whole, epoch included');
  assert.equal(won.profile.journal.rounds.length, 6);

  const behind = mergeOnSignIn(remote, { revision: local.revision, state: local });
  assert.equal(behind.source, 'local');
  assert.equal(behind.profile, remote, 'the local object itself comes back');

  const tie = mergeOnSignIn(local, { revision: local.revision, state: remote });
  assert.equal(tie.source, 'local');
  assert.equal(tie.profile, local);

  assert.equal(mergeOnSignIn(local, null).profile, local);
  assert.equal(mergeOnSignIn(local, { revision: 1e9, state: { version: 1 } }).source, 'local', 'a non-profile never wins, whatever its revision');
  assert.equal(mergeOnSignIn(local, { revision: 1e9, state: {} }).source, 'local');

  const fresh = emptyProfile();
  const first = mergeOnSignIn(fresh, server);
  assert.equal(first.source, 'server', 'a new device takes the account copy');
  assert.equal(mergeOnSignIn(fresh, { revision: 0, state: emptyProfile() }).profile, fresh, 'two empties: nothing to do');

  const pinned = mergeOnSignIn(local, { revision: 50, state: { ...remote, revision: 7 } });
  assert.equal(pinned.profile.revision, 50, 'the row revision, not the document field, orders the copies');
});

/* ------------------------------------------------------------------ the transport is silent without a server */

test('the client resolves quietly when there is no server or the answer is not our JSON', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () => new Response('<html>404</html>', { status: 404, headers: { 'content-type': 'text/html' } });
  assert.equal(await whoami(), null);
  assert.deepEqual(await pullProfile(), { ok: false, code: 'unavailable' });
  assert.deepEqual(await pushProfile(played(1)), { ok: false, code: 'unavailable' });
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  assert.equal(await whoami(), null);
  assert.deepEqual(await pullProfile(), { ok: false, code: 'unavailable' });
});

test('the client speaks the ingress contract end to end, cookie and all', async (t) => {
  // The handler reads the real clock (the session lookup, `putProfile`'s `now`); pin it to the session's T0.
  t.mock.timers.enable({ apis: ['Date'], now: T0 });
  const db = opened(t);
  await signIn(db);
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  let cookie = SESSION;
  const seen = [];
  globalThis.fetch = async (url, init) => {
    seen.push({ url, credentials: init.credentials, keepalive: init.keepalive });
    const headers = { ...init.headers };
    if (cookie) headers.cookie = `fd_session=${cookie}`;
    return handleProfileRequest(new Request('https://duel.example' + url, { method: 'POST', headers, body: init.body }), { DB: db });
  };
  assert.deepEqual(await pullProfile(), { ok: true, profile: null });
  const p = played(2);
  assert.deepEqual(await pushProfile(p), { ok: true, revision: p.revision });
  const pulled = await pullProfile();
  assert.equal(pulled.ok, true);
  assert.equal(pulled.profile.revision, p.revision);
  const stale = await pushProfile(played(1));
  assert.equal(stale.ok, false);
  assert.equal(stale.code, 'stale');
  assert.equal(stale.server.revision, p.revision);
  cookie = null;
  assert.deepEqual(await pullProfile(), { ok: false, code: 'sign_in_required' });
  assert.ok(seen.every((s) => s.url === '/api/profile' && s.credentials === 'include'));
  assert.ok(seen.every((s) => s.keepalive === false));
});

/* ------------------------------------------------------------------ the pusher */

test('the pusher debounces, pushes the latest copy once, replaces on stale and stays quiet when off', async (t) => {
  // The handler reads the real clock (the session lookup, `putProfile`'s `now`); pin it to the session's T0.
  t.mock.timers.enable({ apis: ['Date'], now: T0 });
  const db = opened(t);
  await signIn(db);
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    return handleProfileRequest(
      new Request('https://duel.example' + url, { method: 'POST', headers: { ...init.headers, cookie: `fd_session=${SESSION}` }, body: init.body }),
      { DB: db },
    );
  };
  let profile = played(2);
  const states = [];
  const replaced = [];
  const pusher = createProfilePusher({
    current: () => profile,
    onState: (s) => states.push(s),
    onStale: async (server) => {
      replaced.push(server.revision);
      profile = readProfile(server.state);
      profile.revision = server.revision;
    },
  });
  t.after(() => pusher.dispose());
  pusher.schedule();
  await pusher.flush();
  assert.equal(calls, 0, 'off: nothing leaves the device');
  assert.deepEqual(states, []);

  pusher.enable(true);
  assert.deepEqual(states, ['idle']);
  assert.ok(PUSH_DEBOUNCE_MS >= 1000);
  pusher.schedule();
  pusher.schedule();
  profile = played(3);
  await pusher.flush();
  assert.equal(calls, 1, 'two schedules and a flush are one push');
  assert.deepEqual(states, ['idle', 'pushing', 'idle']);
  assert.equal((await getProfile(db, ME)).revision, profile.revision);
  await pusher.flush();
  assert.equal(calls, 1, 'nothing new, nothing sent');

  // Another device moved the account further; this one is now behind.
  const theirs = played(9, 'e2');
  await putProfile(db, { principalId: ME, revision: theirs.revision, state: theirs, now: T0 + 5 });
  profile = played(4);
  await pusher.flush();
  assert.equal(calls, 2);
  assert.deepEqual(replaced, [theirs.revision]);
  assert.equal(profile.epoch, 'e2', 'the local copy was replaced by the server copy');
  assert.equal(states.at(-1), 'stale');
  await pusher.flush();
  assert.equal(calls, 2, 'the replaced copy is not pushed back');

  profile = reduceProfile(profile, { type: 'practice', epoch: 'e2', at: T0 + 99_000, fact: card(40), choice: 0, roundId: 'practice:40' });
  pusher.markPushed(0);
  await pusher.flush();
  assert.equal(calls, 3);
  assert.equal(states.at(-1), 'idle');
  assert.equal((await getProfile(db, ME)).revision, profile.revision);

  pusher.enable(false);
  assert.equal(states.at(-1), 'off');
  profile = reduceProfile(profile, { type: 'practice', epoch: 'e2', at: T0 + 100_000, fact: card(41), choice: 0, roundId: 'practice:41' });
  await pusher.flush();
  assert.equal(calls, 3);
});
