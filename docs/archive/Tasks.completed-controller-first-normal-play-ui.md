# Completed Tasks: Controller-First Normal-Play UI

Archived: 2026-07-04

## BS-156: Guild Registration Focus Model

- [x] Defined the guild flow as staged command windows: briefing, class,
  appearance, bonus, name, review.
- [x] Added keyboard/controller traversal expectations for next/back,
  confirm/cancel, list movement, and bounded message area.
- [x] Added `data-controller-surface` coverage to active guild steps so arrows
  traverse choices and Escape reaches staged back/cancel actions.
- [x] Checked red flags: step tabs, free cursor targeting, or form controls do
  not dominate normal character creation.
- [x] Verified with Playwright guild traversal and screenshot review.

## BS-157: Normal-Play Surface Audit

- [x] Audited town, dungeon, combat, shop, recovery, records, config,
  repeat/auto, and guild for mouse-first or web-admin residue.
- [x] Recorded each surface as pass/fail with browser-visible state:
  [../audits/controller-first-normal-play-audit.md](../audits/controller-first-normal-play-audit.md)
- [x] Checked red flags: logs/messages do not shift command windows, and focus
  order is covered by browser tests.
- [x] Updated affected E2E specs, including Japanese/mobile where labels or
  layout changed.

## BS-158: Controller Regression Gate

- [x] Added reusable E2E helper(s) for directional focus, confirm, cancel/back,
  and command stability.
- [x] Added a shared normal-play focus controller: Arrow keys move focus within
  active command surfaces; Enter/Space confirms focused controls; Escape
  activates surface cancel/back before shortcuts.
- [x] Ensured changed normal-play surfaces have keyboard/controller-style proof.
- [x] Stated what headless cannot prove for controller UX.
- [x] Verified with:
  - `npm test`
  - `npm run build`
  - `npm run test:e2e`
  - `npm run headless:reachability`
  - `git diff --check`

## Gate Note

Past trouble checked:

- Could recur: controller-first rule drift, web-admin residue, command shift,
  and headless overclaim.
- Gate used: Past Trouble Regression Gate, Human Requirement Gate,
  Player-Facing Red Flags, DRPG UX Gate.
- Browser evidence: controller E2E, screenshot review E2E, full E2E.
- Headless limitation: reachability only; not UX, layout, focus, or DRPG feel.
- Remaining UX risk: text entry and portrait import still use browser form
  controls, but only inside staged registration.
