# DRPG Design Pillars — What Makes First-Person Grid Crawlers Fun

Design reference for Black Stela (a Wizardry/Etrian-Odyssey-lineage blobber). Web-
researched from primary developer interviews (Etrian's Niinou "Director's Diary";
Frontline JP translations of Komori/Himukai) and the best analytical treatments
(CRPG Addict retrospectives, Felipe Pepe, alldeadgenerations) plus combat-feel design
essays. Each pillar: the principle, the player-psychology reason, and concrete
do/avoid. This grounds [combat-command-ui-plan.md](combat-command-ui-plan.md) and
future design work — build toward these, and audit against the anti-patterns.

## The pillars

1. **Attrition is the engine, not the fights.** Difficulty lives in the slow drain of
   HP/MP/light across a whole delve, not in any single hard fight. Every trivial fight
   becomes a resource decision. *Do:* restore MP/charges only in town; every victory
   costs something. *Avoid:* free mid-dungeon heals, abundant restore items.
   (crpgaddict; Felipe Pepe)

2. **The push-vs-retreat decision is the core loop.** Map one more square / go deeper,
   or turn back while you can still survive the walk out — a self-throttling gamble.
   *Do:* make the return trip a real cost; make reaching town deliver felt relief.
   *Avoid:* free instant teleport-to-town, checkpoints so dense retreat is free.
   (crpgaddict; Felipe Pepe; compulsion loop)

3. **Meaningful, sticky death.** Consequences must persist — costly/failable
   resurrection or permadeath with a strong rebuild loop. Death is what makes the whole
   risk structure real (permadeath *increases* appreciation via attachment/grief —
   empirical study). *Do:* give death teeth; front-load lethality so stakes register.
   *Avoid:* cost-free revives, instant reloads. Brutality must be fair (Pillar 8).

4. **Party building as the central puzzle.** Front-line bodies shielding fragile
   back-line casters; genuinely distinct battlefield roles; build/skill choices. *Do:*
   make row/position matter, roles differ. *Avoid:* classes that are "all fighters with
   different hit points" — role sameness collapses per-turn decisions. (Etrian; Wizardry)

5. **Mapping and spatial mastery as a pleasure.** The maze is a puzzle worth solving;
   turning unknown space into a known map is a primary reward, not a chore. *Do:*
   non-linear layouts with loops/shortcuts that reveal coherent geometry; seed
   occasional secrets and floor gimmicks. *Avoid:* over-hiding (every room a pixel-
   hunt) and flat traversal with no obstacles. (Atlus "three tenets"; Just Games Retro)

6. **Roaming threats as pacing and puzzle (FOEs).** Visible, powerful, patrolling
   enemies gate areas and make movement tactical; initially overpowering, later
   farmable. Visible + predictable = engagement is the player's *choice*, more
   respectful than a hidden encounter rate. *Do:* readable patterns, soft gates that
   reward growth. *Avoid:* unavoidable ambushes, gates that only yield to grinding.

7. **Combat is a war of decisions, not attrition of patience.** Each turn forces a real
   choice — target priority, resource spend, exploit-weakness-or-not — informed by what
   the next fight needs. *Do:* vary encounter composition; distinct enemy roles worth
   prioritizing; row/range/position matter. *Avoid:* one dominant "solved" strategy
   every fight; interchangeable enemies; filler trash. (Game Developer; Hookshot; SMT)

8. **Honest, transparent danger ("fair brutality").** Lethal but legible — surface the
   info to make informed risk decisions, then hold players to consequences. *Do:*
   telegraph; give tools to read danger (encounter tells, trap detection) and to survive
   it; lethal outcomes trace to a decision. *Avoid:* deaths from hidden math. (Etrian's
   "honest" difficulty; Niinou: appeal comes from *knowable* risk)

9. **Combat must FEEL weighty: presentation, pacing, speed control.** Resolve actions
   one at a time with real feedback — sequential message beats, draining HP bars, damage
   NUMBERS, hit flash, sound — while giving full speed control. An HP bar that ticks
   down lends a hit weight; damage numbers turn invisible math into felt feedback.
   **Speed control is load-bearing:** hold-to-advance (Dragon Quest's slow setting is
   also the *fastest* if you mash — "best of both worlds"), battle-speed tiers, and
   auto-battle that fast-forwards animation. *Do:* play results beat-by-beat; animate HP
   drain; proportional feedback (crits bigger); hold-to-advance + speed setting.
   *Avoid:* dumping a whole round at once with no beats; instant feedback-less
   resolution; AND over-juice that masks shallow decisions. (Goomba Stomp; acagamic;
   Dragon Quest; Etrian hold-L; ResetEra)

10. **Purity: nearly every action a meaningful decision.** Strip filler so the loop
    stays dense; pace is set by mapping and risk, not busywork. Wizardry's enduring
    appeal is "purity": quick intense combats, little inventory micromanagement, a lot
    of meaningful decision and discovery. *Do:* tight delve→deplete→retreat→resupply;
    tune encounter density/windiness as pacing. *Avoid:* long exposition, inventory
    micromanagement, filler trash. (crpgaddict)

## Where a game betrays the DRPG player (anti-patterns)

- **Trivial / "solved" combat** — advantage or over-leveling lets you steamroll; per-turn
  choice evaporates → button-mashing. (P7, P8)
- **No resource pressure** — free heals, regenerating MP, on-demand free town-warp. (P1, P2)
- **No map tension / flat traversal** — no obstacles or locked geometry; mapping becomes a
  chore. (P5)
- **Consequence-free death** — cost-free revives, instant reloads erase stakes. (P3)
- **Filler / trash encounters** — low-stakes repeated mobs; the resented part of random
  encounters. (P7, P10)
- **Same-y classes/enemies** — no reason to prioritize one target/role over another. (P4, P7)
- **Unfair, illegible danger** — deaths from hidden math the player couldn't read. (P8)
- **Feedback-less OR over-juiced combat** — instant weightless rounds drive abandonment;
  drowning shallow combat in effects is "the illusion of impact." (P9)
- **Exploration with no payoff** — secrets rewarding nothing, or over-hiding. (P5)
- **Bloat that dilutes decisions** — menu towns, exposition, inventory micromanagement. (P10)

## Black Stela audit (2026-07-11)

| Pillar | State | Notes |
|---|---|---|
| 1 Attrition | ~ | Rest points + town heal; balance now bites (#58). MP restore rules to verify. |
| 2 Push/retreat | ✔ | Town return, boss-floor escape barred, rest points. Escape-charm freeness to check. |
| 3 Sticky death | ✗ | Injury = hp→1, not death; town recovery heals cheaply; no costly/failable res. **Gap.** |
| 4 Party building | ✔ | Guild authorship, classes, reclass/retire, rows. Strong. |
| 5 Mapping | ✔ | B1–B8 mazes, minimap, full map, secret vaults, gate clues. Good; underused. |
| 6 FOEs | ✗ | Roaming threats a deferred gimmick — not implemented. |
| 7 Combat decisions | ✗ | 1-enemy fights (#66), back row can't act (#65), flat button toolbar, attack-mash. **Core gap.** |
| 8 Honest danger | ~ | Encounter model + gate clues; no in-combat telegraph/encounter meter. |
| 9 Combat feel | ✗ | Instant, no damage numbers, no speed control (#69). **The playtest complaint.** |
| 10 Purity | ~ | Combat is fast (purity attempt) but feedback-less → betrays P9. |

The active Command-Menu Combat UI lane targets Pillars **7, 9, 10** (and 4 via #65
rows). Pillars **3 (sticky death)** and **6 (FOEs)** are the next big design questions
after it.
