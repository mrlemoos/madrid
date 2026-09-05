# 013 — Animate folder branch expand/collapse

- **Status**: TODO
- **Commit**: 08ed1fa
- **Severity**: LOW
- **Category**: Missed opportunities (interruptibility + easing)
- **Estimated scope**: 3 files, ~60 lines

## Problem

Folder chevrons rotate smoothly, but branch children pop in and out instantly. The chevron and content feel disconnected.

**Collapse pattern (recon)**

| Layer          | Location                                                   | Behaviour                                                                                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| State          | `apps/nota/src/stores/notes-sidebar.ts:14-71`              | `collapsedFolderIds: string[]` — absence = expanded. `toggleFolderCollapsed` flips membership; `expandFolder` / `expandFolderAncestors` remove ids (e.g. when opening a nested note via palette/graph). Persisted in `nota-notes-sidebar`. |
| Toggle UI      | `apps/nota/src/components/notes-sidebar-list.tsx:401-436`  | Folder trigger button calls `toggleFolderCollapsed(folder.id)`. `aria-expanded={!isCollapsed}`, `aria-controls` points at branch `id`.                                                                                                     |
| Chevron motion | `apps/nota/src/lib/notes-sidebar-tree-styles.ts:53-55`     | `notesSidebarTreeChevronClass` = `transition-transform duration-200`; `rotate-90` class when expanded. **No explicit easing** (browser default `ease`).                                                                                    |
| Branch mount   | `apps/nota/src/components/notes-sidebar-list.tsx:972-1012` | **Conditional render** — children unmount when collapsed:                                                                                                                                                                                  |

```tsx
/* apps/nota/src/components/notes-sidebar-list.tsx:972-977 — current */
{!isCollapsed ? (
  <div
    id={folderContentId}
    className={cn(NOTA_SIDEBAR_TREE_BRANCH_CLASS, 'min-w-0 pb-1')}
    role="group"
  >
```

| Branch styles | `apps/nota/src/lib/notes-sidebar-tree-styles.ts:3-4` | `NOTA_SIDEBAR_TREE_BRANCH_CLASS = 'ml-4 overflow-hidden pl-1'` — `overflow-hidden` is present but unused for motion because the node is removed from the DOM. |
| Composition | `FolderRow` → `{children}` at `:638` | Branch is a sibling after the folder row `<li>` content, not inside the trigger. |
| Programmatic expand | `notes-sidebar-list.tsx:720-738` | `expandFolderAncestors` can expand multiple ancestors in one store update when `routeNoteId` lands in a nested folder. |

**Why it matters:** The chevron implies spatial reveal; instant mount/unmount breaks that affordance. Severity is **LOW** because folder toggles are optional navigation polish, not core editing flow.

**High-frequency risk (read before implementing):**

- Folder toggles sit in the **tens of times per day** band (AUDIT §1) — animation is tolerable only if it stays **under 200ms**, uses **interruptible CSS transitions** (not keyframes), and **never blocks clicks**.
- Power users with deep folder trees may spam chevrons; `expandFolderAncestors` can open several branches at once (palette → nested note). Cascading height tweens on many siblings can cause jank in Electron/Safari.
- Always-mounted branches (required for exit animation) increase DOM size for collapsed folders. Keep the change scoped to the branch wrapper only; do not mount extra portals or GSAP timelines.
- If motion feels sluggish after implementation, **delete the height tween and keep opacity only** — that is an acceptable fallback for this LOW item.

## Target

Animate the branch container with **opacity** and an optional **grid-row height reveal**, matched to the chevron, **≤ 180ms**, **ease-out**, interruptible, non-blocking.

**Exact values (from AUDIT.md):**

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--folder-branch-dur: 180ms; /* under 200ms budget */
```

**End-state behaviour:**

1. Branch wrapper **stays in the DOM** when collapsed (toggle `data-expanded` / `aria-hidden` / `inert` instead of `{!isCollapsed ? … : null}`).
2. CSS grid `0fr` → `1fr` on an inner `min-h-0 overflow-hidden` child for height (optional but in scope).
3. Opacity `0` → `1` on expand; reverse on collapse — **transform/opacity only** on the animated surface; grid-row change is the height mechanism (no `transition: all`, no animated `margin`/`padding`).
4. Chevron uses the same duration and `ease-out` as the branch.
5. `prefers-reduced-motion: reduce` → instant toggle (no height/opacity tween); chevron may snap or keep a 0ms transform — match sidebar reduced-motion patterns in `apps/nota/styles.css`.
6. **Interaction never blocked:** no `pointer-events: none` on the branch; no `setTimeout` gates; folder trigger remains clickable mid-animation; use CSS transitions so rapid toggle retargets from current state.

```css
/* target — apps/nota/styles.css (new block) */
.nota-folder-branch {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows var(--folder-branch-dur) var(--ease-out),
    opacity var(--folder-branch-dur) var(--ease-out);
}
.nota-folder-branch[data-expanded='true'] {
  grid-template-rows: 1fr;
  opacity: 1;
}
.nota-folder-branch__inner {
  min-height: 0;
  overflow: hidden;
}
@media (prefers-reduced-motion: reduce) {
  .nota-folder-branch {
    transition: none;
  }
}
```

```ts
/* target — notes-sidebar-tree-styles.ts chevron */
export const notesSidebarTreeChevronClass = 'mr-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-[180ms] ease-out';
```

## Repo conventions to follow

- **Press/sidebar micro-motion** uses CSS in `apps/nota/styles.css` with explicit `ease-out` and ~150–200ms durations — see `.nota-sidebar-row` at `apps/nota/styles.css:166-171` and `.nota-pressable` at `:147-152` (`cubic-bezier(0.22, 1, 0.36, 1)`).
- **Tree class tokens** live in `apps/nota/src/lib/notes-sidebar-tree-styles.ts`; tests in `notes-sidebar-tree-styles.spec.ts`.
- **Reduced motion hook** exists as `usePrefersReducedMotion()` in `apps/nota/src/lib/nota-motion.ts` — used by `notes-shell.tsx` and `command-palette.tsx` for GSAP. **Prefer CSS `@media (prefers-reduced-motion: reduce)` here** (no GSAP on sidebar list; AGENTS.md: no GSAP on TipTap/sidebar surfaces).
- **Do not add GSAP** for folder branches — frequency and interruptibility favour CSS transitions (AUDIT §4–5).
- **AAA tests** in colocated `*.spec.ts`; mark `// Arrange | Act | Assert`.

## TDD strategy (red → green)

1. **Red:** In `notes-sidebar-tree-styles.spec.ts`, add a test that exports a new `NOTA_SIDEBAR_TREE_BRANCH_COLLAPSE_CLASS` (or similar) containing `nota-folder-branch` and that chevron class string includes `ease-out` and `180ms` (or `duration-[180ms]`).
2. **Red:** In `notes-sidebar-list.spec.tsx`, extend `rotates the folder chevron when the folder is expanded` — after collapse click, assert branch node **still exists** in DOM with `data-expanded="false"` and `inert` (or `aria-hidden="true"`), instead of `getElementById` being null.
3. **Green:** Implement always-mounted branch + CSS + class exports.
4. **Red (optional):** Assert `expandFolderAncestors` path leaves `data-expanded="true"` on ancestor branches when a nested note is routed (mock store + render).
5. **Green:** Wire `data-expanded={!isCollapsed}` and accessibility attributes.

## Steps

1. **`apps/nota/styles.css`** — Add `:root` tokens (or reuse existing custom properties if present):

   ```css
   :root {
     --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
     --folder-branch-dur: 180ms;
   }
   ```

   Append the `.nota-folder-branch`, `.nota-folder-branch__inner`, and `prefers-reduced-motion` block from **Target** above (after `.nota-sidebar-row` block ~line 177).

2. **`apps/nota/src/lib/notes-sidebar-tree-styles.ts`**
   - Export `NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS = 'nota-folder-branch__inner'`.
   - Change `NOTA_SIDEBAR_TREE_BRANCH_CLASS` to include `nota-folder-branch` (keep `ml-4 pl-1`; drop redundant `overflow-hidden` from outer if inner carries it).
   - Update `notesSidebarTreeChevronClass` to `duration-[180ms] ease-out` (replace bare `duration-200`).

3. **`apps/nota/src/components/notes-sidebar-list.tsx`** — Replace conditional branch render (`:972-1012`) with always-mounted structure:

   ```tsx
   <div id={folderContentId} className={cn(NOTA_SIDEBAR_TREE_BRANCH_CLASS, 'min-w-0 pb-1')} role="group" data-expanded={!isCollapsed} aria-hidden={isCollapsed} {...(isCollapsed ? { inert: '' } : {})}>
     <div className={NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS}>{/* existing empty-state / ul children unchanged */}</div>
   </div>
   ```

   Import `NOTA_SIDEBAR_TREE_BRANCH_INNER_CLASS`. Remove the `{!isCollapsed ? ( … ) : null}` wrapper.

4. **`apps/nota/src/lib/notes-sidebar-tree-styles.spec.ts`** — Add assertions for new class strings (TDD step 1).

5. **`apps/nota/src/components/notes-sidebar-list.spec.tsx`** — Update chevron test and add collapse DOM persistence test (TDD step 2). Existing test at `:553` expects `getElementById('sidebar-folder-folder-1')` truthy when expanded — keep; add collapsed-state assertions.

## Boundaries

- Do NOT touch `notes-shell.tsx`, GSAP sidebar width tween, `command-palette.tsx`, TipTap, or `notes-sidebar.ts` store shape.
- Do NOT add npm dependencies (no Framer Motion, no Radix Accordion).
- Do NOT animate note row hover/selection (`notesSidebarTreeRowVariants`).
- Do NOT add stagger between child notes/folders inside a branch.
- Do NOT use `transition: all` or animate `margin`/`padding`/`max-height` with hard-coded pixel values.
- Do NOT block pointer events during animation.
- If `data-expanded` / `inert` / grid pattern is already partially implemented at commit `08ed1fa`, adapt steps to match — do not duplicate wrappers.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical:**
  - `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-tree-styles`
  - `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-list`
  - `pnpm exec nx lint @getmadrid/nota`
  - All pass with no new warnings.

- **Feel check:** Run `pnpm exec nx dev @getmadrid/nota`, open Notes sidebar with nested folders:
  - Click a folder chevron: children **fade and slide open** while chevron rotates; total motion **≤ 200ms**.
  - Click collapse mid-expand (spam chevron): motion **reverses smoothly** from current position — does not snap to start.
  - Open a note in a collapsed nested folder via command palette: ancestors expand; motion stays subtle (no multi-second cascade).
  - Collapse a folder with many notes: sidebar scroll position stays stable; no layout thrash visible.
  - DevTools → Rendering → **Emulate prefers-reduced-motion: reduce**: branch toggles **instantly**; no height tween.
  - DevTools → Animations panel, 10% playback: opacity and grid-row change together; chevron rotation aligned.

- **Done when:** Branch uses always-mounted `data-expanded` grid/opacity transition ≤180ms; chevron easing/duration matched; tests updated; reduced-motion respected; no interaction delay on folder trigger or note rows inside an expanding branch.
