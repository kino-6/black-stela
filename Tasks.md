# Black Stela Tasks

## Archive

- BS-001..BS-040:
  [docs/archive/Tasks.completed-modernization.md](docs/archive/Tasks.completed-modernization.md)
- BS-041..BS-061:
  [docs/archive/Tasks.completed-scenario-tempo.md](docs/archive/Tasks.completed-scenario-tempo.md)
- BS-062, BS-063, BS-068..BS-070, BS-072, BS-073:
  [docs/archive/Tasks.completed-play-parity-gate.md](docs/archive/Tasks.completed-play-parity-gate.md)
- BS-074..BS-084:
  [docs/archive/Tasks.completed-tactical-combat.md](docs/archive/Tasks.completed-tactical-combat.md)
- BS-067:
  [docs/archive/Tasks.completed-character-creation-planning.md](docs/archive/Tasks.completed-character-creation-planning.md)
- BS-097:
  [docs/archive/Tasks.completed-reachability-terminology.md](docs/archive/Tasks.completed-reachability-terminology.md)
- BS-064..BS-066, BS-071, BS-085..BS-096:
  [docs/archive/Tasks.completed-guild-registration.md](docs/archive/Tasks.completed-guild-registration.md)
- BS-098..BS-103:
  [docs/archive/Tasks.completed-drpg-cockpit-ui.md](docs/archive/Tasks.completed-drpg-cockpit-ui.md)

## Active Milestone

Lane E: Playable Depth. Goal: make character choices matter after guild
registration through inventory, equipment, treasure, shops, recovery costs, and
early dungeon pressure.

Scope boundary:

- In scope: item/equipment data, currency, loot, recovery cost, town shop UI,
  save migration, combat/dungeon integration, Japanese UI, browser/headless
  verification.
- Out of scope: full late-game economy, crafting, scenario import UI, Tauri file
  saves, paid/online services, and new non-original reference content.

Checkpoint commands:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] `npm run headless:reachability`
- [x] `git diff --check`

## Gate Definition

Every player-facing task must answer:

- [ ] What human expectation or complaint does this satisfy?
- [ ] What would feel wrong, cheap, web-app-like, or non-DRPG?
- [ ] What visible browser evidence proves it works?
- [ ] What automated test prevents regression?
- [ ] Does headless prove only reachability, or real player UX?

## Active Backlog

| ID | Priority | Task | Acceptance | Verification |
|---|---|---|---|---|
| BS-104 | P0 | Item/equipment/currency domain | Item catalog, equipment slots, party gold, quantities, and `SaveDataV2` migration exist without breaking old saves | Unit tests for catalog, migration, and inventory invariants |
| BS-105 | P0 | Equipment affects combat | Weapon/armor stats modify damage, accuracy, armor, and row pressure without bypassing tactical combat | Rules tests plus combat E2E still pass |
| BS-106 | P0 | Treasure and loot rewards | Encounters and authored rooms can grant gold/items through data-driven reward tables; rewards are logged once | Unit tests for deterministic rewards; browser clear sees reward feedback |
| BS-107 | P1 | Town shop service | Player can buy/sell basic gear and consumables from town without a generic admin-table feel | Shop E2E desktop/mobile; Japanese labels fit |
| BS-108 | P1 | Recovery costs and attrition | Recovery consumes gold, blocks when unaffordable, and preserves early dungeon pressure | Rules tests and town E2E |
| BS-109 | P1 | Inventory/equipment UI | Guild/town expose equipment decisions; dungeon/combat show only compact carried-item state | Screenshot review and no sidebar regression |
| BS-110 | P1 | Scenario data pass | Starter equipment, early loot, shop stock, and recovery prices are authored for the MVP route | Scenario validation and data summary tests |
| BS-111 | P1 | Economy balance probes | Headless/browser probes report gold, consumables, HP pressure, loot, and return outcome separately from UX claims | `npm run headless:reachability`; browser clear E2E |
| BS-112 | P2 | Docs and Japanese coverage | README documents economy/debug behavior; Japanese UI and save migration are covered | `npm run test:e2e -- tests/e2e/i18n.spec.ts`; README review |
| BS-113 | P2 | Human Requirement Gate update | Gate rejects free recovery, free escape/save leakage, generic shop admin UI, and invisible rewards | Gate doc updated; screenshot-review covers shop/reward states |

## Plan To Task Traceability

| Plan Lane | Task Coverage | Status |
|---|---|---|
| Lane A: DRPG Presentation and UX | BS-064..BS-066, BS-098..BS-103 archived | Completed current presentation gate and cockpit pass |
| Lane B: Honest Simulation and Play Parity | BS-070, BS-071, BS-097 archived | Completed current play-parity gate |
| Lane C: Human Requirement Gate | BS-071, BS-096 plus gate docs archived | Completed current gate coverage |
| Lane D: Character Creation and Roster Identity | BS-085..BS-096 archived | Completed guild registration milestone |
| Lane E: Playable Depth | BS-104..BS-113 active | Active milestone |
| Lane E2: Tactical DRPG Combat | BS-074..BS-084 archived | Completed vertical slice; future balance can add new IDs |
| Lane F: Scenario Authoring and Content QA | BS-041..BS-061 archived; no active new tasks | Deferred |
| Lane G: Desktop Productization | BS-034..BS-037 archived; no active new tasks | Deferred |
| Lane H: Hidden Local Narration Operations | BS-019..BS-024 archived; no active new tasks | Deferred |

## Gate Artifacts To Create

- [x] `docs/gates/human-requirement-gate.md`
- [x] `docs/gates/player-facing-red-flags.md`
- [x] `tests/e2e/player-clear.spec.ts`
- [x] Screenshot output convention for title/dungeon/combat/map/town checks.

## Execution Rules

- Keep completed tasks archived, not mixed into active backlog.
- Do not mark headless reachability as proof of player UX.
- A player-facing change is not done until its human expectation and red flags
  are explicit.
- Prefer unit tests for domain rules and Playwright for visible player flows.
- Keep Japanese checks when UI or prose changes.
- Keep automation conservative around unknown, unsafe, or high-impact actions.
