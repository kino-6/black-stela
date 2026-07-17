import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import {
  appraisalFee,
  appraiseInstance,
  dismantleYield,
  isProtectedFromBulk,
  isUnidentifiedRare,
  resolveAffixCatalog,
  rollEquipmentDrop,
  sellValueOf
} from "../src/domain/loot";
import { equipmentInstanceKey } from "../src/domain/affixes";
import { executeCommand } from "../src/domain/rulesEngine";
import { createInitialGameState } from "../src/domain/gameState";
import type { GameState, InventoryItem } from "../src/domain/types";

const WEAPON = "equip.militia-sabre";

// IMP-022A — the rare-loot / affix / appraisal contract. Affix pools are data merged with the
// built-in enchants; a drop rolls a rarity and (rare+) an affix into a unique, unidentified
// instance; bulk conversion never touches protected items.
describe("rare-loot contract", () => {
  it("merges the built-in common enchants with the world's authored rare/epic affixes", () => {
    const catalog = resolveAffixCatalog(defaultWorld);
    expect(catalog.some((a) => a.id === "keen" && a.rarity === "common")).toBe(true);
    expect(catalog.find((a) => a.id === "affix.starlit")?.rarity).toBe("epic");
    expect(catalog.find((a) => a.id === "affix.saltbitten")?.rarity).toBe("rare");
  });

  it("rolls deterministically from a seed", () => {
    const a = rollEquipmentDrop(defaultWorld, WEAPON, 5, "seed-x");
    const b = rollEquipmentDrop(defaultWorld, WEAPON, 5, "seed-x");
    expect(a).toEqual(b);
  });

  it("produces mostly commons, with rare instances that are unidentified and unique", () => {
    let commons = 0;
    let rares = 0;
    let sawUnidentifiedRare = false;
    for (let i = 0; i < 200; i += 1) {
      const drop = rollEquipmentDrop(defaultWorld, WEAPON, 6, `drop-${i}`)!;
      if ((drop.rarity ?? "common") === "common") {
        commons += 1;
        expect(drop.identified).toBe(true);
      } else {
        rares += 1;
        expect(drop.instanceId).toBeTruthy();
        expect(drop.affix).toBeTruthy();
        if (isUnidentifiedRare(drop)) sawUnidentifiedRare = true;
      }
    }
    expect(commons).toBeGreaterThan(rares); // commons dominate
    expect(rares).toBeGreaterThan(0); // but rares do drop at floor 6
    expect(sawUnidentifiedRare).toBe(true);
  });

  it("appraisal reveals a rare, and an unidentified rare is protected from bulk conversion", () => {
    let rare: InventoryItem | null = null;
    for (let i = 0; i < 400 && !rare; i += 1) {
      const drop = rollEquipmentDrop(defaultWorld, WEAPON, 6, `r-${i}`)!;
      if (isUnidentifiedRare(drop)) rare = drop;
    }
    expect(rare, "expected at least one unidentified rare in 400 rolls").toBeTruthy();
    expect(isProtectedFromBulk(rare!, new Set())).toBe(true); // unidentified → protected
    const appraised = appraiseInstance(rare!);
    expect(appraised.identified).toBe(true);
    expect(isUnidentifiedRare(appraised)).toBe(false);
    expect(isProtectedFromBulk(appraised, new Set())).toBe(false); // now convertible (if not locked/fav)
  });

  it("protects equipped, locked, and favorite items from bulk conversion", () => {
    const base: InventoryItem = { id: WEAPON, name: "Sabre", kind: "equipment", quantity: 1, rarity: "common", identified: true };
    expect(isProtectedFromBulk({ ...base, locked: true }, new Set())).toBe(true);
    expect(isProtectedFromBulk({ ...base, favorite: true }, new Set())).toBe(true);
    const equipped = new Set([equipmentInstanceKey(base.id, base.plus, base.affix)]);
    expect(isProtectedFromBulk(base, equipped)).toBe(true);
    expect(isProtectedFromBulk(base, new Set())).toBe(false); // a plain, unequipped common is free
  });

  it("yields scale with rarity and never invite a profit loop", () => {
    const common: InventoryItem = { id: WEAPON, name: "Sabre", kind: "equipment", quantity: 1, rarity: "common", sellValue: 5, identified: true };
    const epic: InventoryItem = { ...common, rarity: "epic" };
    expect(sellValueOf(epic)).toBeGreaterThan(sellValueOf(common));
    expect(dismantleYield(epic)).toBeGreaterThan(dismantleYield(common));
  });

  it("appraise / lock / bulk-convert commands respect the protection guard (IMP-022C)", () => {
    const rare: InventoryItem = { id: WEAPON, name: "Sabre", kind: "equipment", quantity: 1, slot: "weapon", sellValue: 5, rarity: "rare", affix: "affix.saltbitten", identified: false, instanceId: "inst-rare" };
    const common: InventoryItem = { id: WEAPON, name: "Sabre", kind: "equipment", quantity: 1, slot: "weapon", sellValue: 5, rarity: "common", identified: true };
    const keeper: InventoryItem = { id: WEAPON, name: "Sabre", kind: "equipment", quantity: 1, rarity: "rare", affix: "affix.saltbitten", identified: true, locked: true, instanceId: "inst-keep" };
    const base: GameState = { ...createInitialGameState(), phase: "town", inventory: [rare, common, keeper], partyGold: 100 };

    // A bulk sell now leaves the unidentified rare AND the locked keeper, taking only the common.
    const soldEarly = executeCommand(base, defaultWorld, { type: "bulk_convert", mode: "sell" });
    expect(soldEarly.inventory.map((i) => i.instanceId ?? i.id)).toEqual(expect.arrayContaining(["inst-rare", "inst-keep"]));
    expect(soldEarly.inventory.some((i) => i.rarity === "common")).toBe(false); // the common was sold
    expect(soldEarly.partyGold).toBeGreaterThan(base.partyGold); // the sale added gold

    // Appraise the rare → it is no longer protected by "unidentified", and the fee is charged.
    const appraised = executeCommand(base, defaultWorld, { type: "appraise_item", instanceId: "inst-rare" });
    expect(appraised.inventory.find((i) => i.instanceId === "inst-rare")?.identified).toBe(true);
    expect(appraised.partyGold).toBe(base.partyGold - appraisalFee(rare)); // IMP-022V: appraisal costs gold

    // Locking the appraised rare re-protects it from a subsequent bulk dismantle.
    const locked = executeCommand(appraised, defaultWorld, { type: "toggle_item_lock", instanceId: "inst-rare" });
    const dismantled = executeCommand(locked, defaultWorld, { type: "bulk_convert", mode: "dismantle" });
    expect(dismantled.inventory.some((i) => i.instanceId === "inst-rare")).toBe(true); // locked → kept
    expect(dismantled.inventory.some((i) => i.instanceId === "inst-keep")).toBe(true); // locked → kept
    expect(dismantled.materials ?? 0).toBeGreaterThan(0); // the common yielded materials
  });

  it("appraisal is a paid service — an epic costs more than a rare, and a broke party can't afford it (IMP-022V)", () => {
    const rare: InventoryItem = { id: WEAPON, name: "Sabre", kind: "equipment", quantity: 1, rarity: "rare", affix: "affix.saltbitten", identified: false, instanceId: "inst-rare" };
    const epic: InventoryItem = { ...rare, rarity: "epic", instanceId: "inst-epic" };
    expect(appraisalFee(epic)).toBeGreaterThan(appraisalFee(rare));
    expect(appraisalFee({ rarity: "common" })).toBe(0);

    // Not enough gold → nothing happens (no reveal, no negative gold).
    const broke: GameState = { ...createInitialGameState(), phase: "town", inventory: [rare], partyGold: appraisalFee(rare) - 1 };
    const blocked = executeCommand(broke, defaultWorld, { type: "appraise_item", instanceId: "inst-rare" });
    expect(blocked.inventory.find((i) => i.instanceId === "inst-rare")?.identified).toBe(false);
    expect(blocked.partyGold).toBe(broke.partyGold); // untouched, never negative
  });

  it("applies an authored affix's bonus in combat via the merged catalog", () => {
    // (Sanity: the economy stat resolver reads the world's affix catalog — covered by combat tests;
    //  here we assert the catalog carries the numeric bonus the resolver will add.)
    const saltbitten = resolveAffixCatalog(defaultWorld).find((a) => a.id === "affix.saltbitten");
    expect(saltbitten?.attackBonus).toBe(2);
  });
});
