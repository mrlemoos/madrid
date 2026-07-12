# 007 — Unify motion easing tokens

- **Status**: DONE
- **Commit**: 08ed1fa
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: ~6 files, small (token definition + consumer wiring)

## Problem

Nota runs **three parallel easing systems** for UI motion. Curves are near-cousins but not shared, so press feedback, shell chrome, and design-system buttons can feel subtly mismatched.

### 1. GSAP sine family (shell chrome — intentional)

`apps/nota/src/lib/nota-motion.ts` exports GSAP string eases for palette and sidebar tweens:

```ts
/* apps/nota/src/lib/nota-motion.ts:7-9 — current */
export const NOTA_MOTION_EASE_OUT = 'sine.out';
export const NOTA_MOTION_EASE_IN = 'sine.in';
export const NOTA_MOTION_EASE_IN_OUT = 'sine.inOut';
```

Used by `command-palette.tsx` and `notes-shell.tsx`. `nota-motion.spec.ts:29-33` **locks these to `sine.*`** with the comment _"uses sine eases for settled motion (no power2 snappiness)"_ and a **0.3–0.55s timing band** for shell/palette. This is deliberate product intent — **do not change**.

### 2. Hand-typed CSS cubic-bezier (micro-interactions)

`apps/nota/styles.css` `.nota-pressable` and auth enter animation use a strong custom curve that is **close to but not identical** to the audit target:

```css
/* apps/nota/styles.css:147-151 — current */
.nota-pressable {
  transition-property: transform, opacity, color, background-color, border-color, box-shadow;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
```

```css
/* apps/nota/styles.css:54-55 — current */
.nota-auth-card-enter {
  animation: nota-auth-card-enter 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

Sibling micro-interaction classes in the same block (`.nota-shell-nav-item`, `.nota-sidebar-row`, `.nota-cmdk-item`, resize handle) use the **weak built-in** keyword `ease-out`, not a shared token:

```css
/* apps/nota/styles.css:160-163 — current */
.nota-shell-nav-item {
  transition:
    background-color 200ms ease-out,
    color 200ms ease-out;
}
```

### 3. Tailwind built-in `ease-out` (web-design button)

`packages/web-design/src/components/button.tsx` uses Tailwind's default `ease-out` (`cubic-bezier(0, 0, 0.2, 1)` — much weaker than the pressable curve):

```tsx
/* packages/web-design/src/components/button.tsx:34 — excerpt */
'... transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out motion-safe:active:scale-[0.98] ...';
```

### No shared token today

`packages/web-design/src/theme-chrome.css` is imported by both `apps/nota/styles.css:3` and `apps/nota-marketing/src/styles/global.css:3`, but only defines `--background-hex` for Safari toolbar sampling — **no motion tokens**.

Marketing duplicates the old pressable curve locally as `--btn-ease: cubic-bezier(0.22, 1, 0.36, 1)` in `apps/nota-marketing/src/styles/global.css:64`.

### Why it matters

Press targets (`nota-pressable`, `NotaButton`, Clerk auth buttons) should share one strong ease-out. Shell chrome (sidebar width, palette backdrop) should stay on the calmer GSAP sine band. Without tokens, future edits will reintroduce drift.

## Target

Introduce **two shared CSS custom properties** (AUDIT.md exact values) in the cross-app theme chrome layer, wire CSS and Tailwind consumers to them, and **explicitly document the GSAP/CSS split** so `nota-motion.spec.ts` stays green.

```css
/* target — packages/web-design/src/theme-chrome.css */
:root,
html.light {
  --background-hex: #ffffff;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```

```css
/* target — apps/nota/styles.css micro-interactions */
.nota-pressable {
  transition-timing-function: var(--ease-out);
}

.nota-shell-nav-item {
  transition:
    background-color 200ms var(--ease-out),
    color 200ms var(--ease-out);
}

.nota-auth-card-enter {
  animation: nota-auth-card-enter 0.6s var(--ease-out) forwards;
}
```

```tsx
/* target — button keeps `ease-out` class; Tailwind maps it to the token via @theme */
'... duration-200 ease-out motion-safe:active:scale-[0.98] ...';
```

```ts
/* target — nota-motion.ts: GSAP constants UNCHANGED; add documentation only */
/** GSAP shell/palette eases — calm sine band; see nota-motion.spec.ts. Not CSS --ease-out. */
export const NOTA_MOTION_EASE_OUT = 'sine.out';
```

**Dual-system model (post-migration):**

| Layer                                  | Easing                     | Used for                                                    |
| -------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| CSS `--ease-out` / `--ease-in-out`     | Strong cubic-bezier tokens | Press, hover colour, buttons, auth enter, marketing buttons |
| GSAP `sine.*` via `NOTA_MOTION_EASE_*` | Calm sine curves           | Sidebar tween, command palette backdrop (0.3–0.55s band)    |

## Repo conventions to follow

- **Shared cross-app CSS** lives in `@nota/web-design/theme-chrome.css` (already imported before app styles). Mirror the `--background-hex` ↔ `theme-color.ts` sync pattern: add `packages/web-design/src/lib/motion-tokens.ts` as the TypeScript source of truth for testability; keep `theme-chrome.css` values identical.
- **Tailwind v4 `@theme inline`** in `apps/nota/styles.css:1020` bridges design tokens to utilities — add `--ease-out` and `--ease-in-out` there so `ease-out` / `ease-in-out` classes resolve to the strong curves (same pattern as `--font-sans`, `--color-background`).
- **Micro-interaction class names** are exported from `apps/nota/src/lib/nota-interaction.ts` — do not rename; only change CSS definitions in `styles.css`.
- **Exemplar for GSAP isolation**: `apps/nota/src/lib/nota-motion.spec.ts:17-33` — shell timings and sine eases are contractual; any new CSS token work must not alter these expectations.

## TDD strategy (red → green)

1. **Red** — Add `packages/web-design/src/lib/motion-tokens.spec.ts`:
   - Assert `NOTA_EASE_OUT === 'cubic-bezier(0.23, 1, 0.32, 1)'`
   - Assert `NOTA_EASE_IN_OUT === 'cubic-bezier(0.77, 0, 0.175, 1)'`
   - Run `pnpm exec nx test @nota/web-design` — fails (module/constants missing).

2. **Green** — Add `packages/web-design/src/lib/motion-tokens.ts` with those exports; copy values into `theme-chrome.css`; tests pass.

3. **Red** — Extend `apps/nota/src/lib/nota-motion.spec.ts` with one test documenting the split:

   ```ts
   it('keeps GSAP shell eases separate from CSS --ease-out tokens', () => {
     expect(NOTA_MOTION_EASE_OUT).toBe('sine.out');
     expect(NOTA_MOTION_EASE_OUT).not.toBe(NOTA_EASE_OUT);
   });
   ```

   Import `NOTA_EASE_OUT` from `@nota/web-design/motion-tokens` — fails until export path exists.

4. **Green** — Add `./motion-tokens` package export in `packages/web-design/package.json`; re-export in `nota-motion.ts` comment block only (GSAP constants unchanged); test passes.

5. **Green** — Wire CSS consumers (steps below); run full test + lint.

## Steps

1. **Add TypeScript token module** — create `packages/web-design/src/lib/motion-tokens.ts`:

   ```ts
   /** Canonical easing strings — keep in sync with theme-chrome.css */
   export const NOTA_EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
   export const NOTA_EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
   ```

2. **Add package export** — in `packages/web-design/package.json` `exports`, add:

   ```json
   "./motion-tokens": {
     "@nota/source": "./src/lib/motion-tokens.ts",
     "types": "./dist/lib/motion-tokens.d.ts",
     "import": "./dist/motion-tokens.js",
     "default": "./dist/motion-tokens.js"
   }
   ```

   Ensure `vite build` / `tsc` pick up the new entry (match `./theme-color` pattern).

3. **Add vitest spec** — `packages/web-design/src/lib/motion-tokens.spec.ts` with AAA sections per repo convention.

4. **Define CSS tokens** — in `packages/web-design/src/theme-chrome.css`, under the existing `:root, html.light` block, append:

   ```css
   --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
   --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
   ```

   Add comment: `/* Motion eases — keep in sync with motion-tokens.ts */`

5. **Bridge Tailwind utilities (nota app)** — in `apps/nota/styles.css` `@theme inline` block (~line 1020), add:

   ```css
   --ease-out: var(--ease-out);
   --ease-in-out: var(--ease-in-out);
   ```

   This overrides Tailwind's weak default `ease-out` / `ease-in-out` with the strong tokens for any `ease-out` class in the nota app (including `NotaButton`).

6. **Bridge Tailwind utilities (marketing)** — in `apps/nota-marketing/src/styles/global.css` `@theme inline` block (~line 10), add the same two lines.

7. **Migrate nota micro-interactions** — in `apps/nota/styles.css`, within the block starting at the comment `App micro-interactions` (~line 143), replace:
   - `.nota-pressable` `transition-timing-function`: `cubic-bezier(0.22, 1, 0.36, 1)` → `var(--ease-out)`
   - `.nota-shell-nav-item`, `.nota-sidebar-row`, `.nota-cmdk-item`, `.nota-sidebar-resize-handle::after`: bare `ease-out` → `var(--ease-out)`
   - `.nota-auth-card-enter`: `cubic-bezier(0.22, 1, 0.36, 1)` → `var(--ease-out)`
   - `.nota-note-open-fade` animation (~line 32): `ease-in-out` → `var(--ease-in-out)` (on-screen movement)
   - `.nota-save-pulse` animation (~line 196): keep `ease-in-out` keyword OR switch to `var(--ease-in-out)` for consistency (either is fine; prefer token)

8. **Marketing button ease** — in `apps/nota-marketing/src/styles/global.css`, change:

   ```css
   --btn-ease: cubic-bezier(0.22, 1, 0.36, 1);
   ```

   to:

   ```css
   --btn-ease: var(--ease-out);
   ```

9. **Document GSAP/CSS split in nota-motion.ts** — add a file-level comment above the `NOTA_MOTION_EASE_*` exports explaining that these are GSAP-only shell eases (sine band, tested in spec) and that CSS micro-interactions use `@nota/web-design` `--ease-out` / `--ease-in-out`. **Do not change the constant values.**

10. **Extend nota-motion.spec.ts** — add the "keeps GSAP shell eases separate from CSS tokens" test (step 3 above). Existing sine and timing-band tests must remain untouched.

11. **Button.tsx** — no string change required if step 5 succeeds (`ease-out` class now maps to token). Verify after `@theme` bridge; if Tailwind does not pick up the override in the web-design package build context, change the CVA string to `ease-[var(--ease-out)]` explicitly.

## Boundaries

- **Do NOT** change `NOTA_MOTION_EASE_OUT` / `NOTA_MOTION_EASE_IN` / `NOTA_MOTION_EASE_IN_OUT` values or GSAP `ease:` call sites in `command-palette.tsx` / `notes-shell.tsx`.
- **Do NOT** modify shell/palette **durations** (`NOTA_PALETTE_ENTER_S`, `NOTA_SIDEBAR_S`, etc.).
- **Do NOT** touch folder-tint / journal chrome transitions in `styles.css` below ~line 569 (`cubic-bezier(0.4, 0, 0.2, 1)` block) — separate finding; out of scope.
- **Do NOT** change `packages/editor` or scattered `ease-out` Tailwind classes in feature components (`note-image-lightbox.tsx`, `note-detail-panel.tsx`) — follow-up unless they are in the micro-interactions block.
- **Do NOT** edit `.claude/skills/transitions-dev/` or other skill reference CSS.
- **Do NOT** add npm dependencies.
- If `theme-chrome.css` or `nota-motion.ts` drift from this plan at the commit stamp, **STOP and report** rather than improvising.

## Verification

- **Mechanical**:

  ```bash
  pnpm exec nx test @nota/web-design --outputStyle=static
  pnpm exec nx test @nota/nota --testPathPattern=nota-motion --outputStyle=static
  pnpm exec nx run-many -t lint --projects=@nota/web-design,@nota/nota --outputStyle=static
  ```

  All pass; existing `nota-motion.spec.ts` sine/timing tests unchanged and green.

- **Token presence** — in DevTools on `http://localhost:4200`, inspect `:root` computed styles:
  - `--ease-out` resolves to `cubic-bezier(0.23, 1, 0.32, 1)`
  - `--ease-in-out` resolves to `cubic-bezier(0.77, 0, 0.175, 1)`

- **Feel check**:
  - **Buttons**: Click `NotaButton` in Settings and a `.nota-pressable` Clerk auth control — press scale should feel identical (same snap on `:active`).
  - **Sidebar**: Toggle notes sidebar — motion should feel **unchanged** (still calm ~450ms sine ease; not snappier).
  - **Command palette**: Open/close with Cmd/Ctrl+K — backdrop motion unchanged (sine.out / sine.in).
  - DevTools → Animations → 10% playback: press feedback completes in ~200ms with a fast start; sidebar width tween remains slower and softer.
  - Rendering → `prefers-reduced-motion: reduce`: `.nota-pressable:active` still has `transform: none`; sidebar jumps instantly (existing behaviour).

- **Done when**: One canonical `--ease-out` / `--ease-in-out` in `theme-chrome.css`; micro-interaction CSS and marketing `--btn-ease` reference tokens; Tailwind `ease-out` maps to strong curve in nota + marketing; GSAP sine constants and their spec tests untouched; new `motion-tokens` spec green.
