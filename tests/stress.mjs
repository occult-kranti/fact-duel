import http from 'node:http';
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { dispatch, D1RoomStore } from '../lib/server/duel-service.mjs';
import { grant } from '../lib/ledger/intents.mjs';
import { LocalD1 } from './d1-local.mjs';

const cases = [2, 100, 500]; // rooms; two virtual clients per room
const results = [];
const token = () => crypto.randomUUID().replaceAll('-', '') + '1234567890abcdef';
async function bounded(items, concurrency, work) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        await work(items[index], index);
      }
    }),
  );
}
for (const count of cases) {
  const db = new LocalD1(),
    store = new D1RoomStore(db);
  let now = Date.now(),
    requests = 0,
    failures = 0;
  const latency = [];
  // Only this isolated test harness injects time; deployed API cannot accept a test clock.
  const server = http.createServer(async (req, res) => {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      // The harness carries the guest id in the body; the worker reads it from a header.
      const out = await dispatch(store, body, { now, actor: body.token || 'clock', principalId: body.principalId });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(e.status || 500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: e.message, code: e.code }));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (body) => {
    const t = performance.now();
    const response = await fetch(base, { method: 'POST', body: JSON.stringify(body) });
    const data = await response.json();
    latency.push(performance.now() - t);
    requests++;
    if (!response.ok) {
      failures++;
      throw new Error(`${response.status}: ${data.error}`);
    }
    return data.room;
  };
  const rooms = Array.from({ length: count }, () => {
    const roomId = crypto.randomUUID().replaceAll('-', ''),
      invite = token();
    const principal = () => `anon_${crypto.randomUUID().replaceAll('-', '')}`;
    return {
      host: { roomId, invite, token: token(), principalId: principal() },
      guest: { roomId, invite, token: token(), principalId: principal() },
    };
  });
  // Every seat plays for real coins on the ledger behind the store: seed 1,000 each.
  for (const r of rooms)
    for (const seat of [r.host, r.guest])
      await store.ledger.post(grant({ principalId: seat.principalId, amount: 1000, opKey: `grant:seed:${seat.principalId}`, at: 1 }));
  const cpuStart = process.cpuUsage(),
    started = performance.now();
  await bounded(rooms, 50, async (r) => {
    await call({
      ...r.host,
      action: 'create',
      name: 'Host',
      config: { mode: 'quick', stake: 25, duration: 10 },
    });
    await call({ ...r.guest, action: 'join', name: 'Guest' });
    await Promise.all([r.host, r.guest].map((c) => call({ ...c, action: 'ready' })));
  });
  now += 3000;
  await bounded(rooms, 50, async (r) => {
    const state = JSON.parse((await store.read(r.host.roomId)).state);
    r.roundId = state.round.id;
    await Promise.all([r.host, r.guest].map((c) => call({ ...c, action: 'reveal', roundId: r.roundId })));
  });
  // A burst of four independent state polls per virtual client.
  await bounded(
    rooms.flatMap((r) => Array.from({ length: 4 }, () => [r.host, r.guest]).flat()),
    100,
    (c) => call({ ...c, action: 'state' }),
  );
  now += 1300;
  await bounded(rooms, 50, async (r) => {
    const state = JSON.parse((await store.read(r.host.roomId)).state),
      choice = state.round.question.correctIndex;
    const attempts = [r.host, r.guest].map((c, i) => ({
      ...c,
      action: 'answer',
      roundId: r.roundId,
      attemptId: token(),
      choice,
      elapsedMs: i ? 1200 : 1000,
    }));
    await Promise.all(attempts.map(call));
    // Duplicate submission after both answers have been saved exercises idempotency.
    await call(attempts[0]);
    await call({ ...r.guest, action: 'state' });
  });
  const wallMs = performance.now() - started,
    cpu = process.cpuUsage(cpuStart);
  let paidOnce = 0,
    coinErrors = 0;
  for (const r of rooms) {
    const state = JSON.parse((await store.read(r.host.roomId)).state);
    if (state.events.filter((e) => e.type === 'settled').length === 1 && state.winner === 0) paidOnce++;
    if (state.balances[0] + state.balances[1] + state.escrow !== 2000) coinErrors++;
  }
  assert.equal(paidOnce, count);
  assert.equal(coinErrors, 0);
  latency.sort((a, b) => a - b);
  const p = (value) =>
    Number(latency[Math.min(latency.length - 1, Math.ceil(latency.length * value) - 1)].toFixed(2));
  results.push({
    rooms: count,
    virtualClients: count * 2,
    httpConcurrencyCap: 100,
    requests,
    failures,
    wallMs: Math.round(wallMs),
    requestsPerSecond: Number(((requests / wallMs) * 1000).toFixed(1)),
    latencyMs: { p50: p(0.5), p95: p(0.95), p99: p(0.99), max: p(1) },
    cpuMs: Math.round((cpu.user + cpu.system) / 1000),
    rssMiB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    sqlStatements: db.metrics.statements,
    nonTimedCasConflicts: db.metrics.conflicts,
    timedWriteGuardMisses: db.metrics.guardedWriteMisses,
    matchesSettledExactlyOnce: paidOnce,
    coinConservationErrors: coinErrors,
  });
  await new Promise((resolve) => server.close(resolve));
  db.close();
}
const output = {
  recordedAt: new Date().toISOString(),
  node: process.version,
  environment:
    'single-process localhost HTTP + in-memory SQLite D1 interface; same core dispatch and migration as app',
  caveats: [
    'Not Cloudflare D1/Workers load',
    'Not persistent browser concurrency or WAN capacity',
    'Virtual clock advances countdown and response phases',
    'No browser rendering, identity gateway, mobile radios, or adversarial internet traffic',
    'RPS includes setup, polling, answer and retry requests',
  ],
  results,
};
const path = process.argv[2] || '/tmp/fact-duel-stress.json';
writeFileSync(path, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
