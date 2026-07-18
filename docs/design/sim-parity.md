# Simulator ↔ Production Parity (IMP-023V)

**Question:** does the deterministic content/descent simulator produce the same
outcomes the real game would, or has it drifted from production rules?

## Finding: parity is structural, not coincidental

The descent simulator (`src/headless/descentSim.ts`) is built **on** the
production runtime, not beside it. It imports and drives the real code:

- **World data** comes from `worldRegistry` — the same loaders (`buildWorld` +
  `applyBalance`) the browser uses. No parallel content parse.
- **Combat** is `createCombatState` + `executeCommand({ type: "declare_round" })`
  from `src/domain/rulesEngine.ts` — the exact engine the browser resolves rounds
  with, including hit/damage rolls, element multipliers, enemy AI targeting,
  status, and the resisted-hit chip.
- **Growth** is `applyLevelUps` + `xpForLevel` from `src/domain/leveling.ts`.

The only simulator-specific logic is:

1. **Encounter planning** (`planFloor` / `planWanderingFights`) — reads authored
   room/encounter data to decide *which* fights a first-contact descent meets.
   It selects content; it computes no combat math.
2. **Gear kitting** (`equipPartyForEnemy`) — chooses *equipment ids* for the
   naive/prepared policies. It sets loadouts; the stat effect of those loadouts is
   computed by production `getEffectiveCharacterStats` at resolve time.

So there is **no duplicated damage/hit/leveling formula** that could drift.

## The gate that keeps it true

`tests/simParity.test.ts` resolves the same kitted encounter two ways — through
`resolveFight`, and through an **independent** production combat loop written in
the test (its own `createCombatState` + `declare_round` driver) — and requires
byte-identical party HP, wounds, phase, and enemy counts, for naive and prepared
policies across two enemies. If anyone ever reimplements combat inside the
simulator, the two paths diverge and the test fails.

## Standing rule (unchanged)

Headless parity is **not** UX proof. Browser reward and combat review remain
mandatory after a simulator pass — the sim omits presentation, back-row exposure,
and status feel, so real play still runs tougher (see `drpg-balance`). The
simulator is a balance oracle, not evidence that a screen is legible or fun.
