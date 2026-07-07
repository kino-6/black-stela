# Black Stela Plan

## Completed Archive

Completed plan lanes and task slices are archived in:

- [docs/archive/Plan.completed-index.md](docs/archive/Plan.completed-index.md)
- [docs/archive/Tasks.completed-index.md](docs/archive/Tasks.completed-index.md)

## Current Baseline

Black Stela has deterministic rules, save/load, debug starts, headless probes,
English/Japanese UI, scenario validation, authored multi-floor data, tactical
combat, guild character authorship, economy, first-person rendering, minimap,
and browser-visible route coverage.

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
- Japanese line layout is part of prose quality. Avoid one-character orphan
  wraps, punctuation stranded at line starts, and awkward message-box breaks;
  rewrite copy or provide display-specific variants when needed.
- Player-facing dialogue, service copy, room text, item text, and guidance
  should live in scenario/localization data where practical, not hardcoded in
  React components.
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
- Newly registered or suggested adventurers must start with class-appropriate
  minimum gear. A fighter, healer, scout, or caster may be poorly equipped, but
  they should not enter the labyrinth with empty hands and no basic protection
  unless the scenario intentionally marks them as such.
- Shops must sell through clear categories such as weapons, armor, shields,
  accessories, tools, and consumables. Before purchase, the UI must warn when
  the selected adventurer cannot equip the item; when they can, it must compare
  the item against the currently equipped slot before money is spent.
- Combat must resolve as party tactics, not one debug-like button press. Normal
  play queues visible actor commands, shows target/risk/order, then resolves a
  bounded round without moving the command window.
- Combat command entry follows classic party RPG structure: the next unresolved
  adventurer receives a command in party order; formation cards are status, not
  arbitrary actor selectors.
- The town loop must feel like returning, recovering, buying, and preparing for
  another descent, not falling back into guild-registration or web-form context.
- Repeat and auto actions must feel intentional and fast. When repeat or auto
  is running, the UI must show the active mode, current repeated command, speed,
  and stop/cancel affordance; unexplained waits are a UX bug.
- Stairs, return seals, and next-floor progression must be browser-visible.
- Past user-visible failures are recorded in
  [Past Trouble Regression Gate](docs/gates/past-trouble-regression-gate.md)
  and must be checked before player-facing work is called done.
- Classic DRPGs are structure references only. Do not copy proprietary content.

## Active Lanes

- [x] Lane V: Scenario Text Externalization and Japanese Line Layout.
  Archived: [docs/archive/Tasks.completed-text-externalization-line-layout.md](docs/archive/Tasks.completed-text-externalization-line-layout.md).
- [x] Lane W: Starting Gear, Categorized Shop, and Pre-Purchase Preview.
  Archived: [docs/archive/Tasks.completed-starting-gear-categorized-shop.md](docs/archive/Tasks.completed-starting-gear-categorized-shop.md).
- [x] Lane Z: Dungeon Structure, Checkpoints, and Wiz/Etrian Gimmicks.
  Shipped: rest points, checkpoint resume, emergency return item, shortcuts, and
  the spinner/teleporter/damage/darkness/gather/hidden-passage gimmicks. Deferred
  gimmicks: pit/chute, FOE roamers.
  Archived: [docs/archive/Plan.completed-dungeon-gimmicks.md](docs/archive/Plan.completed-dungeon-gimmicks.md).
- [x] Combat Overhaul (see [CombatPlan.md](CombatPlan.md)): level growth, MP +
  class spells, status ailments, elements/weakness, criticals, enemy AI. Balance
  numbers first-pass.
- [x] Dense floor maps + backward movement + honest first-person rendering (see
  [DungeonPlan.md](DungeonPlan.md)). Floors converted so far: B1F, B3F. **Pending:
  B2F, B4F–B8F.**
- [~] Lane R: Source Decomposition and Refactoring — first four slices shipped;
  remainder (hooks / JSX split / DungeonView scene) deferred to a follow-up.
- [ ] Lane X: Repeat and Auto Action Tempo Feedback.
- [~] **Lane Y (IN PROGRESS): Guild Roster Management, Registration Lifecycle, and
  Cross-Scenario Adventurers.** Slice A (roster bench/recall) shipped; slices B
  (edit / retire / reclass) and C (cross-scenario vault) next.

### [ ] Lane X: Repeat and Auto Action Tempo Feedback

Goal: make repeat and auto actions feel like deliberate DRPG convenience
features, not a stalled UI or hidden debug timer.

Planned slice:

- [ ] Audit current repeat and auto execution timing to identify artificial
  waits, animation delays, command throttles, or state-update pauses.
- [ ] Add an on-screen active-mode indicator for repeat/auto: mode name,
  repeated command, current step, and whether the next action is pending.
- [ ] Provide a controller-friendly stop/cancel action that is visible while
  repeat/auto is running and works immediately.
- [ ] Add speed tiers or a fast-forward setting for repeat/auto, with a safe
  default and a clearly visible current speed.
- [ ] Ensure repeat/auto never hides important interrupts: combat, blocked
  movement, traps, stairs, treasure, low HP, new floor, return marker, or
  dialogue/event stops.
- [ ] Add Browser Self-Play or targeted Playwright evidence that repeat/auto
  starts, displays active state, speeds up, stops on command, and stops on
  meaningful interrupts.

### [ ] Lane Y: Guild Roster Management, Registration Lifecycle, and Cross-Scenario Adventurers

Goal: make the guild feel like a home for the adventurers the player authors.
Today `GameState.party` *is* the whole roster: there is no reserve, no way to
remove someone once registered, no way to edit or retrain an existing
adventurer, and no way to bring an adventurer into another scenario. The player
can only build a fresh six and descend. This lane gives the guild a real roster
the player curates over time, a full registration lifecycle, and portable
adventurers.

Current baseline (grounded, do not re-discover):

- `GameState.party: Character[]` is the only roster; save schema v1 persists
  `party`, `partyGold`, and `scenario.worldId` — there is no reserve/vault store.
- `Character` mixes portable identity (`name`, `title`, `notes`, `classId`,
  `backgroundId`, `aptitude`, `traitIds`, `accentColor`, `portraitRef`,
  `creation`, `memory`) with scenario-coupled state (`startingEquipment` and
  `equipment` reference scenario catalog ids; `xp`, `gold`, derived combat stats,
  `hp`, `injury`).
- There is no reclass path anywhere in `src/`.

Planned slice A — Roster and party membership:

- [ ] Introduce a guild roster larger than the active party: registered
  adventurers live in the guild; the party is up to six chosen from it, with
  front/back rows still visible.
- [ ] Add controller-first add-to-party / remove-from-party (bench) actions at
  the guild/town, before descent, without deleting the adventurer.
- [ ] Keep the six-person, front/back-row formation contract; benched
  adventurers are visibly "in the guild, not in the party," not lost.
- [ ] Guard membership edits to safe contexts (town/guild, not mid-dungeon), and
  keep the party non-empty before "enter dungeon" is offered.

Planned slice B — Registration lifecycle (add, edit, retire, reclass):

- [ ] Add: keep the existing staged registration, but register into the guild
  roster rather than straight into a fixed party.
- [ ] Edit: let the player revise an existing adventurer's identity (name,
  epithet, record, portrait, accent) through the same staged, in-world surface,
  without re-rolling their build.
- [ ] Retire (the "delete" the player asked for), two tiers (decided):
  - Tier 1 — Retire: the safe default. A reversible, in-world dismissal that
    moves the adventurer to a retired state, recallable to the guild later, with
    canonical records preserved.
  - Tier 2 — Permanent erasure: available only behind a deliberate two-step
    confirmation, fully and irreversibly removes the adventurer. This is the
    explicit, guarded opt-in the player asked for; the reversible default plus
    the double confirmation is how we honor "no *silent* irreversible deletion,"
    not a raw one-click delete.
- [ ] Reclass (転職): change an adventurer's class at the guild. Recompute stats
  from the new class baseline plus retained aptitude/origin, auto-unequip gear
  the new class cannot use, and keep identity, portrait, and roster memory.
- [ ] Do not turn any of these into an admin table or bulk form; each is a
  staged, focused, confirm/cancel choice with stable command/message areas.

Planned slice C — Cross-scenario adventurers (copy/migrate):

- [ ] Define a portable adventurer format: identity + build (class, origin,
  aptitude, traits, accent, portrait, creation history) + earned progress
  (xp/level, gold, roster memory). Scenario-bound bindings — equipment catalog
  ids and in-dungeon position/floor state — are deliberately excluded; carried
  progress is re-fit and clamped by the target world on import (see below).
- [ ] Export selected guild adventurers to a scenario-independent vault stored
  outside a single world save.
- [ ] Import (copy, not move) a vaulted adventurer into another scenario's
  guild carrying earned progress (decided): xp/level, gold, and roster memory
  travel with the adventurer, but the *target* scenario constrains them. The
  imported build is validated and clamped against the target world's declared
  import rules, then re-fit with class-appropriate starting gear from that
  world's catalog.
- [ ] Add optional per-scenario import constraints to scenario data (e.g. level
  cap / clamp, gold cap, allowed classes, starting-floor limit) so each world
  decides how much carried progress it accepts; validate them like other
  scenario truth (Zod) and surface a clear message when an import is clamped or
  rejected.
- [ ] Keep AI policy intact: import is player-driven data, never AI-authored, and
  never mutates scenario truth.

Save/schema impact:

- New save schema version (v2): add the guild roster/reserve plus a retired
  state alongside `party`, with a v1→v2 migration that seeds the roster from the
  existing party. Retire moves an adventurer to the retired state; permanent
  erasure removes them from the roster (and vault) entirely.
- New scenario-independent adventurer vault (its own localStorage/Tauri boundary,
  keyed off adventurer identity, not `worldId`), plus a versioned portable-
  character schema — carrying identity, build, and earned progress — validated on
  import with Zod, like scenario packs.
- Extend scenario schema with optional import constraints (level cap/clamp, gold
  cap, allowed classes, starting-floor limit) applied when a vaulted adventurer
  is imported into that world.

Japanese/UI impact:

- All new surfaces are controller-first, staged, and localized EN/JA. New copy
  (bench, retire confirmation, reclass preview, export/import) goes through the
  localization dictionary and must pass the
  [Japanese Line-Layout Gate](docs/gates/japanese-line-layout-gate.md) and the
  [Japanese Dialogue Gate](docs/gates/japanese-dialogue-gate.md).
- Retire/reclass confirmations read as a guild master in-world, not as UI
  instructions or a designer talking to the player. The permanent-erasure step
  is a distinct, unmistakable second confirmation whose Japanese and English copy
  makes the irreversibility obvious without lapsing into UI-speak.

Verification (headless/browser parity):

- Unit tests for roster membership, reclass stat recomputation, retire
  record-preservation, v1→v2 save migration, and portable-character export/import
  validation.
- Unit + browser tests for the two-tier retire: reversible retire keeps records
  and can recall; permanent erasure only fires after the two-step confirmation
  and truly removes the adventurer.
- Unit tests for import clamping against target-scenario constraints (level cap,
  gold cap, disallowed class), so carried progress is bounded correctly.
- Browser Self-Play / Playwright evidence for add/remove, edit, retire (with
  confirm), permanent erasure (double confirm), reclass preview, and a
  same-adventurer copy into a second scenario that clamps carried progress —
  headless proves none of the UX.

Human expectation and red flags:

- Expectation: the player curates a lasting roster, fixes and retrains the
  adventurers they made, and carries a favorite into a new scenario.
- Red flags: an admin/table roster editor; a one-click destructive delete, or a
  permanent erasure reachable without the deliberate two-step confirmation;
  reclass that silently wrecks a build with no preview; membership edits allowed
  mid-dungeon; a portable character that smuggles another world's equipment ids;
  an import that ignores the target scenario's caps and lets carried progress
  break the world's balance; roster "grading"/coverage lectures creeping back in.

Resolved decisions:

- Retire is two-tier: a reversible, recallable retire by default, plus a
  permanent, complete erasure behind a deliberate two-step confirmation.
- Cross-scenario import carries earned progress (xp/level, gold, roster memory),
  but the target scenario constrains it via declared import rules; carried
  progress is clamped/validated against the destination world, not accepted raw.

Open questions to resolve before opening tasks (BS-198+):

- Reserve model: is the guild roster hard-capped, and do benched/retired
  adventurers heal or persist wounds while out of the party?
- Reclass cost/consequence: free at the guild, or gated by gold/XP; and whether
  reclass resets level/XP or preserves it.

### [ ] Lane R: Source Decomposition and Refactoring

Goal: cut the largest files down to focused modules without changing behaviour,
so the codebase stays workable as the dungeon/roster features grow. This is a
structural clean-up lane — **no functional changes** — and the existing suite
(125 unit + 52 e2e) is the safety net: every slice must keep it green.

Measured hot spots (lines, at time of writing):

- `src/App.tsx` — **2624**. A God component: UI state, ~40 handlers, guild/draft
  flow, save/load, keyboard controller, per-phase JSX render, *and* domain rules
  (`runTempoDungeonStep`/`runTempoCombatStep`) that do not belong in the view.
- `src/domain/rulesEngine.ts` — 1408. Cohesive but broad (movement, combat,
  town/economy, gates/gimmicks) in one file.
- `src/domain/characterCreation.ts` — 585; `src/services/scenarioPackLoader.ts`
  — 568; `src/components/DungeonView.tsx` — 488 (React component + Three.js
  scene builder in one).

Progress: the first four (low-risk, pure-function) slices below shipped to main
(App.tsx 2624 → 2274; new modules `src/domain/tempo.ts`, `src/ui/controllerFocus.ts`,
`src/ui/format.ts`, `src/ui/catalog.ts`; +5 tempo unit tests). The remaining
slices are state-coupled / higher-risk and are deferred to a follow-up branch.

Planned slices (ordered by value/risk; one extraction per commit, suite green
after each):

- [x] Extract the tempo/auto-move **rules** out of `App.tsx` into
  `src/domain/tempo.ts` (`runTempoStep`, `runTempoCombatStep`,
  `runTempoDungeonStep`, `getTempoModeForPhase`). These are pure game rules;
  move them to the domain and add unit tests (they currently have none).
- [x] Extract the **keyboard controller / focus** helpers (`getActiveController*`,
  `moveControllerFocus`, `activateControllerCancel`, `isTypingTarget`, …) into
  `src/ui/controllerFocus.ts`.
- [x] Extract **presentation helpers** (`formatPhase`, `formatStatDelta`,
  `formatEquipmentEffect`, …) into `src/ui/format.ts`, and catalog lookups
  (`localizedCatalogName`, `equippedName`, `previewEquipmentStats`,
  `shopCategoryFor`, `ShopCategory`, …) into `src/ui/catalog.ts`.
- [ ] Lift the **character-draft / guild** state and handlers (`createFreshDraft`,
  bonus-pool rolls, identity/origin rerolls, suggestion logic) into a
  `useCharacterDraft` hook (or `src/ui/guild/`).
- [ ] Lift **save/load/import** (`saveGame`, `loadGame`, `importScenarioPackFiles`,
  `createBrowserSaveRepository`) into a `useSaveLoad` hook / module.
- [ ] Split the giant **per-phase JSX render** into panel components (Town,
  Guild, Combat, Dungeon) alongside the existing `MapPanel`/`DungeonView`, so
  `App.tsx` becomes an orchestrator.
- [ ] Split `DungeonView.tsx`: move the Three.js scene construction into a
  `dungeonScene.ts` builder, leaving the React component thin.
- [ ] Consider grouping `rulesEngine.ts` by concern (movement / combat /
  town-economy / gates-gimmicks) behind the same public API, only if it does not
  fragment tightly-coupled logic.

Guardrails: behaviour-preserving only; no API/UX changes in this lane; prefer
moving code verbatim then re-wiring imports; run `tsc`, unit, and e2e after each
slice; do not mix a refactor with a feature change in the same commit.

## Deferred Lanes

- [ ] Lane G: Desktop Productization.
- [ ] Lane H: Hidden Local Narration Operations.

## Standing Guardrails

- Use [Grid Labyrinth Skill](docs/skills/grid-labyrinth-skill.md) for movement,
  minimap, stairs, return, and first-person render changes.
- Use [DRPG UX Review Skill](docs/skills/drpg-ux-review-skill.md) before UI,
  party, combat, town, dungeon, command, or automation changes.
- Use [Scenario Prose Skill](docs/skills/scenario-prose-skill.md) before prose
  and localization changes.
- Use [Japanese Line-Layout Gate](docs/gates/japanese-line-layout-gate.md) when
  Japanese message-box copy, width, or font changes.
- Use [Black Stela Gate Review Skill](docs/skills/black-stela-gate-review-skill.md)
  before any player-facing implementation or completion claim.
- Keep command windows stable, party rows visible, and Japanese/mobile checks
  active for any changed player-facing surface.

## Current Milestone Recommendation

Lane V and Lane W are complete. Lane V moved event/combat/town log text into the
localization dictionary and added a browser-enforced Japanese line-layout gate.
Lane W equips class-appropriate starting gear at registration, splits the shop
into controller-first categories, and shows starting gear during registration and
suggested-recruit confirmation (equip eligibility and current-equipment comparison
already existed). Lane X and Lane Y are the next open planning slices: Lane X makes
repeat/auto visible, faster, cancellable, and interruption-safe; Lane Y gives the
guild a real roster (add/remove/edit/retire/reclass) and portable cross-scenario
adventurers. Lane G and Lane H remain deferred until explicitly re-scoped.

## Planning Rule

Before adding new work to `Tasks.md`, write a small milestone goal with outcome,
scope, verification, save/schema impact, Japanese/UI impact, content validation,
headless/browser parity, and human expectation/red-flag impact.
