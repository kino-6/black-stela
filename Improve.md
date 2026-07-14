# Black Stela Active Improvement Backlog

Last browser acceptance: 2026-07-14, Chromium, 1280x720 and 1920x1080.

## Active Status

`IMP-001` through `IMP-014` are archived. **The backlog is empty.**

| Item | Priority | State | Player-visible problem |
| --- | --- | --- | --- |
| `IMP-013` | P1 | Done | The 6/6 guild-ready screen let reserve/bench management peek below the 720p frame, mixing completion with roster administration. |
| `IMP-014` | P1 | Done | Recovery scattered six plain cards across a large empty panel and ended in an oversized full-width button, reading like a web form instead of a town service. |

`IMP-013` — the completion screen now says one thing: the finished 3+3, and the two ways on
(Manage roster / Enter dungeon). Bench, reserve, retired, the portable vault and the character
sheet moved behind the roster command; nothing peeks below the 720p frame. Locked by
`tests/e2e/town-services.spec.ts`.

`IMP-014` — recovery is a counter you stand at: the wounded only, each with HP before → after
and what they cost, then the total, affordability, and two normal-sized commands. A healthy
party gets ONE line, not six cards saying "No treatment." Locked by the same spec, which fights
until somebody is actually hurt rather than hoping.

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
