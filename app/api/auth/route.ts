import { env } from 'cloudflare:workers';
import { handleAuthRequest } from '@/lib/server/http-auth.mjs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return handleAuthRequest(request, env);
}
export function POST(request: Request) {
  return handleAuthRequest(request, env);
}
