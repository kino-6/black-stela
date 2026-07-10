# Completed: Difficulty Pressure, Full Maze Rollout, Playability & App Decomposition

Archived: 2026-07-10

Active plan: [../../Plan.md](../../Plan.md) · Index:
[Plan.completed-index.md](Plan.completed-index.md)

This milestone turned the dungeon from "wide open rooms" into a real labyrinth,
put honest difficulty pressure on under-strength descents, made combat
keyboard/controller-playable with playtest aids, and began decomposing the
`App.tsx` God component. Combed from git log (commits `f3f9d77` → `52cb3c6`),
grouped by theme. All slices shipped to `main`; suite green (243 unit + 59 e2e).

## A. Dungeon-design Gate + B1F maze rebuild

Goal: stop accepting "just a wide room" as a DRPG floor.

- [x] Freed the B1F descent; removed the contrived exploration-ratio lock; codified
  dungeon-design rules as `tests/dungeonDesign.test.ts` (the "Gate") over
  `src/domain/floorGraph.ts` (`analyzeFloorGraph`, `fullSweepSteps`). (`f3f9d77`,
  `2260e45`, `818fa27`, `5167167`, `016a397`)
- [x] Rebuilt B1F as a generated 棒倒し法 (rod-falling) perfect maze + carved 玄室
  chambers via `scripts/genFloorMaze.mjs` (deterministic by seed). (`e2371a0`)
- Gate rules: dense (cells ≥80), non-linear (loops ≥4), reward dead-ends, no
  contrived descent lock, and (for redesigned floors) honest full-sweep 300–360.

## B. Full B1F–B8F maze rollout

Goal: every floor is a real maze, not a corridor or open hall.

- [x] All eight floors converted to generated mazes: B1F `e2371a0`, B2F `b2d6252`,
  B3F `8bdab2b`, B4F `a9969bb`, B5F `c31009c`, B6F `7403ff8`, B7F `c27f3a6`,
  B8F `a5dea1d`. Seeds recorded in `[[black-stela-dense-floors]]` memory.
- [x] `scripts/placeFloor.mjs` — placement/validation helper: `--glyph` emits a
  glyphed map from a coord→glyph assignment; `--sole` verifies a boss/toll is the
  *sole approach* to a descent; `--appendage`/carve for isolated vault pockets.
- Per-floor invariants: safe (no-encounter) stair landing; one sole-approach
  boss/toll choke to the descent; one searchable secret vault via a `secret` edge
  overriding a dead-end's single connection. Runtime honest full-sweep 292–338.
- B7F's full-frame maze left no isolated pocket, so its ash-vault distributes into
  the gallery (locked reliquary + secret caches as sealed dead-ends).

## C. Difficulty pressure (#3 pack scaling, #4 squads)

Goal: punish under-strength descents and kill Repeat-spam, without a gate.

- [x] #3 — `underpowerFactor`/`scaledEncounterCount`: rolled encounters scale with
  BOTH party-level and party-size shortfall (B1F unscaled; B2F+ punish solo/low).
  (`c25e419`)
- [x] #4 — front-blocker/back-caster `encounterSquad`: melee at a shielded back
  group is blocked, spells bypass, tempo auto-stops. (`3735d81`)
- [x] Encounter model: first-contact (each enemy type fought ~once/run), trash in
  threes, leaner XP. (`261b66c`)
- [x] `src/headless/descentSim.ts` + `tests/descentSim.test.ts` difficulty Gate:
  a no-grind push must survive AND be threatened (`deepestTrough < 0.72`, target
  ~0.45). (`8136301`, `89faa19`)

## D. Stair / navigation playability

Goal: arriving somewhere is never a punishment; exploration is legible.

- [x] Safe stair landings — `use_stairs` never triggers combat; every floor's
  startRoom carries no `encounterTable`, locked by a Gate rule that caught two
  pre-existing violations (B3F, B7F). (`808496f`, `2c655a7`)
- [x] Descent from the stair cell regardless of facing (`roomStairsEdge`); dropped
  the nagging under-level notice. (`eaf60e1`)
- [x] Up-stairs ascend / down-stairs descend in the first-person view. (`31c4498`)
- [x] Guaranteed path fights, clearer/larger minimap with a facing marker, debug
  auto-explore that auto-descends, Esc closes overlays, debug panel collapsed to a
  corner chip. (`e7e1947`, `b2d6252`, `808496f`)

## E. Combat playability + UI standards

Goal: combat is playable by keyboard/controller and reads like a real DRPG.

- [x] #57 — full six-member fight winnable by keyboard alone (smart-F, X, ⌫, arrows)
  + auto/repeat + an e2e Gate. (`1a77c6f`)
- [x] Combat/party UI standards researched and codified in `AGENTS.md`
  (§Combat & Party UI Standards); combat roster shows MP, de-duped rows; enemy
  sprite anchored to the floor and visible. (`e20f4b2`, earlier `ad86867`)

## F. DebugMode playtest aids

- [x] Force-win (強制勝利): ends a fight as a victory with normal rewards/level-ups.
- [x] Revive/full-heal (完全回復・復活): restores HP/MP/injuries/statuses in place.
  Both in the combat + dungeon docks; unit + `debug-combat` e2e. (`478efbf`)
- [x] `?at=<roomId>&facing=` debug cell-seed (`withDebugStartCell`) so mechanic
  e2es start ON the cell under test — fixed the maze-stale hidden-passage/minimap
  specs. (`c086a96`)

## G. App decomposition (Lane R — panel extraction)

Goal: cut the `App.tsx` God component without behaviour change. One extraction per
commit, suite green after each; dead imports pruned each time.

- [x] `TitleScreen` (`b711d00`), `CampPanel` (+camp e2e, `db2f300`),
  `FloorMapOverlay` (`d4c6149`), `DebugPanel` (`45d76cb`),
  `DungeonCommandDock` (`3b48a70`), `CombatCommandDock` (`54c91e9`) — all under
  `src/components/`. **App.tsx 2778 → 2454 (−324).**
- [ ] Remaining (carried to active Plan): the town/guild/shop/records render, the
  last large chunk — entangled with the stateful draft flow and ~40 handlers.

## Verification

- 243 unit tests; 59 Playwright e2e (added `camp`, `debug-combat`; repointed
  `hidden-passage`, `minimap` to the `?at=` seed). Design Gate + descentSim Gate
  enforce the maze/difficulty invariants.
