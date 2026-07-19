# Black Stela Plan

## Completed Archive

Completed plan lanes and task slices are archived in:

- [docs/archive/Plan.completed-index.md](docs/archive/Plan.completed-index.md)
- [docs/archive/Tasks.completed-index.md](docs/archive/Tasks.completed-index.md)

## Current Baseline (2026-07-16)

Black Stela has deterministic rules, save/load, debug starts, headless probes,
English/Japanese UI, scenario validation, tactical combat, guild character
authorship and roster management, economy, first-person rendering, minimap,
party menu, browser Self-Play, and responsive combat staging. All eight floors
(B1F-B8F) are dense continuous-grid mazes with safe stair landings, rewards,
hazards, and authored return routes.

Shipped since `IMP-011`: the **5-slice elemental balance** (per-world cosmology,
gear counterplay, XP falloff, two `world.md` `balance:` knobs — a naive party
wipes, a prepared one clears ~10 levels lower); **Q1 growth items + Q2 the quest
board** (authored data in `content/worlds/<id>/`); **character presence
IMP-018..020** (portable visual identity, in-combat presence lane, GM-aware
framing); and the **combat enemy-stage overlay** (translucent HUD over a
full-frame stage, stage share 36%→71% at 720p). Headless runs are never proof of
UX, fun, fairness, visual legibility, or grid-maze honesty; browser evidence and
human visual review remain required.

## UI Reference Findings

- Wizardry-style play is a town/prep/labyrinth/return/heal loop.
- Etrian Odyssey-style exploration pairs first-person view and readable mapping.
- Classic console RPG input uses fixed command windows, cursor movement,
  confirm/cancel, message advance, and stable command positions.
- Normal play avoids debug copy, oversized cards, duplicate logs, free escape,
  and web-app/admin-panel residue.

## Product Guardrails

- Player-authored characters keep their portraits, profiles, traits, stats,
  classes, notes, and memories. New recruits start with role-appropriate gear.
- Japanese copy and line breaks must read naturally; externalize scenario text
  where practical and reject stray English, orphan characters, and translated
  sentence shapes.
- Normal play hides AI, save/debug, provider, route-id, and admin controls. Local
  narration is non-canonical and cannot mutate `GameState`.
- Controller-first is blocking: stable focus, confirm/cancel, fixed command and
  message regions, six-person formation, and browser proof are required.
- The dungeon is a continuous grid whose minimap, view, movement, doors, stairs,
  returns, traps, and enemies share one truth.
- Combat queues every active member in formation order, keeps vitals visible,
  resolves explicit rounds, and owns victory/result/resume as distinct phases.
- Town, shop, recovery, equipment, Repeat, and Auto must preserve DRPG attrition
  and preparation while showing costs, comparisons, state, speed, and interrupts.
- Apply [Past Trouble Regression Gate](docs/gates/past-trouble-regression-gate.md)
  before completion. Classic DRPGs are structure references, not copy sources.

## Active Lanes

- [x] V/W/Y: Japanese text layout, starting gear/shop previews, and full guild
  roster lifecycle. See the completed Plan/Task indexes above.
- [x] Z + dungeon rollout: B1F-B8F continuous-grid mazes, authored stairs and
  returns, checkpoints, secrets, rewards, hazards, and dungeon gimmicks.
- [x] Combat overhaul + #58 tuning: growth, MP/spells, status/elements, enemy AI,
  bounded balance Gate, full-party command entry, Repeat, and Auto.
- [x] R/X/G/H: separable panel extraction, tempo feedback, save migration seam,
  and hidden local-narration operations. Environment follow-ups remain below.
- [x] `IMP-001` to `IMP-011`: controller/browser UX, Verdant art, combat result
  flow, and responsive enemy framing. See [Improve.md](Improve.md).

## Deferred Lanes

All previously-deferred lanes (G, H) have now had their completable scope shipped
(see Active Lanes). The only remaining items are environment- or refactor-gated, not
deferred by choice:

- **Desktop bundle verification** (Lane G) — needs a desktop toolchain on macOS +
  Windows; steps + ready seams in
  [docs/desktop-productization.md](docs/desktop-productization.md).
- **Guild registration stepper decomposition** (Lane R) — needs a `useReducer`/
  context refactor of the draft state (feature-shaped, not a verbatim move).
- **Live-LLM narration generation** (Lane H) — needs a real local provider endpoint;
  the whole ops layer around it is done and mock-tested.

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

The latest acceptance is green on the production build, **380+ unit tests**, and the
full `gate:final` suite passing **114 Playwright tests** (`main` @ `5fb01a4`, pushed).

**Active milestone: Combat FEEL** — the last pre-balance item. The command-RPG rebuild
and the three-zone / enemy-overlay screen are shipped, so a round reads well and plays on
a controller; what remains is making a round FEEL worth playing (per-round friction, hit
weight, earned outcomes). It is design-first — see `Tasks.md` and
[docs/design/combat-ui-redesign.md](docs/design/combat-ui-redesign.md); align the lever set
with the user before implementing.

### NextAction (recommended order)

1. **Combat FEEL** (active) — align the plan, then ship one browser-verified slice at a time.
2. **Approved capability backlog** ([Improve.md](Improve.md)) in dependency order:
   **IMP-021** (vocation mastery) → **IMP-022** (rare equipment / appraisal / bulk conversion)
   → **IMP-023** (deterministic content & economy simulation Gate). Claude Code owns each
   `*A` data/rules contract and the controller-first player routes; Codex owns content, art,
   and the simulator; a `*A` contract freezes before its content/route work starts.
3. Gated follow-ups (unchanged, none blocked on unknowns): desktop bundle verification, the
   guild-stepper reducer refactor, live-LLM narration.

## Proposed Runtime Migration Lane

The installed engine is Godot `4.7.1.stable`, not Godot 5. Compare a
controller-first Godot/GDScript slice with a non-React Babylon.js/TypeScript
slice before committing to a rewrite. Godot leads on integrated game UI, 2D/3D,
transitions, and assets; Babylon is the lower-cost control because it can retain
the TS rules and Web toolchain. Preserve external packs, save DTOs, simulations,
and TS state traces as the shared oracle. Phaser is conditional on abandoning
the current 3D dungeon; PixiJS, Defold, Unity, Bevy, and Unreal are not primary
candidates for this comparison.

Plan and Go/No-Go criteria:
[Godot Migration and Runtime Comparison Plan](docs/design/godot-migration-plan.md).

## Planning Rule

Before adding new work to `Tasks.md`, write a small milestone goal with outcome,
scope, verification, save/schema impact, Japanese/UI impact, content validation,
headless/browser parity, and human expectation/red-flag impact.
