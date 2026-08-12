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

- [ ] **#24 — 「つまらんダメージのみ」特技に固有効果＋Gate で排除（design+engine 判断要）.** 焼夷弾/徹甲弾 が共に「敵に小
  ダメージ」だけ（user 2026-08-12）。焼夷弾→炎上(burn)、徹甲弾→防御無視 が望み。**調査結果（2026-08-12）**: 技は content
  定義（`terminal-line/techniques.md`, 焼夷弾=`tl-incendiary-round`/徹甲弾=`tl-slug-round`、共に `kind:damage` のみ）。
  `CombatStatus = poison|fear|silence|sleep|ward` で **炎上(burn/DoT) も 防御無視 も未実装** → **core-combat エンジン拡張が必要**:
  (a) burn＝継続ダメージ状態（poison が DoT なら fire 版として流用可か要確認）、(b) 防御無視＝ダメージ計算に armor-bypass 修飾子。
  加えて **Gate**（user 提案）: ダメージ持ちで固有効果（status/inflicts/scope 等）ゼロの「フラットダメージのみ」技を FAIL させる
  content-quality テスト＋**閾値の design 判断**（全攻撃技に効果必須か、素朴な通常攻撃系は allow-tag で許容か）。Godot-native で
  可（core ルール変更＝parity 維持か Godot 正のどちらか選択）。クイックではなく次の集中スライス。
  **実装プラン（調査で確定・次セッションで着手）:**
  - **⚠ 徹甲弾=防御無視は不可（既に全技のデフォルト）:** プレイヤー技ダメージは combat_round.gd 403 で既に `roll_damage(...,0)`＝
    **全技が armor 無視**（基本攻撃のみ 159 で armor 適用）。よって「徹甲弾 防御無視」は差別化にならない。徹甲弾には**別の固有効果を
    デザイン要**（例: 装甲持ち敵に bonus / crit 上昇 / 一時的 armor-shred など）＝user と相談。
  - **焼夷弾=炎上(burn)〔新規で妥当〕:** poison が既に DoT（combat_round.gd 251「ROUND END: poison bites」、`_tick_status_list`→`poisonDamage`）。
    `CombatStatus` に `"burn"` 追加（types.ts＋zod）、`_tick_status_list`/`STATUS_WEAR_OFF` に burn を DoT として追加（poison 同型・
    fire フレーバー）、i18n ラベル＋status pip、`tl-incendiary-round` に `inflicts:{status:burn}`。React 側は archived なので
    Godot-native（parity トレースが該当技を使わなければ verify_parity 影響なし＝要確認、使えば retire）。
  - **Gate:** `kind:damage` を持ち `status`/`inflicts`/`allEnemies`/`ignoreDefense` 等の固有性ゼロの攻撃技を列挙して FAIL。
    素朴な通常攻撃系を許すなら `tags:[basic]` を allow に。閾値は着手時に user 確認。

## Backlog / ideas (no home yet)

（なし）

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
