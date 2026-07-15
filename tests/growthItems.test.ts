import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { createInventoryItemFromCatalog } from "../src/domain/economy";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function townWithItem(itemId: string): GameState {
  const base = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "grow" }));
  const item = createInventoryItemFromCatalog(defaultWorld, itemId, 1)!;
  return { ...base, phase: "town", inventory: [item] };
}

// Growth items — the player's earned edge, which the XP falloff deliberately does NOT punish
// ("成長アイテムでの稼ぎはOK"). A stat-up raises the member permanently; an XP grant is applied
// DIRECTLY (never through the combat-reward path), so the out-levelling falloff cannot touch it.
describe("growth items", () => {
  it("a stat-up tonic permanently raises the target and is consumed", () => {
    const state = townWithItem("item.ashroot-tonic"); // grants { maxHp: 6 }
    const target = state.party[0];
    const before = target.maxHp;

    const after = executeCommand(state, defaultWorld, { type: "use_item", itemId: "item.ashroot-tonic", targetCharacterId: target.id });
    const grown = after.party[0];
    expect(grown.maxHp).toBe(before + 6);
    expect(grown.hp).toBeGreaterThan(target.hp); // the new HP is usable at once
    expect(after.inventory.find((i) => i.id === "item.ashroot-tonic")?.quantity ?? 0).toBe(0);
  });

  it("a wit ash raises the aptitude that actually drives spell power/land-rate", () => {
    const state = townWithItem("item.emberwit-ash"); // grants { wit: 1 }
    const target = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "use_item", itemId: "item.emberwit-ash", targetCharacterId: target.id });
    expect(after.party[0].aptitude.wit).toBe(target.aptitude.wit + 1);
  });

  it("an XP deed grants XP directly — full value, bypassing the out-levelling falloff", () => {
    const state = townWithItem("item.deed-of-passage"); // grants { xp: 60 }
    const target = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "use_item", itemId: "item.deed-of-passage", targetCharacterId: target.id });
    // The whole 60 lands (a combat kill would have been trimmed once you out-level the enemy).
    expect(after.party[0].xp).toBe(target.xp + 60);
    expect(after.party[0].level).toBeGreaterThanOrEqual(target.level); // and it may level them up
  });

  it("cannot be used in combat", () => {
    const state = { ...townWithItem("item.ashroot-tonic"), phase: "combat" as const };
    const after = executeCommand(state, defaultWorld, { type: "use_item", itemId: "item.ashroot-tonic", targetCharacterId: state.party[0].id });
    expect(after.party[0].maxHp).toBe(state.party[0].maxHp); // no change
  });
});
