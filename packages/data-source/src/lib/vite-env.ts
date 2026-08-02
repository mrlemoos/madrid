/** Typed read of Vite `import.meta.env` string vars (avoids unsafe `any` from ImportMeta). */
export function viteEnvString(key: string): string | undefined {
  const raw: unknown = (import.meta.env as Record<string, unknown>)[key];
  return typeof raw === 'string' ? raw : undefined;
}
