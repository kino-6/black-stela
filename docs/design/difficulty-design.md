# Difficulty design — simulation + theory, authored per scenario

Status: **active** (framework build in progress). Read with `.claude/skills/drpg-balance` (the theory) and
`src/headless/descentSim.ts` (the oracle). This doc is the durable spec: difficulty is **designed from a
simulation against stated targets**, never hand-picked. An LLM (or a person) tunes the world-owned knobs
until the sim hits the targets — it does not choose the numbers by feel.

## Lineage: EO/Galleria-refined, not Wiz-rough

Wizardry's balance is rough — spikes, opaque RNG, surprise wipes. Etrian Odyssey and Labyrinth of Galleria
are the same *genre* but carefully level-designed. The design here follows the later lineage:

1. **Attrition is the difficulty** — you survive fight *after* fight on one tank of HP/MP/**kit** before you
   can heal, not one wall of a monster. Tune a floor's *cumulative drain*.
2. **Two danger channels, designed separately** — (a) random/trash encounters = a smooth, rarely-lethal
   drain; (b) **telegraphed spikes** (玄室 guardians, the 番所/keep squad — our FOE seed) = the tense, deep
   moments you *see* and choose to fight/avoid/farm.
3. **Honest danger** — telegraphed; a *prepared* party never surprise-wipes.
4. **Push-vs-retreat is the loop** — a finite kit + felt attrition make "one more room vs turn back" real.
5. **Scarcity is a difficulty lever** — a finite carry budget + affordability (EO's ~60-item cap) turn
   consumables into a rationed kit. Without it, "buy 99 heals, faceroll" collapses the attrition design.
6. **Build & formation diversity is balance** — exploration/spike/farm want *different* loadouts; martial
   multi-hit vs caster AoE, reach, resist gear. No single build trivializes all three.
7. **Smooth per-act ramp, spike at the act end** — each floor a little harder; a clear spike; release at
   the stairs. The anti-pattern to reject: **flat-then-spike**.

## The escalation curve (3-floor areas = acts)

- **Act I — teach**: gentle, low attrition; death only by ignoring info.
- **Act II — pressure**: real attrition, status threats, tactical squads, resource tolls.
- **Act III — finale**: tense; a wipe is credible *without preparation*; ends on the run's boss.

**Scarcity curve (this project's choice):** EO-leaning **early→mid** (tight), **easing toward Act III** —
so escaping the squeeze *is* the felt growth. Authored per act (see schema).

## The design axes and their sim metrics

**Which party the bands target — the `mid` policy.** The sim runs three loadout policies. `naive` = no
counterplay (the wipe lower bound). `prepared` = swaps the OPTIMAL counter weapon + resist for EVERY
fight — an upper bound no human reaches, and with a high `counterplayBoost` it *facerolls* weak-to-counter
foes (that faceroll IS where "preparation is worth ~N levels" comes from, so its early curve reads ~100%
by design). Neither extreme is the party a player actually fields. `mid` = one fixed general loadout (the
best raw weapon + body, chosen once, worn all descent, no per-fight element matching). **The act-curve
bands are designed against `mid`**; `naive`/`prepared` stay the wipe/clear bounds the prepare-or-wipe gates
read. `sim:balance`'s trough matrix leads with the `Np·mid` column for this reason.

The sim runs the real first-contact descent through the real combat engine, `none`-heal (pessimistic
one-push lower bound), and reports per floor. Three axes, each a measurable number the knobs target:

| Axis | Metric (in `descentSim`) | Target |
|---|---|---|
| **Prepare-or-wipe** | `preparationValue.levelsSaved` = naiveMin − preparedMin | ~10 (a naive party genuinely wipes; preparation ≈ 10 levels) |
| **Party-size** (Wiz attrition) | `partySizeValue.levelsCost` = soloMin − fullMin | large but finite (solo is dangerous; a leveled/prepared solo still has a path) |
| **Resource / economy** (to build) | consumable **burn/floor**, **kit-exhaustion floor**, **economy balance** = dive income ÷ full re-provision cost | kit runs low by the act's spike; income ≈ one re-provision + slow gear progress (EO), not a gold flood |

Plus two shape targets that catch flat-then-spike:

- **Act-curve trough band** (`none`-model lowest mid-fight HP% per floor): Act I ~0.85→0.65, II ~0.60→0.42,
  III ~0.38→0.28. **A prepared party never wipes** (deepest trough stays inside the band).
- **Trash vs spike split** (to build): the trash-trough stays in-band/gentle; the **spike-trough** (玄室
  guardian / keep) is the deep point — the telegraphed FOE, not a random pack.

`npm run sim:balance` prints all of this per world against the target band, so tuning reads *where* the curve
misses. It is the design surface — run it, adjust knobs, re-run.

## The PROVISIONED descent (how the economy axis is measured)

To make scarcity designable, the sim carries a **kit bounded by the carry cap AND affordable at the gold the
party would have** (`provisionKit` scaled by `incomeScalar`/`priceScalar`), and **auto-uses** heals/cures at
HP/status thresholds like a competent player. Then it measures burn, the floor the kit runs dry (the retreat
trigger), and the gold books. If an *affordable, carryable* kit trivializes the whole descent, scarcity is
too loose — that is the current uncapped state, and part of why early play reads "ヌルい".

## World-owned knobs (schema)

All difficulty is **authored in the scenario** (`content/worlds/<id>/world.md`), applied once at load by
`domain/balance.applyBalance`. A world that omits a knob keeps the engine default (modern, no-scarcity).

```yaml
balance:
  threatScalar: 2.2        # enemy-damage scalar — raise until a NAIVE party wipes
  counterplayBoost: 3.0    # widens weakness/resist so PREPARATION scales with threat (not a grind wall)
  economy:                 # resource-scarcity — per-act arrays index by act (0 = Act I …), last held
    carryCap:    [40, 48, 64]        # total items carried; EO-leaning early, easing late (growth)
    stackCap:    9                   # per-item stack
    priceScalar: [1.0, 0.95, 0.85]   # shop prices by act
    incomeScalar:[0.8, 1.0, 1.25]    # gold income (fight reward + loot sell) by act
    provisionKit: { heals: 3, cures: 2, revives: 1 }  # the affordable kit the PROVISIONED sim carries
```

## The tuning loop (the whole point)

1. Change a world-owned number (enemy stats / group sizes / `balance:` knobs / floor `recommendedPartySize`).
2. `npm run sim:balance` — read the two axis metrics + the trough matrix against the target band.
3. Nudge toward the targets; repeat until the curve rises smoothly, no floor wipes a prepared party, the
   party-size cost is large-but-finite, and the kit runs low by each act's spike.
4. **Gate it** — the targets live in `tests/descentSim.test.ts` so a regression is a red gate, not a feel
   call. Then **browser-verify**: the sim omits gimmick hazards/status/back-row exposure, so real play runs
   *tougher* — tune slightly gentle of the target.

## Build order (slices)

1. **Schema + applyBalance** — the `economy` receptacle (data only, behaviour unchanged). ✅
2. **PROVISIONED sim model + burn/economy metrics** — the measurement; split trash vs spike; add MP/気力
   attrition to `FloorSimResult`. Report columns in `sim:balance`. ✅
3. **Gates + tuning** — act-curve smoothness, no prepared-wipe, party-size cost, scarcity target. Then tune
   to hit them and browser-verify. Gate infra ✅; curve-reshape to the bands is the open tuning (below).

### Slice 3 — the gates that lock the axes (and what still needs tuning)

- **`tests/difficultyGate.test.ts`** locks the two axes slice 2 made measurable, per world: party-size cost
  is **large-but-finite** (`levelsCost` in [4,18], solo still clears under the cap), the kit **helps but never
  facerolls** (`provisionValue.levelsSaved` in [0,4]), and — for any world that authors `economy` — the kit
  is **priced, spent, and rations dry in the final act** (the retreat trigger) with **dive income covering a
  re-provision without flooding**. The prepare-or-wipe + act-curve axes stay gated in
  `descentSim.test.ts` / `verdantBalance.test.ts`; this file does not duplicate them.
- **Medic model:** `DEFAULT_HEAL_THRESHOLD` is **0.5** — a competent player tops up crossing half, before a
  spike drops a member (0.34 modelled a reckless player and left the kit untouched, so scarcity was
  unmeasurable). This is what makes the kit load-bearing at the floors that bite.
- **`incomeScalar`/`priceScalar` are authored but NOT yet wired** to live/sim gold (income is enemy-`gold`
  only), so `economyBalance` responds to kit size/prices-as-listed, not to those scalars. Wiring them
  (engine enemy-gold + shop prices) is a follow-up; until then they document intent.

**Still soft vs the target bands (the open tuning, needs the user's feel-in-the-loop):** at the prepared
clear level the HP curve sits *above* the act bands — Verdant g1/g2 ≈ 100/97% (band ≤85%), the mid ≈ 61-79%
(band 42-60%), g7/g8 ≈ 52/40% (band 28-38%). The danger is real only on the **naive** path (g1/g6/g7 wipe or
near-wipe). Pulling the *prepared* curve down into the bands is per-floor threat work (global `threatScalar`
can't reshape a flat top without over-deepening the floor) and it **fights the currently-locked per-world
gates** (`preparedMinLevel ≤3`, `g1f>0.7`), so it is a deliberate re-tune, not a mechanical nudge — and the
attrition currently lands **late** (kit used only at g7/g8), the *opposite* of the "序盤EO寄り" intent, because
a one-push over-levels. Levers: raise early-floor enemy damage (reshape the top), author
`recommendedPartyLevel` per floor (proportional under-level danger), add per-act **telegraphed spikes**
(`room.encounter`/`encounterSquad` — Verdant has ONE in eight floors).

### Slice 2 — what the measurement now shows (Verdant, startLv1, none-heal)

`simulateDescent(world, { provision: true })` carries the world's affordable kit (cheapest heal/cure of
each kind, capped by `carryCap[0]`, from `provisionKit`) and auto-uses it — cure a blocking status, else
heal the most-wounded below `healThreshold` (default 0.34), the medic trading their swing for it. New
`FloorSimResult` fields: `arrival/lowest/departMpPct`, `trash/spikeLowestHpPct` + `trash/spikeFights`,
`healsUsed`/`curesUsed`/`kitRemaining`/`goldEarned`. New `DescentSimResult`: `kitCost`, `totalGold`,
`economyBalance` (income ÷ one re-provision), `kitExhaustedFloor`. `npm run sim:balance` prints them.

Findings the tool surfaced (the numbers, not a feel call):

- **Scarcity is currently ~zero.** A 4-heal/2-cure kit runs 6→3 across the whole 8-floor descent, never
  dries out, and dive income is **2.4× a full re-provision**. That is the measured face of the "ヌルい"
  report: an affordable, carryable kit trivialises the push. Slice 3 tightens `provisionKit`/`carryCap`/
  `incomeScalar` until the kit runs low by the Act-II/III spike.
- **The spike channel is nearly empty.** Verdant authors exactly **one** telegraphed fight in eight floors
  (the g2f Bramble-Warden keep squad), and it is trivial to a prepared party (spike-trough 100%). All real
  danger is trash troughs. This is flat-then-spike wearing a different hat — the finale (g7/g8, 19%/33%)
  is a *trash* wall, not a *designed* guardian. Slice 3 adds telegraphed spikes per act.
- **MP/気力 reads near-full** because the auto-attack sim never casts. The channel is wired; it only bites
  once spellcasting is modelled (a later lever, noted below).

## Candidate levers (backlog, data-authorable)

- **Multi-hit techniques** (複数回攻撃): a `hits: N` on a technique effect — a martial answer that *sweeps
  several bodies of one pack* (distinct from `allEnemies` AoE, which already exists). Feeds build diversity.
- **`recommendedPartySize` / `recommendedPartyLevel`** per floor: currently unauthored, so `underpowerFactor`
  is inert and under-strength danger is not *proportional* (a 3-party's trough equals a 6-party's). Author
  these to graduate per-fight attrition by shortfall.
