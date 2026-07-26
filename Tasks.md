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

## C. Shortcuts: warp → hidden door / hidden passage (Verdant, all floors)
Only hidden doors / secret passages allowed; no warp shortcuts.
- [ ] Replace `kind: shortcut` (warp) with a physical `secret`-gated passage on every Verdant floor.
- [ ] Update the design gate rule 4 to require a hidden-door shortcut, not a warp edge.

## D. Chest loot display  — DONE
Opening a chest only said "宝箱は開いた。" — the loot event was emitted but Godot's _event_line never
formatted it, so it was silent (React logs it via events.inventoryItemGained).
- [x] Godot _event_line now logs `inventory_item_gained` (item name + quantity, affix/plus), so opening a
      chest shows "◯◯ を N 個見つけた。" in the message band. No state change → parity safe.

## E. Workshop (錬成所) discoverability
分解 → 素材 → 強化 flow is opaque ("素材とは？").
- [ ] Make the path clear: where 素材 come from (聖遺物で分解) and how to use them.

## F. Chamber landmark clarity + minimap markers  — minimap DONE; landmark pending
- [x] Minimap now draws the same chips the full map shows (stairs/treasure/gather/event/trap/… as
      colour dots via the shared FloorMap._marker), not just the town-return stair.
- [ ] The 玄室 landmark (pillars + floor disk) reads as an unexplained "green object" — visual tuning
      (Codex art-lane): tone the floor disk / make the hall read as a room, not a prop.

## G. Maze debt — Verdant G2F honest sweep
- [ ] Raise G2F sweep from 286 to ≥ 300 (currently exempt in MAZE_EXEMPT); then drop the exemption.

---
### Done this session (context)
Chest freeze/clip · 隊列 Esc + level · 全体図 centered · stairs render→billboard · return-ledger trim ·
design gate → all worlds + encounter-table rule · full-map/minimap wall consistency.
