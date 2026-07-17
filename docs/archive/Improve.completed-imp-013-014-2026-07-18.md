# IMP-013 / IMP-014 Completion Record

Archived on 2026-07-18 after replaying the normal browser route at 1280x720.
The implementation originally landed in `9d0bf31` on 2026-07-14.

## IMP-013: Separate Party Completion From Roster Administration

- [x] The 6/6 screen shows the completed three-front / three-back formation.
- [x] Departure and roster management are separate commands.
- [x] Bench, retire, vault, and character administration no longer leak into
  the party-completion frame.
- [x] Roster administration remains reachable and closes with Cancel.
- [x] The completion and roster screens fit the 1280x720 controller Gate.

## IMP-014: Recompose Recovery As A Town Command Window

- [x] Recovery lists only adventurers who need treatment.
- [x] Each row shows HP before/after and individual cost.
- [x] Total cost, affordability, confirm, and cancel remain visible together.
- [x] A healthy party receives one concise state instead of six empty cards.
- [x] The service is a compact in-world counter and fits at 1280x720.

## Evidence

- `tests/e2e/town-services.spec.ts`
- `test-results/selfplay/03-guild-party-ready.png`
- `test-results/selfplay/11-recovery.png`
- 2026-07-18 browser self-play:
  title -> guild -> B1F combat -> B2F -> return -> recovery
- 2026-07-18 controller regression: 25/25 passed across controller route,
  combat stage, camp, career, appraiser, and quest board.

Past trouble checked: roster administration leaking below the 6/6 frame;
recovery presented as a large web form; missing treatment cost; commands below
the 720p frame.
