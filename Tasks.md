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

- [x] **#34 — UI focus の EXHAUSTIVE verifier（done・gate 登録済み）.** `godot/tests/verify_focus_trap.gd` — 各 town
  サービスで、プレイヤーの矢印キーと同じ `find_valid_focus_neighbor`（explicit＋幾何）で BFS し (1) TRAP=focus がパネル外へ
  漏れない、(2) COVERAGE=パネル内 focusable 全到達、(3) 鍛える/買う 後の rebuild でも維持、を検証。旧 gate が漏らした理由＝
  explicit neighbor のみ BFS で幾何漏れを見れなかった点。**全緑・`gate:migration` 登録済み**。診断出力は未到達の全列挙＋entry
  表示に強化。次段（別タスク化可）: guild/combat/character-creation 等 全画面へ拡張、shop 売るモード等の縦リストも確認。
- [x] **#35 — 鍛冶屋 focus 漏れ 修正済み.** 根本原因: `town.gd:_rebuild` がサービス表示中に `_menu_host`（party rail＋
  街施設バー）を隠しておらず、パネル背後の施設ボタンが focusable のまま → 幾何 nav でパネル外へ漏れていた（全サービス
  共通の欠陥）。**修正: サービス表示中は `_menu_host.visible = false`**（invisible は focus nav から除外＝全パネル一括で
  トラップ）。verify_focus_trap の全 TRAP チェック緑・town-controller 回帰なし。
- [x] **#36-b — shop「詳しく見る」D-pad 到達不能 修正済み.** 原因: 買うモードの在庫行（スクロール内）＋別列の買うボタンが
  幾何 nav で繋がらず、entry の1行以外の全 詳しく見る＋買うが孤立。**修正: `UI.chain_column`/`link_lr` を ui_kit に公開ヘルパ化し、
  在庫 inspect を縦チェーン＋各行→買うを explicit 配線**。verify_focus_trap 全緑・town-controller 回帰なし。
- [-] **#36 — 街広場の可読性（a/b/c 済み・d 残）.** (a) done「威力」→「攻撃」（`party.damage`=ダメージ幅を攻撃に、
  衝突する raw `partyMenu.attack` は「攻撃力」へ改称）、(b) done 依頼通知を枠付きカード化、(c) done 前衛/後衛を見出し
  （前衛/後衛）＋広い gap で分離。実画面PNG確認済み・914ユニット/i18n parity 緑。**残 (d) フォント拡大**: `dungeon_hud`
  の party_token stat が 12px と小さいが combat/crawl 共有＝blanket 拡大は固定レイアウトを壊す（ui_kit `_sz` 注記）。
  密度を下げつつ局所的に上げる方針で別途。
- [-] **#37 — 基地整備 v2: 深さ再設計（slice 1 済み・slice 2 残）.** user 設計確定: 序盤 QoL 3つはそのまま＋深い設備追加、
  解禁は**大量 materials のみ**（フラグ無し＝高コストで「伸びしろ」表現）。
  - [x] **slice 1（兵装工廠＋管制室）done.** schema に `reinforceDiscountPct`/`wanderingReductionPct` 追加。terminal-line に
    **兵装工廠**（錬成/鍛冶コスト減 15/30%、cost 60/120）＋**管制室**（徘徊エンカウント減 30/50%、cost 80/160）。効果配線:
    `loot.gd`(reinforce/forge)＋`encounters.gd`(wandering pct)、facility 未著述で no-op＝**parity 緑**。prepack＋verify_facility 検証・914緑。
  - [ ] **slice 2（動力炉＝恒久 maxHP%）← 意図的に defer（専用ターン推奨）.** 2026-08-13 に着手→調査で cross-cutting と確定し
    revert。**確定した実装ポイント（次ターンはここから）:**
    (a) `effective()` は Facilities を preload 不可（facilities→character_stats の循環）＝pct は**引数**で渡す。`Facilities.max_hp_pct(state,world)`
    ヘルパを足すのが楽（`active_effects().maxHpPct`）。
    (b) **combat の HP バーは `effective()` でなく格納 `member.maxHp` を表示**（`combat.gd:554/1207/1461`）、一方 town の party_token は
    `effective()`＝**そのまま足すと combat と town で maxHP が食い違う**。→ 選択肢A: combat 突入時に member.maxHp へ %をベイク（表示も
    heal cap も一致）／選択肢B: combat 表示を effective+pct に変え、heal ヘルパ `_heal_member`(combat_round:984)・`_apply_healing_item`(997)
    が **state を持たない**ので caller(declare_round) から pct を貫通。
    (c) 他の cap/表示: `economy.recover:135`・`camp_techniques:65`・`facilities.apply_return_heal`・`dungeon_events._apply`・`party_panel:214`・
    `dungeon_hud.party_token`(+呼び出し元 town.gd:395/dungeon.gd:482) に pct を渡す。
    (d) parity は facility 未著述で pct=0＝安全。**HUD==combat の一貫性 Gate 必須**。content 動力炉 は未著述。
  - [ ] slice 3（任意）: 深い設備のロック/伸びしろ表示強化、実画面 PNG 確認。
- [-] **#38 — 採取ポイント（EO 式・繰り返し＋乱獲リスク, slice 1 済み）.** user 設計: **materials 直接付与は NG →
  装備/アイテムを渡す**（materials は低リスクで繰り返せる"ポイント"、貴重なエンチャント品はリスクを取ってこそ）。
  - [x] **slice 1 done.** room に `gatherTable`(treasureTable)＋`gatherMaxPulls`(既定4)。`_search` に繰り返し採取ブランチ:
    1回ごとに treasure ロール（rarity/affix＝エンチャント品可）で**アイテム1個**、pull ごとに乱入確率↑（pull×20%、管制室で低減）、
    max で枯渇。`begin_wandering_encounter(force)` 追加でオンデマンド乱入。Godot-native・gatherTable 未著述で no-op＝**parity 緑**。
    state.gatherPulls 遅延生成。terminal-line tl1f 保守端末を採取ノード化（W3a 廃案 event も差し替え）。Gate `verify_gather.gd`。
  - [x] **slice 2（乱獲→rarity 上昇）done.** `roll_treasure_item` に `luck` 引数を追加（rarity/affix を `luck` フロア分
    深く引く）、gather は `luck = pulls` を渡す＝**乱獲するほど深フロア相当の rarity＝貴重なエンチャント品はリスクの先**に。
    chest は luck=0 で不変・parity 緑。verify_gather/chest 緑。
  - [ ] **slice 3（任意）**: 採取ログの文言、枯渇の見せ方、実画面 PNG 確認。

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
