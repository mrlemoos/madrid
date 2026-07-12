# 012 — Add lightbox enter/exit motion

- **Status**: TODO
- **Commit**: 08ed1fa
- **Severity**: LOW
- **Category**: Missed opportunities
- **Estimated scope**: 3 files, ~80 lines

## Problem

`NoteImageLightbox` teleports a full-screen overlay via `createPortal` with no enter or exit motion. When a user clicks an inline note image (`note-image-extension.tsx` → `onImagePreviewRequest` → `note-editor.tsx` state), the backdrop and image appear and disappear instantly.

This is a **rare, high-emotion moment** (viewing a photo full-screen). A brief entrance explains the spatial change; the current hard cut feels jarring compared to other overlay UI in the app.

**Trigger path**

1. `packages/editor/src/components/tiptap/note-image-extension.tsx:418–433` — click/key on inline `noteImage` calls `onImagePreviewRequest`.
2. `apps/nota/src/components/note-editor.tsx:703–717` — sets `lightboxImage` state; renders `<NoteImageLightbox open={lightboxImage !== null} … />`.

**Component behaviour today** (`apps/nota/src/components/note-image-lightbox.tsx`):

```tsx
/* apps/nota/src/components/note-image-lightbox.tsx:41–43 — instant unmount */
if (!open || !image || typeof document === 'undefined') {
  return null;
}

/* apps/nota/src/components/note-image-lightbox.tsx:45–47 — backdrop, no transition */
return createPortal(
  <div
    className="fixed inset-0 z-70 bg-background/90 backdrop-blur-md"

/* apps/nota/src/components/note-image-lightbox.tsx:93–99 — dead motion classes */
<img
  …
  className={cn(
    'max-h-full w-auto max-w-full rounded-xl object-contain shadow-2xl',
    'motion-safe:transition motion-safe:duration-300 motion-safe:ease-out',
  )}
/>
```

Issues:

1. **Enter**: portal mounts at final opacity/scale — no `@starting-style`, no `data-[starting-style]`, no mount attribute.
2. **Exit**: `return null` when `open` becomes false removes the DOM immediately — no time for an exit transition.
3. **Dead classes**: the `<img>` has `transition` utilities but no animating properties or initial values.
4. **Frequency**: occasional (image preview only) — animation budget is appropriate per audit §1.

## Target

A symmetric **200ms `ease-out`** enter and exit on backdrop + image. Image scales from **`0.97`** (not `0`) with **`opacity: 0`**. Modal is centred — **`transform-origin: center`** is correct (audit §3 exempts modals from trigger-origin).

**Easing** (from audit §2 — copy exactly):

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

**Enter / exit values**:

| Layer                                          | Enter from                           | Enter to                          | Duration | Easing                           |
| ---------------------------------------------- | ------------------------------------ | --------------------------------- | -------- | -------------------------------- |
| Backdrop (`bg-background/90 backdrop-blur-md`) | `opacity: 0`                         | `opacity: 1`                      | 200ms    | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Image wrapper                                  | `opacity: 0; transform: scale(0.97)` | `opacity: 1; transform: scale(1)` | 200ms    | same                             |
| Header (filename + Close)                      | `opacity: 0`                         | `opacity: 1`                      | 200ms    | same (fades with chrome)         |

**Reduced motion** (audit §6): drop `transform` (no scale); keep a short opacity fade so the state change is still comprehensible:

```css
@media (prefers-reduced-motion: reduce) {
  .nota-image-lightbox-image {
    transform: none;
    transition: opacity 200ms ease;
  }
  .nota-image-lightbox-backdrop {
    transition: opacity 200ms ease;
  }
}
```

**Exit timing**: defer unmount until the 200ms exit transition completes (see Steps). Use CSS **transitions** (not `@keyframes`) so rapid open→close→open retargets from current state (audit §4).

**Do not** animate `backdrop-blur`, `width`, `height`, or use `transition: all`.

## Repo conventions to follow

- **Base UI starting/ending-style pattern** — menus already pair `transition-[transform,opacity]` with `data-[starting-style]` / `data-[ending-style]`:

```tsx
/* apps/nota/src/components/theme-menu.tsx:55–57 */
'origin-[var(--transform-origin)] transition-[transform,scale,opacity]',
'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
```

The lightbox is a custom portal (not Base UI), so use the audit’s **`data-mounted` / `data-closing` fallback** instead of Base UI’s automatic attributes.

- **Reduced-motion hook** — `usePrefersReducedMotion()` in `apps/nota/src/lib/nota-motion.ts:23–42`; branch transform off when `true`.

- **CSS micro-interaction tokens** — `apps/nota/styles.css:147–158` uses explicit `transition-property`, 200ms, and a strong ease curve; mirror that discipline (list properties, no `all`).

- **Tailwind `motion-safe:`** — already on the `<img>`; prefer dedicated CSS classes in `styles.css` for `@starting-style` (not available as a Tailwind utility) and reduced-motion overrides.

- **No GSAP** on this overlay — GSAP is reserved for command palette / sidebar (`nota-motion.ts`); lightbox motion is CSS-only.

- **z-index** — keep `z-70` on the backdrop; do not lower to dialog `z-[60]` (lightbox must stay above editor chrome).

- **Tests** — AAA sections in `note-image-lightbox.spec.tsx` per `.cursor/rules/aaa-testing-pattern.mdc`.

## Steps

### 1. Add lightbox motion CSS (`apps/nota/styles.css`)

Append a block after the `.nota-pressable` section (~line 158). Use exact audit easing:

```css
/* Note image lightbox — rare full-screen preview; 200ms ease-out enter/exit */
.nota-image-lightbox-backdrop {
  transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.nota-image-lightbox-backdrop[data-mounted='false'],
.nota-image-lightbox-backdrop[data-closing='true'] {
  opacity: 0;
}

.nota-image-lightbox-chrome {
  transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.nota-image-lightbox-chrome[data-mounted='false'],
.nota-image-lightbox-chrome[data-closing='true'] {
  opacity: 0;
}

.nota-image-lightbox-image {
  transform-origin: center;
  transition:
    opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.nota-image-lightbox-image[data-mounted='false'],
.nota-image-lightbox-image[data-closing='true'] {
  opacity: 0;
  transform: scale(0.97);
}

@starting-style {
  .nota-image-lightbox-backdrop[data-mounted='true'] {
    opacity: 0;
  }
  .nota-image-lightbox-chrome[data-mounted='true'] {
    opacity: 0;
  }
  .nota-image-lightbox-image[data-mounted='true'] {
    opacity: 0;
    transform: scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nota-image-lightbox-image[data-mounted='false'],
  .nota-image-lightbox-image[data-closing='true'] {
    transform: none;
  }

  .nota-image-lightbox-backdrop,
  .nota-image-lightbox-chrome,
  .nota-image-lightbox-image {
    transition: opacity 200ms ease;
  }
}
```

### 2. Add deferred-unmount lifecycle (`apps/nota/src/components/note-image-lightbox.tsx`)

Import `usePrefersReducedMotion` from `@/lib/nota-motion` and `useState` / `useRef` / `useEffect` as needed.

Replace the early `return null` pattern with:

- `present` — `open && image !== null` (intent to show).
- `rendered` — stays `true` during exit animation after `present` becomes false.
- `closing` — `true` while exit transition runs.
- `mounted` — flips to `true` one frame after `rendered` becomes true (requestAnimationFrame or `queueMicrotask`) so `@starting-style` / attribute transitions fire on enter.

Pseudocode the executor must implement:

```tsx
const reducedMotion = usePrefersReducedMotion();
const EXIT_MS = 200;

// When present becomes true: set rendered true, closing false, then mounted true on next frame.
// When present becomes false while rendered: set closing true, mounted false; after EXIT_MS clear rendered.

if (!rendered || !image || typeof document === 'undefined') {
  return null;
}

const motionAttrs = {
  'data-mounted': mounted ? 'true' : 'false',
  'data-closing': closing ? 'true' : 'false',
  'data-reduced-motion': reducedMotion ? 'true' : 'false',
} as const;
```

Apply classes + `motionAttrs` to:

- Backdrop `div` — add `nota-image-lightbox-backdrop` (keep existing layout/ARIA/`data-testid`).
- `header` — add `nota-image-lightbox-chrome`.
- Wrap the `<img>` in a `div` with `nota-image-lightbox-image` + `motionAttrs` (wrapper carries transform so the img layout classes stay unchanged). When `data-reduced-motion='true'`, the CSS media query already drops scale; no inline transform needed.

Remove the dead classes from `<img>`:

```tsx
/* remove */
'motion-safe:transition motion-safe:duration-300 motion-safe:ease-out',
```

Keep Escape listener gated on `present` (or `open`), not `rendered`, so close still works during exit.

### 3. TDD — red/green tests (`apps/nota/src/components/note-image-lightbox.spec.tsx`)

**Red first** (write failing tests, then implement Step 2):

1. `keeps portal mounted briefly after open becomes false` — render with `open`, then `rerender` with `open={false}`; assert `note-image-lightbox-backdrop` still in document synchronously after rerender; use `vi.useFakeTimers()`, advance 200ms, assert removed.
2. `sets data-mounted on backdrop when open` — render `open`; assert backdrop has `data-mounted="true"` after `act(() => vi.runAllTimers())` or `requestAnimationFrame` flush.

**Green** — implement Step 2 until both pass. Existing three tests must still pass unchanged.

### 4. Import `styles.css` — no change needed

Lightbox styles live in the app bundle’s existing `apps/nota/styles.css` import from `main.tsx`; no new import.

## Boundaries

- Do NOT touch `note-editor.tsx`, `note-image-extension.tsx`, or TipTap editor surface.
- Do NOT migrate to `@base-ui/react/dialog` (would change semantics/markup beyond motion).
- Do NOT add GSAP or new dependencies.
- Do NOT animate `backdrop-blur`, layout properties, or `transition: all`.
- Do NOT add stagger, bounce, or duration > 300ms.
- Do NOT change close behaviour (backdrop click, Escape, Close button, Electron `pl-20` header).
- If file structure at commit `08ed1fa` differs (e.g. component renamed), STOP and report drift.

## Verification

- **Mechanical (TDD order)**:
  1. Add Step 3 failing tests → confirm red: `pnpm exec nx test @nota/nota --testPathPattern=note-image-lightbox`
  2. Implement Steps 1–2 → confirm green (all lightbox specs + no regressions).
  3. `pnpm exec nx lint @nota/nota`
  4. `pnpm exec nx test @nota/nota` (full app unit suite)

- **Feel check**: `pnpm exec nx dev @nota/nota`, open a note with an image, click the image:
  - Backdrop and image **ease in** over ~200ms; image grows from slightly smaller (97%) with fade, centred.
  - Close via Escape or backdrop — **ease out** over ~200ms; no one-frame flash.
  - Rapid click image → Escape → image again: second open does not stick at partial opacity (transitions retarget).
  - DevTools → Animations → 10% playback: single opacity + transform on image wrapper; backdrop opacity only.
  - DevTools → Rendering → `prefers-reduced-motion: reduce`: fade only, no scale movement; backdrop still fades.

- **Done when**: enter/exit motion matches Target table; reduced motion drops scale; deferred unmount tests pass; lint + test green.
