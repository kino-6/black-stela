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
- [x] BS-159..BS-162 DRPG equipment depth:
  [docs/archive/Tasks.completed-equipment-depth.md](docs/archive/Tasks.completed-equipment-depth.md)
- [x] BS-163..BS-166 party-round combat depth:
  [docs/archive/Tasks.completed-party-round-combat-depth.md](docs/archive/Tasks.completed-party-round-combat-depth.md)
- [x] BS-167..BS-170 sequential party command entry:
  [docs/archive/Tasks.completed-sequential-party-command-entry.md](docs/archive/Tasks.completed-sequential-party-command-entry.md)
- [x] BS-171..BS-176 combat cockpit and map repair:
  [docs/archive/Tasks.completed-combat-cockpit-map-repair.md](docs/archive/Tasks.completed-combat-cockpit-map-repair.md)
- [x] BS-156..BS-158 controller-first normal-play UI:
  [docs/archive/Tasks.completed-controller-first-normal-play-ui.md](docs/archive/Tasks.completed-controller-first-normal-play-ui.md)
- [x] BS-177..BS-182 browser self-play gate:
  [docs/archive/Tasks.completed-browser-selfplay-gate.md](docs/archive/Tasks.completed-browser-selfplay-gate.md)

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
- Japanese normal play must not mix stray English names or units. Keep genre
  conventions only when they are natural in Japanese RPGs; localize enemy names,
  place names, shop text, rewards, and logs.
- Local narration stays hidden, local-first, non-canonical, and unable to mutate
  `GameState`.
- Return/escape, save, automation, and debug affordances must respect DRPG rules.
- Normal-play UI is controller/keyboard first. Guild, town, dungeon, combat,
  shop, recovery, records, and configuration flows use staged choices, stable
  focus order, confirm/cancel semantics, and fixed command/message areas before
  mouse convenience.
- Controller-first is a blocking completion rule. Changed normal-play surfaces
  need browser proof for directional focus, confirm, and cancel/back where
  applicable; mouse-only operation means the task is unfinished.
- Dungeon topology is a continuous grid of cells, walls, doors, stairs, and edge
  rules. Arbitrary linked rooms are not a DRPG maze.
- Party formation is six-member, row-visible, and reviewed in browser before
  player-facing work is called done.
- Equipment must be a DRPG preparation layer, not a two-stat accessory list.
  Use original items with classic party-DRPG structure: weapon, offhand, body,
  head, hands, accessory, class/role fit, price tension, and visible tradeoffs.
- Combat must resolve as party tactics, not one debug-like button press. Normal
  play queues visible actor commands, shows target/risk/order, then resolves a
  bounded round without moving the command window.
- Combat command entry follows classic party RPG structure: the next unresolved
  adventurer receives a command in party order; formation cards are status, not
  arbitrary actor selectors.
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
- [x] Lane M: First-Person View and Minimap Parity. Guardrail active.
- [x] Lane N: Guild Registration Flow Reconstruction. Guardrail active.
- [x] Lane O: Controller-First Normal-Play UI. Guardrail active.
- [x] Lane P: DRPG Equipment Depth. Guardrail active.
- [x] Lane Q: Party-Round Combat Depth. Guardrail active.
- [x] Lane R: Sequential Party Command Entry. Guardrail active.
- [x] Lane S: Combat Cockpit and Map Presentation Repair. Guardrail active.
- [x] Lane T: Browser Self-Play Gate. Guardrail active.
- [ ] Lane G: Desktop Productization. Deferred.
- [ ] Lane H: Hidden Local Narration Operations. Deferred.

### [x] Lane O: Controller-First Normal-Play UI

Goal: remove web-form/mouse-first assumptions from normal play surfaces.

- [x] Define one focus model for town, guild registration, dungeon, combat, shop,
  recovery, records, and config: directional movement, confirm, cancel/back.
- [x] Convert guild registration from clickable step tabs/buttons into a staged
  command-window flow with visible focus, shortcuts, and stable message area.
- [x] Audit all normal screens for scattered form controls, hover-only affordances,
  and commands that move after logs/messages update.
- [x] Add Playwright coverage for keyboard/controller traversal on changed surfaces.
- [x] Add shared focus control: arrows select, Enter/Space confirms, Escape cancels.
- [x] Keep mouse support as convenience, not as the primary interaction model.
- [x] Done slice: shared focus controller plus guild/dungeon/combat/town/shop/config/repeat E2E proof.

Audit:
[docs/audits/controller-first-normal-play-audit.md](docs/audits/controller-first-normal-play-audit.md)

### [x] Lane T: Browser Self-Play Gate

Goal: make Codex verify Black Stela as a player in a real browser-like route,
not only through deterministic engine reachability.

- [x] Define Browser Self-Play as Playwright-driven normal play: title, guild,
  party creation, dungeon entry, combat, movement, stairs/return, shop/recovery,
  and Japanese/mobile spot checks where relevant.
- [x] Add a dedicated `selfplay:browser` command that runs a curated browser route
  and emits screenshots/log evidence under `test-results/selfplay/`.
- [x] Keep the self-play route honest: no debug progress, no hidden state mutation,
  no direct rules-engine command injection, no scenario-truth path skipping.
- [x] Record failures as player-facing categories: blocked control, visual mismatch,
  text/localization leak, layout overflow, command shift, impossible route,
  or hidden affordance.
- [x] Make Browser Self-Play a required completion gate for future player-facing
  claims, while keeping Headless as reachability-only support.
- [x] Done slice: browser self-play script/spec, npm command, artifacts, README/Gate
  notes, and CI-friendly verification.

### [x] Standing Guardrails

- Use [Grid Labyrinth Skill](docs/skills/grid-labyrinth-skill.md) for movement,
  minimap, stairs, return, and first-person render changes.
- Use [DRPG UX Review Skill](docs/skills/drpg-ux-review-skill.md) before UI,
  party, combat, town, dungeon, command, or automation changes.
- Use [Scenario Prose Skill](docs/skills/scenario-prose-skill.md) before prose
  and localization changes.
- Keep command windows stable, party rows visible, and Japanese/mobile checks
  active for any changed player-facing surface.

## Current Milestone Recommendation

Lane T is complete for the current slice. Browser Self-Play is now a standing
gate for normal-route player-facing claims. Lane O remains a standing gate;
Lane S is archived, but its combat and minimap regressions stay in gate checks.

Use [Black Stela Gate Review Skill](docs/skills/black-stela-gate-review-skill.md)
before any player-facing implementation or completion claim.

## Planning Rule

Before adding new work to `Tasks.md`, write a small milestone goal with outcome,
scope, verification, save/schema impact, Japanese/UI impact, content validation,
headless/browser parity, and human expectation/red-flag impact.
