import { unlockChance } from "../domain/chests";

/** Cross-runtime fixtures for the lock-specific chance curve.  These are intentionally raw skill/DC pairs:
 * the scenario band gate owns class/level/tool composition, while Godot uses this file to prove its curve
 * has not drifted from the TypeScript oracle. */
const SAMPLES = [
  { id: "f1-untrained", skill: 21, difficulty: 8 },
  { id: "f1-specialist", skill: 29, difficulty: 8 },
  { id: "f5-specialist", skill: 33, difficulty: 16 },
  { id: "f10-tool", skill: 36, difficulty: 28 },
  { id: "floor-cap", skill: 80, difficulty: 8 },
  { id: "hopeless", skill: 0, difficulty: 28 }
] as const;

export function lockpickingSamplesToJson(): string {
  return `${JSON.stringify({ schemaVersion: 1, samples: SAMPLES.map((sample) => ({ ...sample, chance: unlockChance(sample.skill, sample.difficulty) })) }, null, 2)}\n`;
}
