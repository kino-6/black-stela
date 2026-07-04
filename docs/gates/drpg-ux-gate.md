# DRPG UX Gate

This gate blocks player-facing work that is technically functional but visibly
weak, non-DRPG, or unreviewed in the browser.

## Blocking Checks

- [ ] The task states the player expectation it satisfies.
- [ ] The screen is reviewed against DRPG structure: first-person view, grid
  map, party formation, fixed command window, short message window, and town
  services.
- [ ] Six-member party assumptions are preserved unless a task explicitly
  changes party size.
- [ ] Party status is not a flat row/list when row tactics matter.
- [ ] Front row and back row are visible in both exploration and combat.
- [ ] Combat command entry advances through standing party members in formation
  order; clicking a party card cannot make that one character the next or only
  actor.
- [ ] Formation cards communicate current/ordered/status state and are not a
  mouse-first actor picker unless the task explicitly implements target choice.
- [ ] Commands do not move when logs/messages update.
- [ ] Controller/keyboard operation is primary: directional focus order,
  confirm/cancel semantics, and fixed command/message areas are visible.
- [ ] Mouse-only, hover-only, free-cursor, or scattered form-style interaction
  is absent from normal play unless the task is text entry, portrait import, or
  debug tooling.
- [ ] Debug, AI, save/load, and automation controls stay out of normal play.
- [ ] Browser verification covers the changed state, not only headless or unit
  tests.
- [ ] Mobile and Japanese layouts are checked when UI text or structure changes.

## Required Evidence

- [ ] Playwright DOM assertions for the exact player-visible state.
- [ ] Screenshot or visual review note for desktop when layout changes.
- [ ] Mobile viewport check for no horizontal overflow or overlap.
- [ ] Keyboard/controller-style operation for command surfaces.
- [ ] Focus traversal proof for any changed guild, town, combat, dungeon, shop,
  records, recovery, or configuration surface.
- [ ] Self-review note naming at least one remaining UX risk.

## Immediate Failures

- "Works" means only state changed or tests passed.
- The user must discover obvious visual hierarchy or layout defects manually.
- UI resembles an admin dashboard instead of a DRPG screen.
- Guild/town/combat/dungeon UI requires mouse precision or scattered form
  hunting for normal commands.
- Rows, maps, doors, stairs, enemies, or rewards exist only as logs.
- Combat lets arbitrary mouse selection override party-command order.
- Japanese mode shows stray English enemy names, units, shop text, or combat
  labels that are not natural RPG abbreviations.
