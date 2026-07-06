import { describe, expect, it } from "vitest";
import {
  backgroundCatalog,
  classCatalog,
  createGuildCharacter,
  createQuickRecruit,
  createStarterParty,
  PARTY_SIZE_LIMIT,
  traitCatalog
} from "../src/domain/characterCreation";
import { createIdentitySuggestion } from "../src/domain/identitySuggestion";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { defaultWorld } from "../src/data/defaultWorld";

describe("character creation", () => {
  it("offers enough class variety for a six-member DRPG party", () => {
    expect(classCatalog).toHaveLength(12);
    expect(new Set(classCatalog.map((classDef) => classDef.id)).size).toBe(12);
    expect(classCatalog.every((classDef) => classDef.description.en.length > 20)).toBe(true);
    expect(classCatalog.every((classDef) => classDef.description.ja.length > 10)).toBe(true);
    expect(classCatalog.every((classDef) => Object.values(classDef.aptitude).some((value) => (value ?? 0) > 0))).toBe(true);
    expect(classCatalog.filter((classDef) => classDef.rowPreference === "front").length).toBeGreaterThanOrEqual(6);
    expect(classCatalog.filter((classDef) => classDef.rowPreference === "back").length).toBeGreaterThanOrEqual(5);
  });

  it("offers enough origins and temperaments for roster authorship", () => {
    expect(backgroundCatalog).toHaveLength(12);
    expect(traitCatalog).toHaveLength(12);
    expect(new Set(backgroundCatalog.map((background) => background.id)).size).toBe(12);
    expect(new Set(traitCatalog.map((trait) => trait.id)).size).toBe(12);
    expect(backgroundCatalog.every((background) => background.notes.en.length > 18)).toBe(true);
    expect(backgroundCatalog.every((background) => background.notes.ja.length > 8)).toBe(true);
    expect(backgroundCatalog.every((background) => background.accentColor.startsWith("#"))).toBe(true);
    expect(backgroundCatalog.every((background) => background.portraitKey.length > 0)).toBe(true);
  });

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
    expect(character.startingEquipment).toContain("equip.chalk-cord");
    expect(character.aptitude.wit).toBeGreaterThan(character.aptitude.might);
    expect(character.maxHp).toBeGreaterThan(0);
    expect(character.damageMax).toBeGreaterThanOrEqual(character.damageMin);
  });

  it("equips the class starting loadout so adventurers are not empty-handed", () => {
    const vanguard = createGuildCharacter({ name: "Mira", classId: "vanguard" });
    expect(vanguard.equipment.weapon).toBe("equip.militia-sabre");
    expect(vanguard.equipment.body).toBe("equip.padded-jack");
    const effective = getEffectiveCharacterStats(vanguard, defaultWorld);
    expect(effective.attack).toBeGreaterThan(vanguard.attack);
    expect(effective.armor).toBeGreaterThan(vanguard.armor);

    // Every class enters with at least a weapon or protective slot filled.
    for (const classDef of classCatalog) {
      const member = createGuildCharacter({ name: "Test", classId: classDef.id });
      expect(Object.keys(member.equipment).length).toBeGreaterThan(0);
    }
  });

  it("uses the origin as the default visual accent when no manual color is provided", () => {
    const character = createGuildCharacter({
      name: "Orn",
      classId: "mender",
      backgroundId: "grave_tender",
      traitIds: ["soft_spoken"]
    });

    expect(character.accentColor).toBe(backgroundCatalog.find((background) => background.id === "grave_tender")?.accentColor);
    expect(character.notes).toBe("Does not flinch at the still or the cold.");
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

  it("applies manually allocated bonus aptitude during detailed creation", () => {
    const base = createGuildCharacter({ name: "Rill", classId: "seeker", backgroundId: "watch", traitIds: ["steady"] });
    const boosted = createGuildCharacter({
      name: "Rill",
      classId: "seeker",
      backgroundId: "watch",
      traitIds: ["steady"],
      bonusAptitude: { agility: 3 }
    });

    expect(boosted.aptitude.agility).toBe(base.aptitude.agility + 3);
    expect(boosted.speed).toBe(base.speed + 3);
  });

  it("starts from class aptitude instead of zeroed ability rows", () => {
    const vanguard = createGuildCharacter({ name: "Rook", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"] });
    const arcanist = createGuildCharacter({ name: "Mira", classId: "arcanist", backgroundId: "scriptorium", traitIds: ["curious"] });

    expect(vanguard.aptitude.might).toBeGreaterThan(2);
    expect(vanguard.aptitude.spirit).toBeGreaterThan(2);
    expect(arcanist.aptitude.wit).toBeGreaterThan(arcanist.aptitude.might);
  });

  it("rolls name, epithet, and record suggestions from the chosen recruit texture", () => {
    const suggestion = createIdentitySuggestion({
      seed: 4,
      locale: "ja",
      classId: "seeker",
      backgroundId: "cartographer",
      traitId: "curious"
    });
    const nextSuggestion = createIdentitySuggestion({
      seed: 5,
      locale: "ja",
      classId: "seeker",
      backgroundId: "cartographer",
      traitId: "curious"
    });

    expect(suggestion.name.length).toBeGreaterThan(0);
    expect(suggestion.title.length).toBeGreaterThan(0);
    expect(suggestion.notes).toContain("地図師");
    expect(suggestion.notes).toContain("探索者");
    expect(nextSuggestion.name).not.toBe(suggestion.name);
  });

  it("starter templates create a six-member front/back formation", () => {
    const party = createStarterParty("balanced", 2);

    expect(party).toHaveLength(PARTY_SIZE_LIMIT);
    expect(party.filter((member) => member.row === "front")).toHaveLength(3);
    expect(party.filter((member) => member.row === "back")).toHaveLength(3);
  });

  it("does not add a seventh party member", () => {
    const party = createStarterParty("balanced", 2);
    const fullState = party.reduce((state, member) => addCharacter(state, member), createInitialGameState());
    const overflow = addCharacter(fullState, createQuickRecruit("overflow", 2));

    expect(fullState.party).toHaveLength(PARTY_SIZE_LIMIT);
    expect(overflow.party).toHaveLength(PARTY_SIZE_LIMIT);
  });
});
