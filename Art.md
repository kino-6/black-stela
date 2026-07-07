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
desaturated** and let the tint do the coloring. Sprites are lit flat (no engine
lighting), so **paint the light into the sprite** with the warm-key / cool-fill
scheme above.

**Style keywords for prompts:** hand-painted, matte, muted, weathered stone,
soot and ash, torch-lit, grimdark low-fantasy, painterly texture, no outlines on
textures / soft rim light on sprites.

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

**Seamless-tiling reminder.** Walls/floors are repeated (`repeat` values
`[1.35,1]` wall, `[2.1,3.2]` floor), so visible seams or a strong directional
feature will read as an obvious grid. Keep them even and non-directional.

---

## 3. Current inventory (what already exists)

`src/assets/dungeon/` — **5 assets total**:

| File | Size | Use | Gap it leaves |
|------|------|-----|---------------|
| `stone-wall.jpg` | 1024² | every wall on every floor | no per-floor variety |
| `stone-floor.jpg` | 1024² | every floor tile | no per-floor variety |
| `wood-door.jpg` | 1024² | every door | fine as a single door |
| `ash-slime.png` | 768×512 | **every enemy** (combat sprite) | 10 other enemies reuse the slime |
| `return-marker.png` | 576×768 | town-return waystone | ok |

Everything else is currently **CSS-generated or geometry**, no image art:
- **Portraits**: a colored glyph per background (`portrait-asset-<key>` in
  `styles.css`). Players may import their own portrait (stored as a data URL).
- **Minimap markers**: CSS `<i>` icons (`marker-stairs/return/treasure/trap/…`).
- **Items / equipment**: text only (no inventory/shop icons).
- **Return stairs, traps, stela root**: built from Three.js primitives (no texture).
- **Title screen**: CSS type mark, no logo / key art.

---

## 4. Needed art (prioritized)

### P1 — Enemy combat sprites  ⭐ biggest gap

All 11 enemies currently render as the ash-slime. Each needs its own
camera-facing sprite. **Format: PNG RGBA, 768×512 (3:2), flat-lit, single
creature centered & bottom-weighted, clean alpha, warm-key/cool-fill lighting.**
File → `src/assets/dungeon/<id-without-prefix>.png`, wired per-enemy in
`dungeonScene.ts` (a small enemy-id → texture map should replace the hard-coded
`ashSlimeTexture`).

| # | id | Name (EN / 日本語) | Tier | Role | Prompt seed |
|---|----|--------------------|------|------|-------------|
| 1 | `enemy.b1f.ash-slime` | Ash Slime / 灰泥 | 1 | attrition | *(exists)* low pale mound of ash-sludge, dripping grey |
| 2 | `enemy.b1f.dust-crawler` | Dust Crawler / 塵這い | 1 | attrition | many-legged low crawler caked in dust; weak to fire |
| 3 | `enemy.b2f.hook-rat` | Hook Rat / 鉤鼠 | 2 | ambusher | mangy rat with iron hook-scars, quick and lean |
| 4 | `enemy.b3f.bitter-mote` | Bitter Mote / 苦い塵 | 3 | status | floating cyst of green-tinged bitter water/ash; weak to fire |
| 5 | `enemy.b4f.lantern-ward` | Lantern Ward / 灯守 | 3 | blocker | armored sentinel wreathed in inward-facing lantern light |
| 6 | `enemy.b6f.oath-cutter` | Oath Cutter / 誓い断ち | 4 | ambusher | gaunt blade-wielder, scratched-out names on its wraps |
| 7 | `enemy.b7f.vault-husk` | Vault Husk / 納骨殻 | 5 | blocker | hollow ossuary shell, ash pouring from cracks |

**Bosses (make these the strongest, most distinct pieces):**

| # | id | Name (EN / 日本語) | Tier | Where |
|---|----|--------------------|------|-------|
| B1 | `enemy.b3f.cistern-warden` | Cistern Warden / 貯水の番人 | 2 | B3F block-cap miniboss; dripping cistern guardian |
| B2 | `enemy.b5f.cinder-keeper` | Cinder Keeper / 灰燼の番人 | 4 | B5F midpoint toll-taker; statue-like, cinder-cloaked |
| B3 | `enemy.b6f.oath-warden` | Oath Warden / 誓いの番人 | 4 | B6F needle-choir guardian; wrapped in broken vows |
| B4 | `enemy.b8f.ash-votary` | Ash Votary / 灰の奉者 | 5 | **final boss**; robed devotee of the Black Stela, ash-crowned |

### P2 — Per-block dungeon textures

The whole dungeon uses one wall/floor set, so all 8 floors look identical. Give
each of the three **blocks** its own wall + floor pair (door can stay shared).
**Format: JPG 1024², seamless.** Deliver neutral/desaturated (engine tints them).

| Block | Floors | Theme | Wall | Floor |
|-------|--------|-------|------|-------|
| Block 1 | B1 Silent Approach · B2 Split Dust · B3 Cistern Teeth | cold fitted stone, banked dust, dried water-lines | grey fitted ashlar, dust in the joints | flagstone, dust drifts, faint water-marks |
| Block 2 | B4 Turned Lanterns · B5 Toll of Cinders · B6 Narrow Oaths | darker, lantern-soot, cinder-grey, salt crust | soot-streaked stone, old lantern hooks | cinder-grit floor, salt bloom |
| Block 3 | B7 Side Ash Vaults · B8 Gate of Ash | sealed ossuary niches, ash, the black stela | niche-carved stone, sealed slabs, black-glass | ash-caked flag, scorch near the gate |

*(Optional stretch: a unique wall for the finale B8 "Gate of Ash".)*

### P3 — Character portraits (replace CSS glyphs)

12 origin **backgrounds**, each with a `portraitKey`. Today each is a flat CSS
glyph; real bust portraits would lift the guild/roster UI. **Format: 512×512
(1:1), painterly bust, neutral dark background, weathered adventurer.** These are
generic "origin" portraits, not per-character. File → `src/assets/portraits/<key>.png`
(new folder), wired into `renderPortraitContent` in `App.tsx` (fallback stays for
player-imported portraits).

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

### P4 — Item & equipment icons

Inventory and shop are text-only. Icons would help readability. **Format: PNG
RGBA 256×256, single centered object, painterly, warm rim light.** File →
`src/assets/icons/<id>.png` (new folder); requires a small icon lookup in the
shop/inventory JSX (not yet wired).

- **Items (5):** `item.healing-draught` (治癒の水薬), `item.lantern-oil` (灯油),
  `item.ashen-key` (灰の鍵 — pale ash-formed key), `item.stela-shard` (黒碑片 —
  shard of black stone), `item.return-charm` (帰還の割符).
- **Equipment (11):** `rusted-dirk`, `militia-sabre`, `ashwood-staff`,
  `split-buckler`, `candle-ward`, `padded-jack`, `ring-mail`, `iron-cap`,
  `grip-gloves`, `chalk-cord`, `black-thread-ring`. Weapons / shields / armor /
  trinkets, all weathered and low-fantasy. (Full stats in
  `content/worlds/default/items.md`.)

### P5 — UI / atmosphere (lowest priority, nice-to-have)

- **Title / key art**: a logo mark and/or a title background (the black stela
  rising from ash under a dead sky). The title screen is currently CSS type only.
- **Minimap marker icons**: 9 markers (`stairs, return, treasure, trap, hazard,
  gather, event, spinner, teleporter`) are CSS glyphs; a crisp 32×32 icon set
  would sharpen the map.
- **Combat backdrop**: the combat view reuses the corridor; an optional darkened
  "encounter" vignette could set combat apart.

---

## 5. Suggested order of work

1. **P1 bosses (4)** — highest visual impact, one-off hero pieces.
2. **P1 regular enemies (7)** — kills the "everything is a slime" problem.
3. **P2 block textures (2 new sets)** — makes the 8 floors feel distinct.
4. **P3 portraits (12)** then **P4 icons (16)** — UI polish.
5. **P5** — only if there's appetite.

## 6. Wiring notes (so art actually shows up)

- New enemy sprites need an **enemy-id → texture map** in `dungeonScene.ts`
  (currently every enemy hard-codes `ashSlimeTexture`). If a new sprite's aspect
  differs from 3:2, add a per-sprite `scale` there too.
- New wall/floor sets need a **floor-id → block → texture** selection in
  `dungeonScene.ts` / `DungeonView.tsx` (today the URLs are constants).
- Portraits/icons need small lookup helpers + the new `src/assets/portraits/` and
  `src/assets/icons/` folders; portrait fallback (imported data URLs) must stay.
- All new assets are static imports — no runtime loading changes needed, just
  `import` + reference. Keep filenames kebab-case matching the content id.
