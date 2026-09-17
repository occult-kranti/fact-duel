/**
 * lib/server/http-queue.mjs — the matchmaking ingress (`/api/queue`).
 *
 * Same edge as `http-wallet.mjs` and `http-profile.mjs`: same headers, same cross-origin refusal,
 * same 4 KiB cap, same `{ error, code }` envelope, same 503 on anything unexpected and on a worker
 * without a database. Three actions: `enqueue { sport, mode, stake, rating }`, `poll { ticket,
 * name }`, `leave { ticket }` — see lib/server/matchmaking.mjs for what each answers.
 *
 * Who is asking is `resolvePrincipal`'s answer with the session lookup wired in: a session cookie
 * or the guest header this device minted. Anonymous — neither — is 401 `sign_in_required`, because
 * a queue row needs a principal to be paired to and a room needs one to charge an entry to.
 *
 * The room the poller creates goes through `dispatch()` in duel-service with the same context the
 * duel ingress uses (`principalId`, an admission actor, the database clock), so every rule the
 * room service enforces — entries, rate limits, the free-bot rule — applies to a matched room too.
 */
import { resolvePrincipal } from './principal.mjs';
import { sessionLookupFor } from './auth-service.mjs';
import { D1RoomStore, hash } from './duel-service.mjs';
import { GameError } from './room-engine.mjs';
import { enqueue, leave, poll } from './matchmaking.mjs';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
const MAX_BODY = 4096;
const UNAVAILABLE = 'The matchmaking service is unavailable.';
const fail = (error, status, code) => new Response(JSON.stringify({ error, code }), { status, headers });
const ok = (value) => new Response(JSON.stringify(value), { headers });

export async function handleQueueRequest(request, env) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin)
      return fail('Cross-origin requests are not allowed.', 403, 'forbidden');
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return fail('JSON request required.', 415, 'invalid_request');
    const reader = request.body?.getReader();
    let raw = '',
      size = 0;
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY) {
          await reader.cancel();
          break;
        }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    }
    if (size > MAX_BODY) return fail('Request too large.', 413, 'invalid_request');
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail('Invalid JSON.', 400, 'invalid_request');
    }
    if (!env?.DB) return fail(UNAVAILABLE, 503, 'service_unavailable');
    const action = body?.action;
    if (!['enqueue', 'poll', 'leave'].includes(action)) return fail('Unknown action.', 400, 'invalid_request');
    const who = await resolvePrincipal(request, { sessionLookup: sessionLookupFor(env.DB) });
    if (!who.principalId) return fail('Sign in or open your wallet to find a rival.', 401, 'sign_in_required');
    const principalId = who.principalId;
    const now = Date.now();
    if (action === 'enqueue')
      return ok(
        await enqueue(env.DB, {
          principalId,
          sport: body.sport,
          mode: body.mode,
          stake: body.stake,
          rating: body.rating,
          now,
        }),
      );
    if (action === 'leave') return ok(await leave(env.DB, { principalId, ticket: body.ticket }));
    return ok(
      await poll(
        env.DB,
        { principalId, ticket: body.ticket, name: body.name, now },
        {
          store: new D1RoomStore(env.DB),
          actor: await hash(request.headers.get('cf-connecting-ip') || principalId),
          useDatabaseClock: true,
        },
      ),
    );
  } catch (error) {
    if (error instanceof GameError) return fail(error.message, error.status ?? 400, error.code ?? 'invalid_request');
    return fail(UNAVAILABLE, 503, 'service_unavailable');
  }
}
