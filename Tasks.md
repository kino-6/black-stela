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

**W0の最初の成果:** 正式タイトルは未決。`鉄雨の零番線` は「メガテン感・蒸気感が弱い」として採用しない。
実装開始前に、蒸気・銃器・近現代オカルトの交点を持つタイトル候補（例：`黒煙の零番線`、`零号封鎖線`、
`終端隔離線`）と、表示名に依存しない仮 world id を提示して確定する。確定までの設計・アート発注では
作業名「封鎖線」を用いてよいが、プレイヤーに見える世界選択名を仮名で固定しない。

- [ ] **W0 — 銃器DRPG世界「封鎖線」の核を承認する** — 具体たたき台を
  `ballistic-world-program.md` に記載：零番線を追う封鎖地下都市、共有弾薬＋階層警戒度、第一層の
  「銃で安全を買う／迂回して弾を残す」二択、F1–3駅／F4–6保守圏／F7–8隔離局の三幕。W0ではこの体験を承認し、
  正式タイトル・world id・結末の選択を確定する。第一幕の主役は有限弾薬の資源管理であり、射線／制圧の本格拡張は
  W4以降へ分離する。
  - **Gate:** 設計レビューで、世界の一文／3幕／第一層の二択／共有弾薬・警戒度の役割／既存二世界との差を承認。
    外部作品の固有設定を持ち込まない。

- [ ] **W1 — 新世界パックの骨格とアセット契約を作る（W0後）** — `content/worlds/<new-id>/` に閉じた
  world packの正規形、`world.md`、`ART.md`、世界固有コピーの入口を作る。ただし世界選択への登録、既存データへの
  変更、共有アセットの上書きはしない。
  - **Gate:** scenario pack schema/content validation。未登録のため通常プレイに影響しないこと。

- [ ] **W2 — A0ルック開発: 都市地下の構造アセットを実機で承認（W1後）** — 駅／保守圏／隔離局の壁・床3帯、
  防火扉・封鎖扉、保守階段／リフト、避難梯子、帰還標識、保管庫、戦闘・拠点背景の14系統を生成して第一層の
  小さな検証マップに配置する。アートは「鈍い公共インフラ、雨、摩耗、低い天井」であり、ネオン・過剰発光・石壁の
  色替え・巨大なボス門を避ける。詳しい構図／材質／色は設計書のA0指定に従う。
  - **Gate:** `npm run export:godot` + レンダー検証、1280/1920の実機キャプチャ。Default／Verdantと並べて
    構造だけで別世界に読めること。強い全画面フラッシュ・過剰発光なし。

- [ ] **W3a — 最小銃器ルールを独立実装（W0/W2後）** — 共有汎用弾、銃タグ行動、フロア警戒度0〜3、
  補給ロッカー／端末／帰還による警戒低下をTS oracleから実装してGodotへparity-portする。初期範囲には
  個別弾倉・手動リロード・部位狙い・遮蔽・武器改造を入れない。世界データやアセット量産と同じ変更に混ぜない。
  - **Gate:** 新Commandのgolden trace、`verify_parity`、save round-trip、既存二世界の回帰が緑。

- [ ] **W3b — 第一幕の垂直スライス（W3a後）** — 拠点→2フロア→戦闘→保管庫→帰還を新パックだけで通す。
  敵6種（base/hurt）、弾薬／医療／端末のアイテム、最初の守護者、部屋ランドマークを含める。
  - **Gate:** world registry/maze quality/encounter coverage/descentSim/treasure の新世界版、controller e2e、
    実機戦闘で敵の接地・シルエット・hurtの差を確認。

- [ ] **W4 — 8層・経済・職能・敵・文章を量産（W3b後）** — 各三層帯の敵、扉・階段・背景、玄室、
  アイテム、拠点の品揃え、環境文章を全量制作する。アセットは A1（第一幕）→A2（全層）の承認バッチで納品する。
  - **Gate:** 全フロアの迷宮品質・遭遇多様性・経済・難易度ゲート、各層の実機スクリーンショット。

- [ ] **W5 — 新世界の実機仕上げ（W4後）** — 全層を実プレイで通し、コントローラ、戦闘手触り、資産の配置、
  日本語の行組み、1280/1920の可読性を最終レビューする。
  - **Gate:** `npm run gate:final`、`npm run gate:migration`、Godot clean boot、現実機キャプチャと独立レビュー。
