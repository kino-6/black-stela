import { noChange, withEvents } from "../commandResult";
import type { CommandResult } from "../commandResult";
import { applyLevelUps } from "../leveling";
import { addInventoryItem, createInventoryItemFromCatalog, removeInventoryItem } from "../economy";
import { findQuest, getQuestProgress, isQuestReadyToClaim } from "../quests";
import type { GameEvent, GameState, ScenarioWorld } from "../types";

// The quest board commands — accept a bounty/delivery and claim its reward. Extracted from rulesEngine
// as one cohesive group; both are town-only. Reward XP is granted directly to each member, so — like a
// growth item's xp — it never runs through the out-levelling falloff.

export function acceptQuest(state: GameState, world: ScenarioWorld, questId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const quest = findQuest(world, questId);
  if (!quest || getQuestProgress(state, questId)) {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    quests: [...state.quests, { questId, status: "active", killCount: 0, claims: 0 }],
    turn: state.turn + 1
  };
  return withEvents(next, [{ type: "quest_accepted", questId, questName: quest.name }]);
}

// Turn a met quest in for its reward. A bounty must have tallied enough kills; a delivery must be
// carrying enough of its target item (which it hands over). Gold and item rewards land in the
// party's purse/pack; an XP reward is granted DIRECTLY to each active member, so — like a growth
// item's xp — it never runs through the out-levelling falloff. A repeatable quest resets to active
// for another run; a one-shot is marked done.
export function claimQuest(state: GameState, world: ScenarioWorld, questId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const quest = findQuest(world, questId);
  const progress = getQuestProgress(state, questId);
  if (!quest || !progress || !isQuestReadyToClaim(state, quest, progress)) {
    return noChange(state);
  }

  const levelEvents: GameEvent[] = [];
  const xpGrant = quest.reward.xp ?? 0;
  const party = state.party.map((member) => {
    if (xpGrant <= 0) {
      return member;
    }
    const leveled = applyLevelUps({ ...member, xp: member.xp + xpGrant });
    levelEvents.push(...leveled.events);
    return leveled.character;
  });

  // A delivery consumes the items it hands over.
  let inventory = state.inventory;
  if (quest.kind === "delivery" && quest.targetItemId) {
    inventory = removeInventoryItem(inventory, quest.targetItemId, quest.requiredCount);
  }
  // An item reward drops into the pack.
  let rewardItemName: string | undefined;
  if (quest.reward.itemId) {
    const rewardItem = createInventoryItemFromCatalog(world, quest.reward.itemId, quest.reward.itemQuantity ?? 1);
    if (rewardItem) {
      inventory = addInventoryItem(inventory, rewardItem);
      rewardItemName = rewardItem.name;
    }
  }

  const claimedProgress = {
    ...progress,
    claims: progress.claims + 1,
    killCount: 0,
    status: quest.repeatable ? ("active" as const) : ("done" as const)
  };

  const next: GameState = {
    ...state,
    party,
    partyGold: state.partyGold + (quest.reward.gold ?? 0),
    inventory,
    quests: state.quests.map((entry) => (entry.questId === questId ? claimedProgress : entry)),
    turn: state.turn + 1
  };
  return withEvents(next, [
    {
      type: "quest_claimed",
      questId,
      questName: quest.name,
      gold: quest.reward.gold ?? 0,
      xp: xpGrant,
      itemName: rewardItemName
    },
    ...levelEvents
  ]);
}
