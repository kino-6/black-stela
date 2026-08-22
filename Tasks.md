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

### #42 コンセプトのループを content に通す（終端隔離線）— user 2026-08-20

**位置づけ:** `AIPlan.md` の **First concept slice**（123-147行）が要求するループ —— 現在セルの可視イベントが
シーンを開く → 確立された称号 / 来歴 / 状態 / 武勲で 1 人を名指す → **2〜3 の著述された intent** を出す →
プレイヤーが選ぶ → **ルールが判定して typed event を出す**（AI は成否を決めない）→ **帰還時に NPC か記録が
その選択と結末を思い出す** —— が、content に**一つも存在しない**。M3 はこのための event / export の seam を
保持しただけで、載せる中身はまだ書かれていない。

**計測した事実**（`npm run sim:balance -- --world terminal-line --level 1` ＋ 著述カウント ＋ スキーマ確認）:

| 観点 | 現状 | 基準 / 比較 |
| --- | --- | --- |
| storylet | room の `event:` は**1 行の flavor 文字列**のみ。`DungeonEvent` も weighted flavour beat（types.ts 934/1029）。intent / check / consequence / memory のスキーマが**無い** | concept slice 4–8 |
| 分量 | 10 階あるが substantial なのは F1 だけ（F2–F10 は 12室 / イベント2 / 宝7 / 遭遇6 / 施錠0 の同一テンプレ） | publishable は **6–8 substantial floors** |
| 難度ノブ | `threatScalar 1.35` / `counterplayBoost 1.1` | 黒碑 2.5/2.0 ・ 翠碑 2.2/3.0 |
| 準備の価値 | prepared clear **@Lv17**、**PROVISION levelsSaved = 0**（キットが何も買えない） | 黒碑 @Lv3 ・ 翠碑 @Lv1 |
| 資源経済 | `balance.economy` **未著述**＝枯渇なし＝attrition が無い | — |
| act カーブ | band 外かつ非単調（tl1f 27% / tl7–9f 1–2%） | I:85-65% II:60-42% III:38-28% |

**読み解き:**「スカスカ」の本体は部屋数ではなく **storylet の不在**（選択・判定・帰結・記憶が無いので、部屋は
通過点にしかならない）。「ヌルい」の本体は **attrition の不在**（枯れないので準備も撤退も意思決定にならない）。
順序は **コンセプトのループを 1 階に通す → その選択が効くように圧力を作る → 残りの階へ展開**。圧力を先に上げても、
選ぶものが無ければ「ただ固い迷宮」にしかならない。

- [ ] **#42a storylet スキーマ（旧 #32-b を「任意ポリッシュ」から昇格）（大）** — 現在セルの可視イベントが
  **2〜3 の authored intent**（id は固定・文言は差し替え可）を出し、ルールが判定して typed event を返す構造を
  content スキーマに入れる。**provider 不在でも同じルートが完走できること**（concept slice 9）が受け入れ条件。
  **Gate:** スキーマ検証＋headless で intent→check→typed event が回ること＋実画面 PNG。
  **注意:** 著述は content/、検証と export は TS 側（Zod＋export:packs）、実行は Godot。Godot-native ポリシーの
  「TS へ機能を parity 移植しない」には抵触しない（オーサリング経路であって機能の二重実装ではない）。
- [ ] **#42b 世界が覚える（中）** — 受諾した intent と結末を canonical event に載せ、**帰還時に NPC か記録が
  想起する**（concept slice 8）。GmMemory の決定論側だけを作る。**Gate:** 潜行→選択→帰還で記録に出ることを
  headless で固定＋実画面。
- [ ] **#42c 名指し＝rule-selected adventurer（中）** — シーンが称号・来歴・状態・武勲で 1 人を選ぶ（slice 5）。
  選択は決定論、AI はその人物の感情を作らない。**Gate:** 同じ状態から同じ人物が選ばれることの検出器。
- [ ] **#42d F2 を substantial にする実証（大・判断ポイント）** — #42a–c を使って F2・浸水ホームを 15–20 分ルートに
  作り直し、**コンセプトが実際に面白いかを見る**。ここで面白くなければ、残り階へ展開する前に設計へ戻る。
  **Gate:** 実プレイ（PlayLog `./run.sh log` の step trail）＋密度検出器。
- [ ] **#42e attrition＝資源経済（中）** — `balance.economy` を著述し、回復・弾・携行枠が遠征中に枯れるように
  する。選択に重みを与える圧力。**受け入れ:** PROVISION levelsSaved > 0 かつ携行品だけで無双できない。
  **Gate:** `sim:balance` の PROVISION 行＋`npm run test`。
- [ ] **#42f 難度カーブの再配置（中）** — ノブ＋深層の per-floor 敵著述で Act I を緩く・Act III を張り詰めた形に。
  **受け入れ:** prepared clear が入場レベル近傍、act band 内で単調。**Gate:** `sim:balance` TROUGH 表＋`npm run test`。
- [ ] **#42g 残り階を substantial に（大・本丸）** — 6–8 階が基準。各階に最低 1 つの storylet ＋ 見えるルート選択 /
  結果を伴う情報行動 / 資源交換 / 戦闘か回避 / ランドマーク。**注意:** 密度を変えると first-contact の遭遇数が
  変わる＝バランス変更。都度 `sim:balance` を再実行。**Gate:** 全階密度検出器（#42i）。
- [ ] **#42h 迷宮の骨格（中）** — 施錠と鍵（現状 locked=0）、2–3 階ごとの一方通行ショートカット、act ごとに 1 体の
  回避可能な過強敵（必ず予告する）、act 終端のスパイク（mini-boss か通行料）。**Gate:** `gate:dungeon-interaction`
  ＋`sim:balance`（FOE を避けたカーブが崩れないこと）。
- [ ] **#42i 検出器の拡張（小・#42g と対）** — `verify_first_floor_density.gd` を全フロア密度検出器に拡張し、
  「同一テンプレの反復」と「storylet ゼロの階」を機械が落とせるようにする。act band と PROVISION>0 も headless で
  固定。**Gate:** 新 `gate:floor-density` を `gate:migration` に接続。**拡張前のデータで赤くなることを確認してから**入れる。

**進め方:** #42a → #42b → #42c → **#42d（ここでコンセプトの当否を判断）** → #42e/#42f（圧力）→ #42g（展開）
→ #42h → #42i。各スライスは gate 緑＋実画面確認まで含めて 1 つずつ。

## Backlog / ideas (no home yet; user decision required)

- **#33-b 拠点整備 slice3（任意ポリッシュ, 小）** — 上位 Lv を降下フラグで解禁（schema `unlockFlag` は実装済み・未著述）
  ＋整備場（materials 収量/錬成コスト減）を4つ目に＋帰還回復のログ1行。v1 は機能完成済みなので着手は任意・user 判断。
- **#32-b 迷宮イベント v2（選択肢付き対話）** → **#42a へ昇格**（2026-08-20）。コンセプト（AIPlan.md First
  concept slice）の中核であり「任意ポリッシュ」ではなかった、という判断。ここでは扱わない。
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
