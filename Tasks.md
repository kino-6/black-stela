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

## Active Milestone

Goal: make the current build feel like a playable DRPG through browser-visible
controls and a human-requirement Gate, not only through domain/headless success.

Scope: presentation, command honesty, browser clear verification, Gate
artifacts, and minimum documentation. Character creation, economy, and Tauri
work remain later unless explicitly selected.

Checkpoint commands:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] `npm run headless:clear`
- [x] `npm run headless:combat`
- [x] `git diff --check`

## Gate Definition

Every player-facing task must answer:

- [ ] What human expectation or complaint does this satisfy?
- [ ] What would feel wrong, cheap, web-app-like, or non-DRPG?
- [ ] What visible browser evidence proves it works?
- [ ] What automated test prevents regression?
- [ ] Does headless prove only reachability, or real player UX?

## Active Backlog

| ID | Priority | Lane | Task | Acceptance | Verification |
|---|---|---|---|---|---|
| BS-064 | P0 | Presentation | Improve dungeon visual legibility | Door, enemy, stair, trap, wall, and side-opening silhouettes are distinct; desktop/mobile screenshots are readable; no AI/developer copy leaks | `npm run test:e2e -- tests/e2e/rendering.spec.ts` |
| BS-065 | P1 | Presentation | Tighten minimap and map honesty | Unknown rooms stay hidden until revealed by discovered exits; current/mapped/blocked/unseen states are distinct; Japanese labels fit mobile | `npm run test:e2e -- tests/e2e/map.spec.ts tests/e2e/i18n.spec.ts` |
| BS-066 | P1 | Presentation | Remove remaining web-app residue | Normal title has only title/menu/config/status; save/load/debug are debug-only or diegetic; tests fail on player-facing AI/provider text | `npm run test:e2e -- tests/e2e/ai-settings.spec.ts tests/e2e/town.spec.ts` |
| BS-067 | P2 | Character creation | Break down guild registration milestone | Tasks cover data model, quick/detailed recruit, roles, templates, coverage, save compatibility, Japanese layout; quick recruit can ship first | Documentation review |
| BS-071 | P1 | Requirement Gate | Add screenshot review protocol | Desktop/mobile screenshots are generated for title, dungeon, combat, map, town; checklist records pass/fail notes | Playwright screenshot review |

## Gate Artifacts To Create

- [x] `docs/gates/human-requirement-gate.md`
- [x] `docs/gates/player-facing-red-flags.md`
- [x] `tests/e2e/player-clear.spec.ts`
- [x] Screenshot output convention for title/dungeon/combat/map/town checks.

## Execution Rules

- Keep completed tasks archived, not mixed into active backlog.
- Do not mark a headless clear as proof of player UX.
- A player-facing change is not done until its human expectation and red flags
  are explicit.
- Prefer unit tests for domain rules and Playwright for visible player flows.
- Keep Japanese checks when UI or prose changes.
- Keep automation conservative around unknown, unsafe, or high-impact actions.
