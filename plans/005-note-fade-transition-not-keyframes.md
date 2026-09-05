# 005 — Replace note-open keyframes with interruptible opacity transition

- **Status**: SUPERSEDED — use [002](./002-note-switch-no-keyframe-fade.md) instead (mutually exclusive; 002's instant swap path replaces this transition variant)
- **Commit**: 08ed1fa
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 2 files (~40 lines changed), optional 1 spec file

## Problem

Note switching in the main panel uses a CSS **keyframes** entrance that **restarts from zero** on every hop. Sidebar list navigation, command-palette `note-open:*` actions, Mod+[ / Mod+] history, and internal `@` links all change `routeNoteId` frequently (tens of times per day per active user). Each switch remounts the note body wrapper because of `key={displayNote.id}`.

**Why keyframes feel wrong here (AUDIT §4 — Interruptibility):** CSS **transitions** retarget from the current computed value mid-animation; **keyframes** always restart from the `from` block when a new animation begins. On rapid note hopping, the user sees repeated 400ms fade-ins that never complete — each remount discards the in-flight keyframe and starts again at `opacity: 0`.

**Locations:**

`apps/nota/src/components/note-detail-panel.tsx:434` — keyed wrapper around `NoteEditor`:

```tsx
<div key={displayNote.id} className="nota-note-open-fade">
```

`apps/nota/styles.css:21-40` — keyframe definition and class:

```css
/* Note open :  gentle reveal when switching notes */
@keyframes nota-note-open-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.nota-note-open-fade {
  animation: nota-note-open-fade 0.4s ease-in-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .nota-note-open-fade {
    animation: none;
    opacity: 1;
  }
}
```

**Related but out of scope:** `note-detail-panel.tsx:429` applies `transition-[max-width] duration-300 ease-in-out` on the layout width wrapper — that is a layout measure change, not the note-open fade. Do not modify it in this plan.

**Frequency context:** `NoteDetailPanel` itself is keyed only by `routeNoteId` from `notes-shell.tsx:517` and does not remount on every hop; only the inner `div` with `nota-note-open-fade` remounts when `displayNote.id` changes.

## Target

Replace the keyframe animation with an **opacity-only CSS transition** using AUDIT easing/duration values. Use **`@starting-style`** for mount entry (no JavaScript required with the existing `key={displayNote.id}` remount pattern).

**Exact end-state CSS** (replace `styles.css:21-40`):

```css
/* Note open — interruptible opacity reveal when switching notes */
.nota-note-open-fade {
  opacity: 1;
  transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

@starting-style {
  .nota-note-open-fade {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nota-note-open-fade {
    transition: none;
    opacity: 1;
  }
}
```

**Values (from AUDIT.md — do not approximate):**

| Property          | Value                            | AUDIT source                                               |
| ----------------- | -------------------------------- | ---------------------------------------------------------- |
| Duration          | `200ms`                          | Tooltips/small popovers budget (125–200ms); UI under 300ms |
| Easing (enter)    | `cubic-bezier(0.23, 1, 0.32, 1)` | Strong `--ease-out` for UI entrances                       |
| Property animated | `opacity` only                   | Performance §5 — GPU-friendly                              |

**Do not** use `var(--ease-out)` in this plan unless that custom property already exists at the commit stamp. At `08ed1fa` there is no shared `--ease-out` token in `apps/nota/styles.css` (token unification is `plans/007-unify-motion-easing-tokens.md`). Inline the cubic-bezier literal above.

**Do not** add `transform`, `scale`, or `translate` — this is a high-frequency content swap; opacity only.

**Markup:** Keep `key={displayNote.id}` and `className="nota-note-open-fade"` on `note-detail-panel.tsx:434` unchanged unless Step 4 fallback is required.

## Repo conventions to follow

- **CSS motion lives in `apps/nota/styles.css`** with co-located `@media (prefers-reduced-motion: reduce)` blocks — see `nota-pressable` / `nota-sidebar-row` at `styles.css:147-177`.
- **Reduced motion drops movement, keeps comprehension** — existing `nota-note-open-fade` reduced-motion block sets `opacity: 1`; preserve that behaviour (swap `animation: none` → `transition: none`).
- **Mechanical CSS contracts** — `apps/nota/src/lib/nota-interaction.spec.ts` reads `styles.css` and asserts class hooks + reduced-motion guards exist for micro-interaction classes. Extend the same pattern for `nota-note-open-fade` (see TDD below).
- **No GSAP on the editor surface** — settled product rule; this fix is pure CSS only.
- **Exemplar for interruptible mount entry:** AUDIT.md §4 recommends `@starting-style`; Emil pattern in `.agents/skills/emil-design-eng/SKILL.md` § “Animate enter states with @starting-style”.

## TDD strategy (red → green)

British spelling throughout test descriptions.

### Red (write failing tests first)

Add a new `describe` block to `apps/nota/src/lib/nota-interaction.spec.ts` (or create `apps/nota/src/lib/nota-note-open-fade.spec.ts` if you prefer isolation — either is fine):

```ts
describe('nota-note-open-fade', () => {
  it('uses an opacity transition instead of keyframe animation', () => {
    expect(stylesCss).toContain('.nota-note-open-fade');
    expect(stylesCss).not.toMatch(/@keyframes\s+nota-note-open-fade/);
    expect(stylesCss).toMatch(/\.nota-note-open-fade[\s\S]*transition:\s*opacity\s+200ms\s+cubic-bezier\(0\.23,\s*1,\s*0\.32,\s*1\)/);
  });

  it('declares @starting-style entry at opacity 0', () => {
    expect(stylesCss).toMatch(/@starting-style[\s\S]*\.nota-note-open-fade[\s\S]*opacity:\s*0/);
  });

  it('disables transition under prefers-reduced-motion', () => {
    expect(stylesCss).toMatch(/\.nota-note-open-fade[\s\S]*@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*transition:\s*none/);
  });
});
```

Run red:

```bash
pnpm exec nx test @getmadrid/nota --testPathPattern=nota-interaction
```

Expect failures: tests fail against current keyframe CSS.

### Green (implement CSS)

Apply Steps 1–3 below. Re-run the same command; all three tests pass.

### Refactor

None required beyond deleting the obsolete `@keyframes nota-note-open-fade` block. Do not introduce a parallel easing token in this plan (defer to `007`).

## Steps

1. **`apps/nota/styles.css`** — Delete the entire `@keyframes nota-note-open-fade { … }` block (`styles.css:22-29`).

2. **`apps/nota/styles.css`** — Replace `.nota-note-open-fade` rule (`styles.css:31-33`) with the target block from **Target** above (`opacity: 1` + `transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1)`).

3. **`apps/nota/styles.css`** — Insert `@starting-style { .nota-note-open-fade { opacity: 0; } }` immediately after the `.nota-note-open-fade` rule.

4. **`apps/nota/styles.css`** — Update the existing `@media (prefers-reduced-motion: reduce)` block for `.nota-note-open-fade` (`styles.css:35-39`): replace `animation: none` with `transition: none`; keep `opacity: 1`.

5. **`apps/nota/src/lib/nota-interaction.spec.ts`** (or new spec file) — Add the three tests from **TDD strategy** above.

6. **(Optional fallback — only if `@starting-style` fails manual QA in your target browsers)** — If mount entry does not animate in a supported browser, add a `data-mounted` fallback in `note-detail-panel.tsx`:
   - Import `useLayoutEffect`, `useState`.
   - On `displayNote.id` change: set `mounted` to `false`, then `requestAnimationFrame(() => setMounted(true))`.
   - Change wrapper to `className="nota-note-open-fade"` + `data-mounted={mounted || undefined}`.
   - Add CSS: `.nota-note-open-fade:not([data-mounted]) { opacity: 0; }`.
   - **Do not implement this step unless `@starting-style` fails in Chrome/Safari/Electron during feel-check.** At `08ed1fa`, `@starting-style` is supported in current Chromium (Electron) and Safari versions Nota targets.

## Boundaries

- **Cross-reference — `plans/002-note-switch-no-keyframe-fade.md` (Finding #2, HIGH, Purpose & frequency):** Both plans touch the same `nota-note-open-fade` hook. **Pick one execution path:**
  - **Plan 002 “instant swap” path:** Remove `nota-note-open-fade` class and CSS entirely. **Do not run plan 005** if 002 removes the fade.
  - **Plan 005 (this plan):** Keeps a brief opacity entrance but makes it interruptible via transition + `@starting-style`. **Do not run plan 002’s transition branch** if 005 is executed — they are duplicate fixes.
  - **Division of labour:** 002 owns the _frequency_ decision (fade vs instant). 005 owns the _mechanism_ (transition vs keyframes) when a fade is kept. If both exist in the backlog, **execute 005 OR 002, not both.**
- **Do NOT** modify `command-palette.tsx`, `notes-sidebar-list.tsx`, or navigation hash logic — they only trigger note switches; the fade hook is solely in `note-detail-panel.tsx` + `styles.css`.
- **Do NOT** change `key={displayNote.id}` unless Step 6 fallback requires it (it should not).
- **Do NOT** touch `NoteEditor`, TipTap extensions, or `transition-[max-width]` on the parent layout wrapper.
- **Do NOT** add npm dependencies or GSAP timelines.
- **Do NOT** add `transform` / `scale` entrance — modals exempt per AUDIT §3; this is not a modal.
- **Do NOT** create or edit `plans/007` token files as part of this plan; inline the cubic-bezier literal.
- If `styles.css` no longer matches the line numbers or class name at the commit stamp, **STOP and report drift** instead of improvising.

## Verification

- **Mechanical (red → green):**

  ```bash
  pnpm exec nx test @getmadrid/nota --testPathPattern=nota-interaction
  ```

  Expected: all tests pass, including the three new `nota-note-open-fade` assertions.

- **Mechanical (lint):**

  ```bash
  pnpm exec nx lint @getmadrid/nota
  ```

  Expected: no new errors.

- **Feel check** — run `pnpm exec nx dev @getmadrid/nota`, open `#/notes`, select a note with content:
  1. **Rapid note hopping:** Click 5–6 different notes in the sidebar as fast as possible (or hold ↓ through the list). Confirm fades feel **snappier** (200ms) and **do not “stack” sluggish 400ms ease-in-out pulses**. The last-selected note should reach full opacity quickly without waiting for prior animations to finish.
  2. **DevTools slow motion:** Animations panel → set playback to **10%**. Switch notes once. Confirm a single **opacity ramp** (not a named keyframe track restarting). Duration ≈ 200ms at normal speed.
  3. **Command palette:** Cmd/Ctrl+K → pick another note. Same behaviour as sidebar.
  4. **History shortcuts:** Mod+[ and Mod+] between recent notes — no visible “stuck at half fade” between hops.
  5. **Reduced motion:** DevTools → Rendering → `prefers-reduced-motion: reduce`. Switch notes. Content appears **instantly** at full opacity (no fade delay).
  6. **Editor focus:** After switching notes, typing in the body should work immediately — fade must not block interaction (opacity transition only; no `pointer-events` changes).

- **Done when:**
  - `@keyframes nota-note-open-fade` is removed from `styles.css`.
  - `.nota-note-open-fade` uses `transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1)` + `@starting-style { opacity: 0 }`.
  - Reduced-motion media query sets `transition: none; opacity: 1`.
  - Mechanical tests pass.
  - Feel-check rapid hopping no longer exhibits keyframe-style restart lag at 400ms.
