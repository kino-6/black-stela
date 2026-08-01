# Tasks — Verdant playtest follow-through (2026-07-27)

Rapid-fire playtest backlog, to be completed one at a time with verification + a gate where it
prevents recurrence. Ordered by the agreed priority (A first). Tick items as they land.

---
## ▶▶▶ RESUME HERE — 2026-07-29 PLAYTEST MARATHON (read FIRST)
Build/run: `npm run export:godot && npm run play` (godot/data GITIGNORED). Truth gate `npm run gate:final`;
Godot gates `npm run gate:migration`. Self-build + verify before handoff (AGENTS.md). Read
`.claude/skills/controller-first-ui` before ANY menu/focus work — the soft-locks below are its exact
documented failure mode ("every screen hands the cursor a place to land").

**Pushed this session (newest last):** `df2ed2d` softer SFC-style SE (sine, quieter, silent while walking) ·
`06c970e` infirmary focus soft-lock fix · `d8693fa` FC/SFC chiptune SE (Sfx autoload) · `023339b` door
embed-in-wall + 見繕う name vary · `b4f42d2` direct combat target selection (←/→ reticle, Enter fires) ·
`9a41058` wiped-party can't wander + one-step doors + door-latch orb removed · `e31f66e` downed-block dual
recovery msg + B-team test · `dcd3829` Codex IMP-055/056/057 all resolved · `c883548`/`0fc4d14`/`4f40a47`
(the three IMPs). **User is on build `d8693fa`** — relaunch picks up `df2ed2d`+`06c970e` (audio + infirmary).

### THE BIG ONE — #19 dungeon-UX redesign (user-directed, DECIDED — do FIRST as ONE coherent change)
The dungeon is a DQ1-style command panel you must Tab into. User wants the SFC/世界樹 model. DECIDED spec:
- **決定 (Enter/confirm)** = **探索** (search) — and it must **feed the AI-reaction concept** (探索 is the hook
  the scenario AI responds to). When the party is ON a stairs cell, 決定 = **階段を使う** (context action).
- **キャンセル (Esc/cancel)** = open the **メニュー** (camp: 装備/所持品/能力/隊列変更/設定).
- **全体図 = M**, move = WASD/↑↓←→ + Q/E strafe (unchanged).
- **REMOVE 聞く (listen)** and **オート (auto-explore)** from normal play. (`オート` = auto-walk the floor,
  IMP-026 convenience, overlaps held-move — drop from UI, keep behind debug if wanted.)
- The right **「迷宮コマンド」panel → a non-interactive KEY-HINT display** (never a Tab-into focus surface).
- **Rename 「隊列」→「メニュー」** (user chose メニュー over キャンプ), both the dungeon command AND the
  party-menu heading.
- Apply a **systemic controller-focus safety net** so no panel can soft-lock (see #14/#20).
- Gate: `verify_dungeon_controller` + browser-verify; the command model change touches `dungeon.gd` input
  (`_toggle_auto`, the command dock at ~448-473, `_apply(SliceRules.resolve(... "search"))` at ~577).

### ✅ QUEUE CLEARED 2026-07-29 — #14-#23 ALL DONE + pushed (gate:final 700 unit + 139 e2e, gate:migration green)
Commits (newest last): `06c970e` #14 infirmary focus · `9ed925a` #19 dungeon direct-key UX · `5e6a3ae` #20
party-menu focus net · `bfce3e2` #18/#16 secret-as-opening · `1ad9a94` #17 stairs grounded · `c6dab20`
#15 玄室 no-re-fight · `3435e3c` #23 guild remove+grid · `a84b4f3` #21 per-location town stills · `eae3d28`
#22 生業→転職 rename · `aaa5352` e2e follow. **Follow-ups still open:** #24 (React dungeon-dock reconcile +
escape charm→メニュー; ux-parity bridged by derivedExclusions), #25 (転職 SFC-layout rebuild — label done,
layout design-heavy), #10 (difficulty reshape — STILL STASHED `git stash` "difficulty-reshape-wip").

### (historical) original QUEUE plan — tasks #14-#22; work order: #19 → #16/#17 → #15/#18 → #21 → #22 → #20
- **#19** dungeon-UX redesign (above) — FIRST.
- **#20** 装備タブ focus soft-lock (party_panel: switching to 装備 lands no focus) + 「隊列」→「メニュー」.
  Same class as the FIXED infirmary bug (`06c970e`: recovery_panel handed `null` focus when 治療 disabled →
  now focuses やめる). Fix systemically: every panel/tab rebuild MUST land focus on an enabled control.
- **#16** minimap shows walls where the 3D view is passable ("1Fバグりすぎ / 壁があるんだかないんだか").
  Reconcile `floor_map` minimap wall logic with `dungeon_renderer` edge truth.
- **#17** stairs billboard floats (階段浮きすぎ) + invisible when standing ON the stairs cell
  (階段マスで見えない — "自分で検出してよ": the 階段を使う command DOES appear on the cell, but no visual).
  Seat the billboard on the floor; give an on-cell visual/read.
- **#15** 玄室 re-fight still reported. TS+Godot both mark a chamber "beaten" via chest_out || floorClaimed;
  roomChest DOES emit a chest for `treasureTable`-only rooms, and Godot releases it on victory
  (combat_round.gd:458 `_release_room_chest`). NEEDS a repro test (enter chamber → win → leave → re-enter →
  assert no re-fight) to find the remaining gap before fixing.
- **#18** discovered secret passage forces re-search (一度開通した隠し通路は再調査不要). `discoveredSecrets`
  gates traversal (rulesEngine ~738); confirm it persists + gives "already open" feedback (no re-roll).
- **#21** town per-facility stills not wired (商店/鑑定所/錬成所/広場 each should show its own still; today one bg).
- **#22** 転職(生業) menu is "業務アプリ"-like; rename 「生業」(→ 転職/クラスチェンジ) + rebuild to SFC/世界樹
  転職メニュー conventions (現職→就ける道→変化プレビュー→確定).
- **#23** guild roster: **can't remove/bench a member**, and the 名簿を整える UI is **broken (layout overflow** —
  the right roster panel + member buttons + 保存 clip off the right edge). Fix removal + the panel layout/focus.

### Difficulty reshape — STASHED (git stash: "difficulty-reshape-wip"), NOT lost
`descentSim` prepared-policy fix + Verdant `hpScalar 1.8` (mid curve `[100,97,73,63,45,63,63,47]`). Resume after
the UX/bug queue: `git stash list` → pop, then finish slice-3 gate re-tuning (see the 2026-07-28 section below).

---
## ▶▶ RESUME HERE — 2026-07-28 (superseded by the 2026-07-29 section above; difficulty-design detail kept)
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
- **Slice 2 DONE** (task #8): `descentSim` now runs a **PROVISIONED descent** — `simulateDescent(w, {provision:true})`
  carries the world's affordable kit (cheapest heal/cure per kind, capped by `carryCap[0]`, from `provisionKit`)
  and auto-uses it (cure a blocking status, else heal the most-wounded below `healThreshold` 0.34; the medic
  trades their swing). New `FloorSimResult` fields: MP pcts, `trash/spikeLowestHpPct` + `trash/spikeFights`,
  `healsUsed`/`curesUsed`/`kitRemaining`/`goldEarned`. New `DescentSimResult`: `kitCost`/`totalGold`/
  `economyBalance`/`kitExhaustedFloor`. `sim:balance` prints a RESOURCE-ECONOMY block. Verdant authored an
  `economy` block (EO-leaning early→easing late). All 22 sim tests + tsc green.
- **Slice 3 GATE INFRA DONE** (task #9): `tests/difficultyGate.test.ts` locks the two new axes per world —
  party-size cost large-but-finite (`levelsCost` [4,18]), kit helps-but-never-facerolls (`provisionValue`
  [0,4]), and for a world with `economy`: kit is priced, spent, and **rations dry in the final act** (retreat
  trigger) with income covering a re-provision without flooding. Medic threshold → **0.5** (a competent player
  pre-heals; 0.34 left the kit untouched). Verdant kit → `{heals:3,cures:1}` so a one-push runs dry at g8f.
  `provisionValue` axis + report line added. **incomeScalar/priceScalar still authored-but-UNWIRED** (income =
  enemy gold only). gate:final green (139/139, one flaky dungeon-dpad retry passed).
- **Slice 3 RESHAPE (task #10) — knobs BUILT, one sim fix blocks shipping; NOT yet harder in-game.**
  - **`mid` sim policy DONE + PUSHED (`5a29c41`):** the realistic party (one fixed general loadout, not
    per-fight-optimal) — the bands are now designed against `mid`; naive/prepared stay wipe/clear bounds.
    KEY finding: `prepared` (per-fight OPTIMAL counter swap) facerolls weak-to-counter early foes BY the
    counterplay design → its early curve is ~100% by construction; that's why band-targeting it was guesswork.
    `sim:balance` trough matrix now leads with `Np·mid`.
  - **`hpScalar` trash-attrition knob DONE + PUSHED (`0851b2e`), INERT:** `applyBalance` scales TRASH hp
    (not minibosses/boss — scaling a boss = HP-sponge + inflated clear). Sweep: Verdant `hpScalar≈1.8` moves
    the mid curve `[100,97,89,91,91,85,69,33]`→`[100,97,73,63,45,63,63,47]` (g3-g8 bite 45-73%, naive wipes,
    kit used, midClear@3). g1/g2 stay gentle (over-levelled intro trash — fine). `rawWorld()` seam added for
    in-memory sweeps (`scripts/`).
  - **BLOCKER before it ships:** `hpScalar` exposed that `prepared` swaps to the counter ELEMENT even when
    that weapon is weaker than mid's best-raw → vs tankier trash prepared can clear WORSE than mid (prepClear
    2→7), corrupting `preparationValue` + the `preparedMinLevel≤3` gate. **FIX FIRST:** `prepared` must never
    be weaker than `mid` (layer counter swap on the general loadout only when the counter weapon is competitive).
    THEN set Verdant `hpScalar`, re-point per-world gates from `prepared`→`mid`, add a mid-band gate,
    **browser-verify + user feel**. Nothing player-facing has shipped — the knobs are inert.
- **Measured NOW by the slice-2 tool (before tuning):**
  - **Scarcity ≈ 0** (the "ヌルい" report, quantified): Verdant's 4-heal/2-cure kit runs 6→3 over 8 floors,
    NEVER dries out, dive income = **2.4× a full re-provision**. Tighten `provisionKit`/`carryCap`/`incomeScalar`.
  - **Spike channel nearly empty**: Verdant authors ONE telegraphed fight in 8 floors (g2f keep squad), trivial
    when prepared (spike-trough 100%). The g7/g8 finale (19%/33%) is a *trash* wall, not a designed guardian —
    flat-then-spike in disguise. Slice-3 tuning must ADD per-act spikes (`room.encounter`/`encounterSquad`).
  - Act-curve still soft early: Verdant g1/g2 troughs 100/95% (target 85-65%). `underpowerFactor` inert (no
    floor authors `recommendedPartySize`) so under-strength danger isn't proportional (3p trough = 6p).

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
## Codex independent real-play findings — 2026-07-28 → ALL THREE RESOLVED 2026-07-29
- **IMP-055 DONE** (`0fc4d14`): ceiling is now world-owned + faintly self-lit (palette `ceiling` key; Verdant
  `#4a5140`) so the overhead plane reads for depth/corners — code lane; final murk-vs-legibility pass = Codex.
- **IMP-056 DONE** (`4f40a47`): floor schema/type gained `locales`; every Verdant floor authors `locales.ja.name`
  (G1F・根の回廊 …); `floorName()` locale-aware; save summaries (TS + Godot) store the localized world title.
- **IMP-057 DONE** (`c883548`): paired `verdant_chamber_closed`/`verdant_chamber_cleared` debug fixtures (panel +
  boot flag) land a reviewer at G1F's guardian chamber; cleared opens the door + calms the landmark. Gate-locked.

### (historical) Proposed after Codex independent real play — 2026-07-28

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

---
## ▶▶▶ RESUME HERE — 2026-08-02 PLAYTEST (deep-floor review now reachable via IMP-062)
Rapid-fire feedback while the user reviews mid/late floors. Process ONE AT A TIME, verify + gate/lock,
commit each. Newest requests at the bottom. (Cross-refs to Improve.md IMP-060..064 where locked.)

**Already landed this run (pushed):** `a800d70` e2e flake fix (139/139) · `3616a6f` IMP-060 chest JA leak ·
`7ec61fb` IMP-062 deep-floor QA starts (floor_2-8, levelled, full-map) · `89f87a8` IMP-061 trap names
kind+damage · `78f6cc4` IMP-063 descent colour arc (mechanism + first-pass, VISUAL SIGN-OFF pending) ·
`e8fd07f` IMP-064 全員でかかる plays out member-by-member.

### Queue (do in order)
- [x] **T1 (IMP-064) 全員でかかる instant→beat-by-beat.** All-out no longer snaps to the result; it narrates
      each living attacker before the real damage/defeat. `e8fd07f`. (Follow-up option: per-attacker strike
      flash + enemy HP drain during the beats.)
- [ ] **T2 玄室の敵出現ポイントを扉に隣接させる.** The guardian/keep miniboss encounter must sit on the cell
      ADJACENT TO (behind) the chamber's sealed door — a guardian that isn't at the choke is meaningless.
      Content/data: check each floor md's `keep`/guardian room placement vs the chamber door cell; move the
      encounter to the door-adjacent cell. Lock with a design-gate assertion (guardian cell touches the
      chamber door).
- [ ] **T3 罠は「あり/なし」でなく「特定できる/できない」(Wiz式識別).** Investigating a trapped chest should
      NAME the specific trap on success (「毒針の罠を見抜いた」) and, on an uncertain check, say a trap is
      present but its kind is unknown — not a flat 「罠が仕掛けられている」. Disarm should relate to the
      identified kind. Extends IMP-061 (sprung message already names the kind). React+Godot chest rules/copy
      + lock.
- [ ] **T4 罠解除/開封後の報酬プレゼン: 宝スチル＋相応の報酬 (Wiz式).** After disarm/open the reward reads as
      an あっさり log line with a しょうもない payout (one cheap potion). Want: a treasure reveal (still image
      — the open-chest art is there but the moment is weak) AND a decent reward. Two parts: (a) presentation —
      make the reveal a beat, not a fleeting line; (b) content — trapped/guardian chest treasure tables give
      a meaningful reward, not a single consumable. Balance-authored in content/worlds data.

### Also open (from Improve.md, not playtest-blocking)
- [ ] **IMP-063 visual sign-off** — user reviewing the descent colour arc in the real build (floor_5/8);
      tune hue/strength on feedback. Optional: Codex brief drafted for Default 3-band descent TEXTURES
      (Default currently only has the colour arc, no distinct band art like Verdant).
