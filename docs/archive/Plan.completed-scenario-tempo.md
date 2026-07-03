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
- Local narration is internally enabled by default, local-first, and cannot
  mutate `GameState`.
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

### Lane D: Hidden Local Narration Infrastructure

- Provider health checks that never surface as player-facing setup.
- Prompt/version metadata for debugging and reproducibility.
- Background-only local flavor generation that never speaks for player
  characters and never becomes canonical game truth.
- Developer diagnostics for rejected narration, kept out of normal play.

### Lane E: DRPG Tempo and Convenience

- Repeat last command for movement, inspection, search, and combat.
- Keyboard shortcut layer for common dungeon and combat commands.
- Message pacing for repeated outcomes without permanent checkbox clutter.
- Auto combat with strict stop conditions for danger, injury, item shortage,
  unknown enemies, and player intervention.
- Auto move until an interesting event: branch, trap, enemy, wall, secret
  candidate, stairs, or unexplored room.
- Town actions should remain diegetic services rather than utility toolbar
  controls.

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

### Lane G: Character Creation and Roster Identity

- Replace the current name/notes-only recruit form with a stepwise guild
  registration flow that makes creating adventurers feel like play.
- Add mechanical identity: ancestry/lineage, class, background, aptitude,
  starting traits, party role tags, initial equipment, and growth hooks.
- Add expressive identity: portrait selection/import, palette or accent color,
  title/epithet, vow, origin prompt, voice/personality tag for text flavor, and
  Japanese/English localized labels.
- Add party-building guidance: front/back row fit, required utility coverage,
  duplicate-role warnings, beginner templates, and recommended starter parties.
- Add controlled randomness: optional roll/keep point allocation, trait draws,
  and quick-generate buttons that produce usable but editable recruits.
- Add long-term attachment: roster history, scars/injuries, retirement or
  apprenticeship hooks, memorial records, and rename/rebuild rules.
- Keep all player character speech, decisions, and inner life editable by the
  player; generated prompts may suggest hooks but must not canonize them.

## Character Creation Research Notes

The goal is not to clone any one game. The useful pattern is to combine several
well-liked character creation virtues in a DRPG-sized form.

References checked:

- Baldur's Gate 3 uses origin/custom avatar choices, race/class/background,
  point-buy ability scores, skill proficiency, and origin backstories that can
  produce unique quests/interactions. Sources:
  https://bg3.wiki/wiki/Character_creation and
  https://bg3.wiki/wiki/Origins
- Etrian Odyssey centers creation around a guild roster, class/portrait
  registration, palette/voice customization in later entries, formation, squads,
  rest/respec, retirement, and later specialization titles. Source:
  https://etrian.fandom.com/wiki/Explorers_Guild
- Wizardry-style DRPG creation ties name, alignment, class, race/lineage,
  statistics, qualification requirements, and bonus-point distribution to the
  long-term party plan. Sources:
  https://www.wizardryarchives.com/downloads/archivesmanual.pdf and
  https://strategywiki.org/wiki/Wizardry:_Proving_Grounds_of_the_Mad_Overlord/Trebor%27s_castle
- Dragon's Dogma 2 shows the appeal of a creator as a standalone activity:
  players can create and store characters before the main adventure and transfer
  them into the game. Source:
  https://store.playstation.com/en-us/product/UP0102-PPSA19867_00-DD2DEMO000000000
- Current RPG recommendation coverage continues to reward character freedom,
  choice recognition, and reactive role-playing as major value signals. Source:
  https://www.gamesradar.com/best-steam-rpgs/

Key lessons for Black Stela:

- Character creation should start from a playable fantasy: "What job does this
  adventurer do in the party, and why would I risk them in the Stela?"
- The first recruit path must be fast, but the advanced path should support
  tinkering, rerolling, and party theorycrafting.
- Good character creation exposes tradeoffs immediately: front-line durability,
  trap utility, healing, mapping, burst damage, status control, escape safety,
  and treasure handling.
- Visual identity matters, but for a DRPG the strongest attachment comes from
  roster memory: names, titles, injuries, deeds, deaths, retirements, and party
  combinations.
- Randomness is fun when it creates stories and sparks decisions; it is bad when
  it quietly produces invalid or trap builds. Every random option must be
  explainable and repairable.
- Japanese support cannot be a late pass because names, titles, class labels,
  tone prompts, and compact UI fit all affect the feeling of creation.

## Character Creation Plan

The next character milestone should turn guild registration into a satisfying
loop before expanding combat balance around it.

### Step 1: Define the Recruit Data Model

- Add recruit fields for lineage, class, background, aptitude scores, traits,
  title, portrait, palette/accent, starting equipment, and creation history.
- Keep player-authored name and notes as first-class fields.
- Store localized display names for classes, backgrounds, traits, and role tags.
- Verification: schema tests, save migration tests, Japanese/English fixture
  coverage, and import compatibility for existing simple recruits.

### Step 2: Build the Guided Registration Flow

- Replace the single form with a compact multi-step flow:
  identity -> role/class -> aptitude -> background/trait -> portrait -> review.
- Provide "Quick recruit" and "Detailed recruit" paths from the same component.
- Show plain-language consequences on each choice: row fit, combat role,
  exploration utility, recommended stats, and beginner difficulty.
- Verification: Playwright flow for quick recruit, detailed recruit, Japanese
  layout, keyboard-only operation, and mobile fit.

### Step 3: Add Party Composition Feedback

- Show party coverage meters: front line, healing, trap handling, mapping,
  damage, status safety, and retreat support.
- Warn without blocking when the party has obvious risk, such as no healer or no
  trap utility.
- Provide starter templates: balanced, cautious, treasure-hunting, aggressive,
  and beginner-safe.
- Verification: unit tests for composition scoring and E2E tests for warnings
  and template application.

### Step 4: Add Controlled Randomness and Build Seeds

- Add optional point roll/keep, trait draw, and "inspire me" generation.
- Always generate valid recruits and explain what changed.
- Allow rerolling individual parts without wiping the whole character.
- Save a build seed/history note for reproducible debug and sharing later.
- Verification: deterministic seeded tests, invalid-build guards, and headless
  start generation for representative parties.

### Step 5: Add Roster Attachment Systems

- Track first expedition, deepest floor reached, notable kills, injuries, rescues,
  retreats, and retirement/memorial state.
- Add editable titles/epithets unlocked by deeds, not only by level.
- Add retirement/apprentice planning as a later progression hook, inspired by
  guild-based DRPGs but using original Black Stela terminology.
- Verification: replay log projection tests, save data tests, and UI checks for
  long names in English and Japanese.

### Step 6: Balance Creation Against the First Scenario

- Tie classes and traits to actual scenario pressures: traps, locked routes,
  attrition, enemy armor, status effects, and retreat safety.
- Add at least one reason each class/background can matter within floors 1-2.
- Avoid "fake" choices that have no early gameplay expression.
- Verification: debug starts with template parties, headless probes for each
  starter template, and manual play notes for fun/clarity.

### Character Creation Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Too many choices before play | High | Offer quick recruit, starter templates, and progressive disclosure. |
| Flavor choices do not affect play | Medium | Tie backgrounds/traits to early dungeon, town, and log outcomes. |
| Min-max pressure kills expression | Medium | Separate cosmetic/personality choices from core power; make templates viable. |
| Random creation creates trap builds | High | Validate every generated recruit and provide repair suggestions. |
| Japanese text overflow | Medium | Test compact class names, titles, and mobile review screens early. |

### Character Creation Open Questions

- Should Black Stela use classic six-stat naming, original stat names, or a
  smaller DRPG-specific stat set?
- Should lineage be mechanical, cosmetic, or mostly a background hook?
- Should class changes exist at launch, or should retirement/apprenticeship be
  the first long-term roster system?
- Should quick generation be purely local deterministic logic, or may the hidden
  local narrator suggest non-canonical titles/vows that the player edits?

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
