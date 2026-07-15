import type { ScenarioWorld } from "./types";

// The two knobs the balance auto-tuner (see descentSim.preparationValue + scripts) settles per
// world, kept in world.md so the difficulty is authored content, not a code constant — and stays
// ONE number to re-tune, instead of a scalar baked into every enemy row.
//
//  · threatScalar     — multiplies enemy damage. Higher = a naive party (no counterplay, no grind)
//                       genuinely wipes, so the game asks you to prepare or level.
//  · counterplayBoost — pushes weaknesses further from 1 and deepens element resistances, so a
//                       PREPARED party's advantage scales with the threat. This is what turns the
//                       raised difficulty into "you can be ~10 levels under the curve and still
//                       win, IF you brought the right tools" rather than a flat wall.
//
// The design target (user, 2026-07-15): preparation worth ≈10 levels, high difficulty, prepare-or-
// grind. The knobs are searched against descentSim.preparationValue and the act curve.
export interface WorldBalance {
  threatScalar?: number;
  counterplayBoost?: number;
}

const amplifyWeakness = (multiplier: number, boost: number): number => {
  if (multiplier > 1) {
    return 1 + (multiplier - 1) * boost; // a weakness bites harder
  }
  if (multiplier < 1) {
    return Math.max(0.05, 1 - (1 - multiplier) * boost); // a resistance runs deeper
  }
  return multiplier;
};

const deepenResist = (multiplier: number, boost: number): number => Math.max(0.1, 1 - (1 - multiplier) * boost);

/**
 * Apply a world's balance knobs to its enemies and counterplay gear. Idempotent per world only if
 * called once — call it exactly where the world is finalised (worldRegistry / defaultWorld), never
 * in a hot path. A world with no `balance` block is returned untouched.
 */
export function applyBalance(world: ScenarioWorld): ScenarioWorld {
  const knobs = world.balance;
  if (!knobs || (!knobs.threatScalar && !knobs.counterplayBoost)) {
    return world;
  }
  const k = knobs.threatScalar ?? 1;
  const c = knobs.counterplayBoost ?? 1;

  const scaleDamage = (value: number | undefined): number | undefined =>
    value == null ? value : Math.max(1, Math.round(value * k));

  const enemies = world.enemies.map((enemy) => ({
    ...enemy,
    attack: Math.round(enemy.attack * k),
    damageMin: scaleDamage(enemy.damageMin),
    damageMax: scaleDamage(enemy.damageMax),
    weaknesses: enemy.weaknesses
      ? Object.fromEntries(Object.entries(enemy.weaknesses).map(([element, m]) => [element, amplifyWeakness(m ?? 1, c)]))
      : enemy.weaknesses,
    abilities: enemy.abilities?.map((ability) =>
      ability.effect.kind === "damage"
        ? { ...ability, effect: { ...ability.effect, min: Math.max(1, Math.round(ability.effect.min * k)), max: Math.max(1, Math.round(ability.effect.max * k)) } }
        : ability
    )
  }));

  const equipment = world.equipment.map((gear) =>
    gear.elementResist
      ? { ...gear, elementResist: Object.fromEntries(Object.entries(gear.elementResist).map(([element, m]) => [element, deepenResist(m ?? 1, c)])) }
      : gear
  );

  return { ...world, enemies, equipment };
}
