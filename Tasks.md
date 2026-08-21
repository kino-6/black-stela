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

### #42 終端隔離線が「スカスカで、非常にヌルい」（user 2026-08-20）

**計測した事実**（推測ではなく、今日の実測。再現は `npm run sim:balance -- --world terminal-line --level 1`
と `content/worlds/terminal-line/dungeons/*.md` のカウント）:

| 観点 | 終端隔離線 | 比較（黒碑 / 翠碑） |
| --- | --- | --- |
| 難度ノブ | `threatScalar 1.35` / `counterplayBoost 1.1` | 2.5 / 2.0 ・ 2.2 / 3.0 |
| 準備の価値 | prepared clear **@Lv17**、levelsSaved 8 | prepared @Lv3 ・ @Lv1（目標は「入場レベル近傍」） |
| 携行品の価値 | **PROVISION levelsSaved = 0**（キットを積んでも何も買えていない） | — |
| 資源経済 | **`balance.economy` 未著述**＝枯渇なし | — |
| act カーブ | tl1f 27%（目標 85–65%）… tl7–9f 1–2%（目標 38–28%）＝band外・非単調 | — |
| フロア密度 | **tl2f–tl10f が全て 12室 / イベント2 / 宝7 / 遭遇6 / 施錠0 の同一テンプレ** | tl1f だけ イベント8・宝13 |

**読み解き:** 「ヌルい」の実体は敵の強さ以前に **attrition が存在しないこと**（資源が枯れない・携行品に価値がない・
枯渇しないので押し引きの判断が生まれない）。「スカスカ」の実体は **2階以降が同一テンプレの反復**で、階ごとの固有の
判断（ルート選択・情報行動・資源交換・脅威・ランドマーク）が tl1f にしか著述されていないこと。施錠が全階ゼロ＝
鍵・近道・迂回という迷宮の骨格が無い。方針は `.claude/skills/drpg-balance`（attrition が難度・資源で上限を作る・
危険は必ず予告する・押すか退くかが本体・FOE・act 構造）に従う。**Sim を先に動かしてから著述する。**

- [ ] **#42a 目標値の確定とベースライン固定（小）** — 上表を `docs/design/difficulty-design.md` に終端隔離線の節として
  記録し、目標を数値で置く（prepared clear ≒ 入場レベル+2 以内 / levelsSaved ≒10 / act band 内 / PROVISION >0）。
  以後のスライスはこの数値に対して測る。**Gate:** `npm run sim:balance -- --world terminal-line`（出力を doc と一致させる）。
- [ ] **#42b 資源経済を入れる＝attrition の土台（中）** — `balance.economy` を著述し、回復・弾・携行枠が遠征中に枯れる
  ようにする。目的は「あと1部屋 vs 引き返す」を成立させること。**受け入れ:** PROVISION levelsSaved > 0（キットが生存を
  買う）かつ 携行品だけで無双できない（大きすぎない）。**Gate:** `sim:balance` の PROVISION 行＋`npm run test`（descentSim）。
- [ ] **#42c 難度カーブの再配置（中）** — `threatScalar` / `hpScalar` / `counterplayBoost` と深層の per-floor 敵著述で、
  Act I を緩く・Act III を張り詰めた形に直す。今は Act I が Lv1 で 27%、Act III が 1–2% ＝ 入口が理不尽で終盤が致死。
  **受け入れ:** prepared clear が入場レベル近傍に降り、act band 内で単調に締まる。**Gate:** `sim:balance` の TROUGH 表＋
  `npm run test`（descentSim / 該当 world のバランステスト）。
- [ ] **#42d フロアの脱テンプレ化（大・本丸）** — tl2f–tl10f に階ごとの固有性を著述する。各階に最低 1 つずつ:
  見えるルート選択 / 結果を伴う情報行動 / 資源交換 / 戦闘か回避の判断 / 記憶に残るランドマーク。
  **Gate:** `verify_first_floor_density.gd` を全階へ拡張（下の #42h）。**注意:** 密度を変えると first-contact の
  遭遇数が変わる＝バランス変更。必ず `sim:balance` を再実行する。
- [ ] **#42e 施錠・鍵・近道（中）** — 現状 locked=0。施錠扉と鍵、2–3 階ごとの一方通行ショートカットを入れ、
  戻りの税を下げつつ「押すか退くか」を残す。**Gate:** `gate:dungeon-interaction` ＋ 実画面 PNG。
- [ ] **#42f 回避可能な過強敵（FOE 相当）（中）** — act ごとに 1 体、序盤は逃げ・後で狩れる相手を配置。既存の
  front-blocker / back-caster squad が種。**必ず予告する**（見える・鳴る・記述される）。**Gate:** encounter 側の
  headless 検出器＋`sim:balance`（FOE を避けた場合のカーブが崩れないこと）。
- [ ] **#42g act 終端のスパイク（中）** — 3 階ごとの締めに mini-boss か通行料（資源を要求する関門）を置き、
  緊張→解放のリズムを作る。**Gate:** `sim:balance` の該当フロア trough が band の下端に触れること。
- [ ] **#42h 検出器の拡張（小・#42d と対）** — `verify_first_floor_density.gd` を「全フロア密度」検出器に拡張し、
  同一テンプレの反復（今回の見落とし）を機械が落とせるようにする。act band と PROVISION>0 も headless で固定。
  **Gate:** 新 `gate:floor-density` を `gate:migration` に接続し、拡張前のデータで**赤くなることを確認してから**入れる。

**進め方:** #42a → #42b/#42c（ヌルさの是正・数値で即効） → #42d/#42e（スカスカの是正・著述が本体） → #42f/#42g
（起伏） → #42h（再発防止）。各スライスは AGENTS.md の完了規約どおり、gate 緑＋実画面確認まで含めて 1 つずつ。

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
