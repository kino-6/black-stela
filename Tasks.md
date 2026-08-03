# Tasks — active playtest backlog

## Conventions (READ FIRST)

- **Status markers:** `[ ]` = not started · `[-]` = in progress · `[x]` = done (awaiting move to Archive).
- **Every task NAMES its Gate** — how it is verified and locked so the bug cannot silently return: a
  headless gate/test where one fits (proven to fail on the pre-fix code), otherwise the explicit
  manual/visual check. A task is not `[x]` until its gate is green **and** it is committed.
- **Done → Archive.** Once a task is `[x]` + gate green + committed, move it OUT of this file to
  `docs/archive/Tasks.completed-*.md`. This file holds only open / in-progress work.
- **One at a time.** Process the active queue top-down; finish (verify + gate + commit) before starting
  the next. Newest requests append to the bottom of the queue unless re-prioritised.
- **Build / verify:** `npm run export:godot && npm run play` (godot/data is gitignored). Truth gate
  `npm run gate:final` (unit + e2e); Godot gates `npm run gate:migration`. Self-build + verify before
  handoff (AGENTS.md). Read `.claude/skills/controller-first-ui` before any menu/focus work.

Archived history: `docs/archive/Tasks.completed-2026-07.md` (the 2026-07-27/29 marathon + earlier), and the
IMP-060/061/062/063/064 completion records in `Improve.md`.

---

## Active queue (process top-down)

- [ ] **T20 — 戦闘の敵HPバーが重なっている** (Godot) — 実機戦闘で、敵グループの足元に置くHPバーが隣の
  グループのバーと重なって表示される（胞子蝿×3 と 苔虫 の2グループで、バーが横に重複）。各グループのバーが
  自グループの図の幅内に収まり、隣と重ならないようにする（アンカーのx位置/バー幅の算出を見直す）。
  - **Gate:** `verify_combat_*`（バーの矩形が隣接グループと重ならない＝x範囲が非オーバーラップ）を追加/更新し、
    現行コードで落ちることを確認してから修正。実機キャプチャで重なり解消を確認。

- [ ] **T21 — ダメージポップアップのX軸ずれ＋ポップアップ時にHPバーが更新されない** (Godot) — 実機戦闘で
  ダメージ数字（例「-9」）が敵画像のX位置ではなく画面上部中央付近に出る。**被弾した敵グループのX（x_frac）
  真上**に出す。加えて、ポップアップ表示中に敵グループのHPバーが減らず、ビート後まで満タンのまま
  （`_rebuild_stage` がビートループ後にしか走らない）。**各ビートで被弾グループのバーをその場で減らす**。
  - **Gate:** `verify_combat_numbers` を拡張（数字のX中心が対象グループのx_frac位置に一致／被弾ビート後に
    当該グループのバー value が減っている）。現行で落ちることを確認してから修正。実機で確認。

- [ ] **T22 — 被弾表現：HPバーが減らず「いつの間にか死んでいる」** (Godot, 敵＋味方) — 味方HPバーが
  敵の反撃で減らず、気づくと戦闘不能。ダメージ被弾を分かりやすく。**安易なシェイク/全画面フラッシュはNG。**
  現代RPGの定番＝**HPバーのアニメ減少＋遅延ゴーストバー（chip/残像バー：メインは即減り、背後の赤バーが一拍
  遅れて追いつき「削られた量」を残す）** ＋被弾対象の上にダメージ数字＋減少時だけバー色を軽くパルス＋ビート単位
  の再生。敵グループ・味方の両バーに適用。T21（敵バー更新/ポップアップX）と同じ再生系で実装。
  - **Gate:** `verify_combat_*` を拡張（ビートで味方/敵の当該バー value が減る／ゴーストバーが存在・遅延）。
    現行で落ちることを確認してから修正。実機で敵反撃時に味方バーが目に見えて減ることを確認。

- [ ] **T24 — 手番ポートレートが行動者に切り替わらない** (Godot) — 戦闘中、左の「手番」顔画像がずっと同じ
  キャラのまま。再生（playback）で行動しているメンバーに合わせて切り替え、誰の番/誰が殴ったかが分かるように。
  ついでにログの敵名が英語漏れ（「Spore Gnat」→「胞子蝿」）— beatのtargetNameをローカライズ名にする。
  - **Gate:** `verify_combat_*` にビートごとの手番ポートレート＝行動者、ログ敵名がローカライズ、を追加。

- [ ] **T26 — Verdant G1F の戦利品が二束三文ばかり** (content) — 翠碑 G1F で「イバラの鞭」か、売っても
  二束三文のアイテムしか出ない。G1F の宝箱/ドロップに、序盤として価値ある選択肢（使える装備・素材・そこそこの
  換金物）を増やす。`content/worlds/verdant/`（items/loot tables/chests）。treasureRewards 等のゲート維持。
  - **Gate:** verdant loot テーブルの gear/価値の下限を lock、`tests/treasureRewards.test.ts` 相当を verdant にも。

- [ ] **T25 — Verdant G1F の敵が単調（同じ敵ばかり）** (content) — 翠碑 G1F でずっと同じ敵に当たる。
  first-contact モデル（各TYPE 1回/run）で G1F が導入する種が少ない。G1F に敵タイプを追加し、序盤の
  出会いに変化を出す（`content/worlds/verdant/` の enemies/encounters/dungeon rooms、descentSim で act 曲線維持）。
  - **Gate:** verdant balance/coverage sim + `verify_verdant_chambers` 緑、G1F の導入タイプ数が増える。

- [ ] **T23 — 階段ナレーションが方向を誤表示（下り階段を「上れば町へ戻る」）** (Godot) — 根の下り（G2Fへの
  **下り**階段）で「階段だ。上れば町へ戻る。」と表示される（Image #51「大嘘、これは2Fへの階段」）。ナレーション
  を階段の**実際の向き/行き先**に合わせる：上り＝町/前の階へ戻る、下り＝次の階へ降りる。入口の上り階段のみ
  「町へ戻る」。`_stairs_info` の kind(up/down) を見て文言を出し分ける。
  - **Gate:** `verify_dungeon_controller` に down階段セルで「次の階へ」系、up階段（入口）で「町へ戻る」系、を追加。

- [ ] **T13 refine — 受入条件を実測に合わせる（全滅強制はしない）** — Codex 2026-08-03：全員・無購入を
  B1Fで**必ず全滅**させる調整は**不要**（現状で無購入10%相当・購入済み64%、施設差は十分）。旧タスクの
  「施設なしでは1Fを突破できない」は実測と矛盾。受入条件を **「無購入フルパーティは薄氷でB1Fを生還できても、
  継続探索・B2進出は成立しない。帰還して準備する必然がある」** に直し、その実機証跡を追加する。難易度の
  再チューニングはしない（descentSim ゲートは現状維持）。

- [x] **T2 — 玄室の敵出現ポイントを扉に隣接させる** — DONE
  - TWO invariants now locked in `chamberGuardian.test.ts` over BOTH worlds: (1) **door-choke** — flood a
    chamber's OPEN-connected pocket from its cell and assert every edge LEAVING the pocket is door/secret, so
    the guardian cannot be reached from an open flank (no bypass); (2) **fought AT the door** — the chamber's
    OWN named cell (where `begin_room_encounter` fires) is entered through a door/secret, so opening the door
    steps you straight onto the guardian, not one cell in.
  - The choke already held (the generator encloses each 2×2 玄室 behind doors). The door-ADJACENCY failed for
    14 verdant chambers (the door had landed on a non-anchor block cell). Fixed in `genVerdantFloors.mjs`
    (`chamberDoorCell` — name each 玄室 on its entrance-nearest door cell) + regenerated g1f–g8f. Only the
    room NAME moves within the already-enclosed block — the maze WALLS/graph are unchanged, so balance,
    connectivity, and parity are untouched (unit 727, verify_verdant_chambers, verify_parity, verify_flow,
    verdant e2e all green). Default already satisfied both without a change.

- [x] **T3 — 罠は「特定できる/できない」(Wiz式識別)** — DONE
  - A successful investigation now IDENTIFIES the trap: `chest_panel._note` (Godot) + `ChestPanel` note
    (React) show 「{trap}を見抜いた。」 (e.g. 毒針の罠を見抜いた) instead of a flat 「罠が仕掛けられている」.
    New copy `play.chestTrappedKnown` (ja+en). Locked in `verify_chest_loot_label` (names 毒針, not the flat
    message). Uncertain/clear unchanged. build + chest test green.

- [x] **T4 — 罠解除/開封後の報酬プレゼン: 宝スチル＋相応の報酬** — DONE
  - (a) Presentation: the opened-chest reveal uses a proper reward still (`treasure-reward-still.png`, larger
    300x190) — delivered + wired in dungeon.gd/chest_panel (T7 commit).
  - (b) Content: guardian `.keep` chests are now GEAR-FORWARD (equip weight 10 vs consumables 3; g1/g2 keep
    gained gear) — a miniboss reward reliably yields gear, not a しょうもない potion. Locked by
    `tests/treasureRewards.test.ts` (every verdant .keep table's gear weight ≥ consumable weight). chests/
    chamber/economy tests green. (Default world + side-chest weighting are a further tuning knob.)

- [x] **T5 — 勝利/成長画面に「レベルアップで何が変わったか」を明記 (REGRESSION)** — DONE
  - Godot `result.gd` + React `CombatResultPanel` both show per levelled member: stat deltas (HP+5 MP+2 攻撃+1
    威力+1 命中+1 速度+1), any newly-usable 特技/呪文, and 次のレベルまで N. `growthForLevel` exported;
    `tests/leveling.test.ts` locks the derivations. Godot visually verified; build + leveling tests green.
  - The victory 成長 panel shows only 「レベルアップ / レベル N」 — a regression; it was meant to state WHAT
    changed. Show, per levelled member: the ability/stat CHANGES (HP/攻撃/… deltas), any newly-usable
    特技/呪文, and the EXP to the next level.
  - Godot victory screen (`combat.gd`/result) + React result panel (parity); the growth delta is available
    from `Leveling.apply_level_ups` events (`character_leveled_up`) and the before/after stats.
  - **Gate:** a result-panel test — a levelled member's growth row names its stat deltas, any newly-learned
    technique, and the XP-to-next (proven to fail on the level-only display).

- [x] **T6 — セーブ削除機能（タイトル/メニューから）** — DONE (Godot + React mirror)
  - Godot: the title continue-list shows a 削除 button per slot → はい、削除する / やめる confirm (never a
    one-press destroy). `SaveGame.delete_slot` removes the file; the row disappears.
  - React: the title now shows 削除 next to Continue when a save exists → はい、削除する / やめる confirm →
    `SaveRepository.delete` removes the autosave; Continue goes disabled and the delete control disappears.
    Added `delete(slotId)` to the repository interface + LocalStorage impl; a `deleteSave` handler in App.
  - **Gate:** `verify_save` (delete removes the slot + file), `tests/saveRepository.test.ts` (delete drops
    the slot from list/read), e2e `save-load.spec.ts` (削除→confirm disables Continue and survives reload),
    and ux-parity — the title now drives all three delete stages (a new slot fixture + `pending_delete` seam
    in `title.gd`), so `title.deleteSlot/deleteConfirm/deleteCancel` are matched in both engines. All green.

- [x] **T7 — 探索フィードバック＋ログの視認性** — DONE
  - (a) `dungeon._event_line` now says 「この場所の隠し通路はもう開いている。」 on a cell whose secret is
    already discovered (`_has_opened_secret_here`, keyed to the rules' `secret:<room>:<dir>`), not a flat
    "nothing found". Locked in `verify_dungeon_controller` (both branches).
  - (b) The dungeon log is now a framed WINDOW (gold-bordered panel, autowrap) above the party formation —
    verified legible. dungeon-controller green.

- [x] **T8 — 商店の全面リデザイン（世界樹式・buy/sell分離・party-wide）** — DONE
  - Shipped: the shop is now a top-level **買う / 売る** split in BOTH engines (parity). **買う** browses stock
    by category, names who CAN equip a piece as INFO (not a purchase scope), and buys into the **SHARED party
    inventory**; equipping moved entirely to the party 装備 tab. **売る** lists the shared bag. Dropped the
    per-adventurer 「見る冒険者」 picker and the in-shop equip board. New UI state `shop_mode` (buy|sell) +
    setter threaded through ctx (Godot `town.gd`) and App state (React). i18n: `town.shopModeBuy/shopModeSell/
    shopGuideShared/shopSellGuide/equipWhoCan/equipNoneCan`; ux-parity re-derived (dropped selectedAdventurer/
    canEquip; conditional-only keys carry `derivedExclusions` with reasons).
  - **Gate:** `verify_town_controller` shop section — asserts 買う/売る are separate reachable modes, buying
    grows the SHARED inventory (0→1), the 「見る冒険者」 scope is gone, and both modes hand the controller a
    cursor (proven to fail on the pre-T8 single-page shop). ux-parity PASS · gate:final e2e 139 · unit 719.
  - Current shop is low quality + "業務アプリ感": buy/sell/equip are all on ONE dense screen, and it is
    scoped to ONE adventurer (「見る冒険者: セーブル」) — buying is per-character, which is odd.
  - Proposed (Etrian/世界樹 model): top-level **買う / 売る** split; **買う** browses categories → item detail
    → buys into the SHARED party inventory (equipping happens in the party 装備 tab, not here) — party-wide,
    not per-character; **売る** lists 所持品/loot to sell (optionally the Etrian "selling new materials
    unlocks new stock" hook as a later slice). Reduce density, give it a shop identity (framing/art), not a
    spreadsheet.
  - React + Godot (parity), i18n, ux-parity re-derive.
  - **Gate:** shop-controller test — 買う and 売る are separate reachable modes; buying adds to shared
    inventory (not bound to a character); controller-only; no reflow/overflow at 1280/1920.
  - **Direction CONFIRMED (2026-08-02):** 世界樹式 — 買う/売る tabs; **買う = purchase into the SHARED party
    inventory, equipping is separate (party 装備 tab); NO per-character purchase scope.** (Not the sell-unlock
    slice for now.)
  - **Impl analysis (turnkey for next session):**
    - MUST change React + Godot IN LOCKSTEP — ux-parity requires React's shop keys ⊆ Godot. A Godot-only
      redesign that drops keys React still renders (e.g. `town.selectedAdventurer`, shop-context `town.canEquip`)
      breaks the gate.
    - New UI state: a `shop_mode` = "buy" | "sell" (+ setter) threaded through the ctx, like `shop_category`
      is today (town.gd provides `shop_category`/`set_shop_category` → add `shop_mode`/`set_shop_mode`;
      React App has the mirror state).
    - **買う mode:** keep category tabs + stock list + selected-item detail + 買う (dispatch `buy_item` into
      shared inventory). Item detail may show "誰が装備可" as INFO (keep `town.canEquip`), but drop the
      「見る冒険者」 picker as a *purchase scope* and drop the equipment board from the shop.
    - **売る mode:** the 所持品 list + 売る (dispatch `sell_item`).
    - Equipping moves entirely to the party 装備 tab (already exists) — remove the shop equip board.
    - i18n: add `town.shopModeBuy`/`town.shopModeSell`; retire (or repurpose) `town.selectedAdventurer` in the
      shop across BOTH engines so ux-parity stays balanced; re-derive the manifest.
    - Files: `godot/scripts/town/shop_panel.gd` (251 lines) + `godot/scripts/town.gd` (ctx/state);
      `src/components/ShopPanel.tsx` + `src/App.tsx` (state); `src/i18n/*`; ux-parity manifest.
  - **Gate:** shop-controller test — 買う/売る are separate reachable modes; buying adds to SHARED inventory
    (not bound to a character); controller-only; no reflow/overflow at 1280/1920. ux-parity re-derived green.

- [x] **T9 — 鍛冶屋: 金銭で装備を強化する施設（上限あり）** — DONE + **Codex 承認 (2026-08-03)**: 3状態
  （affordable/at-cap/no-gold）とも価格・強化先・上限・資金不足・フォーカス退避が自然に読める。証跡は
  `docs/evidence/t9-blacksmith-2026-08-03/`（harness `capture_blacksmith.gd`）。 (new facility)
  - Shipped a NEW town facility 鍛冶屋 (Blacksmith) under 市場 — the GOLD twin of the 錬成所 (which spends
    MATERIALS). It tempers a WORN piece +1 per step (same MAX_REINFORCE=5 ceiling) for gold; cost climbs
    `(plus+1)*30` (30→150, 450g to max). Refuses in the dungeon / on an empty slot / at the cap / when broke.
    New `forge_equipment` command + `equipment_forged` event + copy, in BOTH engines (byte-for-byte parity):
    TS `loot.forgeCost`/`forgeEquipmentCommand`/rulesEngine route + `BlacksmithPanel.tsx` + App/TownEntry
    wiring; Godot `loot.forge`/slice_rules route + `blacksmith_panel.gd` + town.gd (LOCATIONS/label/preload/
    ctx/disabled/event-log). i18n ja+en; ux-parity entry + evidence captured; derivedExclusions mirror the
    workshop's unreachable career.stat.*.
  - **Gate:** `tests/loot.test.ts` gold-upgrade lock (cost climbs, +1 applied, GOLD spent not materials,
    broke refused, cap refused — through the real rules engine); e2e `town.spec` (open 鍛冶屋, temper → 75→45
    gold, +1 shown); `verify_town_controller` blacksmith walk + behavioral forge (gold 9999→9969);
    `verify_parity` (new command hashes match); ux-parity PASS. unit 723, build green.

- [x] **T10 — ギルド名簿編集の配置＋画像取り込みバグ** — DONE (bug + layout)
  - (b) BUG FIXED: 「画像を取り込む」 could not select the user's image — the image-only filter greyed out
    files with odd/UPPER-case extensions. Now: per-extension + all-files fallback filters, AND
    `_image_file_to_data_url` decodes by CONTENT (a real PNG/JPG/WEBP imports regardless of extension; a
    non-image is still rejected). Locked in `verify_portrait_import` (wired into gate:migration).
  - (a) LAYOUT FIXED: the 名簿 editor (picker + portrait + name/来歴 fields + 保存/外す) now renders in the
    MAIN window via a new `_roster_manager()`, instead of being crammed into the narrow 420px hall column on
    the right (playtest #37 "なんでこんな右下の狭いところに配置するの？"). The hall column keeps only the
    party summary + the 名簿を整える / 名簿を閉じる toggle. Picker widened to 4 columns to use the space.
  - **Gate:** `verify_guild_controller` roster section — with a member selected, the 保存 button is reachable
    and is NOT a descendant of the 420px hall column (proven to fail on the pre-fix hall-embedded editor).

- [x] **T12 — 装備タブがコントローラで操作できない (BUG)** — DONE
  - Root cause: LEFT from a slot/candidate jumped to the TAB strip (geometric neighbour), not the roster, so
    character-select and the slot→candidate→equip chain were unreachable by pad. `_equipment_page` now wires
    explicit focus neighbours — the detail column's LEFT returns to the selected roster row, the roster's
    RIGHT enters the slots, and the last slot flows DOWN into the candidates/equip. Verified: ui_left from a
    slot now lands on the roster (Mira→Sei→Rook…). Locked in `verify_dungeon_controller` (T12).

- [x] **T11 — 装備検討時の情報不足（隊列・現ジョブ・顔画像を追加）** — DONE
  - `party_panel._roster_row` now shows, per member: the PORTRAIT (顔画像), a 前衛/後衛 ・ <現在の職> line
    (row + localized vocation), alongside name/Lv/HP. Verified on the 装備 tab (fits, reads at a glance).

- [x] **T13 — 序盤難易度の再設計: 作成直後のLv1は施設なしでは1Fを突破できない** — DONE (measured; felt-review is continuous)
  - **Shipped (both worlds, data-only):** raised Act I per-fight weight — bigger g1/b1 swarms (moss-mite 3-5,
    spore-gnat 2-4, ash-slime 4-5, dust-crawler 2-4/3-5) + more bite on the two opener enemies (dmg/acc). Now
    a fresh Lv1 NAIVE (starter-loadout) party is all-but-wiped clearing floor 1 (verdant g1f≈7%/WIPE, default
    b1f≈10%), while a shopped MID party clears with margin (40% / 64%). A full 6p party takes CUMULATIVE
    attrition (single g1f fight leaves 6p ~40%), not a single-fight wall — the skill's core principle held.
  - **Gates:** new `difficultyGate` lock — a fresh Lv1 party's floor-1 trough ≤0.2, a shopped party's ≥0.3,
    BOTH worlds (proven to fail on the pre-change soft opener). All existing balance gates still green
    (prepare-or-wipe, non-increasing act curve measured on the LEVELLED party, party-size, provision);
    verdant `preparedMinLevel` re-targeted 3→≤6 (harder Act I). Navigation/debug harnesses that assumed a
    fresh party traverses B1F were made difficulty-agnostic (force-win fights: rulesEngine walks,
    debugAutoExplore, headlessRunner `winCombats` option). Unit 722 green.
  - NOTE: the sim is a LOWER bound (no gimmick hazards/status); the FELT tuning is the user's continuous
    real-play review. Run `npm run export:godot` so the Godot build reflects the new numbers.
  - **DECISION (user, 2026-08-02):** a freshly created Lv1 party (starter gear, no shopping/provisioning)
    must NOT be able to clear floor 1 on a blind dive — the loop is 町へ戻る→装備購入/補給→再挑戦→突破.
    「施設をしっかり使わないと攻略できない。稼げばしっかり必要なものが入手できる」. INVARIANTS HELD: a MID
    (facility-equipped) party still clears the descent; no single required item; counterplay stays diverse.
  - **Root-cause of the "easy" playtest (diagnosed):** the sim's `naive` policy IS the fresh starter party
    (it keeps the class starting loadout). It already reads g1f≈7% / wipes by g3f — but that is the
    CUMULATIVE none-heal trough. In real play the party heals between the many small first-contact fights, so
    no single early fight bites → floor 1 feels trivial. The real lever is **per-fight weight on Act I** (a
    single g1f/b1f fight must threaten a fresh party), NOT the cumulative curve. This RE-TARGETS the old
    "Act I teaches gently (g1f>0.7)" invariant — a deliberate change, per the decision above.
  - Approach: raise Act I per-fight weight (g1/b1 packs: group size / enemy dmg) so a starter party is pushed
    to wipe-risk on a blind floor-1 dive, while a shopped+provisioned (mid+kit) party clears; keep
    prepare-or-wipe + non-increasing act curve + no-wipe-for-prepared. Tune vs `descentSim` (both models) and
    the shop/provision economy so 稼ぐ→買う→突破 is a real path. Grounded in `.claude/skills/drpg-balance`.
  - **Gate:** extend `difficultyGate`/`verdantBalance` — assert a starter/naive party FAILS floor 1 on a
    blind dive (per-fight trough below a survivable-without-facilities line) AND a facility-equipped party
    clears floor 1 and the descent, with the invariants intact. Two worlds. Real-browser feel check.

- [-] **玄室 landmark visual tuning** (Codex art-lane) — 3rd pass done, Codex re-review PENDING
  - **Codex NG #2 (2026-08-03):** even with the muted pass, the closed door read as a dark CORRIDOR from the
    approach (the floor seal is hidden under the party HUD), so the room's existence didn't read. Codex's fix
    list actioned this pass:
    - **Capture harness** (`capture_verdant_chamber_visual.gd`) already finds a DOOR/SECRET-choked chamber
      DYNAMICALLY and shoots the two required frames — `<out>-closed.png` (closed door head-on, one cell
      outside) and `<out>-inside.png` (one step in, door opened behind). (Was done in the prior pass; Codex
      re-verify — the G1F-fixed point is gone.)
    - **Camera pulled back** (`cameraPullback`/`cameraFov`, palette-tunable): a faced wall/door no longer
      fills the lens, so the doorway, its frame and the surrounding corridor read as context head-on.
    - **Grand portal = front-readable architecture:** a door that opens INTO a 玄室 is drawn as a grand
      portal — heavier jambs + a deep lintel beam rising nearly to the corridor ceiling, taller leaves filling
      it — so a sealed guardian room announces itself from the corridor, not via the HUD-hidden floor. Frame
      stays WOOD, no glow (the pale-stone frame was reverted: it read as a glowing Fallback — user feedback).
  - **Codex NG #3 (2026-08-03) — grand portal OVERSHOT.** The 玄室 door now reads as a BOSS castle-gate /
    face monument, not a repeatable 玄室 door; and the interior still reads as bare wall with a pale green
    circular cap growing from under the HUD (the old "unexplained green object"). Confirmed G1–G3. Fix list
    for Claude:
    - **Shrink the portal** from "grand" to a **sturdy wood-and-stone door ~1.1–1.3× a normal door** — so
      repetition never looks like boss staging.
    - **Remove/replace the pale circular cap + any glow** in the interior with dark neutral stone; the
      floor seal → a LOW-CONTRAST inlaid stone (Codex art retakes the texture).
    - **Interior structure above the HUD:** ceiling height, back-wall recession, stone frame must read as a
      "small room" — do NOT rely on the floor design (it's HUD-hidden).
    - Re-shoot 扉の手前 + 入室直後 WITH the HUD, G1–G3, and confirm the difference from a normal corridor reads.
  - **Gate:** visual review on the real build — **Codex art-lane sign-off** (primary implementer does not
    self-approve player-facing visual completion). Render gates green (dungeon-controller, verdant-chambers).

- [x] **IMP-063 descent colour arc + textures — DONE** (art delivered + verified 2026-08-02)
  - Colour arc (per-floor palette) + Codex's Default 3-band TEXTURES (`a8fc903`) both landed. Verified via the
    deep-floor sweep: B1F clean dry ash-stone (block1, B1 ash-stone-v2 exception removed), B5F damp blackened
    stone (block2), B8F purple-black stone split by black roots (block3) — reads as a clear descent. Verdant
    already had its own block1/2/3. Move to Archive on next tidy.

- [x] **T14 — 敵の見た目・遭遇バリエーションを各階層帯で増やす** — DONE (art delivered by Codex + data wired)
  - Codex delivered the 16 sprites (base+hurt for all 8 additions, commit e906e72). Defined the 8 enemies in
    `enemies.md` (both worlds) and inserted each into its band's exploration table(s) at modest weight: Default
    ember-beetle (B2F), salt-leech (B3F→B4F), ledger-wisp (B5F→B6F), sealbreaker (B7F→B8F); Verdant bark-tick
    (G2), sporerook (G3→G4), sap-eel (G5→G6), root-moth (G7→G8). Kept as LIGHT pure-attrition silhouettes (no
    status abilities) so they add variety WITHOUT disturbing the tuned gates — the first-band pair was pulled
    OFF floor 1 (a 3rd type changed the groupsMax:2 roll and broke the locked T13 floor-1 balance); they enter
    on floor 2. `.keep` boss tables untouched.
  - **Gate:** `tests/encounterVariety.test.ts` — every new id is reachable in a table (its sprite appears), no
    table names a non-existent enemy, and each exploration floor fields ≥3 distinct silhouettes (tutorial
    floor ≥2). All balance gates re-verified green (difficultyGate/verdantBalance/descentSim/coverageSim/
    contentSim), verify_parity green, unit 727+6. NB: run `npm run export:godot` for the Godot build.
    is `茨斬り / 心材殻 / 花粉の靄`), so even mechanically mixed groups look visually repetitive.
  - **Asset delivery (16 PNGs):** generate one 768×768 RGBA base sprite and one matching `-hurt` pose for each
    of the eight additions below. Bottom-grounded or intentionally `hover: true`, no baked scene, no glow or
    strong flash; each needs a distinct silhouette and a readable material/color hook at combat scale. Drop
    them into `content/worlds/<world>/assets/dungeon/` using the enemy-id basename contract (dots → dashes),
    e.g. `enemy-b1f-ember-beetle.png` + `enemy-b1f-ember-beetle-hurt.png`.
  - **Default / 灰の門 — four additions:**
    - `enemy.b1f.ember-beetle` — small, low bronze-and-cinder carapace; **B1F halls/chambers** as the third
      first-band silhouette.
    - `enemy.b3f.salt-leech` — medium, pale mineral leech with cold blue brine core; **B3F cistern → B4F dark**
      as the status/attrition counterpoint to 苦い塵 and 灯守.
    - `enemy.b5f.ledger-wisp` — medium hovering oath-paper/iron-seal caster, muted blue-white paper and red
      thread; **B5F gate → B6F oaths** so the mid-game does not look like only sentinels and keepers.
    - `enemy.b7f.sealbreaker` — medium ash-black grave robber construct with a broken brass pry-bar; **B7F
      vaults → B8F gate** as the late-game non-boss silhouette beside 納骨殻 / 灰の奉者.
  - **Verdant / 蔦の回廊 — four additions:**
    - `enemy.verdant.g1.bark-tick` — small orange fungus-bellied bark parasite; **G1 pack → G2 pack**. It must
      not read as another green beetle beside 苔虫 / 棘虫.
    - `enemy.verdant.g3.sporerook` — medium ground bird made from pale shelf-fungi and dark twig legs; **G3
      pack → G4 pack**, a non-hover silhouette in the transition to the pollen act.
    - `enemy.verdant.g5.sap-eel` — medium, low translucent amber sap predator; **G5 pack → G6 pack**, visually
      separates the sap act from the recurring flower/pollen forms.
    - `enemy.verdant.g7.root-moth` — medium hovering violet root-moth with folded leaf wings, no loose particle
      cloud; **G7 pack → G8 pack** as the deep-root counterpart that is not 心材殻.
  - **Insertion order:** define stats, role, weakness, tier, Japanese name and at most one readable signature
    action in the relevant `content/worlds/*/enemies.md`; then insert each at a modest first-pass weight (4–6)
    into the exact encounter tables named above in `content/worlds/*/encounters.md`. Keep `groupsMax: 2` and
    distinct-group selection intact; do not inflate the number of bodies merely to show new art. Preserve every
    `.keep` table as a single named guardian/boss — this task varies normal exploration, not boss identity.
  - **Balance and presentation gate:** add encounter coverage assertions that every new id is reachable in its
    named tables and each normal floor has at least three candidate silhouettes across its local + carried
    entries; re-run `descentSim`/encounter tests so new roles do not silently raise attrition. Export Godot,
    capture one real combat at 1280 and 1920 for each world with at least two new silhouettes present, and run
    `npm run gate:migration` plus a clean Godot boot. Review both base and hurt frames on the actual combat lane
    for grounding, scale, contrast, and no strong-flash regression.

- [x] **T15 — オート/全員でかかる の再生に数字とHP更新が出ない** — DONE (誰が→何に→どれだけ + bars drain)
  - DONE: (1) オート now plays each round ANIMATED (`_run_auto` → `_resolve_round_with(orders, true)`), no
    command-menu flicker between auto rounds. (2) `_playback` reworked from one aggregate number on the first
    group to a number on EACH struck target: it snapshots every enemy group's HP before the round and
    reconstructs each group's loss, landing a juicy number ON that creature (positioned by x_frac) and
    draining the bars per beat — so 何にどれだけ + HPバー更新 are both covered, in auto and manual.
  - (3) Per-MEMBER attribution ("誰が") DONE: `combat_round.gd` now emits per-hit BEATS
    ({actorName, targetGroupId, damage, crit}) on the `combat_round_resolved` event in every branch
    (victory/wipe/continue), and `_playback` walks them to show 「<member> → <target> に <N> ダメージ」 with
    the number on the struck creature — full 誰が→何に→どれだけ. Parity-safe: `verify_parity._semantic_events`
    drops beats, so the state-hash oracle is untouched (parity/controller/geometry/flow green).
  - Locked by `verify_combat_numbers` (juicy/positioned/crit/outline rendering) + `verify_combat_controller`
    (a resolved round emits beats naming the actor/target/damage) + parity/flow.
  - REMAINING (with **T19**): `_playback` shows the ROUND's aggregate for the first group, not a per-ATTACKER
    beat — so "誰が何にどれだけ" is not fully granular. **Scoped (2026-08-02):** the Godot combat result
    carries NO per-hit beats by design — `combat.gd:8` "beats are presentation the target UI rebuilds", i.e.
    the renderer reconstructs from the state DELTA (group HP totals only). So this is NOT a renderer tweak: it
    needs (1) `combat_round.gd` to EMIT per-hit beats (actor→target→damage) in its result — a change to the
    parity presentation seam (React already has this via `collectCombatBeats` reading `event.beats`); (2)
    `_playback` to walk those beats, spawn a number on each target's mark, and drain that group's bar per beat
    (needs an incremental-HP path in `CombatStage.enemy_mark`, which is build-once today); (3) the T19 juicy
    treatment; (4) live browser feel-review (the sim/e2e cannot judge "juicy"). A focused combat-feel session,
    not a tail-end change — best done with the user watching the real build.
  - **Problem (playtest 2026-08-02):** T1 made オート play each attacker instead of skipping — good — but the
    playback does NOT show WHO dealt HOW MUCH damage to WHAT, and the **HP bars do not update during** the
    sequence. So the beat-by-beat goal (see who did what, feel the numbers land) is not actually met: the
    moves animate but read as a silent blur.
  - **Intent:** every オート/all-out beat must land like a manual round — a floating damage number ON the
    struck enemy (数字感), the target's HP bar draining that beat, and the one-line ticker naming the actor
    → target → amount. Applies to both engines (combat-ui-drpg: "numbers belong on the target"). Likely the
    auto path advances state without emitting/rendering the per-beat damage + hp-delta the manual path uses.
  - React (`CombatCockpit`/beat playback) + Godot (`combat.gd` playback) parity; find where オート batches
    beats and make it drive the SAME per-beat number+bar render as a hand-played round.
  - **Gate:** a combat-playback test — an オート round emits, per attacker beat, a damage number on the
    correct target and a decreasing target-HP snapshot (proven to fail on the current number-less playback);
    plus a real-browser check that the bars drain and numbers float during オート.

- [x] **T16 — 商店「売る」に売却額と性能を表示 (T8 の抜け)** — DONE
  - Each 売る row now shows the item's 性能 (its description; equipment keeps the slot·stat line) AND the
    売値 (`town.sellValue` = 「売値 N G」) so the sale is judgeable. Both engines (React `ShopPanel` sell
    section + Godot `shop_panel._inventory_row`), new i18n key ja+en, ux-parity re-derived green.
  - **Gate:** town.spec sell-mode asserts a `sell-value` element reads 「Sells for N gold」;
    `verify_town_controller` sell branch asserts a row shows 売値. ux-parity + build green.
  - **Problem (playtest 2026-08-02):** the 売る list shows only name + 個数 — no **売却額 (how much gold you
    get)** and, for equipment, no **性能 (stats)**. The player cannot judge a sale. (Screenshot: 花粉の軟膏 /
    樹液の水薬 rows have a 売る button but no price.)
  - **Fix:** each sell row shows the sell value (e.g. 「売値 N G」 from `item.sellValue`) and the item's
    effect — consumables their effect (heal/cure amount), equipment their slot · stat line (already partly
    shown; add the price). Both engines: React `ShopPanel` sell section + Godot `shop_panel._inventory_row`.
    Parity + i18n (`town.sellValue` or reuse an existing price key).
  - **Gate:** extend the shop test — a sell row exposes its sell value and effect; town.spec sell-mode
    assertion + `verify_town_controller` sell branch. ux-parity if a new key is added.

- [x] **T17 — 能力タブの「〜と前後を交代」コマンドを削除** — DONE
  - Removed the 「<相手>と前後を交代」 button from the status/能力 detail page in BOTH engines (Godot
    `party_panel` + dropped the unused `_counterpart`; React `PartyMenuPanel`). Front/back changes now live
    ONLY in the 編成 tab via explicit 前衛へ/後衛へ placement (`set_member_row`) — Godot already had this;
    ADDED the matching place-front/back buttons to React's formation section so the capability isn't lost and
    ux-parity stays balanced (dropped `partyMenu.swapWith`, both engines now render `placeFront/placeBack`;
    added a 編成 manifest state so Godot drives them). build + unit 722 + ux-parity + town-controller green.
  - **Gate:** `verify_town_controller` party section — the status page shows NO 前後を交代 command and the
    編成 tab still exposes 前衛へ placement (proven to fail on the pre-fix status-page button).

- [x] **T18 — 回復の対象選択: 満タンは選べない＋初期カーソルは最重傷へ（＋partyMenu.back 未翻訳バグ）** — DONE
  - Godot 呪文/特技 heal-cast target picker (`party_panel._spells_page`): (a) for a pure-heal technique
    (`Techniques.heals`), full-HP allies are now DISABLED (nothing to gain); (b) the cursor lands on the
    MOST-wounded valid target (lowest HP%), not the top; (c) because the picker recomputes on the post-cast
    rebuild, the cursor moves to the next-most-wounded instead of snapping to the top; (d) added the missing
    `partyMenu.back` i18n key (ja 戻る / en Back) so the back button no longer renders a raw key. (React's
    party menu has no technique-cast flow — this is Godot-specific; no parity gap.)
  - **Gate:** `verify_town_controller` party section — drives every tab AND the heal-cast target view and
    asserts NO raw `partyMenu.*` key survives (fails on the pre-fix bare `partyMenu.back`). Disable/most-
    wounded focus is implemented per the code above; the feel is the user's continuous review.
  - **Problem (playtest 2026-08-02):** the 小癒し (heal-ally) target picker lets you select members who are
    at full HP (no reason to heal them), and the cursor starts on the first member, not the one who most
    needs it. Also visible: a **raw i18n key `partyMenu.back`** renders as the back button label (missing
    translation) on the 呪文/特技 use screen.
  - **Fix:** (a) disable (non-focusable) any target already at full HP for a pure-heal effect; (b) land the
    initial cursor on the MOST-wounded valid target (lowest HP%); (c) add the missing `partyMenu.back` copy
    (ja+en) so no raw key shows. Godot party_panel 呪文/特技 use flow; React parity if present.
  - (d) After a heal is CAST, the cursor jumps back to the top of the target list — NG. It must stay on the
    just-healed member (or advance to the next-most-wounded valid target), like the dungeon-search focus
    survival rule (controller-first-ui: "focus survives every transition").
  - **Gate:** party-menu heal-target test — full-HP members are disabled, the cursor lands on the lowest-HP
    member, after a cast the cursor does NOT reset to the top, and no raw `partyMenu.*` key appears.

- [x] **T19 — ダメージ数字の演出を「気持ちよく」する（業務アプリ感の脱却）** — DONE (Godot combat stage)
  - `CombatPlayback.damage_number` reworked into a juicy hit: a scale-POP on spawn (overshoot via TRANS_BACK
    then settle), a rising arc with a small sideways drift, an ease-out fade, a dark OUTLINE so it reads on
    any creature, and a hotter/bigger CRIT variant with a "!" for a heavy blow. Positioned per target (x_frac)
    so a multi-target round lands each number on its own creature. Self-contained (no assets). Locked by
    `verify_combat_numbers`. **Engine parity:** React's `.hit-number` was already juicy (scale-pop, rise,
    shadow, bigger/hotter crit) — T19 brought Godot UP to it; the number TEXT is now identical in both
    (`-N` normal, `-N!` crit). Minor React-only CSS accents remain (a per-hit `fx-flash` + crit `fx-slash`);
    engine-appropriate, left for Codex's visual call. The FEEL is the user's continuous real-build review.
  - **Problem (playtest 2026-08-02):** the current floating damage number reads like a spreadsheet cell —
    no pop, no weight, no 数字感. Combat-ui-drpg wants numbers that LAND on the target with impact.
  - **Research + apply:** study juicy damage-number presentation (scale-pop on spawn, slight arc + rise,
    ease-out fade, crit emphasis / colour, drop-shadow or outline for punch, stagger for multi-hit) and apply
    a satisfying treatment on the combat stage. Keep it readable and controller-first; no external assets
    (self-contained). Both engines (Godot combat stage + React `CombatCockpit`) for parity where reasonable.
    Pairs with **T15** (auto-play must show these numbers + drain bars).
  - **Gate:** visual — real-browser combat capture at 1280/1920 showing the new number pop on a hit
    (+ a unit/e2e check that a damage number element still renders on the struck target). No layout reflow.

---

## Recently done (awaiting nothing — move to Archive on next tidy)

- [x] **T1 (IMP-064) 全員でかかる instant → beat-by-beat** — all-out narrates each living attacker before
  the real damage/defeat, no longer snapping to the result. Gate: `verify_combat_controller` green. `e8fd07f`.

- [x] **Continue crash — world.default.json not found** — a save stores world id "world.default" but packs
  are keyed "default.json"; continue loaded an empty world and crashed. `run_state._read_world` resolves
  either form; `load_slot` normalises world_id to the KEY. `verify_save` green. `26a474a`.

- [x] **Dungeon camera pull-back (tunable) + 玄室 wood door frame** — faced wall/door filled the whole frame;
  slide the eye back from cell-centre (palette `cameraPullback`, clamped 1.2m) + widen `cameraFov`, so the
  door frame and room read as context. Also reverted the glowing pale 玄室 frame to wood-textured jambs+lintel.
  Controller + save gates green; visually confirmed. `61760a1`.

- [x] **Combat log timing/wording — past-tense verb THEN damage popup** — the all-out round fired every
  present-tense "斬りかかる" upfront, desyncing action from damage. Now each beat narrates the actor's
  completed blow ("…に切りかかった。") then lands the popup line ("…に N ダメージ！") + floating number.
  React combat log aligned to the same wording/verb pool (i18n-localized). `verify_combat_numbers` +
  `verify_parity` + 733 unit + combat e2e green. `cb5336c`, `9051ae8`.

- [x] **T9/T13 held-evidence supplied** (Codex 2026-08-03 holds were missing evidence, not defects) —
  T9 鍛冶屋 real-build capture (`capture_blacksmith.gd` + 3 shots in `docs/evidence/t9-blacksmith-2026-08-03/`,
  self-verified); T13 no-purchase-vs-purchased B1F play record (sim:balance troughs + browser player-clear).
  Handoff: `docs/handoffs/2026-08-03-t9-t13-evidence.md`. `c006e43`. **Codex visual/feel sign-off pending.**
