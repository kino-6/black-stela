# Tasks — active backlog

## How to use this file (mechanics only — the RULES live in AGENTS.md)

- **This file is the TASK QUEUE, not a rulebook.** Durable rules / conventions / policies live in
  `AGENTS.md` (and `.claude/skills/**`, `docs/design/**`, auto-memory).
- **Status markers:** `[ ]` not started · `[-]` in progress · `[x]` done (awaiting move to Archive).
- **Every task NAMES its gate.** A task is not `[x]` until its gate is green and its player-facing proof has
  been read where applicable.
- **One at a time.** Process the queue top-down; finish verification before the next task.
- **Done → Archive in the same edit.** This file holds only open work. Completed records live in
  `docs/archive/Tasks.completed-2026-08.md`.
- **Build / play:** `./run.sh` — the launcher (`play [開始地点]` / `gate` / `check` / `verify` / `capture` /
  `log`); it wraps the npm scripts so no command list has to be memorised. Truth gate `npm run gate:final`;
  unit `npm run test`; Godot gates `gate:migration` / `gate:godot`; local pre-push `gate:prepush`.
- **Verify player-facing changes yourself** (real screen → PNG → read, or an appropriate gate) before asking
  the user to inspect them; provide a one-shot in-game route when appropriate.

Archived: [2026-08 completed work](docs/archive/Tasks.completed-2026-08.md) (including the 2026-08-14〜16
groom for #34–#41) · `Tasks.completed-2026-07.md` · `Improve.md`.

---

## Active queue (process top-down)

No implementation-ready task is open. The former completed queue (#34–#41 and the stair-landmark pixel
detector follow-up) was moved to the August archive on 2026-08-16.

## Backlog / ideas (no home yet; user decision required)

- **#33-b 拠点整備 slice3（任意ポリッシュ, 小）** — 上位 Lv を降下フラグで解禁（schema `unlockFlag` は実装済み・未著述）
  ＋整備場（materials 収量/錬成コスト減）を4つ目に＋帰還回復のログ1行。v1 は機能完成済みなので着手は任意・user 判断。
- **#32-b 迷宮イベント v2（選択肢付き対話, 中）** — 現状 v1 は flavor＋簡易効果のみ。分岐選択（受ける/去る、判定つき）を
  シナリオ記述できる対話イベントへ拡張する余地。未承認・要相談。
- **#37-slice3 深い設備の見せ方（任意）** — 新設備の解禁／伸びしろをどう示すかは、追加の進行設計を伴うため未決定。
- **#38-slice3 採取の文言・枯渇ポリッシュ（任意）** — 繰り返し採取の実装は完了。ログと枯渇演出の新規コピー方針が決まった時に扱う。
- 旧 #27 = W3a 共有弾薬は user 判断で廃案 → `docs/design/ballistic-world-program.md` に記録済み。

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **Combat feel:** `npm run play:combat`（terminal-line の長時間戦闘へ直接着地）。
- **中盤・終盤スタート:** `npm run play:late`（育成済み terminal-line party）。
- **基地:** `npm run play:base`（terminal-line の素材60所持 fixture）。
- **玄室:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`。
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`。
- **default の帰還階段:** `godot --path godot/ --script res://tests/capture_stairs.gd` が
  `godot/tests/_ux_default_return_stairs.png` を更新する。
- **深層フロア:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）。
