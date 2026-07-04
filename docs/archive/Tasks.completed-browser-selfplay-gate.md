# Completed Tasks: Browser Self-Play Gate

Archived: 2026-07-04

## BS-177: Browser Self-Play Contract

- [x] Defined Browser Self-Play as browser-visible normal play, not engine
  reachability.
- [x] Stated forbidden shortcuts: debug progress, direct `GameState` mutation,
  scenario-truth route skipping, hidden command dispatch.
- [x] Defined player-facing failure categories: blocked control, visual
  mismatch, localization leak, layout overflow, command shift, impossible route,
  hidden affordance.
- [x] Verified gate/README wording distinguishes Browser Self-Play from
  `headless:reachability`.

## BS-178: Self-Play Route Spec

- [x] Added a Playwright self-play spec that starts from the title screen and
  uses normal controls only.
- [x] Route creates/accepts a six-person party, enters dungeon, resolves visible
  combat, moves through authored cells, uses visible stair/return affordances,
  and visits town services after return.
- [x] Asserts no debug/admin/provider/save-slot controls appear during normal
  play.
- [x] Verified with `npm run selfplay:browser`.

## BS-179: Self-Play Evidence Artifacts

- [x] Captures screenshots under `test-results/selfplay/` for title, guild,
  dungeon, combat, return/stair, post-return town, shop, and recovery.
- [x] Emits compact JSON and Markdown route reports with commands taken,
  screenshots written, final state, and failure category.
- [x] Keeps artifacts git-ignored under `test-results/`.
- [x] Verified artifact paths are produced by the self-play command.

## BS-180: Self-Play Command and Docs

- [x] Added `npm run selfplay:browser`.
- [x] Documented when to run it in `README.md`, `Tasks.md`, and gate docs.
- [x] Made clear that Headless proves reachability only, while Browser Self-Play
  proves visible browser operation for the covered route.
- [x] Verified command appears in README and package scripts.

## BS-181: Self-Play Gate Integration

- [x] Updated Past Trouble Regression Gate / Human Requirement Gate references
  so future player-facing completion claims require Browser Self-Play when the
  normal route is touched.
- [x] Added a reusable audit note template for Browser Self-Play evidence.
- [x] Kept Japanese/mobile checks separate when copy or compact layout changes.
- [x] Verified gate docs mention Browser Self-Play without replacing screenshot
  review or E2E suites.

## BS-182: Self-Play Verification Pass

- [x] Ran `npm run selfplay:browser`.
- [x] Ran `npm run test:e2e`.
- [x] Ran `npm test`.
- [x] Ran `npm run build`.
- [x] Ran `git diff --check`.
- [x] Ran `npm run headless:reachability` and recorded Headless as reachability
  only.

## Gate Note

Past trouble checked:

- Could recur: Headless overclaim, claiming done without browser UI, hidden
  affordances, command shift, and impossible route.
- Gate used: Past Trouble Regression Gate, Human Requirement Gate,
  Player-Facing Red Flags, DRPG UX Gate, Grid Labyrinth Gate, Screenshot Review,
  Browser Self-Play Gate.
- Browser evidence: `npm run selfplay:browser`, `npm run test:e2e`, screenshot
  artifacts in `test-results/selfplay/`.
- Headless limitation: reachability only; not UX, focus, layout, visual
  affordance, or player understanding.
- Remaining UX risk: this route is curated; future changed routes still need
  their own Self-Play or targeted browser evidence.
