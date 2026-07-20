# Completed Plan Archive Index

Archived: 2026-07-05 (last updated 2026-07-10)

Active plan: [../../Plan.md](../../Plan.md)

## Completed Plan And Task Slices

- [x] Lane Y guild roster / registration lifecycle / cross-scenario adventurers:
  [Plan.completed-guild-roster-lifecycle.md](Plan.completed-guild-roster-lifecycle.md)
- [x] Difficulty pressure, full B1–B8 maze rollout, playability & App decomposition:
  [Plan.completed-difficulty-maze-decomposition.md](Plan.completed-difficulty-maze-decomposition.md)

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
- [x] Lane W starting gear / categorized shop plan detail:
  [Plan.completed-starting-gear-shop.md](Plan.completed-starting-gear-shop.md)
- [x] Lane Z dungeon structure / checkpoints / gimmicks plan detail:
  [Plan.completed-dungeon-gimmicks.md](Plan.completed-dungeon-gimmicks.md)
- [x] Combat overhaul (growth / MP magic / status / elements / crits / enemy AI):
  [../../CombatPlan.md](../../CombatPlan.md)
- [x] Dense floor maps + first-person rendering + backward movement:
  [../../DungeonPlan.md](../../DungeonPlan.md)

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
- [x] Lane Y: Guild Roster Management, Registration Lifecycle, Cross-Scenario Adventurers.
- [x] Difficulty Pressure, Full B1–B8 Maze Rollout, Playability & App Decomposition.

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

## 2026-07-20 — React-era plans and superseded migration documents

Archived when `Plan.md` became the single "where are we" surface. Nothing here is live; each is kept
because it records a decision or a shipped lane.

| File | Was | Why archived |
| --- | --- | --- |
| `Tasks.react-era-combat-feel.md` | root `Tasks.md` | Its active milestone ("Combat FEEL") is React-era; the current state lives in `Plan.md`. |
| `CombatPlan.react-era.md` / `DungeonPlan.react-era.md` | root | Design intent for the React build; shipped. |
| `DevLoop.react-browser-playtest.md` | root `DevLoop.md` | A browser playtest loop for the React runtime, which is no longer the game. |
| `Pointing.react-era.md` | root `Pointing.md` | The user's numbered React findings; all resolved except an unreproducible warp-zone map registration, carried into `Plan.md` if it recurs. |
| `combat-command-ui-plan.react-era.md` | `docs/` | Superseded by the shipped three-zone combat screen. |
| `combat-ui-redesign.react-era.md` / `combat-stage-plan.react-era.md` | `docs/design/` | The React combat redesign; delivered, and re-derived in Godot by the UX-parity gate. |
| `migration-execution-plan.s1-s5-spike.md` | `docs/design/` | The S1–S5 spike plan, explicitly superseded by `godot-full-migration-plan.md`. |
| `godot-migration-plan.runtime-comparison.md` | `docs/design/` | The Godot-vs-Babylon comparison; the question is decided (ADR 0001). |
| `godot-go-no-go.decided.md` | `docs/design/` | The Go/No-Go gate evaluation; verdict GO, recorded in ADR 0001. |
| `branch-close-plan.md`, `tactical-combat-vertical-slice.md` | `docs/design/` | Completed one-off plans with no remaining references. |
