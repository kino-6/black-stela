import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { addInventoryItem, getEffectiveCharacterStats } from "../src/domain/economy";
import { rollEquipmentInstance } from "../src/domain/rulesEngine";
import { findAffix } from "../src/domain/affixes";
import { describeEquipmentInstance } from "../src/ui/catalog";
import { createTranslator } from "../src/i18n";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Character, InventoryItem } from "../src/domain/types";

function member(): Character {
  return addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" })).party[0];
}

describe("equipment affixes", () => {
  it("folds the +N upgrade and named enchant on top of the base item stats", () => {
    const base = member();
    const plain: Character = { ...base, equipment: { weapon: { id: "equip.militia-sabre" } } };
    const affixed: Character = { ...base, equipment: { weapon: { id: "equip.militia-sabre", plus: 1, affix: "keen" } } };

    const plainStats = getEffectiveCharacterStats(plain, defaultWorld);
    const affixedStats = getEffectiveCharacterStats(affixed, defaultWorld);

    // +1 reinforces the weapon's primary stat (attack); Keen adds accuracy +4.
    expect(affixedStats.damageMax).toBe(plainStats.damageMax + 1);
    expect(affixedStats.accuracy).toBe(Math.min(100, plainStats.accuracy + 4));
  });

  it("stacks identical instances but keeps a distinct enchant separate", () => {
    const sabre = (extra: Partial<InventoryItem> = {}): InventoryItem => ({
      id: "equip.militia-sabre",
      name: "Militia Sabre",
      kind: "equipment",
      quantity: 1,
      ...extra
    });

    let inventory: InventoryItem[] = [];
    inventory = addInventoryItem(inventory, sabre());
    inventory = addInventoryItem(inventory, sabre());
    inventory = addInventoryItem(inventory, sabre({ affix: "keen" }));
    inventory = addInventoryItem(inventory, sabre({ affix: "keen" }));
    inventory = addInventoryItem(inventory, sabre({ plus: 1 }));

    expect(inventory).toHaveLength(3);
    expect(inventory.find((item) => !item.affix && !item.plus)?.quantity).toBe(2);
    expect(inventory.find((item) => item.affix === "keen")?.quantity).toBe(2);
    expect(inventory.find((item) => item.plus === 1)?.quantity).toBe(1);
  });

  it("rolls deterministic, depth- and slot-appropriate instance data on drops", () => {
    // Deterministic: same slot/floor/seed always yields the same roll.
    expect(rollEquipmentInstance("weapon", 7, "room.x:12")).toEqual(rollEquipmentInstance("weapon", 7, "room.x:12"));

    // Over many seeds at a deep floor, both upgrades and enchants appear...
    let upgraded = 0;
    let enchanted = 0;
    for (let turn = 0; turn < 60; turn += 1) {
      const rolled = rollEquipmentInstance("weapon", 8, `room.x:${turn}`);
      if (rolled.plus) {
        upgraded += 1;
      }
      if (rolled.affix) {
        // ...and a weapon only ever draws weapon-slot enchants.
        expect(findAffix(rolled.affix)?.slots).toContain("weapon");
        enchanted += 1;
      }
    }
    expect(upgraded).toBeGreaterThan(0);
    expect(enchanted).toBeGreaterThan(0);

    // Floor 1 never rolls a "+2" (that tier starts at floor 4).
    for (let turn = 0; turn < 60; turn += 1) {
      expect(rollEquipmentInstance("weapon", 1, `room.y:${turn}`).plus ?? 1).toBeLessThanOrEqual(1);
    }
  });

  it("decorates the displayed name with the enchant prefix and +N suffix", () => {
    const t = createTranslator("en");
    expect(describeEquipmentInstance("equip.militia-sabre", "en", t, 1, "keen")).toBe("Keen Militia Sabre +1");
    expect(describeEquipmentInstance("equip.militia-sabre", "en", t, 2)).toBe("Militia Sabre +2");
    expect(describeEquipmentInstance("equip.militia-sabre", "en", t)).toBe("Militia Sabre");

    const ja = createTranslator("ja");
    expect(describeEquipmentInstance("equip.militia-sabre", "ja", ja, 1, "keen")).toBe("鋭利な 民兵の湾刀 +1");
  });
});
