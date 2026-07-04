# Completed Tasks: Combat Cockpit and Map Repair

Archived from `Tasks.md` after implementing Lane S.

## BS-171: Combat Enemy Presentation Gate

- [x] Ground enemy visuals in the first-person scene with a contact/shadow cue.
- [x] Hide exact enemy HP from normal combat UI; show count and coarse condition.
- [x] Red flag: enemy appears to float or combat UI exposes raw HP.
- [x] Verification: combat E2E and screenshot review cover enemy presentation.

## BS-172: Controller-First Combat Targeting

- [x] Remove clickable enemy target cards from normal combat.
- [x] Add a command-window target-cycle action and keyboard/controller path.
- [x] Red flag: free mouse cursor chooses the target directly.
- [x] Verification: Playwright proves target cycling and attack ordering.

## BS-173: Combat Viewport Fit

- [x] Keep combat scene, formation, message, order, and commands within one
  desktop viewport.
- [x] Keep command window stable after orders/results.
- [x] Red flag: core combat loop requires scrolling on desktop.
- [x] Verification: E2E asserts viewport fit and stable command position.

## BS-174: Combat Minimap Removal

- [x] Hide minimap/navigation board while combat is active.
- [x] Keep first-person enemy view and formation as the combat context.
- [x] Red flag: mapping UI competes with combat decisions.
- [x] Verification: E2E asserts no minimap during combat.

## BS-175: Grid-Tile Minimap Presentation

- [x] Render minimap as compact contiguous grid tiles from coordinates/edges.
- [x] Remove node-like spacing/connector strokes in normal exploration.
- [x] Red flag: minimap looks like a graph of linked cards.
- [x] Verification: map E2E asserts compact tile grid and no node connectors.

## BS-176: Combat Cockpit Regression Gate

- [x] Add the new combat/minimap failures to Past Trouble Regression Gate.
- [x] Add browser-visible evidence and headless limitation note in tests/docs.
- [x] Verification: `npm test`, `npm run build`, `npm run test:e2e`,
  `npm run headless:reachability`, `git diff --check`.
