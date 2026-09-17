/**
 * lib/server/http-stats.mjs — the founder dashboard's ingress (`POST /api/stats`).
 *
 * WHY IT IS GATED BY `OPS_TOKEN`. The dashboard shows earnings, traffic and the ledger's issuance.
 * That is business-private and nothing else, but it is the same audience as `/api/ops` — the one
 * person who runs the deployment — so it shares the same secret rather than minting a second one
 * for someone to forget to set. The gate is the same shape too: `constantTimeEqual` imported from
 * `http-ops.mjs`, 401 on a wrong token, and 503 on an UNSET token. Absent configuration refuses
 * everything; it never falls open. Same headers, same cross-origin refusal, same body cap, same
 * `{ error, code }` envelope as the other ingresses, so this door is not the weak one.
 *
 * WHY THERE IS A CACHE. Every panel is a live call to a metered vendor API, and a dashboard left
 * open in a tab — or reloaded by someone waiting for a number to move — would hammer four of
 * them. One result per `days` value is kept in module memory for `CACHE_TTL_MS`, so the page can
 * be refreshed as often as anyone likes and the vendors see at most one call a minute. The cache
 * is per isolate and evaporates with it; that is fine, because a cold isolate serving one extra
 * call a minute is not the problem the cache exists to solve.
 *
 * Nothing here ever echoes a presented or configured secret.
 */
import { constantTimeEqual } from './http-ops.mjs';
import { STATS, clampDays, overview } from './stats-service.mjs';

export const CACHE_TTL_MS = 60_000;

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

const BEARER = 'bearer ';
const MAX_BODY = 4096;
const UNAVAILABLE = 'The stats service is unavailable.';

function presentedToken(request) {
  const header = request.headers.get('authorization') ?? '';
  return header.slice(0, BEARER.length).toLowerCase() === BEARER ? header.slice(BEARER.length).trim() : '';
}

const fail = (error, status, code) => new Response(JSON.stringify({ error, code }), { status, headers });

/** The module-level cache. A test passes its own Map so runs never see each other's entries. */
const defaultCache = new Map();

/**
 * One overview per `days`, at most once per TTL. Concurrent callers share the in-flight promise
 * rather than each starting their own fan-out, and a rejected fan-out is dropped from the cache
 * so the next caller retries instead of being served a 60-second-old failure.
 */
export async function cachedOverview({ env, days, cache = defaultCache, now = Date.now, fetchImpl, timeoutMs }) {
  const span = clampDays(days);
  const at = now();
  const hit = cache.get(span);
  if (hit && at - hit.at < CACHE_TTL_MS) return hit.promise;
  const promise = overview({ env, days: span, now, fetchImpl, timeoutMs });
  cache.set(span, { at, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache.get(span)?.promise === promise) cache.delete(span);
    throw error;
  }
}

/**
 * The handler. `deps` exists for tests: an injectable clock, fetch and cache. Production passes
 * nothing and gets the real ones.
 */
export async function handleStatsRequest(request, env, deps = {}) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin)
      return new Response(JSON.stringify({ error: 'Cross-origin requests are not allowed.' }), {
        status: 403,
        headers,
      });
    // Configuration first, and it refuses rather than defaults. See the header.
    const configured = typeof env?.OPS_TOKEN === 'string' ? env.OPS_TOKEN : '';
    if (configured.length === 0) return fail(UNAVAILABLE, 503, 'service_unavailable');
    // Then the caller — before the body is read, so an unauthenticated request costs nothing.
    if (!constantTimeEqual(presentedToken(request), configured))
      return fail('Not authorised.', 401, 'unauthorized');
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return new Response(JSON.stringify({ error: 'JSON request required.' }), { status: 415, headers });
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
    if (size > MAX_BODY)
      return new Response(JSON.stringify({ error: 'Request too large.' }), { status: 413, headers });
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON.' }), { status: 400, headers });
    }
    if (body?.action === 'overview') {
      const result = await cachedOverview({
        env,
        days: body.days,
        cache: deps.cache,
        now: deps.now,
        fetchImpl: deps.fetchImpl,
        timeoutMs: deps.timeoutMs ?? STATS.timeoutMs,
      });
      return new Response(JSON.stringify(result), { headers });
    }
    return new Response(JSON.stringify({ error: 'Unknown action.', code: 'invalid_request' }), {
      status: 400,
      headers,
    });
  } catch (error) {
    const status = error?.status || 503;
    return new Response(
      JSON.stringify({
        error: status === 503 ? 'The stats service is busy or unavailable. Retrying is safe.' : error.message,
        code: error?.code || 'service_unavailable',
      }),
      { status, headers },
    );
  }
}
