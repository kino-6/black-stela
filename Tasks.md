# Tasks — Verdant playtest follow-through (2026-07-27)

Rapid-fire playtest backlog, to be completed one at a time with verification + a gate where it
prevents recurrence. Ordered by the agreed priority (A first). Tick items as they land.

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
