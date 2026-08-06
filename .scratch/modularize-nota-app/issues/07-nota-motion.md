# 07 — Extract `nota-motion` core + ui

**What to build:** A `nota-motion-core` (`platform:shared`) lib with the pure motion math —
critically-damped spring, interaction curves, motion contract, rubberband, sidebar
resize-settle, typewriter-scroll-guard, sidebar width — plus a `nota-motion-ui`
(`platform:web`) lib with the GSAP/DOM bindings (nota-motion, panel motion) and the sidebar
motion/resize hooks and resize handle. All micro-interactions behave exactly as before.

**Blocked by:** 02 — `@nota/note-runtime`.

**Status:** done

- [x] Two buildable libs; core `platform:shared` (no DOM/GSAP), ui `platform:web`
- [x] Motion contract (keyboard = instant, pointer = short motion) preserved; no motion on the TipTap surface
- [x] Characterization tests added for untested pure motion modules (spring, rubberband, interaction, scroll-guard, sidebar-width) before the move; existing motion specs travel with them
- [x] Sidebar resize/rubber-band, panel fades, typewriter scroll behave unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

- Finished after Claude session-limit mid-import-rewire.
- Exports point at `src` (emitDeclarationOnly build); match other modularize pkgs.
- `notes-sidebar-resize-handle` lives in ui; journal calendar uses shared `use-prefers-reduced-motion`.
