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

- [ ] **T2 — 玄室の敵出現ポイントを扉に隣接させる**
  - The guardian / `keep` miniboss encounter must sit on the cell ADJACENT TO (behind) the chamber's
    sealed door — a guardian placed anywhere else is meaningless (the closed door is the choke it holds).
  - Content/data: for each floor with a guardian chamber, check the `keep`/guardian room's encounter cell
    vs the chamber door cell; move the encounter onto the door-adjacent cell.
  - **Gate:** a design-gate assertion — every guardian/keep chamber's encounter cell is adjacent to the
    chamber's sealed-door cell (headless, over both worlds).

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

- [-] **T5 — 勝利/成長画面に「レベルアップで何が変わったか」を明記 (REGRESSION)** — Godot DONE, React mirror pending
  - Godot `result.gd` now shows per levelled member: stat deltas (HP+5 MP+2 攻撃+1 威力+1 命中+1 速度+1),
    any newly-usable 特技/呪文, and 次のレベルまで N. Verified on the result screen. React `CombatResultPanel`
    mirror + a lock still to do.
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

- [ ] **T7 — 探索フィードバック＋ログの視認性**
  - (a) Searching a cell whose secret/hidden path is ALREADY opened reports 「あたりを探ったが、何も
    見つからない。」 — misleading. It should say the passage here is already open (or there is nothing left
    to find here), not a flat "nothing".
  - (b) The dungeon log (bottom-left) is too inconspicuous — give it a Window/frame so search results,
    trap notes, and openings actually read.
  - Godot dungeon (`dungeon.gd` log + `_event_line`/search result) (+ React parity for the copy).
  - **Gate:** search-result test — searching an opened-secret cell reports "already open", not "nothing";
    visual check the log window is legible at 1280/1920.

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

- [ ] **玄室 landmark visual tuning** (carried over, Codex art-lane)
  - The 玄室 landmark (pillars + floor disk) reads as an unexplained "green object"; tone the floor disk /
    make the hall read as a room, not a prop. Closed-door on chamber entrances is done; this is the interior.
  - **Gate:** visual review on the real build (Codex art-lane sign-off).

- [ ] **IMP-063 descent colour arc — visual sign-off** (not playtest-blocking)
  - User reviewing the per-floor colour arc in the real build (deep-floor QA starts floor_5 / floor_8);
    tune hue/strength on feedback. Optional next: Codex brief (drafted) for Default 3-band descent TEXTURES
    — Default currently has only the colour arc, no distinct band art like Verdant's block1/2/3.
  - **Gate:** deep-floor sweep (`capture_deep_floors.gd`) + user/Codex visual sign-off.

---

## Recently done (awaiting nothing — move to Archive on next tidy)

- [x] **T1 (IMP-064) 全員でかかる instant → beat-by-beat** — all-out narrates each living attacker before
  the real damage/defeat, no longer snapping to the result. Gate: `verify_combat_controller` green. `e8fd07f`.
