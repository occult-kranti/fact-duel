import { env } from 'cloudflare:workers';
import { handleQueueRequest } from '@/lib/server/http-queue.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return handleQueueRequest(request, env);
}
