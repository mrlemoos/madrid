# 003 — Palette exit uses ease-out, not ease-in

- **Status**: SUPERSEDED (plan 001 removed palette GSAP)
- **Commit**: 08ed1fa
- **Severity**: HIGH
- **Category**: Easing & duration (audit §2)
- **Estimated scope**: 2–3 files, ~25 lines

## Dependency on plan 001

**Read `plans/001-command-palette-instant-keyboard.md` before executing.**

| Plan 001 outcome                                                   | Action for this plan                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DONE** — palette open/close is instant (GSAP enter/exit removed) | Mark this plan **SUPERSEDED** in `plans/README.md`. No code changes.                                                                                                                                                                              |
| **TODO / not started**                                             | Execute this plan **only if** plan 001 is explicitly deferred. Fixing ease-in on a 350ms exit is correct motion craft, but the palette remains a keyboard action hit 100+/day; plan 001 (instant snap, Raycast model) is the higher-leverage fix. |
| **Partial** — enter instant, exit still animated                   | Execute exit easing fix only.                                                                                                                                                                                                                     |

If both plans run: **001 first**, then re-evaluate whether 003 is still needed.

## Problem

Command palette **exit** tweens use `NOTA_MOTION_EASE_IN` (`'sine.in'`). Per audit §2, **`ease-in` on entering or exiting UI is always a finding** — it starts slow, so the dismiss feels like it waits before moving on the exact frame the user is watching (Cmd/Ctrl+K close, Escape, backdrop click, post-command `closePalette()`).

Enter already uses `NOTA_MOTION_EASE_OUT` (`'sine.out'`). Exit incorrectly uses the inverse curve, so close feels sluggish at the start while open feels responsive — asymmetric in the wrong direction.

### Recon — motion surface

| Item                         | Location                                                      | Notes                                                                                                    |
| ---------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| GSAP exit timeline           | `apps/nota/src/components/command-palette.tsx:437-456`        | Panel + backdrop parallel tween on close                                                                 |
| Exit ease (bug)              | `command-palette.tsx:447`, `command-palette.tsx:453`          | `ease: NOTA_MOTION_EASE_IN`                                                                              |
| Enter ease (reference)       | `command-palette.tsx:421`, `command-palette.tsx:430`          | `ease: NOTA_MOTION_EASE_OUT` — correct direction, weak built-in sine                                     |
| Ease token export            | `apps/nota/src/lib/nota-motion.ts:7-9`                        | `NOTA_MOTION_EASE_IN = 'sine.in'`                                                                        |
| Durations                    | `nota-motion.ts:12-13`                                        | `NOTA_PALETTE_ENTER_S = 0.4`, `NOTA_PALETTE_EXIT_S = 0.35` (duration cap is plan 009, out of scope here) |
| Close lifecycle              | `command-palette.tsx:381-396`                                 | `preventUnmountOnClose()` keeps portal mounted until GSAP `onComplete` → `unmount()`                     |
| Reduced motion               | `command-palette.tsx:387-389`, `406-411`                      | Already instant — no GSAP when `prefersReducedMotion`                                                    |
| `NOTA_MOTION_EASE_IN` usages | Grep at commit `08ed1fa`                                      | **Only** palette exit (`command-palette.tsx:447,453`). No other consumers.                               |
| Spec tension                 | `apps/nota/src/lib/nota-motion.spec.ts:29-32`                 | Asserts `sine.in` / `sine.out` — will need update if tokens change                                       |
| Related plans                | 001 instant keyboard, 007 token unification, 009 duration cap | 007 may later replace sine.\* globally; 009 may shorten `NOTA_PALETTE_EXIT_S`                            |

### Current code (verbatim)

```typescript
/* apps/nota/src/lib/nota-motion.ts:7-9 — current */
export const NOTA_MOTION_EASE_OUT = 'sine.out';
export const NOTA_MOTION_EASE_IN = 'sine.in';
export const NOTA_MOTION_EASE_IN_OUT = 'sine.inOut';
```

```typescript
/* apps/nota/src/components/command-palette.tsx:437-456 — current exit branch */
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
```

## Target

Exit tweens use **strong ease-out** per audit §2:

```css
/* audit target — UI enter/exit */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

Mapped to GSAP for the palette exit timeline only:

```typescript
/* apps/nota/src/components/command-palette.tsx — target exit branch */
tl.to(panel, {
  autoAlpha: 0,
  scale: 0.98,
  y: -4,
  duration: NOTA_PALETTE_EXIT_S,
  ease: NOTA_MOTION_EASE_OUT_STRONG,
}).to(
  backdrop,
  {
    autoAlpha: 0,
    duration: NOTA_PALETTE_EXIT_S,
    ease: NOTA_MOTION_EASE_OUT_STRONG,
  },
  0,
);
```

```typescript
/* apps/nota/src/lib/nota-motion.ts — target (add strong ease-out token) */
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(useGSAP, CustomEase);

/** Strong UI ease-out — audit cubic-bezier(0.23, 1, 0.32, 1). */
export const NOTA_MOTION_EASE_OUT_STRONG = CustomEase.create('notaEaseOut', 'M0,0 C0.23,1 0.32,1 1,1');
```

- **Do not** change enter easing, durations, scale/y values, or `preventUnmountOnClose` behaviour in this plan.
- **Do not** delete `NOTA_MOTION_EASE_IN` unless grep confirms zero usages after the swap (expected: dead export → remove in this plan or note for plan 007).
- If `CustomEase` is unavailable at runtime, STOP and report — do not substitute `sine.out` without user approval (audit requires the specific curve, not a weak built-in).

### TDD strategy (red → green)

1. **Red** — Extend `nota-motion.spec.ts`:
   - Add test: `NOTA_MOTION_EASE_OUT_STRONG` is defined (type string from `CustomEase.create`).
   - Optionally: export a documented bezier string constant `NOTA_MOTION_EASE_OUT_CBEZ = 'cubic-bezier(0.23, 1, 0.32, 1)'` for CSS parity (plan 007); assert exact string.
   - Update or remove the test that expects `NOTA_MOTION_EASE_IN === 'sine.in'` if the export is deleted.
2. **Green** — Implement token + swap exit `ease` in `command-palette.tsx`.
3. **Refactor** — Remove unused `NOTA_MOTION_EASE_IN` import from `command-palette.tsx` and dead export from `nota-motion.ts` if unused.

## Repo conventions to follow

- Motion constants live in `apps/nota/src/lib/nota-motion.ts`; components import named exports (`command-palette.tsx:73-81`).
- GSAP is registered once in `nota-motion.ts` via `gsap.registerPlugin(useGSAP)` — add `CustomEase` to the same registration.
- CSS elsewhere uses a _different_ strong curve `cubic-bezier(0.22, 1, 0.36, 1)` (e.g. `apps/nota/styles.css:55` auth card). This plan uses the **audit** value `0.23, 1, 0.32, 1` exactly; plan 007 will consolidate.
- Exemplar for correct exit _direction_ (wrong curve): enter branch at `command-palette.tsx:418-432` already uses `NOTA_MOTION_EASE_OUT` — mirror that pattern with the strong token on exit.
- `vite.config.mts` already sets `ssr.noExternal: ['gsap', '@gsap/react']` for the app — `gsap/CustomEase` resolves from the existing `gsap` dependency (`apps/nota/package.json`).

## Steps

1. **Gate on plan 001** — Open `plans/001-command-palette-instant-keyboard.md`. If status is DONE, set this plan to SUPERSEDED and stop.

2. **`apps/nota/src/lib/nota-motion.ts`** — Import `CustomEase` from `gsap/CustomEase`. Register alongside `useGSAP`. Export:

   ```typescript
   export const NOTA_MOTION_EASE_OUT_STRONG = CustomEase.create('notaEaseOut', 'M0,0 C0.23,1 0.32,1 1,1');
   ```

   Optionally export `export const NOTA_MOTION_EASE_OUT_CBEZ = 'cubic-bezier(0.23, 1, 0.32, 1)'` as the CSS-facing documentation string (no consumers required in this plan).

3. **`apps/nota/src/lib/nota-motion.spec.ts`** — Add assertion for `NOTA_MOTION_EASE_OUT_STRONG`. Update the `uses sine eases` test: either keep `NOTA_MOTION_EASE_IN` only if still exported, or remove `NOTA_MOTION_EASE_IN` expectation when export is deleted.

4. **`apps/nota/src/components/command-palette.tsx`** — In imports, replace `NOTA_MOTION_EASE_IN` with `NOTA_MOTION_EASE_OUT_STRONG`. On lines 447 and 453, set `ease: NOTA_MOTION_EASE_OUT_STRONG`.

5. **Dead code cleanup** — If `NOTA_MOTION_EASE_IN` has zero grep hits after step 4, remove export from `nota-motion.ts` and its spec assertion. Do not change `NOTA_MOTION_EASE_IN_OUT` (still used by `notes-shell.tsx:249` sidebar width tween).

## Boundaries

- Do NOT implement plan 001 (instant palette) or plan 009 (duration cap) in this change.
- Do NOT change enter animation easing (`NOTA_MOTION_EASE_OUT` / `sine.out`) — that is plan 007 scope unless explicitly bundled.
- Do NOT touch `notes-shell.tsx`, sidebar motion, button press CSS, or popover components.
- Do NOT add new npm dependencies — `CustomEase` ships with existing `gsap` package.
- Do NOT change dialog markup, `preventUnmountOnClose`, or palette keyboard handler logic.
- If `command-palette.tsx` no longer contains a GSAP exit branch (plan 001 landed), STOP — mark superseded, do not reintroduce animation.
- If line numbers or code drift from commit `08ed1fa`, STOP and report instead of improvising.

## Verification

- **Mechanical**:

  ```bash
  pnpm exec nx run @nota/nota:test --testPathPattern=nota-motion
  pnpm exec nx run @nota/nota:lint
  ```

  Expected: all tests pass; no lint errors; `NOTA_MOTION_EASE_IN` absent from `command-palette.tsx`.

- **Feel check** — `pnpm exec nx dev @nota/nota`, signed in, notes shell:
  - Open palette (Cmd/Ctrl+K). Close with Cmd/Ctrl+K again.
  - **Pass**: dismiss starts moving immediately (fast initial velocity), then settles — not a slow “ramp up” at the start.
  - **Fail**: first ~100ms of close barely moves (ease-in signature).
  - Repeat with Escape and backdrop click — same snappy start.
  - Spam Cmd/Ctrl+K open/close rapidly — exit should retarget smoothly (GSAP timeline overwrite), not stack sluggish ease-in tails.
  - Chrome DevTools → **Animations** panel, set playback to **10%** — confirm exit velocity is highest at frame 0, decelerating toward rest (ease-out shape).
  - DevTools → **Rendering** → enable **prefers reduced motion** — palette still opens/closes instantly with no scale/y motion (unchanged path).

- **Done when**:
  - Palette exit `ease` is `NOTA_MOTION_EASE_OUT_STRONG` (audit bezier `0.23, 1, 0.32, 1`), not `sine.in`.
  - No remaining `NOTA_MOTION_EASE_IN` usage in `command-palette.tsx`.
  - Tests and lint pass.
  - Or plan is marked SUPERSEDED because plan 001 removed palette animation entirely.
