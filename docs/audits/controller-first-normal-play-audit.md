# Controller-First Normal-Play Audit

Date: 2026-07-04

## Expectation

Normal play must behave like a DRPG command surface: directional focus, confirm,
cancel/back where meaningful, fixed command/message areas, and no mouse-only
primary path.

## Past Trouble Checked

- Controller-first rule drift: player-facing work shipped without directional
  focus proof.
- Web-admin residue: town, guild, shop, and records could become scattered
  browser controls.
- Command shift: logs/messages could push commands or focus targets around.
- Headless overclaim: reachability could be mistaken for playable UX proof.

## Surface Audit

| Surface | Result | Browser state | Regression proof |
| --- | --- | --- | --- |
| Title/config | Pass | Config opens from title focus; language select receives focus. | `tests/e2e/controller.spec.ts` |
| Guild registration | Pass | Briefing, class, appearance, back/cancel, and six-person proposal flow are keyboard reachable. | `tests/e2e/controller.spec.ts`, `tests/e2e/character-creation.spec.ts` |
| Town tabs | Pass | Shop, records, dungeon entry, and return to entry are reachable by focus traversal after party setup. | `tests/e2e/controller.spec.ts`, `tests/e2e/town.spec.ts` |
| Shop/equipment | Pass | Stock buy and equipment actions remain in the command traversal; no admin table requirement. | `tests/e2e/controller.spec.ts`, `tests/e2e/town.spec.ts` |
| Recovery | Pass | Recovery is a town service with visible cost and paid action; no free return/heal shortcut. | `tests/e2e/town.spec.ts`, `tests/e2e/tempo.spec.ts` |
| Records | Pass | Records screen is reachable through town tabs and keeps entry command accessible. | `tests/e2e/controller.spec.ts`, `tests/e2e/town.spec.ts` |
| Dungeon | Pass | Move/turn/search/listen/context commands are fixed and focus reachable; minimap/view parity has browser checks. | `tests/e2e/controller.spec.ts`, `tests/e2e/player-clear.spec.ts`, `tests/e2e/map.spec.ts` |
| Combat | Pass | Commands advance through party order; actor cards are status, not mouse-first selection; command window stays stable. | `tests/e2e/controller.spec.ts`, `tests/e2e/combat.spec.ts` |
| Repeat/auto | Pass | Repeat starts and stops through focused confirm and stops on unsafe/interesting states. | `tests/e2e/controller.spec.ts`, `tests/e2e/tempo.spec.ts` |
| Japanese/mobile | Pass | Guild, shop, combat, tempo, and map mobile states have no horizontal overflow checks. | `tests/e2e/character-creation.spec.ts`, `tests/e2e/town.spec.ts`, `tests/e2e/combat.spec.ts`, `tests/e2e/tempo.spec.ts` |

## Browser Evidence

- `npm run test:e2e -- tests/e2e/controller.spec.ts`
- `npm run test:e2e -- tests/e2e/screenshot-review.spec.ts`
- Full `npm run test:e2e`

Screenshot states are generated under `test-results/screenshot-review/` and
cover title, guild, dungeon, combat, map progression, return marker, town, shop,
Japanese mobile guild, scenario import, and B2F entry.

## Headless Limitation

`npm run headless:reachability` proves deterministic route reachability only. It
does not prove controller focus order, visual hierarchy, Japanese layout,
message stability, or whether a screen feels like a DRPG rather than a web app.

## Remaining UX Risk

Text entry and portrait import still require browser form controls by design.
They are allowed only inside staged registration and should remain secondary to
the command-window flow.
