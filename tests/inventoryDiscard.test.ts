import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress } from "../src/debug/debugStart";
import { executeCommand } from "../src/domain/rulesEngine";

describe("party-menu discard", () => {
  it("discards one ordinary carried item outside combat", () => {
    const state = createDebugStateFromProgress(defaultWorld, "ready");
    const item = state.inventory.find((candidate) => candidate.kind === "healing")!;
    const after = executeCommand(state, defaultWorld, { type: "discard_item", itemId: item.id });

    expect(after.inventory.find((candidate) => candidate.id === item.id)?.quantity ?? 0).toBe(item.quantity - 1);
    expect(after.log.at(-1)?.event?.type).toBe("item_discarded");
  });

  it("does not discard keys, treasure, or return items", () => {
    const state = {
      ...createDebugStateFromProgress(defaultWorld, "ready"),
      inventory: [
        { id: "item.ashen-key", name: "Ashen Key", kind: "key" as const, quantity: 1 },
        { id: "item.stela-shard", name: "Stela Shard", kind: "treasure" as const, quantity: 1 },
        { id: "item.return-charm", name: "Return Charm", kind: "escape" as const, quantity: 1 }
      ]
    };

    for (const item of state.inventory) {
      const after = executeCommand(state, defaultWorld, { type: "discard_item", itemId: item.id });
      expect(after.inventory).toEqual(state.inventory);
    }
  });

  it("discards only equipment copies not currently worn", () => {
    const base = createDebugStateFromProgress(defaultWorld, "ready");
    const equipmentId = "equip.focus-band";
    const owner = base.party.find((member) => ["mender", "occultist"].includes(member.classId))!;
    const state = {
      ...base,
      inventory: [...base.inventory, { id: equipmentId, name: "Focus Band", kind: "equipment" as const, quantity: 2 }]
    };
    const equipped = executeCommand(state, defaultWorld, { type: "equip_item", characterId: owner.id, equipmentId });
    const afterOneDiscard = executeCommand(equipped, defaultWorld, { type: "discard_item", itemId: equipmentId });
    const blockedAtEquippedCount = executeCommand(afterOneDiscard, defaultWorld, { type: "discard_item", itemId: equipmentId });

    expect(afterOneDiscard.inventory.find((item) => item.id === equipmentId)?.quantity).toBe(1);
    expect(blockedAtEquippedCount.inventory).toEqual(afterOneDiscard.inventory);
    expect(blockedAtEquippedCount.party.find((member) => member.id === owner.id)?.equipment.accessory?.id).toBe(equipmentId);
  });

  it("swaps one front and back member without flattening the 3+3 formation", () => {
    const state = createDebugStateFromProgress(defaultWorld, "ready");
    const front = state.party.find((member) => member.row === "front")!;
    const back = state.party.find((member) => member.row === "back")!;
    const after = executeCommand(state, defaultWorld, {
      type: "swap_member_rows",
      characterId: front.id,
      targetCharacterId: back.id
    });

    expect(after.party.find((member) => member.id === front.id)?.row).toBe("back");
    expect(after.party.find((member) => member.id === back.id)?.row).toBe("front");
    expect(after.party.filter((member) => member.row === "front")).toHaveLength(3);
    expect(after.party.filter((member) => member.row === "back")).toHaveLength(3);
  });

  it("moves a unique equipment instance instead of letting two members share it", () => {
    const base = createDebugStateFromProgress(defaultWorld, "ready");
    const equipmentId = "equip.focus-band";
    const owners = base.party.filter((member) => ["mender", "occultist"].includes(member.classId));
    const state = {
      ...base,
      inventory: [...base.inventory, { id: equipmentId, name: "Focus Band", kind: "equipment" as const, quantity: 1 }]
    };
    const first = executeCommand(state, defaultWorld, {
      type: "equip_item",
      characterId: owners[0].id,
      equipmentId
    });
    const second = executeCommand(first, defaultWorld, {
      type: "equip_item",
      characterId: owners[1].id,
      equipmentId
    });

    expect(first.party.find((member) => member.id === owners[0].id)?.equipment.accessory?.id).toBe(equipmentId);
    expect(second.party.find((member) => member.id === owners[0].id)?.equipment.accessory?.id).not.toBe(equipmentId);
    expect(second.party.find((member) => member.id === owners[1].id)?.equipment.accessory?.id).toBe(equipmentId);
  });

  it("allows two members to equip an equipment stack that actually contains two copies", () => {
    const base = createDebugStateFromProgress(defaultWorld, "ready");
    const equipmentId = "equip.focus-band";
    const owners = base.party.filter((member) => ["mender", "occultist"].includes(member.classId));
    const state = {
      ...base,
      inventory: [...base.inventory, { id: equipmentId, name: "Focus Band", kind: "equipment" as const, quantity: 2 }]
    };
    const first = executeCommand(state, defaultWorld, { type: "equip_item", characterId: owners[0].id, equipmentId });
    const second = executeCommand(first, defaultWorld, { type: "equip_item", characterId: owners[1].id, equipmentId });

    expect(second.party.filter((member) => member.equipment.accessory?.id === equipmentId)).toHaveLength(2);
  });
});
