# 004 — Sidebar transform, not width tween

- **Status**: DONE
- **Commit**: 08ed1fa
- **Severity**: MEDIUM
- **Category**: Performance (audit §5)
- **Estimated scope**: 5 files, ~120 lines

## Problem

The notes shell sidebar open/close animation tweens **`width`** on the flex `<aside>`, which triggers layout, reflow, and paint on every frame. AUDIT.md §5: animate **`transform` and `opacity` only**; `width`/`height`/`margin`/`padding` trigger layout + paint + composite.

**Where it happens**

1. `apps/nota/src/components/notes-shell.tsx:245-251` — GSAP `to` spreads motion targets (including `width`) onto the aside:

```ts
// apps/nota/src/components/notes-shell.tsx:245-251 — current
gsap.to(el, {
  ...targets,
  ...widthConstraint,
  duration: NOTA_SIDEBAR_S,
  ease: NOTA_MOTION_EASE_IN_OUT,
  overwrite: 'auto',
});
```

2. `apps/nota/src/lib/nota-sidebar-shell-motion.ts:17-21` — targets include animated width:

```ts
// apps/nota/src/lib/nota-sidebar-shell-motion.ts:17-21 — current
return {
  width: open ? widthPx : 0,
  opacity: open ? 1 : 0,
  x: open || prefersReducedMotion ? 0 : -NOTA_SIDEBAR_SLIDE_PX,
};
```

3. `apps/nota/src/components/notes-shell.tsx:212-218` — a `useLayoutEffect` also sets `width`/`maxWidth` on the aside when open (correct for first paint; must remain on the **clip** element, not the animated rail).

**Aside structure today** (`notes-shell.tsx:334-478`): a single `<aside ref={asideRef}>` wraps header, scrollable `<nav>`, footer, and resize handle. All chrome classes (`notesSidebarChrome`, `overflow-hidden`, flex column) live on that same element GSAP width-tweens. There is no inner rail wrapper.

**Related constants** (`nota-motion.ts`):

- `NOTA_SIDEBAR_S = 0.45` — duration for the toggle tween
- `NOTA_SIDEBAR_SLIDE_PX = 20` — horizontal slide on close
- `NOTA_SIDEBAR_WIDTH_PX = 288` — default width

**Resize path** (`use-notes-sidebar-resize.ts:38-40, 52-55`): pointer drag sets `asideRef.current.style.width` directly during resize. That is intentional layout mutation during drag; it must stay on the outer clip, not be GSAP-tweened on toggle.

**Existing specs that encode current (width-tween) behaviour:**

- `nota-sidebar-shell-motion.spec.ts` — expects `width: 0` / `width: 320` in targets
- `notes-shell.spec.tsx:207-227` — asserts `gsap.to(aside, … { width: 0, opacity: 0 })`
- `notes-shell.spec.tsx:175-204` — asserts `aside.style.width === '288px'` on mount

**Why it matters:** Sidebar toggle is tens-of-times-per-day (shortcut, toggle button). Layout-driven width animation competes with TipTap, list scroll, and glass `backdrop-filter` on the same rail — visible jank on Electron/macOS.

## Target

**Pattern: fixed outer clip + inner rail slide.** Layout width snaps on the outer `<aside>`; only the inner rail tweens `x` + `opacity`.

### DOM shape

```tsx
// apps/nota/src/components/notes-shell.tsx — target structure
<aside
  ref={asideRef}
  className={cn(
    'relative flex h-full min-h-0 min-w-0 shrink-0 flex-col overflow-hidden',
    /* existing chrome classes stay on aside (clip) */
  )}
  aria-hidden={!open}
>
  <div
    ref={sidebarRailRef}
    className="flex h-full min-h-0 w-full min-w-0 flex-col"
    style={{ width: widthPx }} // fixed rail width; clip handles flex allocation
  >
    {/* existing header, nav, footer, FolderCreateDialog, resize handle */}
  </div>
</aside>
```

- **Outer `aside` (clip):** owns flex layout width, `overflow-hidden`, glass chrome, `aria-hidden`, resize handle positioning. Width changes via **`gsap.set` only** (instant snap), never `gsap.to` on `width`.
- **Inner rail `div`:** fixed `width: widthPx` (inline style or `gsap.set`). GSAP **`gsap.to` only targets this element** with `x` and `opacity`.

### Motion targets (replace `getNotaSidebarAsideMotionTargets`)

Split into two pure helpers in `nota-sidebar-shell-motion.ts`:

```ts
// Clip — layout, no tween
export type NotaSidebarClipLayout = {
  width: number;
  maxWidth: number | 'none';
};

export function getNotaSidebarClipLayout(params: { open: boolean; widthPx: number }): NotaSidebarClipLayout {
  return {
    width: params.open ? params.widthPx : 0,
    maxWidth: params.open ? params.widthPx : 'none',
  };
}

// Rail — compositor-friendly tween
export type NotaSidebarRailMotionTargets = {
  x: number;
  opacity: number;
};

export function getNotaSidebarRailMotionTargets(params: { open: boolean; prefersReducedMotion: boolean }): NotaSidebarRailMotionTargets {
  const { open, prefersReducedMotion } = params;
  return {
    opacity: open ? 1 : 0,
    x: open || prefersReducedMotion ? 0 : -NOTA_SIDEBAR_SLIDE_PX,
  };
}
```

Deprecate/remove `width` from animated targets. Keep `getNotaSidebarAsideMotionTargets` only if tests need a thin re-export during migration; prefer deleting it once callers move.

### Toggle sequences (`notes-shell.tsx` `useGSAP`)

Constants unchanged: `duration: NOTA_SIDEBAR_S` (0.45), `ease: NOTA_MOTION_EASE_IN_OUT` (`'sine.inOut'`), `NOTA_SIDEBAR_SLIDE_PX` (20).

**Opening (`open` false → true):**

1. `gsap.set(aside, getNotaSidebarClipLayout({ open: true, widthPx }))` — snap clip width so flex allocates space immediately.
2. `gsap.set(rail, getNotaSidebarRailMotionTargets({ open: false, prefersReducedMotion: false }))` — start off-screen/faded (skip slide when `prefersReducedMotion`).
3. `gsap.to(rail, { x: 0, opacity: 1, duration: NOTA_SIDEBAR_S, ease: NOTA_MOTION_EASE_IN_OUT, overwrite: 'auto' })`.

**Closing (`open` true → false):**

1. `gsap.to(rail, { x: prefersReducedMotion ? 0 : -NOTA_SIDEBAR_SLIDE_PX, opacity: 0, duration: NOTA_SIDEBAR_S, ease: NOTA_MOTION_EASE_IN_OUT, overwrite: 'auto', onComplete })`.
2. `onComplete`: `gsap.set(aside, getNotaSidebarClipLayout({ open: false, widthPx }))` — snap clip to `width: 0` after rail has exited.

**Reduced motion / first paint (`prefersReducedMotion` or `!sidebarMotionReadyRef.current`):**

- `gsap.set` both clip layout and rail targets instantly; no `gsap.to`.

**Interruptibility:** If `open` flips mid-close, `overwrite: 'auto'` on the rail tween plus immediate clip `gsap.set` on open (step 1 above) must retarget from current `x`/`opacity` — same GSAP pattern as today, but rail-only.

### Resize hook

`use-notes-sidebar-resize.ts` continues to set **`asideRef` width** during drag. Additionally set inner rail `style.width` to the same `next` px value (add optional `railRef` param) so content width tracks clip during resize.

## Repo conventions to follow

- **Motion tokens and GSAP entry:** `apps/nota/src/lib/nota-motion.ts` — `NOTA_SIDEBAR_S`, `NOTA_SIDEBAR_SLIDE_PX`, `useGSAP`, `usePrefersReducedMotion`, `NOTA_MOTION_EASE_IN_OUT`.
- **Pure target helpers:** `apps/nota/src/lib/nota-sidebar-shell-motion.ts` — keep toggle math testable without React (same pattern as today).
- **Exemplar for reduced-motion branching:** `notes-shell.tsx:239-242` — instant `gsap.set` when `prefersReducedMotion || !sidebarMotionReadyRef.current`.
- **Unit tests:** AAA sections with `// Arrange|Act|Assert` per `.cursor/rules/aaa-testing-pattern.mdc`.
- **Run tests via Nx:** `pnpm exec nx run @nota/nota:test --testPathPattern=…`.

## Steps

### TDD — red/green order

Write failing tests first, then implement until green.

1. **Red** — `nota-sidebar-shell-motion.spec.ts`: add examples for `getNotaSidebarClipLayout` (open → `width: 320`, closed → `width: 0`) and `getNotaSidebarRailMotionTargets` (no `width` key; closed → `x: -NOTA_SIDEBAR_SLIDE_PX`, `opacity: 0`; reduced motion → `x: 0`). Keep or update old `getNotaSidebarAsideMotionTargets` tests only if the function remains.
2. **Red** — `notes-shell.spec.tsx`: change `keeps the sidebar mounted and tweens closed` to assert `gsap.to` is called on the **inner rail** (query `aside > div` or `data-nota-sidebar-rail`) with `expect.objectContaining({ opacity: 0, x: expect.any(Number) })` and **`width` absent**. Assert `gsap.to` is **not** called with `width` on the aside.
3. **Green** — implement helpers in `nota-sidebar-shell-motion.ts` (step 4 below).
4. **Green** — `nota-sidebar-shell-motion.ts`: add `getNotaSidebarClipLayout` and `getNotaSidebarRailMotionTargets`; remove `width` from rail targets.
5. **`notes-shell.tsx`:** add `sidebarRailRef`, wrap existing aside children in `<div ref={sidebarRailRef} data-nota-sidebar-rail …>` with `style={{ width: widthPx }}`.
6. **`notes-shell.tsx`:** replace `useGSAP` body (lines 221-254) with clip `gsap.set` + rail `gsap.to` sequences above; point `useLayoutEffect` (212-218) at clip width only; add `railRef` to resize hook call.
7. **`use-notes-sidebar-resize.ts`:** accept optional `railRef`; when setting `el.style.width` during drag, mirror to `railRef.current.style.width`.
8. **Green** — run unit tests; fix mount tests (`aside.style.width === '288px'`) — clip should still show 288px when open.
9. **Optional integration assertion:** in `notes-shell.spec.tsx`, mock `gsap.to` `onComplete` and verify clip snaps to `width: 0` after close tween (if mock supports it).

### Implementation detail — `useGSAP` pseudocode

```ts
const clip = asideRef.current;
const rail = sidebarRailRef.current;
if (!clip || !rail) return;

const clipLayout = getNotaSidebarClipLayout({ open, widthPx: sidebarWidthPxRef.current });
const railTargets = getNotaSidebarRailMotionTargets({ open, prefersReducedMotion });

if (prefersReducedMotion || !sidebarMotionReadyRef.current) {
  sidebarMotionReadyRef.current = true;
  gsap.set(clip, clipLayout);
  gsap.set(rail, railTargets);
  return;
}

if (open) {
  gsap.set(clip, clipLayout);
  gsap.set(rail, getNotaSidebarRailMotionTargets({ open: false, prefersReducedMotion }));
  gsap.to(rail, {
    x: 0,
    opacity: 1,
    duration: NOTA_SIDEBAR_S,
    ease: NOTA_MOTION_EASE_IN_OUT,
    overwrite: 'auto',
  });
  return;
}

gsap.to(rail, {
  ...getNotaSidebarRailMotionTargets({ open: false, prefersReducedMotion }),
  duration: NOTA_SIDEBAR_S,
  ease: NOTA_MOTION_EASE_IN_OUT,
  overwrite: 'auto',
  onComplete: () => {
    gsap.set(clip, getNotaSidebarClipLayout({ open: false, widthPx: sidebarWidthPxRef.current }));
  },
});
```

## Boundaries

- Do NOT change `NOTA_SIDEBAR_S` (0.45) or easing in this plan — duration budget is a separate finding.
- Do NOT touch command palette, TipTap, folder tree, or sidebar list item motion.
- Do NOT add dependencies (stay on GSAP already in `nota-motion.ts`).
- Do NOT remove resize behaviour or persisted `widthPx` from `notes-sidebar` store.
- Markup change is limited to **one inner wrapper** around existing aside children; do not restructure nav/footer semantics.
- Glass chrome classes (`notesSidebarChrome`) stay on the clip `aside`; do not move `backdrop-filter` to a zero-width element during close (clip width snaps only after rail fade completes).
- If aside/rail structure at commit `08ed1fa` has drifted, STOP and report — do not improvise a different animation model.

## Verification

- **Mechanical:**
  - `pnpm exec nx run @nota/nota:test --testPathPattern="nota-sidebar-shell-motion|notes-shell"`
  - `pnpm exec nx run @nota/nota:lint`
  - All tests pass; no new lint errors.

- **Feel check:** run `pnpm exec nx dev @nota/nota`, open `#/notes`:
  - Toggle sidebar closed (button and ⌘\ shortcut if bound): rail content slides left ~20px and fades; main panel does not stutter mid-animation; after motion completes, clip collapses.
  - Toggle open: clip width appears immediately; rail slides/fades in.
  - Spam toggle during animation: motion retargets smoothly, no width tween on aside in DevTools Performance panel (no repeated Layout events from aside width).
  - Resize sidebar while open: drag still works; rail and clip widths stay aligned.
  - DevTools → Animations at 10% speed: confirm only inner rail `transform`/`opacity` animate; aside `width` jumps only at open start or close `onComplete`.
  - Rendering → `prefers-reduced-motion: reduce`: no horizontal slide (`x` stays 0); opacity snap/tween only; clip still snaps width.

- **Done when:**
  - No `gsap.to` call includes `width` on any element.
  - `getNotaSidebarRailMotionTargets` returns only `x` and `opacity`.
  - Existing sidebar width-on-mount and close-mount tests pass (updated assertions).
  - Manual feel check confirms no layout thrash on toggle.
