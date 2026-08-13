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

- [-] **#28 — terminal-line 全員自動火器スタート（薙ぎ倒しコンセプトの既定化）.** DONE・コミット待ち。
  8 basic vocation すべてを連射武器スタートに（ショットガン2発: 保安隊員/制圧隊/爆破技師 · SMG3発:
  特務員/潜行員/衛生兵/通信員/攪乱員）。`content/worlds/terminal-line/vocations.md` 変更 ＋
  Gate 先付け: `tests/terminalLinePrepack.test.ts`「全 basic vocation の初期武器は weaponShots>1」
  （修正前 warrior=1 で RED → 後 GREEN）。全 911 ユニット GREEN・回帰なし。**残: 実画面 PNG 確認 → コミット。**

### terminal-line「戦闘の外側」スキャフォールディング（2026-08-13 playtest / 要優先度決定）

groom 時の調査結論（既存を作り直さないための現状把握。詳細は本セッションの Explore サーベイ）:

- [x] **#29 — 依頼の露出（discoverability, done）.** 依頼板は実装済みだが記録の間の奥で気づかれず。→ 街広場に
  actionable 通知を追加（`Quests.board_counts` → 受注可能 N 件 / 受領可能 M 件、記録の間へ誘導、依頼なし世界は非表示）。
  Gate `verify_quest_notice.gd`、実画面PNG確認済み。導入(御触れ)は #30、余白/場所再編は必要なら別途。
- [x] **#30 — 導入/御触れをシナリオ記述可能に（premise, done）.** `copy.<lc>.town.premise` を追加（空デフォルト＝任意）、
  terminal-line が「なぜ零番線へ潜るか」を著述、街広場のタイトル下に常時表示（`_world.copy[locale]` 直読み＋DIM prose、
  未著述の世界は非表示）。Gate `verify_town_premise.gd`、実画面PNG確認済み。
- [x] **#31 — ボス到達性（bosses, done）.** 調査結論: 両端ボスは既に確定玄室（tl1f stationmaster / tl10f zero-core は
  chamberGuardian）。tl1f ボスは設計上「descent を塞がない任意 dead-end 玄室」なので、**入口に signpost（奥から響く
  閉鎖チャイム＝stationmaster）を追加**して早期パーティを誘導。terminus は catalog 本体を chamberGuardian＋単一表で
  確定済み（inline 化は art/弱点を失うため不可）。#30 premise も terminus ボスへ物語的に誘導。**Gate**: prepack に
  「両端の確定玄室ボス＋入口 signpost」invariant（913 ユニット緑）。※中ボス（transfer-warden 等）はランダム flavor のまま。
- [x] **#32 — 迷宮ランダムイベント（外部シナリオ記述, done v1）.** 世界レベル `dungeonEvents`（重み付き flavor＋簡易効果
  findMaterials/findGold/heal/damage）＋`balance.dungeonEventPct`。歩行中に決定的 seed(turn+room) で roll（`dungeon_events.gd`、
  `_move_forward` 末尾に挿入）。**dungeonEvents 未著述の世界では完全 no-op → parity 緑（default/verdant トレースで検証済み、
  TS ミラー不要＝Godot-native）**。ログは `room_event_triggered` 経路（`_event_line` にケース追加＝静的 room event/#31 signpost も
  初めて Godot 表示）。terminal-line が6イベント著述。Gate `verify_dungeon_events.gd`（発火＋効果＋hazard 下限1＋no-op）＋prepack。
  **選択肢付き対話イベントは v2 未実装**（今回は flavor＋簡易効果の v1）。
- [-] **#33 — 拠点整備（base / materials sink, 大）← 進行中（user 2026-08-13 選択）.** salvage `materials`
  を原資に、シナリオ記述の設備を Lv↑してメタ進行。v1 設備＝医務室(休息/maxHP)・補給所(店割引)・通信室(探索補正)、
  各 Lv1-3 コスト 8/16/32。設備はどの世界でも `world.md facilities:` に著述可（汎用機能／terminal-line が自世界分）。
  実装は Godot ネイティブ（機能ロジックは Godot、content は一度だけ記述→export で Godot へ）。スライス:
  - [x] **slice 1（土台）done・commit 112354c** — `ScenarioFacility/FacilityLevel` 型＋zod schema（`world.md facilities:`）
    ＋terminal-line 3設備著述。parse/typecheck/912ユニット緑、export で `godot/data/worlds/terminal-line.json` に露出確認。
    Gate: `terminalLinePrepack` が設備セット・コスト・効果フィールドを固定。
  - [x] **slice 2a（アップグレードループ）done・commit daf3df4** — Godot: `rules/facilities.gd`（`upgrade`/
    `active_effects`）、街サービス「基地」パネル（`town/facility_panel.gd`、市場通り／基地なし世界では非表示）、
    state `facilities`{id:level} 遅延生成で永続（parity 不変）。Gate `verify_facility.gd`。town-controller/armory 緑。
  - [x] **slice 2b（効果の実適用）done・commit 247e35c** — 医務室=帰還回復(HP→+MP→+負傷解消)／補給所=店割引／
    通信室=探索補正 を各単一 hook で実装。医務室は maxHp 案から回復段階強化へ再設計（表示一貫）。**parity/played-loop/
    dungeon/town 全緑、912ユニット緑、実画面PNG確認済み**（基地整備パネル・日本語・現在/次/コスト表示良好）。
  - [ ] **slice 3（任意ポリッシュ）** — 上位Lvの降下フラグ解禁（schema `unlockFlag` は実装済み・未著述）＋整備場4つ目＋
    帰還回復のログ1行。v1 は 2a/2b で機能完成なので着手は user 判断。

## Backlog / ideas (no home yet)

（なし。旧 #27 = W3a 共有弾薬は user 判断で廃案 → `docs/design/ballistic-world-program.md` に記録済み。）

## 目視サインオフ用 ONE-SHOT 確認手段（デバッグパネルから選ぶだけ / 歩かない）

- **#26 Combat feel（銃テンポ含む）:** **`npm run play:combat`**（＝`--fixture terminal_line_combat`）で terminal-line 戦闘に直接着地。
  前衛4人が pistol/rifle/SMG/shotgun 装備・敵は**訓練ダミー化（HP800・攻撃0＝12ラウンド以上戦え、味方は無傷）**。**全員でかかる[F]**
  で全銃種のテンポ・静かな数字・命中沈み・ログを一度に、繰り返し確認。撃破沈みは撃ち切る。（fixture `terminal_line_combat`、debug パネル可。）
- **#33 拠点整備（基地）:** **`npm run play:base`**（＝`--fixture terminal_line_base`）で terminal-line 町に素材60で着地。
  **市場通り → 基地** を開き、医務室/補給所/通信室を強化（素材消費→Lv↑→効果は現在/次で表示）。効果: 医務室=帰還で全快、
  補給所=店割引、通信室=探索判定+。（fixture `terminal_line_base`、debug パネル可。）
- **玄室（closed portal / 室内）:** fixture `verdant_chamber_closed` · `verdant_chamber_cleared`
- **Terminal Line 階段:** fixture `terminal_line_down_stair` · `terminal_line_up_stair`
- **深層フロアの見え方:** world=terminal-line で fixture `floor_2`…`floor_10`（`capture_deep_floors.gd` も可）
