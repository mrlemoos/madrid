# Domain glossary

- **Vault** — a user's entire set of notes, folders, and preferences (cloud + local IndexedDB copy).
- **Vault load** — the decision tree that produces the vault for a signed-in user: entitlement check → remote fetch (Supabase) → IndexedDB merge, with offline/error recovery. Implemented as the deep module [`loadVault`](src/lib/notes-vault-load.ts) behind `VaultLoadPorts`; `NotesDataProvider` is its React adapter.
- **Entitlement** — server-confirmed Nota Pro subscription (`fetchNotaProEntitled` via nota-server); gates cloud vault, uploads, and sync. Cached per-session as the entitled-session flag for offline recovery.
- **Recovery** — the vault-load path taken when the entitlement fetch fails: offline → trust the entitled-session flag and bootstrap from IndexedDB silently; online → same bootstrap but surfaced as a load error.
