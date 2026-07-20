import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { getEffectiveCharacterStats, isEquipmentUsableBy } from "../src/domain/economy";
import { executeCommand, resolveCommand } from "../src/domain/rulesEngine";

function stateWithParty() {
  // Equip mechanics are tested from a clean slate; strip the class starting
  // loadout so slot/stat deltas reflect only what the test equips.
  return addCharacter(createInitialGameState(), { ...createCharacter({ name: "Mira", notes: "Mapper" }), equipment: {} });
}

describe("economy and equipment", () => {
  it("starts with shared party gold and does not auto-collect treasure on descent (IMP-029)", () => {
    const state = stateWithParty();
    const entered = executeCommand(state, defaultWorld, { type: "enter_dungeon" });

    expect(state.partyGold).toBeGreaterThan(0);
    // No auto-collect: descending grants no loot and claims no room (chamber loot is a chest, not auto).
    expect(entered.inventory.length).toBe(state.inventory.length);
    expect(entered.claimedTreasures).not.toContain("room.b1f.001");
    // The safe town-stair landing is a clean walk-through — no chest gates the entrance.
    expect((entered.chests ?? []).some((chest) => chest.roomId === "room.b1f.001")).toBe(false);
  });

  it("buys equipment from town and equips it without changing base character identity", () => {
    const state = stateWithParty();
    const bought = executeCommand(state, defaultWorld, {
      type: "buy_item",
      shopId: "shop.stela-general",
      itemId: "equip.militia-sabre"
    });
    const equipped = executeCommand(bought, defaultWorld, {
      type: "equip_item",
      characterId: bought.party[0].id,
      equipmentId: "equip.militia-sabre"
    });

    expect(bought.partyGold).toBe(state.partyGold - 45);
    expect(bought.inventory.find((item) => item.id === "equip.militia-sabre")?.quantity).toBe(1);
    expect(equipped.party[0].equipment.weapon?.id).toBe("equip.militia-sabre");
    expect(getEffectiveCharacterStats(equipped.party[0], defaultWorld).damageMax).toBe(
      state.party[0].damageMax + 2
    );

    const sellEquipped = executeCommand(equipped, defaultWorld, { type: "sell_item", itemId: "equip.militia-sabre" });
    expect(sellEquipped.partyGold).toBe(equipped.partyGold);
    expect(sellEquipped.party[0].equipment.weapon?.id).toBe("equip.militia-sabre");
  });

  it("supports DRPG equipment slots, stat tradeoffs, and class restrictions", () => {
    const state = stateWithParty();
    const withBuckler = executeCommand(
      executeCommand(state, defaultWorld, {
        type: "buy_item",
        shopId: "shop.stela-general",
        itemId: "equip.split-buckler"
      }),
      defaultWorld,
      {
        type: "equip_item",
        characterId: state.party[0].id,
        equipmentId: "equip.split-buckler"
      }
    );
    const withCap = executeCommand(
      executeCommand(withBuckler, defaultWorld, {
        type: "buy_item",
        shopId: "shop.stela-general",
        itemId: "equip.iron-cap"
      }),
      defaultWorld,
      {
        type: "equip_item",
        characterId: state.party[0].id,
        equipmentId: "equip.iron-cap"
      }
    );
    const withGrip = executeCommand(
      executeCommand(withCap, defaultWorld, {
        type: "buy_item",
        shopId: "shop.stela-general",
        itemId: "equip.grip-gloves"
      }),
      defaultWorld,
      {
        type: "equip_item",
        characterId: state.party[0].id,
        equipmentId: "equip.grip-gloves"
      }
    );

    expect(withGrip.party[0].equipment.offhand?.id).toBe("equip.split-buckler");
    expect(withGrip.party[0].equipment.head?.id).toBe("equip.iron-cap");
    expect(withGrip.party[0].equipment.hands?.id).toBe("equip.grip-gloves");
    expect(getEffectiveCharacterStats(withGrip.party[0], defaultWorld)).toMatchObject({
      armor: state.party[0].armor + 2,
      accuracy: state.party[0].accuracy + 4,
      speed: state.party[0].speed - 1
    });
  });

  it("blocks class-ineligible equipment", () => {
    const state = {
      ...stateWithParty(),
      partyGold: 100,
      party: stateWithParty().party.map((member) => ({ ...member, classId: "priest" as const, row: "back" as const }))
    };
    const bought = executeCommand(state, defaultWorld, {
      type: "buy_item",
      shopId: "shop.stela-general",
      itemId: "equip.split-buckler"
    });
    const equipped = executeCommand(bought, defaultWorld, {
      type: "equip_item",
      characterId: bought.party[0].id,
      equipmentId: "equip.split-buckler"
    });

    expect(isEquipmentUsableBy(defaultWorld.equipment.find((item) => item.id === "equip.split-buckler")!, bought.party[0])).toBe(false);
    expect(equipped.party[0].equipment.offhand).toBeUndefined();
  });

  it("charges gold for recovery and blocks unaffordable recovery", () => {
    const injured = {
      ...stateWithParty(),
      partyGold: 12,
      party: stateWithParty().party.map((member) => ({ ...member, hp: member.maxHp - 4, injury: "wounded" as const }))
    };
    const recovered = executeCommand(injured, defaultWorld, { type: "recover_party" });
    const blocked = executeCommand({ ...injured, partyGold: 0 }, defaultWorld, { type: "recover_party" });

    expect(recovered.partyGold).toBeLessThan(injured.partyGold);
    expect(recovered.party[0].hp).toBe(recovered.party[0].maxHp);
    expect(recovered.party[0].injury).toBeUndefined();
    expect(blocked.party[0].hp).toBe(injured.party[0].hp);
    expect(blocked.log.at(-1)?.text).toMatch(/cannot afford/i);
  });
});
