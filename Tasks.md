# Tasks — active playtest backlog

## Conventions (READ FIRST)

- **Status markers:** `[ ]` = not started · `[-]` = in progress · `[x]` = done (awaiting move to Archive).
- **Every task NAMES its Gate** — how it is verified and locked so the bug cannot silently return: a
  headless gate/test where one fits (proven to fail on the pre-fix code), otherwise the explicit
  manual/visual check. A task is not `[x]` until its gate is green **and** it is committed.
- **Done → Archive.** Once a task is `[x]` + gate green + committed, move it OUT of this file to
  `docs/archive/Tasks.completed-*.md`. This file holds only open / in-progress work.
- **One at a time.** Process the active queue top-down; finish (verify + gate + commit) before starting
  the next. Newest requests append to the bottom of the queue unless re-prioritised.
- **Build / verify:** `npm run export:godot && npm run play` (godot/data is gitignored). Truth gate
  `npm run gate:final` (unit + e2e); Godot gates `npm run gate:migration`. Self-build + verify before
  handoff (AGENTS.md). Read `.claude/skills/controller-first-ui` before any menu/focus work.

Archived history: `docs/archive/Tasks.completed-2026-08.md` (the 2026-08-03 playtest marathon — T1–T28),
`docs/archive/Tasks.completed-2026-07.md` (the 2026-07-27/29 marathon + earlier), and the
IMP-060/061/062/063/064 completion records in `Improve.md`.

---

## Active queue (process top-down)

- [ ] **T13 refine — 受入条件を実測に合わせる（全滅強制はしない）** — Codex 2026-08-03：全員・無購入を
  B1Fで**必ず全滅**させる調整は**不要**（現状で無購入10%相当・購入済み64%、施設差は十分）。旧タスクの
  「施設なしでは1Fを突破できない」は実測と矛盾。受入条件を **「無購入フルパーティは薄氷でB1Fを生還できても、
  継続探索・B2進出は成立しない。帰還して準備する必然がある」** に直し、その実機証跡を追加する。難易度の
  再チューニングはしない（descentSim ゲートは現状維持）。

- [-] **玄室 landmark visual tuning** (Codex art-lane) — 3rd pass done, Codex re-review PENDING
  - **Codex NG #2 (2026-08-03):** even with the muted pass, the closed door read as a dark CORRIDOR from the
    approach (the floor seal is hidden under the party HUD), so the room's existence didn't read. Codex's fix
    list actioned this pass:
    - **Capture harness** (`capture_verdant_chamber_visual.gd`) already finds a DOOR/SECRET-choked chamber
      DYNAMICALLY and shoots the two required frames — `<out>-closed.png` (closed door head-on, one cell
      outside) and `<out>-inside.png` (one step in, door opened behind). (Was done in the prior pass; Codex
      re-verify — the G1F-fixed point is gone.)
    - **Camera pulled back** (`cameraPullback`/`cameraFov`, palette-tunable): a faced wall/door no longer
      fills the lens, so the doorway, its frame and the surrounding corridor read as context head-on.
    - **Grand portal = front-readable architecture:** a door that opens INTO a 玄室 is drawn as a grand
      portal — heavier jambs + a deep lintel beam rising nearly to the corridor ceiling, taller leaves filling
      it — so a sealed guardian room announces itself from the corridor, not via the HUD-hidden floor. Frame
      stays WOOD, no glow (the pale-stone frame was reverted: it read as a glowing Fallback — user feedback).
  - **Codex NG #3 (2026-08-03) — grand portal OVERSHOT.** The 玄室 door now reads as a BOSS castle-gate /
    face monument, not a repeatable 玄室 door; and the interior still reads as bare wall with a pale green
    circular cap growing from under the HUD (the old "unexplained green object"). Confirmed G1–G3. Fix list
    for Claude:
    - **Shrink the portal** from "grand" to a **sturdy wood-and-stone door ~1.1–1.3× a normal door** — so
      repetition never looks like boss staging.
    - **Remove/replace the pale circular cap + any glow** in the interior with dark neutral stone; the
      floor seal → a LOW-CONTRAST inlaid stone (Codex art retakes the texture).
    - **Interior structure above the HUD:** ceiling height, back-wall recession, stone frame must read as a
      "small room" — do NOT rely on the floor design (it's HUD-hidden).
    - Re-shoot 扉の手前 + 入室直後 WITH the HUD, G1–G3, and confirm the difference from a normal corridor reads.
  - **Gate:** visual review on the real build — **Codex art-lane sign-off** (primary implementer does not
    self-approve player-facing visual completion). Render gates green (dungeon-controller, verdant-chambers).

- [ ] **T29 — Default B2F–B8F を Verdant 同等の迷宮品質＋玄室に作り直す** — Verdant は全 g1–g8 が生成で
  フル迷宮ルール＋玄室を満たすが、Default は **B1F のみ**作り直し済みで **B2F–B7F は旧・手書きフロア**
  （`dungeonDesign.test` の `MAZE_EXEMPT` で免除中＝品質未達・玄室0、B8F はボス扱い）。**玄室（確定戦闘＋宝の
  小部屋）も追加**（user 決定 2026-08-03）。
  - **手法（調査確定 2026-08-03）:** `genFloorMaze.mjs` は open chamber しか作れず両世界の `chamberGuardian.test`
    （door-choke）を満たさない。**`genVerdantFloors.mjs` を fork した `genDefaultFloors.mjs`**（唯一 door-choke
    玄室を出力）で各階の完全 .md を生成する。既存の default 遭遇/宝テーブルを再利用（新規オーサリング不要）。
  - **要確定（user 判断・離席中のため保留）:**
    1. **階数 8 vs 10** — user 記憶では「10F（9F=シナリオクリア／10F=完全クリア）」だが、**現行の正式設計は
       8階**（dungeon-areas.md／descentSim／全ゲート）。10階化は幕構成・トラフ目標・9F/10F の内容とボス・全
       ゲートの再バランスを伴う設計変更。**先に 8/10 を確定**（B8=フィナーレか、B10=フィナーレかで B7/B8 設計が変わる）。
    2. **既存の作り込みの扱い** — Default の B3/B5/B6 ミニボス、B2/B4/B7 の lock 降下・クランク・鍵付き金庫・
       spinner・dark_zone・squad 等の**bespoke ギミックは Verdant 生成器には無い**。純生成すると失われる。
       **(a) 均一な Verdant 風で置換** か **(b) 生成迷宮＋玄室に既存ギミックを再配線** かを確定。
  - **進め方:** 破壊を避け、`genDefaultFloors.mjs` を作って **b2f をプレビュー生成（content/ を上書きしない）**して
    構造ゲート緑を実証 → user が上記2判断を下してから本適用・横展開・バランス再調整。
  - **Gate:** `dungeonDesign.test`（各階を免除リストから外し、密度・ループ・正直スイープ300–360・on-path分岐・
    近道・玄室）＋ `chamberGuardian.test`（door-choke）＋ `difficultyGate`/balance sim ＋ `verify_parity`/
    `verify_flow` 緑＋各階の実機キャプチャ。
  - **注:** 下記 T31 で両世界が10階化されるため、対象は **B2–B10**（B9/B10 は新規、作り込み保持は B2–B8）。

- [ ] **T31 — 両世界を10階に拡張（真層＋真ボス）** — user 決定 2026-08-03。現行8階を **10階**へ**地続きで延伸**。
  構成：3階ごとの雰囲気帯 B1–3 / B4–6 / B7–9（3幕）＋ **B10=真層（完全クリア）**。**B9=シナリオボス**（現
  フィナーレ ash-votary / rootheart を移設、既存アート流用）、**B10=真ボス**（新規）。B7/B8→Act III 深部トラッシュ、
  ボスは B9 へ。Verdant も同様（G1–G10、G9=rootheart、G10=新真ボス）。
  - **やること:** (1) Verdant は `genVerdantFloors` の FLOORS を10化して g9/g10 生成（生成世界なので容易）。
    (2) Default は b9/b10 追加（T29 の生成器と併せて）。(3) B10/G10 の**真ボス敵データ**を `enemies.md` に作成
    ＋遭遇/宝テーブル、(4) 幕再マップ（dungeon-areas.md 済）、(5) `descentSim`/`dungeonDesign`/`difficultyGate`/
    trough 目標を **10階へ延伸**（地続き）、(6) B10 は B9 撃破後に開く導線。
  - **アセット（Codex 発注済 `docs/handoffs/2026-08-03-10f-assets-request.md`）:** B10/G10 真ボスのスプライト
    （base+hurt）が critical path（無いと透明）。真層テクスチャは当面 block3 流用で可（後追い）。
  - **Gate:** `descentSim.test`/`difficultyGate`（10階の act 曲線・地続きトラフ・prepared 非全滅）＋
    `dungeonDesign`/`chamberGuardian`（新階も）＋ `verify_parity`/`verify_flow` ＋ 世界レジストリが g9/g10・b9/b10
    をロード＋ B9→B10 導線の e2e ＋各新階の実機キャプチャ。

- [ ] **T30 — 1シナリオに N 個の迷宮を持てるようにする（T29 後）** — 現在 world は迷宮1本（8階の降下）だが、
  1シナリオが複数の独立した迷宮を持てるようにする。world データモデル・ダンジョンレジストリ・町からの入口
  （どの迷宮へ潜るか選択）・セーブ（現在の迷宮 id）・階段/帰還の各迷宮スコープを拡張。既存の単一迷宮世界は
  そのまま動く後方互換を維持。
  - **Gate:** 複数迷宮 world がロード・選択・攻略・帰還・セーブ往復できる unit＋e2e、既存2世界の回帰緑、
    `verify_parity`/`verify_flow` 緑。

---

## 将来世界プログラム — 封鎖線（仮称、現行キュー外）

**隔離ルール:** この節は「着手予約」であり、現在のDefault／Verdantの修正、玄室リテイク、既存ゲートを
止めたり変更したりしない。W0を明示承認するまで `content/worlds/`・世界レジストリ・共有ルール・Godot画面へ
変更を入れない。詳細な設計とアセット契約は
[`docs/design/ballistic-world-program.md`](design/ballistic-world-program.md) を唯一の入口とする。

**実装指示（ユーザー、2026-08-03）:** 初回のルック開発は「アートは面白い」と了承され、**封鎖線世界を
実装へ移すことも明示指示済み**。実装者は現行キューを中断・横入りさせず、空いた順番で W0 → W1 → W2 →
W3a → W3b → W4 → W5 を一つずつ進めること。各Wは、ここに `[-]` と実装者・開始日を記し、固有 Gate を
緑にしてコミットした後だけ `[x]` にして Archive へ移す。次のWへ進むのに、改めて「実装してよいか」を尋ねない。
ただし、既存二世界／共通ルールに触れる W3a 以降は、この分離契約と当該 Gate を優先する。

### Claude → Codex の受入・投入契約（全Wで守る）

1. **Claude はシナリオ受入を担当する。** `manifest.md`、`world.md`、各 `dungeons/*.md` と
   `items/enemies/encounters/treasure/progression/quests/vocations/affixes.md` の受入済みファイル集合、及び
   ID一覧・未解決参照・階層／部屋／敵／アイテムの対応表を handoff に残す。文章の採否、迷宮構造、数値と
   ルールの決定を、画像の出来で勝手に変更しない。
2. **Codex は正規データ化とアセット生成・投入を担当する。** 受入済み集合を `content/worlds/<world-id>/` に
   取り込み、`ART.md` に「scenario id → own-basename → 寸法 → 用途 → 生成／実機確認状態」を記録する。
   Codex は壁・床・扉・階段・帰還標識・保管庫・UIスチル・敵base/hurt・アイコンを生成し、受入済みIDと
   basename を一対一に保つ。未受入の敵／部屋をアセット都合で増やさない。
3. **自動投入の境界を誤認しない。** `content/worlds/<world-id>/` に有効な `world.md` が入った時点で
   `worldRegistry` はそれを自動検出し、`npm run export:godot` が `godot/data/worlds/<world-id>.json` と
   `godot/assets/worlds/<world-id>/**` を自動生成する。手作業でGodotへコピー／登録はしない。これは**ビルド時の
   取込**であり、実行中Godotが任意の外部ファイルを読む機構ではない。未受入の草稿は `docs/handoffs/` に置き、
   有効な `world.md` を含む途中パックは `content/worlds/` へ入れない。
4. **一つのhandoffを一つの受入単位にする。** Codexは、受入ID表と `loadScenarioPack`／content validation が
   緑であることを確認してからアセットを投入する。投入後の共通コマンドは `npm run export:godot`。アセットは
   `docs/art/common.md` の形式・clean alpha・接地・低輝度規約を守り、強い全画面フラッシュを一切使わない。

- [-] **W0 — 世界の核・受入入力を確定する（Claude: scenario brief / Codex: art direction）** — **Codex, 2026-08-03 開始。**
  **Codex** は蒸気・銃器・近現代オカルトの交点を持つ正式タイトル候補（`鉄雨の零番線` は不採用）、表示名と
  独立した仮 world id、拠点／通勤圏／保守圏／隔離局、移動標識、保管庫、敵系統のルックボードを提出する。
  **Claude** は世界の一文、三幕、第一層の「銃で安全を買う／迂回して弾を残す」二択、結末の選択、及び初期2層で
  必要な room/enemy/item/encounter/treasure ID 表を受入する。正式タイトルはこのWで確定するが、プレイヤー表示名が
  決まるまで仮名を世界選択へ固定しない。
  - **成果物:** 承認済みタイトル・world id・世界一文・ID表・アート方向・`docs/handoffs/<date>-<world-id>-w0.md`。
  - **Gate:** 設計レビュー。銃が万能火力でなく有限弾薬による安全／時間の選択であること、既存二世界と構造的に
    異なること、外部作品の固有設定を持ち込まないこと。

- [ ] **W1 — 受入済みシナリオを正規 world pack とアセット契約へ変換する（Claude → Codex）** —
  **Claude** の受入ファイル集合を、**Codex** が `content/worlds/<world-id>/` の canonical pack に取り込む。
  `manifest.md` と `world.md`、全data file、少なくともF1/F2の連続グリッドを揃え、`ART.md` に次を固定する：
  renderer固定basename（`stone-wall-block1..3.jpg`／`stone-floor-block1..3.jpg`／`wood-door.jpg`／
  `stair-down.png`／`stair-up.png`／`return-marker.png`／宝箱・報酬スチル）、全enemyのbase/hurt、全world固有
  item/equipment icon、town/combat/entrance still の対応表。Codexはここで**データの変換・不足参照の返却・
  アセット名の正規化**を担当し、Claudeの受入済み数値・文章・IDを静かに書き換えない。
  - **Gate:** `loadScenarioPack`／scenario content validation が緑、`npm run export:godot` が world JSON と
    asset staging を自動出力、既存Default/Verdantが同じexportで回帰しないこと。これはデータ受入証明であり、
    まだプレイ品質の証明ではない。

- [ ] **W2 — Codex A0: 構造アセットを生成・配置して都市地下として読ませる（Codex）** — CodexはW1の
  basename表に対し、上層／中層／深層の壁・床6枚（各1024² seamless JPG）、通常扉、封鎖扉の差分、下り貨物リフト、
  上り非常階段または避難梯子、帰還標識、閉／開保管庫、報酬スチル、拠点・入口・戦闘背景を生成する。実装者は
  W1のF1検証マップに、扉・下り・上り・帰還・保管庫を**現在セル／現在edgeの物理位置**として置く。階段を壁から
  生やさず、通常扉をボス門にせず、床だけの印をHUD下へ隠さない。Codexは `ART.md` の生成済み欄と実機キャプチャを更新する。
  - **Gate:** `npm run export:godot`、`verify_stair_renderer`、該当レンダー検証、1280/1920実機キャプチャ。
    Default／Verdantと並べ、色替えではなく公共地下の構造として別世界に読めること。headlessは配置契約のみを証明し、
    実機は導線・接地・明度を証明する。

- [ ] **W3a — 最小銃器ルールを独立実装する（Claude: rules / Codex: data+art binding）** — **Claude** は
  TS oracle → export → Godot parity の順で、共有汎用弾、銃タグ行動、フロア警戒度（静穏／注意／警報）、
  補給ロッカー／端末／帰還による低下を実装する。**Codex** は受入済み弾薬・端末・医療品・銃／近接装備のdataと
  256² icon、警戒度を説明せず読ませる控えめなUI／ランドマーク素材を投入する。個別弾倉、手動リロード、部位狙い、
  遮蔽、武器改造は入れず、ルール実装コミットとアセット量産コミットを混ぜない。
  - **Gate:** 新CommandのTS golden trace、`verify_parity`、save round-trip、既存二世界の回帰。プレイヤー面は
    controller経路で残弾と警戒度の意味・発砲直後の変化を確認し、強い画面フラッシュを使わない。

- [ ] **W3b — 第一幕を、Claude受入データ＋Codex投入アセットで遊べる縦切りにする（Claude + Codex）** —
  F1/F2・乗換広場・戦闘・保管庫・帰還を一周させる。**Claude** は受入済み2層の連続grid、遭遇／宝／経済／
  一本道でない二択を実装する。**Codex** は敵6種の768² clean-alpha base/hurt、弾薬／医療／端末／運行鍵のicons、
  拠点／入口／戦闘still、駅改札・浸水ホーム・補給ロッカーのランドマークを生成・ID配線する。敵はcombat laneで
  接地し、戦利品は開封・獲得内容が中央の結果画面で読めること。
  - **Gate:** world registry、maze quality、encounter coverage、treasure、descentSim、controller e2e、
    `npm run selfplay:browser`、実機戦闘／報酬／帰還キャプチャ。headlessはルール到達性だけで、縦切りの手触りを
    代替しない。

- [ ] **W4 — 8層を量産し、受入データとアセットを帯ごとに完結させる（Claude + Codex）** — **Claude** は
  各層のmaze、玄室、遭遇、経済、職能、日英／日本語本文を受入・確定する。**Codex** は確定IDだけを入力に、
  三帯ごとの敵4種以上＋守護者のbase/hurt、武器・消耗品icons、扉／階段／背景差分、重要宝・帰還地点stillを
  A1（第一幕）→A2（全層）で生成・投入する。各バッチごとに `ART.md` の「予定／生成済み／実機確認済み」を更新し、
  1枚の既存アセット流用や敵名だけの差し替えで完了扱いにしない。
  - **Gate:** 全フロアの迷宮品質、door-choke玄室、遭遇多様性、経済・難易度、content validation、各層の
    1920実機キャプチャ。各階で最低3つの異なる敵シルエットと、深度に応じた構造の変化を読むこと。

- [ ] **W5 — 新世界を実機仕上げし、受入／投入の欠落を閉じる（Claude + Codex）** — Codexは `ART.md` と
  scenario ID表を照合して、未配線・default fallback・未確認hurt・開封済み保管庫・迷宮の見えない導線をゼロにする。
  Claudeはルール／セーブ／日本語を最終確認する。両者ともdebug/import UIを通常プレイへ露出させない。
  - **Gate:** `npm run gate:final`、`npm run gate:migration`、Godot clean boot、controller/selfplay、1280/1920の
    実機キャプチャと独立レビュー。Past trouble note に、再発し得る「壁から生えた階段／浮く敵／ログだけの報酬／
    mouse-first操作／強いフラッシュ」を明記する。
