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

- [-] **#27 — W3a: terminal-line の最小固有ルール「共有弾薬＋警戒度」（design doc 承認済み・user 2026-08-12「3」）.**
  `docs/design/ballistic-world-program.md` の W3a。terminal-line は世界/アート/銃は出荷済みで、未実装はこの資源管理2点のみ。
  **銃は最強の通常攻撃ではなく「弾を払って事故率と探索時間を下げる」選択にする**のが狙い。**Godot-native**（新規ルール＝TS parity
  移植不要、[[black-stela-godot-native-policy]]）。W0 の3判断は既定で進める（名称=terminal-line の 封鎖線/零番線 既存のまま／警戒度名
  =**静穏/注意/警報**／終幕の3択は F10 の話で W3a には不要）—異論あれば差し替え。
  - **① 共有弾薬:** party 所持品に「汎用弾」item。**銃タグの基本攻撃は1発消費、0発なら銃攻撃を選べない**（近接/道具/技へ）。迷宮 HUD に
    **残弾**を常時表示。キャラ別弾倉・手動リロード・銃種別弾薬は**やらない**（最小仕様）。Gate: 銃攻撃で弾-1・0発で銃不可の unit/combat テスト。
  - **② 警戒度:** フロアごと **0–3**。**戦闘でその階で最初に銃を撃った時だけ +1**。遭遇テーブルの重みを段階的に危険側へ寄せる（即時スポーン/
    強制戦闘/隠し数値はやらない）。**補給ロッカー/保守端末/帰還で1段階↓**（端末は資源or探索成功を要求）。HUD に **静穏/注意/警報** を常時表示、
    上昇直後に一行「発砲音が通路へ響いた。注意が向いている。」。Gate: 初弾で警戒+1・遭遇重みシフト・ロッカー/帰還で↓の unit テスト＋HUD 表示 assert。
  - 実装順（各 failing-first gate）: (a) 汎用弾データ＋銃攻撃の弾消費＋0発ガード → (b) 残弾 HUD → (c) 警戒度 state＋初弾+1＋一行通知 → (d) 警戒度→
    遭遇重み → (e) ロッカー/端末/帰還で↓ → (f) 警戒 HUD（静穏/注意/警報）。content（`content/worlds/terminal-line/**`）＋ Godot rules/HUD。

## Backlog / ideas (no home yet)

（なし）

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **#26 Combat feel（銃テンポ含む）:** **`npm run play:combat`**（＝`--fixture terminal_line_combat`）で terminal-line 戦闘に直接着地。
  前衛4人が pistol/rifle/SMG/shotgun 装備・敵は**訓練ダミー化（HP800・攻撃0＝12ラウンド以上戦え、味方は無傷）**。**全員でかかる[F]**
  で全銃種のテンポ・静かな数字・命中沈み・ログを一度に、繰り返し確認。撃破沈みは撃ち切る。（fixture `terminal_line_combat`、debug パネル可。）
- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
