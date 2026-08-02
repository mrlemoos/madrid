// TODO(modularize): de-dupe with apps/nota/src/lib/vite-env.ts. Each web package currently
// reads `import.meta.env` locally (see packages/data-source/src/lib/vite-env.ts); fold these
// into one shared web env helper when a home for it exists.

/** Typed read of Vite `import.meta.env` string vars (avoids unsafe `any` from ImportMeta). */
export function viteEnvString(key: string): string | undefined {
  const raw: unknown = (import.meta.env as Record<string, unknown>)[key];
  return typeof raw === 'string' ? raw : undefined;
}

/** Trimmed `NEXT_PUBLIC_NOTA_SERVER_API_URL` without a trailing slash, or `undefined` when unset. */
export function notaServerBaseUrl(): string | undefined {
  const base = viteEnvString('NEXT_PUBLIC_NOTA_SERVER_API_URL')?.trim();
  return base ? base.replace(/\/$/, '') : undefined;
}
