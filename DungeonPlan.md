# Dungeon Plan

Per-floor design intent for Black Stela's labyrinth. This is the "why" that sits
above the authored `content/worlds/default/dungeons/*.md` maps. Floors are now
authored as dense ASCII grids (`map`/`symbols`/`corridor`/`edges`, expanded by
`src/domain/floorMap.ts`), but *density is a means, not a goal* — each floor
earns its shape from what it should make the player feel.

---

## B1F — Silent Approach (first floor)

### The problem we're solving

The current B1F is essentially a hallway (8 cells: one east corridor with a
tiny 3-room loop). It teaches the mechanics on paper but has no *place-feel*:
nothing to remember it by, no real choice, the first fight and first trap are
crammed into the same second room, and the "loop" is trivial. It reads as a
tutorial checklist, not a dungeon. That flat first impression is what soured the
overall hand-feel.

### Design principle: legible at full scale, not small

**Footprint is a 20×20 grid** — the same canvas as every other floor (Wizardry I's
levels are 20×20, and beginners still map them by hand). "Grid size" and "number
of walkable cells" are different dials: a 20×20 floor is not 400 rooms, it is a
20×20 frame in which walls carve out corridors, chambers, dead-ends, and one clear
trunk. B1F fills that frame, but earns legibility from *structure*, not from being
small:

- **A strong trunk.** The mandatory beats sit on one clear main path the player
  can always find their way back to. Everything else branches off it.
- **Anchor + landmarks.** A central hub chamber and a few named landmarks
  (Entrance, Hub, alcoves, Black Marker) give the mental map its fixed points;
  the minimap does the rest.
- **Teach the grammar, one beat at a time, in order.** Move → first fight →
  read the map → exploration pays → search & first trap → landmark → return &
  descend. Never two new ideas in the same room.
- **Safe to be curious.** Getting lost or poking a dead-end should cost little
  and sometimes reward. This is where the player learns that exploring is worth
  it — the lesson every later floor cashes in.
- **Loops + a shortcut cut the tedium.** At 20×20 the return climb would be long,
  so loops teach "the map connects back to itself" and a one-way shortcut from the
  marker collapses the backtrack — the signature DRPG *aha*, and doubly welcome at
  this scale.

Trade-off noted: a full 20×20 is a big *first* experience for a newcomer. We
manage that with the strong trunk + landmarks + shortcut above rather than by
shrinking the floor. (If playtest shows it's too much, the lever is walling the
frame down to a smaller walkable core, not re-authoring — say the word.)

Reference touchstones: Wizardry I's 20×20 levels (a shape you can graph by hand)
and Etrian Odyssey's B1F grammar (walk → gather/reward → a one-way shortcut you
open → stairs).

### Hard constraints (must not break)

- **MVP clear probe.** `isMvpCleared` requires the party to defeat
  `enemy.b1f.ash-slime`, resolve `trap.b1f.needle`, visit `room.b1f.006`, and
  return to town. All three must sit on the *mandatory* path (the greedy probe
  won't detour for optional content). At 20×20 the clear-and-return will exceed
  the current 20-step budget, so the clear probe's budget is raised deliberately
  (the *short forced spine* keeps the mandatory route itself brief even on a big
  floor).
- **Cross-floor links / stable ids.** `room.b1f.001` is the entrance (party
  start + `treasure.b1f.safe`). `room.b1f.006` is the Black Marker: return
  marker, the `first-descent` shortcut gate (grants `flag.b1f.marker-read`), and
  the east stairs to `room.b2f.001`. B2F's up-stairs point back at
  `room.b1f.006`. Keep both ids and their roles.
- **Deterministic clear test** (`headlessRunner.test.ts`) asserts an exact
  command sequence + visited-room list for B1F; a redesign updates it on
  purpose.

### Teaching beats (the intended sequence)

1. **Move** — a couple of steps from the entrance in a plainly safe corridor.
   Nothing happens; the player learns the controls and that the minimap fills in.
2. **First fight** — a lone Ash Slime sits in the corridor ahead, telegraphed and
   weak. Teaches combat and that enemies inhabit the world (not random popcorn).
3. **Read the map** — the path opens into the **anchor chamber** (a distinctive
   hub). The minimap now shows more than one way on; the player makes their first
   navigation choice.
4. **Exploration pays** — a short dead-end **alcove** off the hub holds a small
   reward (a healing draught). Teaches that poking dead-ends is worth it.
5. **Search & first trap** — the forward corridor has a **telegraphed needle
   trap** (warning prose). Teaches Search → detect → disarm, safely.
6. **Landmark + shortcut** — past the trap lies the **Black Marker** chamber: the
   return marker and the descent. A one-way shortcut door here opens back toward
   the entrance, so the *next* time through, the return climb is short. Teaches
   return-to-town and the shortcut *aha*.
7. **Descend** — the marker's gate opens the stairs down to B2F only once the
   party has learned the safe-return pattern (existing `first-descent` gate).

### Resolved direction (decided together)

1. **Scale** — **20×20 grid footprint** (same as other floors). The walkable
   layout inside the frame is a legible figure: a short forced trunk plus
   exploration wings, two+ reward alcoves, and loops — not 400 open rooms.
2. **One-way shortcut** — **yes on B1.** A one-way door opens from the Black
   Marker back to the entrance, teaching the shortcut *aha* on the first floor.
3. **First fight** — **placed Ash Slime (telegraphed, mandatory) plus the
   `encounters.b1f.halls` random table active** on corridors. Requires the
   corridor template to carry an optional `encounterTable`.
4. **Prose** — **hybrid.** Landmarks (Entrance, Hub, the two alcoves, Black
   Marker) get unique names/descriptions; the connecting corridors share one
   template.

### Candidate layout (v3 — 20×20 zone schematic)

The organising idea at 20×20: a **short forced trunk** runs up the centre with
the first fight and first trap as unavoidable chokes, a **central hub** anchors
the map, and two **exploration wings** (west/east) fill the frame with loops,
dead-end reward alcoves, and texture. None of the wings bypass the two chokes,
so the MVP clear stays guaranteed no matter how far the player wanders.

Zone schematic (each cell below is a ~3×3 region of the real 20×20 grid):

```text
        N       — top band: marker (M) with the trap choke (N) just below it
        |
   [W wing]—H—[E wing]   — middle band: hub anchor + west/east exploration wings
        |
        C       — bottom band: slime choke (C) on the only way up from entrance
        |
        E       — entrance (party start)
```

- **Forced trunk (centre column):** `E (bottom) → C slime → … → H hub → … →
  N trap → M marker (top)`. `C` is the entrance's only exit upward and `N` is the
  marker's only approach, so the placed slime and the needle are unavoidable —
  MVP clear (slime + needle + `room.b1f.006` + return) always holds. The trunk is
  only ~10 steps end to end even though the floor is 20×20.
- **Hub (anchor):** a distinct central chamber the player keeps returning to; the
  wings and the trunk all meet here.
- **West & east wings:** each a small loop off the hub with a **dead-end reward
  alcove** (two rewards total) plus a short flavour nook. This is the exploration
  meat and the "connects back" lesson; the loops fill the 20×20 frame.
- **One-way shortcut:** entering `M` fires `shortcut_opened` and opens a magic
  `M → E` edge, collapsing the long return climb to one step — the DRPG *aha*,
  and genuinely useful at this scale.
- **Marker (`room.b1f.006`):** return marker + `first-descent` gate + stairs to
  B2F (kept), sitting at the top of the trunk.

The exact wall-by-wall 20×20 ASCII (glyph grid + `symbols` + `edges`) is authored
in the implementation step and validated against the loader's connectivity +
reachability checks and browser captures — hand-verifying 400 cells belongs in
code, not prose.

### Implementation notes / follow-ups

- **Probe budget:** a 20×20 floor with random encounters far exceeds the current
  20-step headless clear budget; raise it deliberately and rewrite the
  exact-sequence assertion in `headlessRunner.test.ts` to check the MVP
  conditions (slime defeated, needle resolved, `room.b1f.006` visited, returned)
  rather than a literal command list.
- **Corridor `encounterTable`:** extend the ASCII `corridor` template (and the
  expander) to carry an optional `encounterTable`, so plain corridors can trigger
  the `encounters.b1f.halls` random fights.
- **Ids/roles preserved:** `room.b1f.001` (entrance) and `room.b1f.006` (marker)
  keep their ids, the `first-descent` gate, and the cross-floor stair to
  `room.b2f.001`.
- **Legibility guardrail:** if playtest shows the 20×20 is too much for a first
  floor, wall the frame down to a smaller walkable core rather than re-authoring.
