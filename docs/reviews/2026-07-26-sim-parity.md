# IMP-023V — deterministic simulator ↔ production parity review

**Date:** 2026-07-26 · **Reviewer:** Claude · **Verdict:** no parity drift found.

## The concern

IMP-023 ships a deterministic content/economy simulator (the balance-evidence tool). The standing risk
this review answers: a simulator that **re-implements** gameplay formulas will drift from the production
rules over time, so its "evidence" quietly describes a game no one plays.

## What the simulators actually run

Both simulators import the **production domain functions** for every gameplay computation — they do not
carry their own copies:

- `src/headless/contentSim.ts` → `src/domain/loot` (`rollEquipmentDrop`, `sellValueOf`, `dismantleYield`,
  `resolveAffixCatalog`), `src/domain/vocations` (`masteryGain`, `MASTERED_RANK`, …), and
  `src/services/scenarioPackLoader` (`validateScenarioGraph`). Its own functions
  (`inferEnemyFloor`, `affixStrategiesAtFloor`, `usefulStrategiesAgainst`, `reviewCandidate`) are
  **coverage/strategy analysis**, not damage/HP/XP/gold/price math.
- `src/headless/descentSim.ts` → `src/domain/rulesEngine` (`createCombatState`, `executeCommand`,
  `WANDERING_ENCOUNTER_PCT`, `WANDERING_COOLDOWN_STEPS`). The survivability sim runs the **real
  production combat resolution**, not a lookalike.

So there is **no duplicated formula to drift**: the simulator's numbers are produced by the same code the
game runs.

## Production ↔ Godot

Production TS is the oracle, and the Godot port is byte-for-byte parity-locked against it by
`godot/tests/verify_parity.gd` — **36 golden traces** covering turns, exploration, multi-round combat,
abilities, poison, wipes, roster, economy, recovery, quests, loot, vocations, traps, chests, chambers,
techniques, expeditions, growth items, escape/resume, and both worlds. `gate:migration` runs it green.

Chain: **simulator → production TS domain → Godot**, all consistent by construction.

## Drift found

None. And the guard against a future drift already has teeth: `tests/simParity.test.ts` (4 tests, green)
resolves the **same kitted encounter two ways** — through the simulator's `resolveFight`, and through an
INDEPENDENT production combat loop it writes itself (`createCombatState` + `declare_round`) — and requires
**byte-identical party state**. `resolveFight` can only agree with that oracle if it is delegating to the
real engine, so if anyone ever re-implements combat math inside the simulator, these diverge and the test
fails. This is a behavioural cross-check, not merely an import assertion.

## Still mandatory

Parity is necessary, not sufficient. Per the played-build-gate, **browser reward and combat review stay
mandatory** even when this parity passes — headless evidence proves reproducibility and formula-reuse, not
that a reward reads as exciting or a fight feels threatening.
