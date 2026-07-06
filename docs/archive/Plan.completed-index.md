# Completed Plan Archive Index

Archived: 2026-07-05

Active plan: [../../Plan.md](../../Plan.md)

## Completed Plan And Task Slices

- [x] BS-001..BS-040 modernization detail:
  [Plan.completed-modernization.md](Plan.completed-modernization.md)
- [x] BS-041..BS-061 scenario/schema/tempo detail:
  [Plan.completed-scenario-tempo.md](Plan.completed-scenario-tempo.md)
- [x] BS-064..BS-066, BS-071, BS-085..BS-096 guild registration detail:
  [Plan.completed-guild-registration.md](Plan.completed-guild-registration.md)
- [x] BS-098..BS-103 cockpit UI implementation detail:
  [Tasks.completed-drpg-cockpit-ui.md](Tasks.completed-drpg-cockpit-ui.md)
- [x] BS-104..BS-113 playable depth detail:
  [Plan.completed-playable-depth.md](Plan.completed-playable-depth.md)
- [x] BS-114..BS-122, BS-124..BS-127 character authorship/scenario authoring:
  [Tasks.completed-character-authoring-scenario-authoring.md](Tasks.completed-character-authoring-scenario-authoring.md)
- [x] BS-136..BS-140 DRPG UX formation:
  [Tasks.completed-drpg-ux-formation.md](Tasks.completed-drpg-ux-formation.md)
- [x] BS-159..BS-162 DRPG equipment depth:
  [Tasks.completed-equipment-depth.md](Tasks.completed-equipment-depth.md)
- [x] BS-163..BS-166 party-round combat depth:
  [Tasks.completed-party-round-combat-depth.md](Tasks.completed-party-round-combat-depth.md)
- [x] BS-167..BS-170 sequential party command entry:
  [Tasks.completed-sequential-party-command-entry.md](Tasks.completed-sequential-party-command-entry.md)
- [x] BS-171..BS-176 combat cockpit and map repair:
  [Tasks.completed-combat-cockpit-map-repair.md](Tasks.completed-combat-cockpit-map-repair.md)
- [x] BS-156..BS-158 controller-first normal-play UI:
  [Tasks.completed-controller-first-normal-play-ui.md](Tasks.completed-controller-first-normal-play-ui.md)
- [x] BS-177..BS-182 browser self-play gate:
  [Tasks.completed-browser-selfplay-gate.md](Tasks.completed-browser-selfplay-gate.md)
- [x] BS-183..BS-188 town return loop:
  [Tasks.completed-town-return-loop.md](Tasks.completed-town-return-loop.md)

## Completed Lane Status

- [x] Lane A: DRPG Presentation and UX.
- [x] Lane B: Honest Simulation and Play Parity.
- [x] Lane C: Human Requirement Gate.
- [x] Lane D: Character Creation and Roster Identity.
- [x] Lane D2: Character Authorship Recovery.
- [x] Lane E: Playable Depth.
- [x] Lane E2: Tactical DRPG Combat vertical slice.
- [x] Lane F: Scenario Authoring and Content QA.
- [x] Lane F2: Scenario Prose and Localization Quality.
- [x] Lane I: Controller-First Command UI Reconstruction.
- [x] Lane J: Grid Labyrinth Topology Recovery.
- [x] Lane K: DRPG UX Autonomy and Six-Person Formation.
- [x] Lane L: Past Trouble Regression Gate.
- [x] Lane M: First-Person View and Minimap Parity.
- [x] Lane N: Guild Registration Flow Reconstruction.
- [x] Lane O: Controller-First Normal-Play UI.
- [x] Lane P: DRPG Equipment Depth.
- [x] Lane Q: Party-Round Combat Depth.
- [x] Lane R: Sequential Party Command Entry.
- [x] Lane S: Combat Cockpit and Map Presentation Repair.
- [x] Lane T: Browser Self-Play Gate.
- [x] Lane U: Town Return Loop and Japanese DRPG Service UX.

## Recent Archived Plan Details

### Lane O: Controller-First Normal-Play UI

Goal: remove web-form/mouse-first assumptions from normal play surfaces.

- [x] Defined one focus model for town, guild registration, dungeon, combat,
  shop, recovery, records, and config.
- [x] Converted guild registration into a staged command-window flow.
- [x] Audited normal screens for scattered form controls, hover-only affordances,
  and commands that move after logs/messages update.
- [x] Added Playwright coverage for keyboard/controller traversal.
- [x] Added shared focus control: arrows select, Enter/Space confirms,
  Escape cancels.
- [x] Kept mouse support as convenience, not primary interaction model.
- [x] Done slice: shared focus controller plus guild/dungeon/combat/town/shop/
  config/repeat E2E proof.

Audit:
[../audits/controller-first-normal-play-audit.md](../audits/controller-first-normal-play-audit.md)

### Lane T: Browser Self-Play Gate

Goal: make Codex verify Black Stela as a player in a real browser-like route,
not only through deterministic engine reachability.

- [x] Defined Browser Self-Play as Playwright-driven normal play.
- [x] Added a dedicated `selfplay:browser` command.
- [x] Kept the self-play route honest: no debug progress, hidden state mutation,
  direct rules-engine command injection, or scenario-truth path skipping.
- [x] Recorded failures as player-facing categories.
- [x] Made Browser Self-Play a required completion gate for future
  player-facing claims.
- [x] Done slice: browser self-play script/spec, npm command, artifacts,
  README/Gate notes, and CI-friendly verification.

### Lane U: Town Return Loop and Japanese DRPG Service UX

Goal: make the normal browser route feel like a DRPG loop: prepare in town,
descend, spend resources, return, read the damage and rewards, then choose the
next preparation step.

- [x] Rebuilt post-return town as a town status cockpit.
- [x] Localized normal-play town, guild, shop, recovery, combat, and route labels
  to natural Japanese for Japanese mode.
- [x] Turned shop into equipment/preparation decisions with eligibility,
  stat deltas, price, and remaining gold.
- [x] Turned recovery into attrition management with costs, wounds,
  before/after, and insufficient-funds states.
- [x] Extended Browser Self-Play to fail on return context, English leaks,
  missing shop deltas, or missing recovery plan.
- [x] Done slice: browser self-play screenshots show town return, shop, and
  recovery as one-screen DRPG preparation surfaces.
