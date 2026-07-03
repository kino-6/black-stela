# Grid Labyrinth Gate

This gate blocks dungeon work that models the maze as arbitrary connected
rooms. Use it for scenario data, movement rules, minimap, first-person render,
stair/return logic, and playtest claims.

## Blocking Checks

- [ ] The floor has explicit grid coordinates for every playable cell.
- [ ] Movement is adjacent by compass direction, except for declared stairs,
  one-way edges, shortcuts, or floor transitions.
- [ ] Walls, doors, locked edges, secret edges, and one-way edges are represented
  as cell-edge data, not implied by prose or arbitrary room links.
- [ ] Minimap reads explored grid cells and edge data directly.
- [ ] Unexplored cells remain hidden; unknown exits may be hinted only as
  current-cell/current-edge affordances.
- [ ] First-person rendering matches the current cell and facing direction.
- [ ] Stair, return, treasure, trap, and event commands appear only when the
  current cell or current edge makes the action physically believable.
- [ ] Browser E2E proves player-visible movement to stairs/downstairs/return,
  not just headless graph reachability.

## Red Flags

- `rooms[].exits` is the only topology source.
- A map or minimap creates coordinates as a visualization fallback.
- A room is treated as a place card with named exits instead of a cell in a
  continuous floor.
- A far object is visible but the current-cell action can use it immediately.
- The implementation says "reachable" when the browser player cannot see why.
- Tests use room ids as proof of playability.

## Required Evidence

- [ ] Scenario or schema diff showing coordinate/cell-edge topology.
- [ ] Unit test for adjacent movement and blocked walls.
- [ ] Unit or validation test rejecting arbitrary non-adjacent exits.
- [ ] Playwright route from town to a lower floor and back using normal
  controls.
- [ ] Screenshot or DOM assertion that minimap shows only explored nearby cells.
- [ ] Reviewer note states what headless proves and what browser play proves.
