# IMP-012: Combat Party Identity

Completed and browser-accepted on 2026-07-14.

## Player Problem

Entering combat removed every portrait and level from the fixed six-person
party. The authored adventurers became anonymous name-and-gauge strips at the
moment their identity should matter most.

## Delivered Change

- Kept all six members in fixed formation order with three front and three back.
- Resolved each scenario pack's authored portrait inside the existing party token.
- Kept level, numeric HP, numeric MP, and both gauges visible without enlarging
  the combat strip or moving the command region.
- Preserved formation-order command entry. Portraits are status information,
  not mouse-first actor selectors.

## Proof

The RED browser assertion found zero combat portraits before implementation.
After the change, Default and Verdant each render six portraits with complete
vitals at 1280x720:

- `docs/evidence/improve-012-2026-07-14/combat-party-default-1280.png`
- `docs/evidence/improve-012-2026-07-14/combat-party-verdant-ja-1280.png`
- `test-results/selfplay/05-combat.png` proves the normal title-to-combat route,
  rather than only a debug entry point.

Verification:

- `npm run build`
- `npm test`: 67 files, 344 tests passed
- focused RED/green check: 2 tests passed
- combat, controller, regression, and normal Browser Self-Play: 30 tests passed
- `npm run gate:final`: 101 browser tests passed

## Regression Watch

Past trouble most likely to recur: portraits removed to gain density, party
tokens made clickable for actor selection, or the strip growing until logs and
commands shift. Keep all three covered by browser assertions and 1280x720
screenshots.
