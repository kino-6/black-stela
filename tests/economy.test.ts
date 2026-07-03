import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { executeCommand } from "../src/domain/rulesEngine";

function stateWithParty() {
  return addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" }));
}

describe("economy and equipment", () => {
  it("starts with shared party gold and collects room treasure once", () => {
    const state = stateWithParty();
    const entered = executeCommand(state, defaultWorld, { type: "enter_dungeon" });
    const enteredAgain = executeCommand(entered, defaultWorld, { type: "turn_right" });

    expect(state.partyGold).toBeGreaterThan(0);
    expect(entered.inventory.find((item) => item.id === "item.healing-draught")?.quantity).toBe(2);
    expect(entered.claimedTreasures).toContain("room.b1f.001");
    expect(enteredAgain.inventory.find((item) => item.id === "item.healing-draught")?.quantity).toBe(2);
    expect(entered.log.at(-1)?.text).toContain("Healing Draught");
  });

  it("buys equipment from town and equips it without changing base character identity", () => {
    const state = stateWithParty();
    const bought = executeCommand(state, defaultWorld, {
      type: "buy_item",
      shopId: "shop.stela-general",
      itemId: "equip.iron-knife"
    });
    const equipped = executeCommand(bought, defaultWorld, {
      type: "equip_item",
      characterId: bought.party[0].id,
      equipmentId: "equip.iron-knife"
    });

    expect(bought.partyGold).toBe(state.partyGold - 40);
    expect(bought.inventory.find((item) => item.id === "equip.iron-knife")?.quantity).toBe(1);
    expect(equipped.party[0].equipment.weapon).toBe("equip.iron-knife");
    expect(getEffectiveCharacterStats(equipped.party[0], defaultWorld).damageMax).toBe(
      state.party[0].damageMax + 1
    );

    const sellEquipped = executeCommand(equipped, defaultWorld, { type: "sell_item", itemId: "equip.iron-knife" });
    expect(sellEquipped.partyGold).toBe(equipped.partyGold);
    expect(sellEquipped.party[0].equipment.weapon).toBe("equip.iron-knife");
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
