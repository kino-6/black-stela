import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { createInventoryItemFromCatalog } from "../src/domain/economy";
import { carriedQuantity, getQuestProgress, questBoardEntries, recordQuestKills } from "../src/domain/quests";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function townState(): GameState {
  const base = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Rook", classId: "warrior", seed: "q" }));
  return { ...base, phase: "town", inventory: [] };
}

// The quest board — content-authored bounties and delivery tithes (content/worlds/*/quests.md).
// A bounty tallies kills; a delivery hands over items. Both pay a reward that bypasses the XP
// falloff by construction (the reward XP never runs through the combat path).
describe("quest board", () => {
  it("the default world ships an authored, catalog-valid quest board", () => {
    expect(defaultWorld.quests.length).toBeGreaterThan(0);
    for (const quest of defaultWorld.quests) {
      if (quest.kind === "bounty") {
        expect(defaultWorld.enemies.some((enemy) => enemy.id === quest.targetEnemyId)).toBe(true);
      } else {
        expect(defaultWorld.items.some((item) => item.id === quest.targetItemId)).toBe(true);
      }
    }
  });

  it("accepting a quest moves it off the board and cannot be accepted twice", () => {
    const state = townState();
    const accepted = executeCommand(state, defaultWorld, { type: "accept_quest", questId: "quest.glimmer-hunt" });
    expect(getQuestProgress(accepted, "quest.glimmer-hunt")).toMatchObject({ status: "active", killCount: 0, claims: 0 });

    const again = executeCommand(accepted, defaultWorld, { type: "accept_quest", questId: "quest.glimmer-hunt" });
    expect(again.quests.filter((entry) => entry.questId === "quest.glimmer-hunt")).toHaveLength(1);
  });

  it("a bounty tallies the bodies of a defeated pack toward its target", () => {
    const state = executeCommand(townState(), defaultWorld, { type: "accept_quest", questId: "quest.cull-the-ash" });
    const credited = recordQuestKills(state.quests, defaultWorld, [
      { enemyId: "enemy.b1f.ash-slime", bodies: 3 },
      { enemyId: "enemy.b2f.hook-rat", bodies: 2 } // not this quest's target
    ]);
    expect(credited.find((entry) => entry.questId === "quest.cull-the-ash")?.killCount).toBe(3);
  });

  it("a met bounty pays gold + full XP to every member, then resets because it is repeatable", () => {
    let state = executeCommand(townState(), defaultWorld, { type: "accept_quest", questId: "quest.glimmer-hunt" }); // reward gold 40, xp 55, required 1
    state = { ...state, quests: state.quests.map((q) => ({ ...q, killCount: 1 })) };
    const goldBefore = state.partyGold;
    const xpBefore = state.party[0].xp;

    const claimed = executeCommand(state, defaultWorld, { type: "claim_quest", questId: "quest.glimmer-hunt" });
    expect(claimed.partyGold).toBe(goldBefore + 40);
    expect(claimed.party[0].xp).toBe(xpBefore + 55); // direct grant — full value, no falloff
    const progress = getQuestProgress(claimed, "quest.glimmer-hunt");
    expect(progress).toMatchObject({ status: "active", killCount: 0, claims: 1 }); // repeatable: ready to run again
  });

  it("a delivery reads carried items, and turning it in consumes them for the reward", () => {
    const shards = createInventoryItemFromCatalog(defaultWorld, "item.stela-shard", 3)!;
    let state: GameState = { ...townState(), inventory: [shards] };
    state = executeCommand(state, defaultWorld, { type: "accept_quest", questId: "quest.shard-tithe" }); // deliver 3

    // The board reflects the carried count as live progress.
    const ready = questBoardEntries(state, defaultWorld).find((entry) => entry.quest.id === "quest.shard-tithe");
    expect(ready?.status).toBe("ready");

    const claimed = executeCommand(state, defaultWorld, { type: "claim_quest", questId: "quest.shard-tithe" });
    expect(carriedQuantity(claimed, "item.stela-shard")).toBe(0); // handed over
    expect(carriedQuantity(claimed, "item.emberwit-ash")).toBe(1); // reward item received
    expect(claimed.partyGold).toBe(state.partyGold + 30);
  });

  it("a quest cannot be claimed before its objective is met", () => {
    const state = executeCommand(townState(), defaultWorld, { type: "accept_quest", questId: "quest.cull-the-ash" }); // needs 5 kills
    const noReward = executeCommand(state, defaultWorld, { type: "claim_quest", questId: "quest.cull-the-ash" });
    expect(noReward.partyGold).toBe(state.partyGold);
    expect(getQuestProgress(noReward, "quest.cull-the-ash")?.claims).toBe(0);
  });

  it("quests can only be accepted from town, not mid-dungeon", () => {
    const inDungeon: GameState = { ...townState(), phase: "dungeon" };
    const after = executeCommand(inDungeon, defaultWorld, { type: "accept_quest", questId: "quest.glimmer-hunt" });
    expect(getQuestProgress(after, "quest.glimmer-hunt")).toBeUndefined();
  });
});
