# 008 — Add explicit duration and ease-out to popup surfaces

- **Status**: DONE (subsumed by plan 015; `NOTA_POPUP_MOTION_CLASS` in `@nota/design/popup-motion`)
- **Commit**: 08ed1fa
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 6 files (~60 lines changed, 1 new lib file)

## Problem

Four popup surfaces use Base UI `@starting-style` / `@ending-style` scale+opacity entrances but specify **no** `duration-*` or `ease-*` on their `transition-[transform,scale,opacity]` class. Without an explicit duration, CSS defaults `transition-duration` to `0s`, so enter/exit timing is undefined (often instant or inconsistent across browsers) and does not match the repo's deliberate motion on `NotaButton`.

Per AUDIT.md category 2:

| Element                 | Duration budget                                |
| ----------------------- | ---------------------------------------------- |
| Dropdowns, selects      | **150–250ms**                                  |
| Entering/exiting easing | **`ease-out`** (starts fast, feels responsive) |

**Exemplar already correct:** `packages/design/src/components/button.tsx:34` — `duration-200 ease-out` on interactive surfaces.

### Affected locations (deep recon)

All instances of the shared popup motion pattern (`origin-[var(--transform-origin)]` + `transition-[transform,scale,opacity]` + `scale-95` starting/ending styles):

| File                                                             | Line(s) | Component                          | Has duration/ease? |
| ---------------------------------------------------------------- | ------- | ---------------------------------- | ------------------ |
| `packages/design/src/components/context-menu.tsx`                | 56–61   | `DEFAULT_CONTEXT_MENU_POPUP_CLASS` | **No**             |
| `packages/design/src/components/hover-card.tsx`                  | 29–34   | `DEFAULT_HOVER_CARD_POPUP_CLASS`   | **No**             |
| `apps/nota/src/components/theme-menu.tsx`                        | 52–58   | inline `Menu.Popup` className      | **No**             |
| `packages/editor/src/components/tiptap/note-image-extension.tsx` | 274–280 | inline `Menu.Popup` className      | **No**             |

**Current motion string (verbatim, identical across all four):**

```tsx
'origin-[var(--transform-origin)] transition-[transform,scale,opacity]',
'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
```

### Out of scope (confirmed by recon)

| File                                                                                     | Why excluded                                                                                                                           |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/design/src/components/tooltip.tsx`                                             | `DEFAULT_NOTA_TOOLTIP_POPUP_CLASS` has **no** enter/exit transition at all (surface tokens only). Adding motion is a separate finding. |
| `packages/editor/src/components/tiptap/note-pdf-extension.tsx`                           | `duration-300 ease-out` on PDF card hover overlays — not a popup; different element budget.                                            |
| Dialog popups (`command-palette.tsx`, `folder-*-dialog.tsx`, `release-notes-dialog.tsx`) | Modals/dialogs — covered by plan 001 or separate modal budget (200–500ms). No `starting-style`/`ending-style` scale pattern.           |
| `packages/editor/src/components/tiptap/note-link-mention-menu.tsx`                       | Fixed-position mention list with no Base UI popup motion classes.                                                                      |
| GSAP motion in `apps/nota/src/lib/nota-motion.ts`                                        | App-level imperative motion; CSS popup tokens belong in `@nota/design`.                                                                |

## Target

Every Base UI popup using the scale+opacity `@starting-style` / `@ending-style` pattern gets **`duration-200 ease-out`** — 200ms sits in the dropdown budget (150–250ms) and matches `NotaButton`.

**Shared constant** (single source of truth in `@nota/design`):

```ts
// packages/design/src/lib/popup-motion.ts
import { cn } from './utils.js';

/**
 * Enter/exit motion for Base UI popups (menu, context menu, hover card).
 * Dropdown budget: 150–250ms, ease-out (AUDIT §2).
 */
export const notaPopupMotionClass = cn('origin-[var(--transform-origin)] transition-[transform,scale,opacity] duration-200 ease-out', 'data-[ending-style]:scale-95 data-[ending-style]:opacity-0', 'data-[starting-style]:scale-95 data-[starting-style]:opacity-0');
```

**After — context-menu popup constant:**

```tsx
const DEFAULT_CONTEXT_MENU_POPUP_CLASS = cn('z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md', notaPopupMotionClass);
```

**After — hover-card popup constant:**

```tsx
const DEFAULT_HOVER_CARD_POPUP_CLASS = cn('z-50 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none', notaPopupMotionClass);
```

**After — theme-menu inline popup:**

```tsx
<Menu.Popup
  className={cn(
    'z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md',
    notaPopupMotionClass,
  )}
>
```

**After — note-image align menu popup:** same `notaPopupMotionClass` merge pattern as theme-menu.

Do **not** change `scale-95`, `transform-origin`, or the property list — motion properties only.

## Repo conventions to follow

- **Subpath imports only** for `@nota/design` — add `./popup-motion` export to `packages/design/package.json` (mirror `./utils` pattern).
- **Tailwind class composition** via `cn()` from `@nota/design/utils`.
- **Exemplar:** `packages/design/src/components/button.tsx:34` — `duration-200 ease-out` on `transition-[…]`.
- **Tests:** colocated `*.spec.tsx` under `packages/design/src/components/`; AAA sections (`// Arrange`, `// Act`, `// Assert`).
- **British spelling** in any new comments or user-facing strings (e.g. "Centre" in note-image menu is already correct — do not change).

## TDD strategy (red → green)

1. **Red** — Extend `packages/design/src/components/context-menu.spec.tsx` and `packages/design/src/components/hover-card.spec.tsx`:
   - Render popup with `defaultOpen`.
   - Assert rendered popup `className` tokens include `duration-200` and `ease-out`.
   - Run: `pnpm exec nx test @nota/design --testPathPattern="(context-menu|hover-card)"` → expect failures before implementation.

2. **Green** — Create `popup-motion.ts`, wire into `context-menu.tsx` and `hover-card.tsx`, add package export, update `theme-menu.tsx` and `note-image-extension.tsx` → tests pass.

3. **Refactor** — Confirm no duplicated motion strings remain (`rg "transition-\[transform,scale,opacity\]"` should only hit `popup-motion.ts`).

## Steps

1. **Create** `packages/design/src/lib/popup-motion.ts` with `notaPopupMotionClass` exactly as in **Target** above.

2. **Add package export** in `packages/design/package.json` `exports`:

   ```json
   "./popup-motion": {
     "@nota/source": "./src/lib/popup-motion.ts",
     "types": "./dist/lib/popup-motion.d.ts",
     "import": "./dist/popup-motion.js",
     "default": "./dist/popup-motion.js"
   }
   ```

   Ensure `tsconfig.lib.json` includes the new file (it should via `src/**` glob). Rebuild if the executor runs build: `pnpm exec nx build @nota/design`.

3. **Update** `packages/design/src/components/context-menu.tsx`:
   - `import { notaPopupMotionClass } from '../lib/popup-motion.js';`
   - Replace the three motion lines in `DEFAULT_CONTEXT_MENU_POPUP_CLASS` with `notaPopupMotionClass`.

4. **Update** `packages/design/src/components/hover-card.tsx`:
   - Same import.
   - Replace the three motion lines in `DEFAULT_HOVER_CARD_POPUP_CLASS` with `notaPopupMotionClass` (keep `outline-none` on the surface line).

5. **Update** `apps/nota/src/components/theme-menu.tsx`:
   - `import { notaPopupMotionClass } from '@nota/design/popup-motion';`
   - Replace the three inline motion class strings on `Menu.Popup` with `notaPopupMotionClass`.

6. **Update** `packages/editor/src/components/tiptap/note-image-extension.tsx`:
   - `import { notaPopupMotionClass } from '@nota/design/popup-motion';`
   - Replace the three inline motion class strings on `Menu.Popup` with `notaPopupMotionClass`.
   - Add `@nota/design` as a dependency in `packages/editor/package.json` if not already present (`workspace:*`).

7. **Add tests** (red first, then green):
   - `context-menu.spec.tsx`: new `describe('NotaContextMenuPopup (motion)')` asserting `duration-200` and `ease-out` on the popup element.
   - `hover-card.spec.tsx`: new `describe('NotaHoverCardPopup (motion)')` with the same assertions.

## Boundaries

- Do NOT touch tooltip popup styling (no motion there today).
- Do NOT change dialog/GSAP motion (`command-palette.tsx`, `nota-motion.ts`).
- Do NOT change PDF card hover transitions (`note-pdf-extension.tsx`).
- Do NOT add CSS custom properties in this plan — use Tailwind `ease-out` (same class as `NotaButton`). If plan **007** is already DONE, `ease-out` will resolve to `--ease-out` via `@theme`; no extra work needed.
- Do NOT change markup, Base UI structure, or `scale-95` values.
- Do NOT add new npm dependencies.
- If file:line drift since commit `08ed1fa`, STOP and report instead of improvising.

## Verification

- **Mechanical**:

  ```bash
  pnpm exec nx test @nota/design --testPathPattern="(context-menu|hover-card)"
  pnpm exec nx lint @nota/design
  pnpm exec nx lint @nota/nota
  pnpm exec nx lint @nota/editor
  ```

  All pass.

- **Grep sanity**:

  ```bash
  rg "transition-\[transform,scale,opacity\]" packages/design apps/nota packages/editor
  ```

  Expect exactly **one** hit: `packages/design/src/lib/popup-motion.ts`.

- **Feel check** — run `pnpm exec nx dev @nota/nota`, then:
  1. **Context menu**: right-click a note in the sidebar → menu scales from cursor anchor over ~200ms, starts fast (ease-out), not sluggish ease-in.
  2. **Theme menu**: Settings → theme dropdown → same feel as context menu.
  3. **Image align menu**: open a note with an image → align dropdown on the image chrome → same timing.
  4. **Hover card** (if wired in UI): hover a hover-card trigger → card enters with visible 200ms scale+fade.
  5. **Spam test**: rapidly open/close theme menu — animation retargets mid-flight (CSS transition interruptibility), never restarts from zero like keyframes would.
  6. **DevTools**: select popup element → Computed → `transition-duration` is `0.2s`; `transition-timing-function` is `cubic-bezier(0, 0, 0.2, 1)` (Tailwind `ease-out`).
  7. **Reduced motion**: Rendering → `prefers-reduced-motion: reduce` → popups still function; if Base UI respects reduced motion on these surfaces, confirm movement is reduced (opacity-only or instant). Do not add new reduced-motion handling in this plan unless Base UI leaves movement unguarded.

- **Done when**: all four popup surfaces use `notaPopupMotionClass`; tests assert `duration-200` and `ease-out`; grep shows a single motion source; feel check confirms crisp ~200ms dropdown entrances.
