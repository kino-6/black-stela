# Completed — 2026-07-25 Verdant playtest core-loop fixes (IMP-030/031/032/033/034/038/040/044)

Eight items from the 2026-07-25 Verdant 3-minute playtest
(`docs/reviews/2026-07-25-verdant-3min-playtest.md`) and Codex's real-build
verification (`docs/reviews/2026-07-25-codex-godot-core-loop-verification.md`),
each fixed AND locked by a gate. IMP numbers are preserved so the review docs'
mentions (and IMP-050's reference to the IMP-044 return bug) stay valid.

Still in the active backlog because they are only PARTLY done: IMP-039
(placeholder only), IMP-042 (status shown, no anytime-menu / 720p check), IMP-045
(#13/#17 covered, #3 real path open), IMP-046 (flag fix only; named QA fixtures
open), IMP-047 (title only; town/dungeon `_texture` + package-smoke open), IMP-048
(legend only; full nav contract open).

The mechanism these fed is `docs/gates/played-build-gate.md`.

| Item | Player-visible problem | Resolution | Lock |
| --- | --- | --- | --- |
| `IMP-030` | Truth-gate plays React, not the shipped Godot build | `gate:play` (verify_played_loop) drives the real Godot scripts; wired into `gate:migration` (fc2f367) | gate:play |
| `IMP-031` | Returning to town reset the explored map | `DungeonEntry.plan` keeps the automap on re-descend, resumes position after victory (fc2f367) | gate:play (#12 lock) |
| `IMP-032` | Held movement key did not repeat | dungeon `_process` auto-repeats a held move after HOLD_DELAY (bd7f28d) | verify_dungeon_controller (6eee35f) |
| `IMP-033` | Esc did not close the full-map modal | dungeon `_input` treats the map as modal — Esc/M close it (fc2f367) | verify_dungeon_controller (6eee35f) |
| `IMP-034` | Shop consumables showed no description | shop_panel renders the description for every category; G3 data lock (82f17d1) | contentAuthoring.test G3 |
| `IMP-038` | 帰還後 mislabelled the starting potion as loot; lying flavor line | loot shows the GAINED delta vs a descent snapshot (bd7f28d); 帰還記録 empty case is honest "無事に帰還した。" (82f17d1) | — |
| `IMP-040` | Shop stock had no design shape | "shop stock has a SHAPE" (immediate/aspirational/mysterious) in the drpg-scenario skill (c3a3724) | skill |
| `IMP-044` | Return crashed `_current_cell` on a nulled position | `_apply` skips the view rebuild for phase!=dungeon; null-safe `_position()` (d7bf820) | gate:play (3 IMP-044 locks) |

Controller-coverage note: alongside these, the controller registry
(`godot/gates/controller-registry.json`, `verify_controller_coverage.gd`) reached
ZERO todo — title/result/guild/town/dungeon/scenario_picker/combat all covered,
boot/config exempt.
