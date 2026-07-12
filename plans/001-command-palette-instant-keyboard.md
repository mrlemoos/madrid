# 001 — Make command palette open/close instant

- **Status**: DONE
- **Commit**: 08ed1fa
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~80 lines removed

## Problem

The Cmd/Ctrl+K command palette is a keyboard-initiated surface used 100+ times per day. It currently runs GSAP enter/exit timelines on every toggle. Per AUDIT.md category 1, animations on keyboard shortcuts and command palette toggles must have **no animation. Ever.** Raycast (the reference model) has no open/close transition.

Additional audit violations in the current motion:

| Audit rule               | Current value                                  | Budget / target                                                             |
| ------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------- |
| 100+ times/day frequency | Animated enter + exit                          | No animation                                                                |
| UI duration budget       | Enter `0.4` s (400 ms), exit `0.35` s (350 ms) | UI animations stay under 300 ms                                             |
| Easing on exit           | `NOTA_MOTION_EASE_IN` (`sine.in`)              | `ease-in` on UI is always a finding; entering/exiting should use `ease-out` |

**Location:** `apps/nota/src/components/command-palette.tsx:381–463` (`handleDialogOpenChange` + `useGSAP` block).

Keyboard shortcut handler (Cmd/Ctrl+K) at `apps/nota/src/components/command-palette.tsx:474–486` calls `setOpen(true)` or `dialogActionsRef.current?.close()` — every invocation triggers the GSAP block.

Motion constants (verbatim from `apps/nota/src/lib/nota-motion.ts:7–13`):

```ts
export const NOTA_MOTION_EASE_OUT = 'sine.out';
export const NOTA_MOTION_EASE_IN = 'sine.in';
/** Calm motion band ~300–500ms :  palette, shell chrome. */
export const NOTA_PALETTE_ENTER_S = 0.4;
export const NOTA_PALETTE_EXIT_S = 0.35;
```

`handleDialogOpenChange` — current (`apps/nota/src/components/command-palette.tsx:381–396`):

```ts
const handleDialogOpenChange = useCallback(
  (next: boolean, eventDetails: DialogRoot.ChangeEventDetails): void => {
    if (next) {
      setOpen(true);
      return;
    }
    if (prefersReducedMotion) {
      setOpen(false);
      return;
    }
    // Keep the portal mounted until GSAP finishes; then call `unmount()` on the dialog actions ref.
    eventDetails.preventUnmountOnClose();
    setOpen(false);
  },
  [prefersReducedMotion],
);
```

`useGSAP` enter path — current (`apps/nota/src/components/command-palette.tsx:398–434`):

```ts
useGSAP(
  () => {
    const backdrop = backdropRef.current;
    const panel = popupMotionRef.current;
    if (!backdrop || !panel) {
      return;
    }

    if (prefersReducedMotion) {
      if (open) {
        gsap.set([backdrop, panel], { clearProps: 'all' });
      }
      return;
    }

    if (open) {
      gsap.set(backdrop, { autoAlpha: 0 });
      gsap.set(panel, { autoAlpha: 0, scale: 0.98, y: -4 });
      gsap
        .timeline()
        .to(backdrop, {
          autoAlpha: 1,
          duration: NOTA_PALETTE_ENTER_S,
          ease: NOTA_MOTION_EASE_OUT,
        })
        .to(
          panel,
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: NOTA_PALETTE_ENTER_S,
            ease: NOTA_MOTION_EASE_OUT,
          },
          0,
        );
      return;
    }
```

`useGSAP` exit path — current (`apps/nota/src/components/command-palette.tsx:437–462`):

```ts
    const tl = gsap.timeline({
      onComplete: () => {
        dialogActionsRef.current?.unmount();
      },
    });
    tl.to(panel, {
      autoAlpha: 0,
      scale: 0.98,
      y: -4,
      duration: NOTA_PALETTE_EXIT_S,
      ease: NOTA_MOTION_EASE_IN,
    }).to(
      backdrop,
      {
        autoAlpha: 0,
        duration: NOTA_PALETTE_EXIT_S,
        ease: NOTA_MOTION_EASE_IN,
      },
      0,
    );

    return () => {
      tl.kill();
    };
  },
  { dependencies: [open, prefersReducedMotion] },
);
```

**Test tension:** `apps/nota/src/lib/nota-motion.spec.ts:17–27` deliberately asserts palette timings live in a slow band (`0.3–0.55` s) alongside sidebar motion. That test encodes the _old_ product intent (“calm motion band ~300–500ms : palette, shell chrome” in `nota-motion.ts:11`). Removing palette animation requires updating this spec in the same change — do not leave the slow-band test including `NOTA_PALETTE_ENTER_S` / `NOTA_PALETTE_EXIT_S`.

## Target

Command palette open and close are **instant** for all users (not only `prefers-reduced-motion`). No GSAP timelines, no staged opacity/scale/y transforms, no `preventUnmountOnClose`, no deferred `unmount()`.

**Behaviour:**

- Cmd/Ctrl+K: palette appears immediately; Escape or Cmd/Ctrl+K again dismisses immediately.
- Base UI `Dialog.Root` `open` prop drives visibility directly; portal mounts/unmounts on the normal React cycle.
- `dialogActionsRef` remains **only** for programmatic `close()` calls (`closePalette`, keyboard handler) — not for GSAP lifecycle.
- `backdropRef` and `popupMotionRef` removed (no motion targets).
- `prefersReducedMotion` / `usePrefersReducedMotion` removed from `command-palette.tsx` (instant default makes the branch redundant).

**Target `handleDialogOpenChange`:**

```ts
const handleDialogOpenChange = useCallback((next: boolean): void => {
  setOpen(next);
}, []);
```

(If Base UI's `onOpenChange` signature requires `eventDetails`, accept it but do not call `preventUnmountOnClose`.)

**Target motion:** no `useGSAP` hook in `command-palette.tsx`. Remove imports of `gsap`, `useGSAP`, `NOTA_MOTION_EASE_IN`, `NOTA_MOTION_EASE_OUT`, `NOTA_PALETTE_ENTER_S`, `NOTA_PALETTE_EXIT_S`, `usePrefersReducedMotion`.

**Target `nota-motion.ts`:** delete `NOTA_PALETTE_ENTER_S` and `NOTA_PALETTE_EXIT_S` exports and update the comment on line 11 to reference shell chrome only (sidebar), not palette.

**Target `nota-motion.spec.ts`:** update slow-band test to include only `NOTA_SIDEBAR_S` (palette constants removed from the array). Optionally add a one-line comment in the describe block that command palette is intentionally instant per high-frequency keyboard rule.

## Repo conventions to follow

- **Motion tokens:** shared durations and easings live in `apps/nota/src/lib/nota-motion.ts`; GSAP re-exported from the same module. Sidebar animation in `apps/nota/src/components/notes-shell.tsx:221–249` is the exemplar for _retained_ GSAP motion — it uses `usePrefersReducedMotion`, `NOTA_SIDEBAR_S`, and `NOTA_MOTION_EASE_IN_OUT` with a reduced-motion fast path via `gsap.set`. Command palette should **not** follow that pattern; it should have no GSAP at all.
- **Reduced motion hook:** `usePrefersReducedMotion()` in `nota-motion.ts:23–42` listens to `matchMedia('(prefers-reduced-motion: reduce)')`. AUDIT.md §6: reduced motion means fewer animations, not zero — but category 1 overrides for 100+/day keyboard UI: no animation for anyone.
- **Dialog pattern:** Base UI `Dialog.Root` with `actionsRef` for imperative close — keep `actionsRef={dialogActionsRef}` and `closePalette` / keyboard `close()` paths unchanged.
- **No GSAP on editor surface:** workspace rule; palette is chrome, but instant toggle aligns with Raycast-style keyboard UX.
- **Vitest AAA:** tests in `nota-motion.spec.ts` use Arrange–Act–Assert section comments.

## Steps

1. **`apps/nota/src/components/command-palette.tsx` — simplify `handleDialogOpenChange`**
   - Replace the callback body with `setOpen(next)` only.
   - Remove `prefersReducedMotion` from the dependency array.
   - Do not call `eventDetails.preventUnmountOnClose()`.

2. **`apps/nota/src/components/command-palette.tsx` — delete the `useGSAP` block**
   - Remove the entire `useGSAP(...)` hook (lines 398–463 at commit `08ed1fa`).
   - Remove `prefersReducedMotion` state/hook usage (`const prefersReducedMotion = usePrefersReducedMotion();`).

3. **`apps/nota/src/components/command-palette.tsx` — remove motion refs**
   - Delete `backdropRef` and `popupMotionRef` declarations.
   - Remove `ref={backdropRef}` from `Dialog.Backdrop`.
   - Remove the inner `div` wrapper whose sole purpose is `ref={popupMotionRef}` — move its `className` (`rounded-lg bg-background/55 …`) onto `Dialog.Popup` or a static wrapper without a ref. Preserve existing layout classes on `Dialog.Popup` (`fixed top-[15%] …`).

4. **`apps/nota/src/components/command-palette.tsx` — clean imports**
   - Remove from `@/lib/nota-motion` import: `gsap`, `NOTA_MOTION_EASE_IN`, `NOTA_MOTION_EASE_OUT`, `NOTA_PALETTE_ENTER_S`, `NOTA_PALETTE_EXIT_S`, `useGSAP`, `usePrefersReducedMotion`.
   - If no other symbols remain from that import, delete the import line entirely.

5. **`apps/nota/src/lib/nota-motion.ts` — remove palette constants**
   - Delete `NOTA_PALETTE_ENTER_S` and `NOTA_PALETTE_EXIT_S`.
   - Change comment on the calm-motion band line to: `/** Calm motion band ~300–500ms : shell chrome. */`

6. **`apps/nota/src/lib/nota-motion.spec.ts` — resolve slow-band test tension**
   - Remove `NOTA_PALETTE_ENTER_S` and `NOTA_PALETTE_EXIT_S` from the import and from the `timings` array in the slow-band test.
   - Rename test description if needed (e.g. “keeps sidebar timing in a slow, intentional band”) so it no longer claims palette coverage.
   - Assert only `NOTA_SIDEBAR_S` in that band, or keep sidebar as the sole shell-chrome slow motion constant.

## Boundaries

- Do NOT touch `apps/nota/src/components/notes-shell.tsx` sidebar GSAP animation.
- Do NOT add replacement CSS transitions on the palette (instant means zero motion).
- Do NOT change command palette markup structure beyond removing the motion-only inner wrapper/ref.
- Do NOT change keyboard shortcut logic (`onKeyDown`, Cmd/Ctrl+K handler).
- Do NOT add new dependencies.
- Do NOT modify `command-palette.spec.tsx` unless a test fails after the change (existing specs do not assert animation).
- If file contents differ from excerpts above (drift since commit `08ed1fa`), STOP and report instead of improvising.

## Verification

- **Mechanical:**
  - `pnpm exec nx test @nota/nota --testPathPattern=nota-motion` — all tests pass; slow-band test no longer references palette constants.
  - `pnpm exec nx test @nota/nota --testPathPattern=command-palette` — existing palette behaviour tests pass.
  - `pnpm exec nx lint @nota/nota` — no unused import / ref errors.
  - `pnpm exec nx build @nota/nota` — succeeds.

- **Feel check:** run `pnpm exec nx dev @nota/nota`, sign in, open notes:
  - Press Cmd/Ctrl+K: palette and backdrop appear with **no** fade, scale, or vertical slide — input is focusable on the same frame as key release.
  - Press Cmd/Ctrl+K again (or Escape): palette vanishes immediately; no 350 ms tail.
  - Spam Cmd/Ctrl+K rapidly 10+ times: each toggle is synchronous; no animation queue, no ghost backdrop, no stuck portal.
  - In DevTools → Animations panel at 10% playback: **no** keyframes on palette open/close (contrast with sidebar toggle, which should still animate).
  - DevTools → Rendering → enable `prefers-reduced-motion: reduce`: behaviour identical to default (already instant).
  - Trigger palette via menubar move-note event (`NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT`): still opens instantly.

- **Done when:**
  - `command-palette.tsx` contains no `useGSAP`, no palette duration constants, no `preventUnmountOnClose`.
  - `NOTA_PALETTE_ENTER_S` / `NOTA_PALETTE_EXIT_S` are deleted from `nota-motion.ts`.
  - `nota-motion.spec.ts` slow-band test passes without palette constants.
  - Manual feel check confirms Raycast-style snap open/close.
