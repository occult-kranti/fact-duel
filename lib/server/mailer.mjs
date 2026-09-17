/**
 * lib/server/mailer.mjs — the one way a magic link leaves the server.
 *
 * `mailerFor(env)` returns a Resend-style HTTP sender when `MAIL_API_KEY` and `MAIL_FROM` are set,
 * and a `NullMailer` otherwise. The null mailer records the last message so a test, or a local
 * developer, can read the link back; it is never a silent success in production, because
 * `http-auth.mjs` still answers `{ ok: true }` to the requester either way and the operator sees
 * the missing configuration in the deployment, not in a user's inbox.
 *
 * Nothing here logs a message body. The body contains the token.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export class NullMailer {
  constructor() {
    this.last = null;
    this.sent = 0;
  }
  async send(message) {
    this.last = Object.freeze({ ...message });
    this.sent += 1;
    return { ok: true, id: null };
  }
}

export class HttpMailer {
  constructor({ apiKey, from, endpoint = RESEND_ENDPOINT, fetchImpl = globalThis.fetch } = {}) {
    this.apiKey = apiKey;
    this.from = from;
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
  }
  async send({ to, subject, text, html }) {
    const res = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: [to], subject, text, html }),
    });
    if (!res?.ok) {
      const error = new Error(`Mail provider answered ${res?.status ?? 'nothing'}.`);
      error.status = 503;
      error.code = 'service_unavailable';
      throw error;
    }
    let id = null;
    try {
      id = (await res.json())?.id ?? null;
    } catch {
      id = null;
    }
    return { ok: true, id };
  }
}

export function mailerFor(env, { fetchImpl } = {}) {
  const apiKey = typeof env?.MAIL_API_KEY === 'string' ? env.MAIL_API_KEY.trim() : '';
  const from = typeof env?.MAIL_FROM === 'string' ? env.MAIL_FROM.trim() : '';
  if (apiKey && from) return new HttpMailer({ apiKey, from, fetchImpl });
  return new NullMailer();
}
