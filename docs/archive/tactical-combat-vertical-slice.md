# Tactical Combat Vertical Slice

## Fun Problem

Current combat is a passage toll: the party presses one attack command and the
enemy disappears. A DRPG battle should make the player read formation, choose
targets, accept imperfect odds, spend resources, and decide whether the next
room is still worth it.

## Structural References

Wizardry and other classic party DRPGs are references for structure only:

- Party rows make roster order meaningful.
- Rounds are declared and then resolved.
- Hits, misses, armor, speed, and damage ranges create uncertainty.
- Enemy groups make target choice matter.
- Status and attrition pressure the return decision.
- Victory pays out XP, gold, and loot hooks.
- Retreat is a tactical out, not a free undo.

Do not copy names, monsters, maps, formulas, prose, or progression.

## First Slice

The first tactical slice must support one visible battle from dungeon play:

- Party members have a row, speed, accuracy, armor, damage range, XP, and gold.
- Enemies enter as one or more groups with count, HP per member, armor, speed,
  accuracy, damage range, morale, XP, and gold.
- The player selects an actor, action, and target, then resolves a round.
- Existing shortcut commands still work as compatibility wrappers, but the
  browser proof must use visible actor/target/round controls.
- The battle screen shows party rows, enemy groups, selected actor, target,
  danger, round results, and rewards.

## Non-Goals

- No full class system yet.
- No random encounter scheduler yet.
- No permanent death until the failure/recovery model is deliberately designed.
- No AI choosing player actions.
- No copied Wizardry content.

## Red Flags

- A single player-facing Attack button clears combat without target or round
  context.
- Enemy identity is only log text.
- Back-row/front-row rules are invisible.
- Headless clear is used as proof that combat is fun.
- Japanese combat labels overflow mobile.

## Verification

- Unit tests for row targeting, illegal targets, deterministic round results,
  rewards, and save parsing.
- Playwright test for a visible actor/target/round flow.
- Headless probes remain reachability/balance signals only.
