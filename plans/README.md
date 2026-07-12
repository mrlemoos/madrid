# Animation improvement plans

Self-contained execution plans from the `improve-animations` audit (@ commit `08ed1fa`). Each plan is written for a zero-context executor agent. **Do not modify source outside a plan's scope.**

## Plan index

| #   | Title                                                                                   | Severity | Status            | Depends on                                      |
| --- | --------------------------------------------------------------------------------------- | -------- | ----------------- | ----------------------------------------------- |
| 001 | [Make command palette open/close instant](./001-command-palette-instant-keyboard.md)    | HIGH     | DONE              | —                                               |
| 002 | [Remove note-switch keyframe fade](./002-note-switch-no-keyframe-fade.md)               | HIGH     | DONE              | —                                               |
| 003 | [Palette exit uses ease-out, not ease-in](./003-palette-exit-ease-out.md)               | HIGH     | DONE              | 001 (or moot if 001 lands)                      |
| 004 | [Sidebar transform, not width tween](./004-sidebar-transform-not-width.md)              | MEDIUM   | DONE              | —                                               |
| 005 | [Note-open keyframes → opacity transition](./005-note-fade-transition-not-keyframes.md) | MEDIUM   | SUPERSEDED by 002 | —                                               |
| 006 | [Sidebar folder row: drop transition-all](./006-sidebar-folder-no-transition-all.md)    | MEDIUM   | DONE              | —                                               |
| 007 | [Unify motion easing tokens](./007-unify-motion-easing-tokens.md)                       | MEDIUM   | TODO              | —                                               |
| 008 | [Popup surfaces: explicit duration + ease-out](./008-popover-explicit-duration-ease.md) | MEDIUM   | DONE              | 007 (optional)                                  |
| 009 | [Cap shell and palette durations](./009-cap-shell-palette-durations.md)                 | LOW      | DONE              | 001, 004                                        |
| 010 | [Remove dead button motion constants](./010-remove-dead-button-motion-constants.md)     | LOW      | TODO              | —                                               |
| 011 | [Guard chevron transform under reduced motion](./011-chevron-reduced-motion.md)         | LOW      | TODO              | —                                               |
| 012 | [Add lightbox enter/exit motion](./012-lightbox-enter-exit-motion.md)                   | LOW      | TODO              | 007 (optional)                                  |
| 013 | [Animate folder branch expand/collapse](./013-folder-branch-expand-motion.md)           | LOW      | TODO              | 006, 011                                        |
| 014 | [Crossfade journal month grid](./014-journal-month-grid-crossfade.md)                   | LOW      | TODO              | —                                               |
| 015 | [Extract shared popup motion class](./015-shared-popup-motion-class.md)                 | LOW      | SUPERSEDED by 008 | 008 (optional; 015 subsumes 008 for four files) |

## Recommended execution order

Execute in phases by leverage. Within a phase, order is flexible unless **Depends on** says otherwise.

### Phase 1 — High-frequency feel (do first)

1. **001** — Cmd/Ctrl+K palette: snap open/close (unblocks **003**, **009**).
2. **002** — Note navigation: **instant swap** (HIGH frequency audit). Do **not** execute **005** (transition variant for the same surface).
3. **003** — Palette exit easing (skip if **001** removed all palette GSAP).

### Phase 2 — Performance and tokens

4. **006** — Folder row `transition-all` → targeted properties.
5. **004** — Sidebar width GSAP → compositor-friendly transform (feeds **009**).
6. **007** — Shared `--ease-out` / `--ease-in-out` CSS tokens.

### Phase 3 — Popup cohesion

7. **008** — Add `duration-200 ease-out` to popup surfaces, _or_ skip straight to **015** (which includes the same timing in `NOTA_POPUP_MOTION_CLASS`).
8. **015** — `NOTA_POPUP_MOTION_CLASS` in `@nota/web-design`; dedupe `hover-card`, `context-menu`, `theme-menu`, `note-image-extension`.

### Phase 4 — Polish and additive delight

9. **009** — Cap palette/sidebar GSAP durations (only if motion kept after **001** / **004**).
10. **010** — Delete unused `NOTA_BUTTON_PRESS_S` / `NOTA_BUTTON_RELEASE_S`.
11. **011** — Chevron `motion-safe:` guard.
12. **012** — Lightbox enter/exit (rare, high-emotion).
13. **013** — Folder branch expand motion (watch high-frequency risk).
14. **014** — Journal month grid crossfade.

## Dependency graph (summary)

```
001 ──┬──► 003
      └──► 009

002 ◄──► 005   (mutually exclusive strategies — pick one)

004 ──► 009

007 ──┬──► 008 ──┬──► 015
      └──► 012   └──► (015 subsumes 008 for four popup files)

006 ──► 013 ◄── 011
```

## Notes

- **005 superseded by 002:** Plans **002** and **005** are mutually exclusive strategies for the same `nota-note-open-fade` surface. Execute **002** (instant swap); do not execute **005** (opacity transition variant).
- **Tension:** `nota-motion.spec.ts` deliberately locks a slow sine band (≥300 ms). Plans **001**, **009**, and **007** document this; resolve consciously (instant palette vs capped durations vs token unification).
- **Reconcile:** After execution, run `improve-animations reconcile` to mark plans DONE and refresh line numbers.
- **Execute one plan:** `improve-animations execute 001` (or point any agent at a single plan file).
