# Black Stela Plan

## Completed Archive

Completed plan lanes and task slices are archived in:

- [docs/archive/Plan.completed-index.md](docs/archive/Plan.completed-index.md)
- [docs/archive/Tasks.completed-index.md](docs/archive/Tasks.completed-index.md)

## Current Baseline

Black Stela has deterministic rules, save/load, debug starts, headless probes,
English/Japanese UI, scenario validation, tactical combat, guild character
authorship and roster management, economy, first-person rendering, minimap,
party menu, browser Self-Play, and responsive combat staging. All eight floors
(B1F-B8F) are dense continuous-grid mazes with safe stair landings, rewards,
hazards, and authored return routes.

All executable Plan lanes and browser improvements through `IMP-011` are
complete. The only remaining items are the environment- or architecture-gated
follow-ups listed under Deferred Lanes. Headless runs are never proof of UX,
fun, fairness, visual legibility, or grid-maze honesty; browser evidence and
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

**All executable Plan lanes are cleared.** The latest acceptance is green on the
production build, **344 unit tests**, and a **32-test focused Chromium Gate** that
includes the controller route, combat regression/staging, Japanese line layout,
portrait integration, keyboard victory, and Browser Self-Play. The complete
`gate:final` suite also passes **99/99 Playwright tests**.

### NextAction (recommended order)

1. **Player evaluation / playtest.** The product is in a coherent, fully-green state
   to assess; the DebugMode force-win / revive aids and the ×1/×2 auto-runner make a
   full descent quick to walk through.
2. **On evaluation feedback:** re-tune balance (the descentSim Gate band makes it a
   dial), or open one of the three gated follow-ups (desktop bundle verification,
   the guild-stepper reducer refactor, or live-LLM narration) — each is scoped and
   seamed, none is blocked on unknowns.

## Planning Rule

Before adding new work to `Tasks.md`, write a small milestone goal with outcome,
scope, verification, save/schema impact, Japanese/UI impact, content validation,
headless/browser parity, and human expectation/red-flag impact.
