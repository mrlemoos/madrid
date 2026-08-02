/**
 * Base64 <-> Uint8Array for Yjs updates on the wire. The `note_yjs_updates`
 * `update` column is base64 TEXT so binary rides supabase-js/PostgREST JSON and
 * Realtime payloads without bytea encoding. Browser-only (btoa/atob).
 */

// Chunk so we never spread a huge array into String.fromCharCode (arg-count
// blow-up). Updates are small, but snapshots after compaction can be larger.
const CHUNK = 0x8000;

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
