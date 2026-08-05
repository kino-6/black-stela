# Tasks — active playtest backlog

## Conventions (READ FIRST)

- **Status markers:** `[ ]` = not started · `[-]` = in progress · `[x]` = done (awaiting move to Archive).
- **Every task NAMES its Gate** — how it is verified and locked so the bug cannot silently return: a
  headless gate/test where one fits (proven to fail on the pre-fix code), otherwise the explicit
  manual/visual check. A task is not `[x]` until its gate is green **and** it is committed.
- **Done → Archive.** Once a task is `[x]` + gate green + committed, move it OUT of this file to
  `docs/archive/Tasks.completed-*.md`. This file holds only open / in-progress work.
- **Groom on EVERY status change (user rule 2026-08-05).** Whenever you touch a task's status (`[ ]`→`[-]`,
  `[-]`→`[x]`, add a new task, …), do a short grooming pass in the SAME edit: move any freshly-`[x]` items
  to the archive (leave a one-line pointer if useful), collapse stale/verbose done blocks, and delete dead
  notes — so this file never re-bloats between big cleanups. Grooming is not a separate later chore; it
  rides along with the status update that triggered it.
- **One at a time.** Process the active queue top-down; finish (verify + gate + commit) before starting
  the next. Newest requests append to the bottom of the queue unless re-prioritised.
- **Build / verify:** `npm run export:godot && npm run play` (godot/data is gitignored). Truth gate
  `npm run gate:final` (unit + e2e); Godot gates `npm run gate:migration`; runtime-error gate
  `npm run gate:godot-runtime` (boots the controller/loop scenes headless, fails on any SCRIPT ERROR /
  null-method / tree-focus fault). Self-build + verify before handoff (AGENTS.md). Read
  `.claude/skills/controller-first-ui` before any menu/focus work.
- **Sessions may be split (user-authorised 2026-08-03).** When the working context grows large, the
  implementer decides on its own when to checkpoint: commit finished work, update this file's statuses,
  write a handoff (memory `black-stela-open-work` + `docs/handoffs/` if structural), and start a fresh
  session. No need to ask — judge, hand off, switch.

Archived history: `docs/archive/Tasks.completed-2026-08.md` (the 2026-08-03 playtest marathon — T1–T28),
`docs/archive/Tasks.completed-2026-07.md` (the 2026-07-27/29 marathon + earlier), and the
IMP-060/061/062/063/064 completion records in `Improve.md`.

---

## Active queue (process top-down)

### U — 2026-08-04〜 実機playtest 追加要望（user 指摘）

**✅ U シリーズ全完遂 + merged to main（2026-08-05、詳細は `docs/archive/Tasks.completed-2026-08.md`）:** U1 戦闘オート
二系統化 · U2 顔/全身ポートレート使い分け · U3 CLASS_CAPABILITIES 外部化＋terminal-line 全8職テーマ化 · U4 Save 再設計
（シナリオ別 autosave＋手動3スロット＋Load browser） · **U5=T30 1シナリオ N 迷宮**（`world.entrances`＋`DungeonFloor.dungeon`
グループ、町に迷宮ごとの入口、validator/sim を per-group 化、back-compat＝既存 world 不変・nDungeons.test 6本、`9e866f3`） ·
**U6 階段 FPV 描画**（セル中心 stairhead marker で全 facing 可視、`verify_stairs_render` gate、`222249f`） · ポートレート選択
プール（world.portraits、chara 素材20枚） · CI（GitHub Actions）赤の完全復旧。
- **U5 残（follow-up・任意）:** 実際に「2つ目の迷宮」を持つ world は未オーサリング（機構のみ＝nDungeons.test で実証）。上下階段
  矢印のグリフは配列順比較のまま（別グループ跨ぎは descent 既定＝無害）で据置。実 world に第2迷宮を足すのはコンテンツ作業。

### P — 2026-08-03 夜 実機playtest バッチ（最優先・player-facing）

- [x] **P1–P8 実機playtest バッチ — DONE + pushed**（戦闘ログ対象名 / 町Esc / affixキー / 全体図 / ランタイム
  ERROR 検出Gate / 装備効果サマリ / 味方HPバー drain / ドロップ増量 等）。詳細は `docs/archive/Tasks.completed-2026-08.md`。

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

- [x] **T29 Default B2F–B8F 迷宮＋玄室 再生成 / T31 両世界10階拡張（真層＋真ボス）— DONE + merged** (`6a23dba`)。
  詳細は `docs/archive/Tasks.completed-2026-08.md`。

- [x] **T30 — 1シナリオ N 迷宮の機構 — DONE + merged**（= U 節 U5、`9e866f3`）。詳細は archive。

- [x] **T32 職ごと6枠戦闘セット制約の撤廃 — DONE + merged** (`b89e6e5`)。詳細は archive。

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
  - **運用確定（2026-08-03）:** ユーザーの `terminal-line` 実装指定により、表示名は「終端隔離線 — 零番線」、
    folder/world id は `terminal-line` とする。受入境界は
    `docs/handoffs/2026-08-03-terminal-line-w1-receipt.md`。ClaudeのF1/F2 canonical data到着後にのみW1を登録する。

- [-] **W1 — F1/F2のシナリオデータを正規 world pack とアセット契約へ変換する（Codex → Claude review）** — **Codex,
  2026-08-03 開始。**
  **運用訂正（ユーザー指示、2026-08-04）:** 受入待ちを理由に、Map・部屋イベント・敵・遭遇・宝・進行データを
  未作成のままにしない。**Codex** がW0の世界設定を入力に、F1/F2・乗換広場を実際にロード可能な canonical pack として
  authorし、**Claude** は後から受入レビューと数値／文章の調整を行う。共有弾薬・警戒度など既存二世界に触れる固有ルールは
  W3aまで持ち込まず、W1では既存の安定したscenario schemaだけで縦切りを成立させる。
  `manifest.md` と `world.md`、全data file、少なくともF1/F2の連続グリッドを揃え、`ART.md` に次を固定する：
  renderer固定basename（`stone-wall-block1..3.jpg`／`stone-floor-block1..3.jpg`／`wood-door.jpg`／
  `stair-down.png`／`stair-up.png`／`return-marker.png`／宝箱・報酬スチル）、全enemyのbase/hurt、全world固有
  item/equipment icon、town/combat/entrance still の対応表。Codexはここで**データの変換・不足参照の返却・
  アセット名の正規化**を担当し、Claudeの受入済み数値・文章・IDを静かに書き換えない。
  - **Gate:** `loadScenarioPack`／scenario content validation が緑、`npm run export:godot` が world JSON と
    asset staging を自動出力、既存Default/Verdantが同じexportで回帰しないこと。これはデータ受入証明であり、
    まだプレイ品質の証明ではない。
  - **W1 data acceptance:** F1/F2には入口・下り／上り・帰還・二経路の教示遭遇・ロッカー報酬・端末イベントを
    current-cell／edgeデータとしてauthorし、6敵・4アイテム・3装備・2 treasure tableの全IDを参照可能にする。
    floor JSONを手書きせず、Markdown source → `loadScenarioPack` → exportの経路だけを使う。Claude reviewで変更されたIDは
    `ART.md` の対応表で追跡する。
  - **先行実装（ユーザー指示、2026-08-03）:** Claudeが現行世界の修正中にも、未登録プレパック
    `content/worlds/cordon/` で以下を作り込む。`world.md`、迷宮grid、数値、遭遇、報酬、共有銃器ルールは作らず、
    Claude受入の代わりにしない。受入時にIDが変わったものは生成理由ではなく対応表で解決する。
    1. W0のF1/F2敵6 IDに**各base/hurt**（768² clean-alpha、role/size/elevation記録）を作る。
    2. `item.tl-*` 4件、`equip.tl-*` 3件に対応する256² clean-alpha iconを作る。
    3. 保安通路／浸水ホーム／補給ロッカー／端末のランドマークを作り、A0の扉・階段・保管庫・報酬stillとの
       配置意図を文書化する。これは壁から生えた階段、HUD下の床印、ログだけの報酬を先に防ぐ。
    4. `docs/handoffs/` のART receiptを完成させ、受入済みcanonical packが届いた時に**コピーではなく
       own-basenameの昇格**だけで投入できる状態にする。
  - **先行Gate:** 全ファイルの形式・basename・base/hurt footprintを検査し、`npm run export:godot` でプレパックが
    world registryに混入しないことを確認する。これはアセット／受入準備の証明であり、通常プレイのUX証明ではない。

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

- [ ] **W4 — 10層を量産し、受入データとアセットを帯ごとに完結させる（Claude + Codex）** — **2026-08-04:
  ユーザー指示により Terminal Line は F10 まで構築する。**Codex** は F3–F10 の maze、玄室、イベント、遭遇、
  宝、経済、進行データを先に三帯（F3／F4–F6／F7–F10）で投入し、各帯をGate緑のコミットにしてから次へ進む。
  **Claude** はその受入データをレビューし、共有ルール・職能・文章の必要な調整を別コミットで確定する。Codexは確定IDを
  入力に、各帯の敵4種以上＋守護者のbase/hurt、武器・消耗品icons、扉／階段／背景差分、重要宝・帰還地点stillを
  A1（第一幕）→A2（全層）で生成・投入する。F10は終端の真ボスと帰還不能にならない終幕導線を持つ。各バッチごとに
  `ART.md` の「予定／生成済み／実機確認済み」を更新し、1枚の既存アセット流用や敵名だけの差し替えで完了扱いにしない。
  - **進行（Codex, 2026-08-04）:** F3–F10の19×19 maze、上下階段、帰還点、端末イベント、宝、進行フラグ、
    経済表をcanonical packへ投入済み。深層の遭遇はF1/F2の6敵の暫定表から外し、玄室ごとに専用守護者表を参照する。
  - **深層敵帯（Codex, 2026-08-04 完了: data + asset contract）:** 暫定のF1/F2敵参照を、F3の中継保守帯、F4–F6の雨水・補給・記録帯、
    F7–F10の統制・昇降・終端帯それぞれの固有catalogへ置換する。各IDは own-basename の768² RGBA
    base/hurt一対を持ち、機械／人型／獣型／大型守護者の高さと輪郭を重複させない。F10には終端固有の真守護者を
    置き、既存「駅務長〈無人〉」をボスの名前だけ差し替える代用にしない。
    - **受入:** F3–F10の各遭遇表が当該深度帯の3種以上を参照し、F10の玄室には専用守護者を置く。catalogの全IDが
      `enemy-<own-basename>.png` と `-hurt.png`（ともに768² RGBA）へ解決され、F1/F2の6種だけで深層を埋めない。
      `ART.md` にID→basename→用途→生成状態を残す。実機1920での接地／画面内可読性はアセット投入後のフィール確認として残す。
  - **装備帯（Codex, 2026-08-04）:** Terminal Line固有の武器・防具・補助装備をF1からF10までtierごとに
    追加する。銃・近接・後列支援・前衛防具・状態対策を同一の最適解にせず、購入可能な初中盤品、探索で得る横選択、
    F10の固有報酬を分ける。既存worldの装備や新しいルールを変更しない。Data-onlyではicon未生成を明示し、
    所持・装備画面の実機確認とicon投入は後続のアセット帯で閉じる。
    - **受入:** 各深度帯に少なくとも武器2種と別slotの防具／補助品があり、全6slotが有意味な候補を持つ。終盤報酬は
      単なる数値上位でなく、弾薬／警戒度ルールの実装前にも機能する既存ステータス・耐性・属性の選択であること。
  - **装備アイコン帯（Codex, 2026-08-04 完了: asset contract）:** F1の3件に続き、F2–F10の全23 `equip.tl-*`
    に own-basename の256² RGBA clean-alpha iconを投入する。銃器・近接／杖・盾・頭・胴・手・装身具は、同一の
    記号や単なる色替えにせず、一覧の小寸法でもslotと材質が区別できる正面寄りの単品として作る。
    - **受入:** 全26装備IDが `icons/equip-tl-*.png` に解決し、全6slotに最低1枚の固有物体があること。pack testは
      寸法・RGBA・ID集合を検査し、通常の所持／装備画面でdefault fallbackを使わない。実機メニューでの小寸法可読性は
    controller traversalと併せて別途確認する。全26の個別アイコンを生成・投入済み。
  - **鉄雨火器帯（Codex, 2026-08-04 実装済み・全migration gate保留）:** ユーザー指示により、Terminal Lineの武器選択を工業工具・
    儀礼具だけへ寄せず、架空名ながら現代的な軍用火器として読める自動小銃、短機関銃、散弾銃、指定射撃銃、軽機関銃を
    F2–F10へ加える。実在メーカー・実在モデル名は使わない。既存の共有弾・警戒度が未実装である以上、連射・リロード・
    騒音値を数値や説明で偽装せず、現行の攻撃／命中／速度／装備可能職の横選択だけに落とす。
    - **Human expectation:** プレイヤーが終末駅の準軍事的な探索者として、木製ハンドガードや曲線弾倉を持つ無骨な
      自動小銃を含む、ひと目で銃器と読める装備を選べる。
    - **Red flags / past trouble:** 工具・杖の再着色、実在銘の無断利用、未実装のフルオート／弾薬管理を説明だけで約束すること。
      武器は所持／装備画面でdefault fallbackや小さすぎる輪郭にならない。
    - **Browser evidence:** Godotの鍛冶屋／装備画面で、少なくとも自動小銃と短機関銃の日本語名・補正・256² iconが
      同じ安定したcontroller focus面で読めるキャプチャを残す。headlessはcatalogとasset解決だけを証明し、見た目は証明しない。
    - **受入:** 5種すべてが `equip.tl-*` data、世界固有の256² RGBA icon、shopまたはF帯宝へ結線される。曲線弾倉の
      自動小銃、短機関銃、散弾銃、指定射撃銃、軽機関銃が小寸法で別シルエットに読め、pack testが全IDを検査する。
      catalogは全37装備へ増補済み。Godotの通常市場で在庫を統合し、アイコン・和名・補正・装備可能者を実機キャプチャで確認済み。
      `gate:migration` は本作業と無関係の既存UX parity 3件（party aptitude.balanced 2件／dock play.useStairs 1件）で停止中。
  - **制式火器更新系列（Codex, 2026-08-04 実装済み・全migration gate保留）:** ユーザー指示により、単発の銃器カタログを「拾った一挺」だけで
    終わらせず、同じ役割を維持したままF1–F10で更新していく系列へ拡張する。通常の購入・比較で理解しやすい
    **拳銃／長銃／短機関銃／散弾銃**を各5段階にする。長銃のF1は歴史銃をそのまま商品化せず、Terminal Lineに残った
    `三八式歩兵銃`（長い木製銃床・ボルトアクション・固定弾倉）として登場させる。軽機関銃は支援火器の終盤横選択として
    残し、未実装の弾薬・連射・騒音ルールを数値や説明で約束しない。
    - **Human expectation:** 序盤に手にした拳銃、古い小銃、短機関銃、散弾銃が、終端へ近づくほど一目で同系統の
      上位機種へ替わっていく。三八式歩兵銃は、終末駅に残された旧制式の長銃として木部と長い銃身で読める。
    - **Red flags / past trouble:** 既存iconの色替えだけ、同名の数値違い、実装されていないフルオート／リロード効果の
      偽装、1カテゴリだけがすべての職と数値で最適になること。三八式の実在銘はユーザーが明示指定した一挺に限り、
      他の機種名は世界固有の架空名にする。
    - **受入:** 4カテゴリ各5機種（20件）がF1–F10の購入・宝へ結線される。各IDにown-basenameの256² RGBA iconを
      生成し、同一カテゴリでも銃床／弾倉／銃身／機関部の進化が小寸法で区別できる。各系列は攻撃・命中・速度・
      装備可能職の既存パラメータで横選択を残す。pack testは4×5の集合、三八式、icon解決、深度ごとの入手を検査し、
      通常市場のcontroller focus面を実機キャプチャで再確認する。48装備、4系列×5、11枚の新規iconを投入済み。
      三八式歩兵銃を選択した1920相当の市場キャプチャで、和名・木製長銃の輪郭・補正・装備可能者・安定focusを確認済み。
      `gate:migration` は本作業と無関係の既存UX parity 3件（party aptitude.balanced 2件／dock play.useStairs 1件）で停止中。
  - [~] **終端火器技術帯（Codex, 2026-08-04 実装・TS検証済、Godot実機待ち）:** ユーザー指示により、拳銃／長銃／短機関銃／散弾銃の4系列を、単なる攻撃値の違いでなく
    戦闘中の手触りまで分ける。各系列は5段階の対応銃から**2つずつ、計10個のアクティブ特技**を得る。装備中の銃が与える特技だけを特技欄へ出し、
    職の戦闘セットとは別に扱いつつ、Terminal Line以外の世界へ銃技が漏れないようにする。さらに装備に紐付く**自動適用パッシブ6種**を作る。
    パッシブは装備を外した瞬間に失われ、画面で読める。発砲数、弾倉、手動リロード、騒音、遮蔽、部位狙いはW3aの共有銃器ルールが来るまで名称・数値・演出のどれでも偽装しない。
    - **技の役割:** 拳銃は速い一点射と妨害、長銃は精密射・弱体化、短機関銃は複数目標／行動阻害、散弾銃は前衛の突破・防御崩しとする。各技は既存の
      damage/status/buff/debuff/ward/cureだけで実際に解決できる効果を持ち、対応する `firearm` + カテゴリtagの武器が無いと使用不可にする。
      パッシブは命中・速度・攻撃・防御・耐性の既存stat pipelineへ実装し、加算値と適用元を装備詳細で見えるようにする。
    - **Human expectation:** 同じ銃器系列を更新すると、数値だけでなく「次の二手」が増え、銃を持つ意味が一手で読める。技リストは現在の装備だけなので、
      戦闘コマンドを一覧地獄にしない。
    - **Red flags / past trouble:** 技名だけで実装されない効果、通常攻撃より常に得な無料技、全カテゴリ同じダメージ違い、職loadoutを黙って書換えること、
      マウス専用の新しい切替UI、英語のままの戦闘ラベル。過去の「green unit tests, dead command」を再発させないため、対象選択を含む通常戦闘で到達性を証明する。
    - **受入:** 4×10のactive idと6 passive idがcanonical technique catalogへあり、各idはTerminal Lineの対応装備からのみ取得できる。
      TypeScript oracle、engine export、Godot combat resolver、command menu、装備詳細が同じ条件で扱う。カテゴリ外へ持ち替えるとactive/passiveの両方が消え、
      controllerで `攻撃 → 特技 → 標的 → 決定` を完走できる。data test・Godot parity trace・通常プレイの1920/1280 capture・selfplayを残す。
    - **Headless/browser parity:** headlessはcatalog・装備条件・resolver同値を、実機は日本語ラベル、focus、対象選択、パッシブの可視性を証明する。
    - **実装記録:** 40 active + 6 passive を `TECHNIQUES`／翻訳／combat beat labelへ登録し、20丁すべてに2 active、該当する6丁に自動特性を結線した。
      武器由来activeはTS/Godotのloadout resolverでのみ加わり、持ち替えると消える。passiveは攻撃・防御・命中・速度・恐怖耐性の既存stat pipelineへ入り、
      装備詳細に表示する。`terminalLinePrepack` は実際のMP消費と未装備時の拒否、4×10、6 passive、カテゴリtag、stat差を検証済。focused unit 56件とWeb buildは緑。
      `export:packs`／`export:engine`／`export:i18n` は反映済。ただし全 `export:godot` は並行中default B3Fの `room.b3f.003` trace不整合で
      `export:traces` から先に進めず、Godot clean bootも実行環境のuser log/cache許可が拒否されたため、実機capture/controller/selfplayは未完了。
  - **補給・横選択拡充（Codex, 2026-08-04 完了: data + asset contract）:** ユーザー指示により、既存の装備26件と消耗品11件を
    F1–F10の選択として増補する。新規装備は早期の静かな近接／手slot、雨水帯の毒対策、荷役帯の防御offhand、
    中央局の精度head、終端の装身具へ分ける。新規消耗品は小／大回復、恐怖・沈黙回復、MP回復、解錠・解除の
    低コスト代替を持たせ、専門職の高難度性能を置換しない。既存7件を含む新／未生成item iconも同時に投入する。
    - **受入:** F1–F10の各深度帯で少なくとも一つの新しい物資か横選択装備が宝または補給台に現れる。全追加IDは
      own-basename 256² RGBA iconを持ち、shop/treasureの参照とitem/equipment catalogが一致する。既存worldや
    共有弾・警戒度の未実装ルールを変更しない。全32装備・全17物資を動的icon検査へ接続し、F2–F10の宝／補給台に
    新物資または横選択を配置済み。
  - **Gate:** 全フロアの迷宮品質、door-choke玄室、遭遇多様性、経済・難易度、content validation、各層の
    1920実機キャプチャ。各階で最低3つの異なる敵シルエットと、深度に応じた構造の変化を読むこと。

- [ ] **W5 — 新世界を実機仕上げし、受入／投入の欠落を閉じる（Claude + Codex）** — Codexは `ART.md` と
  scenario ID表を照合して、未配線・default fallback・未確認hurt・開封済み保管庫・迷宮の見えない導線をゼロにする。
  Claudeはルール／セーブ／日本語を最終確認する。両者ともdebug/import UIを通常プレイへ露出させない。
  - **Gate:** `npm run gate:final`、`npm run gate:migration`、Godot clean boot、controller/selfplay、1280/1920の
    実機キャプチャと独立レビュー。Past trouble note に、再発し得る「壁から生えた階段／浮く敵／ログだけの報酬／
    mouse-first操作／強いフラッシュ」を明記する。
