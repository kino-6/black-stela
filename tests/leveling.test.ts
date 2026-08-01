import { describe, expect, it } from "vitest";
import { createCharacter } from "../src/domain/gameState";
import { applyLevelUps, growthForLevel, xpForLevel } from "../src/domain/leveling";
import { knownSpells } from "../src/domain/spells";

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

  // T5 — the result screen states WHAT a level-up changed; these are the exported derivations it maps over.
  it("exposes the per-level stat gain the result panel shows (growthForLevel)", () => {
    const gain = growthForLevel(member(0), 2);
    expect(gain.maxHp).toBeGreaterThan(0); // a delta always exists to display
    expect(gain.attack).toBe(1); // level 2 is an every-other level
    // The panel renders only the non-zero fields, so at least one must be non-zero.
    expect(Object.values(gain).some((v) => v !== 0)).toBe(true);
  });

  it("detects techniques newly usable at a level (knownSpells delta)", () => {
    // A caster class learns more of its line as it levels — the 'Learned:' line the panel derives.
    const early = knownSpells("mage", 1);
    const later = knownSpells("mage", 8);
    expect(later.length).toBeGreaterThanOrEqual(early.length);
    // Somewhere on the curve a new technique appears (the delta the panel names).
    const anyGrowth = Array.from({ length: 8 }, (_, i) => knownSpells("mage", i + 1).length);
    expect(Math.max(...anyGrowth)).toBeGreaterThan(anyGrowth[0]);
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
