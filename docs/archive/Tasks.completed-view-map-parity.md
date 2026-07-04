# Completed Tasks: First-Person View and Minimap Parity

Completed: BS-145..BS-148.

## Summary

| ID | Outcome | Verification |
| --- | --- | --- |
| BS-145 | Added a grid-derived dungeon view model for front/left/right edge affordances. | `tests/e2e/player-clear.spec.ts` |
| BS-146 | Rendered blocked forward edges as near front walls while open/door edges remain distinct. | Screenshot review: `desktop-return-stair-front-wall.png` |
| BS-147 | Added browser coverage that minimap facing, view front edge, and blocked Move behavior agree. | `npm run test:e2e -- tests/e2e/player-clear.spec.ts` |
| BS-148 | Archived Lane M and updated Plan/Tasks traceability. | `Tasks.md`, `Plan.md` |

## Gate Note

Past trouble checked:
- Could recur: first-person view implied a corridor even when the grid/minimap
  and movement rules blocked forward movement.
- Gate used: Past Trouble Regression and Grid Labyrinth.
- Browser evidence: B1F Black Marker, facing north, has `data-front-edge=wall`,
  minimap facing north, and Move keeps the party in Black Marker with a wall
  message.
- Headless limitation: reachability still proves routes only, not visual
  agreement.
- Remaining UX risk: Move still exists as a bump-into-wall command, which is
  classic-DRPG-compatible but should stay visually supported by clear wall art.
