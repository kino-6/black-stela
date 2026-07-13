# Browser UX Review - 2026-07-14

## Scope

- Primary presentation target: 1920x1080.
- Minimum controller/layout Gate: 1280x720.
- Runtime: Chromium against the current worktree on `f6147b3`; the worktree also
  contained Claude Code's uncommitted `IMP-008` changes.
- Route: visible title, scenario, guild proposal, town, dungeon, and combat
  controls. No headless state mutation was used.
- Playwright MCP could not connect because its Chrome extension was absent, so
  the repository's Playwright Chromium runner was used.

## Evidence

| File | State | Finding |
| --- | --- | --- |
| `01-1280-enemy-scale.png` | 1280x720 manual combat | The single enemy is a small distant subject; the corridor dominates. Verdant mixed-pack review showed the same composition class. |
| `02-1280-abrupt-post-combat-resume.png` | First exploration frame after victory | The route is already back in exploration and carries only a one-line reward message; no owned result phase is visible. |
| `03-1920-combat-manual.png` | 1920x1080 manual combat | The stage grows to about 533px high, but enemy framing remains conservative and the live log/command hierarchy is weak. |
| `04-1920-combat-auto.png` | 1920x1080 Auto playback | The old overlap was not reproduced, but Auto creates an isolated status strip and a large unused vertical void before the dock. |
| `measurements-1920.json` | DOM bounds before Auto | Records stage, party, message, command, and viewport geometry for the 1920 run. The enemy DOM node is its label/readout, not the WebGL silhouette, so it is not accepted as sprite-height proof. |

## Test Results

```text
controller-route + screenshot-review + combat-stage + combat-regression
27 passed, 1 failed

FAILED: a win shows a result screen with XP/gold, dismissed to continue (#81)
Expected combat-result to be visible; no element was found.
```

`npm run selfplay:browser` passed in 38.0 seconds. That does not override the
failure: its helper can observe the dungeon command window and return after
combat, so the normal route currently accepts an absent or late result phase.

The focused, still-uncommitted `IMP-008` test run passed 3/3. It remains pending
visual review of fresh departure and real return in both languages.

## Gate Decision

- Controller reachability: pass for the covered route.
- 1280x720 containment: pass for current manual combat geometry.
- Enemy visual scale: fail; `IMP-007` reopened.
- Combat log/Auto/result rhythm: fail; tracked as `IMP-010`.
- `IMP-008`: not archived while implementation is uncommitted and visual proof is incomplete.

Past troubles that could recur: Browser proof, command shift, viewport overflow,
enemy staging as placeholder presentation, and treating a passing route as a
complete combat experience. Headless was not used and would not prove any of
these visual or transition findings.
