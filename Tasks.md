# Black Stela Tasks

This task list breaks down [Plan.md](./Plan.md) into implementation-sized work items.

Task status legend:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked

Priority legend:

- `P0`: Foundation required before most other work
- `P1`: Important next product capability
- `P2`: Product depth/polish
- `P3`: Packaging or later hardening

## Execution Rules

- Keep every task independently verifiable.
- Do not mix refactors with feature behavior unless the task explicitly says so.
- Prefer unit tests for game rules and save/schema logic.
- Prefer Playwright for browser-visible flows.
- Keep Headless clear passing after every phase checkpoint.
- Keep AI disabled mode fully playable.
- Keep Japanese support in automated checks once i18n begins.

## Phase 1: Core State Hardening

Parent: [Plan.md - Phase 1](./Plan.md#phase-1-core-state-hardening)

### BS-001: Define GameEvent Types

Status: [x]
Priority: P0  
Parent plan task: Task 1, GameEvent導入

Description:
Add a typed `GameEvent` union representing canonical outcomes such as party joined, entered dungeon, moved, trap triggered, enemy defeated, returned to town, and debug start.

Acceptance criteria:

- [x] `GameEvent` union exists in the domain layer.
- [x] Events carry machine-readable payloads, not only prose.
- [x] Existing MVP outcomes can be represented by events.

Verification:

- [x] `npm test`

Dependencies:

- None

Likely files:

- `src/domain/types.ts`
- `tests/rulesEngine.test.ts`

Estimated scope:

- S

### BS-002: Add Event-to-Log Projection

Status: [x]
Priority: P0  
Parent plan task: Task 1, GameEvent導入

Description:
Create a projector that converts `GameEvent[]` into canonical `AdventureLogEntry[]`, keeping display prose outside raw state transition code.

Acceptance criteria:

- [x] Log text is generated from events.
- [x] Existing log expectations still pass.
- [x] The projector can later localize event prose.

Verification:

- [x] `npm test`

Dependencies:

- BS-001

Likely files:

- `src/domain/replayLog.ts`
- `src/domain/gameState.ts`
- `tests/rulesEngine.test.ts`

Estimated scope:

- S

### BS-003: Refactor RulesEngine to Return Events

Status: [x]
Priority: P0  
Parent plan task: Task 1, GameEvent導入

Description:
Change command resolution so `RulesEngine` produces events and applies them through a reducer/projection step instead of directly appending log prose throughout command handlers.

Acceptance criteria:

- [x] `executeCommand` still returns the next `GameState`.
- [x] Internal command handling emits typed events.
- [x] Headless clear output remains behaviorally equivalent.

Verification:

- [x] `npm test`
- [x] `npm run headless:clear`
- [x] `npm run build`

Dependencies:

- BS-001
- BS-002

Likely files:

- `src/domain/rulesEngine.ts`
- `src/domain/gameState.ts`
- `src/headless/headlessRunner.ts`
- `tests/headlessRunner.test.ts`

Estimated scope:

- M

### BS-004: Define Versioned SaveDataV1 Schema

Status: [x]
Priority: P0  
Parent plan task: Task 2, Save Data Schema

Description:
Add a Zod schema for versioned save data that captures current game state, party, map, log, scenario reference, settings stub, and metadata.

Acceptance criteria:

- [x] `SaveDataV1` Zod schema exists.
- [x] Save data includes a schema version.
- [x] Invalid save payloads fail validation with useful errors.

Verification:

- [x] `npm test`

Dependencies:

- BS-003 recommended

Likely files:

- `src/domain/saveData.ts`
- `tests/saveData.test.ts`

Estimated scope:

- S

### BS-005: Implement GameState Save Round Trip

Status: [x]
Priority: P0  
Parent plan task: Task 2, Save Data Schema

Description:
Implement conversion functions from `GameState` to `SaveDataV1` and back, preserving the current MVP state exactly enough for resume.

Acceptance criteria:

- [x] `GameState -> SaveDataV1 -> GameState` round trip passes.
- [x] Missing optional future fields use safe defaults.
- [x] Unknown future versions are rejected clearly.

Verification:

- [x] `npm test`
- [x] Round-trip unit tests

Dependencies:

- BS-004

Likely files:

- `src/domain/saveData.ts`
- `tests/saveData.test.ts`

Estimated scope:

- S

### BS-006: Create SaveRepository Interface and LocalStorage Implementation

Status: [x]
Priority: P0  
Parent plan task: Task 3, Save/Load Repository

Description:
Create a repository interface for save slots and an initial browser `localStorage` implementation for development.

Acceptance criteria:

- [x] Saves can be written by slot ID.
- [x] Saves can be read by slot ID.
- [x] Save slots can be listed.
- [x] Corrupt save data is reported without crashing.

Verification:

- [x] `npm test`

Dependencies:

- BS-005

Likely files:

- `src/services/saveRepository.ts`
- `tests/saveRepository.test.ts`

Estimated scope:

- M

### BS-007: Add Minimal Save/Load UI Hooks

Status: [x]
Priority: P0  
Parent plan task: Task 3, Save/Load Repository

Description:
Add minimal UI controls for saving the current game and loading a save slot in browser development mode.

Acceptance criteria:

- [x] A player can save current state.
- [x] A player can load the saved state after refresh.
- [x] Save/load failures show a visible non-crashing message.

Verification:

- [x] `npm run test:e2e`
- [x] `npm run build`

Dependencies:

- BS-006

Likely files:

- `src/App.tsx`
- `src/styles.css`
- `tests/e2e/save-load.spec.ts`

Estimated scope:

- M

### Checkpoint 1: Core State

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run headless:clear`
- [x] `npm run test:e2e`

Exit criteria:

- [x] MVP flow still works.
- [x] Save/load round trip works.
- [x] Game logs are event-derived.

## Phase 2: Debug, Headless, and Map System

Parent: [Plan.md - Phase 2](./Plan.md#phase-2-debug-headless-and-map-system)

### BS-008: Define General Map Model

Status: [x]
Priority: P1  
Parent plan task: Task 4, Map Model Generalization

Description:
Replace the current simple map state with a model that can represent floor ID, room ID, known exits, blocked exits, secret candidates, and current facing.

Acceptance criteria:

- [x] Map model stores floor-scoped room progress.
- [x] Known, unknown, blocked, and secret-candidate exits can be represented.
- [x] Existing debug progress states still build valid map data.

Verification:

- [x] `npm test`

Dependencies:

- BS-003 recommended

Likely files:

- `src/domain/types.ts`
- `src/debug/debugStart.ts`
- `tests/debugStart.test.ts`

Estimated scope:

- M

### BS-009: Add Map Update Events

Status: [x]
Priority: P1  
Parent plan task: Task 4, Map Model Generalization

Description:
Move map updates into explicit events so room discovery and exit knowledge are testable independent outcomes.

Acceptance criteria:

- [x] Room visit creates a map event.
- [x] Exit knowledge is derived from scenario truth through rules.
- [x] Map progress remains deterministic in Headless clear.

Verification:

- [x] `npm test`
- [x] `npm run headless:clear`

Dependencies:

- BS-008

Likely files:

- `src/domain/rulesEngine.ts`
- `src/domain/replayLog.ts`
- `tests/headlessRunner.test.ts`

Estimated scope:

- M

### BS-010: Replace Fixed Headless Route With Graph Explorer

Status: [x]
Priority: P1  
Parent plan task: Task 5, Headless Explorer

Description:
Teach the headless runner to inspect scenario exits and map state instead of hardcoding room IDs and command sequences.

Acceptance criteria:

- [x] Runner can choose movement from known exits.
- [x] Runner handles combat by selecting deterministic combat commands.
- [x] Runner returns a clear stuck reason when no route exists.

Verification:

- [x] `npm test`
- [x] `npm run headless:clear`

Dependencies:

- BS-009

Likely files:

- `src/headless/headlessRunner.ts`
- `tests/headlessRunner.test.ts`

Estimated scope:

- M

### BS-011: Add Headless Failure Fixtures

Status: [x]
Priority: P1  
Parent plan task: Task 5, Headless Explorer

Description:
Add small test worlds that intentionally cannot clear, proving stuck and max-step diagnostics.

Acceptance criteria:

- [x] Missing exit scenario returns `stuck`.
- [x] Looping scenario returns `max_steps` or equivalent.
- [x] Failure reports include current room and reason.

Verification:

- [x] `npm test`

Dependencies:

- BS-010

Likely files:

- `tests/headlessRunner.test.ts`
- `src/headless/headlessRunner.ts`

Estimated scope:

- S

### BS-012: Build Minimal Map UI

Status: [x]
Priority: P1  
Parent plan task: Task 6, Map UI

Description:
Add a compact map panel showing current room, visited rooms, known exits, and unexplored directions.

Acceptance criteria:

- [x] Current room is visually identified.
- [x] Visited rooms are listed or drawn.
- [x] Known exits are visible.
- [x] The panel fits desktop and mobile layouts.

Verification:

- [x] `npm run test:e2e`
- [x] Playwright mobile viewport check

Dependencies:

- BS-008

Likely files:

- `src/App.tsx`
- `src/components/MapPanel.tsx`
- `src/styles.css`
- `tests/e2e/map.spec.ts`

Estimated scope:

- M

### Checkpoint 2: Exploration

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run headless:clear`
- [x] `npm run test:e2e`

Exit criteria:

- [x] Headless explorer clears without fixed room-script logic.
- [x] Map UI represents current progress.
- [x] Debug progress starts still work.

## Phase 3: Japanese Localization

Parent: [Plan.md - Phase 3](./Plan.md#phase-3-japanese-localization)

### BS-013: Add i18n Dictionary Infrastructure

Status: [x]
Priority: P1  
Parent plan task: Task 7, i18n Foundation

Description:
Create a small typed dictionary system for UI strings with `en` and `ja` dictionaries.

Acceptance criteria:

- [x] UI strings can be read through a typed translation function.
- [x] Missing translation keys fail in tests or type checks.
- [x] Default locale is stable.

Verification:

- [x] `npm test`
- [x] `npm run build`

Dependencies:

- None, but easier after BS-007

Likely files:

- `src/i18n/index.ts`
- `src/i18n/en.ts`
- `src/i18n/ja.ts`
- `tests/i18n.test.ts`

Estimated scope:

- M

### BS-014: Add Language Selection and Persistence

Status: [x]
Priority: P1  
Parent plan task: Task 7, i18n Foundation

Description:
Add a language selector and store the chosen locale in settings/save infrastructure.

Acceptance criteria:

- [x] Player can switch between English and Japanese.
- [x] Selected language persists across reload.
- [x] Headless logic remains language-independent.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`

Dependencies:

- BS-013
- BS-006 recommended

Likely files:

- `src/App.tsx`
- `src/services/settingsRepository.ts`
- `tests/e2e/i18n.spec.ts`

Estimated scope:

- M

### BS-015: Move Current UI Text Into Dictionaries

Status: [x]
Priority: P1  
Parent plan task: Task 7, i18n Foundation

Description:
Replace hardcoded UI strings in React components with dictionary lookups.

Acceptance criteria:

- [x] Town, party, dungeon, combat, debug, and log UI text uses i18n.
- [x] English UI remains equivalent.
- [x] Japanese UI is readable and natural enough for MVP2.

Verification:

- [x] `npm run build`
- [x] `npm run test:e2e`

Dependencies:

- BS-013
- BS-014

Likely files:

- `src/App.tsx`
- `src/components/*.tsx`
- `src/i18n/*.ts`

Estimated scope:

- M

### BS-016: Add Localized Scenario Text Model

Status: [x]
Priority: P1  
Parent plan task: Task 8, Japanese Scenario Text

Description:
Add support for localized scenario display strings while keeping YAML truth language-independent.

Acceptance criteria:

- [x] Room name and description can resolve by locale.
- [x] Scenario truth remains stable IDs, exits, enemies, traps, and rules.
- [x] Existing default scenario still validates.

Verification:

- [x] `npm test`

Dependencies:

- BS-013

Likely files:

- `src/domain/scenario.ts`
- `content/worlds/default/dungeons/b1f.md`
- `tests/scenario.test.ts`

Estimated scope:

- M

### BS-017: Add Japanese Default Scenario Copy

Status: [x]
Priority: P1  
Parent plan task: Task 8, Japanese Scenario Text

Description:
Write Japanese text for the default town, B1F rooms, events, and relevant log projections.

Acceptance criteria:

- [x] Japanese room names and descriptions exist.
- [x] Japanese event/log prose displays in Japanese mode.
- [x] Direct translation title is avoided.

Verification:

- [x] `npm test`
- [x] E2E Japanese mode clear flow

Dependencies:

- BS-016

Likely files:

- `content/worlds/default/*.md`
- `content/worlds/default/dungeons/b1f.md`
- `src/i18n/ja.ts`
- `tests/e2e/i18n.spec.ts`

Estimated scope:

- S

### BS-018: Verify Japanese Responsive Layout

Status: [x]
Priority: P1  
Parent plan task: Task 9, Japanese Typography and Layout

Description:
Add E2E coverage for Japanese UI on mobile and desktop, then adjust typography/layout as needed.

Acceptance criteria:

- [x] Japanese UI has no obvious overlapping controls at 390px.
- [x] Long Japanese log text wraps cleanly.
- [x] Buttons remain usable.

Verification:

- [x] `npm run test:e2e`
- [x] Playwright mobile viewport check for Japanese mode

Dependencies:

- BS-015
- BS-017

Likely files:

- `src/styles.css`
- `tests/e2e/i18n.spec.ts`

Estimated scope:

- S

### Checkpoint 3: Japanese Support

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] Japanese MVP clear flow passes

Exit criteria:

- [x] English and Japanese UI work.
- [x] Scenario prose localizes without changing scenario truth.
- [x] Headless clear remains language-independent.

## Phase 4: Local AI Integration

Parent: [Plan.md - Phase 4](./Plan.md#phase-4-local-ai-integration)

### BS-019: Define Narrator Provider Contract

Status: [x]
Priority: P1  
Parent plan task: Task 10, Narrator Provider Interface

Description:
Split narration into a provider interface with request input, proposal output, error output, and provider metadata.

Acceptance criteria:

- [x] `NarratorProvider` interface exists.
- [x] Provider result distinguishes success, unavailable, and rejected output.
- [x] AI disabled mode uses `none` provider.

Verification:

- [x] `npm test`

Dependencies:

- BS-006 recommended

Likely files:

- `src/services/narratorProvider.ts`
- `src/services/narratorService.ts`
- `tests/aiPolicyGuard.test.ts`

Estimated scope:

- S

### BS-020: Add Provider Settings Schema

Status: [x]
Priority: P1  
Parent plan task: Task 10, Narrator Provider Interface

Description:
Add persisted settings for AI provider kind, endpoint URL, model name, timeout, and enabled flag.

Acceptance criteria:

- [x] Settings validate with Zod or equivalent.
- [x] Defaults keep AI off.
- [x] Invalid provider settings fall back safely.

Verification:

- [x] `npm test`

Dependencies:

- BS-019
- BS-006 recommended

Likely files:

- `src/services/aiSettings.ts`
- `tests/aiSettings.test.ts`

Estimated scope:

- S

### BS-021: Implement Ollama Provider Adapter

Status: [x]
Priority: P1  
Parent plan task: Task 10, Narrator Provider Interface

Description:
Move the current Ollama-compatible request into a provider adapter.

Acceptance criteria:

- [x] Ollama adapter uses constrained public situation input.
- [x] Network failure returns a non-crashing unavailable result.
- [x] AI guard still runs after provider response.

Verification:

- [x] `npm test`
- [x] Mocked fetch tests

Dependencies:

- BS-019
- BS-020

Likely files:

- `src/services/providers/ollamaProvider.ts`
- `src/services/narratorService.ts`
- `tests/narratorProvider.test.ts`

Estimated scope:

- M

### BS-022: Implement LocalAI/OpenAI-Compatible Provider Adapter

Status: [x]
Priority: P1  
Parent plan task: Task 11, LocalAI Provider

Description:
Add an adapter for LocalAI or any local OpenAI-compatible `/v1/chat/completions` server.

Acceptance criteria:

- [x] Endpoint and model are configurable.
- [x] API key is optional.
- [x] Responses become proposals only.
- [x] GameState is not mutated.

Verification:

- [x] `npm test`
- [x] Mocked provider tests

Dependencies:

- BS-019
- BS-020

Likely files:

- `src/services/providers/openAiCompatibleProvider.ts`
- `tests/narratorProvider.test.ts`

Estimated scope:

- M

### BS-023: Add AI Settings UI

Status: [x]
Priority: P1  
Parent plan task: Task 10, Narrator Provider Interface

Description:
Add a compact settings UI for AI off/on, provider type, endpoint, and model.

Acceptance criteria:

- [x] Default UI shows AI off.
- [x] Provider settings can be changed without restarting.
- [x] Invalid endpoint errors are visible and non-fatal.

Verification:

- [x] `npm run test:e2e`

Dependencies:

- BS-020
- BS-021
- BS-022

Likely files:

- `src/App.tsx`
- `src/components/AiSettingsPanel.tsx`
- `src/styles.css`
- `tests/e2e/ai-settings.spec.ts`

Estimated scope:

- M

### BS-024: Build AI Proposal Panel

Status: [x]
Priority: P1  
Parent plan task: Task 12, AI Proposal UI

Description:
Show AI output as proposals separate from canonical adventure log entries, including guard status and rejection reasons.

Acceptance criteria:

- [x] Proposal text is visually separate from canonical log.
- [x] Rejected proposals show a reason.
- [x] PC speech/action proposals cannot be accepted.
- [x] AI-off mode remains unobtrusive.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`

Dependencies:

- BS-019
- BS-023

Likely files:

- `src/components/AiProposalPanel.tsx`
- `src/services/aiPolicyGuard.ts`
- `tests/e2e/ai-proposal.spec.ts`

Estimated scope:

- M

### Checkpoint 4: Local AI

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] AI-off flow passes.
- [x] Mock LocalAI-compatible flow passes.

Exit criteria:

- [x] AI provider is configurable.
- [x] AI output never mutates GameState.
- [x] LocalAI-compatible adapter is tested without requiring a live server.

## Phase 5: Scenario Repository

Parent: [Plan.md - Phase 5](./Plan.md#phase-5-scenario-repository)

### BS-025: Define Scenario Pack Manifest

Status: [x]
Priority: P1  
Parent plan task: Task 13, Scenario Pack Loader

Description:
Define a manifest schema for scenario pack metadata, version, supported languages, entry world, and compatibility.

Acceptance criteria:

- [x] Manifest schema exists.
- [x] Default scenario has a manifest.
- [x] Missing/invalid manifest fails validation clearly.

Verification:

- [x] `npm test`

Dependencies:

- BS-004 recommended

Likely files:

- `content/worlds/default/manifest.md`
- `src/domain/scenarioPack.ts`
- `tests/scenarioPack.test.ts`

Estimated scope:

- S

### BS-026: Implement Scenario Pack Loader

Status: [x]
Priority: P1  
Parent plan task: Task 13, Scenario Pack Loader

Description:
Create a loader that reads a scenario pack structure and returns validated world/dungeon/town/rules data.

Acceptance criteria:

- [x] Valid pack loads successfully.
- [x] Missing required files are reported.
- [x] YAML parse errors include file context.

Verification:

- [x] `npm test`

Dependencies:

- BS-025

Likely files:

- `src/services/scenarioPackLoader.ts`
- `tests/scenarioPackLoader.test.ts`

Estimated scope:

- M

### BS-027: Add Invalid Scenario Fixtures

Status: [x]
Priority: P1  
Parent plan task: Task 13, Scenario Pack Loader

Description:
Add test fixtures for broken scenario packs to prevent silent failures.

Acceptance criteria:

- [x] Missing dungeon fixture exists.
- [x] Invalid exit reference fixture exists.
- [x] Invalid AI policy fixture exists.

Verification:

- [x] `npm test`

Dependencies:

- BS-026

Likely files:

- `tests/fixtures/scenarios/*`
- `tests/scenarioPackLoader.test.ts`

Estimated scope:

- S

### BS-028: Build Scenario Validation UI

Status: [x]
Priority: P1  
Parent plan task: Task 14, Scenario Validation UI

Description:
Display scenario validation errors with file path, field path, and actionable reason.

Acceptance criteria:

- [x] Validation errors are visible in UI.
- [x] Invalid scenario cannot start.
- [x] Error UI supports Japanese labels once i18n is enabled.

Verification:

- [x] `npm run test:e2e`

Dependencies:

- BS-026
- BS-013 recommended

Likely files:

- `src/components/ScenarioValidationPanel.tsx`
- `src/App.tsx`
- `tests/e2e/scenario-validation.spec.ts`

Estimated scope:

- M

### Checkpoint 5: Scenario Authoring

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`

Exit criteria:

- [x] Default scenario loads through pack loader.
- [x] Invalid packs produce actionable errors.
- [x] Existing MVP and Headless flows still pass.

## Phase 6: Game Loop Depth

Parent: [Plan.md - Phase 6](./Plan.md#phase-6-game-loop-depth)

### BS-029: Split Town Into Menu Modes

Status: [ ]  
Priority: P2  
Parent plan task: Task 15, Town Menu

Description:
Replace the single town panel with navigable town modes: Guild, Recovery, Records, and Dungeon Entry.

Acceptance criteria:

- [ ] Town mode navigation is visible and keyboard accessible.
- [ ] Existing party creation is available under Guild.
- [ ] Dungeon entry remains one click from the appropriate mode.

Verification:

- [ ] `npm run test:e2e`

Dependencies:

- BS-007 recommended
- BS-013 recommended

Likely files:

- `src/App.tsx`
- `src/components/town/*`
- `src/styles.css`
- `tests/e2e/town.spec.ts`

Estimated scope:

- M

### BS-030: Add Recovery Town Service

Status: [ ]  
Priority: P2  
Parent plan task: Task 15, Town Menu

Description:
Add a recovery service screen that restores HP and later handles injuries/costs.

Acceptance criteria:

- [ ] Recovery shows party health.
- [ ] Recovery restores HP deterministically.
- [ ] Recovery creates canonical events/log entries.

Verification:

- [ ] `npm test`
- [ ] `npm run test:e2e`

Dependencies:

- BS-029
- BS-003

Likely files:

- `src/domain/rulesEngine.ts`
- `src/components/town/RecoveryView.tsx`
- `tests/rulesEngine.test.ts`
- `tests/e2e/town.spec.ts`

Estimated scope:

- M

### BS-031: Add Injury State

Status: [ ]  
Priority: P2  
Parent plan task: Task 16, Injury and Recovery

Description:
Introduce non-deletion consequences for severe damage: injury state, recovery status, and log events.

Acceptance criteria:

- [ ] Characters are not deleted at 0 HP.
- [ ] Injury state is persisted in save data.
- [ ] Recovery service can clear basic injury state.

Verification:

- [ ] `npm test`
- [ ] Headless injury flow test

Dependencies:

- BS-030
- BS-005

Likely files:

- `src/domain/types.ts`
- `src/domain/rulesEngine.ts`
- `src/domain/saveData.ts`
- `tests/injury.test.ts`

Estimated scope:

- M

### BS-032: Add Defensive Combat Command

Status: [ ]  
Priority: P2  
Parent plan task: Task 17, Combat Choices

Description:
Add a deterministic `defend` command that reduces incoming damage and tests combat choice plumbing.

Acceptance criteria:

- [ ] `defend` command exists.
- [ ] Damage reduction is deterministic.
- [ ] AI does not choose combat commands.

Verification:

- [ ] `npm test`
- [ ] Combat E2E smoke test

Dependencies:

- BS-003

Likely files:

- `src/domain/types.ts`
- `src/domain/rulesEngine.ts`
- `src/App.tsx`
- `tests/rulesEngine.test.ts`

Estimated scope:

- S

### BS-033: Add Consumable Item Skeleton

Status: [ ]  
Priority: P2  
Parent plan task: Task 17, Combat Choices

Description:
Add a minimal consumable item model and one healing item to prove inventory/action flow.

Acceptance criteria:

- [ ] Party inventory can hold a healing item.
- [ ] Item use changes state deterministically.
- [ ] Item use is saved and logged.

Verification:

- [ ] `npm test`
- [ ] `npm run headless:clear`

Dependencies:

- BS-005
- BS-032 recommended

Likely files:

- `src/domain/types.ts`
- `src/domain/rulesEngine.ts`
- `src/domain/saveData.ts`
- `tests/inventory.test.ts`

Estimated scope:

- M

### Checkpoint 6: Playable Loop Depth

Status: [ ]

Required verification:

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run headless:clear`
- [ ] `npm run test:e2e`

Exit criteria:

- [ ] Town loop has meaningful services.
- [ ] Injury/recovery exists without character deletion.
- [ ] Combat has at least one real player choice beyond attack/retreat.

## Phase 7: Desktop Packaging

Parent: [Plan.md - Phase 7](./Plan.md#phase-7-desktop-packaging)

### BS-034: Add Tauri File Save Adapter

Status: [ ]  
Priority: P3  
Parent plan task: Task 18, Tauri File Persistence

Description:
Implement a Tauri-backed save adapter using OS app data paths while keeping the repository interface stable.

Acceptance criteria:

- [ ] Browser localStorage adapter still works.
- [ ] Tauri file adapter can write/read save slots.
- [ ] Save path is not hardcoded to a user-specific directory.

Verification:

- [ ] `cargo check`
- [ ] `npm test`

Dependencies:

- BS-006

Likely files:

- `src/services/saveRepository.ts`
- `src-tauri/*`
- `tests/saveRepository.test.ts`

Estimated scope:

- M

### BS-035: Persist Portrait Assets

Status: [ ]  
Priority: P3  
Parent plan task: Task 18, Tauri File Persistence

Description:
Store imported portrait files as durable app data references instead of transient data URLs only.

Acceptance criteria:

- [ ] Imported portrait survives reload.
- [ ] Save data references a stable portrait ID/path.
- [ ] Missing portrait file shows a fallback without crashing.

Verification:

- [ ] `npm test`
- [ ] `npm run test:e2e`

Dependencies:

- BS-034
- BS-005

Likely files:

- `src/services/portraitManager.ts`
- `src/services/saveRepository.ts`
- `tests/portraitManager.test.ts`

Estimated scope:

- M

### BS-036: Replace Fallback Tauri Icon

Status: [ ]  
Priority: P3  
Parent plan task: Task 19, Windows Build Smoke

Description:
Replace the generated 1x1 fallback icon with proper app icons and remove temporary icon generation from the build script.

Acceptance criteria:

- [ ] Proper icons exist in `src-tauri/icons/`.
- [ ] `cargo check` no longer depends on generated fallback bytes.
- [ ] Bundle config references real icons.

Verification:

- [ ] `cargo check`
- [ ] Tauri dev launch

Dependencies:

- None

Likely files:

- `src-tauri/build.rs`
- `src-tauri/tauri.conf.json`
- `src-tauri/icons/*`

Estimated scope:

- S

### BS-037: Add Windows Build Documentation

Status: [ ]  
Priority: P3  
Parent plan task: Task 19, Windows Build Smoke

Description:
Document Windows build prerequisites, commands, expected artifacts, and known caveats.

Acceptance criteria:

- [ ] README or docs include Windows build steps.
- [ ] Required Rust/Node/Tauri prerequisites are listed.
- [ ] Build smoke verification checklist exists.

Verification:

- [ ] Documentation review

Dependencies:

- BS-036 recommended

Likely files:

- `README.md`
- `docs/windows-build.md`

Estimated scope:

- S

### Checkpoint 7: Desktop Packaging

Status: [ ]

Required verification:

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `cargo check`
- [ ] Tauri dev launch

Exit criteria:

- [ ] Save files use desktop-safe persistence.
- [ ] Portrait assets persist.
- [ ] Windows build path is documented.

## Cross-Cutting Tasks

### BS-038: Add CI Workflow

Status: [ ]  
Priority: P1  
Parent plan task: Supports all phases

Description:
Add a CI workflow that runs unit tests, build, headless clear, audit, and Playwright smoke tests.

Acceptance criteria:

- [ ] CI runs `npm ci`.
- [ ] CI runs `npm test`, `npm run build`, `npm run headless:clear`, and `npm run test:e2e`.
- [ ] CI uploads Playwright traces/reports on failure.

Verification:

- [ ] CI run passes

Dependencies:

- Current test suite

Likely files:

- `.github/workflows/ci.yml`

Estimated scope:

- S

### BS-039: Add ADR for GameEvent and Persistence Decisions

Status: [ ]  
Priority: P1  
Parent plan task: Supports Phase 1

Description:
Record the rationale for event-driven game state and local persistence choices.

Acceptance criteria:

- [ ] ADR explains why `GameEvent` exists.
- [ ] ADR explains save repository boundaries.
- [ ] ADR lists rejected alternatives.

Verification:

- [ ] Documentation review

Dependencies:

- BS-003
- BS-006

Likely files:

- `docs/decisions/ADR-001-game-events-and-persistence.md`

Estimated scope:

- S

### BS-040: Add Release Readiness Checklist

Status: [ ]  
Priority: P2  
Parent plan task: Supports Phase 7

Description:
Create a checklist for moving from MVP to distributable desktop builds.

Acceptance criteria:

- [ ] Checklist covers tests, build, audit, Tauri, save compatibility, AI-off flow, Japanese UI, and scenario validation.
- [ ] Checklist is referenced from README.

Verification:

- [ ] Documentation review

Dependencies:

- None

Likely files:

- `docs/release-checklist.md`
- `README.md`

Estimated scope:

- S

## Recommended First Sprint

Sprint goal:

Make state transitions durable and testable before adding more gameplay/UI.

Tasks:

1. [ ] BS-001: Define GameEvent Types
2. [ ] BS-002: Add Event-to-Log Projection
3. [ ] BS-003: Refactor RulesEngine to Return Events
4. [ ] BS-004: Define Versioned SaveDataV1 Schema
5. [ ] BS-005: Implement GameState Save Round Trip
6. [ ] Checkpoint 1 partial: `npm test`, `npm run build`, `npm run headless:clear`

Do not start Japanese UI or Local AI provider work before this sprint unless there is a strong product reason. Both depend on stable event/save boundaries.

## Parallelization Notes

Safe to parallelize after BS-005:

- BS-013 i18n dictionary infrastructure
- BS-019 narrator provider contract
- BS-025 scenario pack manifest
- BS-038 CI workflow

Must be sequential:

- BS-001 -> BS-002 -> BS-003
- BS-004 -> BS-005 -> BS-006 -> BS-007
- BS-013 -> BS-014 -> BS-015
- BS-019 -> BS-020 -> BS-021/BS-022 -> BS-023 -> BS-024

Needs coordination:

- Save schema changes and Tauri file persistence
- Scenario localization and scenario pack loader
- AI proposal UI and Japanese localization
