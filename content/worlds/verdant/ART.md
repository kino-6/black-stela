# Verdant scenario art order — 樹海 (the drowned wood)

Art for the second scenario (`翠碑 — 沈む樹心 / Verdant Stela — the Sunken Heartwood`).
Read shared production and drop-in rules first: `../../../docs/art/common.md`.
Pack lives at **`content/worlds/verdant/assets/`**, resolves own-basename-first, and a
dropped file is used after a rebuild with no code change.

## ⚠ The brief, in one line

**Do not recolour the ash dungeon green.** A green-tinted stone brick wall with a stone
staircase is still Black Stela. **Every structure must be replaced by a forest structure.**
The world is expressed in the *assets*, not in a tint.

| Black Stela (do NOT reuse) | Verdant (make THIS) |
|---|---|
| Fitted stone masonry wall | Living wall of **braided roots, bark and moss**, wet, breathing |
| Cut-stone floor | **Leaf-litter, mud, standing water, surface roots** underfoot |
| Stone staircase down | A **vine ladder / hanging root-stair** dropping into the green dark |
| Wooden plank door | A **curtain of vines / a split trunk** you push through |
| Standing black stela (return marker) | A **shaft of daylight through the canopy / a young sapling** |
| Torchlight | **Filtered canopy light** — green, dappled, from above, not a flame |

There is currently a `world.palette` tint standing in for this art. It is a **stopgap**
and will be dialled back once these assets land — do not design *to* the tint.

**Tone.** Life · encroachment · drowning-in-green. Wet, overgrown, softly suffocating.
Deep greens, sap-amber, pollen-gold, mould-black, bark-brown, drowned light. It is a
*place that is alive*, the opposite of Black Stela's dry death. It follows
`../../../docs/art/common.md`: material color and silhouette belong in the asset;
scene lighting, fog, bloom, and torch effects belong in the renderer.

## Structures (the ones that carry the world)

### Block textures — `assets/dungeon/`, 1024², JPG, seamless-tiling
Not stone. **Root/bark/moss surfaces**, wetter and more overgrown with depth:
- `stone-wall-block1` / `stone-floor-block1` — **Act I**: moss-furred roots knitted into a
  wall; floor of leaf-litter and shallow water. ✅ generated
- `stone-wall-block2` / `stone-floor-block2` — **Act II**: heavy bark scutes, weeping sap,
  fungal shelves; floor of sap-slick mud and drowned leaves.
- `stone-wall-block3` / `stone-floor-block3` — **Act III**: pale heartwood grain, dense
  vein-like roots; floor of bone-pale rootmat.
(The basenames are fixed by the renderer — the *content* is what changes.)

### `dungeon/stair-down.png` — the descent (PNG RGBA, ~768², billboard) ✅ generated
**A vine ladder / hanging root-stair**, not steps: knotted vines and aerial roots dropping
through a hole in the rootmat into green dark below. Must read instantly as "go down."
Bottom-weighted, clean alpha. *(This is the piece the player sees most; do not ship a
recoloured stone stair.)*

### `dungeon/stair-up.png` — the ascent ✅ generated
The same ladder seen from below, climbing toward a **pale shaft of daylight**.

### `dungeon/wood-door.jpg` — 1024² ✅ generated
Not planks. A **curtain of hanging vines / a split trunk** — a soft, living barrier.

### `dungeon/return-marker.png` — ~576×768, PNG RGBA ✅ generated
Not a stela. A **young sapling in a shaft of daylight** (or a break in the canopy) — the
way back to the surface, and the only clean light in the world.

## Enemy sprites — `assets/dungeon/`, **768×768 square**, PNG RGBA
Basename = enemy id, dots→dashes. Chroma-key on **MagentaBack** (subjects are green).
Each must read as a *forest* creature with a tactical silhouette; use the shared
readability and alpha rules in `../../../docs/art/common.md`.

**These sprites are drawn INTO the corridor, not pasted over it.** The engine plants
every sprite at the same world size and lets the art carry the size difference, so the
framing rules below are not cosmetic — get them wrong and the creature floats above the
floor or reads the wrong size. This supersedes the earlier ~768×512 spec.

### Framing — what actually matters
The engine measures each creature's silhouette from the **alpha channel**, stands its real
feet on the floor, and scales its real height to the `size:` class in `enemies.md`. So there
is **no fill percentage to hit and no floor line to align** — the renderer normalises both.
See `../../../docs/art/common.md` → *Enemy Sprite Framing*.

- **Square 768×768**, PNG RGBA, chroma-key on **MagentaBack** (subjects are green).
- **Clean alpha is the whole job.** Anything that is not the creature must be fully
  transparent. A key fringe or a background wash enlarges the measured silhouette and lifts
  the creature off the floor.
- **One creature per file** — a pack of three is drawn as three copies of the sprite.
- **No baked shadow, no ground, no scenery, no glow plate.** The engine casts the contact
  shadow and lights the sprite with the scene.
- **Eye level ≈1.5 m**, front or 3/4 view. Fill the frame generously.

### The roster
Size lives in `enemies.md` (`size:`), not in the image. Listed here only so the drawing
reads at the right weight.

| basename | size | creature |
|---|---|---|
| `enemy-verdant-g1-moss-mite` | small | mossy mite, tutorial foe; squats on the floor |
| `enemy-verdant-g1-spore-gnat` | small | spore-winged gnat, swarm; hovers |
| `enemy-verdant-g2-thorn-crawler` | small | thorn-shelled crawler; low, long |
| `enemy-verdant-g7-husk-spawn` | small | heartwood-husk spawn |
| `enemy-verdant-g2-spore-caster` | medium | spore-puffing **back caster** — frail, bulbous sacs |
| `enemy-verdant-g4-pollen-drifter` | medium | drifting pollen-cloud form; hovers, no legs |
| `enemy-verdant-g6-thorn-cutter` | medium | bladed-thorn **ambusher** — lean, fast |
| `enemy-verdant-g2-bramble-shield` | large | bramble-armoured **front blocker** — bulky, walling, wide |
| `enemy-verdant-g3-bloom-warden` | large | flowering warden (mini-boss) |
| `enemy-verdant-g4-bark-ward` | large | bark-plated ward (armoured mini-boss) |
| `enemy-verdant-g5-sap-keeper` | large | sap-dripping keeper (toll mini-boss) |
| `enemy-verdant-g6-strangler-warden` | large | strangling-vine warden (mini-boss) |
| `enemy-verdant-g7-heartwood-husk` | large | heavy heartwood husk; wide, walling |
| `enemy-verdant-g8-rootheart` | **huge** | **the Rootheart** — the living heartwood core. The boss; the most detailed piece in the pack. It towers: draw it to fill its frame. |

## Icons — `assets/icons/`, 256×256 PNG RGBA
`item-verdant-sap-draught` (amber sap vial) · `item-verdant-pollen-salve` (pale salve jar) ·
`item-verdant-homing-spore` (glowing spore pod) · `item-verdant-greater-sap` (rich sap vial) ·
`item-verdant-heartseed` (pulsing green seed) · `equip-verdant-thorn-lash` (living bramble
whip) · `equip-verdant-bark-plate` (bark-scute armour) · `equip-verdant-living-charm`
(green-wood charm).

## UI / stills
- `title/black-stela-title.jpg` (1920×1080) — verdant title key art: the drowned canopy /
  the jade stela swallowed by roots. ✅ generated
- `ui/combat-vignette.jpg` (1600×900) — green drowned-light combat backdrop. ✅ generated
- `ui/guild-hall.jpg` / `ui/town-hub.jpg` (1600×900) — the grove-town: a settlement *in* the
  wood (stilts, rope, lantern-moss), not the ash town. ✅ generated
- `minimap/marker-*.png` (32×32) — optional green retint; falls back to default if omitted.

## Character portraits — `assets/portraits/`, 512×512 PNG

Verdant should override the global portraits. Character creation is part of the
scenario mood; do not leave the ash/default adventurer portraits in a living
forest pack.

Use the same 12 portrait basenames as the default pack:
`gate`, `ruin`, `vial`, `coin`, `map`, `ward`, `road`, `pit`, `ink`, `grave`,
`dock`, `cloak`. ✅ generated

Post-generation review note: `grave` and `cloak` are intentionally darker than
the others. If they lose readability in the in-game party rail, retake those two
with brighter face midtones while keeping the same subdued mood.
