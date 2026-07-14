import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createGuildCharacter } from "../src/domain/characterCreation";
import {
  getEvasionChance,
  getInitiativeScore,
  getSpellPowerBonus,
  getStatusSpellChance
} from "../src/domain/combatMath";

describe("aptitude combat effects", () => {
  it("turns agility into a visible evasion chance", () => {
    const slow = createGuildCharacter({
      name: "Slow",
      classId: "vanguard",
      bonusAptitude: { might: 0, agility: 0, spirit: 0, wit: 0, luck: 0 }
    });
    const agile = {
      ...slow,
      aptitude: { ...slow.aptitude, agility: slow.aptitude.agility + 4 },
      speed: slow.speed + 4
    };

    expect(getEvasionChance(agile, defaultWorld)).toBeGreaterThan(getEvasionChance(slow, defaultWorld));
    expect(getInitiativeScore(agile, defaultWorld)).toBeGreaterThan(getInitiativeScore(slow, defaultWorld));
  });

  it("turns wit into spell power and status accuracy", () => {
    const caster = createGuildCharacter({ name: "Sei", classId: "occultist" });
    const sharper = { ...caster, aptitude: { ...caster.aptitude, wit: caster.aptitude.wit + 3 } };

    expect(getSpellPowerBonus(sharper)).toBeGreaterThan(getSpellPowerBonus(caster));
    expect(getStatusSpellChance(sharper, 20)).toBeGreaterThan(getStatusSpellChance(caster, 20));
  });

  it("keeps spell status odds bounded even against extreme resistance", () => {
    const caster = createGuildCharacter({ name: "Sei", classId: "occultist" });

    expect(getStatusSpellChance(caster, 100)).toBeGreaterThanOrEqual(5);
    expect(getStatusSpellChance(caster, 0)).toBeLessThanOrEqual(95);
  });
});
