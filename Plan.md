# Black Stela Plan

## Archive

- BS-001..BS-040 modernization detail:
  [docs/archive/Plan.completed-modernization.md](docs/archive/Plan.completed-modernization.md)
- BS-041..BS-061 scenario/schema/tempo detail:
  [docs/archive/Plan.completed-scenario-tempo.md](docs/archive/Plan.completed-scenario-tempo.md)
- BS-064..BS-066, BS-071, BS-085..BS-096 guild registration detail:
  [docs/archive/Plan.completed-guild-registration.md](docs/archive/Plan.completed-guild-registration.md)
- BS-098..BS-103 cockpit UI implementation detail:
  [docs/archive/Tasks.completed-drpg-cockpit-ui.md](docs/archive/Tasks.completed-drpg-cockpit-ui.md)

## Current Baseline

Black Stela now has deterministic rules, save/load, debug starts, headless
probes, English/Japanese UI, scenario validation, authored multi-floor data,
repeat/auto commands, hidden local narration plumbing, first-person dungeon
rendering, minimap, browser-visible MVP clear coverage, and a Human Requirement
Gate. Combat has tactical rows/enemy groups/declared actions; guild registration
has quick/detailed recruits, starter templates, coverage feedback, save
migration, roster memory, and Japanese/mobile verification.

The remaining problem is not "can the engine clear"; it is "does the player see
and understand a DRPG worth playing." Headless runs are useful for reachability,
but they are not proof of UX, fun, fairness, or visual legibility.

## UI Reference Findings

- Wizardry-style play is a town/prep/labyrinth/return/heal loop. Full roster
  management belongs in town/guild screens.
- Front/back rows are tactical state, shown compactly during exploration/combat.
- Etrian Odyssey-style exploration pairs first-person view and readable mapping.
- Normal play avoids debug copy, oversized cards, duplicate logs, and free
  escape/save implications.

## Product Guardrails

- Title/startup UI must preserve mood. No explanatory product copy, AI copy, or
  developer language on the player-facing title screen.
- Player character speech, inner life, and decisions remain player-authored.
- Local narration stays hidden, local-first, non-canonical, and unable to mutate
  `GameState`.
- Return/escape, save, automation, and debug affordances must respect DRPG
  rules. Development convenience belongs behind debug mode.
- Japanese support is first-class and must be verified with layout tests.
- Classic DRPGs are references for structure only. Do not copy maps, names,
  prose, monsters, puzzles, or proprietary progression.

## Planning Lanes

These lanes describe the roadmap; `Tasks.md` selects the active milestone.

### Lane A: DRPG Presentation and UX

- Make the first-person dungeon view communicate walls, doors, stairs, enemies,
  traps, and interactable features clearly.
- Keep the minimap compact, readable, and honest to discovered information.
- Remove web-app/admin-panel residue from normal play.
- Rebuild exploration/combat as a DRPG cockpit: viewport, compact map, short
  context, condition/row state, selected actor/target, and command dock.
- Verify visual changes with Playwright screenshots on desktop and mobile.

### Lane B: Honest Simulation and Play Parity

- Separate headless reachability tests from browser/player clear tests.
- Maintain browser clear runs that use only visible controls and observed UI.
- Ensure domain rules reject commands the player should not be able to perform.
- Track what headless is allowed to know and report when it uses scenario truth.

### Lane C: Human Requirement Gate

- Use the Human Requirement Gate before coding player-facing work.
- Maintain a player-facing red-flag checklist for DRPG mood, visible
  affordances, non-diegetic controls, AI leakage, and web-app residue.
- Keep automated gates for title copy, hidden AI/provider controls, browser
  clear, minimap honesty, return-stair rules, and screenshot-visible dungeon
  features.
- Require a short "what human expectation does this satisfy?" note for each
  player-facing task.

### Lane D: Character Creation and Roster Identity

Completed current guild registration baseline. Future work can deepen class
balance, retirement, memorials, and editable deed history after economy and
equipment exist.

### Lane E: Playable Depth

- Expand town services beyond recovery.
- Implement inventory, equipment, shops, treasure rewards, currency, and
  recovery costs.
- Tie early dungeon pressure to party roles so character choices matter.

### Lane E2: Tactical DRPG Combat

- Use classic party DRPGs as structural references only: formation, declared
  rounds, uncertain hit rates, enemy groups, attrition, status, loot, and risk.
- Keep a readable round loop with party rows, enemy groups, per-character
  actions, initiative, target limits, and results.
- Make combat data-driven across roles, armor, accuracy, damage, speed,
  resistance, morale, XP, gold, drops, and encounter budgets.
- Keep the browser battle screen diegetic and visual. Enemy presence, party
  danger, target choice, and round results must be visible without reading logs.
- Balance first for a small vertical slice, not a full RPG rules encyclopedia.

### Lane F: Scenario Authoring and Content QA

- Add scenario pack picker/import flow.
- Improve author validation reports with severity, file grouping, localization
  coverage, reachability, locks, loot references, and encounter budgets.
- Maintain the 6-10 floor target with manual playtest notes in English and
  Japanese.
- Keep data summaries reviewable without opening every Markdown file.

### Lane G: Desktop Productization

- Wire the Tauri save adapter to real filesystem APIs.
- Persist portrait assets as app data files instead of only inline references.
- Run platform smoke builds, especially Windows.
- Define `SaveDataV2` migration policy before breaking save compatibility.

### Lane H: Hidden Local Narration Operations

- Add provider health checks and debug diagnostics that never surface in normal
  play.
- Track prompt/version metadata for reproducibility.
- Keep rejected narration inspectable in debug mode only.

## Current Milestone Recommendation

Lane E is selected in `Tasks.md`: playable depth. The cockpit pass now gives
dungeon/combat a clearer play surface, so this slice should make character
choices matter after registration through inventory, equipment, treasure, shops,
recovery costs, and early dungeon pressure.

Keep Lane A, Lane B, and Lane C as gates around the work. Playable depth is not
done if it looks like a shop admin panel, bypasses browser-visible verification,
or lets economy/equipment ignore tactical combat and dungeon pressure.

## Planning Rule

Before adding new work to `Tasks.md`, write a small milestone goal with outcome,
scope, verification, save/schema impact, Japanese/UI impact, content validation,
headless/browser parity, and human expectation/red-flag impact.
