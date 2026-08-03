# 終端隔離線 — 零番線: F1/F2 asset contract

Status: **F1/F2 canonical data bound / player-facing art review pending**. This contract accompanies
`world.terminal-line`; source data owns every ID, and the files below only provide its visual identity.

## Tone

The outer station is public infrastructure after seventeen wet years: white-grey tile, dull stainless
steel, black rubber flooring, amber maintenance lamps, rainwater, and worn evacuation signs. It is neither
a neon city nor a military bunker. Avoid full-screen flashes, bloom, bright cyan/magenta, floating props,
and baked scene lighting.

## Data-to-asset mapping

| Scenario ID / surface | Own basename | Format | Status |
| --- | --- | --- | --- |
| `dungeon.tl1f`, `dungeon.tl2f` upper station surfaces | `dungeon/stone-wall-block1.jpg`, `stone-floor-block1.jpg` | 1024² seamless JPG | generated / needs first-person review |
| later deep material reservation | `stone-wall-block2..4.jpg`, `stone-floor-block2..4.jpg` | 1024² seamless JPG | generated / unused until later floors |
| normal / sealed passage | `dungeon/wood-door.jpg`, `sealed-door.jpg` | 1024² JPG | generated / needs placement review |
| down / up / return | `dungeon/stair-down.png`, `stair-up.png`, `return-marker.png` | clean-alpha PNG | generated / bind to F1 down, F2 up, call points |
| locker / terminal | `dungeon/supply-locker.png`, `maintenance-terminal.png` | 768² clean-alpha PNG | generated / F1/F2 current-cell landmarks |
| F1/F2 chest state / reward | `dungeon/treasure-chest-closed.png`, `treasure-chest-open.png`, `treasure-reward-still.png` | PNG | generated / must show acquisition centrally |
| F1 enemy catalog | `dungeon/enemy-tl1f-{drain-rat,baton-unit,breath-collector,unmanned-stationmaster}{,-hurt}.png` | 768² RGBA | generated / data bound |
| F2 enemy catalog | `dungeon/enemy-tl2f-{cable-hound,rain-reclaimer}{,-hurt}.png` | 768² RGBA | generated / data bound |
| `item.tl-*`, `equip.tl-*` | `icons/item-tl-*.png`, `icons/equip-tl-*.png` | 256² RGBA | generated / data bound |
| town / entrance / combat | `ui/town-hub.jpg`, `dungeon-entrance.png`, `combat-vignette.jpg` | 1600×900 opaque still | generated / needs runtime review |

## Deliberate gaps

- F1/F2 use the shared party portrait and class-figure fallback. Terminal Line still needs its own 12
  portraits and eight base/action class figures before player-facing art acceptance.
- The generated `block4` texture is a renderer-completeness reservation required by the shared asset gate;
  no F1/F2 map selects it. All F3+ enemies, guardians, facilities, and deep landmarks still belong to the
  later band-by-band W4 delivery, not to a silent Default fallback.
- `item.tl-universal-round` has an icon and data now; shared-ammunition consumption and alert state remain
  W3a rules work, not a fake visual feature in this asset pack.
