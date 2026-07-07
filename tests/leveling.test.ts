import { describe, expect, it } from "vitest";
import { createCharacter } from "../src/domain/gameState";
import { applyLevelUps, xpForLevel } from "../src/domain/leveling";

function member(xp: number) {
  return { ...createCharacter({ name: "Mira", notes: "Mapper" }), xp };
}

describe("leveling", () => {
  it("uses a widening XP curve", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(8);
    expect(xpForLevel(3)).toBe(24);
    expect(xpForLevel(3)).toBeGreaterThan(xpForLevel(2));
  });

  it("does not level up below the threshold", () => {
    const result = applyLevelUps(member(7));
    expect(result.character.level).toBe(1);
    expect(result.events).toHaveLength(0);
  });

  it("levels up and grows stats when XP crosses thresholds", () => {
    const before = member(24);
    const result = applyLevelUps(before);

    expect(result.character.level).toBe(3); // 24 XP reaches level 3
    expect(result.character.maxHp).toBeGreaterThan(before.maxHp);
    expect(result.character.hp).toBeGreaterThan(before.hp - 1); // topped up by the gains
    expect(result.character.damageMax).toBeGreaterThanOrEqual(before.damageMax);
    expect(result.events.map((event) => event.type)).toEqual([
      "character_leveled_up",
      "character_leveled_up"
    ]);
  });
});
