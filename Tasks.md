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
  that. Provide a debug fixture / boot flag / command that jumps straight to the thing (see `debug_fixtures.gd`).
- **Build / verify:** `npm run export:godot && npm run play`. Truth gate `npm run gate:final`
  (= `FINAL_GATE=1 playwright test`, e2e); unit `npm run test`; Godot gates `npm run gate:migration` / `gate:godot`;
  runtime-error gate `npm run gate:godot-runtime`. Read `.claude/skills/controller-first-ui` before menu/focus work.
- **Codex delivery flow:** Codex leaves finished work UNCOMMITTED (`M`/`??` on Codex files = done-not-committed).
  検品 (run the named gate + read the PNG) + commit is Claude's job.
- **Lanes:** Codex owns art / assets / visual sign-off (primary implementer does NOT self-approve visual
  completion). Claude owns rules / data / renderer wiring / parity / gates.
- **Sessions may be split (user-authorised 2026-08-03).** Checkpoint on your own judgement.

Archived history: `docs/archive/Tasks.completed-2026-08.md` (T1–T32, P1–P8, U1–U6, V1–V10, Y/D+X+D-series, W0/W1/W4),
`docs/archive/Tasks.completed-2026-07.md`, IMP records in `Improve.md`.

**Recently shipped:** U/V bands · **Y/D playtest + Codex D-series 検品 + Claude 実機playtest** (`a9a8dad`,
feat/n-dungeons, 2026-08-11 — detail in archive). `export:godot` 全通・migration gate 実行で確認。

---

## Active queue (process top-down)

> 残りは Codex アート／アセット待ち or user 承認待ちが中心（Claude 単独では完了不可）。Claude レーンの検証は緑。

- [-] **玄室 landmark visual tuning**（Codex art-lane）— gate緑（`verify_verdant_chambers`）。**Codex 視覚 re-review PENDING**。
  直近 NG(#3): grand portal 過大（ボス門化）＋室内に淡緑の円形cap。修正指針: portal を通常木石扉の~1.1–1.3倍へ、
  cap/glow を暗中立石＋低コントラスト床印へ、天井高/奥行きで「小部屋」に。**primary implementer は視覚完成を self-approve しない＝Claude 完了不可。**

**設計メモ（将来・未承認, user 2026-08-05）:** 銃器「必須弾薬管理」は廃案。代替案（未承認）—
(a) 特殊弾頭＝戦略消耗品（貫通/焼夷/閃光、既存 effect で解決、Claudeレーン完結）·
(b) 警戒度＝世界樹風エンカウント率カラー表示（一部 Codex アート依存）。

## 将来世界プログラム — terminal-line（封鎖線）

**契約:** 既存 Default/Verdant・玄室・既存ゲートを止めない。設計/アセット契約の入口は `docs/design/ballistic-world-program.md`。
Claude=シナリオ受入（manifest/world.md/dungeons/data、ID対応表を handoff。画像で数値・構造・文章を変えない）。
Codex=正規データ化＋アセット生成/投入。`content/worlds/<id>/world.md` 投入で `worldRegistry` 自動検出＋`export:godot` 自動生成。

- **W0/W1/W4 — 大半 DONE（archive）.** id `terminal-line`、F1–F10 maze/階段/帰還/イベント/宝/進行/経済＋深層敵帯＋
  装備帯（火器48含む、長銃 F1=三八式）＋補給。終端火器技術帯（40 active＋6 passive、装備由来・TL限定）実装・`terminalLinePrepack` 緑。
  **`export:godot` は 2026-08-11 に全通（旧 B3F trace ブロッカー解消済）。** 残: **Godot 実機 capture/controller/selfplay**（Claude 可）と
  **[~] 火器銃撃エフェクト（Codex アセット、fx-tl-*.png 生成済）** の実機配線確認。
- [ ] **W2 — Codex A0 構造アセット**（壁床6枚・扉差分・リフト/梯子・帰還標識・保管庫・スチル）を W1 マップに物理配置。
  **Gate:** `export:godot`（通）・`verify_stair_renderer`・1280/1920 実機キャプチャ。**→ Codex アセット待ち。**
- [ ] **W3a — 廃案→将来案（未承認）.** 上の設計メモ (a)(b) が後継。**→ user 承認待ち。**
- [ ] **W3b — 遊べる縦切り（Claude データ＋Codex アセット）.** F1/F2・乗換広場・戦闘・保管庫・帰還を一周。
  **Gate:** world registry・maze・encounter・treasure・descentSim・controller e2e・`selfplay:browser`・実機キャプチャ。**→ Codex アセット待ち。**
- [ ] **W5 — 実機仕上げ（Claude+Codex）.** ART.md↔ID表 照合で未配線/fallback/未確認hurt/見えない導線ゼロ化。
  Claude=ルール/セーブ/日本語 最終確認。debug/import UI を通常プレイに露出させない。
  **Gate:** `gate:final`・`gate:migration`・Godot clean boot・controller/selfplay・キャプチャ＋独立レビュー。**→ W2–W4 完了後。**
