# Black Stela Art Brief Index

Art guidance is split by responsibility. Read the shared contract first, then the
scenario pack brief for the asset you are generating or reviewing.

- Shared production and drop-in rules: `docs/art/common.md`
- Default / Ash pack: `content/worlds/default/ART.md`
- Verdant pack: `content/worlds/verdant/ART.md`

## Delivery Status

- Physical-file re-audit (2026-07-20): **no missing required art**. All 59
  authored catalog ids have own-basename 256x256 RGBA icons (Default 46,
  Verdant 13); the 144-file adventurer source matrix is complete; all audited
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
- **P20 requested (2026-07-20), not started**: the rules consolidated twelve classes into eight
  (`docs/design/class-system.md` §4). P17's 144 masters are filed under the twelve OLD names, so the
  runtime maps eight classes onto three portraits and every new adventurer wears the same face. Brief:
  `content/worlds/default/ART.md` §P20 — five lines only need re-filing, two need an anchor chosen, and
  repainting is optional and last.
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
