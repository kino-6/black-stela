# Black Stela Tasks

## Completed Archive

Completed task slices and traceability are archived in:

- [docs/archive/Tasks.completed-index.md](docs/archive/Tasks.completed-index.md)
- [docs/archive/Plan.completed-index.md](docs/archive/Plan.completed-index.md)

## Active Milestone: Lane Y — Guild Roster Lifecycle (slices B, C)

Goal: the guild becomes a real home the player curates — edit, retire, and
reclass registered adventurers, and carry them into other scenarios.

- [x] Slice A: roster bench/recall (party + reserve, save migration). Shipped.
- [x] Slice B — Registration lifecycle: Shipped.
  - [x] Reclass (転職): recompute stats from the new class baseline + retained
    aptitude, auto-unequip gear the new class cannot use, keep identity/portrait/
    memory/xp/level.
  - [x] Retire (two-tier): reversible retire → recallable "retired" state with
    records preserved; permanent erasure only behind a deliberate two-step
    confirmation. Save schema gained a retired state.
  - [x] Edit identity: revise name/epithet/record/accent through the member
    detail surface without re-rolling the build.
- [x] Slice C — Cross-scenario adventurers: Shipped.
  - [x] Portable format (identity + build + earned progress; exclude scenario
    equipment ids / dungeon position), versioned + Zod-validated
    (`PortableAdventurer`, `toPortableAdventurer`).
  - [x] Scenario-independent vault (own localStorage boundary
    `black-stela:adventurer-vault:v1`), deposit selected, discard.
  - [x] Import (copy) into a guild's reserve via `import_member`, clamped by the
    world's `importPolicy` (level/gold caps, allowed-class remap, in-world
    progress reset), returning applied adjustments.
- Gate for each: human expectation + red flags explicit, unit tests for the
  domain rule, browser evidence for the surface, Japanese copy passes the line-
  layout/dialogue gates. Retire/reclass confirmations read in-world (guild
  master), the permanent-erasure step is an unmistakable second confirmation.

Recently completed (archived): Lane V, Lane W, Lane Z (dungeon gimmicks), the
combat overhaul ([CombatPlan.md](CombatPlan.md)), dense floor maps + backward
movement + honest rendering ([DungeonPlan.md](DungeonPlan.md)), Lane R refactor
slices 1–4, and Lane Y slice A. Upcoming after Lane Y: Lane X (tempo feedback),
Lane R remainder, dense-floor rollout B2/B4–B8. See [Plan.md](Plan.md).

## Deferred Lanes

- [ ] Lane G: Desktop Productization.
- [ ] Lane H: Hidden Local Narration Operations.

## Gate Definition

Every player-facing task must state the human expectation, red flags, browser
evidence, automated regression test, and what headless does or does not prove.

## Execution Rules

- Keep completed tasks archived, not mixed into active backlog.
- Do not mark headless reachability as proof of player UX.
- Browser Self-Play is the normal-route browser evidence gate; it complements
  Playwright E2E and screenshot review, and does not replace them.
- Do not accept arbitrary room graphs as DRPG dungeon topology.
- Use Grid Labyrinth Skill/Gate for movement, minimap, stairs, return, and
  first-person dungeon rendering work.
- Use DRPG UX Skill/Gate for party formation, command surfaces, and normal-play
  UI review before claiming player-facing work is done.
- Use Black Stela Gate Review Skill and Past Trouble Regression Gate before
  player-facing implementation or completion claims.
- A player-facing change is not done until its human expectation and red flags
  are explicit.
- Prefer unit tests for domain rules and Playwright for visible player flows.
- Keep Japanese checks when UI or prose changes.
- Keep automation conservative around unknown, unsafe, or high-impact actions.
