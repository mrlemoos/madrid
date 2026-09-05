# 015 — Extract shared popup motion class

- **Status**: DONE
- **Commit**: 08ed1fa
- **Severity**: LOW
- **Category**: Cohesion & tokens (missed opportunity #4)
- **Estimated scope**: 7 files, ~60 lines changed

## Problem

Four Base UI popup surfaces duplicate the same three-line Tailwind motion block. The strings are copy-pasted verbatim (or nearly so) across `@getmadrid/design` primitives and two app/editor call sites. Any timing, easing, or scale tweak must be edited in four places, which invites drift.

**Duplicate inventory (commit `08ed1fa`):**

| Location                                                         | Lines   | Motion block identical?             | Extra non-motion classes on same `cn()`            |
| ---------------------------------------------------------------- | ------- | ----------------------------------- | -------------------------------------------------- |
| `packages/design/src/components/hover-card.tsx`                  | 31–33   | Yes, plus `outline-none` on line 31 | Surface: `z-50 w-80 … shadow-lg` (29–30)           |
| `packages/design/src/components/context-menu.tsx`                | 58–60   | Yes                                 | Surface: `z-50 min-w-48 … p-1 shadow-md` (57)      |
| `apps/nota/src/components/theme-menu.tsx`                        | 55–57   | Yes                                 | Surface: `z-50 min-w-[var(--anchor-width)] …` (54) |
| `packages/editor/src/components/tiptap/note-image-extension.tsx` | 277–279 | Yes                                 | Surface: `z-50 min-w-[10.5rem] …` (276)            |

**Shared motion block (verbatim, all four sites):**

```tsx
'origin-[var(--transform-origin)] transition-[transform,scale,opacity]',
'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
```

**Hover-card variant (line 31 only adds `outline-none` before `transition`):**

```tsx
'origin-[var(--transform-origin)] outline-none transition-[transform,scale,opacity]',
'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
```

**What is already correct (do not change behaviour):**

- `transform-origin: var(--transform-origin)` — Base UI sets `--transform-origin` on the popup so scale animates from the trigger, not centre (AUDIT.md §3).
- `scale-95` + `opacity-0` on starting/ending styles — avoids `scale(0)` (AUDIT.md §3).
- `transition-[transform,scale,opacity]` — GPU-friendly properties only (AUDIT.md §5).

**What is missing (addressed by related plan 008):**

Popups lack explicit `duration-*` and `ease-out`. `Button` already uses `duration-200 ease-out` (`packages/design/src/components/button.tsx:34`). Plan **008** adds `duration-200 ease-out` to these same four surfaces. This plan's shared constant **must include** those tokens so one import delivers both consolidation and the 008 target for these files.

**Not in scope (confirmed no duplicate):**

- `packages/design/src/components/tooltip.tsx` — `DEFAULT_NOTA_TOOLTIP_POPUP_CLASS` has surface tokens only; no `data-[starting-style]` / `data-[ending-style]` motion.
- `apps/nota/src/components/command-palette.tsx` — GSAP motion, not Base UI popup CSS.
- No other `data-[starting-style]` / `data-[ending-style]` matches in the repo at `08ed1fa`.

**Why it matters:** Cohesion finding (AUDIT.md §7). Five hand-typed copies that almost match is a consolidation finding. Low severity because motion already feels consistent; the risk is maintenance drift when plan 007 (tokens) or 008 (duration) lands.

## Target

One exported constant in `@getmadrid/design`, consumed by all four call sites:

```ts
// packages/design/src/lib/nota-popup-motion.ts — target
import { cn } from './utils.js';

/** Base UI popup enter/exit: scale from trigger, 200ms ease-out, no scale(0). */
export const NOTA_POPUP_MOTION_CLASS = cn('origin-[var(--transform-origin)] transition-[transform,scale,opacity] duration-200 ease-out', 'data-[ending-style]:scale-95 data-[ending-style]:opacity-0', 'data-[starting-style]:scale-95 data-[starting-style]:opacity-0');
```

Import path (new subpath export, matching package convention):

```ts
import { NOTA_POPUP_MOTION_CLASS } from '@getmadrid/design/popup-motion';
```

**Call-site target pattern:**

```tsx
// web-design primitives — motion constant only; surface tokens stay local
className={cn(SURFACE_TOKENS, NOTA_POPUP_MOTION_CLASS, className)}

// hover-card — keep outline-none on surface line, not in motion constant
className={cn(
  'z-50 w-80 … shadow-lg outline-none',
  NOTA_POPUP_MOTION_CLASS,
  className,
)}

// theme-menu / note-image-extension — surface + motion
className={cn('z-50 min-w-… surface tokens', NOTA_POPUP_MOTION_CLASS)}
```

**Duration / easing values (from AUDIT.md, same as plan 008):**

- Duration: `200ms` → Tailwind `duration-200` (dropdown budget 150–250 ms).
- Easing: `ease-out` (entering/exiting UI; AUDIT.md §2).

## Repo conventions to follow

- **Subpath exports only** — no package root export. Add `./popup-motion` to `packages/design/package.json` `exports` and `packages/design/vite.config.mts` `libEntries`, mirroring `./theme-color` and `./utils`.
- **`cn` for class constants** — same pattern as `DEFAULT_CONTEXT_MENU_POPUP_CLASS` in `context-menu.tsx:56–61`; motion constant uses `cn()` even when it is a fixed string today so future token splits stay merge-safe.
- **Exemplar for duration + ease-out:** `packages/design/src/components/button.tsx:34` — `duration-200 ease-out`.
- **Exemplar for popup tests:** `packages/design/src/components/hover-card.spec.tsx` — assert surface tokens on rendered popup; extend similarly for motion tokens.
- **`@getmadrid/editor` may depend on `@getmadrid/design`** — already declared in `packages/editor/package.json`; importing `@getmadrid/design/popup-motion` is allowed (`platform:web` → `platform:web`).

## TDD strategy

**Red (write first):**

1. `packages/design/src/lib/nota-popup-motion.spec.ts` — assert `NOTA_POPUP_MOTION_CLASS` contains:
   - `origin-[var(--transform-origin)]`
   - `transition-[transform,scale,opacity]`
   - `duration-200`
   - `ease-out`
   - `data-[starting-style]:scale-95`
   - `data-[ending-style]:scale-95`
2. Extend `hover-card.spec.tsx` (or add `context-menu` motion assertion) — rendered `HoverCardPopup` class string includes `duration-200` and `ease-out` after wiring constant into component.

**Green:**

1. Add `nota-popup-motion.ts` + export wiring.
2. Replace inline motion strings in four files with `NOTA_POPUP_MOTION_CLASS`.
3. Tests pass.

**Refactor:** None beyond extraction; do not rename surface `DEFAULT_*_POPUP_CLASS` constants in this plan.

## Steps

1. **Add motion module and export wiring**
   - Create `packages/design/src/lib/nota-popup-motion.ts` with `NOTA_POPUP_MOTION_CLASS` exactly as in **Target** above.
   - Add to `packages/design/package.json` `exports`:
     ```json
     "./popup-motion": {
       "@getmadrid/source": "./src/lib/nota-popup-motion.ts",
       "types": "./dist/lib/nota-popup-motion.d.ts",
       "import": "./dist/popup-motion.js",
       "default": "./dist/popup-motion.js"
     }
     ```
   - Add `'popup-motion': path.join(root, 'src/lib/nota-popup-motion.ts')` to `libEntries` in `packages/design/vite.config.mts`.

2. **Write failing spec** (`nota-popup-motion.spec.ts`) per TDD strategy **Red** section.

3. **Wire `@getmadrid/design` primitives**
   - `hover-card.tsx`: import `NOTA_POPUP_MOTION_CLASS`; replace lines 31–33 with `NOTA_POPUP_MOTION_CLASS`; keep `outline-none` on the surface line (29–30).
   - `context-menu.tsx`: import constant; replace lines 58–60 in `DEFAULT_CONTEXT_MENU_POPUP_CLASS` with `NOTA_POPUP_MOTION_CLASS`.

4. **Wire app + editor call sites**
   - `apps/nota/src/components/theme-menu.tsx`: `import { NOTA_POPUP_MOTION_CLASS } from '@getmadrid/design/popup-motion'`; replace lines 55–57 with the constant inside the existing `cn()` on `Menu.Popup` (line 53).
   - `packages/editor/src/components/tiptap/note-image-extension.tsx`: same import; replace lines 277–279 inside `Menu.Popup` `cn()` (line 275).

5. **Extend component spec** — update `hover-card.spec.tsx` (or add context-menu motion test) to assert motion tokens on popup after step 3.

6. **Run tests and build** — see Verification.

## Relationship to plan 008

- **Plan 008** (`008-popover-explicit-duration-ease.md`): adds `duration-200 ease-out` inline on the same four files.
- **This plan** subsumes 008's duration/ease change for those four files by baking `duration-200 ease-out` into `NOTA_POPUP_MOTION_CLASS`.
- **Execution order:** Run **008** first if you want two focused PRs (timing fix, then extract). Run **015** alone if you want one PR that fixes timing and deduplicates. If **008** already landed, **015** only extracts existing inline strings into the constant (do not drop `duration-200 ease-out`).
- **Plan 007** (motion easing tokens): optional future step — replace Tailwind `ease-out` with `ease-[var(--ease-out)]` once `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` exists. Out of scope here; note in constant JSDoc if helpful.

## Boundaries

- Do NOT change popup **surface** tokens (border, shadow, width, padding) — motion constant only.
- Do NOT add motion to `TooltipPopup` (no Base UI starting/ending styles today).
- Do NOT touch `command-palette.tsx`, `notes-shell.tsx`, or GSAP paths.
- Do NOT add new dependencies.
- Do NOT change `scale-95`, transform-origin variable name, or transition property list.
- If inline strings at a call site differ from the excerpts above (drift since `08ed1fa`), STOP and report; do not improvise.
- If plan **008** is in flight on the same branch, coordinate so you do not revert its `duration-200 ease-out` additions.

## Verification

- **Mechanical:**

  ```bash
  pnpm exec nx run @getmadrid/design:test --outputStyle=static
  pnpm exec nx run @getmadrid/design:build --outputStyle=static
  pnpm exec nx run @getmadrid/editor:test --outputStyle=static
  pnpm exec nx lint @getmadrid/nota --outputStyle=static
  ```

  All commands exit 0.

- **Grep sanity (no stray duplicates):**

  ```bash
  rg "data-\[starting-style\]:scale-95" --glob '*.{tsx,ts}' packages apps
  ```

  Expect matches only in `nota-popup-motion.ts` (definition) — not in `hover-card.tsx`, `context-menu.tsx`, `theme-menu.tsx`, or `note-image-extension.tsx`.

- **Feel check:** Run `pnpm exec nx dev @getmadrid/nota`, then:
  1. **Theme menu** (Settings footer) — open/close; popup scales from trigger corner, ~200 ms, not sluggish tail.
  2. **Sidebar context menu** — right-click a note; same motion character as theme menu.
  3. **Hover card** — open a link preview hover card in a note; same scale-from-anchor behaviour.
  4. **Image align menu** — insert an image, open align dropdown in image chrome; same motion.
  5. DevTools → Animations → 10% playback; confirm scale starts at trigger edge (`transform-origin` non-centre on positioned popups).
  6. Rendering → `prefers-reduced-motion: reduce` → popups still open/close functionally (Base UI may shorten; no new regressions).

- **Done when:** All four surfaces import `NOTA_POPUP_MOTION_CLASS`; grep shows a single motion definition; tests green; popups feel unchanged or slightly snappier (from explicit `duration-200 ease-out` if 008 was not yet applied).
