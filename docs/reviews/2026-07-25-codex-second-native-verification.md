# Codex Second Native Verification — 2026-07-25

**Scope:** `eb1bcc6..cf9975e`, checked independently in the macOS Godot build
and in freshly exported macOS/Web packages. This is a review record, not an
implementation sign-off.

## Verdict

| Item | Verdict | Evidence / reason |
| --- | --- | --- |
| IMP-044 / return stair null guard | **Gate pass; native pending** | `verify_played_loop.gd` passes its `_current_cell` null-position guard. The native return-ready fixture is not reachable reliably (see debug-fixture blocker), so this is not promoted to native approval. |
| IMP-046 / debug panel | **Native pass** | `godot --path godot/ -- --debug-mode` mounted the collapsed panel; F12 opened it and a second F12 collapsed it. A normal launch had no panel. |
| IMP-047 / title export | **Narrow native pass; Web usability fail** | Fresh `npm run package` exited 0 with **0** `warning`, `missing-resource`, and `SCRIPT ERROR` matches. The exported macOS app and Web export both rendered the title backdrop. Safari rendered Japanese UI text as mojibake, so the Web package is not player-ready. |
| IMP-042 / town party card at 1280×720 | **Native pass** | Direct native `town.tscn` at a 1280×720 window rendered all six members with HP/MP rows inside the card; no clipping or overlap. |
| IMP-048 / scenario-picker legend at 720p | **Native pass** | The normal title route at a 1280×720 window showed `↑↓ 選択・Enter 決定・Esc 戻る` and the Back action without clipping. |
| #17 / held ↑ ↓ S Q/E | **Not approved** | The automated real-scene controller gate only proves held `turn_left`. The required native multi-cell fixture cannot currently be loaded from the debug panel (details below), so forward/back/strafe hold behaviour remains unverified. |
| #3 / gained item appears in return ledger | **Not approved** | The starting-potion-is-not-loot path is covered, but no native `loot_delta` fixture exists to obtain an item and return. The town implementation subtracts `Run.loot_baseline`, but this is not a player-path acceptance. |
| #27 / package smoke gate | **Partly done** | `town.gd` and `dungeon.gd` now use export-safe imported-resource-first `_texture` loading; package build succeeds. There is no `gate:package-smoke` command yet, so this evidence is manual/review-only. |

## Reproducible evidence

Run from the repository root:

```sh
godot --headless --path godot/ --script res://tests/verify_played_loop.gd
godot --headless --path godot/ --script res://tests/verify_debug_start.gd -- --debug-mode
godot --headless --path godot/ --script res://tests/verify_title_asset.gd
godot --headless --path godot/ --script res://tests/verify_scenario_picker.gd
godot --headless --path godot/ --script res://tests/verify_town_controller.gd
npm run package
```

The five Godot gates passed. The package command exited `0`; its captured log
contains no `warning`, `missing-resource`, or `SCRIPT ERROR` line. The produced
artifacts were `build/macos/BlackStela.zip` and `build/web/index.html`.

Temporary local review captures (not committed binary evidence):

- `/private/tmp/black-stela-second-debug-mounted.png`
- `/private/tmp/black-stela-second-debug-open.png`
- `/private/tmp/black-stela-second-debug-closed.png`
- `/private/tmp/black-stela-second-scenario-1280.png`
- `/private/tmp/black-stela-second-town-direct-1280.png`
- `/private/tmp/black-stela-export-macos-title.png`
- `/private/tmp/black-stela-export-web-title.png`

## Blocking debug-fixture defect

The debug overlay presents **B2F 開始** and `進捗を読込`, but loading the
advertised B2F start did not produce the B2F dungeon scene in the native app:
the display remained the town surface while the overlay reported a dungeon
state. That makes the named starts unreliable as browser-review fixtures.

Do not accept #17 or #3 through a rules-only substitute. Implement the named
fixtures promised by IMP-046 and make each assert both the expected scene and
the expected state:

- `open_corridor`: safe three-plus-cell corridor; exposes starting cell,
  facing, and a no-modal assertion for native held-input review.
- `loot_delta`: one claimed, new item and a return marker; entering town must
  visibly show that item under `持ち帰った物`.
- `return_ready`: stair marker with `position` safely cleared after return.

Each fixture should have a small scene/controller gate and a native-review
launch recipe. The state seed must be applied before entering the scene, and
the scene must not reset it to the start landing.

## Follow-up: package smoke

Add `gate:package-smoke`, separate from `package`, that:

1. runs `npm run package` into a clean temporary output directory;
2. fails on any export `warning`, `missing-resource`, or `SCRIPT ERROR`;
3. launches the exported macOS app long enough to collect its log and verify
   that the title backdrop is non-null; and
4. serves the Web package, waits for the Godot canvas, checks the same backdrop
   render, and asserts Japanese text is readable (not tofu/mojibake).

This is intentionally an export-environment gate; it must be allowed to skip
only when export templates are unavailable, never silently pass.

## Art and asset decisions for the implementation owner

### #6 — face pool

**Insufficient.** There are twelve `portraits/<background>.png` files per
world, and the appearance screen selects `background.portraitKey` directly.
They are origin illustrations, not an independent face pool; there is no
gender/class coverage or independent selection. Do not merely decouple the
field while reusing these twelve keys.

Create a world-scoped `faces` catalog with at least **12 readable faces per
world** (six feminine-presenting, six masculine-presenting, plus any future
neutral set) and tag each by presentation/style rather than class. Store
`faceId` on the draft/character; origin remains `backgroundId`. The first
release can provide three broad style pools (martial, learned, roguish) with
cross-class use, but should not bind a face to an origin.

### #18 — Verdant lighting and fog target

The data already has a useful direction: ambient `#9cba8c` at `0.85`, pale
front light `#e4f7c9`, torch `#c2e89f`, range `10`, and thin dark-green fog
`#0a170e` at `0.06`. Keep those as the *bright, overgrown drowned-light*
default. The visual target is: wet stone remains readable to roughly 2–3 cells;
the ceiling and far end dissolve into cool green, not black; warm torchlight is
an accent, never the only source of visibility. Do not lower ambient below
`0.75` or raise fog density over `0.08` for the default floor.

### #19 — chamber read

The authored maps do contain chamber cells, and the 3D builder makes geometry
from the grid, so a `.` cluster can widen a floor structurally. It has no
room-specific visual language, however: the same wall/floor material and
camera treatment are used for corridors and rooms. **Not visually approved.**

When a room/chamber fixture loads correctly, add a chamber-only art treatment:
larger light pool, ceiling break/shaft, floor motif or perimeter pillars, and a
landmark/encounter prop. The player should distinguish it from a corridor in a
single first-person frame, before reading the minimap or prose.

## Reskin direction: implementation acceptance

- **#15 combat:** bind the stage backdrop to `world.palette`/floor art, behind
  the enemy, with a dark legibility veil—not a pure black fill.
- **#14 active actor:** show a large actor portrait only while choosing that
  actor's command; hide it during resolution so the enemy stage remains the
  focal point. Make the option explicit and persistent.
- **#21 dungeon HUD:** party lives as a single lower-third strip (portrait,
  name, HP/MP, condition); contextual commands sit below the minimap. Do not
  return to a horizontal toolbar.
- **#9 registration:** retain one decision per step, but use a framed dossier:
  fixed portrait/identity rail, one dominant choice panel, and a short outcome
  preview. Avoid equal-weight cards and form-grid borders.

Native approval must be based on the actual Godot scenes at 1280×720, not
headless captures alone.
