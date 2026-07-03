import { describe, expect, it } from "vitest";
import { createGuildCharacter, createQuickRecruit } from "../src/domain/characterCreation";

describe("character creation", () => {
  it("creates a guild recruit with class, aptitude, equipment, and creation history", () => {
    const character = createGuildCharacter({
      name: "Mira",
      notes: "Maps by candlelight.",
      title: "Candle Mapper",
      classId: "seeker",
      backgroundId: "cartographer",
      traitIds: ["curious"],
      aptitudeFocus: "wit",
      accentColor: "#8ea87a",
      method: "detailed",
      registeredAtTurn: 3
    });

    expect(character).toMatchObject({
      name: "Mira",
      title: "Candle Mapper",
      classId: "seeker",
      backgroundId: "cartographer",
      traitIds: ["curious"],
      row: "front",
      rowPreference: "front",
      accentColor: "#8ea87a",
      creation: { method: "detailed", registeredAtTurn: 3 },
      memory: { injuries: 0, retreats: 0, notableVictories: [], deeds: [] }
    });
    expect(character.roleTags).toContain("trap_handling");
    expect(character.startingEquipment).toContain("chalk cord");
    expect(character.aptitude.wit).toBeGreaterThan(character.aptitude.might);
    expect(character.maxHp).toBeGreaterThan(0);
    expect(character.damageMax).toBeGreaterThanOrEqual(character.damageMin);
  });

  it("generates deterministic quick recruits from the same seed", () => {
    const left = createQuickRecruit("guild-seed", 1);
    const right = createQuickRecruit("guild-seed", 1);

    expect(left.name).toBe(right.name);
    expect(left.classId).toBe(right.classId);
    expect(left.backgroundId).toBe(right.backgroundId);
    expect(left.traitIds).toEqual(right.traitIds);
    expect(left.creation).toEqual({ method: "quick", seed: "guild-seed", registeredAtTurn: 1 });
  });
});
