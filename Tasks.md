# Black Stela Tasks

All modernization tasks from BS-001 through BS-040 are complete and archived at
[docs/archive/Tasks.completed-modernization.md](docs/archive/Tasks.completed-modernization.md).

## Active Backlog

No active implementation tasks are currently open.

## Completed Modernization Summary

- BS-001..BS-007: Core state hardening, GameEvent projection, save schema, and
  browser save/load.
- BS-008..BS-012: Map model, map events, graph headless explorer, failure
  fixtures, and map UI.
- BS-013..BS-018: English/Japanese i18n, localized scenario text, and Japanese
  responsive coverage.
- BS-019..BS-024: Narrator provider contract, LocalAI/Ollama adapters, AI
  settings UI, and proposal panel.
- BS-025..BS-028: Scenario pack manifest, loader, invalid fixtures, and
  validation UI.
- BS-029..BS-033: Town modes, recovery, injury, defend, and healing item flow.
- BS-034..BS-037: Tauri save adapter boundary, portrait asset references,
  tracked icon, and Windows build docs.
- BS-038..BS-040: CI workflow, ADR, and release readiness checklist.

## New Task Intake Template

Use this template when the next milestone is chosen.

```md
### BS-041: Task Title

Status: [ ]
Priority: P0 | P1 | P2 | P3
Parent plan lane: Lane A | Lane B | Lane C | Lane D

Description:

Acceptance criteria:

- [ ]

Verification:

- [ ]

Dependencies:

- None

Likely files:

- `path/to/file`

Estimated scope:

- S | M | L
```

## Execution Rules

- Keep every task independently verifiable.
- Do not mix refactors with feature behavior unless the task explicitly says so.
- Prefer unit tests for game rules and save/schema logic.
- Prefer Playwright for browser-visible flows.
- Keep `npm run headless:clear` passing after every phase checkpoint.
- Keep AI disabled mode fully playable.
- Keep Japanese support in automated checks when UI or prose changes.
