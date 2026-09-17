/**
 * lib/server/http-profile.mjs — the profile sync ingress.
 *
 * Same edge as `http-wallet.mjs`: same headers, same cross-origin refusal, same `{ error, code }`
 * envelope, same 503 on anything unexpected. The one difference is the body cap: a profile is the
 * whole reducer state, so the limit is `PROFILE.maxBytes` plus room for the envelope around it,
 * not the 4 KiB the money ingresses allow.
 *
 * Who is asking comes from `resolvePrincipal` with the session lookup wired in, and only a session
 * gets past `requireSession`. A guest header alone is answered 401 `sign_in_required`, which the
 * client treats as "keep the profile on this device" rather than as a failure.
 */
import { resolvePrincipal } from './principal.mjs';
import { sessionLookupFor } from './auth-service.mjs';
import { GameError, PROFILE, getProfile, putProfile, requireSession } from './profile-service.mjs';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
/** The profile itself, plus the `{ action, revision, state }` envelope around it. */
const MAX_BODY = PROFILE.maxBytes + 4096;
const UNAVAILABLE = 'The profile service is unavailable.';
const fail = (error, status, code) => new Response(JSON.stringify({ error, code }), { status, headers });

export async function handleProfileRequest(request, env) {
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
    if (size > MAX_BODY) return fail('Profile too large.', 413, 'too_large');
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail('Invalid JSON.', 400, 'invalid_request');
    }
    if (!env?.DB) return fail(UNAVAILABLE, 503, 'service_unavailable');
    const principal = await resolvePrincipal(request, { sessionLookup: sessionLookupFor(env.DB) });
    const action = body?.action;
    if (action !== 'get' && action !== 'put') return fail('Unknown action.', 400, 'invalid_request');
    const principalId = requireSession(principal);
    if (action === 'get') {
      const profile = await getProfile(env.DB, principalId);
      return new Response(
        JSON.stringify({ ok: true, profile: profile ? { revision: profile.revision, state: profile.state } : null }),
        { headers },
      );
    }
    const result = await putProfile(env.DB, {
      principalId,
      revision: body?.revision,
      state: body?.state,
      now: Date.now(),
    });
    return new Response(JSON.stringify(result), { headers });
  } catch (error) {
    if (error instanceof GameError) return fail(error.message, error.status ?? 400, error.code ?? 'invalid_request');
    return fail(UNAVAILABLE, 503, 'service_unavailable');
  }
}
