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

### P — 2026-08-03 夜 実機playtest バッチ（最優先・player-facing）

- [x] **P1 戦闘ログの対象名欠落**（「に7ダメージ！」で敵名が空）— `_enemy_ja` が撃破/ドロップ済みグループで空を返す。
  スナップショット時(生存中)に `name_ja` を保存し beat/撃破ログで live→snapshot フォールバック。**「〜を撃破」の
  英語名**も同時解消。Gate: `gate:godot-runtime`（combat_controller）+ 実機。
- [x] **P2 町Escは迷宮メニュー（隊列メニュー）を開く**（設定でない）＋**設定パネル中央寄せバグ**（`PRESET_CENTER`
  を size 確定前適用→右下に伸びる→`CenterContainer`）。Gate: `gate:godot-runtime`（town_controller）+ 実機。
- [x] **P3 affixキーリーク**（`affix.affix.verdant.thorn-fanged 茨の鞭` 生表示・二重prefix）— `I18n.t("affix."+id)`
  が authored affix(id既に`affix.`)を二重化。`Fmt.localized_affix_label(world,id)` を新設し town_format/dungeon/
  chest_panel の3箇所を差し替え（world.affixes の ja ラベル優先、built-inはbare id）。「ランダムエンチャント
  見えない」の一因。Gate: chest_loot_label + 実機。
- [x] **P4 全体図「立ち去る」→「地図を閉じる」**（`play.chestLeave`誤用→`play.closeMap`、値も「地図を閉じる」）。
- [x] **P5 ランタイムSCRIPT ERROR自動検出Gate**（ユーザー要望「毎回指摘、Gateで検出して」）— `get_viewport()`
  null（`_input`でシーン遷移後の`set_input_as_handled`）＋ tree外`grab_focus`。consume-before-dispatch へ並替、
  `_grab_focus_safe`ガード、`_ensure_focus_in`のviewport null塞ぎ。**新Gate `gate:godot-runtime`**（scripts/
  godot-runtime-gate.mjs：controller/loop scenes をheadless起動しSCRIPT ERROR系シグネチャで fail）。緑確認済。
- [~] **P6 装備メニュー：装備不可の候補を出さない＋「均等」表示の是正**
  - **[x] 「均等」廃止（済・commit）:** `_gear_effect_summary`（godot town_format）＋ `gearEffectSummary`（React
    format.ts）で hp/mp/再生/耐性(ward) も要約。ward護符は「HP +4 / 耐性」と出て「均等」は消滅。真に無効果のみ
    「変化なし」。i18n に effectHp/Mp/Regen/Ward 追加（ja+en）。Gate: verify_chest_loot_label に「gearは均等を出さず
    実効果を出す」アサート追加、緑。
  - **[x] 候補ソート（済・commit, Godot）:** party_panel.gd で装備可能を先頭・不可を後方（disabled=淡色＋理由）に
    sort_custom。verify_dungeon_controller「ineligible stays visible with a reason」緑維持。
  - **[ ] 残: React候補ソートのパリティ**（PartyMenuPanel の候補リストも equippable-first に）＋ 候補順序の
    専用アサート（現状は sort が自明＋回帰テストで担保）。
  - **（参考）根因メモ:** `town_format.gd:format_equipment_effect`（=React `describeEquipmentEffect`/
    `format.ts formatBonusParts`）は **攻/防/命/速の4statしか出さず**、hp/mp/resistBonus/elementResist/regen を持つ
    装身具は parts 空→`format_bonus_parts` が `I18n.t("aptitude.balanced")`＝「均等」にフォールバック。つまり
    *aptitude用語の誤用*であると同時に *効果表示が不完全*。修正＝**gearの全効果（hp/mp/resist/element/regen）を
    要約表示**し、真に無効果のときだけ中立表記（「均等」は使わない）。godot+React両方（パリティ）。Gate:
    town_format のユニット or verify_dungeon_controller に「resist装身具の効果が"均等"でなく実効果を出す」アサート。
  - **候補の並べ替え（user確定 2026-08-04）:** **装備可能を上・装備不可を下に淡色（＋理由）**。フィルタで消さず、
    現行「ineligible stays visible with a reason」テストと両立させつつ、装備可能→装備不可の順にソートし不可品を
    グレーアウト＋理由（例「装身具のみ」）を各行に。godot party_panel.gd（候補リスト構築）+ React PartyMenuPanel/
    ShopPanel。Gate: verify_dungeon_controller に「候補は装備可能が先頭・不可は淡色で理由付き」アサート追加。
- [ ] **P7 戦闘アニメ中に敵味方HPバーが減らない** — Godot beats は player→敵beatのみ(`combat_round.gd:138`)。
  味方バーは全beat後(`combat.gd:651`)に一括更新＝アニメ中は据置。React beat は per-beat `groups`/`party`
  スナップショットを持つ(rulesEngine.ts:1239)。Godot beat に snapshot を載せ、両バーを beat 単位で駆動する。
  Gate: verify_combat_numbers 拡張 + 実機。
- [~] **P8/P9 憧れ装備ラインナップ＋探索ユーティリティ＝「面白さGate」**（user 2026-08-04）
  - **[x] 面白さGate（済・commit fffd83d/2d96784）** `tests/funGate.test.ts`：世界ごとに ①憧れ武器＋防具（shop購入可・
    price ≥ 250・最高価格武器=最強）②探索ユーティリティ(kind∈{utility,escape}≥3＋帰還手段)。**両世界LIVE緑**。
  - **[x] B: sim整備＋両世界再校正（済・commit 6fa2785）** user「Bで順当に」。3 coupled 課題を解決:
    1. **armorBonus バグ修正**：verdant防具が `armorBonus`(schema未定義でZod strip)→防御0だった。armorBonus→defenseBonus
       (bark-buckler/moss-hood/bark-plate)。React/Godot 両方 `defenseBonus` を読む。
    2. **floor-aware loadout**：`descentSim` の generalLoadout/bestWeaponFor/bestResistFor を tier=降下進捗 proxy で
       各フロア到達tierのみに（uptoFloor 任意・既定∞、降下ループが floorIndex 渡す、simParity不変）。終盤装備を序盤に
       着る artifact 解消。
    3. **再校正（方針A=実測INTENT基準）**：preparedMinLevel ≤4→≤5（levelsSaved 9 健在）／「floor 1 gates」を生存ベース
       施設差（provisioned shopped=生還・naive=沈む）／verdant scarcity を clearLevel-1（縁で押す一撃）で測定＝kit が
       g10f で枯渇。全balance gate緑・full suite緑・simParity不変。
  - **[x] Verdant 憧れ帯投入（済・commit 2d96784）**：iron-edge(150,中)/reaver-axe(320,t3)/ironbark-cuirass(300,t3
    defenseBonus) を g7f/g3f unlock で shop に。availability-aware sim が tier-3 を終盤のみ装備するので **balance 緑維持**
    （＝sim整備の狙い通り）。funGate verdant aspirational を todo→LIVE。
  - **[ ] P8 ドロップ増量（残・同 pass の続き）**：「全職業の全装備が概ね揃う」までドロップ率/量↑＋ランダムエンチャント
    頻度↑（content/worlds/*/ の treasure/loot table）。sim は gear ドロップをモデルしないので balance-safe。loot sim で検証。
    参考：`availability:"limited"`(scenario.ts:240) は消費側未実装＝「1個限定」は要機能追加。
- **既知の赤（私の作業外・要対応）:** `tests/itemAlternatives.test.ts` + `tests/techniqueLines.test.ts` が
  **terminal-line（Codex 052fdaa の未完 world; worldRegistry の glob が拾う）**で赤（unlock道具無し・fire未宣言）。
  私の変更を stash しても再現＝既存。**#31 terminal-line F1/F2 完遂**まで、または draft world を registry/invariant
  から除外するまで残る。truth gate(`gate:final`)がこの2件で赤なので注意。
- [~] **P10 階段が見つからない（発見性）** — *論理は正常*（TS/Godot両grid に g2f.001→g1f, g2f.exit→g3f の階段セル
  存在、`verify_dungeon_controller` の stairs判定PASS）。階段セルに立てば `決定=階段` が出る。問題は**下り/上り
  階段が同じ「階段」表示で区別できず降り口が分からない**こと。
  - **[x] ラベル区別（済・commit）:** context ラベル＆ dock を、目的階の world.dungeons 順序で **「次の階へ降りる」
    / 「前の階へ戻る」** に出し分け（`_stairs_target_floor_id` + `_stairs_is_descent`）。Gate: verify_dungeon_controller
    に方向判定アサート（b2f→b3f=降下 / b2f→b1f=上昇）追加、緑。
  - **[ ] 地図記号の下り/上り区別（残）:** full map / minimap で下り階段と帰還(上り)階段を別記号・別色にし、
    100%踏破後でも降り口が一目で分かるようにする（floor_map.gd）。これが「探せない」核心の残り半分。

---

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
  - **判断確定（user 2026-08-03）:** **(c) クリーン再生成（Verdant風で統一）** — bespoke ギミックは捨て、
    ミニボスは keep ボスとして保持。B8 も再生成対象（B7–B10 が Act III/真層）。
  - **試行と発見（2026-08-03、コミットせず revert）:** `genDefaultFloors.mjs` を table 再利用に拡張し b2–b10 を
    生成→ **2つの障壁**を確認。① **バランスが崩れる**：再生成フロアの玄室（確定戦闘）で curve が段差化
    （b4f が 6%＝target 60-42% を大きく割る崖、深部 b8/b9≈2%・b10 mid WIPE）＝閾値でなく per-floor 玄室/pack の
    実バランス再チューニングが必要。② **25テストが赤**：純 bespoke 13（rulesEngine "runtime gates and shortcuts"＝
    lock/teleport/spinner/dark_zone/secret/damage-tile/gather/key-vault、削除でOK）＋ **実機能**（block-cap 構造・
    rest point・checkpoint 復帰・trap disarm・debug traces・summary）の更新が必要。→ **腰を据えた1パス**（生成器
    再構築＋玄室/pack バランス再調整＋feel レビュー＋テスト整理）で実施すべきと判断し、崩れた状態をコミットせず退避。
  - **フロア単位の試行（b2 のみ、2026-08-03、これも revert）:** 生成器を floor 単位＋玄室数可変に拡張し b2f を
    再生成（77%、Act I 帯内・up/down stair 修正・chamberGuardian/maze ルール緑）。だが **`descentSim` の act 曲線
    テストが赤**：曲線は**グローバルな clearLevel 相対**で測るため、b2 に玄室（確定戦闘）を足すだけで clearLevel が
    整数ジャンプ→中盤(act2)が clearLevel 相対で軽くなり `act2<act1` が崩れる（玄室2個でも同じ）。加えて underpower
    係数（フロアの推奨Lv依存）と summary count も要更新。→ **結論：T29 は incremental 不可**。default の難易度は
    グローバル指標なので、**全フロアの玄室/pack を一括で調整＋難易度ゲート（act 曲線・underpower）を玄室前提に
    再キャリブレーション**する holistic 1パスが必要。かつ**設計上の緊張**：default は Verdant 並みの玄室密度を
    curve を壊さずには入れられない（玄室=確定戦闘で XP/attrition が増える）。玄室数・ゲート厳格度は**難易度設計判断**。
  - **Gate:** `dungeonDesign.test`（各階を免除リストから外し、密度・ループ・正直スイープ300–360・on-path分岐・
    近道・玄室）＋ `chamberGuardian.test`（door-choke）＋ `difficultyGate`/balance sim ＋ `verify_parity`/
    `verify_flow` 緑＋各階の実機キャプチャ。
  - **注:** 下記 T31 で両世界が10階化されるため、対象は **B2–B10**（B9/B10 は新規、作り込み保持は B2–B8）。

- [-] **T31 — 両世界を10階に拡張（真層＋真ボス）** — 真層アート／実機キャプチャまで完了、**全体Gate再緑待ち
  （2026-08-03）**。**Verdant**(`18a0dc5`)：
  g9=rootheart(シナリオ)/g10=worldheart(真ボス、新規)。**Default**(`65d5a5f`)：b9=ash-votary(シナリオ、block-cap
  でb10を封鎖)/b10=dark-stela(真ボス、新規、`genDefaultFloors.mjs`)。両世界ともdescentSim自動10階化、全ゲート10F化、
  prepared非全滅・act曲線維持。並行T29のB2F再生成で `descentSim` の幕別圧力テストが赤のため、T31を完了／push扱いには
  しない（T31自身のアート・fixture・asset gateは緑）。
  - **T31アートとフィール確認（Codex, 2026-08-03）:** B10「黒碑の主」とG10「世界樹の芯」を clean-alpha の base/hurt
    スプライトへ置換。両世界に真層専用 `stone-wall/floor-block4.jpg` を追加し、React/Godotとも**10Fだけ**block4を選ぶ。
    B10は低輝度の専用パレットで黒曜石の継ぎ目と歩行面を可読に維持。実ランナーで B10/G10 の迷宮と真ボス戦のキャプチャを
    再撮影し、深層パーティに対する接地・シルエット・画面内の読みやすさを確認。`dungeonView`、asset gate、floor_10
    fixture、export、Godot boot はアート反映時に緑。現在は並行T29のB2F再生成で全体再検証を保留している。
  - user 決定 2026-08-03。現行8階を **10階**へ**地続きで延伸**。
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
  - **鉄雨火器帯（Codex, 2026-08-04 完了: data + asset contract）:** ユーザー指示により、Terminal Lineの武器選択を工業工具・
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
      catalogは全37装備へ増補済み。Godotの鍛冶屋／装備画面の実機キャプチャはW5の全世界フィール確認で閉じる。
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
