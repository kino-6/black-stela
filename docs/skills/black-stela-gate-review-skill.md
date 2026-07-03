# Black Stela Gate Review Skill

Use this skill before player-facing Black Stela work: UI, dungeon, combat,
character creation, prose, assets, automation, save/debug, scenario data,
headless claims, or any "done" review.

## Goal

Prevent repeated user-visible failures by routing each task through the
project's gates before implementation and before completion.

## Gate Routing

Always read:

- `docs/gates/past-trouble-regression-gate.md`
- `docs/gates/human-requirement-gate.md`
- `docs/gates/player-facing-red-flags.md`

Then read any matching domain gate:

- UI, party, combat, commands, town, automation:
  `docs/gates/drpg-ux-gate.md`
- Dungeon topology, movement, minimap, stairs, return, first-person render:
  `docs/gates/grid-labyrinth-gate.md`
- Japanese/prose/localization:
  `docs/gates/scenario-prose-gate.md`
- Screenshot/layout work:
  `docs/gates/screenshot-review.md`

## Workflow

1. Name the human expectation and the past trouble most likely to recur.
2. Identify which normal-play screen or route must prove the change.
3. Implement the smallest slice that fixes the player-visible problem.
4. Verify with browser evidence for that state; headless is never UX proof.
5. Review desktop/mobile and Japanese layout when touched.
6. Finish with the completion note from the Past Trouble Regression Gate.

## Immediate Stop Conditions

- The change would expose debug/admin/provider/config controls in normal play.
- The feature works only because headless or scenario truth knows something the
  player cannot see.
- A command, stair, return, enemy, door, trap, or reward exists only in text.
- UI command positions move after logs/messages update.
- A dungeon change preserves arbitrary room graphs instead of grid cells.
- The browser has not been checked for the changed player-facing state.
