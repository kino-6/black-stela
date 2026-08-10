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
depot dungeon · V1–V5 terminal-line playtest fixes (`0e7d06e`/`c4e5490`) · **V6–V10 Godot combat/UX playtest
batch** (2026-08-06): V6 town-return staircase renders in the FPV (`5a08124`) · V7 特技/呪文 hits emit beats so
HP drains mid-round (`a1b5556`) · V8 command dock re-shown when オート auto-stops (`67ae75a`) · V9 enemy HP bar
given a visible crimson fill (drain was happening but invisible; `397d19c`) · V10 enemy count no longer
"resets" — playback drives the bar from the real `damage_group` model, not a pooled reconstruction (`c3bc510`)
· P1–P8 · T29/T31 · T30 · T32.

**Follow-up note (React parity, unverified):** V7/V9/V10 fixed the GODOT build. If the same 特技-hit HP-bar lag,
faint enemy bar, or count snap-back appears in the React build, mirror there: technique-damage beats in
`src/domain/combatRound.ts`, enemy-bar fill in the combat stage, and a real-HP (not pooled) playback drain.

---

## Active queue (process top-down)

### Y/D — 2026-08-10 terminal-line 実機playtest（銃の手触り＋初期装備）

**✅ Y1 depot F1 の帰還階段が2つ → 1つに（`1b24c63`）:** tl-depot1 が gate と荷役リフトの両方を stairsToTown にしていて
マップに⌂が2つ。gate を唯一の到着＝帰還に、リフトは死んだ salvage 部屋へ。
**✅ Y2 初期装備をシナリオ定義化（`e64e7b1`）:** ScenarioVocation.startingEquipment（present=base職の装備を丸ごと置換）＋
`resolveStartingLoadout`/`createGuildCharacter(input, world?)`＋Godot `create(input,data,world)` parity。terminal-line は
保安拳銃/SMG/バール/小盾＋レインジャケットで開始（ファンタジー装備の漏れ無し）。base world 不変。
**✅ D1 銃の基本攻撃＝掃射（薙ぎ倒し）＋射撃ナレーション（`57d9bc4`）:** `weaponShots`（smg3/shotgun2/lmg4/その他1、`shots`で
上書き可）で基本攻撃が複数発を撃ち、前列→次グループへ薙ぎ倒す。shot0 は旧単発と完全一致（seed 同一）→ 近接＆全 parity trace 不変。
beat に `firearm`/`shotIndex`、playback は銃を「撃った」ナレ＋バースト2発目以降は数字のみ。TS↔Godot ミラー。SMG が8体horde→5体。
**✅ D2 早期フロアを大群化（`7e3d823`）:** 低HP swarm（排水ネズミ hp6 等）を F1–F4 で4–7体パックに→ F1 遭遇が5–8体（旧2–4）。
enemy turn はグループ1回なので大群=HPスポンジ（火力スパイクではない）。groupsMax は2据置＝深層は3列化しない。
**✅ D3 銃撃エフェクトのシナリオ配線（`b137ea5`）:** Codex の12枚（fx-tl-<family>-<muzzle/travel/impact>）を戦闘 playback の
銃shotに配線。銃ビートで射手のスポットライトに muzzle、被弾creatureに impact を短時間（~0.2s）重ねる（family=武器tag、
小さく体の高い位置＝HPバー/シルエット/全画面フラッシュを覆わない）。近接は不変。instrumentation で family=smg＋mark/figure
＋imported texture を確認、combat-controller 緑。※0.2sの短命なので synthetic capture では捉えにくいが実機60fpsで視認。

### X — 2026-08-06 自己検出（裏画面検証 / capture→read PNG、[[black-stela-visual-self-verify]]）

**✅ X1–X3 全完遂 + merged（裏画面ループで検出→修正→PNG目視で確認）:** **X1** 戦闘の敵HPバー整理（全幅の選択
グロー帯を撤去→各creature 1本ずつの赤バー＋選択は▼矢印＆body発光、`2bd52e7`） · **X2** ギルド「説明」ステップの空白を
大きなギルドマスター立ち絵＋世界タグラインで埋めた（`3bd1c5d`） · **X3** 町の全幅フラット暗幕を下重みグラデ暗幕へ→
背景アートが読める（default 劇的改善／terminal-line も良好、`b00401f`）。
- **Codex follow-up（任意）:** default の `ui/town-hub.jpg` 自体が暗め — 本当に明るくするならアセット再生成（グラデ暗幕で
  実用上は解消済み）。

**✅ X4 迷宮の開幕ログが世界外れ（2026-08-07、`f25ecb3`）:** 迷宮の最初のログ行が全世界ハードコードの「地下に踏み入った。
松明の灯が石を照らす。」で、タイル張りの地下鉄駅に松明＆石が出ていた。世界固有の `town.firstDescend` コピー（terminal-line:
「防火扉が上がった。雨水が古い駅へ流れ落ちている。」）を読むよう修正（未定義世界は base i18n へフォールバック）。裏画面で確認。

**✅ X5 町の施設パネルの巨大空白（2026-08-07、`2fb3410`）:** サービスパネルが全施設で固定1740×960だったため、短い施設
（施療院 ~90%／記録 ~50%／依頼 ~55%）が画面の大半を黒い空白にしていた。CenterContainer＋高さを content 駆動に（幅は
二列カウンター用に1740維持）→ 短い施設はコンパクトな中央カード（背後に町が見える）、長い施設（ショップ/隊列）は従来通り
充填＋スクロール。裏画面で recovery/shop/quests を確認。

**裏画面スイープ結果（2026-08-07）:** ショップ（terminal-line 火器＝アイコン/和名/補正/装備可否が明瞭）・装備メニュー・道具
使用メニュー・依頼掲示板は良好。戦闘の敵バーは満タン/削れ両状態でクリーン（X1確認）。迷宮FPVで V6 帰還ハシゴ描画も確認。
- **未修正の軽微ネタ（任意）:** 記録の間の「魔物図鑑／記録された魔物はいない」の**「魔物」**は terminal-line（機械敵）に非テーマ
  （X4 の松明と同種）。共有 i18n ラベルなので、中立語（例「敵性体」）へ寄せるか per-world copy 対応が要る。

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
  - [~] **終端火器銃撃エフェクト（Codex, 2026-08-10）:** 拳銃／長銃／短機関銃／散弾銃に各3種、計12枚の透過PNGを生成する。
    `muzzle`（発射口の低輝度火花）、`travel`（弾道）、`impact`（命中／跳弾）を系列固有の形にし、銃器アイコンではなく
    戦闘ビートの重ね描き用アセットとして置く。拳銃は小さな一点、長銃は細い直進、短機関銃は短い制圧列、散弾銃は近距離の扇形とする。
    - **Human expectation:** 攻撃が単なる浮動数字ではなく、持っている銃の種類を一目で感じられる。ただし敵やHPバーを隠さず、
      反射的に目を傷めない。
    - **Non-goals:** 弾倉・リロード・発射数・騒音・遮蔽など、まだルール化していない機構を絵だけで約束しない。強い全画面フラッシュは禁止。
    - **Red flags:** 常時残る光、白飛び、敵シルエット／ターゲットカーソル／HPバーを覆う大きな絵、実体のない巨大レーザー、
      カテゴリ差のない単なる色違い。
    - **Asset contract:** `content/worlds/terminal-line/assets/effects/fx-tl-<family>-<kind>.png`、512² RGBA、中央主体・余白あり。
      sourceの色は暖色〜鈍い金属色、ランタイムで短時間だけ局所表示する前提。`ART.md`へ用途を追記し、stage導入後は
      1920/1280でcommand／HP bar／敵シルエットに重ならないことをcaptureする。
    - **Headless/browser parity:** 今回の生成は素材存在・alpha・寸法だけを検証できる。発火位置・時間・controller flowの証明は
      combat stageへ配線する次タスクでの実機capture/selfplayを要する。
- [ ] **W5 — 実機仕上げ（Claude+Codex）:** `ART.md`↔ID表 照合で未配線/default fallback/未確認hurt/開封済み保管庫/見えない
  導線をゼロ化。Claude=ルール/セーブ/日本語 最終確認。debug/import UI を通常プレイに露出させない。**Gate:** `gate:final`、
  `gate:migration`、Godot clean boot、controller/selfplay、1280/1920 キャプチャ＋独立レビュー。
