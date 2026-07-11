import { describe, expect, it } from "vitest";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Character } from "../src/domain/types";

// Equipment schema expansion: gear can grant HP / MP / status-resistance, applied
// through getEffectiveCharacterStats so combat heal caps, recovery, and the gauges
// all see the bigger pool. These lock the new bonus wiring.
function withAccessory(id: string): Character {
  const base = createGuildCharacter({ name: "Tess", classId: "vanguard", seed: "gear" });
  return { ...base, equipment: { ...base.equipment, accessory: { id } } };
}

describe("equipment HP/MP/resist bonuses", () => {
  it("a vitality charm raises effective max HP", () => {
    const base = createGuildCharacter({ name: "Tess", classId: "vanguard", seed: "gear" });
    const withCharm = withAccessory("equip.vitality-charm");
    expect(getEffectiveCharacterStats(withCharm, defaultWorld).maxHp).toBe(base.maxHp + 6);
  });

  it("a focus band raises effective max MP", () => {
    const mender = createGuildCharacter({ name: "Sei", classId: "mender", seed: "gear" });
    const withBand: Character = { ...mender, equipment: { ...mender.equipment, accessory: { id: "equip.focus-band" } } };
    expect(getEffectiveCharacterStats(withBand, defaultWorld).maxMp).toBe(mender.maxMp + 4);
  });

  it("an antivenom ring grants poison resistance; a dreamward amulet resists sleep + fear", () => {
    expect(getEffectiveCharacterStats(withAccessory("equip.antivenom-ring"), defaultWorld).resistance.poison).toBe(45);
    const dream = getEffectiveCharacterStats(withAccessory("equip.dreamward-amulet"), defaultWorld).resistance;
    expect(dream.sleep).toBe(45);
    expect(dream.fear).toBe(25);
  });

  it("bare gear leaves the base pools untouched", () => {
    const base = createGuildCharacter({ name: "Tess", classId: "vanguard", seed: "gear" });
    const stats = getEffectiveCharacterStats(base, defaultWorld);
    expect(stats.maxHp).toBe(base.maxHp);
    expect(stats.maxMp).toBe(base.maxMp);
  });
});
