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

## Next backlog: approved capability proposals (see [Improve.md](Improve.md))

Three big product capabilities are approved as `Proposed` with owner boundaries + sub-IMP order.
**Claude Code owns the data/rules contract (`*A`) and the controller-first player routes (`*C/*D`);
Codex owns content authoring, art, and the deterministic simulator; each has an independent
browser verifier.** Do not start `*B/*C` until the matching `*A` contract is frozen.

- [ ] **IMP-021 Career/vocation mastery** — build = the history of vocations mastered; level
  persists, mastery advances separately, techniques stay learned, prerequisites gate advanced
  vocations. `IMP-021A` (contract: vocation data + save schema + mastery/unlock/migration) is
  Claude Code and lands FIRST.
- [ ] **IMP-022 Rare equipment, appraisal, bulk conversion** — rare affixes, appraisal, favorite/
  lock, previewed bulk sell/dismantle, an enemy record. `IMP-022A` (affix pools/rarity/instance
  identity/appraisal state contract) is Claude Code and lands first.
- [ ] **IMP-023 Deterministic content & economy simulation Gate** — a seeded simulator over the
  PRODUCTION loaders/rules that gates dominant builds, dead affixes, and inflation. Mostly Codex;
  depends on `IMP-021A` + `IMP-022A`. Claude Code is the independent parity verifier (`IMP-023V`).

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

1. **Combat FEEL** (active milestone, above) — design-first; align the lever set with the
   user, then implement one browser-verified slice at a time.
2. Then the approved capability backlog in dependency order: **IMP-021A** (vocation contract)
   → IMP-022A (affix/appraisal contract) → their player routes → **IMP-023** simulation Gate.
   Each `*A` contract freezes before its `*B/*C` content/route work starts.

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
