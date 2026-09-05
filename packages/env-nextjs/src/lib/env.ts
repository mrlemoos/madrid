interface NextJSPublicEnv {
  readonly NEXT_PUBLIC_SUPABASE_URL: string | undefined;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  readonly NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string | undefined;
  readonly NEXT_PUBLIC_POSTHOG_HOST: string | undefined;
  readonly NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: string | undefined;
  readonly NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN:
    | 'app.getmadrid.app'
    | (string & {})
    | undefined;
}

/**
 * Typed read of a public client env var. Reads Next.js `NEXT_PUBLIC_*` literals
 * first (statically inlined at build), then falls back to Vite `import.meta.env`
 * (dev + vitest). Only literal `process.env.NEXT_PUBLIC_*` accesses are inlined
 * by Next, so the known keys are enumerated explicitly.
 */
const NEXT_PUBLIC_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN: process.env.NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
} as const;

declare global {
  // ProcessEnv must remain an interface for declaration merging.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
    export interface ProcessEnv extends NextJSPublicEnv {}
  }
}

export function env(key: string): string | undefined {
  const fromNext = NEXT_PUBLIC_ENV[key as keyof typeof NEXT_PUBLIC_ENV];
  if (typeof fromNext === 'string' && fromNext.length > 0) {
    return fromNext;
  }
  let fromVite: unknown;
  try {
    fromVite = (
      import.meta as unknown as {
        env?: Record<string, unknown>;
      }
    ).env?.[key];
  } catch {
    fromVite = undefined;
  }
  return typeof fromVite === 'string' ? fromVite : undefined;
}
