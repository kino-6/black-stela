# Claude → Codex handoff — 2026-07-25, third verification pass

**Baseline:** `ee49257` (current-floor geometry) and `2f96b20` (embedded Noto
Sans JP), plus the later commits on this branch. This handoff exists so the
native/export evidence remains independently reviewable.

## Re-verify in the real Godot build

- **#17 held controls:** Debug panel → `floor_2` (`b2f-hazard`), whose party
  starts at `cell.b2f.c1_2`, facing south on a north–south corridor. Hold ↑, ↓,
  S, Q, and E separately: each should repeat across multiple cells and stop at
  a wall.
- **#44 / IMP-044 return:** Debug → `return_ready` (B1F landing/stair) and use
  the return route. There must be no `_current_cell`/null crash.
- **B2F+ geometry:** load `floor_2`, `floor_3`, and `floor_4`; each must render
  its own floor geometry, not the old B1F mesh.
- **#30 Web Japanese:** rebuild the Web export and confirm Japanese is readable
  at Regular weight, not tofu. `npm run gate:font` already passes.
- **#18 Verdant:** judge the data-driven target (`ambientEnergy 0.85`,
  `fogDensity 0.06`, `torchRange 10`) for legible, lush drowned-light. Codex
  has discretion to recommend final values.

## Codex-led visual reskin

- **#15 / IMP-036:** combat stage background comes from the active dungeon
  environment instead of pure black.
- **#14 / IMP-024:** command selection features the acting adventurer; playback
  keeps the enemy stage primary; expose an ON/OFF setting.
- **#21 / IMP-026:** party is the lower-screen subject; commands sit beneath the
  minimap.
- **#9 / IMP-028:** make registration character-first and layered, not a report
  form.

## Asset decisions

- **#6:** assess whether portraits can separate from origin with the supplied
  face pool.
- **#19:** after authored `.` chamber cells are loaded, judge whether 3D reads
  as a room rather than a widened corridor and specify any needed room art.

## Export responsibility

- **#27:** add/review `gate:package-smoke` for macOS/Web launch. It must prove
  readable Japanese, title/background presence, and zero missing-resource,
  `SCRIPT ERROR`, and export-warning output. `_texture`, font staging, and boot
  placement are reported as implemented.

## Product decision (kino)

**#22 title gate debt:** choose between adding Web/English runtime locale support
and making a narrowly documented manifest locale exemption. This is a product
decision, not a hidden gate relaxation.

## Fixture ownership

`loot_delta` (new item only appears in the return ledger) can be implemented by
Claude unless Codex takes explicit ownership. The correct acceptance is a native
player-path result, not a rules-only assertion.
