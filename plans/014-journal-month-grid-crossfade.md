# 014 — Crossfade journal month grid on navigation

- **Status**: TODO
- **Commit**: 08ed1fa
- **Severity**: LOW
- **Category**: Missed opportunities (§8)
- **Estimated scope**: 2 files, ~60 lines

## Problem

When the user clicks **Previous month** or **Next month** in the journal calendar, the day grid teleports to the new month with no transition. The month label (`h2`) updates at the same instant, but this plan animates **only the day grid** (`role="grid"`), per audit scope.

**Where it happens**

- Month navigation calls `goMonth` → `onMonthChange` → `setVisibleMonth` in `journal-screen.tsx:95-97`.
- `JournalCalendar` recomputes `cells` from `year`/`month` and React replaces all 42 grid cells in one paint.

Current grid markup — no enter/exit motion, only per-cell colour transitions:

```tsx
/* apps/nota/src/components/journal-calendar.tsx:108-170 — current */
<div
  className="grid grid-cols-7 gap-1"
  role="grid"
  aria-label={t('Journal calendar')}
>
  {cells.map((cell) => {
    /* … */
    return (
      <button
        key={cell.dateKey}
        /* … */
        className={cn(
          'relative flex min-h-[2.75rem] flex-col items-center justify-center rounded-lg px-0.5 py-1 text-sm transition-colors',
          /* … */
        )}
      >
```

**Why it matters**

Browsing months is an occasional action (not keyboard-high-frequency), so a brief crossfade fits the audit’s “prevent a jarring change” purpose without violating the “no animation on 100+ times/day actions” rule. The weekday header row, month title, and “Go to today” control should stay instant so navigation still feels snappy at the label level.

**Recon — `journal-notes-list.tsx` (out of scope, documented)**

- `JournalNotesList` virtualises entries (`@tanstack/react-virtual`); it does not participate in month navigation.
- The list filters by `selectedDateKey`, not `visibleMonth` (`journal-screen.tsx:37-40`). Changing month alone does not swap list content unless the user also changes the selected day.
- List rows use `transition-colors` on hover only (`journal-notes-list.tsx:71-74`); content swaps (date filter, empty state) are instant. A separate plan would be needed for list crossfades — **do not touch** `journal-notes-list.tsx` in this plan.

## Target

A **150ms opacity crossfade on the day grid only** when `year`/`month` props change:

| Property              | Value                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duration              | `150ms`                                                                                                                                                               |
| Easing (enter + exit) | `cubic-bezier(0.23, 1, 0.32, 1)` (AUDIT strong ease-out)                                                                                                              |
| Animated properties   | `opacity` only on grid layers                                                                                                                                         |
| Layout                | Outgoing + incoming grids overlap in a `relative` wrapper with stable min-height so the panel does not jump                                                           |
| Interruptibility      | CSS `transition` on `opacity` (retargets mid-animation if prev/next is spammed)                                                                                       |
| Reduced motion        | `usePrefersReducedMotion()` → skip overlap; swap grid instantly (same as today)                                                                                       |
| Optional blur mask    | If double-exposure is visible at 10% playback, add `filter: blur(2px)` on the exiting layer only during the 150ms window (AUDIT §7); remove blur by end of transition |

**Do not animate:** weekday labels (`journal-calendar.tsx:100-106`), month `h2`, nav chevrons, “Go to today”, or `journal-notes-list`.

## Repo conventions to follow

- Reduced motion: `usePrefersReducedMotion()` from `apps/nota/src/lib/nota-motion.ts:23-42` (same hook as `notes-shell.tsx`).
- Opacity + transform discipline: animate `opacity` only on the grid wrapper layers; do not use `transition: all`.
- CSS timing exemplar — 150ms ease-out already used for command items:

```css
/* apps/nota/styles.css:179-182 */
.nota-cmdk-item {
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;
}
```

- Prefer **plain CSS transitions** over GSAP here: journal month change is a simple opacity crossfade; GSAP is reserved for shell/palette chrome (`notes-shell.tsx`, `command-palette.tsx`).
- No new npm dependencies.

## TDD strategy (red → green)

1. **Red** — Add `apps/nota/src/lib/journal-month-grid-transition.spec.ts` with pure functions extracted from the component:
   - `resolveJournalMonthGridLayers({ incoming, outgoing, prefersReducedMotion })` returns `{ showOutgoing, showIncoming, animate }`.
   - Assert: when `prefersReducedMotion` is `true`, `animate` is `false` and only incoming month is shown.
   - Assert: when month changes, both outgoing and incoming are present for one transition tick.
   - Assert: rapid month changes (simulate two deltas before timeout) still yield a single incoming month matching latest props (latest wins).
2. **Green** — Implement the helper + wire `journal-calendar.tsx` until tests pass.
3. **Refactor** — Keep animation constants in one place (`JOURNAL_MONTH_GRID_CROSSFADE_MS = 150` next to the helper or at top of `journal-calendar.tsx`).

No Vitest DOM animation assertions required; feel-check covers motion quality.

## Steps

1. **Extract transition state helper** — Create `apps/nota/src/lib/journal-month-grid-transition.ts`:

```ts
export const JOURNAL_MONTH_GRID_CROSSFADE_MS = 150;

export type JournalMonthGridLayer = {
  year: number;
  month: number;
  cells: readonly JournalCalendarCell[]; // import type from journal-calendar.ts
};

export function shouldAnimateJournalMonthGrid(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion;
}
```

Add `useJournalMonthGridCrossfade(year, month, cells, prefersReducedMotion)` in the same file (or colocated hook) that:

- Keeps `outgoing` layer until `JOURNAL_MONTH_GRID_CROSSFADE_MS` after a month change.
- Sets incoming layer opacity target to `1`, outgoing to `0`.
- On unmount, clear pending timeout.
- When `prefersReducedMotion`, set layers to incoming only with no timeout overlap.

2. **Add failing tests** — `apps/nota/src/lib/journal-month-grid-transition.spec.ts` per TDD strategy above. Run:

```bash
pnpm exec nx test @getmadrid/nota --testPathPattern=journal-month-grid-transition
```

Confirm red.

3. **Implement hook to green** — Complete the hook logic; re-run tests until green.

4. **Wrap the day grid in `journal-calendar.tsx`** — Replace the single grid `div` (`:108-170`) with:

```tsx
const prefersReducedMotion = usePrefersReducedMotion();
const { outgoingLayer, incomingLayer, phase } = useJournalMonthGridCrossfade(year, month, cells, prefersReducedMotion);

const gridLayerClass = cn('grid grid-cols-7 gap-1', phase === 'crossfade' && 'transition-opacity duration-150 ease-out motion-reduce:transition-none');
const gridLayerStyle = phase === 'crossfade' ? { transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } : undefined;

return (
  <div className="relative min-h-[17.75rem]" /* 6 rows × 2.75rem + 5× gap-1 — stabilises overlap */ aria-hidden={false}>
    {outgoingLayer ? (
      <div
        className={cn(gridLayerClass, 'absolute inset-0')}
        style={{
          ...gridLayerStyle,
          opacity: outgoingLayer.opacity,
          filter: outgoingLayer.blur ? 'blur(2px)' : undefined,
        }}
        role="presentation"
      >
        {renderMonthCells(outgoingLayer.cells)}
      </div>
    ) : null}
    <div className={gridLayerClass} style={{ ...gridLayerStyle, opacity: incomingLayer.opacity }} role="grid" aria-label={t('Journal calendar')}>
      {renderMonthCells(incomingLayer.cells)}
    </div>
  </div>
);
```

- Extract the existing `cells.map(…)` button markup into a `renderMonthCells(cells)` function inside the file to avoid duplication.
- **Incoming grid** keeps `role="grid"` and `aria-label`; outgoing is `role="presentation"` so screen readers are not doubled.
- Weekday header (`:100-106`) stays **above** this wrapper, unchanged.

5. **Optional CSS class** — If inline `transitionTimingFunction` is noisy, add to `apps/nota/styles.css`:

```css
.journal-month-grid-layer {
  transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .journal-month-grid-layer {
    transition: none;
  }
}
```

Use `journal-month-grid-layer` instead of Tailwind `duration-150 ease-out` on the grid layers.

6. **Blur mask (only if needed after feel-check)** — If slow-motion review shows ugly double dates, set `blur: true` on the outgoing layer for the crossfade phase only; do not blur the incoming layer.

## Boundaries

- Do NOT touch `journal-notes-list.tsx`, `journal-screen.tsx`, `journal-notes.ts`, or `journal-calendar.ts` (pure date helpers).
- Do NOT animate the month title, weekday row, nav buttons, or “Go to today”.
- Do NOT add GSAP, Framer Motion, or new dependencies.
- Do NOT change cell markup, selection logic, or `onMonthChange` contract.
- Do NOT use `transition: all` or animate `width`/`height`/`margin`.
- If file structure at commit `08ed1fa` has drifted (grid not at `:108-170`), STOP and report instead of improvising.

## Verification

- **Mechanical**:

```bash
pnpm exec nx test @getmadrid/nota --testPathPattern=journal-month-grid-transition
pnpm exec nx lint @getmadrid/nota
pnpm exec nx run @getmadrid/nota:typecheck
```

All pass with no new lint errors.

- **Feel check**: run `pnpm exec nx dev @getmadrid/nota`, open `#/notes/journal` (entitled account), then:
  - Click **Next month** once: day grid crossfades (~150ms); month `h2` updates instantly without fade.
  - Click **Previous month** rapidly 4–5 times: motion retargets smoothly, no flash to blank, no stuck half-opacity grid.
  - DevTools → **Animations** → 10% speed: outgoing and incoming grids overlap briefly; opacity is the only property changing.
  - DevTools → **Rendering** → `prefers-reduced-motion: reduce`: month change is instant (no overlap, no blur).
  - Confirm weekday labels do not fade.
  - Select a day, change month: note dots on in-month cells update correctly after crossfade.

- **Done when**: day grid crossfades on month change at 150ms ease-out; reduced motion skips animation; tests green; no regressions to calendar selection or journal list behaviour.
