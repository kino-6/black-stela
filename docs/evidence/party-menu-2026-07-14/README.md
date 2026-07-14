# B3 Party Menu Browser Evidence — 2026-07-14

## Scope

- Shared party menu from town and dungeon exploration.
- Six-person front/back formation and controller-only navigation.
- Status, effective stats, aptitude effects, equipment, inventory, and valuables.
- Agility initiative/evasion and wit spell/status effects.

## Browser Proof

- `party-menu-ja-1280x720.png`: Japanese status page at the minimum desktop Gate.
- The panel remains inside 1280x720 with no document-width overflow.
- D-pad route is explicit: tabs move left/right, Down enters the selected member,
  member left/right changes the cursor, and Cancel closes the modal.
- Town and dungeon entry paths were exercised without mouse clicks.

## Verification

- `npm test`: 66 files, 340 tests passed.
- `npm run build`: passed.
- `npm run test:e2e -- tests/e2e/camp.spec.ts tests/e2e/controller-route.spec.ts tests/e2e/japanese-line-layout.spec.ts --workers=1`:
  13 tests passed.

## Past Trouble Checked

- Controller rule drift: the modal owns the active focus surface and has Confirm/Cancel.
- Generic Web UI drift: one stable JRPG-style command window replaces the old Camp list.
- Party formation flattening: front and back remain two visible rows of three.
- Viewport overflow and debug overlap: checked at 1280x720; modal sits above debug chrome.
- Decorative stats: displayed agility/wit effects come from combat calculation helpers.

## Remaining Risk

The new aptitude coefficients pass current balance Gates, but long-run spell and evasion
feel still needs observation during normal campaign play. This is tuning risk, not a
missing rules connection.
