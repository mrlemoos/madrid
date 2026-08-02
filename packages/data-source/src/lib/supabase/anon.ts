import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { viteEnvString } from '../vite-env.js';

const supabaseUrl = viteEnvString('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = viteEnvString('NEXT_PUBLIC_SUPABASE_ANON_KEY');

let anonClient: SupabaseClient | null = null;

/**
 * Supabase client with the plain anon key and no Clerk session -- for the public
 * shared-note page, viewed by people without a Nota account. Untyped on purpose:
 * it only calls the `get_shared_note` RPC and subscribes to a broadcast channel,
 * neither of which needs the generated `Database` shape.
 */
export function getSupabaseAnonClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  if (!anonClient) {
    anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}
