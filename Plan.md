# Black Stela Plan

## Archive

- [x] BS-001..BS-040 modernization detail:
  [docs/archive/Plan.completed-modernization.md](docs/archive/Plan.completed-modernization.md)
- [x] BS-041..BS-061 scenario/schema/tempo detail:
  [docs/archive/Plan.completed-scenario-tempo.md](docs/archive/Plan.completed-scenario-tempo.md)
- [x] BS-064..BS-066, BS-071, BS-085..BS-096 guild registration detail:
  [docs/archive/Plan.completed-guild-registration.md](docs/archive/Plan.completed-guild-registration.md)
- [x] BS-098..BS-103 cockpit UI implementation detail:
  [docs/archive/Tasks.completed-drpg-cockpit-ui.md](docs/archive/Tasks.completed-drpg-cockpit-ui.md)
- [x] BS-104..BS-113 playable depth detail:
  [docs/archive/Plan.completed-playable-depth.md](docs/archive/Plan.completed-playable-depth.md)
- [x] BS-114..BS-122, BS-124..BS-127 character authorship/scenario authoring:
  [docs/archive/Tasks.completed-character-authoring-scenario-authoring.md](docs/archive/Tasks.completed-character-authoring-scenario-authoring.md)
- [x] BS-136..BS-140 DRPG UX formation:
  [docs/archive/Tasks.completed-drpg-ux-formation.md](docs/archive/Tasks.completed-drpg-ux-formation.md)

## Current Baseline

Black Stela has deterministic rules, save/load, debug starts, headless probes,
English/Japanese UI, scenario validation, authored multi-floor data, tactical
combat, guild character authorship, economy, first-person rendering, minimap,
and browser-visible clear coverage.

The remaining problem is not engine reachability. It is whether the player feels
they brought their own adventurers into a real labyrinth. Headless runs are not
proof of UX, fun, fairness, visual legibility, or grid-maze honesty.

## UI Reference Findings

- Wizardry-style play is a town/prep/labyrinth/return/heal loop.
- Etrian Odyssey-style exploration pairs first-person view and readable mapping.
- Classic console RPG input uses fixed command windows, cursor movement,
  confirm/cancel, message advance, and stable command positions.
- Normal play avoids debug copy, oversized cards, duplicate logs, free escape,
  and web-app/admin-panel residue.

## Product Guardrails

- Startup, AI, save/debug, and configuration affordances must not break mood.
- Player characters' speech, inner life, portraits, profiles, notes, classes,
  traits, aptitude, stats, and memory remain player-authored fantasy.
- Scenario prose must read as native Japanese: concrete object, sensory/spatial
  cue, short line, no theme explanation or translated-English syntax.
- Local narration stays hidden, local-first, non-canonical, and unable to mutate
  `GameState`.
- Return/escape, save, automation, and debug affordances must respect DRPG rules.
- Dungeon topology is a continuous grid of cells, walls, doors, stairs, and edge
  rules. Arbitrary linked rooms are not a DRPG maze.
- Party formation is six-member, row-visible, and reviewed in browser before
  player-facing work is called done.
- Stairs, return seals, and next-floor progression must be browser-visible.
- Past user-visible failures are recorded in
  [Past Trouble Regression Gate](docs/gates/past-trouble-regression-gate.md)
  and must be checked before player-facing work is called done.
- Classic DRPGs are structure references only. Do not copy proprietary content.

## Lane Status

- [x] Lane A: DRPG Presentation and UX.
- [x] Lane B: Honest Simulation and Play Parity.
- [x] Lane C: Human Requirement Gate.
- [x] Lane D: Character Creation and Roster Identity.
- [x] Lane D2: Character Authorship Recovery.
- [x] Lane E: Playable Depth.
- [x] Lane E2: Tactical DRPG Combat vertical slice.
- [x] Lane F: Scenario Authoring and Content QA.
- [x] Lane F2: Scenario Prose and Localization Quality. Guardrail active.
- [x] Lane I: Controller-First Command UI Reconstruction. Guardrail active.
- [x] Lane J: Grid Labyrinth Topology Recovery. Guardrail active.
- [x] Lane K: DRPG UX Autonomy and Six-Person Formation. Guardrail active.
- [x] Lane L: Past Trouble Regression Gate. Guardrail active.
- [ ] Lane G: Desktop Productization. Deferred.
- [ ] Lane H: Hidden Local Narration Operations. Deferred.

### [x] Lane K: DRPG UX Autonomy and Six-Person Formation

Goal: stop shipping player-facing UI that is merely functional but visibly weak.

- Use [DRPG UX Review Skill](docs/skills/drpg-ux-review-skill.md) before UI,
  party, combat, town, dungeon, command, or automation changes.
- Enforce [DRPG UX Gate](docs/gates/drpg-ux-gate.md): six-member party, visible
  front/back rows, stable command surfaces, browser review, mobile/Japanese
  checks, and explicit remaining UX risk.
- Make guild templates, debug starts, exploration HUD, and combat formation
  consistently support three-front/three-back party presentation.

### [x] Lane J: Grid Labyrinth Topology Recovery

Goal: replace room-link graphs with grid cells and edge metadata.

- Use [Grid Labyrinth Skill](docs/skills/grid-labyrinth-skill.md) before any
  dungeon, map, movement, stair, or rendering change.
- Enforce [Grid Labyrinth Gate](docs/gates/grid-labyrinth-gate.md): explicit
  cell coordinates, cell-edge walls/doors, adjacent movement, current-cell
  stairs/return, and browser-visible proof.
- Add scenario schema support for grid cells and edge metadata while migrating
  the current room graph only as a temporary compatibility source.
- Convert B1F first into a compact continuous grid with entrance, branch, door,
  trap/combat cell, return mark, and downstairs cell; then expand B2F-B8F.
- Rebuild minimap and first-person render from grid coordinates, not inferred
  room graph coordinates.
- Reject non-adjacent arbitrary exits in validation unless declared as stairs,
  one-way edge, shortcut, or floor transition.
- Add Playwright coverage for normal controls reaching lower-floor stairs and
  returning to town from the correct current cell.

### [x] Lane F2: Scenario Prose and Localization Quality

Goal: remove translated-English mood text and make scenario prose support play.

- Use [Scenario Prose Skill](docs/skills/scenario-prose-skill.md) and
  [Scenario Prose Gate](docs/gates/scenario-prose-gate.md).
- Rewrite Japanese first; add QA for abstract filler and translated syntax.

### [x] Lane I: Controller-First Command UI Reconstruction

Goal: stop log growth from moving commands and rebuild combat/exploration input
as a classic RPG command surface.

- Replace action-button rows with a fixed command window, cursor highlight,
  confirm/cancel bindings, and controller/keyboard navigation.
- Separate interaction states: command select, target select, message/result
  advance, submenu select, auto/repeat running, and disabled/unsafe states.
- Keep logs in a fixed message window with bounded height and explicit advance;
  combat resolution must never shift command positions.
- Add command memory/defaults: Attack/Defend/Item/Spell/Retreat as menu items,
  target defaults, Take Back before round resolve, and repeat only as a held
  mode that can stop on cancel/danger/branch/boss.
- Verification: Playwright presses keyboard only through a combat round,
  asserts command-window bounding box is stable before/after attack, verifies
  cancel/back behavior, target selection, message advance, Japanese/mobile fit,
  and no button displacement from logs.

## Current Milestone Recommendation

Lane J/F2/I current passes are complete; keep their gates active for future UI,
dungeon, prose, and command work.

Use [Black Stela Gate Review Skill](docs/skills/black-stela-gate-review-skill.md)
before any player-facing implementation or completion claim.

## Planning Rule

Before adding new work to `Tasks.md`, write a small milestone goal with outcome,
scope, verification, save/schema impact, Japanese/UI impact, content validation,
headless/browser parity, and human expectation/red-flag impact.
