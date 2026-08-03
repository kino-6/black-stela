# Dungeon areas — the three acts + true layer (B1–B10)

Concept + difficulty design for Black Stela's descent, grounded in
`.claude/skills/drpg-balance`. **A dungeon is TEN floors** (user 2026-08-03; the earlier
"10F, atmosphere every 3 floors, a boss" intent had never been documented — the build sat
at 8). They group into **three 3-floor atmosphere bands (acts)** B1–3 / B4–6 / B7–9, each an
escalating beginning/middle/end, **plus B10 — the 真層 (true-clear layer)**:
- **B9 = the scenario-clear boss** — the run's story climax (the former B8 finale boss moves here).
- **B10 = the 完全クリア true boss** — opened after B9 falls; the hardest fight, still clearable
  prepared. This is the "9F clears the scenario, 10F is the full clear" structure.

The balance is **地続き — continuous with the current 8F curve, extended deeper**, NOT a redesign:
B1–B8's targets are kept, B7→B9 shift by one, and B9/B10 extend the escalation. Tune against
`descentSim` (`none` model) toward the per-floor trough targets. **Verdant mirrors this exactly**
(G1–G10, G9 = rootheart scenario boss, G10 = a new true boss).

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

## Act III — Gate of Ash (B7–B9) · "黒碑の門"
**Concept:** the finale approach. Side vaults, the black gate, and the votary's sanctum —
tense ground where an unprepared party (wrong loadout, no items, under-levelled) can credibly
wipe. The story ends at B9's boss.
- **B7 Side Ash Vaults** — vault-husk blockers; the deepest trash pressure.
- **B8 Gate of Ash** — the black gate; heavy blockers, the last trash spike before the boss.
- **B9 Votary's Sanctum** — the ash-votary boss; the **scenario-clear** climax.
- **Threats:** heavy blockers, the boss; preparation (gear/items/levels) decides it.
- **Trough targets (none):** B7 ≈ 0.38 · B8 ≈ 0.32 · B9 ≈ 0.28 (the scenario boss's trough).

## 真層 — The Inmost Stela (B10) · "灰の真層"
**Concept:** the 完全クリア. Opened only after the B9 scenario boss falls — the stela's inmost
vault and its true final. The hardest fight in the run, but still clearable by a fully prepared
party; a blind or under-prepared party wipes. Not required to "beat" the scenario, but the true
end.
- **B10 The Inmost Stela** — the NEW true boss (a superboss escalation of the votary).
- **Threats:** the true boss + a short, dense approach; peak preparation demanded.
- **Trough target (none):** B10 ≈ 0.24 (the deepest, still off the wipe line for a prepared party).

## Balance intent (vs current)
Pre-tuning the descent was flat-then-spike: B1–B6 troughs 70–93 % (trivial), only
B7–B8 bit. The tuning pass raises each floor toward the act curve so pressure rises
smoothly and each act opens with a felt step-up — never a sim wipe, deepest trough
inside the Gate band. Levers are data-only (`enemies.md` hp/attack/damage,
`encounters.md` counts). Continuous check: the per-area trough Gate in
`tests/descentSim.test.ts`. The sim is a lower bound — real play (gimmicks, status,
back-row exposure) runs tougher, so tune slightly gentle and browser-verify.
