# Browser Self-Play Gate

Browser Self-Play is the normal-route evidence gate for player-facing Black
Stela work. It complements Playwright E2E and screenshot review. It does not
replace unit tests, scenario validation, or headless reachability probes.

## Definition

Browser Self-Play means Playwright drives the game like a player through visible
normal controls from the title screen. The route must not use debug progress,
direct `GameState` mutation, hidden command dispatch, scenario-truth shortcuts,
or direct rules-engine calls.

## Blocking Checks

- [ ] The route starts at the title screen.
- [ ] The route creates or accepts a party through visible guild controls.
- [ ] The route enters the dungeon through normal entry controls.
- [ ] Combat is resolved through visible combat commands.
- [ ] Movement, stairs, return markers, shop, and recovery are visible before
  use.
- [ ] Screenshots are captured for title, guild, dungeon, combat, stair/return,
  post-return town, and town service states.
- [ ] Japanese service states are checked when normal-route labels, shop,
  recovery, rewards, or compact town UI change.
- [ ] A JSON or Markdown report records steps, screenshots, final state, and
  failure category.
- [ ] Normal play exposes no debug/admin/provider/save-slot controls.
- [ ] Headless output is described as reachability-only.

## Failure Categories

- `blocked_control`: the player cannot reach or activate a needed command.
- `visual_mismatch`: the screen suggests a different state than the rules allow.
- `localization_leak`: player-facing text leaks wrong language or technical copy.
- `layout_overflow`: core play requires unintended scrolling or overlaps.
- `command_shift`: messages/logs move command surfaces during play.
- `impossible_route`: visible normal controls cannot reach the expected route.
- `hidden_affordance`: a required enemy, stair, return, reward, or command is not
  visible before use.
- `controller_input`: a screen cannot be played with directional keys, Confirm and
  Cancel — no initial focus cursor, focus dropped to `BODY` after a transition, or the
  command painted as selected is not the one that is focused. Mouse still works, so a
  click-driven route stays green: this category exists because the 2026-07-13 playtest
  found the game unplayable on a controller while every automated check passed.

## Command

```sh
npm run selfplay:browser
```

Artifacts are written to `test-results/selfplay/`, which is ignored by git.
