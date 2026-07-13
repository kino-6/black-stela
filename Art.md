# Black Stela Art Brief Index

Art guidance is split by responsibility. Read the shared contract first, then the
scenario pack brief for the asset you are generating or reviewing.

- Shared production and drop-in rules: `docs/art/common.md`
- Default / Ash pack: `content/worlds/default/ART.md`
- Verdant pack: `content/worlds/verdant/ART.md`

## Delivery Status

- Default / Ash: P14 delivered. Its 11 enemy sprites and 11 hurt frames now use
  the ordered 768×768 clean-alpha canvas without redesigning the approved art.
  P6/P9/P12/P13 remain integration work.
- Verdant: **48/48 required files delivered**. Act II/III wall/floor textures,
  fourteen scenario-specific enemy sprites, and eight scenario-specific
  item/equipment icons now ship in the pack. Browser review rejected the Act I
  wall as fitted green masonry; file delivery is complete, but that asset still
  requires a structural retake.
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
- Rebuild after adding files. Vite's asset glob is build-time, not a runtime
  folder scan.
