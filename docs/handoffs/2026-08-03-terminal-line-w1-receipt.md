# Terminal Line — W1 canonical pack receipt

Status: **ready to receive, not a scenario pack**. This document is the boundary between
Claude's scenario acceptance and Codex's data/art import. It deliberately contains no
`world.md`, numerical encounter data, or authored grid, so it cannot register a half-made
world or alter normal play.

## Accepted identity

| Field | Value |
| --- | --- |
| Player-facing title | 終端隔離線 — 零番線 |
| Pack folder / asset pack | `terminal-line` |
| Scenario id | `world.terminal-line` |
| Scope of first playable slice | F1 `dungeon.tl1f` + F2 `dungeon.tl2f` and 乗換広場 |

## Claude delivery required before import

One accepted handoff must include every file below, its final IDs, and a table of any
intentional unresolved work. Codex imports values verbatim: artwork may fill a basename,
but it must not create an enemy, room, item, number, reward, or route that the handoff did
not accept.

```text
manifest.md
world.md
town.md
rules.md
items.md
enemies.md
encounters.md
treasure.md
progression.md
quests.md
vocations.md
affixes.md
dungeons/tl1f.md
dungeons/tl2f.md
```

The acceptance table must resolve, at minimum:

- F1/F2 entrance and exit cells, every stairs/door/secret edge, current-cell return point,
  chest/locker, and the two-route teaching encounter.
- The six W0 enemy IDs, their role, `size`/`elevation`/`hover`, encounter membership, and
  every base/hurt asset basename. Changed IDs require an explicit old-to-new mapping.
- The four W0 item IDs, three equipment IDs, the two treasure table IDs, shop availability,
  and every quest/progression flag referenced by a room or edge.
- Japanese and English names/descriptions for player-visible town, room, enemy, item, reward,
  and lock/return copy. Japanese must be authored for the actual target message box.

## Codex import sequence

1. Validate the received files with `loadScenarioPack` and scenario graph validation before
   placing them under `content/worlds/terminal-line/`.
2. Promote only the listed A0 assets from `content/worlds/cordon/assets/`; retain their fixed
   basenames. Generate enemy base/hurt and item/equipment icons one-to-one from the accepted ID
   table, then record source ID, filename, dimensions, and review status in `ART.md`.
3. Run `npm run export:godot`. The existing registry/export pipeline discovers the new
   `world.md`, writes `godot/data/worlds/terminal-line.json`, and stages the pack-owned assets.
   Do not edit `godot/data/**` or `godot/assets/**` by hand.
4. Prove W1's data gate before W2: pack/graph validation, export, and Default/Verdant regression.
   W2 then owns the actual first-person placement and 1280/1920 render review.

## Non-goals

- No temporary world registration, player-facing scenario picker entry, or debug-only route.
- No shared-ammo or alert implementation: those remain W3a's separately gated rule slice.
- No copying default/verdant data as filler. The base catalog may be inherited by the existing
  registry seam; Terminal Line's authored content remains world-owned.
