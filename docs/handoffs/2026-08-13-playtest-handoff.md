# Handoff — 2026-08-13 terminal-line playtest batch

Everything below is **committed + pushed to `main`** (HEAD `3293373`; verify with
`git ls-remote origin main`). Pre-push gate (typecheck + unit) green on every push.
Safe to reboot. Read `Tasks.md` for the live queue; this file is the "why / where we are".

## Shipped this session (main)

- **#28 自動火器スタート** (`06db476`) — 8 basic vocations すべて連射武器スタート（薙ぎ倒しの既定化）。
- **#33 拠点整備 v1** (`112354c`/`daf3df4`/`247e35c`/`1a0ab6b`) — `world.md facilities:` 汎用機能。
  terminal-line=医務室/補給所/通信室。ONE-SHOT `npm run play:base`。**※要再設計（#37、下記）**。
- **#29 依頼の露出** (`a291076`) — 街広場に依頼通知（`Quests.board_counts`）。
- **#30 御触れ** — 追加したが **user 却下→撤去** (`0babdef`)。常時ベタ貼りが不評。capability は Backlog。
- **#31 ボス signpost + bookend invariant** (`c07e679`)。
- **#32 迷宮ランダムイベント v1** (`2ed639f`/`5cdc787`) — `dungeonEvents` + `dungeonEventPct`、Godot-native・parity 安全。
- **#34/#35 focus verifier + 街 focus 漏れ修正** (`3293373`) — 下記が今セッションの山場。

## いま最重要: #34 exhaustive focus verifier（構築済み・あと1件）

user の再三の要望「focus/遷移バグがずっと治らない → Script で全探索して」に応えたもの。

- **`godot/tests/verify_focus_trap.gd`** — プレイヤーの矢印キーと同じ `Control.find_valid_focus_neighbor`
  （explicit＋**幾何**）で BFS し、各 town サービスで **TRAP**（focus がパネル外＝街 chrome へ漏れない）と
  **COVERAGE**（パネル内 focusable 全到達）を検証。状態変化（鍛える/買う）後の rebuild も再検証。
- **旧 `verify_town_controller` が漏らした理由**: explicit neighbor のみ BFS だったので**幾何漏れを検出できなかった**。
  今回のは幾何解決そのものを辿るので、鍛冶屋→鑑定所のような漏れを捕える。現行コードで全10サービスの漏れを検出（RED 実証）。
- **#35 修正済み**: 根本原因は `town.gd:_rebuild` がサービス表示中に `_menu_host`（party rail＋施設バー）を隠さず、
  背後の施設ボタンが focusable のまま → 幾何 nav で漏れていた（全サービス共通欠陥）。**サービス表示中は
  `_menu_host.visible = false`** に修正（invisible は focus nav 除外＝一括トラップ）。全 TRAP 緑・town-controller 回帰なし。
- **残1件 = #36-b**: verifier が新たに検出した実バグ **shop「詳しく見る」が D-pad 到達不能**（mouse-only island）。
  `shop_panel.gd` の focus_neighbor 配線漏れ。**これを潰すと verify_focus_trap が全緑 → `gate:migration` に登録**（今は
  1件 FAIL するので未登録）。その後、**guild/combat/character-creation 等 全画面へ verifier を拡張**するのが #34 の次段。

## 残りの playtest 指摘（Tasks.md 参照）

- **#36 街広場の可読性** — (a)「威力」→「攻撃」（`party.damage` ラベル、= ダメージ幅表示。i18n 一箇所）、
  (b) 依頼通知を枠付きカードで囲う、(c) 前衛/後衛が一列で入り乱れ → 区切り/見出しで明確化
  （rail は `town.gd` の `for row in ["front","back"]` で front→back 順だが視覚区切りなし）、(d) 全体フォントが小さい
  （token font は `dungeon_hud.gd:party_token` 共有＝combat/crawl にも影響、要検証）。
- **#37 拠点整備の深さ再設計（中〜大・要設計確認）** — user: 設備3つは「少ない」、Lv上限表示で「オマケ」感。
  **中盤〜エンドコンテンツ想定**の深いメタ進行へ。**ただし便利系（医務室/補給所/通信室）は序盤開放**の塩梅。
  → 設備数増＋序盤 QoL vs mid/end の重い設備（降下フラグ/大量 materials で解禁）に階層化。**着手前に設計案を提示して確認**。

## 便利メモ

- ONE-SHOT: `npm run play:base`（基地）・`npm run play:combat`（戦闘 feel）。
- focus 検証: `godot --headless --path godot/ --script res://tests/verify_focus_trap.gd`（現状 shop 1件 FAIL）。
- コミット単位は自分判断で（user 2026-08-13）。push/merge も大変更前に可。commit trailer 必須。
