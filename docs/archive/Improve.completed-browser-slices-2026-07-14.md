# Archived Browser Improvement Slices - 2026-07-14

These items came from the 2026-07-13 Chromium playtest at 1280x720. They are
archived because their implementation slices landed and their original blocking
failure is covered by current Gates. Follow-up defects remain active in
`Improve.md`; archive does not mean the whole affected screen is visually final.

## Completion Index

| Item | Original failure | Resolution | Evidence / residual |
| --- | --- | --- | --- |
| `IMP-001` | Self-Play used clicks and could not fail on controller regressions. | `04cc25c` added measured pointer use, focus/selection truth, four-edge viewport checks, and a controller-only route. | `tests/e2e/controller-route.spec.ts`; Browser Self-Play remains insufficient for visual acceptance. |
| `IMP-002` | Scenario selection had no initial controller cursor and leaked raw pack ids. | `22a0d57` added initial focus, directional selection, Confirm/Cancel, and localized card text. | Controller route checks focus and rejects raw ids. |
| `IMP-003` | Guild hall, proposal, registration, and roster competed on one clipped screen. | `1c7e3cf` separated the hall from staged registration and preserved controller focus. | Six recruits fit the controller route; portrait quality remains `IMP-009`. |
| `IMP-004` | Town painted one command as selected while Enter activated another. | `22a0d57` unified visible selection and DOM focus. | Route E2E asserts focus, label, and resulting screen together. |
| `IMP-005` | Combat commands fell below 720p and log growth covered the command area. | `fe9beea` established fixed combat regions and viewport checks. | Original overflow is fixed; information rhythm and result flow remain `IMP-010`. |
| `IMP-006` | Verdant G1F looked like green masonry and stairs ignored scenario art. | Asset retake landed in `d79ed99`; runtime wiring is visible on current builds. | Before/after evidence below; accepted 2026-07-13. |
| `IMP-007` | Enemy groups were compressed, lacked convincing floor contact, and did not distinguish combat elevation from visual hovering. | `fe9beea` added spacing/contact staging and `e90ddf0` separated presentation-only `hover` from combat `elevation`. | The original implementation slice is complete. Remaining enemy readability and camera framing are a new `IMP-011`. |
| `IMP-008` | A fresh party was greeted with return records and wording equivalent to "again". | `2197d50` introduced explicit expedition count and world-owned first-departure/return copy. | Focused E2E passed 3/3; English/Japanese first departure and a real return were visually accepted 2026-07-14. |

## Preserved Evidence

- Scenario/controller leak:
  `docs/evidence/browser-playtest-2026-07-13/01-scenario-controller-and-id-leak.jpg`
- Guild focus/overflow:
  `docs/evidence/browser-playtest-2026-07-13/02-guild-proposal-focus-loss.jpg`
  and `03-guild-overflow-after-recruit.jpg`
- Town focus mismatch:
  `docs/evidence/browser-playtest-2026-07-13/04-first-departure-town.jpg`
- Combat overflow:
  `docs/evidence/browser-playtest-2026-07-13/07-combat-log-and-command-overflow.jpg`
- Verdant wall before/after:
  `docs/evidence/browser-playtest-2026-07-13/05-verdant-g1f-stone-and-stair.jpg`
  and `08-verdant-g1f-organic-wall-and-stair.png`
- First departure and real return:
  `docs/evidence/browser-playtest-2026-07-14/06-1280-first-departure-en.png`,
  `07-1280-first-departure-ja.png`, and `05-1280-real-return-town.png`

## IMP-007 Follow-up Boundary

Enemy spacing/contact implementation landed in `fe9beea` and presentation-only
hovering in `e90ddf0`, but the 2026-07-14 visual review still found enemy art too
small at both the minimum and primary desktop targets. The original slice is
archived as implemented; the newly specified camera/framing acceptance work is
tracked as `IMP-011` in `Improve.md`.

## Archive Rule

An item moves here only when its original defect has implementation evidence,
browser evidence, and a regression Gate. New defects found on the same screen
receive an explicit active item instead of rewriting history or treating a green
test as blanket acceptance.
