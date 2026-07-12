# 002 — Remove note-switch keyframe fade (instant swap)

- **Status**: DONE
- **Commit**: 08ed1fa
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~25 lines removed

## Problem

Opening a different note is a **high-frequency** navigation action: sidebar clicks, command palette `note-open:*`, backlinks, Mod+[ / Mod+] history, Mod+D today's note, graph node clicks, and create-note redirects all change `routeNoteId` while staying on the notes shell's `note` panel. Per AUDIT.md category 1, elements used **tens of times per day** should have animation removed or drastically reduced; keyboard-driven history navigation is in the **100+ times/day** band where animation is never appropriate.

The current implementation couples a React remount key with a CSS keyframe fade, producing a 400 ms opacity ramp on every switch. Rapid sidebar hopping restarts the animation from `opacity: 0` each time because keyframes do not retarget mid-flight.

| Audit rule | Current value | Budget / target |
| --- | --- | --- |
| Purpose & frequency (tens+/day sidebar nav) | 400 ms fade on every note switch | Remove or drastically reduce |
| UI duration budget | `0.4s` (400 ms) | UI animations stay under 300 ms |
| Interruptibility | `@keyframes` + `key={displayNote.id}` remount | CSS **transitions** retarget; keyframes restart from zero |
| Easing on enter | `ease-in-out` on fade-in | Entering/exiting → **`ease-out`** (`cubic-bezier(0.23, 1, 0.32, 1)`) — but frequency rule overrides: **delete the animation** |

**Location 1:** `apps/nota/src/components/note-detail-panel.tsx:434` — wrapper forces remount and applies fade class:

```tsx
        <div key={displayNote.id} className="nota-note-open-fade">
          <NoteEditor
            note={displayNote}
```

**Location 2:** `apps/nota/styles.css:21–40` — keyframe definition and reduced-motion override:

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

**Why `key={displayNote.id}` is redundant for editor sync:** TipTap already swaps document content when `noteId` changes (`packages/editor/src/components/tiptap-editor.tsx:465–471` calls `editor.commands.setContent` when `noteId !== prevNoteIdRef.current`). `NoteEditor` resets local title/debounce/guard state on `note.id` change (`apps/nota/src/components/note-editor.tsx:195–219`). The React `key` only forces a full subtree remount on top of that — heavier than necessary and retriggers the keyframe from zero.

**Scope note:** `NoteDetailPanel` stays mounted when switching notes (`apps/nota/src/components/notes-shell.tsx:516–517` passes a new `noteId` prop to the same component instance). Only the inner wrapper remounts today because of `key`.

## Target

Note switches are **instant** for all users: new note title and body appear on the same frame as the hash/route update, with no opacity ramp, no keyframe restart, and no forced remount of `NoteEditor`.

**Behaviour:**

- Click note A → note B in the sidebar: B's content is immediately visible at full opacity.
- Spam-click five different notes within one second: each switch shows the latest note instantly; no stacked fades, no flash-to-black between notes.
- Mod+[ / Mod+] through history: same instant swap.
- `prefers-reduced-motion: reduce`: identical to default (already instant via the existing media query — that block is deleted with the animation).

**Target markup** (`note-detail-panel.tsx:434`):

```tsx
        <div>
          <NoteEditor
            note={displayNote}
```

(Keep the wrapper `div` — it groups `NoteEditor` and conditional `NoteBacklinksPanel`. Remove `key` and `className` only.)

**Target CSS:** delete the entire `nota-note-open-fade` block from `styles.css` (lines 21–40 at commit `08ed1fa`, including the comment, `@keyframes`, class rule, and `@media (prefers-reduced-motion)` override). No replacement animation.

**Explicitly rejected alternative:** an opacity-only CSS `transition` (e.g. `transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)`) would still add perceptible lag on tens-of-times-per-day navigation and requires React state or remount tricks to retrigger. Do not implement unless product explicitly reverses this plan.

## Repo conventions to follow

- **Motion tokens:** shared durations live in `apps/nota/src/lib/nota-motion.ts`; CSS keyframes for one-off surfaces live in `apps/nota/styles.css` (auth card enter at `styles.css:42–64` is an exemplar for *retained* rare-first-visit motion — note switching should not follow that pattern).
- **Editor sync without remount:** workspace rule — TipTap `setContent` on `noteId` change, not every list refresh. Removing `key` aligns with `packages/editor/src/components/tiptap-editor.tsx:463–482`.
- **Reduced motion:** AUDIT.md §6 — keep comprehension-aiding feedback, drop decorative movement. Here the movement *is* the entire animation; deletion satisfies both default and reduced-motion users.
- **No GSAP on editor surface:** workspace rule; this fix is CSS + one JSX attribute removal only.
- **British spelling** in any new comments (if added): e.g. "behaviour", not "behavior".

## Steps

1. **`apps/nota/src/components/note-detail-panel.tsx:434` — remove remount key and fade class**
   - Change `<div key={displayNote.id} className="nota-note-open-fade">` to `<div>`.
   - Do not add `key` elsewhere on `NoteEditor` or `NoteBacklinksPanel`.

2. **`apps/nota/styles.css:21–40` — delete note-open fade rules**
   - Remove the comment `/* Note open :  gentle reveal when switching notes */`.
   - Remove `@keyframes nota-note-open-fade { … }`.
   - Remove `.nota-note-open-fade { animation: … }`.
   - Remove the `@media (prefers-reduced-motion: reduce)` block for `.nota-note-open-fade`.
   - Leave the auth card keyframes (`nota-auth-card-enter`) untouched.

3. **Confirm zero remaining references**
   - Run: `rg 'nota-note-open-fade' apps/nota` — expect no matches after the edit.

## TDD strategy (red → green)

This change is mostly deletions; guard against regression with a cheap static check rather than animating in jsdom.

| Phase | Action | Expected |
| --- | --- | --- |
| **Red** | Before edits, `rg 'nota-note-open-fade' apps/nota` | 2 files: `styles.css`, `note-detail-panel.tsx` |
| **Red** | (Optional) add a one-line Vitest in `note-detail-panel` spec if one is created later: assert rendered wrapper lacks `nota-note-open-fade` class | Fails today |
| **Green** | Apply steps 1–2 | `rg` returns no matches; optional spec passes |
| **Green** | `pnpm exec nx test @nota/nota --testPathPattern=note-detail` (if spec exists) or full `@nota/nota` test target | All pass |
| **Green** | `pnpm exec nx build @nota/nota` | Succeeds |

No new dependencies. Do not add animation assertions to jsdom tests — motion correctness is manual feel-check only.

## Boundaries

- Do NOT touch `apps/nota/src/components/notes-shell.tsx` sidebar GSAP animation.
- Do NOT add replacement CSS transitions or keyframes on note switch.
- Do NOT change `NoteEditor`, TipTap extensions, or `tiptap-editor.tsx` sync logic.
- Do NOT change hash navigation (`app-navigation.ts`) or sidebar link markup.
- Do NOT add scroll-to-top on note switch unless feel-check proves a regression (scroll position on `<main>` is unchanged by this plan; fixing scroll is a separate task).
- Do NOT modify `nota-auth-card-enter` or other unrelated keyframes in `styles.css`.
- If file contents differ from excerpts above (drift since commit `08ed1fa`), STOP and report instead of improvising.

## Verification

- **Mechanical:**
  - `rg 'nota-note-open-fade' apps/nota` — no matches.
  - `pnpm exec nx lint @nota/nota` — no unused class / import errors.
  - `pnpm exec nx test @nota/nota` — all existing tests pass (no dedicated `note-detail-panel` spec at `08ed1fa`; full app test target is sufficient).
  - `pnpm exec nx build @nota/nota` — succeeds.

- **Feel check:** run `pnpm exec nx dev @nota/nota`, sign in with notes entitled, open any note:
  - **Rapid sidebar hopping:** click five different notes in the sidebar as fast as possible. Each switch shows the new title and body **immediately** — no 400 ms fade-in, no momentary blank/ghost content, no "trailing" fade from the previous note.
  - **History keyboard:** type in note A, open note B, press Mod+[ — note A appears instantly; Mod+] back to B — instant again. Repeat 5× rapidly: no animation queue.
  - **Command palette:** Cmd/Ctrl+K → pick another note via search — instant content swap when the palette closes.
  - **Backlinks:** open a note with backlinks, click a backlink — instant navigation to target note.
  - **Long note scroll:** open a long note, scroll halfway down, switch to another note via sidebar — confirm the new note's content is readable (note scroll position on `<main>` may persist; that is pre-existing behaviour, not a failure of this plan unless content is visibly wrong *because of* a fade).
  - **DevTools → Animations panel** at 10% playback: switch notes — **no** `nota-note-open-fade` keyframes fire (contrast with auth screen card enter if you navigate to sign-in).
  - **DevTools → Rendering → `prefers-reduced-motion: reduce`:** note switching identical to default (instant).

- **Done when:**
  - `nota-note-open-fade` is fully removed from the repo.
  - `note-detail-panel.tsx` wrapper has no `key={displayNote.id}` and no fade class.
  - Rapid note hopping feels snappy and interruptible — like Raycast/Notion-style instant document swap, not a slideshow.
