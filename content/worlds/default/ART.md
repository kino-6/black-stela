# Default Art Pack — Black Stela / Ash

> Default / Ash scenario pack brief. Shared placement, format, alpha, lighting,
> and verification rules are canonical in `../../../docs/art/common.md`.
> This file owns the ash-world tone, current inventory, requested assets, and
> retake notes.

Black Stela is a first-person, grid-based dungeon RPG (Wizardry / Etrian Odyssey
lineage) rendered in a low-poly Three.js corridor view plus a 2D UI. Art is
consumed in four places: the **first-person dungeon** (tiling textures + camera-
facing sprites), the **2D party/combat/town UI**, **character portraits**, and
the **minimap**.

---

## 1. Art direction

**World & tone.** A dead, ash-choked stone dungeon beneath a town. Cold fitted
masonry, banked dust, dried water-lines, cinders, salt, sealed ossuary niches.
Everything is lit by warm, failing torchlight against near-black. Grounded and
grim, not flashy — "a candle just after it dies." No bright saturated colors, no
modern/sci-fi motifs, no text baked into images.

**Palette** (sampled from the live renderer; keep art readable inside it):

| Role | Hex | Notes |
|------|-----|-------|
| Void / background | `#0d0e0b` | near-black; the fog and empty space |
| Stone wall tint | `#59615a` | cool grey-green, applied over the wall texture |
| Floor tint | `#2a2418` | dark warm brown, over the floor texture |
| Door wood | `#d2b184` | warm tan |
| Gold accent / edges | `#c69a58` → `#efc16d` | rune-lines, frames, marker glow |
| Torchlight | `#f0b76c` / `#ffe0a0` | warm key light |
| Hazard / blood | `#b64b35` / `#3a0905` | traps, wounds, danger |
| Deep shadow | `#070504` | contact shadows |

Textures are multiplied by a tint in-engine, so deliver them **fairly neutral /
desaturated** and let the tint do the final dungeon coloring. Sprites are also
post-processed in-engine, so **do not bake torchlight, fog, bloom, rim glow, or
strong color grading into the sprite art**. The asset must still have its own
readable local material colors: ash, clay, stone, brass, rust, old cloth, leather,
patina, bone, black glass, dried red cord, mineral stains. "No baked torchlight"
does **not** mean grayscale, black-and-white, or muddy low-value art.

**Style keywords for prompts:** hand-painted, matte, weathered stone, soot and
ash, low-fantasy, painterly texture, readable local color, neutral studio
lighting, no outlines on textures.

### Color and lighting production rule

This rule exists because early generation attempts failed by making the enemies
too dark or almost monochrome.

- Asset color comes from **materials**, not from baked scene lighting.
- Use neutral studio lighting for sprites, enough to show form and silhouette.
- Keep midtones and highlights high enough that the sprite remains readable
  after the game applies darker dungeon lighting.
- Use moderate local-color variation. A grim palette can still include dull
  brass, green-black patina, clay beige, pale ash, faded umber cloth, rust, bone,
  black stone, and dried red bindings.
- Do not submit nearly grayscale art unless the creature is intentionally
  monochrome and still has strong value separation.
- Do not submit assets whose important forms sit near black; the renderer can
  darken assets later, but it cannot recover detail that was never painted.
- Do not bake in torch orange, colored rim lights, fog, particles, cast shadows,
  or encounter atmosphere. Those belong in `dungeonScene.ts` / renderer logic.
- Strong enemy-local color is allowed and often required. Poison, bile,
  bruising, patina, oxidized metal, faded dyes, dried blood-red cords, mineral
  stains, pale bone, black stone, and contained magical flame are **subject
  identity**, not forbidden lighting.
- Internal emissive features are allowed when they are part of the creature or
  prop itself: e.g. Lantern Ward may have a contained blue-white flame/core
  behind glass. It must not spill into global torchlight or paint the whole
  scene.
- Each enemy must read as an enemy at a glance. A technically tasteful muted
  palette is a failure if the creature looks like a gray prop, lump, or generic
  statue rather than a threat with its own tactical identity.
- Review generated samples on a mid-gray background first. If the silhouette,
  material identity, and internal planes do not read there, reject or regenerate.

### Retake criteria from early concept attempts

Reject and regenerate if any of these appear:

- The asset is mostly grayscale, beige-gray, or near-monochrome despite not being
  an intentionally monochrome enemy.
- "Neutral lighting" has been interpreted as removing color from materials.
- The subject is so dark that later in-engine lighting would crush its details.
- A creature's tactical role is not visible: slime should look poisonous or
  corrosive, blocker should look sturdy, ambusher should look quick, boss should
  look distinct.
- A magical feature is missing because "no baked lighting" was over-applied.
  Built-in creature features such as a contained blue-white lantern flame are
  permitted; only environmental lighting is forbidden.
- The sprite has tasteful texture but no memorable color hook. Every enemy
  family needs at least one controlled color idea.
- The asset looks good only as a large concept sheet but loses identity when
  scaled to combat size. Final sprite candidates must work small.
- The alpha-extraction background is visible as a fringe after removal.

Positive direction examples:

- Ash Slime: make violet/purple the primary read, with toxic yellow-green bile
  as an accent, pale ash crust, clay-gray sludge, and wet mineral stains.
  Diseased and dangerous, not plain mud.
- Lantern Ward: weathered stone, dull oxidized brass, dark green patina,
  blackened iron, old leather, and a contained blue-white inner flame/core.
- Ash Votary: faded umber and charcoal robes, ash-white crown/mask, black stone,
  tarnished brass charms, dried crimson ritual cords, pale ash markings.

Humanoid enemies need extra care:

- Do not let a humanoid enemy read as just "a person in a robe." Add an
  inhuman silhouette hook: bent proportions, too-long sleeves, broken mask,
  crown growth, asymmetrical burden, extra hanging charms, or a body shape that
  implies something wrong under the cloth.
- A staff, charm, mask, or core may carry contained blue-white light as the
  enemy's own magical material. This is allowed and useful for readability, as
  long as it does not become global scene lighting.
- Boss humanoids should have a simple silhouette readable at small size before
  surface detail: staff/halo/crown/mask/cloak shape first, texture second.

### Approved sample direction from retakes

Use these as the current internal art target when generating final enemy assets:

- **Ash Slime:** purple/violet primary body, yellow-green poison as accent only,
  pale ash crust, clay-gray sludge. It should read as a diseased corrosive
  creature, not gray mud.
- **Lantern Ward:** compact warding-lantern construct, stone + oxidized brass +
  green-black patina + old leather. A contained blue-white inner flame/core is
  allowed and useful. It is a creature feature, not scene lighting.
- **Ash Votary:** final boss, not a normal robed person. Keep three primary
  hooks: fractured ash-white mask/crown, one oversized too-long sleeve/arm, and
  crooked staff/core with contained blue-white light. Reduce small chest
  ornaments. Use black stone shards and dried crimson cords as readable accents.

Notes from rejected attempts:

- "Neutral" must never mean desaturated to near grayscale.
- "No baked torchlight" must never remove local color.
- Good concept sheets can still be too busy for sprites. For implementation,
  simplify toward silhouette and broad material planes.
- If a humanoid boss looks like a normal priest/wizard at thumbnail size, it
  fails even if the painting is attractive.

---

## 2. Technical conventions

Shared placement, format, alpha, lighting, drop-in, and verification rules live
in `../../../docs/art/common.md`. This default-pack brief intentionally keeps
only ash-world direction and asset-specific lists below.

---

## 3. Current inventory (what already exists)

`content/worlds/default/assets/` — **102 assets total** (36 `dungeon/` incl. 11
enemy sprites + 11 hurt frames + return/stair props + block/fallback textures +
door + trap/stela props, 38 `icons/`, 12 `portraits/`, 9 `minimap/`, 1 `title/`,
6 `ui/`):

| File | Size | Use | Gap it leaves |
|------|------|-----|---------------|
| `stone-wall-block1..3.jpg` | 1024² | per-block dungeon walls | wired by floor id |
| `stone-floor-block1..3.jpg` | 1024² | per-block dungeon floors | wired by floor id |
| `stone-wall.jpg` / `stone-floor.jpg` | 1024² | fallback wall/floor | legacy fallback only |
| `wood-door.jpg` | 1024² | every door | fine as a single door |
| enemy sprites ×11 | 768×512 | combat sprites | wired per enemy id |
| enemy hurt frames ×11 | 768×512 | combat hit/defeat frames | generated; FX wiring pending |
| `return-marker.png` | 576×768 | town-return waystone | ok |
| `stair-down.png` / `stair-up.png` | 768² | descent/ascent stair props | generated; stair sprite wiring pending |
| `trap-hazard.png` | 512×512 | floor trap decal | generated; trap decal wiring pending |
| `stela-root.png` | 1024×1536 | finale black-stela root prop | generated; finale prop wiring pending |
| `portraits/*.png` ×12 | 512×512 | origin portraits | wired in character UI |
| `icons/*.png` ×38 | 256×256 | item/equipment icons | wired in shop/inventory/equip UI |
| `minimap/marker-*.png` ×9 | 32×32 | minimap markers | wired through marker CSS classes |
| `ui/combat-vignette.jpg` | 1600×900 | combat UI backdrop | wired in combat frame CSS |
| `ui/guild-hall.jpg` / `ui/town-hub.jpg` | 1600×900 | town/guild backdrops | wired as the town/guild scenes |
| `ui/fx-slash.png` / `ui/fx-spark.png` | 480×96 | combat FX sheets | generated; FX wiring pending |
| `ui/party-hit-reaction.png` | 1600×900 | party damage overlay | generated; FX wiring pending |
| `title/black-stela-title.jpg` | 1920×1080 | title background | wired in title screen CSS |

Remaining geometry/CSS-only gap: no requested default-pack art is missing, but
P6/P7/P9/P12/P13 still need wiring passes before every generated asset appears
in normal play. Player-imported portraits still override generated origin
portraits.

---

## 4. Needed art (prioritized)

### P1 — Enemy combat sprites  ✅ generated and wired · ⚠️ **superseded by P14 (reframe)**

All 11 authored enemies have their own camera-facing sprite. They were delivered as
**768×512 (3:2), every creature in an identically sized canvas**, which is why the boss
and the slime read the same size on screen and none of them stand on the floor.
**P14 below reframes all of them into the shared 768×768 scale box** — use that spec,
not this one, for any new or retaken enemy sprite.

Original (superseded) format: PNG RGBA, 768×512 (3:2), flat-lit, single creature
centered & bottom-weighted, clean alpha, neutral studio lighting, readable local
material color, no baked torchlight.
File → `content/worlds/default/assets/dungeon/<id-without-prefix>.png`, wired per-enemy in
`dungeonScene.ts` through the enemy-id → texture map.

| # | id | Name (EN / 日本語) | Tier | Role | Prompt seed |
|---|----|--------------------|------|------|-------------|
| 1 | `enemy.b1f.ash-slime` | Ash Slime / 灰泥 | 1 | attrition | regenerate; low pale mound of ash-sludge with clay beige / cool ash / mineral stains, not grayscale |
| 2 | `enemy.b1f.dust-crawler` | Dust Crawler / 塵這い | 1 | attrition | many-legged low crawler caked in dust; weak to fire |
| 3 | `enemy.b2f.hook-rat` | Hook Rat / 鉤鼠 | 2 | ambusher | mangy rat with iron hook-scars, quick and lean |
| 4 | `enemy.b3f.bitter-mote` | Bitter Mote / 苦い塵 | 3 | status | floating cyst of green-tinged bitter water/ash; weak to fire |
| 5 | `enemy.b4f.lantern-ward` | Lantern Ward / 灯守 | 3 | blocker | armored sentinel with dull brass, patina, stone, muted glass; material color only, no glow baked in |
| 6 | `enemy.b6f.oath-cutter` | Oath Cutter / 誓い断ち | 4 | ambusher | gaunt blade-wielder, scratched-out names on its wraps |
| 7 | `enemy.b7f.vault-husk` | Vault Husk / 納骨殻 | 5 | blocker | hollow ossuary shell, ash pouring from cracks |

**Bosses (make these the strongest, most distinct pieces):**

| # | id | Name (EN / 日本語) | Tier | Where |
|---|----|--------------------|------|-------|
| B1 | `enemy.b3f.cistern-warden` | Cistern Warden / 貯水の番人 | 2 | B3F block-cap miniboss; dripping cistern guardian |
| B2 | `enemy.b5f.cinder-keeper` | Cinder Keeper / 灰燼の番人 | 4 | B5F midpoint toll-taker; statue-like, cinder-cloaked |
| B3 | `enemy.b6f.oath-warden` | Oath Warden / 誓いの番人 | 4 | B6F needle-choir guardian; wrapped in broken vows |
| B4 | `enemy.b8f.ash-votary` | Ash Votary / 灰の奉者 | 5 | **final boss**; robed devotee of the Black Stela, ash-crowned; faded cloth, black stone, tarnished charms, dried red cords |

### P2 — Per-block dungeon textures  ✅ generated and wired

The dungeon now uses a wall/floor pair per block (door stays shared).
**Format: JPG 1024², seamless.** Deliver neutral/desaturated (engine tints them).

| Block | Floors | Theme | Wall | Floor |
|-------|--------|-------|------|-------|
| Block 1 | B1 Silent Approach · B2 Split Dust · B3 Cistern Teeth | cold fitted stone, banked dust, dried water-lines | grey fitted ashlar, dust in the joints | flagstone, dust drifts, faint water-marks |
| Block 2 | B4 Turned Lanterns · B5 Toll of Cinders · B6 Narrow Oaths | darker, lantern-soot, cinder-grey, salt crust | soot-streaked stone, old lantern hooks | cinder-grit floor, salt bloom |
| Block 3 | B7 Side Ash Vaults · B8 Gate of Ash | sealed ossuary niches, ash, the black stela | niche-carved stone, sealed slabs, black-glass | ash-caked flag, scorch near the gate |

*(Optional stretch: a unique wall for the finale B8 "Gate of Ash".)*

### P3 — Character portraits  ✅ generated and wired

12 origin **backgrounds**, each with a `portraitKey`. **Format: 512×512
(1:1), painterly bust, neutral dark background, weathered adventurer.** These are
generic "origin" portraits, not per-character. File → `content/worlds/default/assets/portraits/<key>.png`
(fallback stays for player-imported portraits).

| portraitKey | Background (id) | Flavor |
|-------------|-----------------|--------|
| `gate` | watch | town-watch gate guard |
| `ruin` | ruinborn | born among ruins |
| `vial` | apothecary | poison/remedy mixer |
| `coin` | debtor | in debt, desperate |
| `map` | cartographer | map-maker |
| `ward` | shrine_ward | shrine keeper |
| `road` | caravan_guard | caravan escort |
| `pit` | pit_fighter | pit brawler |
| `ink` | scriptorium | scribe |
| `grave` | grave_tender | grave-digger |
| `dock` | dock_rat | dockside urchin |
| `cloak` | deserter | deserter, hidden face |

### P4 — Item & equipment icons  ✅ generated and wired

Inventory, shop, and equipment actions now show icons. **Format: PNG RGBA
256×256, single centered object, painterly, warm rim light.** File →
`content/worlds/default/assets/icons/<id>.png`.

**TODO (added 2026-07-11):** two reach weapons need real icons — `equip.short-bow`
(短弓, a stub recurve bow) and `equip.long-spear` (長柄槍, a long pike/spear). They
currently borrow placeholder icons (dirk / sabre) in `src/ui/artAssets.ts`; replace
with painted icons in the P4 style.

- **Items (5):** `item.healing-draught` (治癒の水薬), `item.lantern-oil` (灯油),
  `item.ashen-key` (灰の鍵 — pale ash-formed key), `item.stela-shard` (黒碑片 —
  shard of black stone), `item.return-charm` (帰還の割符).
- **Equipment (11):** `rusted-dirk`, `militia-sabre`, `ashwood-staff`,
  `split-buckler`, `candle-ward`, `padded-jack`, `ring-mail`, `iron-cap`,
  `grip-gloves`, `chalk-cord`, `black-thread-ring`. Weapons / shields / armor /
  trinkets, all weathered and low-fantasy. (Full stats in
  `content/worlds/default/items.md`.)

### P5 — UI / atmosphere  ✅ generated and wired

- **Title / key art**: title background generated and wired.
- **Minimap marker icons**: 9 markers (`stairs, return, treasure, trap, hazard,
  gather, event, spinner, teleporter`) generated and wired through CSS classes.
- **Combat backdrop**: subtle dark encounter vignette generated and wired behind
  combat information/command regions.

### P6 — Descent stair prop  ✅ generated / ⬜ wiring pending

The return device (black marker + capped shaft / winch cage) and the descent
stair now live in **separate cells** — `room.b1f.006` (Black Marker, return to
town) and `room.b1f.012` (Winding Stair, down to B2F). The stair currently draws
as geometry only. Wanted: a first-person **down-stair prop** that reads clearly
as "descend" from the corridor view, distinct from the return marker.

- **Asset**: `dungeon/stair-down.png` (transparent PNG, billboard-style like the
  enemy sprites, ~768² source), a stone stair curling/biting downward into dark.
- **Read**: must be unmistakably a *down* stair at corridor depth, and must not
  be confused with the return marker (which is a standing black stela + shaft
  cage, not a stair).
- **Tone**: match per-block wall/floor palette; darker lower steps to sell depth.
- **Wiring target**: a stairs-edge prop lookup analogous to
  `getEnemySpriteTextureUrl`, keyed by floor/edge, with a geometry fallback so an
  unmapped floor still renders the current CSS stair.
- **Optional**: a matching **up-stair** variant (`dungeon/stair-up.png`) for the
  arrival-from-below cell.

### P7 — Guild & town still art  ✅ generated and wired

**Wired 2026-07:** both stills now render as the actual backdrops. They resolve
through the pack-scoped resolver as `--art-guild-hall` / `--art-town-hub` (added to
`CSS_ART` in `artAssets.ts`) and are painted by `.guild-tavern-scene` / `.town-scene`
under a light scrim; the old gradient stacks remain as the fallback when a pack ships
no still. The CSS stand-in props (guild-master figure, tavern lantern/counter/table,
town skyline/gate/lanterns/stela/steps) were REMOVED — they sat on top of a real room.
A scenario pack can override either still by dropping its own `ui/guild-hall.jpg` /
`ui/town-hub.jpg`.

Original brief: the town hub and guild character-creation screen rendered their scenes
as **CSS gradient placeholders** (a dim vignette with a stylized figure). They wanted
real establishing stills to give the town/guild a sense of place — backdrops, not
interactive props.

- **Guild interior still** (`ui/guild-hall.jpg`, ~1600×900): the recruiting hall
  where the guild master sits — a lamplit stone room, a ledger desk, the black
  stela's presence felt. Must sit *behind* the guild master dialogue + class
  panels without fighting their legibility (dark, low-contrast, vignetted edges),
  same treatment as the combat vignette.
- **Town / castle-hub still** (`ui/town-hub.jpg`, ~1600×900): the Wizardry-style
  castle hub the party returns to — gate, shop, recovery, records read as a
  place. Backdrop behind the town service menu.
- **Tone**: match the portrait/title palette (warm lamp against near-black); keep
  the center calm so overlaid text/menus stay readable.
- **Wiring target**: same pattern as `ui/combat-vignette.jpg` (CSS
  `background-image` on the guild scene / town scene containers), added to
  `src/ui/artAssets.ts`. Fallback = keep the current CSS gradient if unset.

---

## 5. Suggested order of work

1. **P1 bosses (4)** — complete.
2. **P1 regular enemies (7)** — complete.
3. **P2 block textures (3 wall/floor sets)** — complete.
4. **P3 portraits (12)** and **P4 icons (16)** — complete.
5. **P5 title + minimap markers + combat vignette** — complete.
6. **P6 descent stair prop** — generated; wiring pending.
7. **P7 guild & town still art** — generated and wired (town/guild backdrops).

## 6. Wiring notes (so art actually shows up)

- Enemy sprites use an enemy-id → texture map in `dungeonScene.ts`.
- Wall/floor sets use floor-id → block texture selection in `dungeonScene.ts` /
  `DungeonView.tsx`.
- Portrait/icon/static texture lookup lives in `src/ui/artAssets.ts`; portrait
  fallback for imported data URLs must stay.
- All new assets are static imports or CSS `url(...)` references. Keep filenames
  kebab-case matching the content id.

---

## 7. Combat playback FX (P9 — requested from 2026-07 playtest)

Combat now **plays out blow-by-blow** before the result commits (see #69 in
`docs/gates/past-trouble-regression-gate.md` and `black-stela-combat-ui` memory):
the battlefield renders each beat's snapshot, the struck target shakes, and a
floating damage number (`.hit-number`) rises. **This is currently CSS-only**
(`styles.css`: `@keyframes beat-shake` / `hit-number-rise`; enemy `.defeated`
fade). The player asked "攻撃アニメとかないんでしょうか？" — real art would lift
this from a placeholder to a satisfying hit.

Assets are generated; render wiring is still pending. Each must be a
self-contained static asset (the CSP blocks remote assets) wired the same way as
existing sprites/icons:

- **Impact FX sprite sheet** — a small slash/impact burst (physical) and a
  spark/scorch burst (fire/arcane), 3-5 frames each, transparent PNG, ~96px.
  Play on the struck target for the beat it takes a hit (`kind: "hit"` physical,
  `kind: "cast"` arcane). Keyed by `beat.kind` so 特技 strikes vs 呪文 bolts read
  differently.
- **Enemy hurt/defeat frame** — an optional 2nd enemy-sprite frame (hurt flash +
  a defeat/dissolve pose) so `.defeated` groups show a death beat, not just a
  greyed line-through. One extra frame per enemy sprite in the existing
  enemy-id → texture map.
- **Party-hit reaction** — a subtle red vignette / shield-flash overlay when an
  enemy `kind: "enemyHit"` beat lands on a member (currently just the row shake).
  Generated as `ui/party-hit-reaction.png`.

Wiring target: `activeBeat` in `App.tsx` already exposes `kind`,
`targetGroupId`/`targetCharacterId`, and `damage` per beat — an FX layer can key
off it with no domain change. Keep frames short (≤ the ~430ms/beat cadence, ~300ms
at ×2) so playback never drags.

## 9. Assets to generate (Codex request list)

Generate each into `content/worlds/<pack>/assets/<subfolder>/<basename>.<ext>`
(pack = `default` unless a scenario ships its own) using the conventions in §2
(icons: 256×256 PNG RGBA, centered single object; sprites: PNG RGBA on a chroma-key
bg then extracted). Filenames MUST match these basenames.

**Two different "drop-in" statuses — do not conflate them:**

- **P10 / P11 (icons) are true drop-in.** They ship today as **placeholders that
  reuse existing art** (so the catalog-icon Gate stays green). `catalogIconUrl()`
  is own-basename-first, so the moment the correctly-named file exists it wins over
  the placeholder — **no code change, just a rebuild** (Vite's glob is build-time;
  there is no runtime folder scan, so a rebuild is always required after adding a
  file).
- **P9 (combat FX) is NOT drop-in.** `fx-slash` / `fx-spark` have **no render layer
  yet** — there is nothing that loads or draws them (see §7: hit FX is still
  CSS-only). Generating the sprite sheet alone does nothing; it stays **unused until
  the FX wiring is built** (an FX layer keyed off `activeBeat.kind`). Treat P9 as
  "art + code," not "art only." The per-enemy `-hurt` frame is the same: it needs a
  beat-frame wiring pass before a dropped file is shown.

### P9 — combat hit FX (currently CSS-only; NOT yet drop-in — needs FX wiring; see §7)
Sprite sheets, transparent PNG, ~96px/frame, into `assets/ui/`:
- `fx-slash` (3–5 frames): a physical slash/impact burst for `kind:"hit"`.
- `fx-spark` (3–5 frames): a fire/arcane burst for `kind:"cast"`.
- Optional per-enemy 2nd frame: a hurt-flash + defeat/dissolve pose (drop as
  `dungeon/<enemy>-hurt.png` and we'll wire a beat frame).
- `party-hit-reaction`: 1600×900 transparent red vignette / shield-flash overlay.

Status: generated (`fx-slash.png`, `fx-spark.png`, `party-hit-reaction.png`, and
11 `dungeon/<enemy>-hurt.png` files); wiring pending.

### P10 — equipment icons (`assets/icons/`, 256×256 PNG RGBA) ✅ generated
Reach weapons: `equip-short-bow`, `equip-long-spear`. Tier-2 line:
`equip-steel-sabre`, `equip-war-spear`, `equip-hunting-bow`, `equip-rune-staff`,
`equip-scale-mail`, `equip-war-helm`, `equip-steel-gauntlets`, `equip-tower-shield`.
Effect accessories: `equip-vitality-charm` (life/HP), `equip-focus-band` (MP/mind),
`equip-antivenom-ring` (poison-cure stone), `equip-dreamward-amulet` (sleep/fear
ward), `equip-swift-anklet` (speed). Tier-3 capstones: `equip-knight-plate`,
`equip-warlord-blade`. Match the muted ash/iron palette of the existing icons.

### P11 — consumable icons (`assets/icons/`, 256×256 PNG RGBA) ✅ generated
`item-greater-draught` (richer heal potion), `item-antidote` (green vial),
`item-clarity-draught` (clear/blue vial), `item-calm-draught` (pale vial),
`item-spirit-tonic` (luminous MP tonic). Same bottle family as `item-healing-draught`.

### P12 — Trap floor decal  ✅ generated / ⬜ wiring pending (NOT drop-in)
The armed-trap marker (`input.showTrap` in `dungeonScene.ts`) currently draws as a
flat triangular mesh on the floor ahead. Replace it with a floor decal.
- **Asset**: `dungeon/trap-hazard.png` — a **top-down** view of an armed hazard on a
  single floor tile (spike-plate / blade-slit / snare-rune), read from above since it
  lies flat on the floor. **512×512 PNG RGBA**, transparent outside the trap shape,
  the mark filling ~70% centered.
- **Read**: unmistakably "this tile is dangerous" at corridor depth; distinct from the
  return marker and the stairs. Hazard palette `#b64b35` / `#3a0905`; no baked torchlight.
- **Tone**: sits on the per-block floor texture — grimy, etched into stone, menacing but legible at a glance.
- **Placement**: `content/worlds/default/assets/dungeon/trap-hazard.png`.
- **Wiring target**: swap the `hazardMaterial` cylinder in `dungeonScene.ts` for a
  floor-laid textured quad (a ~0.9-unit `PlaneGeometry` rotated flat, lifted ~0.02 to
  avoid z-fighting) using this texture; keep a geometry fallback if the texture is absent.

Status: generated as `content/worlds/default/assets/dungeon/trap-hazard.png`;
wiring pending.

### P13 — Stela root (finale centerpiece)  ✅ generated / ⬜ wiring pending (NOT drop-in)
The run's climax. Per `docs/scenario/first-scenario-bible.md`, the black stela is not
a monument above the dungeon — the dungeon is its **root**, revealed at the Gate of Ash
(B8). There is no render for it yet; this is the finale's signature prop.
- **Asset**: `dungeon/stela-root.png` — a **tall, camera-facing billboard** of the black
  stela's root/core breaking up through the floor: black-glass / obsidian monolith, ash-
  caked base, pale mask-shards embedded, cold and ominous. **1024×1536 PNG RGBA (2:3
  vertical)**, clean alpha, bottom-weighted (rises from the floor), the most detailed
  single piece in the pack.
- **Read**: bigger and more imposing than any enemy sprite; instantly "THE black stela,
  from below." Block-3 (B7-B8) palette: black-glass, ash, scorch near the gate.
- **Placement**: `content/worlds/default/assets/dungeon/stela-root.png`.
- **Wiring target**: a finale-only prop in `dungeonScene.ts` — a new input flag (e.g.
  `showStelaRoot`, set on the B8 boss room / `isBossFloor` finale) draws it as a large
  camera-facing billboard behind the enemy stage; absent flag / missing texture draws nothing.

Status: generated as `content/worlds/default/assets/dungeon/stela-root.png`;
wiring pending.

### P14 — Enemy sprite REFRAME to the shared scale box  ⬜ requested (2026-07-13 playtest)

**Why.** Real-play verdict: *"敵の画像が妙に小さいし、迷宮から浮いているので素材が泣いてます."*
The art is good; the framing throws it away. Every enemy was delivered in the same
768×512 canvas, so the engine — which plants all sprites at one world size — cannot tell a
slime from a boss, and no creature touches the floor. This is a **reframe, not a redraw**:
keep each creature's design, materials and identity exactly as approved.

**Spec.** The shared scale box in `docs/art/common.md` → *Enemy Sprite Framing*. Summary:
**768×768 square = a fixed 2.4 m × 2.4 m box of the corridor**; the **bottom edge is the
floor line** (standing creatures touch it, hovering ones leave their hover gap); eye level
≈1.5 m; horizontally centred; **no baked shadow / ground / scenery**; size is expressed by
**how much of the box height the creature fills**.

| basename | fills | note |
|---|---|---|
| `ash-slime` | ~30% | low mound; spreads on the floor |
| `dust-crawler` | ~35% | low, long, many-legged |
| `bitter-mote` | ~40% | **hovers** ~0.7 m up; no legs |
| `hook-rat` | ~40% | four-legged, lean |
| `oath-cutter` | ~60% | gaunt humanoid, upright |
| `cistern-warden` | ~75% | mini-boss |
| `lantern-ward` | ~75% | armored blocker; wide, walling |
| `cinder-keeper` | ~80% | mini-boss |
| `oath-warden` | ~85% | mini-boss |
| `vault-husk` | ~85% | heavy blocker; wide |
| `ash-votary` | **~100%** | **the finale boss** — fills the box, crown to floor. Must tower over everything above. |

**Also reframe the 11 `-hurt` variants** to the **same box, same subject scale, same
position** as their base sprite — only the pose/damage differs. Any drift makes the hit
reaction jump.

**Files** (22): `content/worlds/default/assets/dungeon/<name>.png` and `<name>-hurt.png`
for each row above. Same basenames — this is a drop-in replacement, no wiring change.

**Verdant** (`content/worlds/verdant/ART.md`) is ordered against the same box and is still
**undelivered** — generate it to the new spec from the start; do not repeat the 768×512
framing.

## 8. Retake queue (post-integration review)

Everything is generated, wired, and browser-verified (title, enemy sprites,
block textures, portraits, icons, minimap markers, combat vignette). Keep this
section for post-integration art-tone corrections that should not be forgotten.

- [x] **Item / equipment icons (P4) read too dark.** Retaken as brighter,
  higher-contrast 256px icons with stronger local material separation. Future
  icon work must review on a near-black shop-row background and keep object
  silhouettes readable at 32-48px.
- [x] **Portraits lacked party individuality and read too dark in the rail.**
  Retaken as more distinct origin busts with larger faces, clearer props, and
  brighter face/gear midtones. Party rail portrait display was also enlarged
  from 2.75rem to 3.25rem with a slight brightness/contrast lift.

Strong as-is, no retake needed: title key art, enemy sprites (bosses + regulars),
per-block wall/floor textures, combat vignette.
