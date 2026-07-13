# Browser Playtest Evidence - 2026-07-13

Environment: Chromium, 1280x720, build `ad4287b`.

The route used visible normal-play controls from the title screen. It did not
use debug progress, direct `GameState` mutation, hidden dispatch, or a
rules-engine shortcut. Mouse clicks were used only to continue after the
controller failure had been reproduced and recorded.

## Recorded States

- `01-scenario-controller-and-id-leak.jpg`: Japanese scenario selection. On
  entry, `document.activeElement` was `BODY`; Down and `S` did not move the
  selection. The cards also expose `default` and `verdant`.
- `02-guild-proposal-focus-loss.jpg`: the suggested candidate is visible, but
  `document.activeElement` reset to `BODY` immediately after choosing Yes.
- `03-guild-overflow-after-recruit.jpg`: after one recruit, class selection,
  proposal, party formation, and record management compete for one 720px view.
- `04-first-departure-town.jpg`: a new party is described with return-state
  copy. "Enter dungeon" has selected-looking gold styling while the actual
  focused element was the `Guild` button.
- `05-verdant-g1f-stone-and-stair.jpg`: Verdant G1F opens with fitted green
  masonry and stacked stair geometry rather than living forest structure.
- `06-verdant-enemy-staging.jpg`: the delivered Verdant enemies resolve in the
  browser, but a group is staged as a small distant cluster.
- `07-combat-log-and-command-overflow.jpg`: round-two log lines disappear behind
  the command window. Auto, Repeat, and Retreat start below y=720.
- `08-verdant-g1f-organic-wall-and-stair.png`: IMP-006 follow-up. Verdant G1F
  now uses root, bark, and moss surfaces; the entrance ascent uses the dedicated
  root structure. The east opening agrees with the local minimap.

## IMP-006 Follow-up

Verified in Chromium at 1280x720 through the normal title, scenario, guild, and
dungeon route. `tests/e2e/verdant-playthrough.spec.ts` passed, as did desktop and
mobile nonblank-canvas checks in `tests/e2e/rendering.spec.ts`.

## Automated Gate Difference

`npm run selfplay:browser` passed in 38.5 seconds and all three automated
screenshot-review tests passed. Those tests use click-heavy setup and only
capture images; they did not detect the controller entry failure, focus/style
disagreement, or visual clipping above. This difference is the primary finding,
not a reason to discard the automated tests.
