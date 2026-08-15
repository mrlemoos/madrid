import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * Server-side key with elevated privileges. `SUPABASE_SECRET_KEY` holds the
 * current `sb_secret_…` key; the JWT-based `service_role` key it replaces is
 * deprecated (Supabase removes it end of 2026) and is read only as a fallback so
 * existing deployments keep working until they rotate.
 */
function serviceKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function requireServiceSupabase(): SupabaseClient {
  if (cached) {
    return cached;
  }
  const url = (
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.trim();
  const key = serviceKey();
  if (!url || !key) {
    throw new Error(
      'nota-server: set SUPABASE_URL and SUPABASE_SECRET_KEY for server-side Supabase access',
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
