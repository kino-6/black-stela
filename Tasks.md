# Tasks — active playtest backlog

## Conventions (READ FIRST)

- **Status markers:** `[ ]` = not started · `[-]` = in progress · `[x]` = done (awaiting move to Archive).
- **Every task NAMES its Gate** — a headless gate/test proven to fail on the pre-fix code where one fits,
  else the explicit manual/visual check. A task is not `[x]` until its gate is green **and** it is committed.
- **Done → Archive, groom on EVERY status change (user rule 2026-08-05).** When you touch a task's status,
  in the SAME edit move any freshly-`[x]` item out to `docs/archive/Tasks.completed-2026-08.md` (leave a
  one-line pointer), collapse verbose done blocks, delete dead notes — this file holds only open work.
- **One at a time.** Process the active queue top-down; finish (verify + gate + commit) before the next.
- **Verify it YOURSELF before HANDING a check to the user (user rule 2026-08-11, "あまりに無責任").** Before you
  ever hand a check back, answer two questions and act: (1) **Can I verify this myself?** render the real screen
  to PNG and READ it / run the gate / probe the value — do it. (2) **Did I give a ONE-SHOT way to see it in the
  real game?** Pointing at a `godot/tests/*.png` file or "walk there" is NOT that — add/name a `debug_fixtures.gd`
  fixture or boot flag that jumps straight to the exact screen, so the user confirms in one action.
- **Build / verify:** `npm run export:godot && npm run play`. Truth gate `npm run gate:final` (e2e); unit
  `npm run test`; Godot gates `npm run gate:migration` / `gate:godot`; runtime-error gate `gate:godot-runtime`.
- **Codex delivery flow:** Codex leaves finished work UNCOMMITTED; 検品 (named gate + read the PNG) + commit is Claude's job.
- **Lanes:** Codex owns art / assets / **visual sign-off** (primary implementer does NOT self-approve visual
  completion). Claude owns rules / data / renderer wiring / parity / gates.
- **NEVER commit/push with a red gate, and NEVER rationalise a red as "無関係/WIP" (user rule 2026-08-12).**
  A red unit/build test is a STOP. If it is genuinely someone else's WIP, PROVE it (does it fail on `main`?)
  before proceeding — a9a8dad shipped a half-finished D6 as "無関係" when the failure was in that very commit.
  CI going red is a defect to fix, not noise to ignore. The `pre-push` gate (below) now enforces this locally.
- **Pre-push gate (fast half of CI, local):** `git push` runs `npm run gate:prepush` → typecheck + unit **in
  parallel** (~10–20s); a red push is BLOCKED. `git push --no-verify` bypasses once for deliberate WIP;
  `GATE_FULL=1 git push` escalates to full `gate:ci`. e2e + Godot parity stay in CI (too slow per push).
  Installed via `core.hooksPath=.githooks` (package.json `prepare` sets it on `npm install`).

Archived history: `docs/archive/Tasks.completed-2026-08.md`, `docs/archive/Tasks.completed-2026-07.md`,
`Improve.md`. Future/deferred design ideas (unapproved): `docs/design/ballistic-world-program.md`.

**Recently shipped:** Y/D + Codex D-series 検品 + Claude 実機playtest (`a9a8dad`) · Tasks groom + dungeon-dock
ux-parity fix (`88cb96c`) · 玄室/W2/W4/W5 実装確認・active queue clear (`30beb83`). `export:godot` 全通・
`gate:migration` 90 PASS・`gate:final` e2e 緑.

---

## Active queue (process top-down)

- [ ] **BLK-1 — feat/n-dungeons の class 状態を green に整合（a9a8dad 半完成の後始末）.** `pre-push` gate が検知:
  a9a8dad は D6（解錠帯域）の enabler として Swordmaster を `exploration:{unlock:"trained"}` にしたが、旧
  トリップワイヤ2件が未更新で赤 — `classCapabilities.test.ts`（swordmaster unlock を "untrained" と主張）と
  `coverageSim.test.ts §9.4e`（`hasSecondaryExplorationClass()===false` かつ traps に secondary party 無しと主張）。
  D6 でこれらは false/stale に。`partyPlans("traps")` は filler に既に swordmaster を含むため、secondary/none の
  カテゴリが混濁する = coverage model の設計判断を伴う。**方向（keep+finish / back-out）は user 確認待ち。** Gate: `npm run gate:prepush` green.
- [ ] **#15 — tl1f 隣接 gated ショートカット追加.** user は「隣接gated通路（推奨）」を選択。ただしこのタイル迷路は隣接
  `.` セルが自動開通のため、迷路構造の編集（壁タイル→通路セル or filler 調整）が要る。良い配置の解析途中で BLK-1/
  ブランチ整理に割り込まれ中断。再開時: `scripts/shortcut_analysis.mjs` を JSON 構造（world.world.dungeons）に直して
  「迷路距離が遠い2地点を壁1枚で繋ぐ」箇所を選定 → edge+gate(requiredFlag: flag.tl1f.signal-routed) → floor graph/実機で検証。

### 完了（このセッション 2026-08-12、Archive 待ち）

- [x] **ブランチ整理.** local 33本・remote 14本の merged ブランチを削除（全て main に取り込み済み＝損失なし）。未マージの
  作業ブランチ `feat/n-dungeons` のみ温存。open PR 無しを確認済み。
- [x] **pre-push gate 新設.** `scripts/gate-prepush.mjs`（typecheck+unit を並列）・`.githooks/pre-push`・
  `core.hooksPath`・`typecheck`/`gate:prepush`/`prepare` script。CI放置NGルールを Conventions に明記。
- [x] **#14 — terminal-line 近接FX.** 基本近接攻撃で slash が撃破対象に乗る（`5298c90`）。実機PNG確認・戦闘テスト緑。

**（旧・空キュー注記）** Claude レーンの実装・検証は全て完了、全ゲート緑、commit 済み。玄室 / W2 / W4 / W5 は
実装済み＋ゲート緑＋実機PNG提示済みで、残るのは **user/Codex の目視サインオフ（人の判断）のみ** — これは backlog タスク
ではないため active queue には置かない。NG が出た項目のみ、その時点で再オープンする。未承認の将来設計アイデア（W3a 弾薬案
ほか）は `docs/design/ballistic-world-program.md` と archive に deferred として保管。

### 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段（黒板→照らし直し）:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方（W2/W4 壁床/敵/浸水）:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
