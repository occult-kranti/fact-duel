import { env } from 'cloudflare:workers';
import { handleStatsRequest } from '@/lib/server/http-stats.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return handleStatsRequest(request, env);
}
