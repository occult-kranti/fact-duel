import { env } from 'cloudflare:workers';
import { handleOpsRequest } from '@/lib/server/http-ops.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return handleOpsRequest(request, env);
}
