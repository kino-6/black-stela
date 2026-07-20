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

### M1 — Front door: Boot → Title → Scenario picker → Config — DONE (2026-07-20)
- **Title:** 新たな探索 → the scenario picker; 続きから lists every non-empty save slot by what it holds;
  設定 opens config.
- **Scenario picker:** every world from `index.json`, each card carrying that world's OWN authored title
  and tagline so the list reads as places, not a dropdown. Picking one sets `Run.world_id`.
- **Config:** the play-affecting toggles only (auto-battle safety, confirm-round, instant combat log),
  each stating what it does to PLAY. AI provider settings and arbitrary save/load stay out of normal
  play (AGENTS.md) — they are developer tooling.

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

### M3 — Town hub & the preparation services — DONE (2026-07-20)
Rules parity-clean (16/16 golden traces) AND the town rebuilt as FAITHFUL ports of the React panels
after a first pass shipped bare button lists and was wrongly declared done.

- **Hub:** the IMP-025 two-level structure — a status ledger (expedition result / wounds / loot / next
  preparation) over three destinations (ギルド館・市場通り・記録の間) plus recovery and the descent.
- **Nine counters:** infirmary, shop, appraiser, forge, quest board, career, records, party, guild.
  Each carries its React panel's decision material and its confirm / failure / cancel states.
- **Copy comes from `ja.ts`** via `npm run export:i18n` → `i18n-ja.json`, so wording cannot drift.
- **Gate:** `npm run gate:migration` = UX parity (10 screens: information + comparison screenshot) →
  town controller traversal (every surface reachable, focusable, cancellable, zero pointer events) →
  rules parity 16/16. See AGENTS.md "Migration UX-Parity Gate".
- **Deferred (declared, not hidden):** `import_member` (portable-adventurer vault) rides with save/load
  in M6; the party menu's 所持品 / 貴重品 tabs await `use_item`, and the screen says so rather than
  faking the capability.

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

### M4 — Dungeon (the real crawl) — DONE (2026-07-20)
Every M4 command is ported and parity-gated, and the crawl's screens are faithful ports.

- **Commands:** move_forward completed (room entry, chest, one-shot trap, room event, gate grantsFlag →
  shortcut, and cell effects: spinner / damage tile / teleporter), move_backward, strafe_left/right,
  open_door, inspect_wall, disarm_trap, use_stairs, return_to_town, full search (secrets + gather +
  trap-detect), the **wandering-encounter RNG**, and the IMP-029 chest commands
  (investigate / disarm / open) with the treasure roll.
- **New rules modules:** `encounters.gd` (enemy groups, encounter tables, underpower scaling, room and
  wandering encounters, bestiary records) and `chests.gd` (the one-attempt-each chest machine + loot).
  The built-in equipment affixes now ride on `engine-data.json` (they live in TS code, not world packs).
- **Parity 16/16 → 26/26.** New routes: b1f-trap (trap + a real wandering ambush), b2f-hazard,
  b4f-spinner, b4f-teleport, b1f-shortcut, b1f-stairs, b1f-return, b3f-gather, b3f-disarm, b2f-chest.
- **Two latent parity bugs found and fixed:** a cell's `edges` were walked in the canonicalized pack's
  alphabetical key order instead of the oracle's authored north/east/south/west; and `visitRoom` carried
  the floorId over from the map we came FROM instead of resolving it from the room being entered
  (every event after a stair crossing named the previous floor).
- **Screens:** a FIXED, contextual command dock (stairs / return / disarm appear only where they
  answer), the IMP-029 chest panel that owns the command region while a chest holds the cell, and the
  full-floor map overlay (the party's record, visited cells only). All three are in the UX-parity
  manifest with comparison screenshots.

### M5 — Combat (the full command screen) — DONE (2026-07-20)
- **Commands:** declare_round now runs the whole party turn — defend, cast (loadout-bounded, silence and
  MP gated; heal / damage / status-inflict), use_item (heal, restore MP, cure) — plus retreat and
  continue_after_combat. A consumable spent mid-fight persists on every exit path.
- **Parity 27/27**, incl. the new `combat-actions` route (defend + heal + firebolt, power-strike +
  potion + sleep, attack + defend + firebolt, retreat).
- **Screens:** the per-actor command menu — orders one adventurer at a time, front row first, offered
  from that actor's own loadout, with a second STAGE for target selection and Esc backing out exactly
  one stage. 全員でかかる remains the one-press round; 退却 leaves the fight.
- **Not ported:** auto/repeat tempo and the beat-by-beat log pacing (presentation polish; the stage
  already rebuilds damage from the state delta).

### M6 — Save / load & migrations — DONE (2026-07-20)
- **Rules:** `save_game.gd` ports the versioned envelope (schemaVersion / savedAt / scenario / settings
  / state), the forward-migration chain, and the REFUSAL of a save newer than this build supports.
  Only fields the Zod schema actually `.default()`s are materialised on load — `enemyRecord`,
  `materials` and `combatConclusion` are `.optional()` and must stay ABSENT.
- **Parity:** `verify_save.gd` + `npm run export:saves` — three TS-written saves load in Godot to the
  hash the oracle recorded, survive a Godot re-save unchanged, keep their scenario envelope, and the
  version guard refuses a future save. Wired into `gate:migration`.
- **Screens:** the title's 続きから list — one row per non-empty slot, described by what it HOLDS
  (scenario, party size, purse), never a raw id or file name. Continuing resumes in town or the dungeon
  according to the saved phase.

### M7 — Cutover — DONE except packaging (2026-07-20)
1. **Content parity on both runtimes: done.** 33 golden traces across Default AND Verdant (incl.
   `verdant-expedition` / `verdant-walk`), the save round-trip suite, and a Verdant town screen driven
   through the SAME scene code from Verdant's pack and assets.
2. **Packaging: OPEN.** `godot/export_presets.cfg` (Web + macOS, `gl_compatibility`) is committed and
   recognized, but Godot's 4.7.1 export templates are a separate download and are NOT installed in this
   development environment, so no build was produced. This is the one M7 item still unverified.
3. **React archived, NOT deleted.** Every normal-play surface is covered in Godot (all 50 commands, 20
   gated screens), so React is retired as the player surface: README, `index.html` and the ADR mark it
   as the UX reference. It is deliberately KEPT because (a) the UX-parity gate points at its panels as
   the standard the port is held to, and (b) the 53 Playwright specs are the past-trouble regression
   record. Deleting it would remove the standard and the regression gate at once — a product decision,
   not a migration step.
4. **TS tooling kept** — authoring, validation, simulators, the trace oracle, and `ja.ts` (which BOTH
   runtimes read via `npm run export:i18n`).
5. **ADR recorded:** `docs/adr/0001-godot-gdscript-as-the-player-runtime.md`.

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
