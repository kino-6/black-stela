# IMP-017: Battle Aftermath

Completed 2026-07-14.

## Problem

Victory, rewards, and level-ups appeared in a small centered card over a blurred
backdrop. The composition read as a browser completion dialog rather than the
end of a DRPG battle.

## Result

- Replaced the floating result card with a full-width aftermath surface docked
  to the lower edge of the play field.
- Kept the dungeon scene visible above the result so victory returns to
  exploration without a visually disconnected popup.
- Separated battle spoils from character growth without moving the confirmation
  command.
- Added portraits and stable member rows for every adventurer who levels up.
- Preserved controller ownership and initial focus on the single confirmation
  command.
- Reworded the Japanese confirmation as `探索へ戻る` and removed the unnatural
  space before `を倒した`.
- Added `characterId` to newly recorded level-up results while keeping it
  optional when older saves are parsed.

## Evidence

- `docs/evidence/improve-017-2026-07-14/combat-aftermath-1280.png`
- `docs/evidence/improve-017-2026-07-14/level-growth-ja-1280.png`
- `docs/evidence/improve-017-2026-07-14/level-growth-ja-1920.png`
- `tests/e2e/keyboard-combat.spec.ts` rejects the old centered card, checks the
  docked width and lower edge, verifies controller focus, and exercises Japanese
  multi-member level growth.

## Verification

- `npm test`: 68 files / 346 tests passed.
- Focused combat Playwright suite: 15 tests passed.
- `npm run selfplay:browser`: normal visible route passed.
- `npm run build`: passed.
- `npm run gate:final`: completed green with the new result checks included.
- `git diff --check`: passed.

Past trouble checked: generic web UI, unstable command placement, Japanese line
quality, and browser claims based only on headless state. Headless can verify
reward data but cannot accept this presentation.
