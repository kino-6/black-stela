import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createInventoryItemFromCatalog } from "../src/domain/economy";
import { executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { CombatStatus, GameState } from "../src/domain/types";

// New consumables (schema expansion): cure removes ailments, focus restores 気力.
function stateWith(itemId: string, patch: (member: GameState["party"][number]) => GameState["party"][number]): GameState {
  const base = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Sei", classId: "priest", seed: "cons" }));
  const item = createInventoryItemFromCatalog(defaultWorld, itemId, 1)!;
  return { ...base, party: base.party.map(patch), inventory: [...base.inventory, item] };
}

describe("consumables", () => {
  it("an antidote cures poison and is consumed", () => {
    const poisoned = stateWith("item.antidote", (m) => ({ ...m, status: ["poison"] as CombatStatus[] }));
    const target = poisoned.party[0];
    const after = executeCommand(poisoned, defaultWorld, { type: "use_item", itemId: "item.antidote", targetCharacterId: target.id });
    expect(after.party[0].status ?? []).not.toContain("poison");
    expect(after.inventory.find((i) => i.id === "item.antidote")?.quantity ?? 0).toBe(0);
  });

  it("a calm draught clears both fear and sleep", () => {
    const afraid = stateWith("item.calm-draught", (m) => ({ ...m, status: ["fear", "sleep"] as CombatStatus[] }));
    const target = afraid.party[0];
    const after = executeCommand(afraid, defaultWorld, { type: "use_item", itemId: "item.calm-draught", targetCharacterId: target.id });
    expect(after.party[0].status ?? []).toEqual([]);
  });

  it("a spirit tonic restores 気力 (MP), capped at max", () => {
    const drained = stateWith("item.spirit-tonic", (m) => ({ ...m, mp: 0 }));
    const target = drained.party[0];
    const after = executeCommand(drained, defaultWorld, { type: "use_item", itemId: "item.spirit-tonic", targetCharacterId: target.id });
    expect(after.party[0].mp).toBeGreaterThan(0);
    expect(after.party[0].mp).toBeLessThanOrEqual(after.party[0].maxMp);
  });

  it("does not spend an out-of-combat remedy that cannot help its selected target", () => {
    const full = stateWith("item.healing-draught", (m) => ({ ...m, hp: m.maxHp }));
    const target = full.party[0];
    const after = executeCommand(full, defaultWorld, { type: "use_item", itemId: "item.healing-draught", targetCharacterId: target.id });

    expect(after).toBe(full);
    expect(after.inventory.find((item) => item.id === "item.healing-draught")?.quantity).toBe(1);
  });

  it("does not spend a cure when the selected member lacks its named condition", () => {
    const healthy = stateWith("item.antidote", (m) => ({ ...m, status: [] }));
    const target = healthy.party[0];
    const after = executeCommand(healthy, defaultWorld, { type: "use_item", itemId: "item.antidote", targetCharacterId: target.id });

    expect(after).toBe(healthy);
    expect(after.inventory.find((item) => item.id === "item.antidote")?.quantity).toBe(1);
  });
});
