# 009 — Cap shell and palette durations

- **Status**: DONE
- **Commit**: 08ed1fa
- **Severity**: LOW
- **Category**: Easing & duration
- **Estimated scope**: 2 files, ~40 lines

## Problem

Shell chrome motion tokens in `apps/nota/src/lib/nota-motion.ts` deliberately sit above the Emil audit bar for UI elements (300ms cap). Palette enter and sidebar collapse are the two slowest daily chrome tweens.

Current constants and comment:

```ts
/* apps/nota/src/lib/nota-motion.ts:11-15 — current */
/** Calm motion band ~300–500ms :  palette, shell chrome. */
export const NOTA_PALETTE_ENTER_S = 0.4;
export const NOTA_PALETTE_EXIT_S = 0.35;

export const NOTA_SIDEBAR_S = 0.45;
```

Consumers (no local duration overrides — they read tokens only):

```ts
/* apps/nota/src/components/command-palette.tsx:418-431 — enter */
.to(backdrop, {
  autoAlpha: 1,
  duration: NOTA_PALETTE_ENTER_S,
  ease: NOTA_MOTION_EASE_OUT,
})
.to(panel, { /* … */ duration: NOTA_PALETTE_ENTER_S, ease: NOTA_MOTION_EASE_OUT }, 0);

/* apps/nota/src/components/command-palette.tsx:442-454 — exit */
duration: NOTA_PALETTE_EXIT_S,
ease: NOTA_MOTION_EASE_IN,

/* apps/nota/src/components/notes-shell.tsx:245-250 — sidebar */
gsap.to(el, {
  ...targets,
  duration: NOTA_SIDEBAR_S,
  ease: NOTA_MOTION_EASE_IN_OUT,
  overwrite: 'auto',
});
```

`NOTA_PALETTE_ENTER_S` (400ms) and `NOTA_SIDEBAR_S` (450ms) exceed the audit UI cap. `NOTA_PALETTE_EXIT_S` (350ms) also exceeds it. Dropdowns/selects budget is **150–250ms**; general UI stays **under 300ms**.

The spec encodes the old product intent and conflicts with the audit bar:

```ts
/* apps/nota/src/lib/nota-motion.spec.ts:17-26 — current */
it('keeps shell/palette timings in a slow, intentional band (0.3–0.55s)', () => {
  const timings = [NOTA_PALETTE_ENTER_S, NOTA_PALETTE_EXIT_S, NOTA_SIDEBAR_S] as const;
  for (const t of timings) {
    expect(t).toBeGreaterThanOrEqual(0.3);
    expect(t).toBeLessThanOrEqual(0.55);
  }
});
```

This test **requires** durations ≥300ms. That is intentional tension with commit `08ed1fa` (“calm”, “settled” motion). This plan resolves it in favour of the audit bar **only if shell/palette motion is still present** after dependency plans run.

## Target

Cap durations at audit budgets. Palette uses the dropdown ceiling; sidebar uses the general UI ceiling.

```ts
/* apps/nota/src/lib/nota-motion.ts — target */
/** Crisp shell chrome band (AUDIT: dropdowns ≤250ms, UI ≤300ms). See plans/009. */
export const NOTA_PALETTE_ENTER_S = 0.25;
export const NOTA_PALETTE_EXIT_S = 0.25;

export const NOTA_SIDEBAR_S = 0.3;
```

Spec documents the new bands and the retired slow-band intent:

```ts
/* apps/nota/src/lib/nota-motion.spec.ts — target */
it('keeps palette timings within the dropdown budget (150–250ms)', () => {
  expect(NOTA_PALETTE_ENTER_S).toBeGreaterThanOrEqual(0.15);
  expect(NOTA_PALETTE_ENTER_S).toBeLessThanOrEqual(0.25);
  expect(NOTA_PALETTE_EXIT_S).toBeGreaterThanOrEqual(0.15);
  expect(NOTA_PALETTE_EXIT_S).toBeLessThanOrEqual(0.25);
});

it('keeps sidebar timing within the UI cap (≤300ms)', () => {
  expect(NOTA_SIDEBAR_S).toBeGreaterThanOrEqual(0.2);
  expect(NOTA_SIDEBAR_S).toBeLessThanOrEqual(0.3);
});
```

No edits to `command-palette.tsx` or `notes-shell.tsx` unless drift shows hard-coded durations (there are none at `08ed1fa`).

## Repo conventions to follow

- Motion constants live in `apps/nota/src/lib/nota-motion.ts`; components import named `NOTA_*_S` seconds (GSAP `duration` expects seconds).
- Behaviour specs colocate as `nota-motion.spec.ts` next to the module; use AAA comments (`// Arrange`, `// Act`, `// Assert`) per `.cursor/rules/aaa-testing-pattern.mdc`.
- Easing tokens stay as GSAP strings for now (`sine.out`, etc.); easing consolidation is **plan 007**, not this plan.
- `usePrefersReducedMotion()` paths in palette and sidebar must remain untouched.

## Dependencies

| Plan                                  | Relationship                                                                                                                                                                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **001** — snap palette open/close     | **Run 001 first.** If palette motion is removed entirely, `NOTA_PALETTE_ENTER_S` / `NOTA_PALETTE_EXIT_S` may become unused. In that case, skip palette steps in this plan (or delete palette constants in a follow-up). Execute palette duration caps only when plan 001 keeps GSAP enter/exit. |
| **004** — sidebar transform not width | **Run 004 before or with this plan.** Plan 004 changes _what_ animates (`width` → transform/clip). This plan changes _how long_ `NOTA_SIDEBAR_S` lasts. Apply the 300ms cap once, on the final sidebar implementation after 004 lands, to avoid retuning duration on code that 004 replaces.    |

If both 001 (snap) and 004 (transform refactor) land, this plan may reduce to **sidebar duration only** plus spec cleanup.

## TDD strategy

1. **Red** — Update `nota-motion.spec.ts` first: replace the `0.3–0.55s` slow-band test with the two target tests above. Run `pnpm exec nx test @nota/nota --testPathPattern=nota-motion` — expect failures on current constants (`0.4`, `0.35`, `0.45`).
2. **Green** — Change `NOTA_PALETTE_ENTER_S`, `NOTA_PALETTE_EXIT_S`, and `NOTA_SIDEBAR_S` in `nota-motion.ts` to target values; update the module comment.
3. **Refactor** — None required; consumers already import constants.

## Steps

1. **Pre-flight (dependency check).** Read `apps/nota/src/components/command-palette.tsx` around the `useGSAP` open/close block (~398–463). If GSAP enter/exit tweens are gone (plan 001), skip steps 3–4 and note palette constants as dead in the commit message.
2. **Red — spec.** In `apps/nota/src/lib/nota-motion.spec.ts`, remove the test `'keeps shell/palette timings in a slow, intentional band (0.3–0.55s)'`. Add the two target tests from the **Target** section. Run tests; confirm red.
3. **Green — palette constants.** In `apps/nota/src/lib/nota-motion.ts`, set `NOTA_PALETTE_ENTER_S = 0.25` and `NOTA_PALETTE_EXIT_S = 0.25`. Replace the `Calm motion band ~300–500ms` comment with the crisp-band comment from **Target**.
4. **Green — sidebar constant.** Set `NOTA_SIDEBAR_S = 0.3` in the same file.
5. **Green — verify tests.** Run `pnpm exec nx test @nota/nota --testPathPattern=nota-motion` — all `nota-motion` tests pass. Run `pnpm exec nx test @nota/nota --testPathPattern=nota-sidebar-shell-motion` — sidebar target helpers unchanged (they do not assert duration).

## Boundaries

- Do NOT touch `command-palette.tsx`, `notes-shell.tsx`, or `nota-sidebar-shell-motion.ts` unless pre-flight shows hard-coded durations (unexpected drift — STOP and report).
- Do NOT change easing strings (`NOTA_MOTION_EASE_*`) — that is plan 003 / 007.
- Do NOT remove palette motion (plan 001) or refactor sidebar width animation (plan 004).
- Do NOT change `NOTA_BUTTON_PRESS_S`, `NOTA_BUTTON_RELEASE_S`, or their spec block (plan 010).
- Do NOT add new dependencies.
- If constants or consumers differ from excerpts above, STOP and report drift since commit `08ed1fa`.

## Verification

- **Mechanical**
  - `pnpm exec nx test @nota/nota --testPathPattern=nota-motion` — pass.
  - `pnpm exec nx test @nota/nota --testPathPattern=nota-sidebar-shell-motion` — pass.
  - `pnpm exec nx run @nota/nota:lint` — pass on touched files.
- **Feel check** (only if palette motion still exists after plan 001):
  - `pnpm exec nx dev @nota/nota` → Cmd/Ctrl+K: palette should feel snappier; enter/exit visibly shorter than before but not instantaneous.
  - Toggle sidebar (tens/day): collapse/expand completes within one perceptual beat (~300ms), not a lingering half-second.
  - DevTools → Animations panel, playback **10%**: palette backdrop and panel tweens ≈250ms; sidebar aside tween ≈300ms.
  - Rendering → **prefers-reduced-motion: reduce**: palette and sidebar still snap (existing paths unchanged).
- **Done when**
  - `NOTA_PALETTE_ENTER_S === 0.25`, `NOTA_PALETTE_EXIT_S === 0.25`, `NOTA_SIDEBAR_S === 0.3` (or palette constants acknowledged dead if plan 001 removed motion).
  - Spec no longer asserts ≥0.3s slow band; new budget tests pass.
  - No consumer file edits were required.
