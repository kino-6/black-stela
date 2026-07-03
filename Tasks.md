# Black Stela Tasks

## Archive

- [x] BS-001..BS-040:
  [docs/archive/Tasks.completed-modernization.md](docs/archive/Tasks.completed-modernization.md)
- [x] BS-041..BS-061:
  [docs/archive/Tasks.completed-scenario-tempo.md](docs/archive/Tasks.completed-scenario-tempo.md)
- [x] BS-062, BS-063, BS-068..BS-070, BS-072, BS-073:
  [docs/archive/Tasks.completed-play-parity-gate.md](docs/archive/Tasks.completed-play-parity-gate.md)
- [x] BS-074..BS-084:
  [docs/archive/Tasks.completed-tactical-combat.md](docs/archive/Tasks.completed-tactical-combat.md)
- [x] BS-067:
  [docs/archive/Tasks.completed-character-creation-planning.md](docs/archive/Tasks.completed-character-creation-planning.md)
- [x] BS-097:
  [docs/archive/Tasks.completed-reachability-terminology.md](docs/archive/Tasks.completed-reachability-terminology.md)
- [x] BS-064..BS-066, BS-071, BS-085..BS-096:
  [docs/archive/Tasks.completed-guild-registration.md](docs/archive/Tasks.completed-guild-registration.md)
- [x] BS-098..BS-103:
  [docs/archive/Tasks.completed-drpg-cockpit-ui.md](docs/archive/Tasks.completed-drpg-cockpit-ui.md)
- [x] BS-104..BS-113:
  [docs/archive/Tasks.completed-playable-depth.md](docs/archive/Tasks.completed-playable-depth.md)
- [x] BS-123:
  [docs/archive/Tasks.completed-stair-progression-gate.md](docs/archive/Tasks.completed-stair-progression-gate.md)
- [x] BS-114..BS-122, BS-124..BS-127:
  [docs/archive/Tasks.completed-character-authoring-scenario-authoring.md](docs/archive/Tasks.completed-character-authoring-scenario-authoring.md)
- [x] BS-136..BS-140:
  [docs/archive/Tasks.completed-drpg-ux-formation.md](docs/archive/Tasks.completed-drpg-ux-formation.md)
- [x] BS-128..BS-135, BS-141..BS-144:
  [docs/archive/Tasks.completed-grid-prose-command.md](docs/archive/Tasks.completed-grid-prose-command.md)

## Active Milestones

No active milestones. Add the next slice only after mapping it from `Plan.md`
with human expectation, red flags, browser evidence, and automated regression.

Checkpoint commands: `npm test`, `npm run build`, `npm run test:e2e`,
`npm run headless:reachability`, `git diff --check`.

## Gate Definition

Every player-facing task must state the human expectation, red flags, browser
evidence, automated regression test, and what headless does or does not prove.

## Plan To Task Traceability

| Plan Lane | Task Coverage | Status |
|---|---|---|
| Lane D2: Character Authorship Recovery | BS-114..BS-120 archived | Completed current recovery pass |
| Lane F: Scenario Authoring and Content QA | BS-121..BS-127 archived | Completed current authoring QA pass |
| Lane A: DRPG Presentation and UX | BS-064..BS-066, BS-098..BS-103 archived | Completed current presentation gate |
| Lane B: Honest Simulation and Play Parity | BS-070, BS-071, BS-097 archived | Completed current play-parity gate |
| Lane C: Human Requirement Gate | BS-071, BS-096 plus gate docs archived | Completed current gate coverage |
| Lane D: Character Creation and Roster Identity | BS-085..BS-096 archived | Superseded by D2 recovery pass |
| Lane E: Playable Depth | BS-104..BS-113 archived | Completed current playable-depth slice |
| Lane E2: Tactical DRPG Combat | BS-074..BS-084 archived | Completed vertical slice |
| Lane J: Grid Labyrinth Topology Recovery | BS-128..BS-135 archived | Completed current grid pass |
| Lane F2: Scenario Prose and Localization Quality | BS-141..BS-142 archived | Completed current prose gate pass |
| Lane I: Controller-First Command UI Reconstruction | BS-143..BS-144 archived | Completed current command gate pass |
| Lane K: DRPG UX Autonomy and Six-Person Formation | BS-136..BS-140 archived | Completed current pass |
| Lane G: Desktop Productization | BS-034..BS-037 archived; no active new tasks | Deferred |
| Lane H: Hidden Local Narration Operations | BS-019..BS-024 archived; no active new tasks | Deferred |

## Execution Rules

- Keep completed tasks archived, not mixed into active backlog.
- Do D2 before broad F implementation unless the task is a blocking QA gate.
- Do not mark headless reachability as proof of player UX.
- Do not accept arbitrary room graphs as DRPG dungeon topology.
- Use Grid Labyrinth Skill/Gate for movement, minimap, stairs, return, and
  first-person dungeon rendering work.
- Use DRPG UX Skill/Gate for party formation, command surfaces, and normal-play
  UI review before claiming player-facing work is done.
- Use Black Stela Gate Review Skill and Past Trouble Regression Gate before
  player-facing implementation or completion claims.
- A player-facing change is not done until its human expectation and red flags
  are explicit.
- Prefer unit tests for domain rules and Playwright for visible player flows.
- Keep Japanese checks when UI or prose changes.
- Keep automation conservative around unknown, unsafe, or high-impact actions.
