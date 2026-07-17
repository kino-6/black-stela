# Black Stela Tasks

## Completed Archive

Completed task slices and traceability are archived in:

- [docs/archive/Tasks.completed-index.md](docs/archive/Tasks.completed-index.md)
- [docs/archive/Plan.completed-index.md](docs/archive/Plan.completed-index.md)

## Active Milestone: Combat FEEL (残る唯一の pre-balance 項目)

The command-RPG rebuild ("コマンドRPG化") and the three-zone screen are shipped. A round
now READS well and can be PLAYED on a controller. What is still missing is that a round
does not yet FEEL worth playing: six actors × (command → target) + a confirm step, mostly
to press 攻撃, for a fight whose outcome is rarely in doubt. **Design-first — align the plan
with the user before implementing** (the invested player must not get shallow fixes).

Grounded in [docs/design/combat-ui-redesign.md](docs/design/combat-ui-redesign.md) ("where
combat animation then lives") and `.claude/skills/combat-ui-drpg`. Candidate levers (to be
scoped with the user, not all at once): reduce per-round friction (smart-default / hold-to-
confirm / fewer steps to a plain attack), give hits weight (impact FX, hurt flash, defeat
dissolve on the big new stage), and make outcomes feel earned (tension cues when a round is
actually in doubt). The damage-number / beat playback (数字感) already ships.

### Shipped since the last stocktake (2026-07-16)

- [x] **#64 Command order** — front-row-first formation order.
- [x] **#65 Back-row reach weapons** — `weaponReaches`; a bow/long weapon lets the back row
  strike past a standing front line.
- [x] **#66 Multi-enemy encounters** — `room.encounterSquad` + multi-group encounter tables;
  a pack of N is N bodies, display/targeting/tempo/rewards all handle multi-group.
- [x] **#67 Auto/Repeat split** — オート (continuous) vs リピート (re-run last orders);
  discretionary auto-stops (boss/tactical/danger) as Config toggles; terminal stops kept.
- [x] **#68 Fixed dock layout** — context clues moved off the dock; fixed command regions.
- [x] **#69 Combat presentation** — beat-by-beat playback with floating damage NUMBERS on the
  struck enemy (`hit-number`, crit variant) + hit flash; tap-to-advance; message-speed / instant
  Config. (The remaining *feel* work is this milestone, above.)
- [x] **Elemental balance (5 slices)** — per-world cosmology, gear counterplay, XP falloff,
  two `world.md` `balance:` knobs; a naive party wipes, a prepared one clears ~10 levels lower.
- [x] **Q1 growth items** (`c72b9c6`) + **Q2 quest board** (`241d1e3`) — authored data in
  `content/worlds/<id>/`; reward XP bypasses the falloff by construction.
- [x] **Character presence IMP-018..020** (Codex, merged `f4f097b`) — portable visual identity,
  in-combat presence lane, GM-aware framing.
- [x] **Enemy-stage OVERLAY** (`5fb01a4`) — HUD is translucent overlays over a full-frame stage;
  stage share 36%→71% at 720p (80% at 1080p); creatures scale into the frame.

## Next Backlog (see [Improve.md](Improve.md))

- [ ] **IMP-021 Career/vocation mastery** — A/B/C shipped. Codex authored six advanced
  destinations in each world and the functional controller routes pass.
  `IMP-021V` remains blocked on bounded decision context and vocation presentation.
- [ ] **IMP-022 Rare equipment, appraisal, bulk conversion** — A/B/C/D shipped. Codex authored
  affixes in each world; paid appraisal, comparison/equip, confirmation, protection,
  and the Forge material sink now ship. `IMP-022V` remains blocked on bulk filtering,
  broader enemy-answer affixes, and service presentation.
- [ ] **IMP-023 Deterministic content & economy simulation Gate** — A/B/C shipped and extended
  with vocation-route coverage, weak-floor mastery decay, and dangerous-enemy affix coverage.
  Claude Code remains the independent parity verifier (`IMP-023V`).
- [ ] **IMP-024 Combat enemy readability** — keep enemy bodies and marks outside the
  portrait/command/message HUD; add screen-space non-intersection assertions.
- [ ] **IMP-025 Town preparation hierarchy** — replace ten peer service buttons with a small
  diegetic destination set and a clear return-to-preparation-to-departure rhythm.
- [ ] **IMP-026 Exploration command surface** — directional input owns movement; the focused
  command window shows only current-cell and party/map decisions.
- [ ] **IMP-027 Return-loop continuity** — direct departure from the 6/6 Guild screen must
  return to the same expedition-result/preparation state as departure from the town hub.
- [ ] **IMP-028 Character-focused creation** — replace class cards and aptitude form rows
  with bounded command/detail/status windows that keep the adventurer preview visible.
- [ ] **Recovery E2E Gate repair** — after a party wipe, stop the scripted dungeon path and
  assert the town/recovery state instead of retrying movement until the 180s timeout.

## Previous Milestone: all handheld Plan lanes cleared (shipped)

All green: **production build + 251 unit + 60 e2e**. Detail in [Plan.md](Plan.md).

- [x] #58 Combat balance tuning — deep floors + bosses bite (no-grind push
  93→79→77→67→43→30%, zero downs); descentSim Gate `0.12 < deepestTrough < 0.55`.
- [x] Lane R — all separable panels extracted (App.tsx 2778 → 2132); guild stepper
  left inline (reducer refactor, gated below).
- [x] Lane X — live tempo indicator (mode + step + ×1/×2 speed + immediate Stop).
- [x] Lane G — save-schema migration seam + `npm run build` smoke; Tauri FS/bundle
  work scoped in [docs/desktop-productization.md](docs/desktop-productization.md).
- [x] Lane H — narration health/metadata/diagnostics + guard wiring + PC redaction.

### Remaining (gated follow-ups, not deferred by choice)

1. Desktop bundle verification (macOS + Windows toolchain) — Lane G.
2. Guild registration stepper decomposition — needs a `useReducer`/context refactor.
3. Live-LLM narration generation — needs a real local provider endpoint.

### NextAction

1. **IMP-024 / IMP-027** first because combat readability and return-loop truth are core play.
2. **IMP-028**, then **IMP-025 / IMP-026**, as separate controller-first composition slices.
3. Repair the recovery E2E wipe branch before using the full-route suite as release evidence.
4. Close the remaining `IMP-021V / IMP-022V / IMP-023V` acceptance items without reopening
   their frozen contracts unless a verified contract limitation requires it.

## Recently Completed (archived)

- Difficulty Pressure, Full B1–B8 Maze Rollout, Playability & App Decomposition —
  [docs/archive/Plan.completed-difficulty-maze-decomposition.md](docs/archive/Plan.completed-difficulty-maze-decomposition.md).
- Lane Y: Guild Roster Management / Lifecycle / Cross-Scenario Adventurers —
  [docs/archive/Plan.completed-guild-roster-lifecycle.md](docs/archive/Plan.completed-guild-roster-lifecycle.md).
- Lane V/W/Z, the combat overhaul ([CombatPlan.md](CombatPlan.md)), and dense
  floor maps + rendering ([DungeonPlan.md](DungeonPlan.md)) — see the archive index.

## Deferred Lanes

- [ ] Lane G: Desktop Productization.
- [ ] Lane H: Hidden Local Narration Operations.

## Gate Definition

Every player-facing task must state the human expectation, red flags, browser
evidence, automated regression test, and what headless does or does not prove.

## Execution Rules

- Keep completed tasks archived, not mixed into active backlog.
- Do not mark headless reachability as proof of player UX.
- Browser Self-Play is the normal-route browser evidence gate; it complements
  Playwright E2E and screenshot review, and does not replace them.
- Do not accept arbitrary room graphs as DRPG dungeon topology.
- Use Grid Labyrinth Skill/Gate for movement, minimap, stairs, return, and
  first-person dungeon rendering work.
- Use DRPG UX Skill/Gate for party formation, command surfaces, and normal-play
  UI review before claiming player-facing work is done.
- Use Black Stela Gate Review Skill and Past Trouble Regression Gate before
  player-facing implementation or completion claims.
- A player-facing change is not done until its human expectation and red flags
  are explicit.
- Prefer unit tests for domain rules and Playwright for visible player flows.
- Keep Japanese checks when UI or prose changes.
- Keep automation conservative around unknown, unsafe, or high-impact actions.
