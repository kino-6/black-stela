# Black Stela Tasks

All modernization tasks from BS-001 through BS-040 are complete and archived at
[docs/archive/Tasks.completed-modernization.md](docs/archive/Tasks.completed-modernization.md).

## Active Backlog

Current milestone status: complete.

Milestone goal:

Turn the prototype content loop into a real DRPG foundation with production
data schemas, an original 6-10 floor first scenario target, and the first tempo
features needed for repeated dungeon play.

Target scenario size:

- Minimum shippable target: 6 floors.
- Preferred implementation target: 8 floors.
- Stretch target: 9-10 floors only after validation, debug starts, and
  playtest capacity are stable.

Completed delivery summary:

- BS-041..BS-045: Original scenario bible plus production data schemas for
  floors, items, shops, enemies, encounter tables, treasure tables, gates, and
  progression flags.
- BS-046..BS-048: Validation reports, scenario summary snapshots, and an
  eight-floor first scenario scaffold.
- BS-049..BS-052: Authored first-pass content for floors 1-8.
- BS-053..BS-055: Floor debug starts, headless probes, and pacing summary
  metrics.
- BS-056..BS-061: Repeat, keyboard shortcuts, compact log, auto combat, auto
  explore, town shortcuts, and safe confirmation settings.

### BS-041: Define First Scenario Content Bible

Status: [x]
Priority: P0
Parent plan lane: Lane F

Description:
Create the original content bible for the first Black Stela scenario, including
scenario pack name, town identity, floor roles, faction hints, enemy families,
treasure tone, and the core mystery. Use classic DRPGs only as structural
references, not as source material to copy.

Acceptance criteria:

- [x] Scenario, town, floor, faction, and enemy-family names are original.
- [x] Each planned floor has a gameplay role and emotional beat.
- [x] English and Japanese naming notes exist for core terms.

Verification:

- [x] Documentation review.
- [x] Japanese/English naming pass.

Dependencies:

- None

Likely files:

- `docs/scenario/first-scenario-bible.md`
- `content/worlds/default/manifest.md`
- `content/worlds/default/world.md`

Estimated scope:

- S

### BS-042: Expand Scenario Schema for Floor Metadata

Status: [x]
Priority: P0
Parent plan lane: Lane F

Description:
Add structured floor metadata so scenario packs can describe floor level, role,
danger tier, unlock state, recommended party level, and authoring notes without
encoding those concepts only in prose.

Acceptance criteria:

- [x] Dungeon floor schema supports level, role, danger tier, and optional tags.
- [x] Existing default scenario migrates without validation errors.
- [x] Invalid floor metadata produces actionable validation errors.

Verification:

- [x] `npm test`
- [x] Scenario validation fixture test.

Dependencies:

- BS-041 recommended

Likely files:

- `src/domain/scenario.ts`
- `src/domain/types.ts`
- `content/worlds/default/dungeons/*.md`
- `tests/scenario.test.ts`

Estimated scope:

- M

### BS-043: Add Item, Equipment, and Shop Data Schemas

Status: [x]
Priority: P0
Parent plan lane: Lane F

Description:
Replace the single healing item skeleton with scenario-authored item,
equipment, and shop stock schemas that can support consumables, weapons, armor,
utility tools, prices, sell values, and availability.

Acceptance criteria:

- [x] Scenario data can define item and equipment catalogs.
- [x] Town shop stock can reference valid catalog entries.
- [x] Broken item/shop references fail validation with file and field context.

Verification:

- [x] `npm test`
- [x] Valid and invalid catalog fixture tests.

Dependencies:

- BS-042

Likely files:

- `src/domain/scenario.ts`
- `src/domain/scenarioPack.ts`
- `src/domain/types.ts`
- `content/worlds/default/items.md`
- `content/worlds/default/town.md`
- `tests/scenarioPackLoader.test.ts`

Estimated scope:

- M

### BS-044: Add Enemy, Encounter, and Treasure Table Schemas

Status: [x]
Priority: P0
Parent plan lane: Lane F

Description:
Move beyond fixed room encounters by adding enemy definitions, encounter tables,
treasure tables, reward tiers, and per-floor references suitable for an
8-floor scenario.

Acceptance criteria:

- [x] Enemy definitions are reusable across encounters.
- [x] Encounter tables can be assigned per floor or zone.
- [x] Treasure tables validate item, currency, and rarity references.

Verification:

- [x] `npm test`
- [x] Broken encounter and loot reference fixture tests.

Dependencies:

- BS-043

Likely files:

- `src/domain/scenario.ts`
- `src/domain/types.ts`
- `content/worlds/default/enemies.md`
- `content/worlds/default/encounters.md`
- `content/worlds/default/treasure.md`
- `tests/scenarioPackLoader.test.ts`

Estimated scope:

- M

### BS-045: Add Exploration Gate Data Schemas

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Add data support for DRPG exploration gates such as locks, keys, hidden doors,
one-way routes, dark zones, warning clues, shortcut unlocks, and progression
flags.

Acceptance criteria:

- [x] Rooms and exits can reference locks, keys, secrets, and one-way behavior.
- [x] Locked or secret routes can include localized clue text.
- [x] Impossible locks and invalid progression references fail validation.

Verification:

- [x] `npm test`
- [x] Invalid gate fixture tests.

Dependencies:

- BS-042

Likely files:

- `src/domain/scenario.ts`
- `src/domain/types.ts`
- `tests/fixtures/scenarios/*`
- `tests/scenarioPackLoader.test.ts`

Estimated scope:

- M

### Checkpoint 8: Data Schema Foundation

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] Default scenario validates.
- [x] Invalid fixtures report file and field context.

Exit criteria:

- [x] Scenario data can describe floors, items, shops, enemies, encounters,
  treasure, and exploration gates.
- [x] Existing MVP clear path still works.

### BS-046: Build Data Quality Validation Reports

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Extend scenario validation so authors can catch unreachable rooms, invalid loot
references, impossible locks, encounter budget spikes, missing localization,
and save compatibility concerns before play.

Acceptance criteria:

- [x] Validation reports group errors by severity, file, and field path.
- [x] Reachability and broken-reference checks run against the default pack.
- [x] Missing Japanese text is reported as a warning when English exists.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`

Dependencies:

- BS-043
- BS-044
- BS-045

Likely files:

- `src/services/scenarioPackLoader.ts`
- `src/components/ScenarioValidationPanel.tsx`
- `tests/scenarioPackLoader.test.ts`
- `tests/e2e/scenario-validation.spec.ts`

Estimated scope:

- M

### BS-047: Add Scenario Data Summary Snapshots

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Generate human-readable summaries for floors, encounter budgets, treasure
tiers, item catalogs, shop stock, and localization coverage so content changes
can be reviewed without opening every Markdown file.

Acceptance criteria:

- [x] A script or test helper summarizes the active scenario pack.
- [x] Summary includes floor count, room count, encounters, loot, gates, and
  missing localization counts.
- [x] Snapshot output is stable enough for review.

Verification:

- [x] `npm test`
- [x] Scenario summary snapshot test.

Dependencies:

- BS-046

Likely files:

- `src/services/scenarioSummary.ts`
- `tests/scenarioSummary.test.ts`
- `scripts/*`

Estimated scope:

- S

### BS-048: Scaffold the 8-Floor First Scenario Pack

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Create the first substantial scenario pack structure with eight planned floors,
shared data files, localized title/summary text, and placeholder room graphs
that validate before detailed content is written.

Acceptance criteria:

- [x] Eight floor files exist and are referenced by the scenario pack.
- [x] Each floor has start room, exit graph, floor metadata, and localization
  placeholders.
- [x] Scenario summary reports the expected floor count and no fatal errors.

Verification:

- [x] `npm test`
- [x] `npm run headless:clear`
- [x] Scenario summary snapshot review.

Dependencies:

- BS-047

Likely files:

- `content/worlds/default/dungeons/b1f.md`
- `content/worlds/default/dungeons/b2f.md`
- `content/worlds/default/dungeons/b3f.md`
- `content/worlds/default/dungeons/b4f.md`
- `content/worlds/default/dungeons/b5f.md`
- `content/worlds/default/dungeons/b6f.md`
- `content/worlds/default/dungeons/b7f.md`
- `content/worlds/default/dungeons/b8f.md`
- `content/worlds/default/world.md`

Estimated scope:

- M

### BS-049: Author Floors 1-2 Onboarding and First Retreat

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Replace placeholder content for floors 1-2 with original rooms, clues,
encounters, treasure, and a first meaningful retreat decision.

Acceptance criteria:

- [x] Floor 1 teaches movement, map reading, search/listen, and safe retreat.
- [x] Floor 2 adds attrition, branching loops, a locked shortcut, and stronger
  encounter mix.
- [x] English and Japanese prose exists for room names, descriptions, and key
  clues.

Verification:

- [x] `npm test`
- [x] Floor 1-2 debug start manual check.
- [x] Scenario summary review.

Dependencies:

- BS-048

Likely files:

- `content/worlds/default/dungeons/b1f.md`
- `content/worlds/default/dungeons/b2f.md`
- `content/worlds/default/enemies.md`
- `content/worlds/default/treasure.md`

Estimated scope:

- M

### BS-050: Author Floors 3-4 Attrition and Navigation Twist

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Build floors 3-4 around resource pressure, optional treasure risk, first status
threats, and a navigation twist such as one-way movement, dark zones, or a
rotating route with readable clues.

Acceptance criteria:

- [x] Floor 3 creates resource pressure without requiring perfect play.
- [x] Floor 4 includes one navigation twist with clear clues and recoverable
  failure.
- [x] Encounter and trap budgets stay within documented target ranges.

Verification:

- [x] `npm test`
- [x] Floor 3-4 debug start manual check.
- [x] Scenario summary review.

Dependencies:

- BS-049

Likely files:

- `content/worlds/default/dungeons/b3f.md`
- `content/worlds/default/dungeons/b4f.md`
- `content/worlds/default/enemies.md`
- `content/worlds/default/treasure.md`

Estimated scope:

- M

### BS-051: Author Floor 5 Mid-Scenario Gate and Miniboss

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Create the midpoint floor with a gate, miniboss, shortcut unlock, and town
economy pressure that changes how players prepare for deeper floors.

Acceptance criteria:

- [x] Floor 5 contains a miniboss or equivalent commitment encounter.
- [x] A shortcut or gate changes future routing after completion.
- [x] Rewards and recovery pressure are documented in the scenario summary.

Verification:

- [x] `npm test`
- [x] Floor 5 debug start manual check.
- [x] Scenario summary review.

Dependencies:

- BS-050

Likely files:

- `content/worlds/default/dungeons/b5f.md`
- `content/worlds/default/enemies.md`
- `content/worlds/default/treasure.md`
- `content/worlds/default/town.md`

Estimated scope:

- M

### BS-052: Author Floors 6-8 Deep Route and Finale

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Complete the preferred eight-floor scenario with deeper enemy families,
stronger traps, party role checks, optional side objectives, rare rewards, and
a final commitment area.

Acceptance criteria:

- [x] Floors 6-7 create harder route choices and optional rewards.
- [x] Floor 8 contains the first scenario finale and return-path pressure.
- [x] The full scenario can be reached without impossible states.

Verification:

- [x] `npm test`
- [x] `npm run headless:clear`
- [x] Floor 6-8 debug start manual check.
- [x] Full scenario summary review.

Dependencies:

- BS-051

Likely files:

- `content/worlds/default/dungeons/b6f.md`
- `content/worlds/default/dungeons/b7f.md`
- `content/worlds/default/dungeons/b8f.md`
- `content/worlds/default/enemies.md`
- `content/worlds/default/treasure.md`

Estimated scope:

- M

### Checkpoint 9: First Scenario Content Pass

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run headless:clear`
- [x] Scenario summary review.
- [x] Manual Japanese/English smoke playthrough notes.

Exit criteria:

- [x] Eight-floor preferred scenario is valid and playable as a content pass.
- [x] Each floor has a distinct role, route decision, and reason to return.
- [x] The system can still run with AI disabled.

### BS-053: Add Floor-by-Floor Debug Starts

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Create debug start states for major scenario progress points so floors and
encounter ranges can be tested without replaying from the beginning.

Acceptance criteria:

- [x] Debug progress values exist for each authored floor or major checkpoint.
- [x] Debug starts include expected party state, inventory, map knowledge, and
  progression flags.
- [x] Invalid debug progress values fail safely.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`

Dependencies:

- BS-052

Likely files:

- `src/debug/debugStart.ts`
- `src/App.tsx`
- `tests/debugStart.test.ts`
- `tests/e2e/debug.spec.ts`

Estimated scope:

- M

### BS-054: Add Headless Scenario Probes

Status: [x]
Priority: P1
Parent plan lane: Lane F

Description:
Extend headless coverage beyond the current clear route with probes for
reachability, stuck states, retreat loops, floor transitions, and dangerous but
recoverable progress states.

Acceptance criteria:

- [x] Headless probes cover multiple progress states, not only a single clear.
- [x] Stuck diagnostics report room, floor, command, and reason.
- [x] Probes detect impossible locks or unreachable required goals.

Verification:

- [x] `npm test`
- [x] `npm run headless:clear`
- [x] New headless probe command or test suite.

Dependencies:

- BS-053

Likely files:

- `src/headless/headlessRunner.ts`
- `scripts/headless-clear.ts`
- `scripts/*`
- `tests/headlessRunner.test.ts`

Estimated scope:

- M

### BS-055: Tune First Scenario Pacing Metrics

Status: [x]
Priority: P2
Parent plan lane: Lane F

Description:
Add and use lightweight DRPG pacing metrics for expected rooms per outing, HP
loss, recovery pressure, item consumption, retreat frequency, and injury risk.

Acceptance criteria:

- [x] Scenario summary reports pacing metrics or authored target ranges.
- [x] Metrics identify at least one overtuned or undertuned area.
- [x] Tuning notes are recorded without treating headless clear as proof of fun.

Verification:

- [x] `npm test`
- [x] Scenario summary review.
- [x] Manual playtest notes.

Dependencies:

- BS-054

Likely files:

- `src/services/scenarioSummary.ts`
- `docs/playtest/first-scenario-notes.md`
- `tests/scenarioSummary.test.ts`

Estimated scope:

- S

### BS-056: Add Repeat Last Command

Status: [x]
Priority: P1
Parent plan lane: Lane E

Description:
Add a player-facing repeat command for common dungeon and combat actions while
preventing unsafe repetition of destructive or context-sensitive actions.

Acceptance criteria:

- [x] Repeat works for movement, inspection, search, attack, defend, and safe
  item-use candidates.
- [x] Repeat is blocked with a clear message when the previous command is no
  longer valid.
- [x] Repeat never auto-confirms return, retreat, save/load, or irreversible
  actions.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`

Dependencies:

- None

Likely files:

- `src/domain/types.ts`
- `src/App.tsx`
- `src/i18n/en.ts`
- `src/i18n/ja.ts`
- `tests/e2e/*`

Estimated scope:

- M

### BS-057: Add Keyboard Shortcut Layer

Status: [x]
Priority: P1
Parent plan lane: Lane E

Description:
Add keyboard shortcuts for common DRPG commands while preserving accessibility,
text input behavior, and Japanese UI labels.

Acceptance criteria:

- [x] Movement, turning, search/listen, attack/defend, and repeat have shortcuts.
- [x] Shortcuts do not fire while typing in text fields or settings inputs.
- [x] Shortcut hints are visible without crowding the command UI.

Verification:

- [x] `npm run test:e2e`
- [x] Manual keyboard smoke check.

Dependencies:

- BS-056 recommended

Likely files:

- `src/App.tsx`
- `src/styles.css`
- `src/i18n/en.ts`
- `src/i18n/ja.ts`
- `tests/e2e/*`

Estimated scope:

- M

### BS-058: Add Compact and Fast Log Modes

Status: [x]
Priority: P1
Parent plan lane: Lane E

Description:
Add log presentation settings so repeated combat and movement outcomes can be
shown compactly or quickly without losing canonical event detail.

Acceptance criteria:

- [x] Player can switch between full and compact log presentation.
- [x] Repeated low-importance outcomes can be grouped or visually compressed.
- [x] Canonical `GameState.log` remains unchanged.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`
- [x] Japanese compact-log viewport check.

Dependencies:

- BS-056 recommended

Likely files:

- `src/domain/replayLog.ts`
- `src/App.tsx`
- `src/styles.css`
- `src/i18n/en.ts`
- `src/i18n/ja.ts`
- `tests/e2e/*`

Estimated scope:

- M

### BS-059: Add Auto Combat With Stop Conditions

Status: [x]
Priority: P1
Parent plan lane: Lane E

Description:
Add a conservative auto-combat mode that repeats safe combat choices but stops
when player intervention is needed.

Acceptance criteria:

- [x] Auto combat stops on low HP, injury, unknown enemy, no valid target,
  item shortage, boss/miniboss encounters, or player cancel.
- [x] Auto combat emits understandable logs or status text for why it stopped.
- [x] AI does not choose tactics or mutate game state.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`
- [x] Auto-combat stop-condition tests.

Dependencies:

- BS-056
- BS-058 recommended

Likely files:

- `src/domain/rulesEngine.ts`
- `src/App.tsx`
- `src/i18n/en.ts`
- `src/i18n/ja.ts`
- `tests/rulesEngine.test.ts`
- `tests/e2e/*`

Estimated scope:

- M

### BS-060: Add Auto Move Until Interesting Event

Status: [x]
Priority: P2
Parent plan lane: Lane E

Description:
Add a cautious auto-move action that continues along known safe paths until the
party reaches an interesting event or a stop condition.

Acceptance criteria:

- [x] Auto move stops at branches, unknown exits, traps, enemies, walls,
  stairs, secrets, locked routes, low HP, or player cancel.
- [x] Auto move uses map knowledge and does not reveal unknown truth for free.
- [x] Stop reason is visible in English and Japanese.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`
- [x] Headless auto-move stop-condition tests.

Dependencies:

- BS-054 recommended
- BS-057 recommended

Likely files:

- `src/domain/rulesEngine.ts`
- `src/headless/headlessRunner.ts`
- `src/App.tsx`
- `src/i18n/en.ts`
- `src/i18n/ja.ts`
- `tests/headlessRunner.test.ts`
- `tests/e2e/*`

Estimated scope:

- M

### BS-061: Add Town Shortcuts and Safe Confirmations

Status: [x]
Priority: P2
Parent plan lane: Lane E

Description:
Add town shortcuts for recover all, save/load, and return to dungeon, plus
configurable safe confirmations for retreat, return, and other high-impact
actions.

Acceptance criteria:

- [x] Recover all and save/load shortcuts are visible in town.
- [x] High-impact dungeon actions have clear confirmation behavior.
- [x] Experienced-player confirmation settings persist safely.

Verification:

- [x] `npm test`
- [x] `npm run test:e2e`

Dependencies:

- BS-057 recommended

Likely files:

- `src/App.tsx`
- `src/services/saveRepository.ts`
- `src/i18n/en.ts`
- `src/i18n/ja.ts`
- `tests/e2e/town.spec.ts`

Estimated scope:

- M

### Checkpoint 10: DRPG Tempo Pass

Status: [x]

Required verification:

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run headless:clear`
- [x] `npm run test:e2e`
- [x] Manual keyboard and Japanese UI smoke check.

Exit criteria:

- [x] Repeat, shortcuts, compact log, auto combat, auto move, and town shortcuts
  improve repeated play without taking agency away from the player.
- [x] Automation stops before unsafe, unknown, or high-impact actions.
- [x] AI disabled mode remains fully playable.

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
### BS-062: Task Title

Status: [ ]
Priority: P0 | P1 | P2 | P3
Parent plan lane: Lane A | Lane B | Lane C | Lane D | Lane E | Lane F

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
- Keep content/data changes validated through scenario fixtures and summary
  reviews.
- Keep Repeat/Auto features conservative: automation must stop before unsafe,
  unknown, high-impact, or player-authored decisions.
