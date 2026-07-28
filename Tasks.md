# Tasks — Verdant playtest follow-through (2026-07-27)

Rapid-fire playtest backlog, to be completed one at a time with verification + a gate where it
prevents recurrence. Ordered by the agreed priority (A first). Tick items as they land.

---
## ▶▶ NEXT SESSION QUEUE — playtest 2026-07-28 (process sequentially)
Build/run reminder: `npm run export:godot && npm run play` (godot/data is GITIGNORED — `npm run play` alone
uses STALE data). Truth gate `npm run gate:final`. Self-build + verify before handoff (AGENTS.md rule).

1. **勝利後に宝箱が出ない / 再戦バグ (#1+#7) — INVESTIGATED: rules are CORRECT.** A Godot probe (enter chamber
   → win) gave `chests=1` for the chamber, and re-fight is gated on that chest. TS sim agrees. So the
   implementation works at the rules level. MOST LIKELY the user's `godot/data` was stale (no `export:godot`).
   NEXT: have the user run `export:godot`; if the chest still doesn't SHOW, the bug is in the UI/scene, not the
   rules — check `dungeon.gd current_chest()` after victory→`_continue_after_combat` (resumePosition vs the
   chest's cell) and the dock rebuild. Also: the chest may sit on the anchor cell while the party lands on a
   different 2×2 cell.
2. **玄室の囲い込みが緩い.** carveEnclosedChamber's BFS guard often leaves 2 open sides + 1 door (walling more
   would disconnect), so the door is bypassable. NEXT: brace the maze harder near each chamber (more braiding)
   OR force a single opening and re-braid on disconnect, so the door is the SOLE entrance.
3. **罠処理 (盗賊).** Side-玄室 chests are `treasureTable` only (no trap); only the keep is trapped. NEXT: add
   traps to some 玄室 chests so investigate/disarm (thief) matters. (The "no trap" report is partly a
   consequence of #1 — no chest, no trap.)
4. **全滅 with a member at HP 1 (#4) — INVESTIGATED: dead enemies do NOT act** (party resolves first, only
   `livingGroups` with count>0 act — rulesEngine ~1454/1522). NEXT: check the WIPE condition — why 全滅 fired
   with ルーク at HP 1/29 (injury status? last-member edge? display artifact?). Not a "HP0 acts" bug.
5. **ランダム生成が Godot に無い (#5).** React has quick/random full-character generation; the Godot guild is
   staged-only. NEXT: add a random-generate affordance to guild.gd (mirror React's quick-gen), ux-parity-safe.
6. **encounter roll = groupsMin..groupsMax RANGE (scenario-tunable).** The roll fixes type-count at groupsMax
   (2 types → always both). Stopgap shipped: 3rd types on g1/g2/g8 + a ≥3-types gate. PROPER fix: add
   `groupsMin` to the schema/type + roll `[groupsMin, groupsMax]` in TS `resolveEncounterTable` AND Godot
   `resolve_encounter_table` (a TODO marker is left in rulesEngine.ts); re-record parity. Then the ≥3 gate can
   relax to ≥2.

---
## ✅ 玄室 redesign COMPLETE (phases A–C) — enclosed 2×2 rooms + closed-door gimmick + cleared visual
- A (`27c7b92`) — door gimmick: `door` is CLOSED, bump-to-open (first step opens+reveals, next enters) / 開く
  command; `openedDoors` per floor visit. B (`cc0207e`) — genVerdantFloors braids the maze + carves each 玄室
  as an ENCLOSED 2×2 with ONE door under a BFS connectivity guard (carve-verdant-chambers retired); metrics in
  band (sweep 308–339, loops 8–22). C (`this commit`) — CLOSED door renders opaque (leaves meet, hides the
  room), OPEN when opened; a cleared 玄室's landmark dims (its chest is out / claimed) so victory reads.
- Verified each phase: unit 687, build, parity (traces re-recorded), verdant-chambers, dungeon, flow, save,
  scene-harness, assets, clean headless boot. Build/run: `npm run export:godot && npm run play`.
- Codex owns final art review of the closed/open door + cleared-landmark look.

---
## (historical) resume note — 玄室 redesign, phases B & C

The 玄室 (Wiz guaranteed-fight + treasure room) redesign the user asked for. Decision LOCKED: **enclosed 2×2
room + closed door you open (Wiz 正統), fight, chest** + cleared-state visual. Build/run: `npm run
export:godot && npm run play`. Truth gate: `npm run gate:final` (NOT test:e2e). Godot data build needed
after content/i18n/schema changes.

**DONE + pushed this session:**
- Phase A — DOOR GIMMICK (`27c7b92`): a `door` edge is now CLOSED. Bump-to-open (first step opens + reveals,
  next step enters) OR the `open_door` command; `state.openedDoors` (both sides, key `door:roomId:direction`)
  resets on floor change. floorGraph keeps `door` WALKABLE so maze gates are untouched (runtime gate only).
  TS+Godot mirror, save schema, events (`door_opened`, movement_blocked reason `door`). Every 玄室 + keep
  already carries ONE `kind: door` edge (genVerdantFloors `chamberDoor`).
- #10B retreat→back a cell (`4779efd`); 玄室 2×2 render decorates the whole block (`95a974b`); chest loot in
  panel (`7ab0a4d`); guild rename + image-import (`1f59112`/`f39dd2f`).

**REMAINING:**
- **Phase B — enclosed 2×2 rooms (generator, the hard one).** Today the 玄室 are 2×2 OPEN blocks (verified:
  g1f chamber A = cells (9,9)(8,9)(9,10)(8,10) all open) with multiple corridor connections, so the MINIMAP
  shows corridors, not a room. Enclose each 玄室's 2×2 to ONE opening (the door), walling the rest, WITH a
  connectivity guard (BFS from entrance after each wall — only wall if the floor stays fully reachable).
  Loops will drop (pockets are dead-ends), so BRAID the base maze (open ~N extra walls) to keep loopCount ≥ 4;
  sweep will rise (backtracking) so RETUNE the maze gate bands in `tests/dungeonDesign.test.ts` (currently
  sweep 300–360, loops ≥4, frame-fill, branches ≥3, 玄室 ≥6). NOTE the two-stage pipeline (`genVerdantFloors.mjs`
  → `carve-verdant-chambers.mjs`): the door is authored as an EDGE in genVerdantFloors but the 2×2 is carved
  in carve-verdant-chambers, and enclosure must not wall the door's target cell — CONSOLIDATE the 2×2 carve +
  enclosure INTO genVerdantFloors so doors + walls + BFS are coherent (retire carve-verdant-chambers).
  Regenerate → re-run `dungeonDesign.test` + `verify_parity` (re-record verdant traces) + `verify_verdant_chambers`.
- **Phase C — closed-door RENDER + cleared-state visual (#10A).** dungeon_renderer.gd `_add_door` currently
  draws an OPEN door always; make a CLOSED (opaque, hides the room) vs OPEN look driven by `state.openedDoors`.
  And when a 玄室 is cleared (its chest is out / in floorClaimedTreasures), change its look (door stays open /
  landmark calms) so victory reads. Codex owns final art review; the wiring is ours.

---

## A. Save system  — DONE
The Godot build never autosaved during play, so every run started from the beginning. Wired it:
- [x] **Town autosave** (slot 1) — written on arrival in town (with a party).
- [x] **Stairs autosave** (slot 2) — written on a floor change via 階段を使う.
- [x] **Manual save** (slot 3) — 記録の間 has a 保存 button.
- [x] Title "続きから" loads the chosen slot and restores the run — now including the WORLD it was saved
      in (the old load kept only the state, so a Verdant save loaded onto the default world).
- [x] Gate: verify_save writes a Verdant slot to disk and reads it back with world + state preserved.

## B. Chamber (玄室) density — Verdant G1–G3 ≥ 6 each  — DONE
Wiz-style guaranteed-fight + treasure rooms. Was 3–4/floor (the generator only had 3 chamber GLYPHS, so
extra chamber rooms were defined but never placed on the grid and dropped on export).
- [x] genVerdantFloors: G1–G3 use 8 chamber coords + 7 chamber glyphs → G1f=8 / G2f=7 / G3f=8 玄室. Regen+export.
- [x] The keep's reward is a snare-TRAPPED chest again (restored in the generator so it survives regen).
- [x] Sweep/loops stay within the design gate (G2F still exempt).
- [x] Gate: dungeonDesign.test asserts Verdant G1–G3 each have ≥ 6 玄室. Parity + verdant-chambers green.

## B2. 玄室 are now REAL guaranteed-fight rooms (correction to B)  — DONE
Playtest caught that B only satisfied a COUNT: the plain chambers shared one pack table and the engine
suppresses an enemy TYPE once met per floor visit (first-contact), so only the FIRST chamber entered
actually fought — the rest sat empty and their chests were locked behind a fight that never fired. Godot
also never released a chamber's chest on victory at all (a latent parity gap). Fixed to the Wiz model
("入るたび確定湧き"):
- [x] New room field `chamberGuardian` — its fight is gated PER-ROOM (by the room's own chest claim), not by
      enemy type, so every chamber fights even sharing a pack table. (rulesEngine + scenario schema + types)
- [x] Generator marks every plain chamber `chamberGuardian: true` (the keep stays a once-only unique boss).
- [x] Godot mirror: `encounters.gd` bypasses type-suppression for chamber guardians, and `combat_round.gd`
      `_victory` now RELEASES the chamber chest on the win (was missing — chamber loot never dropped on the
      shipped build). TS `debug_force_victory` gained the same release for headless parity.
- [x] Gate: dungeonDesign 玄室 rule now requires `chamberGuardian` (not just "has a table"); new
      `chamberGuardian.test.ts` proves chambers fight independently + drop their chest on victory. Full unit
      (684) + parity + played-loop + dungeon + flow + verdant-chambers green.
- [ ] Still open (visual, Codex art-lane): 扉 on chamber entrances + landmark tone (see F).

## C. Shortcuts: warp → hidden door / hidden passage (Verdant, all floors)  — DONE
Only hidden doors / secret passages allowed; no warp shortcuts ("ワープではなく隠し扉・隠しみちのみ").
- [x] The generator now opens ONE maze wall between the two FARTHEST-apart corridors and hides it behind a
      `secret` edge — a physical hidden door (search 探索 to reveal, step through). No `gates:`/grantsFlag warp.
      Each floor's door short-circuits a 21–47-step loop (measured on the exported grid); 0 warp edges remain.
- [x] Design gate rewritten: a warp must collapse ≤15 (default b1f), a hidden door must short-circuit a
      loop ≥15; plus a Verdant world rule — every floor's shortcut is a spatially-adjacent `secret`, never a warp.
- [x] verdant-walk parity trace re-authored to the new mechanic (search → through the door → back → listen);
      parity + flow + played/return loops + fixtures all green.

## D. Chest loot display  — DONE
Opening a chest only said "宝箱は開いた。" — the loot event was emitted but Godot's _event_line never
formatted it, so it was silent (React logs it via events.inventoryItemGained).
- [x] Godot _event_line now logs `inventory_item_gained` (item name + quantity, affix/plus), so opening a
      chest shows "◯◯ を N 個見つけた。" in the message band. No state change → parity safe.

## E. Workshop (錬成所) discoverability  — DONE
分解 → 素材 → 強化 flow was opaque ("素材とは？").
- [x] 錬成所 intro now names the source: 素材 come from dismantling unneeded gear at the 鑑定所's 一括処分.
- [x] A gold zero-materials hint shows inline when materials == 0 (React + Godot), so the sink never reads
      as broken when every row says "素材N必要".
- [x] The 鑑定所 intro now says dismantling yields 素材 for 錬成所 強化 — both ends of the loop point at each
      other. ux-parity manifest re-derived (town-workshop 20 keys); ux-parity + town-controller green.

## F. Chamber landmark clarity + minimap markers  — minimap DONE; landmark pending
- [x] Minimap now draws the same chips the full map shows (stairs/treasure/gather/event/trap/… as
      colour dots via the shared FloorMap._marker), not just the town-return stair.
- [ ] The 玄室 landmark (pillars + floor disk) reads as an unexplained "green object" — visual tuning
      (Codex art-lane): tone the floor disk / make the hall read as a room, not a prop.

## G. Maze debt — Verdant G2F honest sweep  — DONE
- [x] Reseeded G2F (50502 → 50522): the old seed's maze was too open (sweep 288); the new one winds to
      sweep 342 (cells 187, loops 35) — within the 300–360 labyrinth band.
- [x] Dropped `dungeon.verdant.g2f` from MAZE_EXEMPT; it now passes every maze rule (frame-fill, sweep,
      on-path branches, hidden-door loop). Design gate 87 tests; parity + verdant-chambers + flow green.

---
### Done this session (context)
Chest freeze/clip · 隊列 Esc + level · 全体図 centered · stairs render→billboard · return-ledger trim ·
design gate → all worlds + encounter-table rule · full-map/minimap wall consistency.
