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
  （`dungeonDesign.test` の `MAZE_EXEMPT` で免除中＝品質未達・玄室0、B8F はボス扱い）。B2F–B8F を
  `genFloorMaze.mjs`（棒倒し法＋玄室 carve）で作り直し、**玄室（確定戦闘＋宝の小部屋）も追加**（user 決定
  2026-08-03）。各階：シード選定→ASCII マップ移植→既存の遭遇/宝/階段＋新玄室の遭遇/宝テーブルを配線→
  `MAZE_EXEMPT` から解除。玄室で確定戦闘が増えるため **descentSim でバランス再調整**（prepare-or-wipe /
  act 曲線 / 免除解除後の maze rules を維持）。
  - **Gate:** `dungeonDesign.test`（各階を免除リストから外し、密度・ループ・正直スイープ300–360・on-path分岐・
    近道・玄室を要求）＋ `difficultyGate`/balance sim ＋ `verify_parity`/`verify_flow` 緑＋各階の実機キャプチャ。

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

