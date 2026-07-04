# Completed Tasks: Party-Round Combat Depth

## Scope

- BS-163 Party Round Order Model
- BS-164 Combat Command Surface
- BS-165 Rule and Tempo Parity
- BS-166 Japanese and Mobile Combat Proof

## Completed Outcome

- Combat now queues visible party orders before resolving a round.
- Attack, Defend, Sleep, Item, Fight, Take back, Clear orders, Retreat, and
  Repeat sit in a stable combat command window.
- The battle order panel shows actor, action, target, and ready count before
  the round executes.
- Keyboard flow queues actions and executes once the party order is ready.
- Auto combat now sends a safe full-party order: front row attacks, back row
  defends, and danger/boss/clear stop conditions remain.

## Gate Notes

- Human expectation: combat feels like party command play, not a one-button
  debug action.
- Red flags covered: Attack no longer advances the round immediately, labels
  avoid "Resolve round", commands do not move after messages, row formation
  remains visible, and Japanese/mobile combat is checked.
- Headless limitation: `npm run headless:reachability` proves the combat route
  is reachable only. Browser E2E and screenshot review remain the UX proof.

## Verification

- `npm test`
- `npm run build`
- `npm run test:e2e`
- `npm run headless:reachability`
- `git diff --check`
