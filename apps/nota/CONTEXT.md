# Web SPA (`@nota/nota`)

Glossary for the hosted notes app (paths, vault, sharing). Implementation stays out.

## Language

**Vault**:
A user's entire set of notes, folders, and preferences (cloud + local IndexedDB copy).

**Vault load**:
The decision tree that produces the vault for a signed-in user: entitlement check → remote fetch → IndexedDB merge, with offline/error recovery.

**Entitlement**:
Server-confirmed Nota Pro subscription; gates cloud vault, uploads, and sync.

**Recovery**:
The vault-load path when the entitlement check fails (offline trust of entitled-session flag, or online load error).

**Shared Note**:
A note exposed to anonymous readers by an unguessable share token (not a separate entity from the owner's note).
_Avoid_: public note, published note, unlisted note

**Share Token**:
The secret path segment that grants read access to one Shared Note (`/s/{token}`).

**Author Display Name**:
A snapshot of the owner's public name stored on preferences and joined into the Shared Note read-model for pages and share cards.
_Avoid_: username (unless it is the fallback when no full name exists)

**Share Card**:
The Open Graph / unfurl presentation of a Shared Note (title, author, description, optional image). `og:title` is `{author} shared {title}`; the document title is `{title}–Nota`.
_Avoid_: link preview (that term is for TipTap external URL cards inside the editor)

**Notes Client Shell**:
The signed-in notes UI under `/notes/*`: a client-rendered app (vault, editor, chrome) hosted in the App Router, not server-rendered note bodies.
_Avoid_: SSR notes, server vault

**Nota API** (`nota-server`):
The separate Node service that today owns entitlement, external link Open Graph fetch, and assistive capture. Planned to move into the Next app later; stays separate through the Vite→Next cutover.
_Avoid_: treating Share Card SSR as a reason to expand Nota API
