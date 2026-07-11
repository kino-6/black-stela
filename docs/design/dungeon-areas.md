# Dungeon areas — the three acts (B1–B8)

Concept + difficulty design for Black Stela's descent, grounded in
`.claude/skills/drpg-balance`. The eight authored floors group into **three 3-floor
acts** (the last is 2), each an escalating beginning/middle/end with a spike at its
close. Tune against `descentSim` (`none` model) toward the per-floor trough targets.

## Act I — The Ash Approach (B1–B3) · "灰の浅層"
**Concept:** teach the loop. Dust, slimes, and cistern-damp — the ruin's shallow
throat. The party learns attrition, formation, mapping, and the push-vs-retreat
rhythm on forgiving ground. Death is only possible by ignoring information.
- **B1 Silent Approach** — first contact; the teaching slime, a first mixed pack.
- **B2 Split Dust** — the front-blocker + back-caster squad (tactics seed); hook-rats.
- **B3 Cistern Teeth** — status threat (bitter-mote); the cistern-warden mini-boss.
- **Threats:** attrition (slime/crawler/rat packs), a first squad, a first status.
- **Trough targets (none):** B1 ≈ 0.82 · B2 ≈ 0.72 · B3 ≈ 0.62.

## Act II — Lantern & Oath (B4–B6) · "灯と誓いの層"
**Concept:** pressure and tolls. Turned lanterns, cinder-tolls, narrow oaths — the
mid-depth where the ruin asks a price. Real attrition, blockers you must break or
reach past, status you must answer with the right loadout, and resource tolls that
make "push or turn back" a genuine decision.
- **B4 Turned Lanterns** — lantern-ward blockers (armor); reach/spell answers matter.
- **B5 Toll of Cinders** — the cinder-keeper toll (mini-boss / resource gate).
- **B6 Narrow Oaths** — oath-cutter ambushers + the oath-warden mini-boss.
- **Threats:** blockers + armor, tolls, status, tactical squads; loadout is the answer.
- **Trough targets (none):** B4 ≈ 0.55 · B5 ≈ 0.48 · B6 ≈ 0.42.

## Act III — Gate of Ash (B7–B8) · "黒碑の門"
**Concept:** the finale. Side vaults and the black gate — tense ground where an
unprepared party (wrong loadout, no items, under-levelled) can credibly wipe. The run
ends at the stela's boss.
- **B7 Side Ash Vaults** — vault-husk blockers; the deepest trash pressure.
- **B8 Gate of Ash** — the ash-votary boss; the run's climax.
- **Threats:** heavy blockers, the boss; preparation (gear/items/levels) decides it.
- **Trough targets (none):** B7 ≈ 0.36 · B8 ≈ 0.28 (the Gate's deepest trough).

## Balance intent (vs current)
Pre-tuning the descent was flat-then-spike: B1–B6 troughs 70–93 % (trivial), only
B7–B8 bit. The tuning pass raises each floor toward the act curve so pressure rises
smoothly and each act opens with a felt step-up — never a sim wipe, deepest trough
inside the Gate band. Levers are data-only (`enemies.md` hp/attack/damage,
`encounters.md` counts). Continuous check: the per-area trough Gate in
`tests/descentSim.test.ts`. The sim is a lower bound — real play (gimmicks, status,
back-row exposure) runs tougher, so tune slightly gentle and browser-verify.
