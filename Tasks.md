# Tasks — active backlog

## How to use this file (mechanics only — the RULES live in AGENTS.md)

- **This file is the TASK QUEUE, not a rulebook.** Durable rules / conventions / policies live in
  `AGENTS.md` (and `.claude/skills/**`, `docs/design/**`, auto-memory). Do NOT grow this file with them —
  see AGENTS.md "Where rules and improvements go".
- **Status markers:** `[ ]` not started · `[-]` in progress · `[x]` done (awaiting move to Archive).
- **Every task NAMES its gate** — a headless gate/test proven to fail on the pre-fix code where one fits,
  else the explicit visual/manual check. A task is not `[x]` until its gate is green AND it is committed.
- **One at a time.** Process the queue top-down; finish (verify + gate + commit) before the next.
- **Done → Archive, groom on EVERY status change.** When you touch a task's status, in the SAME edit move
  freshly-`[x]` items to `docs/archive/Tasks.completed-2026-08.md` (leave a one-line pointer here); collapse
  verbose blocks, delete dead notes. This file holds only open work.
- **An improvement / idea / follow-up with no home specified → append it to the fitting section below**
  (the active queue, or "Backlog / ideas"), so it is captured, not lost, and not dumped at the top as a rule.
- **Build / play:** `npm run play` (export + launch). Truth gate `npm run gate:final` (e2e); unit
  `npm run test`; Godot gates `gate:migration` / `gate:godot`; local pre-push `gate:prepush`.
- **Verify a player-facing change YOURSELF** (real screen → PNG → READ, or run the gate) before handing any
  check to the user; give a ONE-SHOT way to see it in-game (a `debug_fixtures.gd` fixture / boot flag).

Archived: `docs/archive/Tasks.completed-2026-08.md` (incl. the 2026-08-12 playtest #14–#21 / #15 + infra
batch, merged to main `8a5b41a`) · `Tasks.completed-2026-07.md` · `Improve.md`. Future/deferred design
ideas (unapproved): `docs/design/ballistic-world-program.md`.

---

## Active queue (process top-down)

- [x] **#22 — 勝利/レベルアップ画面の画面無駄遣いを改善（Archive 待ち）.** 中央の 920px col＋74px カードを、**col 1360px・
  カード行 96px・ポートレート 64×82・列間 22** に拡大し 1920 画面を充填（戦果/成長ボックスが幅 ~85% を使う）。`result.gd` のみ。
  実機PNG 1920×1080 で余白激減を確認＋既存 6人フィットガード（1280×720 で 探索へ戻る 画面内）・growth ≥16px 緑。
- [x] **#23/#25 — パーティメニュー全ページのキーボード完全到達＋本物の REACHABILITY ゲート（完了・Archive 待ち）.** 核心:
  従来ゲートは false-green（geometry ナビは headless/1920×1080 で全到達するのに実機で不安定）。信用できる基準は**明示
  `focus_neighbor` 配線だけ**。新ゲート（`verify_town_controller.gd`, viewport=1920×1080）: landing から**明示 neighbor のみ**を
  BFS し、ページ内 enabled+可視 Button と突合、到達不能を実名列挙。ヘルパ `_chain_column`/`_link_lr`/`_chain_tree_order`。
  **全6ページ（能力/編成/呪文/装備/所持品/貴重品）配線＝全 HARD FAIL 保護で緑**。dungeon/grid 回帰なし。

- [x] **#24 — 特技のダメージを「通常（防御適用）」に修正（Archive 待ち）.** 調査で判明: プレイヤー技は全て armor を無視して
  いた（combat_round.gd:403 が `roll_damage(...,0)`）＝設計上の手抜き。user 判断「では通常ダメージでいい」に従い、技ダメージも
  対象の armor を適用（`t_armor`）に修正。基本攻撃・敵ability と一貫。parity・combat-numbers・combat-controller 緑（golden
  trace は技×装甲を使わず無影響）。特殊効果（焼夷弾 burn 等）と排除 Gate は user がドロップ（通常ダメージで可）。
 焼夷弾/徹甲弾 が共に「敵に小
- [-] **#26 — Combat feel 改修: 通知UI連打 → 抑制の効いた DRPG の命中感.** 現状は 浮遊数字・PNG エフェクト・ログ更新が
  バラバラに動き「命中した」より通知連打に見える（user 2026-08-12, 詳細仕様提示）。通常攻撃を「敵が局所被弾 → その結果 HP と
  小さな数字が読める」重量感のある表現へ。**Godot-native**（`combat.gd` の playback／FX／数字／ログ／`combat_playback.gd`）。
  **進捗（pushed）:** ✅ **数字**=静止する`12`（マイナス廃止・rise/drift/scale-overshoot 撤廃・180–240ms 薄消え、`8b4925d`、
  gate `verify_combat_feel`）・✅ **撃破沈み/退色**（A⑥, `1ec26e2`）・✅ **ログ規律**=1手番1行、crit/撃破のみ独立行（D, `4e7e42e`）・
  ✅ **数字は結果**=FX着弾＋バー後に対象足元へ、命中で対象を6px沈める（A②④/B, `899ec7a`）・実機PNGで静かな`12`確認。
  **残:** A①（被弾前の対象明示 80–120ms＝カーソル/局所明度）・C（銃種別の命中テンポ pistol/rifle/SMG/shotgun・弾道/汎用PNG禁止）・
  B の多段Hit直列化を自動 gate 化・F（通常/クリ/撃破/SMG連射/散弾銃を 1280・1920 で capture 目視＋位置Tween/overshoot無しの自動検査）。

  **A. 必須の演出順序（1手番ごと）:** ①対象を 80–120ms 明示（カーソル／局所的明度のみ）→ ②命中フレームで対象 sprite を
  4–8px 短く沈める or 横振り → ③**同じ瞬間に対象 HP バーが減り始める** → ④ダメージ数字は対象の足元〜胴下に短く固定表示 →
  ⑤通常数字は 180–240ms で薄く消える（上昇・横流れ・バウンド禁止）→ ⑥撃破時のみ、消失前に短い沈み／退色。
  **B. 数字ルール:** 通常=小さめ・白〜鈍い赤灰・`-12` のアプリ風記号を廃し `12` 表記。クリティカル=金色可（大バウンド／爆発拡縮／
  画面フラッシュ禁止）。同一敵の複数Hitは**同時に積まない**＝80–110ms 間隔で同じ着弾点に直列。数字は「結果」＝**敵sprite・HPバー・
  着弾より先に出してはならない**。
  **C. 銃撃:** 味方カード／立ち絵／portrait から弾を出さない。長い弾道・UI 横断ビーム禁止。銃種差は主に**命中テンポ**で:
  pistol=一発短く硬い / rifle=一発やや長い停止＋強い沈み / SMG=短い2〜3連（数字もHPも小刻み同期）/ shotgun=近距離の広い局所衝撃・
  合算1数字。銃撃PNGは「着弾直前の小さな痕跡」と「局所着弾」だけ（敵全体を覆う汎用スタンプ禁止）。
  **D. ログ:** 通常Hitごとに更新しない。1キャラ1行動につき**開始か結果のどちらか1行**。クリティカル・撃破・状態異常だけ独立行可。
  ログ更新で固定UI・操作位置を動かさない。
  **E. 禁止:** 全画面フラッシュ／浮遊数字の上昇・横流れ・バウンド／被弾より先の数字／敵全体を覆う巨大PNG／味方カード発射／
  通常Hitごとのログ連打／UIレイヤー上の報酬通知風ポップアップ。
  **F. Gate・証跡（受入条件）:** 通常・クリティカル・撃破・SMG連射・散弾銃を capture。1280/1920 PNG で目視: (1)数字が敵に紐づく
  (2)数字より先に HP減少・被弾が始まる (3)HUD 横断弾道が無い (4)通常攻撃が騒がしくない。**自動 Gate**: 通常数値に位置Tween・
  scale overshoot・横ドリフトが**無い**こと、同一対象の複数Hitが**時系列に直列化**されることを検査（FAIL 可能に）。

## Backlog / ideas (no home yet)

（なし）

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
