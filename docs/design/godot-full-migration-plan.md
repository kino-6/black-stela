# Black Stela — Full Godot Migration Plan

Status: **Proposed** (supersedes the S1–S5 spike plan for the *production* migration).
Date: 2026-07-19. Decision input: S5 Go/No-Go = **GO** (`godot-go-no-go.md`).

## 0. Honest current state

The Godot work so far is a **validated vertical-slice SPIKE**, not a playable game.

- **Proven (the hard, valuable part):** cross-runtime rules parity — `verify_parity` matches
  the TS oracle **byte-for-byte (9/9 golden traces)** for the ported commands; the presentation
  composition (first-person dungeon, combat stage, town hub) works; the loop can be assembled and
  runs controller-first at 1920×1080 in JA.
- **NOT done (the bulk of the game):** of the **50 domain commands**, roughly **5 are ported**
  (`turn_left/right`, `listen`, `search`, `move_forward` authored-encounter path, `declare_round`
  incl. the full enemy turn). Of the **29 React screens / 9 town services**, the Godot slice ships
  thin shells: town services are diegetic boxes with no function, the dungeon is mostly empty
  corridors with one scripted fight, combat is a one-round route, and there is **no character
  creation, no save/load, no economy/items/equipment/quests/vocations**.

**Conclusion:** the migration is *validated*, not *nearly done*. This document is the plan to take
it from spike to a complete, playable, save-compatible Godot product. The React runtime stays the
shipping product until a Godot milestone actually replaces its surface.

## 1. Invariants (do not break during the migration)

1. **TypeScript stays the ORACLE.** Every ported command is proven against a TS golden trace
   (initial state + commands → per-step events + canonical state hash). No gameplay truth forks.
2. **TypeScript stays the TOOLING.** Content authoring (`content/worlds/<id>/`), the deterministic
   simulators (descentSim/contentSim), content validation, and balance reports remain TS. Godot
   consumes the exported JSON; it never re-parses Markdown/YAML.
3. **Content is data.** Worlds, enemies, gear, items, quests, vocations, cosmology, balance, and
   copy stay authored in `content/worlds/<id>/`. A new scenario needs no engine change in either runtime.
4. **Controller-first, JA, 1920×1080 only.** Every surface is playable with directional + confirm +
   cancel, no pointer dependency; Japanese first-class; authored/verified at 1920×1080 (keep-aspect
   makes smaller windows safe — do NOT target 1280×720).
5. **Save compatibility.** One versioned save DTO; a Godot save round-trips through the TS schema and
   vice-versa until cutover; migrations preserved.
6. **Headless proves reachability + parity; a real browser/desktop run proves feel.** Both required.
7. **AI remains behind an engine-neutral contract.** M3 does not add live AI.
   Preserve typed command events and the normalized world export according to
   [`ai-godot-migration-contract.md`](ai-godot-migration-contract.md), so later
   scenario/GM work does not fork into Godot scene scripts.

## 2. Target architecture

```
content/worlds/<id>/**        ← authored source (TS-validated)           [stays]
   │  npm run export:godot
   ▼
godot/data/{worlds,traces,engine-data,*-samples}.json                    [generated bridge]
   ▼
godot/scripts/rules/*.gd      ← GDScript port of src/domain (parity-gated) [grows to full]
godot/scripts/*.gd + scenes/  ← every player screen, controller-first      [grows to full]
   ▲
src/domain/*.ts               ← the ORACLE + simulators + validation      [stays as tooling]
src/App.tsx + components/      ← the shipping React runtime                [runs until cutover, then archived]
```

- **Rules:** `godot/scripts/rules/` mirrors `src/domain/` module-by-module. Each command routes
  through `slice_rules.resolve` (rename → `rules.resolve`) and must reproduce the TS state hash.
- **Save DTO:** a shared JSON shape; GDScript load/save validates the same fields the TS Zod schema does.
- **Autoloads:** `Run` (session state), `WorldLoader`, `SceneManager` (add a transition layer), `InputActions`.

## 3. Migration strategy — parity-first vertical slices

Migrate **by gameplay segment**, not by layer. Each milestone ships: (a) the domain commands it needs,
**ported + parity-gated** (extend `traceExport.ts` with golden routes that exercise them), (b) the
Godot screen(s), controller-first + screenshot-verified, (c) a real hands-on play pass, (d) no
duplicate source of truth. A milestone is "done" only when its slice is genuinely playable end-to-end.

Golden-trace rule: any command that mints ids (character creation, loot instances, log entries) must be
exported under `withDeterministicIds` so the fixture reproduces byte-for-byte (already in place).

## 4. Milestones

Ordered by dependency and by "what makes the slice feel real soonest". Each lists the **commands** to
port (with parity) and the **screens** to build.

### M0 — Foundations — DONE
Export pipeline (`export:godot`), parity harness (`verify_parity` + state-hash oracle), `Run`/scene
shell, input map, and the 9-trace baseline. Keep as the spine.

### M1 — Front door: Boot → Title → Scenario picker → Config
- **Rules:** world registry / `setActiveWorld` (data only, no combat). Trivial.
- **Screens:** Title (done, polish), Scenario picker (worlds from `index.json` + tagline/art),
  Config (locale, tempo, safety toggles). Controller-first list navigation.
- **Exit:** pick Default or Verdant, adjust config, reach Town — all by controller.

### M2 — Guild & character creation (the roster spine)
- **Commands (~11):** the create/roster set — `import_member`, `reclass_member`, `bench_member`,
  `recall_member`, `retire_member`, `unretire_member`, `erase_member`, `edit_member_identity`,
  `set_member_row`, `swap_member_rows`, plus the `createGuildCharacter` path (class/origin/aptitude/
  bonus/name → register). Port `characterCreation.ts` + `identitySuggestion` + `adventurerVault`.
- **Parity:** golden routes that register a party and reshuffle rows (deterministic ids).
- **Screens (IMP-028 shape):** bounded class list + stable detail pane, reserved portrait/party
  preview, aptitude status window, name/profile, register → 3+3. Roster management screen.
- **Exit:** build a 3+3 party from scratch, controller-only, JA, and have it persist in `Run`.
- **Risk:** creation is the most stateful non-combat flow; portraits are presentation (stay simple).

### M3 — Town hub & the preparation services — **RULES DONE / UX NOT DONE** (2026-07-20)
**M3 is NOT complete.** It was briefly declared done; that was wrong and is retracted here.

- **Rules: done and parity-clean (16/16 golden traces).** Traces added: `economy`, `recovery`,
  `recovery-blocked`, `quests`, `loot`, `vocation`; the `roster` route gained a `reclass_member` step.
  The class catalog + per-class MP mode now ride on `engine-data.json` so the reclass path
  (`reclass_character`) re-derives a class identically to TS. `import_member` (portable-adventurer
  vault) is deferred to save/load — it is not a town prep service.
- **UX: NOT done.** The six services shipped as bare button lists — the exact thing AGENTS.md already
  forbade ("do not call town services done if they are just lists"), and a regression of the earlier
  remediation that fixed these same routes for being "too thin to decide in". `npm run gate:migration`
  is RED: 14 problems across 7 screens (missing cost/before-after in the infirmary, missing
  who-can-equip and stat deltas in the shop, no appraiser or forge service at all, career missing its
  two-pane destination detail, records missing threat/weaknesses/drops).
- **Decision (user):** port faithfully — same layout composition, same information, same Japanese copy
  as the React panels (option A). The rebuild is scheduled AFTER the remaining M* milestones; until it
  lands, M3 stays open and its debt is visible in the gate rather than hidden in a status line.
- **The gate that now enforces this:** `godot/gates/ux-parity-manifest.json` +
  `npm run gate:migration`. See AGENTS.md "Migration UX-Parity Gate".

M3 is also the preparation seam for the future bounded GM, but not its
implementation milestone. Service commands must retain parity-clean
`{ state, events }` results; records and feedback project from those events;
provider configuration and generated prose do not enter scenes, `Run.state`, or
the save contract. See
[`ai-godot-migration-contract.md`](ai-godot-migration-contract.md).

The two-level hub (IMP-025) + each service, one at a time (each its own sub-slice):
- **Recovery / infirmary:** `recover_party`. (Small — start here.)
- **Market / shop:** `buy_item`, `sell_item`, `equip_item`, `discard_item`. Port `economy.ts` (equip
  bonuses, stat resolution, slot rules) — also needed by combat, so it lands here first.
- **Records:** bestiary (`bestiary.ts`) + adventure-log projection (`replayLog.ts`).
- **Quest board:** `accept_quest`, `claim_quest`. Port `quests.ts` (+ `recordQuestKills` hook in combat).
- **Career:** `change_vocation`, `set_loadout`. Port `vocations.ts` (catalog merge, mastery, prereqs).
- **Loot / appraiser:** `appraise_item`, `toggle_item_lock`, `toggle_item_favorite`, `bulk_convert`.
  Port `loot.ts` (rarity/affix rolls, appraisal fee, bulk filter).
- **Workshop / forge:** `reinforce_equipment`.
- **Parity:** a golden route per service (buy→equip→sell, appraise→convert, accept→claim, reinforce…).
- **Screens:** each service as a controller-first town scene (reuse the S4 town-hub composition).
- **Exit:** a full prepare loop — recover, buy+equip, read records, take a quest, adopt a vocation,
  appraise+forge — all controller-only, all parity-clean.

### M4 — Dungeon (the real crawl)
- **Commands:** complete `move_forward` (room entry + `collectRoomTreasure`→chest / `applyCellEffects`:
  spinner / teleporter / damage-tile / gather / trap-trigger / room-event / grantsFlag-shortcut), plus
  `move_backward`, `strafe_left/right`, `open_door`, `disarm_trap`, `use_stairs`, `return_to_town`,
  full `search` (secrets + gather + trap-detect), `inspect_wall`, and the **wandering-encounter RNG**
  (`beginWanderingEncounter`: per-step 4% past an 8-step cooldown, `resolveEncounterTable` +
  `scaledEncounterCount` + `createCombatState`/`createMultiGroupCombatState`). Port `floorGraph`,
  `floorMap`, and the movement/encounter helpers.
- **Parity:** golden walks that hit a wandering fight, a trap, a spinner/teleporter, a shortcut, and a
  chamber (authored). Extend `verify_parity`. This is the largest single rules port.
- **Screens:** the first-person 3D crawl (built), a proper Wizardry automap + full-map overlay, the
  current-cell dock (search/listen/party/map + contextual), chest interaction (IMP-029 port), and the
  dungeon→town return loop.
- **Exit:** walk both worlds' first floors, take random + authored fights + a trap + a chest, descend a
  stair, return to town — controller-only, parity-clean. (Verdant now has per-floor keep chambers.)

### M5 — Combat (the full command screen)
- **Commands:** complete `declare_round` (party `defend` / `use_item` / `cast` spell — enemy turn +
  round-end + wipe already ported), `retreat`, `continue_after_combat`, `resume_at_checkpoint`, camp.
  Port `spells.ts`, `status.ts` (full), `tempo.ts` (auto/repeat), `combatBeatText`/`combatLog`.
- **Parity:** multi-round golden traces exercising spells, items, defend, retreat, status inflict/tick,
  squad shielding, and party wipe (some already: b1f-combat-rounds/b2f-ability/b3f-poison/b4f-caster/
  verdant-wipe). Beats stay presentation (target UI rebuilds them from state).
- **Screens:** the full combat cockpit — per-actor command menu (attack/defend/skill/item + on-stage
  target select), 全員でかかる / Auto / Repeat, beat-by-beat playback synced to the log, 3+3 party strip
  with status pips, enemy stage with damage numbers, victory/result + level-up, camp.
- **Exit:** a real multi-round fight driven controller-only — cast a spell, use an item, defend, watch
  the enemy turn, win with a level-up (or wipe → dragged to town), parity-clean.

### M6 — Save / load & migrations
- **Rules:** port the save DTO (`saveData.ts`) — serialize/deserialize the full `GameState` incl.
  party (equipment/vocation/memory/aptitude), inventory, map, quests, chests, records — and the
  versioned migrations. GDScript load must accept a TS-written save and vice-versa.
- **Parity:** round-trip fixtures (TS save → Godot load → Godot save → TS load) with identical state hash.
- **Screens:** save-slot select / continue on the title.
- **Exit:** a run started in React loads in Godot and continues, and back — no data loss.

### M7 — Cutover
1. Run save-migration + Default/Verdant content-parity suites on both runtimes.
2. Godot **Web export** (gl_compatibility) + native desktop packaging pass.
3. Archive the React player runtime **only after** every normal-play surface is covered in Godot.
4. Keep TS authoring / simulation / validation tooling; delete only duplicated runtime code.
5. Record the final engine + language decision in an ADR (`docs/adr/`).

## 5. Verification strategy (every milestone)

- **Rules:** golden command/event/state-hash traces shared with TS (`verify_parity`), extended per
  milestone. The state hash is the oracle; beats/summaries are presentation, compared semantically.
- **Input:** scripted `InputEventAction` routes for the controller path; physical controller smoke.
- **Visual:** fixed-state screenshots at **1920×1080** reviewed for composition, JA line layout, focus
  truth, enemy readability, and scene identity — plus a **real hands-on play pass** per milestone
  (the spike's lesson: headless "runs" ≠ playable).
- **Saves:** round-trip + migration fixtures across both runtimes during the transition.

## 6. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Semantic drift porting 45 more commands | Parity per command vs the TS state hash; no command ships without a golden trace. |
| "It renders" mistaken for "it plays" (the spike's trap) | Every milestone requires a hands-on controller play pass, not just screenshots. |
| Two runtimes double the maintenance during transition | Freeze React feature work on a surface once its Godot milestone starts; migrate in dependency order. |
| Character creation / save DTO are large and stateful | Give them their own milestones (M2, M6); deterministic ids for fixtures. |
| Web export loses a capability (C# etc.) | GDScript only (keeps Web export); no unofficial bindings. |
| Scope fatigue | Ship each milestone as a genuinely playable slice; the React product keeps shipping until replaced. |

## 7. Sequencing & honest effort

Rough critical path: **M1 → M2 → M3(economy first) → M4 → M5 → M6 → M7**. M4 and M5 are the two
heaviest (dungeon depth + full combat); M2 and M6 are the two most stateful. This is effectively
**re-implementing the whole game in GDScript** while keeping TS as the proven oracle — a large, multi-
phase effort, not a finish-line sprint. The payoff is the recurring-cost reduction S5 validated:
controller-first presentation, transitions, and asset staging are structurally cheaper in Godot.

**Recommended immediate next step:** M2 (Guild & character creation) — it unblocks a real, self-made
party for every later slice and is the first thing that makes the Godot build stop feeling like a dummy.
(M4's wandering-encounter piece is already scoped and can be picked up in parallel by the other agent.)

## 8. What explicitly stays TypeScript

Content authoring + validation, the deterministic simulators (descentSim/contentSim), balance reports,
the golden-trace oracle, and the world-pack/save schemas. These are tooling, not runtime — they keep
their value after cutover and are not ported.
