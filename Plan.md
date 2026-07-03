# Black Stela Plan

Black Stela's modernization MVP is complete. The detailed implementation plan
that drove BS-001 through BS-040 has been archived at
[docs/archive/Plan.completed-modernization.md](docs/archive/Plan.completed-modernization.md).

## Current Baseline

The project now has:

- Event-driven deterministic game rules and localized replay log projection.
- Versioned save data, browser localStorage saves, and a Tauri-oriented file
  save adapter boundary.
- Debug starts, headless clear, graph-based exploration, map UI, and failure
  diagnostics.
- English/Japanese UI and scenario prose.
- Local AI provider abstraction for none, Ollama, and LocalAI/OpenAI-compatible
  endpoints, with AI output kept as non-canonical proposals.
- Scenario pack manifest, loader, validation fixtures, and validation UI.
- Town modes, recovery, injury state, defend, and a healing item skeleton.
- Desktop packaging readiness docs, tracked Tauri icon, CI workflow, ADR, and
  release checklist.

## Product Guardrails

- Player character speech, inner life, and action decisions remain controlled by
  the player.
- AI is optional, local-first, and cannot mutate `GameState`.
- Scenario truth remains ID-driven Markdown/YAML and is validated before play.
- All rule changes should remain testable through unit tests and headless runs.
- Japanese support is a first-class path, not a later translation pass.

## Next Planning Lanes

Create new tasks only when a lane is selected for the next milestone.

### Lane A: Real Scenario Authoring

- Scenario pack picker/import flow.
- Author-facing validation report with file/field navigation.
- Multi-floor scenario fixtures.
- Scenario compatibility checks for existing saves.

### Lane B: Playable Depth

- Town services beyond recovery.
- Inventory and equipment beyond one healing item.
- More combat choices and encounter definitions.
- Injury severity, recovery costs, and failure states.

### Lane C: Desktop Productization

- Wire the Tauri file adapter to real Tauri filesystem APIs.
- Persist portrait assets as app data files.
- Run platform build smoke tests, especially Windows.
- Define migration policy for future `SaveDataV2`.

### Lane D: AI Proposal Workflow

- Explicit proposal history separate from canonical logs.
- Provider health checks.
- Prompt/version metadata.
- Optional approval flows for safe non-canonical flavor only.

## Planning Rule

Before adding more work to `Tasks.md`, write a small milestone goal with:

- User-facing outcome.
- Scope boundary.
- Verification commands.
- Save/schema impact.
- Japanese/UI impact.
