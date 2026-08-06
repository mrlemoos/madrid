/**
 * Typed read of a public client env var. Reads Next.js `NEXT_PUBLIC_*` literals
 * first (statically inlined at build), then falls back to Vite `import.meta.env`
 * (dev + vitest). Only literal `process.env.NEXT_PUBLIC_*` accesses are inlined
 * by Next, so the known keys are enumerated explicitly.
 */
const NEXT_PUBLIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_NOTA_SERVER_API_URL: process.env.NEXT_PUBLIC_NOTA_SERVER_API_URL,
  NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN: process.env.NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
};

export function viteEnvString(key: string): string | undefined {
  const fromNext = NEXT_PUBLIC_ENV[key];
  if (typeof fromNext === 'string' && fromNext.length > 0) {
    return fromNext;
  }
  let fromVite: unknown;
  try {
    fromVite = (import.meta as unknown as { env?: Record<string, unknown> })
      .env?.[key];
  } catch {
    fromVite = undefined;
  }
  return typeof fromVite === 'string' ? fromVite : undefined;
}

/** Trimmed `NEXT_PUBLIC_NOTA_SERVER_API_URL` without a trailing slash, or `undefined` when unset. */
export function notaServerBaseUrl(): string | undefined {
  const base = viteEnvString('NEXT_PUBLIC_NOTA_SERVER_API_URL')?.trim();
  return base ? base.replace(/\/$/, '') : undefined;
}
