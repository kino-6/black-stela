# Verdant scenario art order

Art for the second scenario (`翠碑 — 沈む樹心 / Verdant Stela — the Sunken Heartwood`).
Its own asset pack lives under **`content/worlds/verdant/assets/`** and resolves
own-basename-first, exactly like the default pack (see the repo `Art.md` §2). Until a
file is delivered, verdant **falls back to the default (ash) pack** — so the scenario
is fully playable now; this order is what makes it *look* like its own world.

**Theme:** life · encroachment · drowning-in-green — the opposite of Black Stela's
ash. Deep greens, sap-amber, pollen-gold, mould-black, drowned/filtered canopy light.
Wet, living, overgrown; roots and bark instead of dry stone.

**Drop-in:** put each file at `content/worlds/verdant/assets/<subfolder>/<basename>.<ext>`
and rebuild — no code change. Basenames below are the resolver keys.

## Block textures (`assets/dungeon/`, 1024², JPG, seamless-tiling)
Per-block wall+floor, greener/wetter with depth (Act I mossy → Act II bark/sap →
Act III heartwood):
- `stone-wall-block1` / `stone-floor-block1` — Act I: moss-slick root walls, leaf-litter floor.
- `stone-wall-block2` / `stone-floor-block2` — Act II: bark-scute walls, sap-wet floor.
- `stone-wall-block3` / `stone-floor-block3` — Act III: heartwood grain, pale-root floor.
- `wood-door` — a living vine/bark door.

## Enemy sprites (`assets/dungeon/`, PNG RGBA, ~768×512, chroma-key extracted)
Basename = enemy id with dots→dashes. Use **MagentaBack** for green subjects.
- `enemy-verdant-g1-moss-mite` — small mossy mite (teaching foe)
- `enemy-verdant-g1-spore-gnat` — spore-winged gnat (swarm)
- `enemy-verdant-g2-thorn-crawler` — thorn-shelled crawler
- `enemy-verdant-g2-bramble-shield` — bramble-armored front blocker
- `enemy-verdant-g2-spore-caster` — spore-puffing caster (back line)
- `enemy-verdant-g4-pollen-drifter` — drifting pollen-cloud form
- `enemy-verdant-g6-thorn-cutter` — bladed-thorn ambusher
- `enemy-verdant-g7-husk-spawn` — small heartwood-husk spawn
- `enemy-verdant-g3-bloom-warden` — flowering warden (miniboss)
- `enemy-verdant-g4-bark-ward` — bark-plated ward (armored miniboss)
- `enemy-verdant-g5-sap-keeper` — sap-dripping keeper (toll miniboss)
- `enemy-verdant-g6-strangler-warden` — strangling-vine warden (miniboss)
- `enemy-verdant-g7-heartwood-husk` — heavy heartwood husk (miniboss)
- `enemy-verdant-g8-rootheart` — the living heartwood core (**boss**, largest/most detailed)

## Icons (`assets/icons/`, 256×256 PNG RGBA)
- `item-verdant-sap-draught` — amber sap vial
- `item-verdant-pollen-salve` — pale salve jar
- `item-verdant-homing-spore` — glowing spore pod (escape)
- `item-verdant-greater-sap` — richer sap vial
- `item-verdant-heartseed` — pulsing green seed (treasure)
- `equip-verdant-thorn-lash` — living bramble whip (weapon)
- `equip-verdant-bark-plate` — bark-scute armor (body)
- `equip-verdant-living-charm` — green-wood charm (accessory)

## UI / key art
- `assets/title/black-stela-title` (JPG, 1920×1080) — verdant title key art (a green
  drowned canopy / the jade stela). NOTE: the CSS title var uses this basename; a
  verdant-pack file overrides it for this world.
- `assets/ui/combat-vignette` (JPG, 1600×900) — green drowned-light combat backdrop.
- `assets/dungeon/return-marker` (PNG, ~576×768) — the verdant town-return waystone.
- `assets/minimap/marker-*` (32×32 PNG) — optional green re-tint of the 9 markers;
  reuse default if not retinted.

Portraits are global character-creation art and do not need a verdant variant.
