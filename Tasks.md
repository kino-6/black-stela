# Tasks — Verdant playtest follow-through (2026-07-27)

Rapid-fire playtest backlog, to be completed one at a time with verification + a gate where it
prevents recurrence. Ordered by the agreed priority (A first). Tick items as they land.

---
## ▶▶ RESUME HERE — 2026-07-28 (session state, all pushed to main)
Build/run: `npm run export:godot && npm run play` (godot/data GITIGNORED). Truth gate `npm run gate:final`;
Godot gates `npm run gate:migration`. Self-build + verify before handoff (AGENTS.md).

**Pushed this session (newest last):** `178c476` Codex 棘虫 nameplate clamp (QA'd+committed) · `b0eb2ea`
TOWN REDESIGN · `e9df977` difficulty sim party-size axis + `sim:balance` · `4ff1c99` difficulty-design doc +
economy schema (slice 1).

### ✅ Town square redesign — DONE (`b0eb2ea`, React+Godot+manifest parity, gate:final + gate:migration green)
World-title heading (drops the "初めて潜る前に" tutorial), party FORMATION rail reusing `dungeon_hud.party_token`
+ 職業名 (optional `class_label`), a MENU overlay (settings + title, cancel-closable), bottom-spread layout.
Screenshot: `godot/tests/_ux_town-square.png`. Codex owns any final art polish.

### ⏳ IN PROGRESS — Difficulty design (sim + theory, scenario-owned) — the user's active thread
SPEC: **`docs/design/difficulty-design.md`** (read first). Tool: **`npm run sim:balance`**. Decisions LOCKED:
EO/Galleria-refined; party-size = proportional attrition (`partySizeValue`); resource/economy axis EO-leaning
**early→mid, easing to Act III** (= felt growth); ALL knobs authored per-scenario in `world.md balance.economy`.
- **Slice 1 DONE** (`4ff1c99`): `balance.economy` schema (carryCap[] per act, stackCap, priceScalar[],
  incomeScalar[], provisionKit) in scenario.ts + types WorldBalance — data receptacle, behaviour unchanged.
- **Slice 2 NEXT** (task #8): extend `descentSim` with the **PROVISIONED descent** (carry a cap-bounded,
  affordable kit; auto-use heals/cures at HP/status thresholds) → metrics: consumable **burn/floor**,
  **kit-exhaustion floor**, **economy balance** (dive income ÷ full re-provision). Also **split trash-trough
  vs telegraphed-spike** (玄室 guardian / 番所 keep) and add **MP/気力 attrition** to `FloorSimResult`. Add
  columns to `sim:balance`. (`partySizeValue` + party-size sim axis already landed in `e9df977`.)
- **Slice 3** (task #9): gate the targets in `descentSim.test.ts` (smooth act-curve band, **prepared party
  never wipes**, party-size cost large-but-finite, scarcity: kit low by the act spike), then TUNE the authored
  knobs against `sim:balance` and **browser-verify** (sim is a lower bound — tune slightly gentle).
- **Measured NOW (before tuning):** both worlds flat-then-spike — Verdant g1/g2 troughs 100/95% (target
  85-65% = "ヌルい") while g8 = 3% (near-wipes a PREPARED party; target 38-28%). `underpowerFactor` is inert
  (no floor authors `recommendedPartySize`) so under-strength danger isn't proportional (3p trough = 6p).

### ⤷ Combat-depth candidate (design-doc backlog): 多段ヒット `hits:N`
AoE EXISTS (`target:"allEnemies"` — flame-wave, sweeping-blow). **Multi-hit does NOT** — no hit-count. A
`hits:N` on a technique effect = a martial "sweep several BODIES of one pack" lever (distinct from AoE), feeds
build diversity. Recorded in difficulty-design.md "Candidate levers".

---
## ✅ NEXT SESSION QUEUE — playtest 2026-07-28 — ALL SIX DONE (gate:final GREEN: 687 unit + 139 e2e)
Build/run reminder: `npm run export:godot && npm run play` (godot/data is GITIGNORED — `npm run play` alone
uses STALE data). Truth gate `npm run gate:final`. Self-build + verify before handoff (AGENTS.md rule).

1. **勝利後に宝箱が出ない / 再戦バグ (#1+#7) — DONE** (`b00c03e`): rules were correct; root cause was stale
   `godot/data`. Locked with a regression test (chest on party cell after `continue_after_combat`).
2. **玄室の囲い込みが緩い — DONE** (`b00c03e`): every remaining opening becomes a CLOSED DOOR (bypass=0 on
   every floor) under the BFS connectivity guard.
3. **罠処理 (盗賊) — DONE** (`74547fb`): ~half of plain-玄室 chests carry a snare trap (difficulty 11+n).
4. **全滅 with a member at HP 1 (#4) — DONE** (`0b0aeda`): a downed member is stored at hp:1+injury but now
   DISPLAYS HP 0 everywhere (React strip + Godot combat/dungeon HUDs). Dead enemies never act (confirmed).
5. **ランダム生成が Godot に無い (#5) — DONE** (`3682788`): `Draft.randomize` deals a complete random adventurer
   (class/来歴/気質/顔/name, full bonus pool spent → registerable); a 見繕う button on the guild briefing.
6. **encounter roll = groupsMin..groupsMax RANGE (#6) — DONE** (`this commit`): `groupsMin` added to
   schema/type + rolled in TS `resolveEncounterTable` AND Godot `resolve_encounter_table` (parity re-recorded,
   PASS). groupsMin DEFAULTS TO groupsMax so the knob is INERT on existing balance — a scenario dials groupsMin
   below groupsMax to opt into lone-foe variety (a naive default-1 dropped early-floor damage; the town-recovery
   gate caught it). The variety gate now scales its type requirement to the roll shape.

### Gate:final fallout from THIS session's earlier door/enclosure work (all fixed this commit)
Running the FULL gate (not just changed specs) surfaced 9 e2e reds from earlier-session commits that shipped
without a full `gate:final` — a live reminder of the truth-gate rule. Fixed:
- **auto-explore treated every closed door as a wall** (`debugAutoExplore` blocklisted a non-advancing
  move_forward — but a door swallows the first step). Real PLAYER-FACING bug (R/Space uses the same fn). Fixed
  to step through on `door_opened`. THIS is why 玄室 floors felt sealed.
- `walkUntilCombat` (e2e helper) wedged in door-sealed pockets → now 5-forward-then-turn so a bump-opened door
  gets entered before the walker pivots away.
- `combat-stall-verify` couldn't reach the door-sealed 番所 (auto-explore avoids squads; keep isn't a hard
  choke) → starts ON the keep cell via debug `at=` and steps to re-trigger the guardian.
- `selfplay` asserted the removed 次の支度 ledger row (`f0f616d` dropped it) → asserts the Wounds row now.
- `combat-layout` @1920 originally treated an `overflow:hidden` nameplate as safe by clamping its measured
  bottom to the stage. That hid the real large-front-foe defect; `178c476` now keeps the mark inside the
  stage and the regression rejects any clipped nameplate.

### ⤷ Done: 棘虫 nameplate clipped at 1080p on g4f (`178c476`, Codex)
The large, front-grounded 棘虫 could project its below-foot nameplate outside `.enemy-stage` at 1920×1080.
The fix preserves authored size, grounding, and depth: it puts the label immediately above the feet and
clamps only the display anchor. The browser regression now requires EVERY enemy mark to be fully inside the
stage (not merely non-overlapping the HUD), at both 1280×720 and 1920×1080.

---
## Proposed after Codex independent real play — 2026-07-28 (not yet accepted)

**Route actually played:** native Godot, keyboard only: title → Verdant → six `見繕う` recruits → town →
G1F → movement/turn/wall feedback → a two-group battle → 全員でかかる → victory → exploration → full map.
`gate:play` also passed separately. These are candidate IMPs, deliberately not marked done or assigned to
an implementer before product triage.

1. **IMP-055 / P1 — make Verdant's first-person maze legible, not merely brighter.**
   The G1F entrance and ordinary corridor read as a near-black ceiling mass plus one saturated green wall;
   a player cannot tell depth, a forward passage, or a corner from the first-person frame without consulting
   the minimap. This is distinct from “Verdant is too dark”: the palette currently brightens the walls while
   `dungeon_renderer.gd` still gives the ceiling a hard-coded dark material. Treat floor / wall / ceiling /
   fog as one world-owned readability composition. Acceptance: native screenshots at landing, open corridor,
   corner, and blocked wall make the passable direction obvious at a glance, while preserving the grid's
   facing/minimap truth; review pixels in a real Godot window, not headless only.

2. **IMP-056 / P1 — eliminate English world and floor names from Japanese normal play.**
   The full map showed `G1F - Root Gallery`; the title's Continue row showed `Verdant - the Sunken
   Heartwood`. These are authored names, but Japanese play already has `翠碑 — 沈む樹心` and `蔦の回廊`.
   Complete the existing Plan.md “Floor names are English” gap with `locales.ja` for every world/floor and
   use those values in title save summaries as well as the full map. Acceptance: a Japanese normal route has
   no English scenario/floor proper name (genre `G1F` is fine) and no raw identifier fallback.

3. **IMP-057 / P2 — add a native visual fixture pair for the Verdant chamber.**
   F's chamber landmark/door visual is still intentionally unapproved, but the debug deck has generic floor
   starts only; it cannot land a reviewer at a closed chamber door, then at the same cleared chamber. That
   turns a small visual review into a blind long walk. Add `verdant_chamber_closed` and
   `verdant_chamber_cleared` fixtures through the existing debug-fixture seam, with a real normal-scene
   follow-up action to open/enter where applicable. Acceptance: each fixture names its exact cell and opens
   the real dungeon scene; paired captures prove closed-door threshold, special-room read, and cleared-state
   contrast. Never mount these controls in normal play.

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
