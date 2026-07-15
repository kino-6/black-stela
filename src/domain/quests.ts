// Quest board — pure, save-safe helpers. A quest is authored content (content/worlds/<id>/
// quests.md); the per-run record on GameState.quests only tracks whether the party has accepted
// it and how far along they are. Reward application (gold/XP/item + inventory turn-in) lives in
// rulesEngine, next to the catalog and levelling helpers it needs; only the state-reading logic
// is here so it can be unit-tested without the whole engine.
import type { GameState, QuestProgress, ScenarioQuest, ScenarioWorld } from "./types";

export type QuestBoardStatus = "available" | "active" | "ready" | "done";

export interface QuestBoardEntry {
  quest: ScenarioQuest;
  /** available = still on the board; active = accepted, not yet met; ready = objective met and
   *  claimable; done = a non-repeatable quest already claimed. */
  status: QuestBoardStatus;
  /** Objective progress: bounty kills tallied, or delivery items currently carried (clamped to required). */
  count: number;
  required: number;
  /** How many times its reward has already been claimed (repeatable quests grow this). */
  claims: number;
}

export function findQuest(world: ScenarioWorld, questId: string): ScenarioQuest | undefined {
  return world.quests.find((quest) => quest.id === questId);
}

export function getQuestProgress(state: GameState, questId: string): QuestProgress | undefined {
  return state.quests.find((entry) => entry.questId === questId);
}

/** Total quantity of an item the party currently carries (summed across stacks). */
export function carriedQuantity(state: GameState, itemId: string): number {
  return state.inventory.filter((item) => item.id === itemId).reduce((total, item) => total + item.quantity, 0);
}

/** Live objective progress: a bounty reads its stored kill tally; a delivery reads the party's
 *  current inventory (so picking up or spending the target item updates the board immediately). */
export function currentObjectiveCount(
  state: GameState,
  quest: ScenarioQuest,
  progress: QuestProgress | undefined
): number {
  if (quest.kind === "delivery") {
    return quest.targetItemId ? carriedQuantity(state, quest.targetItemId) : 0;
  }
  return progress?.killCount ?? 0;
}

export function isQuestReadyToClaim(
  state: GameState,
  quest: ScenarioQuest,
  progress: QuestProgress | undefined
): boolean {
  return (
    Boolean(progress) &&
    progress!.status === "active" &&
    currentObjectiveCount(state, quest, progress) >= quest.requiredCount
  );
}

export function questBoardEntries(state: GameState, world: ScenarioWorld): QuestBoardEntry[] {
  return world.quests.map((quest) => {
    const progress = getQuestProgress(state, quest.id);
    const rawCount = currentObjectiveCount(state, quest, progress);
    let status: QuestBoardStatus;
    if (!progress) {
      status = "available";
    } else if (progress.status === "done") {
      status = "done";
    } else if (rawCount >= quest.requiredCount) {
      status = "ready";
    } else {
      status = "active";
    }
    return {
      quest,
      status,
      count: Math.min(rawCount, quest.requiredCount),
      required: quest.requiredCount,
      claims: progress?.claims ?? 0
    };
  });
}

/** Credit bounty kills onto the accepted-quest record. `kills` is one entry per defeated enemy
 *  group; `bodies` is how many creatures that group held, so a pack of three counts as three. */
export function recordQuestKills(
  quests: QuestProgress[],
  world: ScenarioWorld,
  kills: { enemyId: string; bodies: number }[]
): QuestProgress[] {
  if (quests.length === 0 || kills.length === 0) {
    return quests;
  }
  const killsByEnemy = new Map<string, number>();
  for (const kill of kills) {
    killsByEnemy.set(kill.enemyId, (killsByEnemy.get(kill.enemyId) ?? 0) + Math.max(1, kill.bodies));
  }
  return quests.map((progress) => {
    if (progress.status !== "active") {
      return progress;
    }
    const quest = findQuest(world, progress.questId);
    if (!quest || quest.kind !== "bounty" || !quest.targetEnemyId) {
      return progress;
    }
    const credited = killsByEnemy.get(quest.targetEnemyId) ?? 0;
    return credited > 0 ? { ...progress, killCount: progress.killCount + credited } : progress;
  });
}
