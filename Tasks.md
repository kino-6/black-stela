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

- [ ] **T3 — 罠は「あり/なし」でなく「特定できる/できない」(Wiz式識別)**
  - Investigating a trapped chest should NAME the specific trap on a successful check
    (「毒針の罠を見抜いた」) and, on an uncertain check, say a trap is present but its KIND is unknown — not a
    flat 「罠が仕掛けられている」. Disarm relates to the identified kind. Extends IMP-061 (the sprung message
    already names the kind).
  - React + Godot chest rules/copy (parity).
  - **Gate:** a chest-rules test — a successful investigate reveals the trap kind; an uncertain one reports
    "trap present, kind unknown"; never a false "clear" (proven to fail on the flat-message code).

- [ ] **T4 — 罠解除/開封後の報酬プレゼン: 宝スチル＋相応の報酬 (Wiz式)**
  - After disarm/open the reward reads as an あっさり log line with a しょうもない payout (one cheap potion).
    Want: (a) **presentation** — the reveal is a BEAT with the open-chest still, not a fleeting line; (b)
    **content** — trapped / guardian chest treasure tables give a MEANINGFUL reward (gear / multiple / a
    notable item), not a single consumable.
  - Balance authored in `content/worlds/*/treasure.md` (and the reveal in the chest panel / dungeon).
  - **Gate:** a chest-reward test — a trapped/guardian chest yields more than one cheap consumable
    (value/roll floor); the opened-result panel shows the still + the reward line. Visual check of the beat.

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

- [ ] **T6 — セーブ削除機能（タイトル/メニューから）**
  - Let the player DELETE a save slot from the menu (title continue-list is the natural place; the user
    said "メニュー画面で削除できるといい"). Confirm before delete (irreversible). React + Godot (parity) —
    save slots live in `saveData`/the run/save autoload.
  - **Gate:** a save test — deleting a slot removes it from the listed saves and cannot be undone; the
    title continue-list reflects the removal; controller-reachable with a confirm step.

- [x] **T7 — 探索フィードバック＋ログの視認性** — DONE
  - (a) `dungeon._event_line` now says 「この場所の隠し通路はもう開いている。」 on a cell whose secret is
    already discovered (`_has_opened_secret_here`, keyed to the rules' `secret:<room>:<dir>`), not a flat
    "nothing found". Locked in `verify_dungeon_controller` (both branches).
  - (b) The dungeon log is now a framed WINDOW (gold-bordered panel, autowrap) above the party formation —
    verified legible. dungeon-controller green.

- [ ] **T8 — 商店の全面リデザイン（世界樹式・buy/sell分離・party-wide）** ⟵ needs a design-direction OK
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

- [ ] **T10 — ギルド名簿編集の配置＋画像取り込みバグ**
  - (a) The roster editor (名簿を整える: 名前/称号/記録/画像取り込み) is crammed into the narrow bottom-right
    hall panel. Move it into the MAIN left window (the ギルドマスター briefing area has all the room) so editing
    a member is a proper screen, not a corner.
  - (b) **BUG:** 「画像を取り込む」 does not let the user select their prepared image — importing a custom
    portrait fails. Investigate `guild.gd:_import_portrait` / `_image_file_to_data_url` (native FileDialog on
    macOS; file_selected → data URL). Repro + fix.
  - Godot `guild.gd` (roster hall panel ~652-720; `_import_portrait`); React parity for the layout if it
    diverges.
  - **Gate:** import test — a chosen image becomes the member's portraitRef (data URL) and persists a
    save/re-save; roster editor is controller-reachable and fits the main window at 1280/1920.

- [ ] **T12 — 装備タブがコントローラで操作できない (BUG, blocks equipment changes)**
  - In the party-menu 装備 tab, character selection AND equipment change cannot be done with a controller —
    functional bug (controller-first-ui violation: every screen must navigate by arrows/confirm). Investigate
    focus flow in `party_panel.gd` equipment page: roster select → slot select → candidate select must all be
    reachable + confirmable without a mouse. Likely the slot/candidate buttons aren't focusable or focus never
    lands there.
  - **Gate:** extend `verify_town_controller` / a party-menu controller test — on the 装備 tab, focus lands,
    a slot is focusable, and picking a candidate dispatches equip; 0 pointer events.
  - **Investigation (2026-08-02):** `_equipment_page` builds three button groups — roster (character select),
    slots (`set_party_equipment_slot`), candidates (`set_party_equipment_candidate`) + an equip button. ALL are
    normal focusable `UI.button`s, so the bug is almost certainly focus-NEIGHBOR traversal between the groups
    (roster card | detail card → slots / candidates scroller): Godot's geometry-based neighbor can't cross the
    nested cards/scroller, so arrows get stuck in one group and the player can't reach slot→candidate→equip.
    Fix likely needs explicit `focus_neighbor_*` wiring (or one flat focus chain) across the groups, proven by
    a controller nav test. Needs real-scene reproduction — not a blind edit.

- [x] **T11 — 装備検討時の情報不足（隊列・現ジョブ・顔画像を追加）** — DONE
  - `party_panel._roster_row` now shows, per member: the PORTRAIT (顔画像), a 前衛/後衛 ・ <現在の職> line
    (row + localized vocation), alongside name/Lv/HP. Verified on the 装備 tab (fits, reads at a glance).

- [-] **T13 — 難易度検証 — DONE (verified working-as-designed; a design decision remains)**
  - descentSim per-floor (heal:none): **naive lv1 WIPES** — Verdant is at ~7% HP by g1f and wipes at g3f;
    default barely reaches b2f then falls. **Prepared clears** (Verdant g1f 77% > the 0.7 "teaches-gently"
    floor). So the invariants hold and difficulty IS calibrated. The user's easy G2F is the *deliberately
    gentle Act I* seen by a LEVELLED/HEALED party (the sim's naive-lv1-heal-none is the worst-case wipe
    floor, not the normal experience). **NOT a bug.**
  - Remaining = a DESIGN DECISION for the user: keep Act I gentle (teaches), or make early floors demand
    prep sooner? If the latter, tune `verdant/world.md` balance (threatScalar/hpScalar) — but the
    "Act I teaches gently (g1f>0.7 prepared)" invariant is a locked gate, so this is a deliberate re-target,
    not a silent change. No edit made pending that call.

- [ ] **玄室 landmark visual tuning** (carried over, Codex art-lane)
  - The 玄室 landmark (pillars + floor disk) reads as an unexplained "green object"; tone the floor disk /
    make the hall read as a room, not a prop. Closed-door on chamber entrances is done; this is the interior.
  - **Gate:** visual review on the real build (Codex art-lane sign-off).

- [x] **IMP-063 descent colour arc + textures — DONE** (art delivered + verified 2026-08-02)
  - Colour arc (per-floor palette) + Codex's Default 3-band TEXTURES (`a8fc903`) both landed. Verified via the
    deep-floor sweep: B1F clean dry ash-stone (block1, B1 ash-stone-v2 exception removed), B5F damp blackened
    stone (block2), B8F purple-black stone split by black roots (block3) — reads as a clear descent. Verdant
    already had its own block1/2/3. Move to Archive on next tidy.

---

## Recently done (awaiting nothing — move to Archive on next tidy)

- [x] **T1 (IMP-064) 全員でかかる instant → beat-by-beat** — all-out narrates each living attacker before
  the real damage/defeat, no longer snapping to the result. Gate: `verify_combat_controller` green. `e8fd07f`.
