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
  wall; floor of leaf-litter and shallow water. ✅ wall retaken and browser-verified;
  fitted stone courses no longer define the structure
- `stone-wall-block2` / `stone-floor-block2` — **Act II**: heavy bark scutes, weeping sap,
  fungal shelves; floor of sap-slick mud and drowned leaves. ✅ generated
- `stone-wall-block3` / `stone-floor-block3` — **Act III**: pale heartwood grain, dense
  vein-like roots; floor of bone-pale rootmat. ✅ generated
(The basenames are fixed by the renderer — the *content* is what changes.)

### `dungeon/stair-down.png` — the descent (PNG RGBA, ~768², floor plane) ✅ generated and browser-verified
**A vine ladder / hanging root-stair**, not steps: knotted vines and aerial roots dropping
through a hole in the rootmat into green dark below. Must read instantly as "go down."
Bottom-weighted, clean alpha. *(This is the piece the player sees most; do not ship a
recoloured stone stair.)*

**Scale restraint (2026-07-14 retake).** This is ordinary floor-to-floor equipment,
not a landmark, gate, shrine, or boss entrance. Use a narrow practical timber/rope
ladder with a few vines wrapped around it and only enough rootmat rim to explain the
opening. No monumental root arch, huge framed shaft, ceremonial symmetry, or portal
silhouette. The ladder is the subject; the hole is supporting context.

### `dungeon/stair-up.png` — the ascent ✅ generated and browser-verified
The same modest ladder seen from below, climbing through a small break in the
rootmat. Keep the daylight cue restrained and renderer-friendly; do not turn it
into a giant luminous arch or bake a global light shaft into the sprite.

### `dungeon/wood-door.jpg` — 1024² ✅ generated
Not planks. A **curtain of hanging vines / a split trunk** — a soft, living barrier.

### `dungeon/return-marker.png` — ~576×768, PNG RGBA ✅ generated
Not a stela. A **young sapling in a shaft of daylight** (or a break in the canopy) — the
way back to the surface, and the only clean light in the world.

## Enemy sprites — `assets/dungeon/`, **768×768 square**, PNG RGBA
Basename = enemy id, dots→dashes. Chroma-key on **MagentaBack** (subjects are green).
Each must read as a *forest* creature with a tactical silhouette; use the shared
readability and alpha rules in `../../../docs/art/common.md`.

**Delivery status: 14/14.** All enemy sprites below use scenario-specific
768×768 clean-alpha art; Default/Ash enemy fallback is no longer used for the
authored Verdant roster.

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

**Delivery status: 8/8.** All Verdant-specific item and equipment icons are
delivered under their own basenames.

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

### Locked portrait direction

The portrait set uses the visual grammar of an original Japanese 2D dungeon RPG:
clear inked contours, expressive anime faces, slightly exaggerated proportions,
readable costume silhouettes, and cel-like shadow groups softened by restrained
paint texture. Classic forest-labyrinth and witch-brigade RPGs are references for
clarity and ensemble appeal only; do not copy a proprietary character, costume,
composition, or a specific living artist's line.

- **Do not use photorealistic or semi-photographic cast portraits.** Glossy skin,
  fashion-editorial lighting, realistic headshots, and uniformly rendered
  three-quarter busts make the set look like generic generated concept art.
- **Do not design the cast as a demographic checklist.** Variety comes from role,
  age archetype, build, expression, hair shape, equipment, palette, and personal
  history. Each person must first read as a character who belongs to this world.
- Give every portrait one dominant silhouette and one memorable role cue that
  survives at 48–80 px: spear and pauldron, goggles and vial, map case, warding
  coat, caravan hook, rope, spectacles, mourning sprig, and so on.
- Use purposeful, clearly separated colors. Verdant is not a green wash and dark
  fantasy is not desaturation. Skin, hair, clothing, and role prop must remain
  distinguishable in the party rail.
- Keep the backdrop flat and graphic, with at most two simple color fields. Do
  not bake a forest scene, global green grade, torchlight, bloom, or cinematic
  atmosphere into a portrait.
- Reject repeated faces, repeated three-quarter poses, malformed hands or props,
  over-detailed trim, unreadable pupils, and costume details that collapse at
  gameplay size.

Use the same 12 portrait basenames as the default pack:
`gate`, `ruin`, `vial`, `coin`, `map`, `ward`, `road`, `pit`, `ink`, `grave`,
`dock`, `cloak`. ✅ retaken as an original Japanese 2D RPG ensemble (2026-07-14)

Acceptance requires both a 12-up contact-sheet review and browser proof in the
character-creation preview and six-person party HUD. File dimensions and basename
resolution alone do not prove the portraits are usable.

## Delivery audit (2026-07-13)

Required asset files in this order: **48**. Delivered: **48**. Undelivered: **0**.
Optional Verdant minimap-marker overrides are excluded from this count.

| Area | Ordered | Delivered | Missing |
| --- | ---: | ---: | ---: |
| Block wall/floor textures | 6 | 6 | 0 |
| Door, stairs, return marker | 4 | 4 | 0 |
| Enemy sprites | 14 | 14 | 0 |
| Verdant item/equipment icons | 8 | 8 | 0 |
| Title and UI stills | 4 | 4 | 0 |
| Character portraits | 12 | 12 | 0 |

The required Verdant file order is delivered. The 2026-07-13 follow-up browser
playtest accepted the Act I wall retake as braided roots, bark, and moss with no
dominant fitted masonry. It also verified the root ascent in normal G1F play.
Optional minimap overrides and future hurt-frame animation remain separate
enhancements, not missing required assets.
