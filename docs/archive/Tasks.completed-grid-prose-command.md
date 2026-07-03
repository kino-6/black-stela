# Completed Tasks: Grid, Prose, and Command Gate Pass

Completed: BS-128..BS-135, BS-141..BS-144.

## Summary

| ID | Outcome | Verification |
| --- | --- | --- |
| BS-128 | Added grid topology schema, cell ids, map cell state, and room-data compatibility. | `npm test -- tests/rulesEngine.test.ts tests/saveData.test.ts` |
| BS-129 | Added validation for grid cells, edge metadata, adjacent movement, and room/grid disagreement. | `npm test -- tests/scenarioPackLoader.test.ts` |
| BS-130 | Converted B1F to explicit grid cells, doors, return mark, and downstairs edge. | Browser B1F route in `tests/e2e/player-clear.spec.ts` |
| BS-131 | Movement state now carries room/cell/facing and visits grid cells. | `tests/rulesEngine.test.ts`, `tests/debugStart.test.ts` |
| BS-132 | Minimap reads authored grid coordinates and shows nearby explored cells only. | `tests/e2e/map.spec.ts` |
| BS-133 | First-person render reads current-cell edge state for front/side doors/openings and return marker. | `tests/e2e/rendering.spec.ts`, screenshot review |
| BS-134 | B2F-B8F now declare grid cells and edge metadata, including stairs, shortcuts, one-way, and locked edges. | Scenario pack loader and player B2F route tests |
| BS-135 | Authoring docs require `grid.cells`, edge metadata, adjacent movement, and browser proof. | `tests/scenarioAuthoringDocs.test.ts` |
| BS-141 | Added prose-gate regression test for translated/abstract dungeon patterns. | `tests/scenarioProseGate.test.ts` |
| BS-142 | Rewrote representative room prose away from `waits` / `待っている` patterns. | `tests/scenario.test.ts`, `tests/e2e/i18n.spec.ts` |
| BS-143 | Added command-window test ids and Playwright stability coverage. | `tests/e2e/combat.spec.ts` |
| BS-144 | Added keyboard/controller-style command flow for move, attack/defend, actor/target cycling, and stop/cancel. | `tests/e2e/combat.spec.ts`, `tests/e2e/tempo.spec.ts` |

## Gate Note

Past trouble checked:
- Could recur: room-card topology, graph-derived minimap, translated prose,
  shifting command surfaces, and mouse-only controls.
- Gate used: Past Trouble Regression, Grid Labyrinth, Scenario Prose, DRPG UX.
- Browser evidence: map, player-clear, rendering, combat, tempo, and i18n E2E.
- Headless limitation: reachability still proves route coverage only, not UX.
- Remaining UX risk: command UI is more keyboard-capable, but a full modal
  classic-RPG command/menu shell is still a future polish lane.
