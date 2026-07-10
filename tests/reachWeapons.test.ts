import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createCharacter } from "../src/domain/gameState";
import { weaponReaches } from "../src/domain/economy";

// #65: a reach weapon (bow / long spear) lets a back-row member strike over the
// front line; a melee weapon or an empty hand does not.
describe("reach weapons", () => {
  const withWeapon = (weaponId?: string) => ({
    ...createCharacter({ name: "Archer", notes: "" }),
    equipment: weaponId ? { weapon: { id: weaponId } } : {}
  });

  it("a bow reaches from the back row", () => {
    expect(weaponReaches(withWeapon("equip.short-bow"), defaultWorld)).toBe(true);
  });

  it("a long spear reaches from the back row", () => {
    expect(weaponReaches(withWeapon("equip.long-spear"), defaultWorld)).toBe(true);
  });

  it("a melee blade does not reach from the back row", () => {
    expect(weaponReaches(withWeapon("equip.militia-sabre"), defaultWorld)).toBe(false);
  });

  it("an empty weapon hand does not reach", () => {
    expect(weaponReaches(withWeapon(undefined), defaultWorld)).toBe(false);
  });

  it("the reach weapons exist in the catalog and shop", () => {
    const ids = new Set(defaultWorld.equipment.map((item) => item.id));
    expect(ids.has("equip.short-bow")).toBe(true);
    expect(ids.has("equip.long-spear")).toBe(true);
    const stock = new Set((defaultWorld.shops[0]?.stock ?? []).map((entry) => entry.itemId));
    expect(stock.has("equip.short-bow")).toBe(true);
  });
});
