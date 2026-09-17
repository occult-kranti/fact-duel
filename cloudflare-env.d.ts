declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    /**
     * Bearer secret for /api/ops — the scheduled sweep and the money kill switch.
     * Optional here because it is genuinely absent in local development and in the static build;
     * `lib/server/http-ops.mjs` refuses every request with 503 when it is unset rather than falling
     * open, so absence is a closed door and not a bypass.
     */
    OPS_TOKEN?: string;
    /**
     * Accounts (M4, `lib/server/http-auth.mjs`). All optional: without them the door stays open for
     * guests and the actions that need them answer 503 rather than pretending.
     *  - SESSION_SECRET: reserved for signed client-side state; sessions today are random ids
     *    stored hashed, so nothing reads this yet.
     *  - GOOGLE_CLIENT_ID: the OAuth client id a Google ID token must be issued for. Unset means
     *    the `google` action is 503 and the UI shows no Google button.
     *  - MAIL_API_KEY, MAIL_FROM: the Resend-style HTTP sender for magic links
     *    (`lib/server/mailer.mjs`). Unset means links are minted but never delivered.
     *  - APP_ORIGIN: where magic links point and where the click lands (e.g. https://play.example);
     *    defaults to the request's own origin.
     */
    SESSION_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    MAIL_API_KEY?: string;
    MAIL_FROM?: string;
    APP_ORIGIN?: string;
  }
}

// stats dashboard
declare namespace Cloudflare {
  interface Env {
    /**
     * Founder dashboard sources (`/ops`, `lib/server/stats-service.mjs`). Every one is optional:
     * an unset source renders as "Not connected — set <NAME>" and never as a number. Set each
     * with `wrangler secret put <NAME>`; docs/ops-dashboard.md walks through minting them.
     */
    CF_ANALYTICS_TOKEN?: string;
    CF_ZONE_TAG?: string;
    GSC_SERVICE_ACCOUNT_JSON?: string;
    GSC_SITE_URL?: string;
    ADSENSE_REFRESH_TOKEN?: string;
    ADSENSE_CLIENT_ID?: string;
    ADSENSE_CLIENT_SECRET?: string;
    ADSENSE_ACCOUNT?: string;
  }
}
