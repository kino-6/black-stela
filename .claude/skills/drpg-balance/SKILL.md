---
name: drpg-balance
description: Difficulty & balance design reference for first-person dungeon RPGs (Etrian Odyssey / Wizardry / world-tree lineage). Use when tuning Black Stela's enemy stats, encounter counts, floor difficulty, area pacing, or the descent survivability curve — and when designing new floors/areas.
---

# DRPG Balance (world-tree / Wiz lineage)

Why Etrian Odyssey and Wizardry stay played, distilled into design levers, plus how
Black Stela's own model (first-contact encounters + a descent survivability sim) maps
onto them. Read before touching enemy stats, encounter tables, or floor pacing.

## The load-bearing principles

1. **Attrition is the difficulty, not any single fight.** A dungeon is hard because
   you must survive fight *after* fight on one tank of HP/MP before you can heal —
   not because one monster is a wall. Tune the *floor's cumulative drain*, not the
   scariness of one enemy. (EO: "survive the attrition of battle after battle.")
2. **Cap power with resource limits, not enemy scaling.** Wizardry stays balanced
   because spell charges are finite — the party gets strong but can't spam its best
   turn. Prefer limiting the player's best options (MP/気力, item counts, per-fight
   uses) over inflating enemy numbers to keep pace. Never level-scale enemies to the
   party; a fixed curve the player grows *into* is the genre's spine.
3. **Honest, informed danger.** EO is "the easiest hard game": hard problems, but the
   player is always *told* the danger and given the tools. Telegraph — visible enemy
   HP, readable status, a clear front/back threat, danger that reads before it kills.
   Never surprise-wipe; let the player *choose* to push or retreat with full info.
4. **Push-vs-retreat is the core loop.** The floor should make "one more room vs turn
   back now" a real, tense decision. That only works if attrition is felt and a
   safe-return (stairs/warp/charm) exists but costs progress. Shortcuts every ~2–3
   floors (EO warps) cut backtrack tax without removing the decision.
5. **FOEs / roaming threats.** A few over-strength, avoidable enemies you flee early
   and farm later create the strategy layer and reward map mastery. (Black Stela's
   fixed squads — front-blocker + back-caster — are the seed of this.)
6. **Build diversity is balance.** Exploration, bosses, and farming want *different*
   party configs; no single build should trivialize all three. Status/resist gear and
   reach weapons exist so the answer to a floor is a *loadout choice*, not just levels.
7. **Continuous challenge, tension/release arc.** Minimize dead space — a new problem
   (fight/trap/gate) soon after the last. Shape each area as a beginning/middle/end
   arc: ramp tension, spike at a mini-boss/toll, release at the stairs.

## The escalation curve (areas as acts)

Structure the descent as **3-floor areas = acts** (beginning / middle / end), each
with rising floor-to-floor pressure and a hard spike at its end (mini-boss or toll):

- **Act I — teach**: gentle, learn the loop, low attrition. Death is possible only by
  ignoring info.
- **Act II — pressure**: real attrition, status threats, tactical squads, resource
  tolls. The push-vs-retreat decision bites.
- **Act III — finale**: tense; a wipe is credible without preparation (loadout, items,
  levels). Ends on the run's boss.

Within an area, each floor is a little harder than the last; the *first* floor of a
new area is a noticeable step up (EO: "new areas are dangerous").

## Black Stela's model + how to tune it

- **First-contact encounters** (see `black-stela-encounter-model`): each enemy TYPE is
  fought ~once per run (~11 fights, party finishes ≈Lv4). So a floor's difficulty =
  its **introduced types × their group sizes**, fought once. Tune *per-fight weight*
  (enemy hp/attack/damage, group count), NOT encounter frequency.
- **The oracle: `descentSim`** (`src/headless/descentSim.ts`) simulates the whole
  B1→B8 first-contact descent through the real combat engine and reports, per floor:
  arrival level, **lowest party HP% mid-fight (the danger "trough")**, whether anyone
  is downed/wiped. Two models bracket truth: `town` (heal between floors — isolates
  per-floor lethality) and `none` (carry HP, heal only on level-up — pessimistic
  one-push lower bound). **Tune against `none`; it's what the Gate reads.**
- **Levers (data-only, in `content/worlds/default/`)**: enemy `hp` / `attack` /
  `damageMin`/`damageMax` / `armor` (`enemies.md`); encounter `groupsMax` + `minCount`
  /`maxCount` (`encounters.md`); which types a floor introduces (dungeon rooms). Raise
  a floor's trough-drop with more enemy damage or a bigger group; soften with less.
- **Targets** (`none`-model trough per floor, escalating by act) — see the descentSim
  Gate: Act I ~0.85→0.65, Act II ~0.60→0.42, Act III ~0.38→0.28. **Never let the sim
  wipe**, and keep the deepest trough inside the Gate band (finale tense, not lethal).
- **Tuning loop**: change numbers → run `descentSim` (both models) → read the per-floor
  troughs → nudge toward the act targets → repeat until the curve rises smoothly and
  no floor wipes. Then confirm the descentSim Gate + a real browser playtest (the sim
  omits gimmick hazards, status, back-row exposure, so **real play runs tougher** —
  tune slightly gentle of the target).

## Anti-patterns

- Flat then spike: B1–B6 trivial, B7–B8 sudden — no felt ramp. (Black Stela's
  pre-tuning state.) Each floor should step up.
- Balancing a single boss's HP instead of the floor's cumulative attrition.
- Level-scaling enemies to the party (kills the grow-into-it curve).
- Difficulty from hidden information (surprise wipes) instead of telegraphed danger.
- Numbers tuned only in the sim and never browser-verified — the sim is a lower bound,
  not proof of feel.

## Sources
- [EO V is difficult but honest about danger (Vice)](https://www.vice.com/en/article/etrian-odyssey-v-is-incredibly-difficult-but-honest-about-the-danger/)
- [EO difficulty (Fandom)](https://etrian.fandom.com/wiki/Difficulty)
- [Wizardry: Proving Grounds review — resource-limited power (NWR)](http://www.nintendoworldreport.com/review/67239/wizardry-proving-grounds-of-the-mad-overlord-switch-review)
- [Power curves and game design](https://matthewdbrown.authorbuzz.co.uk/lordmatt/reflections-and-thoughts/full-metal-nerd/power-curves-and-game-design/)
- [The Dungeon Crawler Recipe (Game Developer)](https://www.gamedeveloper.com/design/the-dungeon-crawler-recipe)
