# Black Stela Active Improvement Backlog

Last browser acceptance: 2026-07-14, Chromium, 1280x720 and 1920x1080.

## Active Status

`IMP-001` through `IMP-012` are archived. The 2026-07-14 browser replay left
two independently reproducible presentation items:

| Item | Priority | State | Player-visible problem |
| --- | --- | --- | --- |
| `IMP-013` | P1 | Planned | The 6/6 guild-ready screen lets reserve/bench management peek below the 720p frame, mixing completion with roster administration. |
| `IMP-014` | P1 | Planned | Recovery scatters six plain cards across a large empty panel and ends in an oversized full-width button, reading like a web form instead of a town service. |

Archived work:

- `IMP-001` to `IMP-008`:
  [docs/archive/Improve.completed-browser-slices-2026-07-14.md](docs/archive/Improve.completed-browser-slices-2026-07-14.md)
- `IMP-009` to `IMP-011`:
  [docs/archive/Improve.completed-imp-009-011-2026-07-14.md](docs/archive/Improve.completed-imp-009-011-2026-07-14.md)
- `IMP-012`:
  [docs/archive/Improve.completed-imp-012-2026-07-14.md](docs/archive/Improve.completed-imp-012-2026-07-14.md)

## IMP-013: Separate Party Completion From Roster Administration

At 6/6, show the completed 3+3 formation and departure choice as one stable
screen. Reserve, retired, portable-vault, and repeated Bench controls belong in
the party/roster service and must not peek below the 720p completion frame.

## IMP-014: Recompose Recovery as a Town Command Window

Keep wounds, before/after HP, individual cost, total cost, affordability, and
confirm/cancel, but remove the large empty field and oversized web-form submit.
The selected treatment and result should read as one compact service exchange.

## Review Baseline

- Use 1920x1080 as the primary desktop presentation target.
- Keep 1280x720 as the minimum no-overlap, no-scroll controller Gate.
- Verify through normal browser play. Debug routes are diagnostic and headless
  proves engine reachability only.
- A passing route is not visual acceptance. Review enemy readability, Japanese
  layout, focus truth, transition rhythm, and screenshots.
- Give one implementer ownership of a player-facing slice and use an independent
  browser verifier before acceptance.

## Next Improvement Rule

Add a new numbered item only for a concrete reproduced defect. Record category,
evidence, expected player-visible outcome, owner boundary, acceptance checks,
browser route, and the past-trouble regression most likely to recur. Do not
reopen an archived item merely because a later defect appears on the same screen.
