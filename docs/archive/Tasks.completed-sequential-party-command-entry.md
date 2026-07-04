# Completed Tasks: Sequential Party Command Entry

## Scope

- BS-167 Combat Reference Alignment
- BS-168 Sequential Actor Cursor
- BS-169 Take Back and Keyboard Flow
- BS-170 Japanese and Mobile Combat Cursor Proof

## Completed Outcome

- Combat command entry now advances through standing party members in formation
  order.
- Formation cards are status displays. They show current and ordered state but
  no longer redirect the next command by arbitrary click selection.
- Attack, Defend, Sleep, and Item apply to the highlighted current adventurer.
- Take Back returns to the previous unresolved actor by removing the latest
  order; Clear Orders returns to the first standing actor.
- Browser tests prove that clicking another party card cannot make that clicked
  character become the sole actor.

## Reference Reading

- Wizardry-style combat uses per-character command entry before round execution.
- Etrian Odyssey-style combat similarly collects each party member's command,
  then resolves the round by action order.
- Black Stela follows the structure, not proprietary content.

## Gate Notes

- Human expectation: combat is party-order command play, not a selected-row web
  UI.
- Red flags covered: clicked party card deciding the actor, hidden actor state,
  one-character-only rounds, command movement after messages, and Japanese/mobile
  command crowding.
- Headless limitation: `npm run headless:reachability` proves combat route
  reachability only, not command-entry UX.

## Verification

- `npm test`
- `npm run build`
- `npm run test:e2e`
- `npm run headless:reachability`
- `git diff --check`
