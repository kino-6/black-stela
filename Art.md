# Black Stela Art Brief Index

Art guidance is split by responsibility. Read the shared contract first, then the
scenario pack brief for the asset you are generating or reviewing.

- Shared production and drop-in rules: `docs/art/common.md`
- Default / Ash pack: `content/worlds/default/ART.md`
- Verdant pack: `content/worlds/verdant/ART.md`

## Delivery Status

- Default / Ash: P14 and P16 delivered. All fourteen authored enemies now have
  dedicated 768×768 clean-alpha art; the three P16 additions also include hurt
  frames. P6/P9/P12/P13 remain integration work.
- Verdant: **50/50 required files delivered**. Act I's wall structural retake is
  browser-verified; Act II/III textures, fifteen scenario-specific enemies,
  nine item/equipment icons, and the 2026-07-14 Japanese 2D RPG portrait retake
  now ship in the pack.
- Shared character-library pilot: P15 delivered **9/9** for three reusable NPCs
  and three adventurer base/action pairs under Default fallback basenames.
  Runtime wiring remains separate.
- Full adventurer source library: P17 delivered **144/144 masters** covering all
  twelve classes, both genders, three species, and base/attack poses. Masters
  stay outside the eager web asset glob until selected for runtime export.
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
