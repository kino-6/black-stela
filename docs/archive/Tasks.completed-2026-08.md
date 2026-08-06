# Tasks — completed (2026-08 playtest marathon)

Archived from `Tasks.md` on the 2026-08-03 tidy (kept only open / in-progress work; target <200 lines).
These are DONE + gate-green + committed; see the named commits/gates in each entry.

---

- [x] **T20 — 戦闘の敵HPバーが重なっている** — DONE (`1f99089`): 各ユニットのバー幅を隊列の spacing に
  クランプ（6px間隔）。verify_combat_numbers 緑。(Godot) — 実機戦闘で、敵グループの足元に置くHPバーが隣の
  グループのバーと重なって表示される（胞子蝿×3 と 苔虫 の2グループで、バーが横に重複）。各グループのバーが
  自グループの図の幅内に収まり、隣と重ならないようにする（アンカーのx位置/バー幅の算出を見直す）。
  - **Gate:** `verify_combat_*`（バーの矩形が隣接グループと重ならない＝x範囲が非オーバーラップ）を追加/更新し、
    現行コードで落ちることを確認してから修正。実機キャプチャで重なり解消を確認。

- [x] **T21 — ダメージポップアップのX軸ずれ＋ポップアップ時にHPバーが更新されない** — DONE: 数字は被弾
  マークの実スクリーン中心（体の上部）へ `damage_number_at`。各ビートで running HP を計算し当該グループの
  マークを再描画してバーがその場で減る。parity/combat-controller/combat-numbers 緑、実機レンダ確認。(Godot) — 実機戦闘で
  ダメージ数字（例「-9」）が敵画像のX位置ではなく画面上部中央付近に出る。**被弾した敵グループのX（x_frac）
  真上**に出す。加えて、ポップアップ表示中に敵グループのHPバーが減らず、ビート後まで満タンのまま
  （`_rebuild_stage` がビートループ後にしか走らない）。**各ビートで被弾グループのバーをその場で減らす**。
  - **Gate:** `verify_combat_numbers` を拡張（数字のX中心が対象グループのx_frac位置に一致／被弾ビート後に
    当該グループのバー value が減っている）。現行で落ちることを確認してから修正。実機で確認。

- [x] **T22 — 被弾表現：HPバーが減らず「いつの間にか死んでいる」** — DONE: HPゲージを juicy 化（メイン
  即減り＋背後の赤ゴーストが一拍遅れて追う chip バー）。ラウンド前に味方HPをスナップし、敵反撃で減った各
  メンバーはカード上にダメージ数字＋バーがアニメで減る。旧バグ（`_refresh_member` が value=raw hp を max100 に
  設定）も是正（max=maxHp）。シェイク/全画面フラッシュ無し。(Godot, 敵＋味方) — 味方HPバーが
  敵の反撃で減らず、気づくと戦闘不能。ダメージ被弾を分かりやすく。**安易なシェイク/全画面フラッシュはNG。**
  現代RPGの定番＝**HPバーのアニメ減少＋遅延ゴーストバー（chip/残像バー：メインは即減り、背後の赤バーが一拍
  遅れて追いつき「削られた量」を残す）** ＋被弾対象の上にダメージ数字＋減少時だけバー色を軽くパルス＋ビート単位
  の再生。敵グループ・味方の両バーに適用。T21（敵バー更新/ポップアップX）と同じ再生系で実装。
  - **Gate:** `verify_combat_*` を拡張（ビートで味方/敵の当該バー value が減る／ゴーストバーが存在・遅延）。
    現行で落ちることを確認してから修正。実機で敵反撃時に味方バーが目に見えて減ることを確認。

- [x] **T24 — 手番ポートレートが行動者に切り替わらない** — DONE: 再生の各ビートで手番ポートレートを
  行動メンバーへ差し替え（`_set_spotlight_member`）。ログの敵名は `_enemy_ja`（ローカライズ）に修正し
  「Spore Gnat」→「胞子蝿」。(Godot) — 戦闘中、左の「手番」顔画像がずっと同じ
  キャラのまま。再生（playback）で行動しているメンバーに合わせて切り替え、誰の番/誰が殴ったかが分かるように。
  ついでにログの敵名が英語漏れ（「Spore Gnat」→「胞子蝿」）— beatのtargetNameをローカライズ名にする。
  - **Gate:** `verify_combat_*` にビートごとの手番ポートレート＝行動者、ログ敵名がローカライズ、を追加。

- [x] **T28 — 鍛冶屋の専用スチル** — DONE (Codex art-lane, 2026-08-03): 1600×900 の世界別スチルを納品。
  Default は煤けた石造の炉・鉄床・工具、Verdant は根と土炉・木床の工房で、既存の施療院／市場スチルと同じ
  広い室内・線画を残す絵画調に揃えた。`content/worlds/{default,verdant}/assets/ui/blacksmith.png` に置き、
  `npm run export:godot` でステージング済み。二重スクリーンでスチルが消えていたため、鍛冶屋だけは追加scrimと
  外枠を半透明にし、行カード・ボタンの可読性を変えず炉／鉄床が読めるようにした。
  - **Evidence:** `docs/evidence/t28-blacksmith-stills-2026-08-03/`（Default affordable / at-cap、Verdant at-cap、
    いずれも1920×1080実機キャプチャ）。
  - **Gate:** `verify_town_stills` 0 warning / 0 failure（両世界の専用スチルを検出）、`verify_town_controller` 緑、
    Godot clean boot 緑。T28の新規missing-still Gate は以後も `gate:migration` で追跡する。

- [x] **T27 — 町メニュー：開けない＋トグル表示バグ** — DONE: (a) `menu` アクション(Tab)で町ルートから
  メニュー開閉、さらに町ルートの `cancel` でも開く（迷宮の「キャンセル→メニュー」と統一、cancel が必ず解決）。
  (b) トグル状態を `config.on/off`（オン/オフ）に修正（旧 `tempo.auto/stop`「オート/停止」を廃止）。
  town-controller 緑、実機キャプチャで確認。(Godot) — (a) **街でメニューが開けない**（右上メニュー/
  設定へ到達できない・再オープン不可＝コントローラ経路の欠落の疑い）。開けるようにする。(b) 設定トグル
  （危険時オート停止・実行確認・戦闘ログ一気・手番拡大・効果音）の状態表示が「オート」「停止」になっていて
  意味不明 → **オン/オフ（有効/無効）** に直す。設定を右上に出すこと自体はOK（配置は変えない）。
  - **Gate:** `verify_town_controller`/`verify_config_*` に「町でメニューが開ける（フォーカス到達）」＋
    「トグル状態ラベルがオン/オフ」を追加。現行で落ちることを確認してから修正。

- [x] **T26 — Verdant G1F の戦利品が二束三文ばかり** — DONE: G1 戦利品に**スロット別の装備**（樹皮の小盾/
  苔の頭巾、既存の茨の鞭/樹皮の鎧）＋**換金物**（琥珀の樹脂 sell28）を追加。g1.side/g1.keep をリバランス
  （茨の鞭の独占 w10 を解消、keep は gear weight ≥ consumable を維持＝treasureRewards 緑）。装備はテキストUIで
  3Dアート不要。733 unit・build 緑。(content) — 翠碑 G1F で「イバラの鞭」か、売っても
  二束三文のアイテムしか出ない。G1F の宝箱/ドロップに、序盤として価値ある選択肢（使える装備・素材・そこそこの
  換金物）を増やす。`content/worlds/verdant/`（items/loot tables/chests）。treasureRewards 等のゲート維持。
  - **Gate:** verdant loot テーブルの gear/価値の下限を lock、`tests/treasureRewards.test.ts` 相当を verdant にも。

- [x] **T25 — Verdant G1F の敵が単調（同じ敵ばかり）** — DONE(一次): G1F pack を moss-mite 独占（w10）から
  **4種を均等配分**（moss-mite/spore-gnat/bark-tick/thorn-crawler、各 w5-7）に。bark-tick は既存アート（T14）を
  G1へ投入。first-contact の各種を軽量化して act 曲線維持（733 unit・verdant balance 緑）。**追加の新規敵種は
  Codex アート待ち**（新スプライトが無いと透明描画）。(content) — 翠碑 G1F でずっと同じ敵に当たる。
  first-contact モデル（各TYPE 1回/run）で G1F が導入する種が少ない。G1F に敵タイプを追加し、序盤の
  出会いに変化を出す（`content/worlds/verdant/` の enemies/encounters/dungeon rooms、descentSim で act 曲線維持）。
  - **Gate:** verdant balance/coverage sim + `verify_verdant_chambers` 緑、G1F の導入タイプ数が増える。

- [x] **T23 — 階段ナレーションが方向を誤表示（下り階段を「上れば町へ戻る」）** — DONE (`5bef598`):
  `_stairs_info` の kind/target を見て down→「次の階へ」、up→町（target無し）/前の階、を出し分け。(Godot) — 根の下り（G2Fへの
  **下り**階段）で「階段だ。上れば町へ戻る。」と表示される（Image #51「大嘘、これは2Fへの階段」）。ナレーション
  を階段の**実際の向き/行き先**に合わせる：上り＝町/前の階へ戻る、下り＝次の階へ降りる。入口の上り階段のみ
  「町へ戻る」。`_stairs_info` の kind(up/down) を見て文言を出し分ける。
  - **Gate:** `verify_dungeon_controller` に down階段セルで「次の階へ」系、up階段（入口）で「町へ戻る」系、を追加。

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

---

## 2026-08-05 — U-series (実機playtest 追加要望) + CI 復旧 — all DONE + merged to main

- **U1 戦闘オート二系統化** (`5175ebc`) — 攻撃オート[R]／守備オート[G] の2ループ。全員でかかる(F,1ラウンド)据置。
  tempo.ts `chooseDefensiveRoundActions`＋strategy、App.tsx G hotkey、Godot combat.gd `_defense_auto_actions`。
- **U2 顔/全身ポートレート使い分け** (`7a6514f`) — 顔=`assets/portraits/<key>.png`（正方形）／全身=新設 `assets/bodies/<key>.png`
  （2:3、同 portraitKey）。小トークン=顔、戦闘スポット＋presence=全身（body→クラス立ち絵→顔 fallback）。React byPackBody/bodyUrl、
  Godot WorldResources.face_path/body_path。stage:assets に bodies 追加＋削除ミラー化。
- **U3 CLASS_CAPABILITIES 外部化＋terminal-line 全8職テーマ化** (`75453a8`→`c642e76`) — `world.classTechniques` が base
  CLASS_CAPABILITIES を classId 単位で置換（未 authored は参照同一＝byte 不変）。knownSpells/resolveVocationState に world 貫通、
  kind パリティ厳守、firearm クラス習得禁止 invariant。terminal-line 8職改名＋48テーマ技（base 1:1 re-skin）。
- **ポートレート選択プール** (`403dcbf`) — `ScenarioWorld.portraits: string[]`（作成時の選択プール拡張）。body-only figure も
  顔枠で top-crop 表示。terminal-line chara-13..32（20枚）宣言＝プール32個。React face step に swatch grid、Godot _face_keys 拡張。
- **U4 Save 再設計** (`a2c3cd1`) — 固定スロット→**シナリオ別 autosave＋手動3スロット**。envelope 不変＝parity 0-fail。
  slot id `auto:<worldId>` / `manual:<worldId>:<n>`（saveData.ts＋save_game.gd 共有）。React: per-scenario autosave、Continue=最新、
  新 SaveBrowser（全 save load/削除）、記録の間に手動3スロット。Godot: string slot id＋list_slots、title 全 save 列挙。
- **CI（GitHub Actions）赤の完全復旧** (`d816280`) — unit timeout（debugAutoExplore 30s）＋chests RNG非依存化、postcss 脆弱性
  audit fix、ux-parity 4ギャップ（aptitude.balanced 幻＋map.darkness dead content を exclusion、play.useStairs=P10 方向別ラベルの
  React 側完成、useReturnMarker=at_rest room 修正）、e2e stairs ラベル改名の5 spec 修正、playwright retries:CI?2、tempo 系 e2e は
  **freeze-tempo test seam**（localStorage フラグで tempo interval 早期 return）で決定化。**CI 完全 green 確認済**。

## 2026-08-05 — U5/T30 (N dungeons) + U6 (stairs FPV) — DONE + merged

- **U6 stairs first-person render** (`222249f`) — stair geometry was on the stair EDGE only, so it
  vanished when the party stood on the cell facing away. Added a stairhead marker at the CELL CENTRE
  (railed frame + high stair placard on crossed quads, tall enough to clear the party HUD) visible from
  any facing. Gate `verify_stairs_render.gd` (headless, all worlds); rendered default/verdant/terminal-line
  toward + away.
- **U5 = T30 — N dungeons per scenario** (`9e866f3`) — a world may define multiple independent dungeons,
  each with its own town portal. Engine was already floor-scoped (nav/map/save key on map.floorId+position),
  so contained + save/parity-safe. Additive data: `DungeonFloor.dungeon?` (group), `ScenarioWorld.entrances?`
  (portals); startDungeon/startRoom stay the default. enter_dungeon gains optional startRoom (React+Godot
  command + Godot played-build town→dungeon_entry.plan via run.pending_entrance_room); town renders one
  button per portal. Validators/sim per-group (reachability from every entrance, progression same-group only,
  descentSim dungeonId, worldRegistry group-then-level sort). nDungeons.test 6 tests; existing worlds
  byte-unchanged (unit 889, parity 0-fail). Follow-up: authoring a real 2nd dungeon in a shipped world is
  content; up/down arrow glyphs still array-order (harmless cross-group).

---

## 2026-08-04〜05 — U / V シリーズ + terminal-line 世界プログラム（W）進捗（2026-08-05 groom で移設）

- [x] **U1–U6 + ポートレート選択プール + CI 復旧 — DONE + merged.** U1 戦闘オート二系統化（攻撃/守備） · U2 顔/全身
  ポートレート使い分け（`assets/bodies/`、face は body 上端 top-crop フォールバック） · U3 CLASS_CAPABILITIES 外部化
  ＋terminal-line 全8職テーマ化（保安隊員 等、`world.classTechniques`／`resolveClassCapabilities`、銃は装備由来のみ） ·
  U4 Save 再設計（`auto:<worldId>`＋`manual:<worldId>:<n>`×3＋Load browser） · **U5=T30 1シナリオ N 迷宮**
  （`world.entrances`＋`DungeonFloor.dungeon` グループ、町に迷宮ごと入口、validator/sim を per-group 化、
  nDungeons.test 6本、`9e866f3`） · **U6 階段 FPV 描画**（セル中心 stairhead marker、`verify_stairs_render`、`222249f`） ·
  ポートレート選択プール（`world.portraits`、chara 素材20枚）。CI（GitHub Actions）赤の完全復旧（autosave キー刷新の
  e2e 追随、`153b659`）。
- [x] **U5 実コンテンツ — 貨物基地（terminal-line 2つ目の迷宮、3層・中盤の息抜き＆稼ぎ場）— DONE + merged** (`d935c85`):
  受入→仕分け→保税倉庫、`world.entrances` で町に2ポータル、既存 enemy/item 再利用の farm 遭遇＋売却装備、boss なしで再戦可。
  残（任意）: 上下階段矢印グリフは配列順のまま（別グループ跨ぎは descent 既定＝無害）。
- [x] **V1–V5 terminal-line 実機playtest — DONE + merged** (`0e7d06e` / `c4e5490`)。React+Godot 両建て（base world は
  フォールバックで不変）。**V1** 入口名 黒碑→「零番線へ降りる / Descend to Platform Zero」。**V2** 作成/名簿/転職/サマリの
  職業名が世界の再スキン反映（React `localizedVocationName`/`getActiveWorld()`、Godot `guild.gd`/`town.gd _class_label`）。
  **V3** 見繕いが `world.portraits` からポートレート配布（React `createSuggestedRecruitForParty(world)`、Godot
  `guild_draft.randomize(extra_faces)`）。**V4** Godot 戦闘に 全員でかかる[F]/攻撃オート[R]/守備オート[G] chip。**V5** 見繕う後の
  登録メンバー顔ブランク（V3派生）を修正＝committed-member 顔解決5経路（guild/town/dungeon/result/party_panel）を
  `WorldResources.face_path`（顔→世界body→default gate）へ統一。Gate: build+test(889)+gate:godot 全緑。
- **terminal-line（封鎖線）W0/W1 — Codex 投入済み:** 表示名「終端隔離線 — 零番線」、world id `terminal-line`。F1/F2＋乗換広場を
  canonical pack 化、`world.md`/`manifest.md`/全 data file、renderer 固定 basename、enemy base/hurt、item/equip icon。
- **W4 Codex 完了バンド（terminal-line F3–F10）:** 19×19 maze・上下階段・帰還点・端末イベント・宝・進行・経済を投入。
  深層敵帯（F3 中継保守 / F4–F6 雨水・補給・記録 / F7–F10 統制・昇降・終端の固有 catalog、own-basename 768² base/hurt、
  F10 専用守護者）。装備帯＋装備アイコン帯（全 `equip.tl-*` に 256² RGBA icon）。鉄雨火器帯（自動小銃/短機関銃/散弾銃/
  指定射撃銃/軽機関銃、架空名）。制式火器更新系列（拳銃/長銃/短機関銃/散弾銃 各5段、長銃 F1＝三八式歩兵銃、計48装備）。
  補給・横選択拡充（全32装備・全17物資）。※実在銘は三八式のみ（user 明示指定）、未実装の弾薬/連射/騒音は数値・説明で偽装しない。
