# Black Stela — Art Brief

> ハンドオフ用のアート仕様書。現状の素材、技術的な制約、そして必要なアートを
> 優先度つきでまとめてある。Codex（や他の生成AI/絵師）にこのファイルを渡せば、
> 各アセットを「どの形式・寸法・作風で・どこに置くか」まで決めた状態で発注できる。

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

**Formats & placement.** Dungeon art lives in `src/assets/dungeon/` and is
imported directly (`import url from "../assets/dungeon/foo.png"`). Add new files
there and wire them in `src/components/dungeonScene.ts`.

| Kind | Format | Size | Transparency | Notes |
|------|--------|------|--------------|-------|
| Tiling texture (wall/floor/door) | JPG | **1024×1024** | none | must tile **seamlessly** (all 4 edges); door need not tile |
| Camera-facing sprite (enemy/marker) | PNG RGBA | see per-asset | **yes** (clean alpha) | flat-lit, subject centered horizontally |
| Portrait | PNG/JPG | **512×512** (1:1) | optional | framed as a bust; UI crops to a rounded square |
| Icon (item/equipment) | PNG RGBA | **256×256** | yes | single object, centered, generous padding |

**Sprite anchoring & aspect.** The current enemy sprite is `768×512` (3:2
landscape) and is drawn bottom-weighted (`center = 0.5, 0.38`). The return marker
is `576×768` (3:4 portrait). Keep new sprites at the **same aspect as the asset
they replace** unless a per-sprite scale is added in `dungeonScene.ts` (the scale
is currently a fixed constant per sprite type). Leave a few % of transparent
padding so nothing clips at the frame.

**Working background for generated sprites.** Final sprites are PNG RGBA, but
generation should usually happen on a removable chroma-key background first.
Use a perfectly flat single-color background with no shadow, floor, reflection,
texture, or gradient.

- Default for gray/stone/black/white/blue enemies: **GreenBack `#00ff00`**.
- Use **MagentaBack `#ff00ff`** for enemies whose own colors include green or
  yellow-green poison, slime, bile, moss, or patina that could collide with
  GreenBack.
- Never use gray, black, white, or textured preview backgrounds for extraction;
  Black Stela enemies often contain ash, stone, black stela shards, pale masks,
  and gray cloth, so those backgrounds hide edge defects.
- After extraction, review the alpha PNG over mid-gray and in the actual combat
  scene. Check for color fringing, clipped sleeves/robes, detached feet, and
  muddy silhouettes.

**Seamless-tiling reminder.** Walls/floors are repeated (`repeat` values
`[1.35,1]` wall, `[2.1,3.2]` floor), so visible seams or a strong directional
feature will read as an obvious grid. Keep them even and non-directional.

---

## 3. Current inventory (what already exists)

`src/assets/` — **59 assets total**:

| File | Size | Use | Gap it leaves |
|------|------|-----|---------------|
| `stone-wall-block1..3.jpg` | 1024² | per-block dungeon walls | wired by floor id |
| `stone-floor-block1..3.jpg` | 1024² | per-block dungeon floors | wired by floor id |
| `stone-wall.jpg` / `stone-floor.jpg` | 1024² | fallback wall/floor | legacy fallback only |
| `wood-door.jpg` | 1024² | every door | fine as a single door |
| enemy sprites ×11 | 768×512 | combat sprites | wired per enemy id |
| `return-marker.png` | 576×768 | town-return waystone | ok |
| `portraits/*.png` ×12 | 512×512 | origin portraits | wired in character UI |
| `icons/*.png` ×16 | 256×256 | item/equipment icons | wired in shop/inventory/equip UI |
| `minimap/marker-*.png` ×9 | 32×32 | minimap markers | wired through marker CSS classes |
| `ui/combat-vignette.jpg` | 1600×900 | combat UI backdrop | wired in combat frame CSS |
| `title/black-stela-title.jpg` | 1920×1080 | title background | wired in title screen CSS |

Remaining geometry/CSS-only pieces: return stairs, traps, and stela root.
Player-imported portraits still override generated origin portraits.

---

## 4. Needed art (prioritized)

### P1 — Enemy combat sprites  ✅ generated and wired

All 11 authored enemies now have their own camera-facing sprite. Keep future
retakes in the same format: **PNG RGBA, 768×512 (3:2), flat-lit, single creature
centered & bottom-weighted, clean alpha, neutral studio lighting, readable local
material color, no baked torchlight.**
File → `src/assets/dungeon/<id-without-prefix>.png`, wired per-enemy in
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
generic "origin" portraits, not per-character. File → `src/assets/portraits/<key>.png`
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
`src/assets/icons/<id>.png`.

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

---

## 5. Suggested order of work

1. **P1 bosses (4)** — complete.
2. **P1 regular enemies (7)** — complete.
3. **P2 block textures (3 wall/floor sets)** — complete.
4. **P3 portraits (12)** and **P4 icons (16)** — complete.
5. **P5 title + minimap markers + combat vignette** — complete.

## 6. Wiring notes (so art actually shows up)

- Enemy sprites use an enemy-id → texture map in `dungeonScene.ts`.
- Wall/floor sets use floor-id → block texture selection in `dungeonScene.ts` /
  `DungeonView.tsx`.
- Portrait/icon/static texture lookup lives in `src/ui/artAssets.ts`; portrait
  fallback for imported data URLs must stay.
- All new assets are static imports or CSS `url(...)` references. Keep filenames
  kebab-case matching the content id.

---

## 8. Retake queue (post-integration review)

Everything is generated, wired, and browser-verified (title, enemy sprites,
block textures, portraits, icons, minimap markers, combat vignette; build +
174 unit + 54 e2e green). Integration is **not blocked** by the items below —
they are art-tone retakes to re-instruct later.

- [ ] **Item / equipment icons (P4) read too dark.** In the shop and inventory
  the 256px icons sit low-contrast against the near-black `.shop-row` panel and
  are hard to read at a glance. Retake per the "Color and lighting production
  rule": raise midtones/highlights and local-color separation (dull brass,
  rust, bone, pale ash, faded umber) so each object reads on a dark panel
  without the UI adding a lighter plate. Review on a mid-gray background first.
  Affects all 16 item/equipment icons.
- [ ] **Verify portraits at rail size.** Portraits render in the party rail at
  ~2.1rem; confirm each of the 12 origin busts still reads (silhouette + value
  separation) when cropped that small, and regenerate any that muddy down.

Strong as-is, no retake needed: title key art, enemy sprites (bosses + regulars),
per-block wall/floor textures, combat vignette.
