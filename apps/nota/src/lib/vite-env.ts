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
