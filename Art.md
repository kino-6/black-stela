# Black Stela Art Brief Index

Art guidance is split by responsibility. Read the shared contract first, then the
scenario pack brief for the asset you are generating or reviewing.

- Shared production and drop-in rules: `docs/art/common.md`
- Default / Ash pack: `content/worlds/default/ART.md`
- Verdant pack: `content/worlds/verdant/ART.md`

## Delivery Status

- Physical-file re-audit (2026-07-20): **no missing required art**. All 59
  authored catalog ids have own-basename 256x256 RGBA icons (Default 46,
  Verdant 13); the current eight-class adventurer matrix has 96 canonical
  source masters plus 48 retained optional legacy variants; all audited
  character, enemy/hurt, facility, and support deliverables match their required
  dimensions and alpha contracts. Remaining items called "pending" below are
  runtime wiring or optional enhancements, not ungenerated assets.
- Default / Ash: P14, P16, P18, and P19 delivered. All fourteen authored enemies now have
  dedicated 768×768 clean-alpha art; the three P16 additions also include hurt
  frames. P18 adds five town NPCs, seven dungeon objects, and eight own-basename
  catalog icons. P19 adds four lossless town-facility backgrounds.
  P6/P9/P12/P13/P18/P19 runtime integration remains.
- Verdant: **58/58 required files delivered**. Act I's wall structural retake is
  browser-verified; Act II/III textures, fifteen scenario-specific enemies,
  thirteen item/equipment icons, and the 2026-07-14 Japanese 2D RPG portrait retake
  now ship in the pack. Four P19 facility backgrounds replace Default fallback
  architecture with living-root grove-town locations.
- Shared character-library pilot: P15 delivered **9/9** for three reusable NPCs
  and three adventurer base/action pairs under Default fallback basenames.
  Runtime wiring remains separate.
- Full adventurer source library: P17 delivered **144/144 masters** covering all
  twelve classes, both genders, three species, and base/attack poses. Masters
  stay outside the eager web asset glob until selected for runtime export.
- Support art extension: P18 delivered **24/24** files: five service NPCs,
  seven first-person dungeon objects, eight Default catalog icons, and four
  Verdant catalog icons.
- Town facility extension: P19 delivered **8/8** lossless 1600×900 PNG
  backgrounds: market/workshop, infirmary, archive lodge, and dungeon entrance
  for both Default and Verdant.
- **P20 delivered (2026-07-20)**: the eight current class IDs now have a 96-master source matrix and
  sixteen selected runtime base/action masters. Warrior uses the former vanguard line; Thief uses the
  former lock-tool cutpurse line. Godot resolves each class directly (including legacy-save mapping), and
  its asset gate asserts every staged master. The other merged P17 lines remain optional future variants.
- **P21 source-library delivered (2026-07-20): advanced-vocation visual continuity.** Every authored advanced vocation
  receives at least one male and one female 1024×1536 RGBA **base** master. This is not an outfit swap on
  an arbitrary existing person: character identity must stay stable across a vocation change, and a
  custom `visualProfile` must always win. Until the registration/appearance model stores a stable visual
  lineage, the runtime must keep the character's existing basic-class image rather than choose a
  differently gendered advanced image. The masters are therefore generated and reviewed first, then
  wired only with that identity-preserving resolver.

  | Batch | Pack | Vocations | Required base masters | Status |
  | --- | --- | --- | ---: | --- |
  | A | Default / Ash | 灰の刃 `ash-reaver` | male + female | **2/2 delivered** |
  | B | Default / Ash | 塩の守り手, 星の信徒 | 4 | **4/4 delivered** |
  | C | Default / Ash | 針舞い, 塵路師, 灯巡り | 6 | **6/6 delivered** |
  | D | Verdant | 茨砕き, 樹皮守, 露刃 | 6 | **6/6 delivered** |
  | E | Verdant | 梢読み, 樹液結び, 胞子見 | 6 | **6/6 delivered** |
  | F | Runtime | stable appearance lineage, advanced-vocation resolver, controller/browser proof | — | blocked on explicit lineage implementation |

  Source filename: `content/worlds/<pack>/source-art/vocations/vocation-<slug>-human-<male|female>-base.png`.
  Each source master has clean alpha, neutral studio lighting, full figure, and a distinct role silhouette.
  A runtime derivative may only be exported under `assets/characters/` after it can be selected from the
  adventurer's own stored appearance lineage; never infer a gender from a class, name, or current party
  slot. Attack mates are a later paired delivery, after the advanced techniques themselves have stable
  player-facing animations/commands to depict.
- Optional Verdant minimap marker overrides are not included in the required
  count.

## Routing

1. For any asset work, start with `docs/art/common.md`.
2. For Black Stela's default ash dungeon, use `content/worlds/default/ART.md`.
3. For Verdant / drowned-wood assets, use `content/worlds/verdant/ART.md`.
4. For a new scenario pack, create `content/worlds/<pack>/ART.md` and keep only
   pack-specific tone, asset list, and retake notes there.

## Non-Negotiables

- Do not recolor one scenario's assets and call it a new world. A new pack needs
  new structure, materials, silhouettes, and palette logic.
- Do not ship placeholders as final art when the screen asks the player to care
  about enemies, doors, stairs, portraits, traps, or locations.
- Do not bake torchlight, fog, bloom, scene shadows, or global color grading into
  assets. Program-side lighting owns atmosphere; asset art owns material color,
  silhouette, and identity.
- Do not remove color while trying to stay grim. Low fantasy is not grayscale.
- Character portraits must read as an original Japanese 2D game ensemble, not
  photorealistic headshots, generic generated concept art, or a demographic
  checklist. Role silhouette and personality must survive at gameplay size.
- Rebuild after adding files. Vite's asset glob is build-time, not a runtime
  folder scan.
