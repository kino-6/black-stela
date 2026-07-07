# Archived: Lane Z — Dungeon Structure, Checkpoints, and Wiz/Etrian Gimmicks

Completed. Shipped: rest points, checkpoint resume, emergency return item, shortcuts,
and the spinner/teleporter/damage/darkness/gather/hidden-passage gimmicks (three-block
structure). Deferred: pit/chute, FOE roamers. Original plan detail below.

### [ ] Lane Z: Dungeon Structure, Checkpoints, and Wiz/Etrian Gimmicks

Goal: rebuild the labyrinth so descending feels like a Wizardry/Etrian delve —
tension between rest points, real attrition between them, and gimmicks that make
the maze a place to read, not a corridor to walk. Return becomes scarce and
earned; reaching a rest point unlocks it as a checkpoint the party can resume
from later.

Current baseline (grounded, do not re-discover):

- Eight authored floors in `content/worlds/default/dungeons/b1f..b8f.md`
  (loaded + Zod-validated via `defaultWorld.ts`; all scenario data is already
  externalized). Roles: B1 onboarding, B2/B3 attrition, B4 navigation twist,
  B5 midpoint gate + miniboss, B6 deep route, B7 optional side, B8 boss/finale.
- Return-to-town (`stairsToTown: true`) exists on B1F and B8F only — it is not
  on every floor today; but there is no rest/checkpoint concept and no way to
  resume mid-dungeon.
- Existing gimmicks: one-way edges, dark zones, locked shortcuts, gates
  (`gate.*` ids), progression flags. Save already persists `floorId`,
  `currentRoomId`, `currentCellId`, and `position`, so checkpoint resume is
  technically feasible.

Decided parameters (from user):

- Restructure the labyrinth into THREE blocks, each capped by a rest point plus a
  miniboss; the final block ends at the boss. (Sub-decision: keep 8 floors as
  3/3/2 reusing existing content, or expand to a clean 3×3 = 9. Default: keep 8.)
- Return/rest cadence: rest points at each block cap and immediately before the
  boss — roughly every three floors — never on every floor.
- Resume is HYBRID: reaching a rest point unlocks it; from the town dungeon entry
  the party may resume directly at any unlocked rest point. Additionally: an
  expensive emergency return item, opened shortcuts that loop back, and autosave
  on every stair transition (up or down).

Planned slice A — Block structure and rest points:

- [ ] Reshape the eight floors into three blocks (default B1-3 / B4-6 / B7-8),
  each ending in a rest cell (safe room) and a miniboss guarding the descent;
  the final block ends at the B8 boss. Keep the strong existing floor content and
  grid topology; re-tag roles to the block model.
- [ ] Author each rest cell as a current-cell affordance: return to town, rest,
  and continue deeper — no free return anywhere else on the floor.
- [ ] Keep grid honesty (Grid Labyrinth Gate): coordinates, cell edges, adjacent
  movement, and current-cell/edge affordances for every rest, stair, and gimmick.

Planned slice B — Checkpoints and resume:

- [ ] Add unlocked-checkpoint state to the save schema (v3): the set of rest
  points the party has reached; migrate prior saves with an empty set.
- [ ] Autosave on stair transitions (`stairs_used`) so a crash/quit resumes at
  the last floor boundary.
- [ ] Town dungeon-entry offers a checkpoint selector: start fresh from town, or
  resume at an unlocked rest point (hybrid warp), controller-first and localized.
- [ ] Resume rebuilds a valid `GameState` at the chosen rest cell without
  granting undeserved progress (no skipping the block's miniboss gate downward).

Planned slice C — Scarce return economy:

- [ ] Restrict `return_to_town` to rest cells and the boss approach only; remove
  any implicit per-floor return.
- [ ] Add an expensive emergency return item (town-portal style) that escapes to
  town mid-floor at real gold/opportunity cost, so bailing out is a decision.
- [ ] Author opened shortcuts (Etrian-style loops) that shorten the walk back to a
  rest point once unlocked, as earned relief rather than free teleport.

Planned slice D — Wiz/Etrian gimmick palette:

- [ ] Extend the cell-edge/cell model and renderer for a curated gimmick set,
  each with a readable first-person + minimap cue and current-cell/edge honesty:
  - Wizardry: spinner tiles (facing scramble), pit/chute traps (drop a floor),
    teleporters, darkness/anti-magic zones, riddle/password doors.
  - Etrian: FOE-style roaming minibosses (visible, avoidable, block routes),
    shortcut loops, gather/landmark points, damage tiles, hidden passages hinted
    by clues.
- [ ] Reuse and formalize the existing one-way, dark-zone, locked-shortcut, and
  gate mechanics into the same schema so old and new gimmicks validate uniformly.

Save/schema impact:

- New save schema version (v3): unlocked checkpoints; autosave-on-stairs; any new
  gimmick state (spinner-known, teleporter-mapped, pit-fallen). v2→v3 migration
  seeds empty checkpoint/gimmick state.
- Extend the dungeon scenario schema (validated with Zod like today) for rest
  cells, block/miniboss/boss roles, and each new gimmick edge/cell type; scenario
  validation must reject malformed rest/checkpoint/gimmick data.

Japanese/UI impact:

- Rest-cell, checkpoint-selector, emergency-return-item, and gimmick prompts are
  controller-first, staged, localized EN/JA, and pass the Japanese Line-Layout and
  Dialogue gates.
- Gimmicks surface as in-world cues (a spinner disorients, a pit gives way), not
  UI labels or raw ids in normal play.

Verification (headless/browser parity):

- Unit: block/rest topology validation, checkpoint unlock + resume state rebuild,
  return restricted to rest cells, autosave-on-stairs, v2→v3 migration, and each
  gimmick's rule (spinner facing, pit descent, teleport, damage tile).
- Browser: reach a rest point, return, then resume at it from town; trigger and
  read each gimmick in the first-person view + minimap; confirm no free mid-floor
  return. Headless reachability proves paths exist, not that the maze reads well.

Human expectation and red flags:

- Expectation: descending has stakes between rest points; reaching a rest point is
  a relief and a durable checkpoint; the maze rewards reading walls, doors, and
  gimmicks like a classic DRPG.
- Red flags: return available anywhere; a checkpoint that skips a miniboss gate;
  gimmicks shown only in logs or as raw ids; resume granting undeserved loot/XP;
  the minimap or first-person view disagreeing with a gimmick's real effect;
  autosave that silently overwrites a wanted earlier state.

Open questions to resolve before opening tasks (BS numbers assigned when tasked,
after Lane X/Y):

- Floor count: keep 8 (3/3/2) reusing content, or expand to 3×3 = 9.
- Emergency return item: single-use costly consumable vs a rechargeable town-portal
  with a cooldown; and whether it is blocked in boss/gate cells.
- Autosave slots: overwrite one rolling autosave, or keep a small ring so a bad
  resume is recoverable.
- Reference dial per block: how hard each gimmick family leans Wiz vs Etrian.

