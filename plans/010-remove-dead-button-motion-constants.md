# 010 — Remove dead button motion constants

- **Status**: TODO
- **Commit**: 08ed1fa
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 2 files, ~15 lines removed

## Problem

`NOTA_BUTTON_PRESS_S` and `NOTA_BUTTON_RELEASE_S` are exported from the GSAP motion token module but never consumed by runtime code. They create a false impression that button press timing is centralised in `nota-motion.ts`, when button feedback is actually implemented in CSS on `NotaButton` and `.nota-pressable`.

**Grep confirmation (commit `08ed1fa`):** both symbols appear in exactly two files — definition and a spec that only asserts the constants exist. Zero imports in components, hooks, GSAP tweens, or styles.

| Symbol                  | Files                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `NOTA_BUTTON_PRESS_S`   | `apps/nota/src/lib/nota-motion.ts:20`, `apps/nota/src/lib/nota-motion.spec.ts:3,41-42` |
| `NOTA_BUTTON_RELEASE_S` | `apps/nota/src/lib/nota-motion.ts:21`, `apps/nota/src/lib/nota-motion.spec.ts:4,43-44` |

Current dead exports:

```ts
/* apps/nota/src/lib/nota-motion.ts:20-21 — current */
export const NOTA_BUTTON_PRESS_S = 0.25;
export const NOTA_BUTTON_RELEASE_S = 0.35;
```

Spec block that only guards the dead exports:

```ts
/* apps/nota/src/lib/nota-motion.spec.ts:40-45 — current */
it('keeps button press timings in a quick tactile band (0.2–0.4s)', () => {
  expect(NOTA_BUTTON_PRESS_S).toBeGreaterThanOrEqual(0.2);
  expect(NOTA_BUTTON_PRESS_S).toBeLessThanOrEqual(0.4);
  expect(NOTA_BUTTON_RELEASE_S).toBeGreaterThanOrEqual(0.2);
  expect(NOTA_BUTTON_RELEASE_S).toBeLessThanOrEqual(0.4);
});
```

**Where button motion actually lives (do not change in this plan):**

1. **`NotaButton`** — Tailwind on the CVA base string:

```tsx
/* packages/web-design/src/components/button.tsx:34 — current (excerpt) */
transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out motion-safe:active:scale-[0.98]
```

2. **`.nota-pressable`** — app-level class for non-`NotaButton` pressables (e.g. Clerk auth submit):

```css
/* apps/nota/styles.css:147-157 — current */
.nota-pressable {
  transition-property: transform, opacity, color, background-color, border-color, box-shadow;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: no-preference) {
  .nota-pressable:active {
    transform: scale(0.98);
  }
}
```

**Why delete rather than wire up or document:**

- `nota-motion.ts` is the GSAP token surface for shell/palette/sidebar tweens (`NOTA_PALETTE_*`, `NOTA_SIDEBAR_*`, sine eases). Buttons are high-frequency, CSS-interruptible `:active` feedback — the correct layer per AUDIT §1 (100+ times/day → no GSAP choreography).
- The dead values (250ms press / 350ms release) do not match live CSS (200ms symmetric `ease-out`) and sit outside AUDIT button-press budget (100–160ms).
- Keeping unused exports violates AUDIT §7 cohesion: tokens should reflect what the product actually does, not aspirational duplicates.

**Historical note:** constants introduced in `1ada51a` with the tracked `nota-motion.ts` module; never referenced outside the spec since.

## Target

Remove the two exports and their spec block. No new tokens, no GSAP wiring, no CSS changes. Button feel stays exactly as today (`scale(0.98)`, 200ms, `ease-out`, `motion-safe` / `prefers-reduced-motion` guards).

After edit, `nota-motion.ts` ends at `NOTA_SIDEBAR_SLIDE_PX` and jumps straight to `usePrefersReducedMotion`. `nota-motion.spec.ts` retains three tests: shell/palette band, sine eases, sidebar slide px.

## Repo conventions to follow

- **GSAP tokens** live in `apps/nota/src/lib/nota-motion.ts`; only constants consumed by GSAP callers belong there. Exemplar: `NOTA_PALETTE_ENTER_S` imported by `apps/nota/src/components/command-palette.tsx:77`.
- **Button press** belongs in `@nota/web-design/button` and `apps/nota/styles.css` (`.nota-pressable`), not in GSAP seconds. Exemplar: `packages/web-design/src/components/button.tsx:34`.
- **Tests** for `nota-motion` assert product intent for _used_ exports only; colocated `*.spec.ts` with AAA sections (`// Arrange|Act|Assert`).

## Red / green TDD strategy

1. **Red (before edit):** `pnpm exec nx test @nota/nota --testPathPattern=nota-motion` — passes today because the fourth `it` block asserts the dead constants. Grep `NOTA_BUTTON_PRESS_S` — expect 4 hits (2 definition + 2 spec import/assert lines).
2. **Green (after edit):** same test command — still passes with three `it` blocks. Grep `NOTA_BUTTON_PRESS_S|NOTA_BUTTON_RELEASE_S` — expect 0 hits under `apps/`, `packages/`.
3. **Regression guard:** no new tests required; removal is the fix. Optional sanity: `pnpm exec nx test @nota/web-design --testPathPattern=button` still passes (unchanged).

## Steps

1. **`apps/nota/src/lib/nota-motion.ts`** — delete lines 20–21 (`NOTA_BUTTON_PRESS_S`, `NOTA_BUTTON_RELEASE_S`) and the blank line before `usePrefersReducedMotion` if it leaves a double gap.

2. **`apps/nota/src/lib/nota-motion.spec.ts`** — remove `NOTA_BUTTON_PRESS_S` and `NOTA_BUTTON_RELEASE_S` from the import list (lines 3–4). Delete the entire `it('keeps button press timings…')` block (lines 40–45).

3. **Verify no drift** — if either constant appears anywhere else at execution time, STOP and report; do not delete other symbols.

## Boundaries

- Do NOT touch `packages/web-design/src/components/button.tsx`, `apps/nota/styles.css`, or `.nota-pressable` behaviour.
- Do NOT add CSS duration tokens or wire GSAP to buttons.
- Do NOT change `NOTA_PALETTE_*`, `NOTA_SIDEBAR_*`, sine eases, `usePrefersReducedMotion`, or GSAP re-exports.
- Do NOT add dependencies.
- Do NOT modify `notes-shell.spec.tsx` mock of `@/lib/nota-motion` (it spreads `...actual` and does not reference button constants).
- If file contents differ from commit `08ed1fa` (constants already removed or moved), STOP and report instead of improvising.

## Verification

- **Mechanical:**
  - `rg 'NOTA_BUTTON_PRESS_S|NOTA_BUTTON_RELEASE_S' apps packages` → no matches.
  - `pnpm exec nx test @nota/nota --testPathPattern=nota-motion` → all tests pass (3 cases).
  - `pnpm exec nx lint @nota/nota --files=apps/nota/src/lib/nota-motion.ts,apps/nota/src/lib/nota-motion.spec.ts` → clean.
- **Feel check:** run `pnpm exec nx dev @nota/nota`, open Settings or any screen with `NotaButton`, press and hold a button:
  - Subtle scale to ~0.98 on `:active`; release snaps back — unchanged from before this plan.
  - In DevTools → Rendering → emulate `prefers-reduced-motion: reduce` — `NotaButton` skips scale (`motion-safe:` prefix); `.nota-pressable` skips `:active` transform — unchanged.
  - Toggle Animations panel to 10% speed — confirm 200ms transform transition, not 250ms/350ms asymmetric GSAP (there should be no GSAP involvement on buttons).
- **Done when:** dead exports and spec block are gone, grep is clean, `nota-motion` unit tests pass, button press feel is visually identical to pre-change.
