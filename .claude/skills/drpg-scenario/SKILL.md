---
name: drpg-scenario
description: How to design and BUILD a new scenario/world for Black Stela — worldview, dungeon structure (non-linear/Jaquaysed), environmental storytelling, and the concrete content pipeline (world.md → floors → enemies → economy → art → gates). Use when creating a new content/worlds/<id> scenario, reworking an existing world's identity, or reviewing whether a scenario actually reads as its own place. Balance numbers live in `drpg-balance`; combat screen layout in `combat-ui-drpg`.
---

# DRPG Scenario Construction

How to make a scenario that is *actually a different world* — not a reskin with the
same feel — and how to build it in this repo without leaving holes.

## 0. The load-bearing rule (learned the hard way)

**A scenario is only different on the channels the player actually perceives.**

The Verdant build shipped its own 8 floors, 14 enemies, economy and balance curve —
and the player said *"何も変わってない"*, because the scene still rendered with the
default pack's ash textures and amber torchlight. The data differed; **the experience
did not.** Different IDs are not a different world.

Rank the channels by how loudly they speak, and change them **top-down**:

1. **Scene colour & light** (fog, ambient, torch, wall/floor tint) — the loudest, and
   the cheapest. `world.palette` re-tints the block textures, so a world reads as its
   own place *even while borrowing another pack's textures*. **Never ship a scenario
   without its own palette.**
2. **Textures & sprites** (its own `assetPack`) — the real fix; order it early
   (`content/worlds/<id>/ART.md`), because art has the longest lead time.
3. **Room prose & names** — every room/corridor line is the scenario's voice.
4. **Enemy identity** — silhouette + role + flavour, not renamed defaults.
5. **Economy flavour** — consumables/gear that only make sense in *this* world.
6. **Numbers** — the quietest channel. Tuning alone never makes a new world.

**Anti-pattern:** declaring a scenario "done" when it parses, descends and passes
gates — but looks and feels like the world you copied. Take a browser screenshot of
the new world next to the old one. If you cannot tell them apart, it is not done.

**Anti-pattern:** another world's flavour leaking through hard-coded chrome (Black
Stela's "the party descends beneath the black stela" showing in a forest). Scenario
text must come from the world, or be world-neutral.

## 1. Worldview first — one sentence, then everything obeys it

A dungeon players talk about has **one cohesive concept**, not a biome label. "A
volcanic cave used as a demonic forge by blood-obsessed cultists" generates ideas;
"fire cave" does not. Write the sentence, then make **every element reinforce it** —
walls, light, foes, loot, room prose, even the shop's name.

Define, in `docs/design/<world>-areas.md`:
- **The concept sentence** and its **opposition** to existing worlds (Black Stela =
  ash · stone · dry death · atonement → Verdant = life · encroachment · drowning-in-green).
- **Palette** (fog/light/wall/floor) that expresses it.
- **The threat vocabulary**: what hurts you here, and why it belongs (ash → cinders and
  tolls; green → spores, sap, strangling growth).
- **The prize**: what the descent is *for* (Black Stela: the stela's root; Verdant: the heartwood).

## 2. Story is the dungeon, not cutscenes

The genre's storytelling is **bare-bones and environmental** — small moments in the
labyrinth that read like tabletop flavour text, not exposition. Build story from what
is *in* the place:

- **Traces of past inhabitants/adventurers** — trophies, territorial marks, a pack
  dropped mid-flight, a name scratched out. These carry the story with zero cutscenes.
- **Each area advances one narrative beat** — escalation, reversal, or payoff. A
  corridor builds tension (drift, leak-marks, damage); a chamber resolves a question
  (the toll-taker's bowl, the winch someone already turned).
- **Name rooms as statements**, not labels: "Lifted Bar", "The Keeper's Niche",
  "Sunken Threshold" — each implies an event.

## 3. Dungeon structure — Jaquays it (non-linear)

Grid floors must be **explorable, not driven through**. Per Jaquays/Alexandrian:

- **Loops** — branching routes that circle back, so "advance / retreat / go around" is a
  live choice every few cells. (Our Gate: `loopCount >= 4`.)
- **Multiple paths down** — conventional stairs plus unconventional ways (secret edges,
  shortcut warps), so the descent isn't a single corridor.
- **Shortcuts** — a sealed way that, once opened, collapses the trek. This is what makes
  push-vs-retreat affordable. **A shortcut must never run BACKWARD off-floor** (a
  B5F→B2F warp once made the auto-explorer loop the party three floors up).
- **Secrets & reward dead-ends** — the map pays you for mastering it. (Gate:
  `rewardDeadEndRoomIds >= 1`.)
- **A sole-approach choke** — the miniboss/toll sits on the *only* way deeper, so the
  floor's spike is unavoidable and readable.
- **Dense, not thin** (Gate: `cellCount >= 80`); a winding maze, not an open field.

Use `scripts/genFloorMaze.mjs` (棒倒し法 perfect maze + carved chambers) and
`scripts/genVerdantFloors.mjs` as the generator pattern — **regenerate from the script,
never hand-edit the emitted `.md`.**

## 4. The build pipeline in this repo

Order matters; each step unblocks the next.

1. **`docs/design/<world>-areas.md`** — concept, 3-act structure, per-floor concept +
   threat, enemy roster mapped to roles, trough targets. **Get sign-off before mass production.**
2. **`content/worlds/<id>/world.md`** — `id`, `title`, `assetPack`, **`palette`**,
   `startDungeon`/`startRoom`, `aiPolicy`.
3. **Floors** — a generator script → `dungeons/*.md` (dense map/symbols/corridor/edges/rooms).
   Connect up/down stairs both ways; `restPoint` checkpoints at act boundaries; the entry
   floor gets `stairsToTown`.
4. **`enemies.md` + `encounters.md`** — roster by act (trash → squad → keep chokes → boss);
   keep stats in `enemies.md` only (rooms reference by table/squad). Boss floor gets the
   `boss` tag (that, not an inline flag, is what `isBossFloor` reads).
5. **`items.md` / `treasure.md` / `progression.md`** — world-flavoured consumables, gear,
   **a shop** (a shopless world disables the shop button), unlock-by-descent flags.
   Starter gear is auto-merged from the shared base catalog — do not re-declare it.
6. **Art order** — `content/worlds/<id>/ART.md`: basenames (id dots→dashes), dimensions,
   target folder. Own-basename-first drop-in; until delivered it falls back to the default
   pack, which is exactly why step 2's palette is mandatory.
7. **Gates** — registry/structure test, maze-quality test, and a `descentSim` balance Gate
   (see `drpg-balance`; tune against the **none** model, never let it wipe).
8. **Play it in a browser.** e2e is not optional: pick the scenario, walk the maze, fight,
   shop. Screenshot it. Headless proves the data; only the browser proves the world.

## 5. Review checklist (run before calling a scenario done)

- [ ] Screenshot beside an existing world — **visibly a different place?**
- [ ] `world.palette` set? Own `assetPack` declared and its ART.md written?
- [ ] Every room name/description in this world's voice; no other world's chrome leaking.
- [ ] Floors: loops, shortcut (on-floor, never backward), secrets, reward dead-ends,
      sole-approach choke, dense.
- [ ] Enemies express the threat vocabulary (not renamed defaults); roles cover
      trash/blocker/caster-squad/toll/miniboss/boss.
- [ ] Shop exists and is stocked; consumables/gear only make sense here.
- [ ] Descent completable end-to-end; checkpoints + escape item make push-vs-retreat real.
- [ ] `descentSim` none-model curve escalates by act, never wipes (`drpg-balance`).
- [ ] Browser playthrough e2e passes.

## Sources
- [Xandering (Jaquaying) the Dungeon — The Alexandrian](https://thealexandrian.net/wordpress/13085/roleplaying-games/xandering-the-dungeon) — loops, multiple paths/entrances, secret routes; why non-linearity creates agency and replay.
- [A Simpler Checklist for Engaging Dungeon Maps — Sly Flourish](https://slyflourish.com/simpler_jaquay_style_maps.html)
- [Environmental Storytelling — Game Developer](https://www.gamedeveloper.com/design/environmental-storytelling) and [Creating Immersive 3D Worlds (theme-park lessons, Don Carson)](https://www.gamedeveloper.com/design/environmental-storytelling-creating-immersive-3d-worlds-using-lessons-learned-from-the-theme-park-industry)
- [Master the Art of Dungeon Design — RPG GG](https://rpggg.com/posts/master-the-art-of-dungeon-design-essential-tips-for-creating-memorable-rpg-adven/) — cohesive theme over biome label; every element reinforces it.
- [Etrian Odyssey — Wikipedia](https://en.wikipedia.org/wiki/Etrian_Odyssey_(video_game)) / [Dungeon Crawling is Fun Again — Black Gate](https://www.blackgate.com/2015/06/14/dungeon-crawling-is-fun-again-etrian-odyssey/) — bare-bones, flavour-text storytelling; mapping as the core verb.
