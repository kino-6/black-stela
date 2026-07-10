# Black Stela Tasks

## Completed Archive

Completed task slices and traceability are archived in:

- [docs/archive/Tasks.completed-index.md](docs/archive/Tasks.completed-index.md)
- [docs/archive/Plan.completed-index.md](docs/archive/Plan.completed-index.md)

## Active Milestone: Combat Feel & DRPG Depth (playtest review 2026-07-11)

From a live combat playtest. Six items, tracked as tasks #64–#68 (+ config). Execute
in order; each keeps the suite green + browser evidence. Human expectation and red
flags per item; no piecemeal shipping without a Gate.

- [ ] **#64 Command order** — command entry starts from the raw party-array member
  (Mira, back row). Input front-row-first, then back, in formation order.
- [ ] **#65 Back-row reach weapons** — back row can't attack behind a standing front
  (Wiz-authentic). Add a `reach`/back-capable weapon property (bow / long weapon),
  design 1–2 such weapons, equip back-row starters with one, make canAttack honor it.
- [ ] **#66 Multi-enemy encounters** — normal fights are 1 enemy. Author encounters
  with multiple groups of multiple monsters (FC Wiz-style; user chose *both* groups
  and counts). Display / targeting / tempo / rewards must handle multi-group.
- [ ] **#67 Auto/Repeat split + auto-stop → Config** — split the one tempo button into
  オート (continuous auto-battle) and リピート (re-run last round's orders). The
  discretionary combat auto-stops (boss/tactical/danger) default OFF; Config toggle
  to re-enable. Keep terminal stops (combat ended / no one can act).
- [ ] **#68 Fixed dock layout** — context buttons/clues (descent-locked clue, stairs,
  return, charm) reflow the command dock (UI stretch/shrink). Move clue text to the
  log/message window and/or keep fixed positions + disable (AGENTS "fixed command
  areas").

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

1. **Player evaluation / playtest** (owner: user) — the product is coherent and
   fully green; DebugMode aids + ×2 auto-runner make a full descent quick to walk.
2. On feedback: re-tune balance (the Gate band is a dial), or open one gated
   follow-up above (each is scoped + seamed).

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
