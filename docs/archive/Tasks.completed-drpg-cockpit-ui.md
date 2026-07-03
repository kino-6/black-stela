# Completed Tasks: DRPG Cockpit UI

Completed: 2026-07-03

## Scope

Lane A cockpit UI pass rebuilt normal dungeon/combat screens so the player sees
a DRPG play surface rather than a web admin layout.

## Completed Items

- [x] BS-098: Document UI reference findings from Wizardry/Etrian Odyssey.
  - Wizardry reference: town party creation, preparation, labyrinth entry,
    return, healing, and front/back row party management.
  - Etrian Odyssey reference: first-person exploration and mapping are paired
    play responsibilities.
- [x] BS-099: Rebuild exploration as a cockpit.
  - First-person view, compact adjacent map, party condition strip, room text,
    and command dock are visible without the guild sidebar.
- [x] BS-100: Rebuild combat as a tactical battle board.
  - Enemy group, front/back party rows, selected actor/target, and direct
    action commands are visible in a compact board.
- [x] BS-101: Remove duplicate/non-diegetic play messages from normal screens.
  - Combat entry now relies on the battle board/enemy group rather than repeated
    "blocks the way" prose.
- [x] BS-102: Verify Japanese and responsive layout.
  - Japanese/mobile E2E checks pass; screenshot review states are regenerated.
- [x] BS-103: Keep headless/browser parity honest.
  - Headless reachability remains separate from browser-visible UX proof.

## Verification

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] `npm run headless:reachability`
- [x] `git diff --check`

## Notes

- `npx playwright test ...` direct execution hit local server permission limits
  in this sandbox. The equivalent `npm run test:e2e -- ...` path passed.
