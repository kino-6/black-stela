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

Archived: `docs/archive/Tasks.completed-2026-08.md` (incl. the **2026-08-13 batch #28–#33** — 薙ぎ倒し既定化 ＋
terminal-line「戦闘の外側」= 依頼露出/御触れ/ボス signpost/ランダムイベント/拠点整備 — merged to main `5cdc787`;
and the 2026-08-12 #14–#21 batch `8a5b41a`) · `Tasks.completed-2026-07.md` · `Improve.md`. Future/deferred
design ideas (unapproved): `docs/design/ballistic-world-program.md`.

---

## Active queue (process top-down)

2026-08-13 実プレイ playtest（terminal-line）で挙がった指摘。優先度順:

- [-] **#34 — UI focus の EXHAUSTIVE verifier（構築済み・1件残）.** `godot/tests/verify_focus_trap.gd` 作成。
  **プレイヤーの矢印キーと同じ `find_valid_focus_neighbor`（explicit＋幾何）で BFS** し、各 town サービスで (1) TRAP=
  focus がパネル外（街 chrome）へ漏れない、(2) COVERAGE=パネル内の全 focusable に到達、(3) 状態変化（鍛える/買う）後の
  rebuild でも維持、を検証。※旧 gate が漏らした理由＝「explicit neighbor のみ BFS」で**幾何漏れを検出できなかった**。
  現行で全サービス漏れを検出（RED 実証済み）。**残: shop「詳しく見る」到達漏れ（下記 #36-b）を潰したら `gate:migration`
  へ登録**（今はまだ1件 FAIL するので未登録）。次段: 全画面（guild/combat/character-creation 等）へ拡張。
- [x] **#35 — 鍛冶屋 focus 漏れ 修正済み.** 根本原因: `town.gd:_rebuild` がサービス表示中に `_menu_host`（party rail＋
  街施設バー）を隠しておらず、パネル背後の施設ボタンが focusable のまま → 幾何 nav でパネル外へ漏れていた（全サービス
  共通の欠陥）。**修正: サービス表示中は `_menu_host.visible = false`**（invisible は focus nav から除外＝全パネル一括で
  トラップ）。verify_focus_trap の全 TRAP チェック緑・town-controller 回帰なし。
- [ ] **#36-b — shop「詳しく見る」が D-pad 到達不能（verifier が検出した実バグ）.** shop_panel の focus_neighbor 配線漏れ。
  修正後、#34 verifier が全緑になるので `gate:migration` に登録すること。
- [ ] **#36 — 街広場の可読性.** (a)「威力」→「攻撃」に改称（`party.damage` ラベル、= ダメージ幅表示）、(b) 依頼通知を
  枠付きカード（Window）で囲う、(c) 前衛/後衛が一列で入り乱れて見える → 区切り/見出しで明確化、(d) 全体的にフォントが
  小さい（共有トークン font は combat/crawl にも影響するので要検証）。
- [ ] **#37 — 基地整備の深さ再設計（中〜大）.** user: 設備3つは「少ない」、Lv上限（Lv0/3）が見えて「オマケ」感。
  **中盤〜エンドコンテンツ想定**の深いメタ進行に。**ただし便利系（医務室=休息/補給所=割引/通信室=探索）は序盤開放**の塩梅。
  → 設備数を増やし、序盤 QoL 設備 vs mid/end の重い設備（降下フラグ/大量 materials で解禁）に階層化。設計案を提示して確認。

## Backlog / ideas (no home yet)

- **#33-b 拠点整備 slice3（任意ポリッシュ, 小）** — 上位 Lv を降下フラグで解禁（schema `unlockFlag` は実装済み・未著述）
  ＋整備場（materials 収量/錬成コスト減）を4つ目に＋帰還回復のログ1行。v1 は機能完成済みなので着手は任意・user 判断。
- **#32-b 迷宮イベント v2（選択肢付き対話, 中）** — 現状 v1 は flavor＋簡易効果のみ。分岐選択（受ける/去る、判定つき）を
  シナリオ記述できる対話イベントへ拡張する余地。未承認・要相談。
- 旧 #27 = W3a 共有弾薬は user 判断で廃案 → `docs/design/ballistic-world-program.md` に記録済み。

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **#26 Combat feel（銃テンポ含む）:** **`npm run play:combat`**（＝`--fixture terminal_line_combat`）で terminal-line 戦闘に直接着地。
  前衛4人が pistol/rifle/SMG/shotgun 装備・敵は**訓練ダミー化（HP800・攻撃0＝12ラウンド以上戦え、味方は無傷）**。**全員でかかる[F]**
  で全銃種のテンポ・静かな数字・命中沈み・ログを一度に、繰り返し確認。撃破沈みは撃ち切る。（fixture `terminal_line_combat`、debug パネル可。）
- **#33 拠点整備（基地）:** **`npm run play:base`**（＝`--fixture terminal_line_base`）で terminal-line 町に素材60で着地。
  **市場通り → 基地** を開き、医務室/補給所/通信室を強化（素材消費→Lv↑→効果は現在/次で表示）。効果: 医務室=帰還で全快、
  補給所=店割引、通信室=探索判定+。（fixture `terminal_line_base`、debug パネル可。）
- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
