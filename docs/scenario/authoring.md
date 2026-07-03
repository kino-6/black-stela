# Scenario Authoring Guide

Black Stela scenario packs are Markdown files with YAML front matter. YAML is
scenario truth; Markdown body text is author context and prose notes.

## Required Pack Shape

```text
manifest.md
world.md
dungeons/b1f.md
dungeons/b2f.md
items.md
enemies.md
encounters.md
treasure.md
progression.md
```

`manifest.md` must declare:

- `id`, `title`, `version`
- `supportedLanguages`
- `entryWorld`
- ordered `dungeons`
- optional catalog file paths under `dataFiles`
- `compatibility.minAppVersion`

## Authoring Rules

- Every room id must be unique across the pack.
- Every exit target must point to a real room.
- Every dungeon floor should declare `grid.cells` with stable `x`/`y`
  coordinates, one cell per playable room, and edge metadata for walls, open
  passages, doors, locks, one-way passages, shortcuts, and stairs.
- Room `exits` and grid cell edges must agree. Non-adjacent movement is invalid
  unless the edge is explicitly declared as `stairs`, `shortcut`, `one_way`, or
  a floor transition.
- Every reachable room must be able to route back to an authored town-return
  room through player-visible movement.
- Every non-final floor must have a visible route to a deeper authored floor.
- Key items, encounter tables, treasure tables, enemies, and progression flags
  must be declared before rooms reference them.
- Japanese room text is authored separately; do not machine-translate English
  order into Japanese.

## Debug Import

Run the app with debug mode:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/?debug=1
```

Use `Import scenario pack` and select the pack files. For browser test fixtures,
directory separators can be encoded as `__`, for example
`dungeons__b1f.md`.

Successful import shows the pack title, floor count, and a scenario summary.
Failed import shows grouped validation errors by file, field, category, and
reason.

## Review Checklist

- `npm test` passes scenario parser, pack loader, summary, and prose-gate tests.
- `npm run build` passes.
- Player-clear E2E proves B1F/B2F descent and authored return without debug
  commands.
- Map and rendering checks prove minimap cells, first-person doors/openings,
  stairs, and return markers come from current grid cell state.
- The scenario summary lists floor count, return anchors, next-floor links,
  lock count, loot references, shop stock references, and localization gaps.
- Manual notes in `docs/playtest/first-scenario-notes.md` are updated when
  floor structure, return routes, or combat pressure changes.
