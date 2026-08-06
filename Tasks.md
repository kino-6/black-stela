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
- **Build / verify:** `npm run export:godot && npm run play` (godot/data is gitignored). Truth gate
  `npm run gate:final` (unit + e2e); Godot gates `npm run gate:migration` / `gate:godot`; runtime-error gate
  `npm run gate:godot-runtime`. Read `.claude/skills/controller-first-ui` before any menu/focus work.
- **Sessions may be split (user-authorised 2026-08-03).** Checkpoint on your own judgement: commit, update
  statuses here, update memory `black-stela-open-work` (+ `docs/handoffs/` if structural), start fresh.

Archived history: `docs/archive/Tasks.completed-2026-08.md` (T1–T32, P1–P8, U1–U6, V1–V5, W0/W1/W4 bands),
`docs/archive/Tasks.completed-2026-07.md` (earlier marathons), IMP records in `Improve.md`.

**Recently shipped (all merged, detail in archive):** U1–U6 + portrait pool + CI recovery + terminal-line
depot dungeon · V1–V5 terminal-line playtest fixes (`0e7d06e`/`c4e5490`) · P1–P8 · T29/T31 · T30 · T32.

---

## Active queue (process top-down)

- [-] **玄室 landmark visual tuning** (Codex art-lane) — 3rd pass done, **Codex re-review PENDING**. Latest
  NG (#3, 2026-08-03): the grand portal OVERSHOT (reads as a boss castle-gate) and the interior still shows a
  pale green circular cap under the HUD. Fix list: shrink the portal to ~1.1–1.3× a normal wood-and-stone door;
  replace the pale cap/glow with dark neutral stone + low-contrast inlaid floor seal; make interior structure
  (ceiling height, back-wall recession, stone frame) read as a "small room" above the HUD; re-shoot 扉の手前
  ＋入室直後 with the HUD (G1–G3). **Gate:** visual review on the real build = Codex art-lane sign-off
  (primary implementer does not self-approve visual completion); render gates green (dungeon-controller,
  verdant-chambers). Renderer edits are entangled with the block4 10F WIP in `dungeon_renderer.gd`.

**設計メモ（将来・未承認、user 2026-08-05）:** 銃器の「必須弾薬管理」は面倒として**廃案**。代替の将来案2つ（面倒さゼロ・
戦略性のみ）— **(a) 特殊弾頭＝状況を変える戦略消耗品アイテム**（貫通/焼夷/閃光 等、既存 damage/status/debuff effect で解決、
通常攻撃は弾不要。完全に Claude レーンで完結）· **(b) 警戒度＝世界樹風にエンカウント率をカラー表示**（＋雰囲気に合う
レーダー的オブジェクト画像＝一部 Codex アート依存）。着手は未承認。

## 将来世界プログラム — terminal-line（封鎖線）

**隔離ルール:** 既存 Default/Verdant の修正・玄室リテイク・既存ゲートを止めない。設計とアセット契約の唯一の入口は
[`docs/design/ballistic-world-program.md`](design/ballistic-world-program.md)。W は順に一つずつ進め、固有 Gate 緑＋commit で
`[x]`＋Archive。次の W へ進むのに再承認は不要（W3a 以降＝共有ルールに触れる場合のみ分離契約と当該 Gate を優先）。

**Claude↔Codex 受入契約:** Claude はシナリオ受入（`manifest`/`world.md`/`dungeons`/data file の受入済み集合＋ID対応表を
handoff に残す。画像の出来で数値・構造・文章を勝手に変えない）。Codex は正規データ化＋アセット生成/投入（`ART.md` に
scenario id→own-basename→寸法→用途→生成/実機状態、壁床扉階段/base・hurt/icon を1:1）。`content/worlds/<id>/` に有効な
`world.md` が入れば `worldRegistry` 自動検出＋`export:godot` が JSON/asset を自動生成（手動コピー禁止）。未受入草稿は
`docs/handoffs/` に置き `content/worlds/` へ入れない。強い全画面フラッシュ禁止。

- **W0 / W1 — DONE（Codex 投入済み、archive）:** 表示名「終端隔離線 — 零番線」/ world id `terminal-line`。F1/F2＋乗換広場を
  canonical pack 化（data file 一式＋renderer 固定 basename＋enemy base/hurt＋item/equip icon）。
- [ ] **W2 — Codex A0 構造アセット:** 上/中/深層の壁床6枚（1024² seamless）、通常扉/封鎖扉差分、下り貨物リフト、上り非常
  階段/避難梯子、帰還標識、閉/開保管庫、報酬/拠点/入口/戦闘スチル。W1 検証マップに扉/上下/帰還/保管庫を現在セル/edge の
  物理位置で配置（壁から生えた階段・ボス門化・HUD下床印を作らない）。**Gate:** `export:godot`、`verify_stair_renderer`、
  該当レンダー検証、1280/1920 実機キャプチャ（色替えでなく公共地下として別世界に読める）。
- [ ] **W3a — 廃案→将来案に置換.** 元の「共有弾薬＋警戒度」は user 指摘で撤回。上の設計メモ (a)(b) が後継（未承認）。
- [ ] **W3b — 遊べる縦切り（Claude データ＋Codex アセット）:** F1/F2・乗換広場・戦闘・保管庫・帰還を一周。Claude=受入2層の
  連続 grid/遭遇/宝/経済/一本道でない二択。Codex=敵6種 768² base/hurt、icon、still、ランドマーク配線。**Gate:** world
  registry・maze quality・encounter coverage・treasure・descentSim・controller e2e・`selfplay:browser`・実機キャプチャ。
- [-] **W4 — F3–F10 量産（大半 Codex 投入済み、archive）.** maze/階段/帰還/イベント/宝/進行/経済＋深層敵帯＋装備帯＋
  装備アイコン帯＋火器系列（制式4系列×5＋鉄雨火器、計48装備、長銃 F1=三八式歩兵銃）＋補給拡充（全32装備・17物資）投入済み。
  **Open:** [~] **終端火器技術帯（Godot 実機 capture 待ち）** — 40 active＋6 passive 特技（装備由来のみ、持ち替えで消える、
  terminal-line 限定）を TS/翻訳/combat beat/loadout resolver に実装・`terminalLinePrepack` 緑・Web build 緑。残: 全
  `export:godot` が default B3F `room.b3f.003` trace 不整合で `export:traces` から進めず、Godot 実機 capture/controller/
  selfplay 未完了。**Gate:** data test・Godot parity trace・1920/1280 capture・selfplay。
- [ ] **W5 — 実機仕上げ（Claude+Codex）:** `ART.md`↔ID表 照合で未配線/default fallback/未確認hurt/開封済み保管庫/見えない
  導線をゼロ化。Claude=ルール/セーブ/日本語 最終確認。debug/import UI を通常プレイに露出させない。**Gate:** `gate:final`、
  `gate:migration`、Godot clean boot、controller/selfplay、1280/1920 キャプチャ＋独立レビュー。
