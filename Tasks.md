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

- [-] **T2 — 玄室の敵出現ポイントを扉に隣接させる** — analysis done, deferred behind clear wins
  - Encounters trigger on ROOM ENTRY (`begin_room_encounter`), so the guardian is fought at whatever cell
    you enter the chamber from. The real intent: **a guardian chamber must be a true door-CHOKE** — its only
    entrance is the sealed door, so the guardian can't be bypassed. If a chamber has an open (non-door)
    entrance too, the sealed door is meaningless.
  - Concrete plan: add a **design-gate assertion — every `chamberGuardian`/`keep` room's boundary edges are
    all door/secret (no plain `open` entrance)** over both worlds; seal any stray entrance a floor exposes
    (then re-verify the maze design-gate, which asserts sweep/branch metrics). Deferred to avoid a risky
    maze edit under time pressure; needs a careful design pass.

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

- [ ] **T9 — 鍛冶屋: 金銭で装備を強化する施設（上限あり）**
  - Want a blacksmith that upgrades gear for GOLD up to some cap. NB: the 錬成所 (workshop) already does
    強化 via MATERIALS (from dismantling) — T9 is the GOLD axis (a different sink), or an extension of the
    workshop with a gold path. Decide: new facility vs. add a gold-cost tier to 錬成所. Reinforcement rules
    live in `economy.gd`/`reinforceEquipment`; town facility list in `town.gd`.
  - React + Godot (parity), i18n, ux-parity, town-controller.
  - **Gate:** upgrade test — gold upgrade raises the piece's +level up to the cap, costs gold, refuses past
    the cap / when broke; controller-reachable.

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

- [ ] **玄室 landmark visual tuning** (carried over, Codex art-lane)
  - The 玄室 landmark (pillars + floor disk) reads as an unexplained "green object"; tone the floor disk /
    make the hall read as a room, not a prop. Closed-door on chamber entrances is done; this is the interior.
  - **Gate:** visual review on the real build (Codex art-lane sign-off).

- [x] **IMP-063 descent colour arc + textures — DONE** (art delivered + verified 2026-08-02)
  - Colour arc (per-floor palette) + Codex's Default 3-band TEXTURES (`a8fc903`) both landed. Verified via the
    deep-floor sweep: B1F clean dry ash-stone (block1, B1 ash-stone-v2 exception removed), B5F damp blackened
    stone (block2), B8F purple-black stone split by black roots (block3) — reads as a clear descent. Verdant
    already had its own block1/2/3. Move to Archive on next tidy.

- [ ] **T14 — 敵の見た目・遭遇バリエーションを各階層帯で増やす**
  - **Problem:** both worlds have authored sprites, but ordinary encounters keep reusing the same 2–3
    silhouettes over a whole act. The existing tables lean too hard on carry-over entries (e.g. Verdant G6–G8
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

- [ ] **T15 — オート/全員でかかる の再生に数字とHP更新が出ない (REGRESSION vs T1)**
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

- [ ] **T18 — 回復の対象選択: 満タンは選べない＋初期カーソルは最重傷へ（＋partyMenu.back 未翻訳バグ）**
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

- [ ] **T19 — ダメージ数字の演出を「気持ちよく」する（業務アプリ感の脱却）**
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
