import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@getmadrid/database-types';

import { env } from '@getmadrid/env-nextjs';

const supabaseUrl = env('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = env('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export type TypedSupabaseBrowserClient = SupabaseClient<Database>;

let clerkGetToken: (() => Promise<string | null>) | null = null;

/**
 * Called from `ClerkSupabaseBridge` so every Supabase request sends the current Clerk session JWT.
 */
export function isSupabaseClerkGetTokenRegistered(): boolean {
  return clerkGetToken !== null;
}

export function setSupabaseClerkGetToken(
  fn: (() => Promise<string | null>) | null,
): void {
  clerkGetToken = fn;
  browserClient = null;
}

let browserClient: TypedSupabaseBrowserClient | null = null;

export function getSupabaseBrowserClient(): TypedSupabaseBrowserClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  if (!clerkGetToken) {
    throw new Error(
      'Supabase client is not wired to Clerk yet (ClerkSupabaseBridge missing?)',
    );
  }
  if (!browserClient) {
    const getToken = clerkGetToken;
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      accessToken: () => getToken(),
    });
  }
  return browserClient;
}

/** Singleton for client components (invalidated when Clerk session changes). */
export function getBrowserClient(): TypedSupabaseBrowserClient {
  return getSupabaseBrowserClient();
}
