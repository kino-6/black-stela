# Black Stela Shared Art Contract

These rules apply to every scenario pack unless that pack's `ART.md` explicitly
overrides them. Pack-specific briefs should stay small: tone, palette, asset list,
and retake notes.

## Asset Placement And Resolution

All art lives under `content/worlds/<pack>/assets/`, not `src/`.

Use these subfolders:

- `dungeon/` for wall/floor textures, doors, stairs, markers, traps, enemies.
- `icons/` for item and equipment icons.
- `portraits/` for character portraits.
- `minimap/` for minimap markers.
- `title/` for title backgrounds.
- `ui/` for town, guild, combat, and FX stills.

Resolution is own-basename-first. An asset id resolves to the matching file
basename after dots are replaced by dashes:

- `equip.steel-sabre` -> `icons/equip-steel-sabre.png`
- `enemy.verdant.g1.moss-mite` -> `dungeon/enemy-verdant-g1-moss-mite.png`

If a correctly named file exists in the active pack, it is used without code
changes after rebuild. Missing ids fall back to the default pack, then to the
temporary placeholder maps in `src/ui/artAssets.ts`.

CSS-referenced art is also pack-scoped through `cssArtVariables()` and custom
properties such as `--art-title`, `--art-combat-vignette`, and minimap marker
variables. Treat these as drop-in assets too.

## Formats

| Kind | Format | Size | Transparency | Notes |
|------|--------|------|--------------|-------|
| Tiling texture | JPG | 1024x1024 | none | seamless on all four edges |
| Door texture | JPG | 1024x1024 | none | readable as a barrier from first-person view |
| Enemy sprite | PNG RGBA | **768x768 square** | yes | the shared scale box — see below. Not negotiable per-pack |
| Prop sprite (stairs, markers) | PNG RGBA | per brief | yes | centered, bottom-weighted, clean alpha |
| Portrait | PNG or JPG | 512x512 | optional | bust framing; must read in party UI |
| Icon | PNG RGBA | 256x256 | yes | single object, centered, generous padding |
| Title still | JPG | 1920x1080 | none | no baked UI text unless the brief asks |
| UI still | JPG | usually 1600x900 | none | town, guild, combat, or pack-specific scene |

Keep replacement sprites at the same aspect ratio as the asset they replace
unless the renderer scale is changed deliberately.

## Enemy Sprite Framing

Enemies are planted **in** the corridor, not pasted over it. **The engine measures the
creature's silhouette from the alpha channel**, stands its real feet on the floor, and
scales its real height to the creature's world size (`Enemy.size` in the scenario data:
small / medium / large / huge). So framing inside the file does **not** decide where the
creature stands or how big it draws — the engine does. What the art must get right is the
alpha.

- **Square canvas, 768x768**, PNG RGBA. Square only so a rank of enemies shares one aspect
  and the line-up spaces evenly; the subject may sit anywhere in it.
- **Clean, honest alpha.** Everything that is not the creature must be fully transparent.
  A stray halo, a faint background wash, or a chroma-key fringe enlarges the measured
  silhouette and pushes the creature off the floor. This is the one rule that matters.
- **One creature per file.** The engine draws a pack as N copies of the sprite side by
  side, so two creatures in one image become four on screen.
- **No baked shadow, no ground plane, no scenery, no glow plate.** The engine casts the
  contact shadow and lights the sprite with the scene. A painted shadow reads as part of
  the body and lifts the creature into the air.
- **Eye level about 1.5 m.** The party is standing: we look slightly *down* at a small
  creature and slightly *up* at a boss. Front or three-quarter view, no dramatic angles.
- Fill the frame generously — resolution spent on empty canvas is resolution the creature
  does not get. There is no fill percentage to hit; the engine normalises it.

A `-hurt` variant must keep the **same silhouette footprint** as its base sprite (same
stance, same extents); only the pose/expression/damage differs. If the silhouette shifts,
the creature jumps when it is struck.

## Color, Lighting, And Readability

- Asset color comes from material identity, not from baked scene lighting.
- Use neutral studio lighting for sprites and enough midtones to survive darker
  in-game lighting.
- Do not bake torch orange, fog, bloom, rim light, global grading, particles, or
  cast shadows into the asset.
- Do not submit nearly grayscale art unless the subject is intentionally
  monochrome and still has strong value separation.
- Do not let important forms sit near black. The renderer can darken assets; it
  cannot recover detail that was never painted.
- Strong local color is allowed and often required: poison, patina, bile,
  mineral stains, brass, bone, dried red cord, sap, pollen, or magical cores can
  define the subject.
- Internal emissive features are allowed when they are part of the creature or
  prop itself. They must not become global scene lighting.
- Each enemy must read as an enemy at combat size. A tasteful texture is a
  failure if the silhouette and tactical role are unclear.

## Chroma-Key And Alpha

Final sprites are PNG RGBA, but generation may use a removable chroma-key
background.

- Use GreenBack `#00ff00` for gray, stone, black, white, blue, or red subjects.
- Use MagentaBack `#ff00ff` for green, yellow-green, slime, bile, moss, patina,
  or plant subjects.
- Never use gray, black, white, textured, shadowed, gradient, or reflective
  backgrounds for extraction.
- After extraction, review the alpha over mid-gray and in the actual game scene.
  Check fringing, clipped limbs, detached feet, muddy silhouettes, and hidden
  details.

## Texture Rules

Walls and floors repeat in the dungeon renderer, so visible seams or strong
directional marks become obvious quickly. Keep tiling textures even,
non-directional, and readable after tinting.

Doors and barriers do not need to tile, but they must match the current map
truth. If the map says a wall blocks movement, the view must not imply a
walkable passage.

## Review Checklist

Before calling art done:

- Confirm the asset is in the intended pack folder with the exact basename.
- Confirm the asset is not just a recolor of another pack.
- Confirm it reads against a mid-gray preview background.
- Confirm it reads at actual UI or combat size.
- Run `npm run test -- tests/artAssets.test.ts` when changing asset names,
  resolver behavior, pack references, or required asset lists.
- Run `npm run build` when claiming assets are wired into the application.
- Use browser screenshots when claiming player-facing visibility, layout, or
  in-game presentation.

