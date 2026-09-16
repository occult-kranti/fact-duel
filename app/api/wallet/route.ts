import { env } from 'cloudflare:workers';
import { handleWalletRequest } from '@/lib/server/http-wallet.mjs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) {
  return handleWalletRequest(request, env);
}
