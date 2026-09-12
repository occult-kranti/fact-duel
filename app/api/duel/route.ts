import { env } from 'cloudflare:workers';
import { handleDuelRequest } from '@/lib/server/http-handler.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return handleDuelRequest(request, env);
}
