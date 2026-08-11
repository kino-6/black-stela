# Tasks — active playtest backlog

## Conventions (READ FIRST)

- **Status markers:** `[ ]` = not started · `[-]` = in progress · `[x]` = done (awaiting move to Archive).
- **Every task NAMES its Gate** — a headless gate/test proven to fail on the pre-fix code where one fits,
  else the explicit manual/visual check. A task is not `[x]` until its gate is green **and** it is committed.
- **Done → Archive, groom on EVERY status change (user rule 2026-08-05).** When you touch a task's status,
  in the SAME edit move any freshly-`[x]` item out to `docs/archive/Tasks.completed-2026-08.md` (leave a
  one-line pointer), collapse verbose done blocks, delete dead notes — this file holds only open work.
- **One at a time.** Process the active queue top-down; finish (verify + gate + commit) before the next.
- **Verify it YOURSELF before HANDING a check to the user (user rule 2026-08-11, "あまりに無責任").** Before you
  ever hand a check back, answer two questions and act: (1) **Can I verify this myself?** render the real screen
  to PNG and READ it / run the gate / probe the value — do it. (2) **Did I give a ONE-SHOT way to see it in the
  real game?** Pointing at a `godot/tests/*.png` file or "walk there" is NOT that — add/name a `debug_fixtures.gd`
  fixture or boot flag that jumps straight to the exact screen, so the user confirms in one action.
- **Build / verify:** `npm run export:godot && npm run play`. Truth gate `npm run gate:final` (e2e); unit
  `npm run test`; Godot gates `npm run gate:migration` / `gate:godot`; runtime-error gate `gate:godot-runtime`.
- **Codex delivery flow:** Codex leaves finished work UNCOMMITTED; 検品 (named gate + read the PNG) + commit is Claude's job.
- **Lanes:** Codex owns art / assets / **visual sign-off** (primary implementer does NOT self-approve visual
  completion). Claude owns rules / data / renderer wiring / parity / gates.

Archived history: `docs/archive/Tasks.completed-2026-08.md`, `docs/archive/Tasks.completed-2026-07.md`,
`Improve.md`. Future/deferred design ideas (unapproved): `docs/design/ballistic-world-program.md`.

**Recently shipped:** Y/D + Codex D-series 検品 + Claude 実機playtest (`a9a8dad`) · Tasks groom + dungeon-dock
ux-parity fix (`88cb96c`) · 玄室/W2/W4/W5 実装確認・active queue clear (`30beb83`). `export:godot` 全通・
`gate:migration` 90 PASS・`gate:final` e2e 緑.

---

## Active queue (process top-down)

**（空 — no active tasks.）** Claude レーンの実装・検証は全て完了、全ゲート緑、commit 済み。玄室 / W2 / W4 / W5 は
実装済み＋ゲート緑＋実機PNG提示済みで、残るのは **user/Codex の目視サインオフ（人の判断）のみ** — これは backlog タスク
ではないため active queue には置かない。NG が出た項目のみ、その時点で再オープンする。未承認の将来設計アイデア（W3a 弾薬案
ほか）は `docs/design/ballistic-world-program.md` と archive に deferred として保管。

### 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段（黒板→照らし直し）:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方（W2/W4 壁床/敵/浸水）:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
