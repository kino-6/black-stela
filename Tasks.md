# Tasks — active playtest backlog

## Conventions (READ FIRST)

- **Status markers:** `[ ]` = not started · `[-]` = in progress · `[x]` = done (awaiting move to Archive).
- **Every task NAMES its Gate** — a headless gate/test proven to fail on the pre-fix code where one fits,
  else the explicit manual/visual check. A task is not `[x]` until its gate is green **and** it is committed.
- **Done → Archive, groom on EVERY status change (user rule 2026-08-05).** When you touch a task's status
  (`[ ]`→`[-]`, `[-]`→`[x]`, add a task…), in the SAME edit move any freshly-`[x]` item out to
  `docs/archive/Tasks.completed-2026-08.md` (leave a one-line pointer), collapse verbose done blocks, and
  delete dead notes — this file holds only open / in-progress work and never re-bloats.
- **One at a time.** Process the active queue top-down; finish (verify + gate + commit) before the next.
- **Verify it YOURSELF before asking the user (user rule 2026-08-11, "あまりに無責任").** Before you ever hand a
  check back to the user, answer two questions: (1) **Can I verify this myself?** If yes — render the real
  screen to PNG and READ it, run the gate, probe the value — do it; never offload a check you can run.
  (2) **Did I give a ONE-SHOT way to see it in the real game?** Pointing at a `godot/tests/*.png` file is NOT
  that. Provide a debug fixture / boot flag / command that jumps straight to the thing (see `debug_fixtures.gd`
  — add a named fixture for the exact screen), so the user confirms in one action, never by walking there.
- **Build / verify:** `npm run export:godot && npm run play` (godot/data is gitignored). Truth gate
  `npm run gate:final` (= `FINAL_GATE=1 playwright test`, the e2e set); unit `npm run test`; Godot gates
  `npm run gate:migration` / `gate:godot`; runtime-error gate `npm run gate:godot-runtime`. Read
  `.claude/skills/controller-first-ui` before any menu/focus work.
- **Codex delivery flow:** Codex leaves finished work UNCOMMITTED (`M`/`??` on Codex files = done-not-committed,
  usually not mid-edit). 検品 (run the named gate + read the PNG) + commit is Claude's job.
- **Sessions may be split (user-authorised 2026-08-03).** Checkpoint on your own judgement: commit, update
  statuses here, update memory `black-stela-open-work` (+ `docs/handoffs/` if structural), start fresh.

Archived history: `docs/archive/Tasks.completed-2026-08.md` (T1–T32, P1–P8, U1–U6, V1–V5, W0/W1/W4 bands),
`docs/archive/Tasks.completed-2026-07.md` (earlier marathons), IMP records in `Improve.md`.

**Recently shipped (all merged, detail in git/archive):** U1–U6 + portrait pool + CI recovery + terminal-line
depot dungeon · V1–V10 Godot combat/UX playtest batch · P1–P8 · T29–T32 · **Y/D + X bands** (see below,
Codex D-series gate-verified 2026-08-11, commit pending).

---

## Active queue (process top-down)

### Y/D — 2026-08-10/11 terminal-line 実機playtest（銃の手触り＋Codex D-series）

**✅ Shipped（詳細は git commit）:** Y1 depot帰還階段2→1（`1b24c63`）· Y2 初期装備のシナリオ定義化（`e64e7b1`）·
D1 銃基本攻撃=掃射＋射撃ナレ（`57d9bc4`）· D2 早期フロア大群化（`7e3d823`）.

**[x] Codex D-series — named gate 緑・検品済（2026-08-11 Claude QA）、COMMIT 待ち:**
- **D3** 銃撃FXを射手カードから分離（family別 travel/impact を敵フィールドで再生、muzzle撤去）— `verify_firearm_fx` 緑.
- **D4** 敵群の残数でシルエット/床をリサイズしない（後衛 body を消すだけ）— `verify_combat_geometry`/`verify_combat_numbers` 緑.
- **D5** Terminal Line 全階段・帰還地点を実機可視化 — `verify_stairs_render` 緑.
- **D6** 解錠成功率の帯域Gate＋TL再調整 — `verify_lockpicking_bands` / `lockpickingBands`(TS) 緑.
- **D7** 戦闘結果の成長一覧を一画面に収める — `verify_front_controller` 緑.
- **D8** 帰還で踏破記録をロールバックしない — `verify_played_loop` 緑.
- **D9** Terminal Line の不可解な座標跳躍を禁止 — `verify_grid_transit` 緑.
- **D10** F2「浸水ホーム」を浅水として可視化 — `verify_flooded_platform_render` 緑（F2に浅水/反射/水位痕、乾いた床は乾いたまま）.

### X — 2026-08-06/07 自己検出（裏画面検証 / capture→read PNG）

**✅ Shipped（詳細は git commit）:** X1 敵HPバー整理（`2bd52e7`）· X2 ギルド説明ステップに立ち絵（`3bd1c5d`）·
X3 町の下重みグラデ暗幕で背景アートが読める（`b00401f`）· X4 迷宮開幕ログを世界別コピーに（`f25ecb3`）·
X5 施設パネルの巨大空白を content 駆動高さに（`2fb3410`）.
**軽微（任意）:** 記録の間「魔物図鑑/魔物」は terminal-line（機械敵）に非テーマ→中立語 or per-world copy を要検討。

- [-] **玄室 landmark visual tuning**（Codex art-lane）— gate緑（`verify_verdant_chambers`）だが **Codex 視覚 re-review PENDING**。
  直近 NG(#3): grand portal が過大（ボス門化）＋室内に淡緑の円形cap。修正: portal を通常木石扉の~1.1–1.3倍へ、
  cap/glow を暗中立石＋低コントラスト床印へ、天井高/奥行きで「小部屋」に。primary implementer は視覚完成を self-approve しない。

**設計メモ（将来・未承認, user 2026-08-05）:** 銃器の「必須弾薬管理」は面倒として廃案。代替案（未承認）—
(a) 特殊弾頭＝状況を変える戦略消耗品（貫通/焼夷/閃光、既存 damage/status/debuff で解決、Claudeレーン完結）·
(b) 警戒度＝世界樹風にエンカウント率をカラー表示（一部 Codex アート依存）。

## 将来世界プログラム — terminal-line（封鎖線）

**隔離ルール:** 既存 Default/Verdant・玄室リテイク・既存ゲートを止めない。設計とアセット契約の唯一の入口は
[`docs/design/ballistic-world-program.md`]。W は一つずつ進め、固有 Gate 緑＋commit で `[x]`＋Archive。
**Claude↔Codex 受入契約:** Claude=シナリオ受入（manifest/world.md/dungeons/data の受入集合＋ID対応表を handoff に。
画像の出来で数値・構造・文章を変えない）。Codex=正規データ化＋アセット生成/投入（`ART.md` に id→basename→寸法→用途→状態）。
`content/worlds/<id>/` に有効な `world.md` が入れば `worldRegistry` 自動検出＋`export:godot` が自動生成（手動コピー禁止）。

- **W0/W1 — DONE（archive）:** 表示名「終端隔離線 — 零番線」/ id `terminal-line`。F1/F2＋乗換広場を canonical pack 化。
- [ ] **W2 — Codex A0 構造アセット:** 上/中/深層 壁床6枚（1024² seamless）、通常/封鎖扉差分、下り貨物リフト、上り非常
  階段/避難梯子、帰還標識、閉/開保管庫、報酬/拠点/入口/戦闘スチル。W1 マップに扉/上下/帰還/保管庫を現在セル/edge の物理位置で配置。
  **Gate:** `export:godot`、`verify_stair_renderer`、該当レンダー検証、1280/1920 実機キャプチャ。
- [ ] **W3a — 廃案→将来案に置換.** 元の「共有弾薬＋警戒度」は撤回。上の設計メモ (a)(b) が後継（未承認）。
- [ ] **W3b — 遊べる縦切り（Claude データ＋Codex アセット）:** F1/F2・乗換広場・戦闘・保管庫・帰還を一周。
  **Gate:** world registry・maze quality・encounter coverage・treasure・descentSim・controller e2e・`selfplay:browser`・実機キャプチャ。
- [-] **W4 — F3–F10 量産（大半 Codex 投入済、archive）.** maze/階段/帰還/イベント/宝/進行/経済＋深層敵帯＋装備帯＋
  火器系列（制式4系列×5＋鉄雨、48装備、長銃 F1=三八式）＋補給（全32装備・17物資）投入済。
  **Open:** [~] 終端火器技術帯（40 active＋6 passive、装備由来・terminal-line限定）を TS/翻訳/beat/loadout に実装・`terminalLinePrepack` 緑・Web緑。
  残: `export:godot` が default B3F `room.b3f.003` trace 不整合で `export:traces` から進めず、Godot 実機 capture/controller/selfplay 未完。
  [~] 火器銃撃エフェクト（Codex）: 4系列×3種=12枚 512² RGBA を戦闘ビート重ね描き用に。**Gate:** data test・parity trace・capture・selfplay。
- [ ] **W5 — 実機仕上げ（Claude+Codex）:** `ART.md`↔ID表 照合で未配線/default fallback/未確認hurt/開封済み保管庫/見えない
  導線をゼロ化。Claude=ルール/セーブ/日本語 最終確認。debug/import UI を通常プレイに露出させない。
  **Gate:** `gate:final`、`gate:migration`、Godot clean boot、controller/selfplay、1280/1920 キャプチャ＋独立レビュー。
