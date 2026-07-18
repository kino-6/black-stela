import { getCriticalChance } from "../domain/combatMath";
import { damageGroup, rollPercent } from "../domain/rulesEngine";
import type { Character } from "../domain/types";

// S3 chunk 3b: parity fixture for the attack-path helpers — rollPercent (1-100 off the seeded hash),
// damageGroup (hp/count transitions, including a kill), and getCriticalChance (the luck-scaled clamp).
// getInitiativeScore (= effective speed) and characterSpeciesMultiplier are thin wrappers over already-
// verified pieces and are exercised by the full round parity (3c).

export const COMBAT_HELPER_SAMPLES_SCHEMA_VERSION = 1;

const ROLL_PERCENT_SEEDS = [
  "",
  "0:1:hero:group.enemy.b1f.ash-slime:hit",
  "0:1:hero:group.enemy.b1f.ash-slime:crit",
  "3:2:mira:group.verdant.g5:hit"
];

// A single-body group at full HP (like the Ash Slime): damage below HP chips it; damage at/over HP kills.
const SLIME_GROUP = [{ id: "g", count: 1, hpEach: 4, maxHpEach: 4 }];
const DAMAGE_GROUP_CASES = [
  { groups: SLIME_GROUP, groupId: "g", damage: 2 }, // survives at 2 HP
  { groups: SLIME_GROUP, groupId: "g", damage: 4 }, // exact lethal
  { groups: SLIME_GROUP, groupId: "g", damage: 8 }, // overkill
  { groups: [{ id: "g", count: 3, hpEach: 4, maxHpEach: 4 }], groupId: "g", damage: 5 } // one falls, next steps up
];

const LUCK_VALUES = [0, 1, 2, 5, 20];

function critFor(luck: number): number {
  return getCriticalChance({ aptitude: { luck } } as Character);
}

export function buildCombatHelperSamples() {
  return {
    schemaVersion: COMBAT_HELPER_SAMPLES_SCHEMA_VERSION,
    rollPercent: ROLL_PERCENT_SEEDS.map((seed) => ({ seed, value: rollPercent(seed) })),
    damageGroup: DAMAGE_GROUP_CASES.map((c) => ({
      ...c,
      result: damageGroup(c.groups as never, c.groupId, c.damage)
    })),
    criticalChance: LUCK_VALUES.map((luck) => ({ luck, value: critFor(luck) }))
  };
}

export function combatHelperSamplesToJson() {
  return `${JSON.stringify(buildCombatHelperSamples(), null, 2)}\n`;
}
