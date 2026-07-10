# Black Stela Tasks

## Completed Archive

Completed task slices and traceability are archived in:

- [docs/archive/Tasks.completed-index.md](docs/archive/Tasks.completed-index.md)
- [docs/archive/Plan.completed-index.md](docs/archive/Plan.completed-index.md)

## Active Milestone: Lane R — Source Decomposition (final pass)

Goal: finish decomposing the `App.tsx` God component without changing behaviour.
Pure-function helpers and 6 App panel extractions (title, camp, floor-map, debug,
dungeon dock, combat dock) have shipped — **App.tsx 2624 → 2454**. Detail and
guardrails in [Plan.md](Plan.md) (Lane R).

- [ ] Extract the town / guild / shop / records render into panel components —
  the last large chunk, entangled with the stateful character-draft flow and
  ~40 handlers. Own focused pass, heavy prop-threading, suite green after each
  extraction, dead imports pruned, no feature change mixed in.
- [ ] (Skip/defer) `useSaveLoad` hook and `rulesEngine.ts` regrouping — judged
  low-value; leave unless a concrete need appears.

### NextAction (日本語での提示は会話側で共有済み)

1. **Player playtest pass** (owner: user) — the DebugMode force-win / revive aids
   exist for exactly this; balance tuning waits on the resulting feedback.
2. **Lane R final pass**: the town/guild panel extraction above (ready to start).
3. **On the user's go-ahead: #58 combat balance tuning** — descentSim Gate armed
   (`deepestTrough < 0.72` → target ~0.45); **deferred** ("バランス調整はおいおい"),
   do not start without a go-ahead.
4. **Lane X** — repeat/auto tempo feedback (partly covered; audit what remains).

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
