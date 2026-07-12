# Verdant areas — the three acts (G1–G8)

The second full scenario (`content/worlds/verdant/`), a deliberate mirror of the
default `dungeon-areas.md` structure so it reads as "another world, same rules."
Where Black Stela is **ash · stone · dry death · atonement**, Verdant is its
opposite: **life · encroachment · drowning-in-green**. You do not descend a dry
ruin; you sink into an overgrown, waterlogged arboretum whose canopy closed over the
world long ago. Everything here is alive, wet, growing — and quietly suffocating.

Eight authored floors, three 3-floor acts (last is 2), each an escalating
begin/middle/end with a spike at its close. Same descent grammar as default
(first-contact encounters, front-blocker/back-caster squads, tolls, mini-bosses, a
finale boss) with a green reskin of every role. Tune against `descentSim` (`none`
model) toward the SAME per-floor trough band as default, so both worlds share the
act curve.

**Proposed name (confirm):** `翠碑 — 沈む樹心` / **Verdant Stela — the Sunken
Heartwood**. Parallels 黒碑 (Black Stela) with 翠碑 (jade/green stela); the descent
ends at the heartwood instead of the black gate. Floor ids: `dungeon.verdant.g1f … g8f`.

## Act I — The Shallow Vines (G1–G3) · "浅い蔦層"
**Concept:** teach the loop. Root-galleries, moss, drifting spores — the canopy's
shallow throat. The party learns attrition, formation, mapping, and push-vs-retreat
on forgiving, living ground. Death is only possible by ignoring information.
- **G1 Root Gallery** — first contact; the teaching moss-mite, a first mixed pack.
- **G2 Spore Drift** — the front-blocker + back-caster squad (bramble-shield +
  spore-caster; tactics seed); thorn-crawlers.
- **G3 Pollen Cistern** — status threat (pollen: sleep/poison); the bloom-warden mini-boss.
- **Threats:** attrition (mite/gnat/crawler packs), a first squad, a first status.
- **Trough targets (none):** G1 ≈ 0.82 · G2 ≈ 0.72 · G3 ≈ 0.62.

## Act II — The Drowned Boughs (G4–G6) · "沈む大枝の層"
**Concept:** pressure and tolls. Bark-wards, sap-tolls, strangling growth — the
mid-depth where the forest asks a price. Real attrition, blockers you must break or
reach past, status you must answer with the right loadout, and sap/pollen tolls that
make "push or turn back" a genuine decision.
- **G4 Bark Wards** — bark-ward blockers (armor); reach/spell answers matter.
- **G5 Toll of Sap** — the sap-keeper toll (mini-boss / resource gate).
- **G6 Strangling Oaths** — thorn-cutter ambushers + the strangler-warden mini-boss.
- **Threats:** armored blockers, tolls, status, tactical squads; loadout is the answer.
- **Trough targets (none):** G4 ≈ 0.55 · G5 ≈ 0.48 · G6 ≈ 0.42.

## Act III — The Heartwood (G7–G8) · "樹心"
**Concept:** the finale. Husk-choked side hollows and the living heart — tense
ground where an unprepared party (wrong loadout, no items, under-levelled) can
credibly wipe. The run ends at the heartwood's guardian.
- **G7 Heartwood Husks** — heartwood-husk blockers; the deepest trash pressure.
- **G8 The Green Heart** — the rootheart boss; the run's climax.
- **Threats:** heavy blockers, the boss; preparation (gear/items/levels) decides it.
- **Trough targets (none):** G7 ≈ 0.36 · G8 ≈ 0.28 (the Heartwood's deepest trough).

## Enemy roster (~12 types, first-contact; mirrors default's roles)
| id | floor | role | default analog |
|----|-------|------|----------------|
| `enemy.verdant.g1.moss-mite` | G1 | teaching / weak | ash-slime |
| `enemy.verdant.g1.spore-gnat` | G1–2 | swarm attrition | dust-crawler |
| `enemy.verdant.g2.bramble-shield` | G2 | front blocker (armor, low dmg) | (squad front) |
| `enemy.verdant.g2.spore-caster` | G2 | back caster (status) | (squad back) |
| `enemy.verdant.g2.thorn-crawler` | G2–3 | attrition | hook-rat |
| `enemy.verdant.g3.bloom-warden` | G3 | mini-boss (status gate) | cistern-warden |
| `enemy.verdant.g4.bark-ward` | G4 | armored blocker | lantern-ward |
| `enemy.verdant.g5.sap-keeper` | G5 | toll mini-boss (resource) | cinder-keeper |
| `enemy.verdant.g6.thorn-cutter` | G6 | ambusher | oath-cutter |
| `enemy.verdant.g6.strangler-warden` | G6 | mini-boss | oath-warden |
| `enemy.verdant.g7.heartwood-husk` | G7 | heavy blocker | vault-husk |
| `enemy.verdant.g8.rootheart` | G8 | finale boss | ash-votary |

Colour/flavour: deep greens, sap-amber, pollen-gold, mould-black, drowned light.
Status flavour: pollen = sleep/poison; sap = slow/bind. Blockers are bark/bramble
(armor); casters are spore/pollen (status).

## Production plan (mirrors default's pipeline)
1. **V1 skeleton** — `genFloorMaze.mjs` per-floor mazes (own seeds) + `placeFloor.mjs`
   room/stair/on-floor-shortcut placement; G1–G8 navigable, descent connected.
2. **V2 enemies/encounters** — the roster above + `encounters.md` (first-contact,
   squad/status/toll/mini-boss/boss per the acts).
3. **V3 economy** — verdant `items.md` (green consumables/materials/gear + a shop,
   unlock-by-descent) + `treasure.md` + `progression.md`. Shared base catalog auto-
   merges the starter gear; verdant layers its own on top (fixes the empty shop).
4. **V4 balance** — `descentSim` over G1–G8 to the trough band; data-only tuning.
5. **V5 art** — Art.md verdant order list; own pack `content/worlds/verdant/assets/`
   (green block textures, the roster's sprites, icons, markers, title, vignette).
   Until delivered, verdant falls back to the default pack (own-basename drop-in).
6. **V6 tests** — design gate + registry + e2e extended to verdant; structure locked.
7. **V7** — user real-play.

## Open decisions for sign-off
- **Name**: `翠碑 / Verdant Stela — 沈む樹心 / the Sunken Heartwood` OK, or prefer another?
- **Floor prefix**: `g1f…g8f` (grove) OK, or a different letter?
- **Roster/analog mapping** above OK, or reshuffle roles?
