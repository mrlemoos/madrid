/**
 * Status payloads broadcast from the Electron main process (`nota-updates:status`).
 * Keep shapes aligned with `apps/nota-electron/src/nota-updater.ts`.
 */
export type NotaUpdateStatusPayload =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string }
  | { phase: 'not-available' }
  | { phase: 'downloading'; percent: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'error'; message: string }
  | { phase: 'unavailable'; reason: 'development' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseNotaUpdateStatusPayload(
  raw: unknown,
): NotaUpdateStatusPayload | null {
  if (!isRecord(raw)) {
    return null;
  }
  const phase = raw.phase;
  if (phase === 'idle') {
    return { phase: 'idle' };
  }
  if (phase === 'checking') {
    return { phase: 'checking' };
  }
  if (phase === 'available') {
    const version = raw.version;
    if (typeof version !== 'string' || !version.trim()) {
      return null;
    }
    return { phase: 'available', version };
  }
  if (phase === 'not-available') {
    return { phase: 'not-available' };
  }
  if (phase === 'downloading') {
    const percent = raw.percent;
    if (typeof percent !== 'number' || Number.isNaN(percent)) {
      return null;
    }
    return { phase: 'downloading', percent };
  }
  if (phase === 'downloaded') {
    const version = raw.version;
    if (typeof version !== 'string' || !version.trim()) {
      return null;
    }
    return { phase: 'downloaded', version };
  }
  if (phase === 'error') {
    const message = raw.message;
    if (typeof message !== 'string') {
      return null;
    }
    return { phase: 'error', message };
  }
  if (phase === 'unavailable') {
    if (raw.reason !== 'development') {
      return null;
    }
    return { phase: 'unavailable', reason: 'development' };
  }
  return null;
}
