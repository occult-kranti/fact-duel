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
  }
}
