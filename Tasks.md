# Tasks — active backlog

## How to use this file (mechanics only — the RULES live in AGENTS.md)

- **This file is the TASK QUEUE, not a rulebook.** Durable rules / conventions / policies live in
  `AGENTS.md` (and `.claude/skills/**`, `docs/design/**`, auto-memory). Do NOT grow this file with them —
  see AGENTS.md "Where rules and improvements go".
- **Status markers:** `[ ]` not started · `[-]` in progress · `[x]` done (awaiting move to Archive).
- **Every task NAMES its gate** — a headless gate/test proven to fail on the pre-fix code where one fits,
  else the explicit visual/manual check. A task is not `[x]` until its gate is green AND it is committed.
- **One at a time.** Process the queue top-down; finish (verify + gate + commit) before the next.
- **Done → Archive, groom on EVERY status change.** When you touch a task's status, in the SAME edit move
  freshly-`[x]` items to `docs/archive/Tasks.completed-2026-08.md` (leave a one-line pointer here); collapse
  verbose blocks, delete dead notes. This file holds only open work.
- **An improvement / idea / follow-up with no home specified → append it to the fitting section below**
  (the active queue, or "Backlog / ideas"), so it is captured, not lost, and not dumped at the top as a rule.
- **Build / play:** `npm run play` (export + launch). Truth gate `npm run gate:final` (e2e); unit
  `npm run test`; Godot gates `gate:migration` / `gate:godot`; local pre-push `gate:prepush`.
- **Verify a player-facing change YOURSELF** (real screen → PNG → READ, or run the gate) before handing any
  check to the user; give a ONE-SHOT way to see it in-game (a `debug_fixtures.gd` fixture / boot flag).

Archived: `docs/archive/Tasks.completed-2026-08.md` (incl. the 2026-08-12 playtest #14–#21 / #15 + infra
batch, merged to main `8a5b41a`) · `Tasks.completed-2026-07.md` · `Improve.md`. Future/deferred design
ideas (unapproved): `docs/design/ballistic-world-program.md`.

---

## Active queue (process top-down)

- [ ] **#27 — W3a 再検討: 通常攻撃の弾薬管理は NG（user 2026-08-12）.** `docs/design/ballistic-world-program.md` の W3a は
  「共有弾薬で通常攻撃の弾を管理し、撃つ/温存を選ぶ」を core loop としていたが、**user 判断: 通常攻撃での弾薬管理はしない**（「弾薬管理
  しないと言ったはず」）。→ **① 共有弾薬（通常攻撃の弾消費）は廃案。** 設計 doc の資源管理 core が成立しないため W3a as-designed は不採用。
  **残る検討余地（user 発言）:** (i) **特殊行動（技）へのコスト**は有り得るかも（必須ではない・MP と別軸にするか要相談）、(ii) **警戒度**
  （発砲＝騒音でフロア危険度↑、弾薬非依存）を単独で入れるか。どちらも user 承認待ち＝現時点で着手しない。terminal-line 世界/アート/銃は
  既に出荷済みなので、item 3 として**新規実装が必要なものは無い**（ammo 廃案・他は未承認アイデア）。ブランチ `feat/tl-w3a-ammo-alert` は
  実装前なので破棄可。

## Backlog / ideas (no home yet)

（なし）

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **#26 Combat feel（銃テンポ含む）:** **`npm run play:combat`**（＝`--fixture terminal_line_combat`）で terminal-line 戦闘に直接着地。
  前衛4人が pistol/rifle/SMG/shotgun 装備・敵は**訓練ダミー化（HP800・攻撃0＝12ラウンド以上戦え、味方は無傷）**。**全員でかかる[F]**
  で全銃種のテンポ・静かな数字・命中沈み・ログを一度に、繰り返し確認。撃破沈みは撃ち切る。（fixture `terminal_line_combat`、debug パネル可。）
- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
