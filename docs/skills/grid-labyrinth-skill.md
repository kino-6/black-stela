# Grid Labyrinth Skill

Use this skill before changing dungeon data, movement, mapping, minimap,
stairs, doors, traps, secret passages, or first-person dungeon rendering.

Start by using `docs/skills/black-stela-gate-review-skill.md`; it routes this
review through the Past Trouble Regression Gate, Human Requirement Gate, and
Grid Labyrinth Gate.

## Goal

Black Stela's labyrinth must feel like a first-person grid DRPG dungeon, not a
set of named rooms connected like a web site or node graph. The player should
believe the party stands in one cell, faces one direction, reads walls/doors in
front of them, maps nearby explored cells, and reaches stairs or return marks
only by standing on the correct cell.

## Contract

- The authoritative dungeon model is floor + grid coordinate + cell edges.
- A cell may contain room prose, encounter/trap/treasure, stairs, return mark,
  dark-zone, one-way edge, locked edge, secret edge, or shortcut metadata.
- Movement is cell-to-adjacent-cell only unless a declared special edge says
  otherwise.
- Exits are walls/doors/edges, not arbitrary links to distant room ids.
- The minimap renders explored cells from grid coordinates. It must not infer a
  layout by walking a graph.
- First-person view must be derived from the current cell and facing direction:
  front wall/door/corridor, side walls/doors, and on-cell objects.
- Stairs/return actions are available only when the current cell contains that
  object. A visible far object cannot be usable unless the party stands there.
- Headless reachability is allowed, but it is not proof of grid honesty.

## Red Flags

- A floor file contains only `rooms` with `exits` and no grid/cell coordinates.
- A minimap function assigns fallback coordinates to disconnected room ids.
- A player can use stairs, return, treasure, or a gate because the graph says
  so, while the current cell view does not support that action.
- The UI displays raw floor/room ids, route labels, or "visited rooms" instead
  of mapped cells, walls, doors, and on-cell landmarks.
- Browser tests only assert that a route can clear, not that movement is
  adjacent and visible.

## Design Loop

1. Draw the floor as a small grid first: entrance, loop, branch, shortcut,
   stairs down, return route, risk/reward cell.
2. Mark each cell's edges: wall, open, door, locked, secret, one-way, or stair
   transition.
3. Add content to cells after the topology is valid.
4. Verify that every interactable action comes from the current cell.
5. Verify the same route through keyboard/controller-style browser input.
6. Only then allow headless reachability to validate broad path coverage.

## Acceptance Checks

- [ ] Every authored floor has explicit coordinates for playable cells.
- [ ] Every movement changes position by one adjacent cell or a declared stair /
  shortcut transition.
- [ ] Minimap uses the same coordinates as the movement model.
- [ ] Unexplored cells are not rendered as known topology.
- [ ] Stairs, return marks, doors, traps, and treasure are current-cell or
  current-edge affordances.
- [ ] Browser E2E proves a normal player can reach the next floor and return
  without debug-only graph knowledge.
