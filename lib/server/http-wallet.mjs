/**
 * lib/server/http-wallet.mjs — the guest wallet ingress.
 *
 * Same edge as `http-handler.mjs` and `http-ops.mjs`: same headers, same cross-origin refusal,
 * same 4 KiB cap, same `{ error, code }` envelope, same 503 on anything unexpected. No bearer
 * token: the caller is a guest, identified only by the id its device minted, and the service is
 * built so that is enough (a stolen guest id can spend that guest's coins and nothing else).
 *
 * The region is the edge's word, never the body's: `request.cf.country` on Workers, the
 * `cf-ipcountry` header behind it, `*` when neither is there. A client that could name its own
 * region could name the one with the highest reward.
 */
import { D1WalletStore, issueAdNonce, readWallet, redeemAdNonce, readRegion, grantDaily, applyFloor, enterPractice, enterRecap } from './wallet-service.mjs';
import { GameError } from './room-engine.mjs';
import { resolvePrincipal } from './principal.mjs';
import { sessionLookupFor } from './auth-service.mjs';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
const MAX_BODY = 4096;
const UNAVAILABLE = 'The wallet service is unavailable.';
const fail = (error, status, code) => new Response(JSON.stringify({ error, code }), { status, headers });

export function regionOf(request) {
  return readRegion(request?.cf?.country ?? request.headers.get('cf-ipcountry') ?? '*');
}

export async function handleWalletRequest(request, env) {
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
    const store = new D1WalletStore(env.DB);
    const now = Date.now();
    // Who is asking: the session cookie names a signed-in principal and wins; otherwise the guest
    // header; the body's `principalId` is accepted only when neither is present (older clients).
    const who = await resolvePrincipal(request, { sessionLookup: sessionLookupFor(env.DB) });
    const common = {
      store,
      principalId: who.principalId ?? body?.principalId,
      now,
      tzOffsetMinutes: body?.tzOffsetMinutes,
    };
    const action = body?.action;
    if (action === 'wallet') return new Response(JSON.stringify(await readWallet({ ...common, region: regionOf(request) })), { headers });
    if (action === 'grant-daily') return new Response(JSON.stringify(await grantDaily(common)), { headers });
    if (action === 'apply-floor') return new Response(JSON.stringify(await applyFloor(common)), { headers });
    if (action === 'enter-practice')
      return new Response(JSON.stringify(await enterPractice({ ...common, sessionId: body?.sessionId })), { headers });
    if (action === 'enter-recap') return new Response(JSON.stringify(await enterRecap(common)), { headers });
    if (action === 'issue-nonce')
      return new Response(
        JSON.stringify(await issueAdNonce({ ...common, placement: body?.placement, region: regionOf(request) })),
        { headers },
      );
    if (action === 'redeem-nonce')
      return new Response(
        JSON.stringify(await redeemAdNonce({ ...common, placement: body?.placement, nonceId: body?.nonceId })),
        { headers },
      );
    return fail('Unknown action.', 400, 'invalid_request');
  } catch (error) {
    if (error instanceof GameError) return fail(error.message, error.status ?? 400, error.code ?? 'invalid_request');
    return fail(UNAVAILABLE, 503, 'service_unavailable');
  }
}
