import { createOnlineClient } from './client.mjs';
const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
let storage: Storage | null = null;
try { storage = typeof window === 'undefined' ? null : window.localStorage; } catch { /* private mode */ }
export const jhkOnline = createOnlineClient({ url: env?.VITE_JHK_SERVER_URL || '', anonKey: env?.VITE_JHK_SUPABASE_ANON_KEY || '', storage });
