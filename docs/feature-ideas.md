# Feature Ideas for Madrid

> **Madrid’s job is to give you a steady place to write and arrange ideas, then step back.**
>
> This document collects brainstormed feature directions. Every idea must be filtered through the product’s core philosophy before being considered for implementation.

## Guiding Philosophy (Non-Negotiable Filters)

Before adding anything, ask:

- Does this **protect attention** or harvest it?
- Is this **assistive** (user-initiated, bounded, editable output) rather than **performative** (the app writing at the user or surfacing suggestions uninvited)?
- Does it respect **silence at the cursor**?
- Would this feel at home in a calm Mac app with glass, restraint, and native feel?
- Does it require translation work across all supported locales (`en-GB`, `en-CA`, `es-ES`, `pt-BR`, `fr-CA`)?
- Does it stay within the architectural constraints (platform:shared packages for anything that might go mobile, no new major frameworks)?

**Hard nos (as of 2026):**

- Generative AI writing or autocomplete inside the editor surface
- Streaks, writing goals, gamification, or guilt mechanics around daily notes
- Uninvited nudges, coach marks, or "related notes" surfaces
- Collaboration / sharing features that change the trust model or UI density
- Free tier or unpaid marketing positioning

## Current State Snapshot (2026)

### Mature & Strong

- TipTap-based rich editor (tables, task lists, Mermaid, emoji replacer, @-mentions for internal links, quiet link previews, code blocks)
- Robust internal linking + backlinks panel + interactive note graph
- Folders with tints and tree navigation in sidebar
- Powerful command palette (create, move, audio-to-note, semantic search toggle)
- Journal view (title-based date detection + calendar)
- Sophisticated offline-first audio → study notes pipeline (IDB pending jobs, drain on reconnect, block insertion, original recording preserved)
- Inline PDF and image attachments (Pro)
- Offline vault (IndexedDB) + Supabase sync for entitled users
- Optional daily note (non-gamified, long local date title via ⌘D)
- Toggleable writing activity graph (deliberately non-streaky)
- Electron desktop shell with menubar bridge, auto-updates, vibrancy, proper Mac chrome handling
- Theme system that follows macOS system appearance (including auto light/dark)

### Thinner Areas

- Search depth (palette + semantic toggle; limited full-text surfaces)
- Export / portability / data longevity
- External capture (web clipper, services, email, etc.)
- Long-note reading and navigation ergonomics
- Organization power tools beyond folders + links
- Desktop-native depth (Quick Look, Shortcuts integration, etc.)

### iPhone v1 (planned)

- Full editor parity with web (all current nodes + PDF/image attachments)
- Offline vault (expo-sqlite) + Supabase sync for entitled users
- Calm stack navigation + primary action surface
- Local full-text search only (no semantic)
- No telemetry, analytics, or crash reporting
- Deferred to v2: audio-to-note / voice capture pipeline, interactive note graph, semantic search

**Note:** All mobile work must stay within platform:shared packages only. New editor implementation required for full parity. No WebView fallback for the main editing surface.

## Idea Clusters

### 1. Deepen the Quiet / Writing Surface

These ideas most directly protect the thinking experience.

- **Focus / reading mode** — One-gesture or shortcut (e.g. ⌘⇧F) to hide sidebar + backlinks, increase text size or line length, optionally dim non-active paragraphs. Reversible with the same key. Never the default.
- **Typewriter scroll guardrails** — Make the existing "pause after manual scroll" behavior more tunable or persistent per session. Ensure background doc changes (link preview resolution, etc.) never yank the viewport when the user has deliberately scrolled away.
- **Heading outline / document map** — Floating or sidebar mini-outline showing only headings. Appears on explicit action (palette or shortcut), collapses or hides when user scrolls or starts typing. Zero auto-expansion or "smart" behavior.
- **Distraction-free paste** — When pasting rich content from outside, offer a clean version by default with a subtle, dismissible "pasted with formatting" indicator and an easy "restore original" action. No magic rewriting.
- **Block-level private annotations** — User-initiated highlights or notes attached to blocks that never leave the local device and never appear in exports unless explicitly requested. (Speculative; easy to make noisy.)

### 2. Capture & Ingestion (Assistive Only)

- **Web clipper (browser extension)** — Creates a clean note or appends to today’s note. Preserves selected text, title, and source URL. **No automatic summaries or AI rewriting.** Works offline (queues for later). Deliberate invocation only.
- **PDF / image handling upgrades** — User-initiated OCR text layer extraction from PDFs or images (result inserted as editable blocks the user can keep, edit, or discard). Improved multi-page PDF navigation and thumbnail quality inside the editor node.
- **Clipboard history surface** — Accessible via palette or shortcut. Shows recent plain-text and image clips. User picks what to insert. No background watching or suggestions.
- **Email / RSS / external service capture** — Very low-frequency, explicit forwarding addresses or feeds that create notes. High bar for implementation — must feel like a power-user escape hatch, not a primary workflow.
- **Voice capture refinements** — Better waveform and pause/resume UI during recording. Per-recording naming patterns or "study note" title suggestions (still user-confirmed). Strong offline support.

### 3. Organization & Retrieval

- **User-created smart views / saved searches** — Live in the sidebar only if the user explicitly creates and names them. No automatic "Today", "Untagged", "This Week", or engagement-based ordering. Calm, stable lists.
- **Lightweight tags** — Optional, flat, user-managed. Never auto-suggested or surfaced as a primary navigation primitive. Avoid turning the product into a taxonomy tool.
- **Explicit duplicate / merge tools** — User selects two or more notes in the palette or sidebar and triggers merge or de-dupe. Diff view before commit. No background detection.
- **Full-text search surface** — Dedicated, calm search view (separate from palette) with filters the user builds. Results are just notes; no scores, "relevance" theater, or AI summaries.
- **Inbox / pinned concept** — Could be implemented as a special folder with different default sort. Only if it solves a real repeated pain without adding chrome.

### 4. Native Mac / Desktop Excellence

- **Quick Look support** — For exported bundles or a future `.nota` single-file format. Feels native.
- **Shortcuts.app / AppleScript / URL scheme depth** — Allow automation for power users (create note in folder, append text, open today’s note) without ever surfacing these as primary features or onboarding hooks.
- **Menubar capture + mini window** — Quick note entry from the menubar icon that can optionally open a small floating window. Still requires explicit user action. Respects "hide when not in use."
- **Release notes & update polish** — In-app presentation of what changed that stays out of the way after first view. Never blocks the writing surface.
- **Better Electron vibrancy & theming** — Continue closing the gap between the web view and native Mac apps (title bar integration, traffic light positioning, context menu consistency).

### 5. Knowledge & Linking Evolution

- **Bidirectional link creation from the graph** — From the graph view, explicitly create a link in the other direction. Still requires the user to be in the graph and take action.
- **Unlinked mentions (on demand only)** — A palette command or settings-gated panel that shows notes containing plain-text mentions of the current note’s title that are not yet linked. **Never a badge, never auto-shown on open, never a source of notifications.**
- **Embed / transclusion blocks** — Ability to embed a heading or block from another note. Powerful for some users; extremely easy to overuse and create brittle, noisy documents. High implementation bar.
- **Citation-style backlinks** — Show a small context snippet from the linking note on hover or click in the backlinks panel. Still calm; no live updating "mentions" feed.

### 6. Longevity, Ownership & Portability

- **High-quality export** — Folder of Markdown files + attachments + a small metadata file (JSON or YAML). Versioned format. Preserves internal links as `[[uuid]]` or title-based wikilinks with a resolver. User can choose "include PDFs/images" or not.
- **Import from other tools** — Obsidian, Notion, Bear, Logseq, etc. Good fidelity for text, links, and attachments. **Zero automatic AI cleanup or "beautification"** of the imported content. User can run their own post-processing if desired.
- **Local backup verification** — Tools that let the user confirm their offline vault is intact and can be restored, without requiring a server round-trip.
- **Plain-text mode for a note or vault** — For users who want to live primarily in the filesystem + git. The editor becomes a viewer/editor for the underlying Markdown with minimal magic.

### 7. Careful / Risky Territory

These directions have repeatedly proven difficult to keep quiet:

- Any form of inline generative writing, "continue writing", or smart autocomplete in the editor.
- Automatic link suggestions or "you might want to link this" while typing.
- Background analysis that produces UI (badges, side panels, highlights) without explicit user request.
- Writing statistics, goals, heatmaps, or any mechanic that can be turned into self-judgment.
- Dashboard-style home screens or activity feeds.
- Collaboration, comments, or real-time presence features.

## How to Evolve This Document

- When an idea graduates to a real project, move the detailed spec into a GitHub issue or design doc and link it here.
- Mark implemented ideas with a `**Done**` note and date, or remove them if they are now obvious in the product.
- New ideas should be added with a short "why it fits" or "why it might not" note.
- Any idea that would require new user-facing strings must account for the full translation burden across all supported locales.

---

_This document exists to make future conversations faster and more consistent, not to create a backlog of obligations._
