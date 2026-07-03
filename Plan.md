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

## Current Content/Data Status

The current bundled scenario and gameplay data are still prototype-grade. They
are good enough to verify the engine loop, save data, i18n, validation, map
state, and headless clear path, but they are not yet a production DRPG content
set.

Current content limits:

- One compact floor with three rooms.
- One fixed trap and one fixed enemy.
- One healing consumable skeleton.
- Town services limited to guild, recovery, records, and dungeon entry.
- No equipment table, shop economy, treasure table, enemy families, encounter
  tables, class/role differentiation, multi-floor progression, or long-term
  resource pressure.
- Scenario schema supports validated rooms, exits, traps, encounters, localized
  text, and events, but the data model still needs expansion for production
  content authoring.

## Product Guardrails

- Player character speech, inner life, and action decisions remain controlled by
  the player.
- AI is optional, local-first, and cannot mutate `GameState`.
- Scenario truth remains ID-driven Markdown/YAML and is validated before play.
- All rule changes should remain testable through unit tests and headless runs.
- Japanese support is a first-class path, not a later translation pass.
- Classic DRPG references such as Wizardry should be used for structural
  lessons only: risk pacing, mapping tension, attrition, town recovery, party
  roles, and information asymmetry. Do not copy maps, names, prose, monster
  identities, puzzle text, or proprietary progression.

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

### Lane E: DRPG Tempo and Convenience

- Repeat last command for movement, inspection, search, and combat.
- Keyboard shortcut layer for common dungeon and combat commands.
- Compact or fast log mode for repeated outcomes.
- Auto combat with strict stop conditions for danger, injury, item shortage,
  unknown enemies, and player intervention.
- Auto move until an interesting event: branch, trap, enemy, wall, secret
  candidate, stairs, or unexplored room.
- Town shortcuts for recover all, save/load, and return to dungeon.
- Settings for confirmation prompts, animation/log speed, and message verbosity.

### Lane F: Scenario and Data Production

- Expand the scenario schema for production data: floors, zones, encounter
  tables, treasure tables, shops, equipment, class/role hooks, status effects,
  locks, keys, secrets, and progression flags.
- Build an original first scenario with 6-10 floors and a town loop that tests
  attrition, mapping, retreat pressure, recovery cost, and reward pacing.
- Create enemy families with clear tactical roles: weak attrition enemies,
  armored blockers, status threats, ambushers, casters, and floor bosses.
- Create item/equipment data: consumables, weapons, armor, utility tools, sell
  values, shop stock, and dungeon-only finds.
- Create trap and exploration data: hidden doors, locked doors, one-way routes,
  dark zones, teleport-style displacement, warning clues, and optional shortcuts.
- Create authoring validation for data quality: unreachable rooms, impossible
  locks, invalid loot references, encounter budget spikes, missing localization,
  and save compatibility.
- Establish a content playtest loop using headless runs, curated debug starts,
  and manual Japanese/English playthrough notes.

## Scenario/Data Production Plan

The next content milestone should turn the current prototype scenario into an
original 6-10 floor DRPG data set that proves the game can support real dungeon
design.

### Step 1: Define Original Content Bible

- Name the first scenario pack, town, floors, factions, enemy families, and core
  mystery in Black Stela's own language.
- Define tone references without borrowing protected expression from classic
  DRPGs.
- Define player-facing promises: hard choices, readable danger, fair secrets,
  and recoverable failure.
- Verification: document review plus Japanese/English naming pass.

### Step 2: Expand Data Schemas Before Writing Bulk Content

- Add schemas for encounter tables, treasure tables, item tables, shop stock,
  equipment slots, locks/keys, and floor metadata.
- Keep scenario truth machine-readable and prose localized.
- Add validation errors that point to file, field, and broken reference.
- Verification: unit tests for valid and invalid data fixtures.

### Step 3: Build a 6-10 Floor First Scenario

Target size:

- Minimum: 6 floors if each floor has a distinct role, enemy mix, and route
  pressure.
- Preferred: 8 floors for a compact but substantial DRPG scenario.
- Upper bound: 10 floors unless production tooling and playtest capacity are
  ready for more.

Recommended floor arc:

- Floor 1: onboarding, mapping, first hidden door, first meaningful retreat.
- Floor 2: attrition, branching loops, locked shortcut, stronger encounter mix.
- Floor 3: resource pressure, optional treasure risk, first status threat.
- Floor 4: navigation twist such as one-way movement, dark zone, or rotating
  route, with readable clues.
- Floor 5: mid-scenario gate, miniboss, town economy pressure, and shortcut
  unlock.
- Floor 6: deeper enemy families, stronger traps, and party role checks.
- Floor 7-8: optional expansion floors for secrets, side objectives, rare
  rewards, and harder route choices.
- Floor 9-10: final commitment area, boss pressure, special reward, and return
  path test.
- Each floor should include optional rewards, safe clues, at least one route
  decision, and a reason to return later.
- Verification: headless reachability tests, floor-by-floor debug starts, clear
  probes from multiple progress states, and manual playthrough notes.

### Step 4: Create Data Tables

- Enemy table by floor, role, HP, attack, status risk, reward value, and escape
  pressure.
- Item/equipment table by tier, cost, sell value, availability, and tactical use.
- Trap table by warning clarity, damage, detection/disarm support, and recovery
  impact.
- Treasure table by risk tier and floor depth.
- Verification: schema validation, snapshot summaries, and balance review.

### Step 5: Tune Pacing With DRPG Metrics

- Track expected rooms per outing, HP loss per floor, recovery cost pressure,
  item consumption, retreat frequency, and deaths/injuries avoided by good play.
- Add headless scenario probes for reachability and impossible-state detection;
  do not use headless clear as proof of fun.
- Verification: repeatable seeds/probes, manual playtest logs, and Japanese UI
  checks.

### Step 6: Add Content Authoring Tooling

- Scenario validation panel should group errors by severity and file.
- Add data summary views for floors, encounters, loot, and localization
  coverage.
- Add fixture packs for invalid locks, invalid drops, unreachable rooms, and
  missing translations.
- Verification: Playwright validation UI tests and unit validation tests.

## Planning Rule

Before adding more work to `Tasks.md`, write a small milestone goal with:

- User-facing outcome.
- Scope boundary.
- Verification commands.
- Save/schema impact.
- Japanese/UI impact.
- Content/data impact and validation rules.
- DRPG tempo impact when the work affects repeated commands, logs, combat, or
  travel.
