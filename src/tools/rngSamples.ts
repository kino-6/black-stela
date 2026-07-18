import { chipThroughResistance, hashSeed, rollDamage } from "../domain/rulesEngine";

// S3 combat groundwork: export a fixture of the seeded-RNG primitives so the GDScript port can be
// proven byte-for-byte before the full combat resolution is ported. hashSeed is the FNV-1a variant the
// whole combat RNG rests on (signed 32-bit Math.imul + Math.abs); rollDamage and chipThroughResistance
// build on it. If Godot reproduces these, the RNG foundation is sound.

export const RNG_SAMPLES_SCHEMA_VERSION = 1;

// Seeds chosen to cover empties, ascii, digits, colons, and realistic combat seed shapes — including
// ones whose signed 32-bit hash goes negative (exercising the Math.abs at the end).
const SEEDS = [
  "",
  "a",
  "0",
  "0:1",
  "black-stela",
  "1:2:group.enemy.b1f.ash-slime:hero:damage",
  "0:1:group.enemy.b1f.ash-slime:b1f-combat-victory:init-000000:attack",
  "3:2:group.verdant.g5-sap-keeper:cast",
  "seed:chip",
  "the quick brown fox jumps over the lazy dog"
];

// rollDamage cases: min/max ordering, armor bite, and the floor-at-1 behaviour.
const ROLL_CASES = [
  { seed: "r1", min: 4, max: 6, armor: 0 },
  { seed: "r2", min: 4, max: 6, armor: 2 },
  { seed: "r3", min: 6, max: 4, armor: 0 }, // reversed min/max
  { seed: "r4", min: 1, max: 1, armor: 5 }, // armor exceeds → floors at 1
  { seed: "1:2:group.enemy.b1f.ash-slime:hero:damage", min: 3, max: 8, armor: 1 }
];

// chip cases: positive damage passes through; zero damage chips or not by the seeded 65% roll.
const CHIP_CASES = [
  { seed: "c1", damage: 5 },
  { seed: "c2", damage: 0 },
  { seed: "c3", damage: 0 },
  { seed: "0:1:x", damage: 0 }
];

export function buildRngSamples() {
  return {
    schemaVersion: RNG_SAMPLES_SCHEMA_VERSION,
    hashSeed: SEEDS.map((seed) => ({ seed, value: hashSeed(seed) })),
    rollDamage: ROLL_CASES.map((c) => ({ ...c, value: rollDamage(c.seed, c.min, c.max, c.armor) })),
    chip: CHIP_CASES.map((c) => ({ ...c, value: chipThroughResistance(c.damage, c.seed) }))
  };
}

export function rngSamplesToJson() {
  return `${JSON.stringify(buildRngSamples(), null, 2)}\n`;
}
