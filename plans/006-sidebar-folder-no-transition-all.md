# 006 — Sidebar folder row: drop transition-all

- **Status**: DONE
- **Commit**: 08ed1fa
- **Severity**: MEDIUM
- **Category**: Performance (audit §5)
- **Estimated scope**: 2 files, ~10 lines

## Problem

The notes sidebar folder row base class uses Tailwind `transition-all`, which animates every CSS property that changes — including layout-adjacent properties the browser may promote off the compositor thread. Per the animation audit playbook, **`transition: all` animates unintended properties off-GPU — always a finding.**

Folder rows are high-frequency UI: users hover and drag notes onto them tens of times per session. The sibling note row base in the same module already scopes transitions correctly.

**Location:** `apps/nota/src/lib/notes-sidebar-tree-styles.ts:9-10`

```ts
/* apps/nota/src/lib/notes-sidebar-tree-styles.ts:6-10 — current */
const treeNoteRowBase = 'group flex w-full min-w-0 cursor-pointer items-center rounded-lg py-1.5 text-left transition-colors';

const treeFolderRowBase = 'group relative flex w-full min-w-0 cursor-pointer items-center rounded-md py-1 text-left transition-all before:absolute before:inset-y-0 before:left-0 before:-z-10 before:h-7 before:w-full before:rounded-md before:bg-accent/70 before:opacity-0 before:transition-opacity hover:before:opacity-100';
```

**What actually changes on folder rows today:**

| State     | Element           | Property                            | Already scoped?                                    |
| --------- | ----------------- | ----------------------------------- | -------------------------------------------------- |
| Hover     | `::before` pseudo | `opacity` (0 → 100)                 | Yes — `before:transition-opacity`                  |
| Drag-over | Main row          | `color` (`text-primary-foreground`) | No — caught by `transition-all`                    |
| Drag-over | `::before` pseudo | `opacity`, `background-color`       | Opacity yes; bg snaps (pre-existing, out of scope) |

The main row element never changes its own `opacity`. Opacity feedback lives entirely on the `::before` pseudo, which already has `before:transition-opacity`. The only main-element transition needed is **colour** (text on drag-over), matching `treeNoteRowBase`.

**Consumer:** `apps/nota/src/components/notes-sidebar-list.tsx:365` applies `notesSidebarTreeFolderRowVariants({ dragOver: isDropTarget })` — no changes needed there.

**Existing tests:** `apps/nota/src/lib/notes-sidebar-tree-styles.spec.ts` asserts row height, indentation, and selection backgrounds but does **not** assert transition scope. Add a regression test here (TDD).

## Target

Replace `transition-all` on `treeFolderRowBase` with `transition-colors` so folder rows match note rows. Keep `before:transition-opacity` unchanged on the pseudo.

```ts
/* apps/nota/src/lib/notes-sidebar-tree-styles.ts:9-10 — target */
const treeFolderRowBase = 'group relative flex w-full min-w-0 cursor-pointer items-center rounded-md py-1 text-left transition-colors before:absolute before:inset-y-0 before:left-0 before:-z-10 before:h-7 before:w-full before:rounded-md before:bg-accent/70 before:opacity-0 before:transition-opacity hover:before:opacity-100';
```

Tailwind `transition-colors` expands to:

```css
transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* Tailwind default */
transition-duration: 150ms; /* Tailwind default */
```

This is acceptable for hover/colour feedback per audit duration budgets (150–250ms for list navigation). No custom duration token is required — note rows in the same file use bare `transition-colors` with the same defaults.

Do **not** add `transition-opacity` on the main row element; opacity is not a main-element property here.

## Repo conventions to follow

- **Exemplar (same file):** `treeNoteRowBase` at `apps/nota/src/lib/notes-sidebar-tree-styles.ts:7` uses `transition-colors` for sidebar tree note rows — folder rows should mirror this.
- **Pseudo-element pattern:** `before:transition-opacity` on the folder hover highlight is already correctly scoped; leave it.
- **Tests:** Colocated `*.spec.ts` under `apps/nota/src/` with AAA sections (`// Arrange`, `// Act`, `// Assert`) per `.cursor/rules/aaa-testing-pattern.mdc`.
- **British spelling** in comments if any are added.
- **Do not** touch `notes-sidebar-list.tsx`, chevron `transition-transform`, or GSAP sidebar width tweens — out of scope.

## Steps

### 1. Red — add failing regression test

In `apps/nota/src/lib/notes-sidebar-tree-styles.spec.ts`, add:

```ts
it('scopes folder row transitions to colour only, not transition-all', () => {
  // Arrange
  // Act
  const folderRow = notesSidebarTreeFolderRowVariants();
  const noteRow = notesSidebarTreeRowVariants();

  // Assert
  expect(folderRow).not.toContain('transition-all');
  expect(folderRow).toContain('transition-colors');
  expect(folderRow).toContain('before:transition-opacity');
  expect(noteRow).toContain('transition-colors');
});
```

Run `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-tree-styles` — expect **fail** on `transition-all` assertion.

### 2. Green — fix the base class

In `apps/nota/src/lib/notes-sidebar-tree-styles.ts`, on line 10 of `treeFolderRowBase`, replace `transition-all` with `transition-colors`. No other edits in this file.

### 3. Green — confirm tests pass

Run `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-tree-styles` — all tests pass.

## Boundaries

- Do NOT touch `apps/nota/src/components/notes-sidebar-list.tsx` or any component markup.
- Do NOT change `before:transition-opacity`, chevron `transition-transform duration-200`, or drag-over variant class strings.
- Do NOT add new dependencies or motion tokens.
- Do NOT refactor `treeNoteRowBase` / `treeFolderRowBase` into shared helpers — one-word swap only.
- If `treeFolderRowBase` no longer contains `transition-all` at the commit stamp (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**
  - `pnpm exec nx test @getmadrid/nota --testPathPattern=notes-sidebar-tree-styles` — all green.
  - `pnpm exec nx lint @getmadrid/nota` — no new errors.
- **Feel check** — run `pnpm exec nx dev @getmadrid/nota`, open `#/notes` with folders:
  - Hover a folder row: the `::before` accent highlight should still fade in smoothly (opacity on pseudo unchanged).
  - Drag a note over a folder: text colour should still transition to primary foreground; no visible regression.
  - In DevTools → Elements, select a folder row `<div>`: computed `transition-property` on the main element should list colour-related properties only, **not** `all`.
  - In DevTools → Animations panel, set playback to 10% and hover a folder row: only opacity animates on the `::before` pseudo; main element does not animate layout properties.
  - Toggle `prefers-reduced-motion: reduce` in Rendering panel: hover highlight still works (opacity is retained per audit §6).
- **Done when**: `transition-all` is absent from `treeFolderRowBase`, the new spec test passes, and folder hover/drag-over feel unchanged in manual check.

## TDD strategy

| Phase    | Action                                                                                    | Expected                                           |
| -------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Red      | Add spec asserting `not.toContain('transition-all')` and `toContain('transition-colors')` | Test fails — folder row still has `transition-all` |
| Green    | Swap `transition-all` → `transition-colors` in `treeFolderRowBase`                        | Test passes                                        |
| Refactor | None required                                                                             | —                                                  |
