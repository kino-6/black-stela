# 終端隔離線 — 零番線: asset contract

Status: **F1–F10 canonical map/event/treasure data bound; every F1–F10 enemy has base/hurt art; deep-band in-game framing review pending.** This contract accompanies
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
| F4–F6 rainworks / records | `stone-wall-block2.jpg`, `stone-floor-block2.jpg` | 1024² seamless JPG | generated / runtime placement review pending |
| F7–F9 bureau / liftworks | `stone-wall-block3.jpg`, `stone-floor-block3.jpg` | 1024² seamless JPG | generated / runtime placement review pending |
| F10 terminus | `stone-wall-block4.jpg`, `stone-floor-block4.jpg` | 1024² seamless JPG | generated / runtime placement review pending |
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
- F3–F10 now select the prepared block2–4 depth bands through their map tags. Their encounter catalog is
  also bound to own-basename sprites, not renamed F1/F2 fallbacks. Each file below is a 768² RGBA clean-alpha
  base/hurt pair; hurt is a same-footprint impact color pass so the combat lane does not jump.
  - F3 relay: `enemy.tl3f.relay-tick` → `enemy-tl3f-relay-tick`; `enemy.tl3f.platform-auditor` →
    `enemy-tl3f-platform-auditor`; guardian `enemy.tl3f.transfer-warden` → `enemy-tl3f-transfer-warden`.
  - F4–F6 rainworks / depot / records: `enemy.tl4f.silt-lamprey` → `enemy-tl4f-silt-lamprey`;
    `enemy.tl4f.pump-sentinel` → `enemy-tl4f-pump-sentinel`; `enemy.tl5f.ration-porter` →
    `enemy-tl5f-ration-porter`; `enemy.tl5f.cold-store-widow` → `enemy-tl5f-cold-store-widow`;
    `enemy.tl6f.quarantine-orderly` → `enemy-tl6f-quarantine-orderly`; guardian
    `enemy.tl6f.archive-pallbearer` → `enemy-tl6f-archive-pallbearer`.
  - F7–F10 bureau / control / lift / terminus: `enemy.tl7f.clearance-bailiff` →
    `enemy-tl7f-clearance-bailiff`; `enemy.tl8f.signal-marshal` → `enemy-tl8f-signal-marshal`;
    `enemy.tl9f.lift-custodian` → `enemy-tl9f-lift-custodian`; true guardian
    `enemy.tl10f.zero-line-stationmaster` → `enemy-tl10f-zero-line-stationmaster`.
  - Generated 2026-08-04. Asset-contract and content tests prove IDs and 768² RGBA pairs; 1920 in-game
    contact-grounding, scale, and silhouette readability remain a deliberately separate player-facing review.
- The F2–F10 equipment ladder is now canonical scenario data. Its own-basename 256² icons are deliberately
  **not yet generated**: until the W4 icon batch lands, normal inventory uses the resolver's temporary
  fallback rather than claiming that the new equipment has bespoke visual coverage.
- `item.tl-universal-round` has an icon and data now; shared-ammunition consumption and alert state remain
  W3a rules work, not a fake visual feature in this asset pack.
