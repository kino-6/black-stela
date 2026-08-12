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

- [ ] **#22 — 勝利/レベルアップ画面が画面を無駄遣い（UX 改善）.** 実機（`result.gd`）で上下に大きな空き＝成長カードが中央に
  小さく固まり画面を活かせていない（user 2026-08-12, スクショ）。#20 でフォントは上げたが、今回は**画面全体の構成**を見直す:
  余白配分・カード寸法/2×3配置・戦果と成長のバランス・情報密度を、1920×1080 と最小 1280×720 の両方で「無駄な黒余白を減らし
  読みやすく」。Godot-native（`result.gd` のみ）。実機PNG 前後比較必須＋既存の 6人フィットガード維持。
- [-] **#23/#25 — パーティメニュー全ページのキーボード完全到達＋本物の REACHABILITY ゲート.** 編成・装備で矢印/WASD で全
  メンバー/スロット/候補にまともに到達できない（user 2026-08-12）。**判明した核心: 従来ゲートは false-green** — geometry ナビは
  headless でも 1920×1080 でも“全到達”するのに実機では不安定。→ **信用できる基準は明示 `focus_neighbor` 配線だけ**（決定的・
  レイアウト非依存）。**新ゲート**: landing から**明示 focus_neighbor のみ**を BFS し、ページ内 enabled+可視 Button と突合、到達
  不能を列挙（`verify_town_controller.gd`、viewport=1920×1080）。**進捗**: 配線ヘルパ `_chain_column`/`_link_lr` 追加、
  **status/formation/valuables を配線＝HARD FAIL で保護（緑）**。**残: spells/equipment/items**（2ペイン＝spell/スロット/候補一覧と
  roster の橋渡しが必要）は gate が **TODO で dead-spot を大きく明示**（隠さない）。次段でこの3ページを配線し全 HARD FAIL 化。

- [ ] **#24 — 「つまらんダメージのみ」特技を Gate で排除し、名前に見合う効果を持たせる.** 例: 焼夷弾/徹甲弾 が共に「敵に小
  ダメージ」だけ（user 2026-08-12, スクショ）。焼夷弾→**炎上(burn)状態異常付与**、徹甲弾→**防御無視**、のように名前が示す
  固有効果を持たせる。まず (1) 効果システムが burn(継続ダメージ)/防御無視 を持つか調査（無ければ最小実装）、(2) terminal-line
  の該当特技を authored 効果へ、(3) **Gate**（user 提案）: ダメージを持つのに固有効果（status/scope/mechanic）が一切無い
  「フラットダメージのみ」特技を FAIL させる content-quality テスト（名前倒れを赤にする）。閾値は要検討（全特技に必須にするか、
  一部の素朴な通常攻撃系は許容するか）。content 中心（terminal-line techniques）＋効果システム調査。

## Backlog / ideas (no home yet)

（なし）

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
