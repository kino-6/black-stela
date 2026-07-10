# Completed: Lane Y — Guild Roster Management, Registration Lifecycle, Cross-Scenario Adventurers

Archived: 2026-07-10

Active plan: [../../Plan.md](../../Plan.md) · Index:
[Plan.completed-index.md](Plan.completed-index.md)

Goal (shipped): make the guild a home the player curates over time — a roster
larger than the party, a full registration lifecycle, and portable adventurers
carried between scenarios. Before this lane `GameState.party` *was* the whole
roster: no reserve, no removal, no edit/retrain, no cross-scenario carry.

## Slice A — Roster and party membership (shipped)

- [x] Guild roster larger than the active party; party is up to six chosen from it,
  front/back rows still visible.
- [x] Controller-first bench/recall at the guild/town (before descent, not
  mid-dungeon); party kept non-empty before "enter dungeon".
- [x] Save migration seeds the roster from the existing party.

## Slice B — Registration lifecycle (shipped)

- [x] Reclass (転職): recompute stats from the new class baseline + retained
  aptitude, auto-unequip gear the new class cannot use, keep identity / portrait /
  memory / xp / level.
- [x] Retire (two-tier): reversible retire → recallable "retired" state with
  records preserved; permanent erasure only behind a deliberate two-step
  confirmation. Save schema gained a retired state.
- [x] Edit identity: revise name/epithet/record/accent through the member detail
  surface without re-rolling the build.

## Slice C — Cross-scenario adventurers (shipped)

- [x] Portable format (`PortableAdventurer`, `toPortableAdventurer`): identity +
  build + earned progress; excludes scenario equipment ids / dungeon position;
  versioned + Zod-validated.
- [x] Scenario-independent vault (`black-stela:adventurer-vault:v1`): deposit
  selected, discard.
- [x] Import (copy) into a guild's reserve via `import_member`, clamped by the
  world's `importPolicy` (level/gold caps, allowed-class remap, in-world progress
  reset), returning applied adjustments.

Gate for each: human expectation + red flags explicit, unit tests for the domain
rule, browser evidence for the surface, Japanese copy passing the line-layout /
dialogue gates. Retire/reclass confirmations read in-world (guild master); the
permanent-erasure step is an unmistakable second confirmation.

Resolved decisions: retire is two-tier (reversible default + guarded permanent
erasure); cross-scenario import carries earned progress but the target scenario
clamps it via declared import rules.
