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

`content/worlds/default/assets/` — **141 assets total** (49 `dungeon/` incl. 14
enemy sprites + 14 hurt frames + return/stair props + block/fallback textures +
door + trap/stela/support props, 46 `icons/`, 12 `portraits/`, 14 `characters/`, 9
`minimap/`, 1 `title/`, 10 `ui/`):

| File | Size | Use | Gap it leaves |
|------|------|-----|---------------|
| `stone-wall-block1..3.jpg` | 1024² | per-block dungeon walls | wired by floor id |
| `stone-floor-block1..3.jpg` | 1024² | per-block dungeon floors | wired by floor id |
| `stone-wall.jpg` / `stone-floor.jpg` | 1024² | fallback wall/floor | legacy fallback only |
| `wood-door.jpg` | 1024² | every door | fine as a single door |
| enemy sprites ×14 | 768×768 | combat sprites | P14/P16 delivered; wired per enemy id |
| enemy hurt frames ×14 | 768×768 | combat hit/defeat frames | P14/P16 delivered; FX wiring pending |
| `return-marker.png` | 576×768 | town-return waystone | ok |
| `stair-down.png` / `stair-up.png` | 768² | descent/ascent stair props | generated; stair sprite wiring pending |
| `trap-hazard.png` | 512×512 | floor trap decal | generated; trap decal wiring pending |
| `stela-root.png` | 1024×1536 | finale black-stela root prop | generated; finale prop wiring pending |
| P18 dungeon objects ×7 | 768×768 | chest states and visible exploration affordances | generated; runtime wiring pending |
| `portraits/*.png` ×12 | 512×512 | origin portraits | wired in character UI |
| `characters/*.png` ×14 | 1024×1536 | NPCs and adventurer base/action pairs | P15/P18 delivered; runtime wiring pending |
| `icons/*.png` ×46 | 256×256 | item/equipment icons | wired in shop/inventory/equip UI |
| `minimap/marker-*.png` ×9 | 32×32 | minimap markers | wired through marker CSS classes |
| `ui/combat-vignette.jpg` | 1600×900 | combat UI backdrop | wired in combat frame CSS |
| `ui/guild-hall.jpg` / `ui/town-hub.jpg` | 1600×900 | town/guild backdrops | wired as the town/guild scenes |
| P19 facility backgrounds ×4 | 1600×900 PNG | market, infirmary, archive, dungeon entrance | generated; town-service wiring pending |
| `ui/fx-slash.png` / `ui/fx-spark.png` | 480×96 | combat FX sheets | generated; FX wiring pending |
| `ui/party-hit-reaction.png` | 1600×900 | party damage overlay | generated; FX wiring pending |
| `title/black-stela-title.jpg` | 1920×1080 | title background | wired in title screen CSS |

Delivery audit (2026-07-19): P14/P16/P18/P19 are delivered. All fourteen authored
Default enemies now have dedicated 768×768 clean-alpha art; all fourteen also
have matching hurt frames. P18 adds five service NPCs, seven dungeon objects,
and eight own-basename catalog icons. P19 adds four lossless facility
backgrounds. P6/P9/P12/P13/P18/P19 still need wiring
passes before every delivered asset appears in normal play. Player-imported
portraits still override generated origin portraits.

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

The two reach-weapon icons requested on 2026-07-11 are delivered as
`equip-short-bow.png` and `equip-long-spear.png`. The fallback entries remain in
`src/ui/artAssets.ts` for compatibility, but own-basename resolution selects the
delivered files first.

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

### P14 — Enemy sprite retake: square canvas + clean alpha  ✅ delivered (2026-07-13)

**Why.** Real play: *"敵の画像が妙に小さいし、迷宮から浮いているので素材が泣いてます."*
The art is good; it was being thrown away by the renderer. That is now **fixed in code**:
the engine measures each creature's silhouette from the alpha channel, stands its real feet
on the floor, and scales its real height to the creature's size class in the scenario data.
**Size and grounding are no longer the artist's problem** — no fill percentages to hit, no
floor line to align.

What remains is a small, cheap retake, and it is entirely about the **alpha**:

- **Square 768×768** (today's files are 768×512). Square only so a rank of enemies shares
  one aspect and spaces evenly.
- **Clean alpha** — everything that is not the creature fully transparent. A chroma-key
  fringe or a faint background wash enlarges the measured silhouette and lifts the creature
  off the floor. This is the rule that matters.
- **No baked shadow / ground plane / scenery.** The engine casts the contact shadow. A
  painted one reads as body and makes the creature hover.
- Fill the frame generously — there is no target percentage; the engine normalises size.

Keep every creature's design, materials and identity exactly as approved. **This is a
reframe/re-key, not a redraw.**

**Files** (22): `content/worlds/default/assets/dungeon/<name>.png` and `<name>-hurt.png` for
each of ash-slime, dust-crawler, hook-rat, bitter-mote, lantern-ward, oath-cutter,
vault-husk, cistern-warden, cinder-keeper, oath-warden, ash-votary. Same basenames — a
drop-in replacement, no wiring change. A `-hurt` frame must keep its base sprite's
silhouette footprint, or the creature jumps when struck.

**Size is data, not art.** Each enemy carries `size:` in `content/worlds/*/enemies.md`
(small / medium / large / huge). Retune there if a creature reads wrong on screen — do not
re-order art for it.

**Verdant** (`content/worlds/verdant/ART.md`) is delivered against the same
square-canvas and clean-alpha rules.

### P15 — Character library pilot  ✅ 9/9 delivered / ⬜ wiring pending

Create a small engine-neutral character library under
`content/worlds/default/assets/characters/`. These files are Default/Ash art,
but their basenames form the fallback contract for future scenario overrides
and the Godot/Babylon runtime comparison.

**Style:** an original Japanese 2D dungeon-RPG ensemble: clear inked contours,
expressive faces, readable costume silhouettes, cel-like shadow groups with
restrained painterly texture. Adult low-fantasy adventurers, not photorealistic
concept portraits, modern fashion, generic mobile-game glamour, or a demographic
checklist. Give each role a distinct body shape, posture, equipment silhouette,
and controlled local colors. Do not copy a proprietary character or a living
artist's style.

**Format:** 1024x1536 PNG RGBA, clean alpha, one figure, neutral studio lighting,
no backdrop, floor, cast shadow, frame, text, torch wash, fog, particles, or
global color grade.

Pilot delivery:

| Basename | Subject | Required read |
| --- | --- | --- |
| `npc-guild-master` | seasoned guild master with ledger and keys | judges candidates; not a clerk in modern uniform |
| `npc-merchant` | practical arms-and-supplies merchant | worn apron, scales, wrapped goods; not comic relief |
| `npc-healer` | field-trained town healer | bandages, medicine case, calm authority; not a glowing saint |
| `adventurer-vanguard-base` | spear-and-shield front-liner | planted stance, ash-blue coat, dull brass and iron |
| `adventurer-vanguard-attack` | same vanguard driving the spear forward | same identity and gear; decisive diagonal action |
| `adventurer-mender-base` | back-row healer with staff and satchel | practical medic, pale cloth and muted red bindings |
| `adventurer-mender-attack` | same mender striking or invoking a compact ward | same identity; restrained contained focus only |
| `adventurer-arcanist-base` | ash scholar with short staff and black-glass focus | alert caster, blue-violet cloth and tarnished fittings |
| `adventurer-arcanist-attack` | same arcanist releasing a compact spell gesture | same identity; no full-screen spell or scene light |

Acceptance:

- Base/action pairs remain the same person at portrait and combat-lane sizes.
- Every silhouette and role reads at 160px high without labels.
- Alpha corners are transparent and no chroma-key fringe remains.
- A contact sheet passes alongside the existing Verdant portrait direction
  before the library expands to the remaining starter roles and service NPCs.
- Delivery alone does not wire attack switching. Runtime integration is a
  separate task and should target the selected Godot/Babylon presentation API.

Delivery audit (2026-07-18): all nine files are 1024x1536 PNG RGBA with
transparent corners. Base/action pairs preserve their face, hair, costume,
equipment, and dominant colors. Review contact sheet:
`docs/evidence/art-character-library-p15/contact-sheet.png`.

Packaging note: the current Vite eager asset glob includes all nine source
masters in the web build before runtime wiring (about 11 MB total). Preserve
these 1024x1536 masters, but generate and load runtime derivatives selectively
when the Godot/Babylon presentation layer is chosen.

### P16 — Missing authored-enemy coverage  ✅ 7/7 delivered

Four enemies already present in scenario data were falling through to another
enemy's fallback art. Deliver dedicated own-basename sprites without changing
enemy stats, encounter weights, or combat behavior.

| File | Subject | Delivery |
| --- | --- | --- |
| `enemy-b2f-ash-warden.png` | broad ash-stone blocker with shield-body and crimson bindings | base + hurt |
| `enemy-b2f-ash-caller.png` | hovering masked caster with black-stone tablets and contained cinder core | base + hurt |
| `enemy-rare-ashsilver-glimmer.png` | small mirrored reliquary-moth rare enemy | base + hurt |
| Verdant `enemy-verdant-rare-gilded-sporecloud.png` | compact gilded seedpod colony; no loose particle cloud | base |

All seven files use the shared 768×768 clean-alpha contract. Their exact
enemy-id basenames win through the existing own-basename-first resolver, so no
renderer or balance code changed. Review sheet:
`docs/evidence/art-enemy-coverage-p16/contact-sheet.png`.

### P17 — Full adventurer source library  ✅ 144/144 delivered

Produce the full built-in class catalog as engine-neutral source masters under
`content/worlds/default/source-art/adventurers/`. These are not included by the
current Vite runtime glob; selected characters are exported into
`assets/characters/` when runtime integration lands.

Coverage: 12 classes × `human` / `sylvan` / `beastkin` × `male` / `female` ×
`base` / `attack` = **144 PNG RGBA files**.

Identity rules:

- A base/attack pair is the same person, clothing, weapon, proportions, and
  dominant colors.
- Human, sylvan, and beastkin versions are distinct people with species-specific
  anatomy and material culture, not palette swaps.
- Male/female versions receive equal visual authority and practical protection.
- Class silhouette wins over decoration at combat-lane size.
- Attack stills contain the decisive pose only; impact, enemies, floor, camera
  shake, particles, and full-screen magic remain runtime effects.

Class reads:

| Class | Base silhouette | Attack read |
| --- | --- | --- |
| vanguard | spear, round shield, planted coat | shield-led spear drive |
| sellsword | practical sabre, worn half-coat | economical diagonal cut |
| bulwark | tower shield, heavy layered armor | shield brace / crushing shove |
| duelist | slim blade, light asymmetric coat | precise forward lunge |
| seeker | dirk, chalk cord, inspection tools | low opportunistic strike |
| scout | short bow, trail markers, light pack | fast aimed shot |
| cutpurse | dirk, lock tools, close jacket | quick concealed-hand slash |
| mender | staff, medical satchel, candle ward | compact healing/ward gesture |
| chanter | staff, prayer slips, layered stole | warding chant with raised seals |
| occultist | grimoire, black thread, ritual focus | contained binding hex |
| arcanist | ash staff, black-glass focus | compact destructive casting pose |
| wayfinder | short bow, map case, chalk marks | covering shot while directing route |

Delivery audit (2026-07-18): all 144 masters are delivered as distinct
1024x1536 PNG RGBA files with clean alpha. The set covers all twelve classes,
both genders, all three species, and matching base/attack poses. Pair review
confirmed persistent identity, practical equipment, species-specific anatomy,
and readable class silhouettes without scenery or baked combat effects.

Review sheets:

- `docs/evidence/art-adventurer-library-p17/all-base-contact.png`
- `docs/evidence/art-adventurer-library-p17/all-attack-contact.png`
- `docs/evidence/art-adventurer-library-p17/all-pairs-contact.png`

Runtime selection, portrait cropping, and per-character export remain a separate
integration pass. Keep the complete 1024x1536 library outside `assets/` so Vite
does not eagerly bundle 178 MB of unused source masters.

### P18 — Service NPCs, dungeon objects, and catalog gaps  ✅ 24/24 delivered

This extension fills player-visible roles that had data or service screens but
no own art. Delivery does not implement chest, chamber, thief, or dungeon-object
behavior; those remain controller-first runtime work.

Town NPCs, `assets/characters/`, 1024x1536 PNG RGBA:

- `npc-appraiser`, `npc-smith`, `npc-archivist`
- `npc-vocation-master`, `npc-quest-broker`

Dungeon objects, `assets/dungeon/`, 768x768 PNG RGBA:

- `treasure-chest-closed`, `treasure-chest-open`
- `rest-point`, `gather-cache`
- `teleporter-floor`, `spinner-floor`, `secret-door-revealed`

Default catalog icons, `assets/icons/`, 256x256 PNG RGBA:

- `item-ashroot-tonic`, `item-whetstone-rite`
- `item-emberwit-ash`, `item-deed-of-passage`
- `equip-ember-brand`, `equip-salt-etched-blade`
- `equip-starlit-needle`, `equip-cinder-warded-jack`

The matching four Verdant catalog icons are recorded in that pack's brief.
Every file has clean alpha, neutral asset lighting, no baked scene, and a
distinct hash. Review sheets:

- `docs/evidence/art-support-library-p18/npc-contact.png`
- `docs/evidence/art-support-library-p18/dungeon-object-contact.png`
- `docs/evidence/art-support-library-p18/icon-contact.png`

### P19 — Town facility backgrounds  ✅ 4/4 delivered

These 1600x900 lossless PNG masters give the town hierarchy authored locations
without baking NPCs, UI frames, readable signs, or global torch grading into the
scene:

- `ui/market-workshop.png` — shop, appraisal, and Forge location
- `ui/infirmary.png` — recovery and treatment
- `ui/archive-lodge.png` — records, bestiary, and quest notices
- `ui/dungeon-entrance.png` — practical departure and return checkpoint

The files are compositionally compatible with transparent NPC overlays and
fixed controller command windows. They are not wired by this art-only delivery.
Review sheet:

- `docs/evidence/art-facilities-p19/facility-contact.png`

### P20 — Adventurer masters for the CONSOLIDATED eight classes  ✅ 96 source / 16 runtime masters (2026-07-20)

**Why this exists.** The class roster changed in the rules, not in the art. Twelve labels became eight
classes (`docs/design/class-system.md` §4, shipped in Section 8 item 3): the three near-identical trap
classes became one Thief, the two near-identical front-liners one Warrior, and the route-keeper folded
into the Thief. P17's 144 masters are all still good paintings — but they are filed under the twelve old
names, so the runtime currently maps eight classes onto **three** portraits and every new adventurer
wears the same face. That fallback (`_portrait_class` in `godot/scripts/combat.gd` / `dungeon.gd`) is the
thing this brief retires.

**What the mapping was** (authoritative table: `src/domain/classIds.ts`):

| New class | JA | Grew from | What survives from P17 |
| --- | --- | --- | --- |
| warrior | 戦士 | vanguard + sellsword | vanguard's spear-and-shield read is the anchor; sellsword's worn half-coat is a valid variant |
| knight | 盾騎士 | bulwark | unchanged |
| swordmaster | 剣客 | duelist | unchanged |
| thief | 盗賊 | seeker + scout + cutpurse + wayfinder | seeker's tools + cutpurse's close jacket; keep bow/map-case people as variants, not as the anchor |
| priest | 癒し手 | mender | unchanged |
| chanter | 祈祷師 | chanter | unchanged |
| mage | 灰術師 | arcanist | unchanged |
| occultist | 秘術師 | occultist | unchanged |

**Delivered — smallest useful pass.** The selected P17 lines now use the eight current IDs. The Warrior
anchor is the former `vanguard` spear-and-shield line; the Thief anchor is the former `cutpurse` line,
whose lock tools make the current role legible. The old `sellsword`, `seeker`, `scout`, and `wayfinder`
masters remain outside the canonical matrix as optional future variants; no painting was discarded.

1. **Rename / re-file** the five unchanged lines (bulwark→knight, duelist→swordmaster, mender→priest,
   arcanist→mage, occultist→occultist, chanter→chanter) so filenames match the class ids the runtime
   asks for: `adventurer-<classId>-<species>-<gender>-<pose>.png`.
2. **Choose the anchor** for `warrior` and `thief` from the existing merged masters, and re-file it.
   No repaint required to close the fallback — an honest face per class beats a new face per class.
3. **Then, if you want to paint**: the merged classes lost silhouette variety when four became one. A
   second and third `thief` variant (the bow-and-map person, the lock-tools person) and a second
   `warrior` variant (the sellsword's coat) keep a six-person party from looking like clones. Optional,
   and after (1) and (2).

**Class reads for the eight** (supersedes P17's twelve-row table for anything newly painted):

| Class | Base silhouette | Attack read |
| --- | --- | --- |
| warrior | spear or sabre, round shield, planted coat | shield-led drive / economical diagonal cut |
| knight | tower shield, heavy layered armor | shield brace, crushing shove |
| swordmaster | slim blade, light asymmetric coat | precise forward lunge |
| thief | dirk, lock tools and chalk cord, close jacket | low opportunistic strike |
| priest | staff, medical satchel, candle ward | compact healing / ward gesture |
| chanter | staff, prayer slips, layered stole | warding chant with raised seals |
| mage | ash staff, black-glass focus | compact destructive casting pose |
| occultist | grimoire, black thread, ritual focus | contained binding hex |

**Rules unchanged from P17**: 1024×1536 PNG RGBA, clean alpha, base/attack are the same person, species
are distinct people rather than palette swaps, male and female get equal authority and equal practical
protection, silhouette wins at combat-lane size, no baked impact/particles/scenery.

**Completed definition of done**: the eight class ids each resolve to their own Default-pack base master,
with the action mate staged beside it; legacy saves resolve through the exported class mapping. The former
`_portrait_class` three-way collapse is deleted, and `godot/tests/verify_assets.gd` now asserts all
sixteen runtime masters before a package can pass.

**Not in scope**: nothing in the rules waits on this. The consolidation is shipped and green; this is the
art catching up with it.

## 8. Retake queue (post-integration review)

The pack art order through P20 is delivered.
P6/P9/P12/P13/P15/P17/P18/P19 still contain unwired presentation work.
Keep this section for post-integration art-tone corrections that should not be
forgotten.

- [x] **Item / equipment icons (P4) read too dark.** Retaken as brighter,
  higher-contrast 256px icons with stronger local material separation. Future
  icon work must review on a near-black shop-row background and keep object
  silhouettes readable at 32-48px.
- [x] **Portraits lacked party individuality and read too dark in the rail.**
  Retaken as more distinct origin busts with larger faces, clearer props, and
  brighter face/gear midtones. Party rail portrait display was also enlarged
  from 2.75rem to 3.25rem with a slight brightness/contrast lift.

Strong as-is, no redesign needed: title key art, enemy designs (bosses +
regulars), per-block wall/floor textures, combat vignette. Enemy files now use
the P14 square-canvas/clean-alpha delivery format without changing designs.
