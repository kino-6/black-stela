# Claude → Codex handoff — 2026-07-25, second verification pass

**Purpose:** permanent independent-review brief for the changes landed from
`eb1bcc6` through `cf9975e`. Codex verifies the real Godot build and exported
artifacts; headless results alone do not close the listed player-facing items.

## 1. Native and export verification required

- **IMP-044:** return through an authored stair to town. Confirm that the
  former `_current_cell` null error no longer appears in native Godot output.
- **#24 / IMP-046:** run `godot --path godot/ -- --debug-mode`. Confirm the
  developer panel mounts and F12 opens/closes it. It must remain absent in a
  normal player launch.
- **#25 / IMP-047:** build and launch exported macOS and Web artifacts. Confirm
  the title backdrop renders and output contains no missing-resource, export,
  or `SCRIPT ERROR` warning. Headless resource checks are useful but are not
  export-launch proof.
- **#4 / IMP-042:** review the always-visible town party-status card at
  1280×720. It must not clip, overlap, or obscure its town controls after the
  additional rows were added.
- **#26 / IMP-048:** review scenario selection at 1280×720. Its
  select/confirm/cancel legend must be visible and inside the viewport.

The native results determine whether IMP-044/046/047/048/042 move to
independently approved.

## 2. Previous pass — remaining native checks

- **#17:** verify held ↑, ↓, S, Q, and E individually in an open multi-cell
  corridor fixture. Each must repeat while held; repeat must stop at a wall,
  combat, chest, or modal.
- **#3:** pick up a genuinely new item after descending, return through the
  normal route, and confirm only that new item appears in the town
  `持ち帰った物` ledger. The initial-potion-is-not-loot case is already verified.

## 3. Codex-led visual reskin

Claude supplies layout seams; Codex owns visual direction, asset choice, and
independent sign-off.

- **#15:** replace pure-black combat backdrop with the active world/floor's
  dungeon environment. Verdant should read as green drowned-light.
- **#14:** during command selection, feature the acting adventurer as the
  subject; during playback keep the enemy stage primary. Provide an ON/OFF
  option.
- **#21:** dungeon party presence is the lower-screen subject; place command
  controls below the minimap.
- **#9:** replace the registration flow's report/form feeling with authored,
  layered character-first framing.

## 4. Asset decisions needed

- **#6:** determine whether portraits can be decoupled from origin with a
  sufficiently varied face pool; identify precise shortfall before generating
  more art.
- **#18:** specify Verdant default ambient brightness, fog depth/colour, and
  view-distance intent so "lush" is legible; Claude will expose it as world/floor
  data.
- **#19:** after `.` chamber blocks are authored, verify that first-person 3D
  reads as a room rather than a widened corridor; define room art if not.

## 5. Export follow-up

- **#27:** apply IMP-047's export-safe texture policy to `town.gd` and
  `dungeon.gd`, then add `gate:package-smoke`: exported macOS/Web launch with
  missing-resource, `SCRIPT ERROR`, and export-warning counts all zero.

## Evidence conventions

- Record exact command, build stamp/commit, fixture or normal route, screenshots,
  and native log result.
- A headless gate proves deterministic state/resource loading only. Mark any
  native desktop/Web requirement explicitly until it is performed.
- Report regressions with reproduction steps and evidence; do not silently
  repair the implementation from the review lane.
