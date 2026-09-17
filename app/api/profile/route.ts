import { env } from 'cloudflare:workers';
import { handleProfileRequest } from '@/lib/server/http-profile.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return handleProfileRequest(request, env);
}
