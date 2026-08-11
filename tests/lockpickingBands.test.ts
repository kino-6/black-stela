import { describe, expect, it } from "vitest";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { unlockChance, unlockSkill } from "../src/domain/chests";
import { classProficiency, proficiencyBonus } from "../src/domain/classCapabilities";
import { getWorldById } from "../src/data/worldRegistry";
import type { Character } from "../src/domain/types";

/**
 * D6 — locks must make the handler, growth and consumed tool visible decisions.
 *
 * This is intentionally a BAND gate, rather than snapshotting a single seed result.  It locks the
 * authored F1/F2/F5/F7/F10 progression and the relative value of all three player answers:
 * untrained hand, thief training, and a paid field tool.
 */
const EXPECTED_LOCK_BANDS = [
  { floor: "dungeon.tl1f", difficulty: [6, 10], level: 1 },
  { floor: "dungeon.tl2f", difficulty: [10, 14], level: 3 },
  { floor: "dungeon.tl5f", difficulty: [14, 18], level: 5 },
  { floor: "dungeon.tl7f", difficulty: [19, 23], level: 7 },
  { floor: "dungeon.tl10f", difficulty: [26, 30], level: 10 }
] as const;

const terminalLineWorld = getWorldById("terminal-line") ?? (() => {
  throw new Error("terminal-line world is not registered");
})();
const TRAINED_UNLOCK_BONUS = proficiencyBonus(classProficiency("swordmaster", "unlock"));
const SPECIALIST_UNLOCK_BONUS = proficiencyBonus(classProficiency("thief", "unlock"));
const unlockTools = terminalLineWorld.items.filter((item) => item.explorationAid?.actions.includes("unlock"));

function handler(classId: Character["classId"], level: number): Character {
  return {
    ...createGuildCharacter({ name: `${classId}-${level}`, classId, seed: `lock-band:${classId}:${level}` }),
    level,
    // A stable, ordinary recruit profile.  The gate measures the rules curve, not seeded guild variance.
    aptitude: { might: 5, agility: 5, spirit: 5, wit: 5, luck: 5 }
  };
}

function rate(member: Character, difficulty: number, toolBonus = 0): number {
  return unlockChance(unlockSkill(member) + toolBonus, difficulty);
}

function lockDifficulty(floorId: string): number {
  const floor = terminalLineWorld.dungeons.find((candidate) => candidate.id === floorId);
  const difficulty = floor?.rooms.flatMap((room) => (room.chest?.lock ? [room.chest.lock.difficulty] : []))[0];
  if (difficulty === undefined) throw new Error(`${floorId} has no authored lock`);
  return difficulty;
}

describe("D6 lockpicking bands — Terminal Line", () => {
  it("authors one rising lock band at every intended depth", () => {
    for (const expected of EXPECTED_LOCK_BANDS) {
      const difficulty = lockDifficulty(expected.floor);
      expect(difficulty, `${expected.floor} lock DC`).toBeGreaterThanOrEqual(expected.difficulty[0]);
      expect(difficulty, `${expected.floor} lock DC`).toBeLessThanOrEqual(expected.difficulty[1]);
    }
  });

  it("keeps trained, specialist, growth, and a standard tool in distinct success-rate bands", () => {
    for (const expected of EXPECTED_LOCK_BANDS) {
      const difficulty = lockDifficulty(expected.floor);
      const untrained = rate(handler("warrior", expected.level), difficulty);
      const trained = rate(handler("swordmaster", expected.level), difficulty);
      const specialist = rate(handler("thief", expected.level), difficulty);
      const tool = rate(handler("warrior", expected.level), difficulty, 6);

      expect(untrained, `${expected.floor}: untrained odds`).toBeGreaterThanOrEqual(30);
      expect(untrained, `${expected.floor}: untrained odds`).toBeLessThanOrEqual(50);
      expect(trained, `${expected.floor}: trained odds`).toBeGreaterThan(untrained);
      expect(trained, `${expected.floor}: trained odds`).toBeLessThan(specialist);
      expect(specialist, `${expected.floor}: specialist odds`).toBeGreaterThanOrEqual(55);
      expect(specialist, `${expected.floor}: specialist odds`).toBeLessThanOrEqual(70);
      expect(tool, `${expected.floor}: tool odds`).toBeGreaterThan(untrained);
      expect(tool, `${expected.floor}: consumable tool cannot completely replace specialist training`).toBeLessThan(specialist);
      for (const unlockTool of unlockTools) {
        const toolRate = rate(handler("warrior", expected.level), difficulty, unlockTool.explorationAid!.bonus);
        expect(toolRate, `${expected.floor}: ${unlockTool.id} improves an untrained attempt`).toBeGreaterThan(untrained);
        expect(toolRate, `${expected.floor}: ${unlockTool.id} remains below specialist training`).toBeLessThan(specialist);
      }
      expect(specialist, `${expected.floor}: no level-appropriate lock may be a 95% formality`).toBeLessThan(95);
    }
  });

  it("makes the same specialist materially better as their level rises", () => {
    const difficulty = lockDifficulty("dungeon.tl5f");
    const novice = rate(handler("thief", 1), difficulty);
    const practiced = rate(handler("thief", 5), difficulty);
    const veteran = rate(handler("thief", 10), difficulty);
    expect(practiced).toBeGreaterThanOrEqual(novice + 8);
    expect(veteran).toBeGreaterThanOrEqual(practiced + 8);
  });

  it("does not author an unlock tool stronger than the class specialist bonus", () => {
    expect(TRAINED_UNLOCK_BONUS, "the trained occupation tier exists for unlock").toBeGreaterThan(0);
    expect(TRAINED_UNLOCK_BONUS).toBeLessThan(SPECIALIST_UNLOCK_BONUS);
    expect(unlockTools.length).toBeGreaterThanOrEqual(2);
    for (const tool of unlockTools) {
      expect(tool.explorationAid!.bonus, `${tool.id} must remain an alternative, not a free thief`).toBeLessThan(SPECIALIST_UNLOCK_BONUS);
    }
  });
});
