# 011 — Guard folder chevron transform under reduced motion

- **Status**: TODO
- **Commit**: 08ed1fa
- **Severity**: LOW
- **Category**: Accessibility (audit §6)
- **Estimated scope**: 2 files, ~10 lines

## Problem

The sidebar folder expand/collapse chevron animates its `transform` on every toggle without honouring `prefers-reduced-motion`. Users who enable reduced motion in macOS or browser settings still see a 200ms rotation tween dozens of times per session as they browse folders.

**Style constant** — `apps/nota/src/lib/notes-sidebar-tree-styles.ts:54-55`:

```ts
export const notesSidebarTreeChevronClass = 'mr-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200';
```

**Consumer** — `apps/nota/src/components/notes-sidebar-list.tsx:427-435` applies the constant plus instant state via `rotate-90` when expanded:

```tsx
<HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} aria-hidden className={cn(notesSidebarTreeChevronClass, !isCollapsed && 'rotate-90')} />
```

The rotation state (`rotate-90`) must remain — it communicates expanded vs collapsed. Only the **animated transition** between states is the accessibility issue. Per audit §6: reduced motion means drop position/transform movement; keep state indication.

No other file imports `notesSidebarTreeChevronClass` (grep confirms only `notes-sidebar-list.tsx`).

## Target

Gate the transform transition behind Tailwind's `motion-safe:` variant so users with `prefers-reduced-motion: reduce` get an instant snap between orientations; users with `no-preference` keep the existing 200ms transform tween (within the audit's ≤300ms UI budget).

```ts
export const notesSidebarTreeChevronClass = 'mr-0.5 size-3.5 shrink-0 text-muted-foreground/50 motion-safe:transition-transform motion-safe:duration-200';
```

Behaviour under reduced motion:

- Chevron still shows `rotate-90` when expanded (state unchanged).
- No `transition-transform` property is applied — rotation snaps instantly.
- No new dependencies, no markup changes, no JS `usePrefersReducedMotion()` branch required.

## Repo conventions to follow

The repo already uses Tailwind `motion-safe:` to gate movement without custom CSS:

- `apps/nota/src/components/note-image-lightbox.tsx:98` — `motion-safe:transition motion-safe:duration-300 motion-safe:ease-out`
- `packages/design/src/components/button.tsx:34` — `motion-safe:active:scale-[0.98]` (press feedback gated; colour transitions remain)

Prefer the `motion-safe:` prefix over a new `@media (prefers-reduced-motion: reduce)` block in `styles.css` for this one-off utility string. Do **not** add `ease-out` in this plan — duration and easing are out of scope for finding #11; only the reduced-motion guard is required.

## Steps

### TDD strategy (red → green)

1. **Red** — In `apps/nota/src/lib/notes-sidebar-tree-styles.spec.ts`, add a test that imports `notesSidebarTreeChevronClass` and asserts:
   - `notesSidebarTreeChevronClass` contains `motion-safe:transition-transform`
   - `notesSidebarTreeChevronClass` contains `motion-safe:duration-200`
   - `notesSidebarTreeChevronClass` does **not** contain bare `transition-transform` (ungated)
   - Run `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-tree-styles` — expect failure.
2. **Green** — Apply the target change in `notes-sidebar-tree-styles.ts` (step 3 below); re-run tests — expect pass.
3. **Regression** — Run `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-list` — existing chevron rotation test (`rotates the folder chevron when the folder is expanded`) must still pass; it checks `rotate-90` on the SVG class, not transition utilities.

### Implementation

1. **`apps/nota/src/lib/notes-sidebar-tree-styles.ts`** — Replace line 55:

   ```ts
   // before
   'mr-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200';

   // after
   'mr-0.5 size-3.5 shrink-0 text-muted-foreground/50 motion-safe:transition-transform motion-safe:duration-200';
   ```

2. **`apps/nota/src/lib/notes-sidebar-tree-styles.spec.ts`** — Add the red/green test from the TDD strategy (import `notesSidebarTreeChevronClass`; use AAA comments per repo convention).

## Boundaries

- Do NOT touch `apps/nota/src/components/notes-sidebar-list.tsx` — chevron usage is already correct.
- Do NOT change `rotate-90` toggling, `aria-expanded`, or folder collapse logic.
- Do NOT refactor `treeFolderRowBase` `transition-all` (line 10) — separate finding, out of scope.
- Do NOT add easing tokens, change duration values, or introduce GSAP/`usePrefersReducedMotion()` for this chevron.
- Do NOT add new dependencies.
- If `notesSidebarTreeChevronClass` has drifted since commit `08ed1fa`, STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-tree-styles` — all pass, including new motion-safe assertions.
  - `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-list` — all pass.
  - `pnpm exec nx run @getmadrid/nota:lint` — no new issues on touched files.
- **Feel check**: run `pnpm exec nx dev @getmadrid/nota`, open Notes sidebar with at least one folder:
  - With default motion: click folder chevron — icon rotates over ~200ms.
  - Chrome DevTools → Rendering → enable **Emulate CSS media feature `prefers-reduced-motion: reduce`** (or macOS System Settings → Accessibility → Display → Reduce motion): click folder chevron — icon snaps between horizontal and vertical with no visible tween.
  - Expanded/collapsed state and `aria-expanded` on the button remain correct in both modes.
  - Spam-click a folder toggle — rotation never "restarts from zero" awkwardly; under reduced motion each click is an instant snap.
- **Done when**: `notesSidebarTreeChevronClass` uses `motion-safe:transition-transform` + `motion-safe:duration-200`, spec asserts the guard, tests and lint pass, and manual reduced-motion check shows instant chevron rotation with preserved expand/collapse state.
