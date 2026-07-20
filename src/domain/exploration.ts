import type { Character, GameState, InventoryItem } from "./types";
import { classProficiency, proficiencyBonus, type ExplorationAction, type Proficiency } from "./classCapabilities";
import { trapSkill } from "./chests";

/**
 * WHO TRIED, AND WITH WHAT — the resolution layer for exploration attempts.
 *
 * docs/design/class-system.md §8.2 and §7: "rules should model the action, not ask whether a class id has
 * permission… The chest command must identify the acting adventurer so the player sees who took the risk.
 * Auto-selecting a hidden 'best handler' is not a substitute for class identity."
 *
 * That is exactly what the chest commands did: `selectTrapHandler` quietly scanned the party, picked the
 * highest score, and the player learned who had acted only from a name in the log line — after the fact,
 * with no way to send someone else. A thief's identity cannot be felt if the game plays the thief for you.
 *
 * So an attempt now names its actor. The command may DECLARE one; if it does not, the automatic pick is
 * still made (nothing already saved or already scripted breaks) but the choice is REPORTED as automatic
 * rather than passed off as the player's. Every attempt resolves to a record — actor, action, proficiency,
 * difficulty band, item consumed — which is what the typed events carry.
 *
 * Three ways to attempt anything, always (§2.3, §4):
 *   - a SPECIALIST, safely and at high difficulty
 *   - anyone else UNTRAINED, at worse odds — never a refusal
 *   - an ITEM, which buys a better attempt for a consumable
 */

export type ActorSelection = "declared" | "automatic";

/**
 * The difficulty band an attempt was made against. The player is told which wall they hit, without being
 * shown a percentage — a DRPG tells you "that lock is beyond you", not "31%".
 */
export type DifficultyBand = "routine" | "tricky" | "severe" | "deadly";

export function difficultyBand(difficulty: number): DifficultyBand {
  if (difficulty <= 8) return "routine";
  if (difficulty <= 14) return "tricky";
  if (difficulty <= 20) return "severe";
  return "deadly";
}

/** An item that helps with an exploration action, consumed in the attempt (§4: items are valid answers). */
export interface ExplorationAid {
  itemId: string;
  /** Which actions it helps with; an aid offered for the wrong action is refused, not silently wasted. */
  actions: ExplorationAction[];
  bonus: number;
}

export interface AttemptRequest {
  action: ExplorationAction;
  difficulty: number;
  /** The adventurer the player sent. Absent = the old automatic pick, reported as such. */
  declaredActorId?: string;
  /** An aid the player spent on this attempt. */
  itemId?: string;
}

export interface AttemptRecord {
  action: ExplorationAction;
  actorId: string | null;
  actorName: string | null;
  selection: ActorSelection;
  proficiency: Proficiency;
  /** The check's total, before the roll — level, aptitude, proficiency, and any aid. */
  skill: number;
  difficulty: number;
  band: DifficultyBand;
  itemConsumed?: string;
}

/** Anyone standing and unhurt enough to act. Being untrained never disqualifies you. */
export function ableMembers(party: Character[]): Character[] {
  return party.filter((member) => member.hp > 0 && !member.injury);
}

/**
 * The adventurer who will make the attempt. A declared actor is used if they can act at all — including
 * an untrained one, because sending the wrong person is a decision the player is allowed to make, and
 * the outcome is how they learn it. Only an absent or incapacitated declaration falls back.
 */
export function resolveActor(
  party: Character[],
  declaredActorId: string | undefined
): { actor: Character | null; selection: ActorSelection; declarationHonoured: boolean } {
  const able = ableMembers(party);
  if (declaredActorId) {
    const declared = able.find((member) => member.id === declaredActorId);
    if (declared) {
      return { actor: declared, selection: "declared", declarationHonoured: true };
    }
    // Named someone who cannot act: the command is refused rather than quietly handed to someone else.
    return { actor: null, selection: "declared", declarationHonoured: false };
  }
  if (able.length === 0) {
    return { actor: null, selection: "automatic", declarationHonoured: true };
  }
  // The legacy automatic pick, unchanged in outcome — but now reported as automatic.
  const best = able.reduce((leader, member) => (trapSkill(member) > trapSkill(leader) ? member : leader), able[0]);
  return { actor: best, selection: "automatic", declarationHonoured: true };
}

/** The aid an item offers, if the party actually holds it and it applies to this action. */
export function findAid(
  inventory: InventoryItem[],
  aids: ExplorationAid[],
  itemId: string | undefined,
  action: ExplorationAction
): ExplorationAid | null {
  if (!itemId) {
    return null;
  }
  const held = inventory.find((item) => item.id === itemId && item.quantity > 0);
  if (!held) {
    return null;
  }
  return aids.find((aid) => aid.itemId === itemId && aid.actions.includes(action)) ?? null;
}

/**
 * Resolve one attempt into the record the event will carry. The SKILL is the same number the chest checks
 * have always used (level, agility, wit, luck, and the class's proficiency) plus any aid — so an attempt
 * made by the automatically-picked specialist scores exactly what it scored before.
 */
export function resolveAttempt(
  state: Pick<GameState, "party" | "inventory">,
  request: AttemptRequest,
  aids: ExplorationAid[] = []
): { record: AttemptRecord; aid: ExplorationAid | null; refused: "actor_unavailable" | null } {
  const { actor, selection, declarationHonoured } = resolveActor(state.party, request.declaredActorId);
  if (!declarationHonoured) {
    return {
      record: {
        action: request.action,
        actorId: request.declaredActorId ?? null,
        actorName: null,
        selection,
        proficiency: "untrained",
        skill: 0,
        difficulty: request.difficulty,
        band: difficultyBand(request.difficulty)
      },
      aid: null,
      refused: "actor_unavailable"
    };
  }

  const aid = findAid(state.inventory, aids, request.itemId, request.action);
  const proficiency = actor ? classProficiency(actor.classId, request.action) : "untrained";
  const skill = (actor ? trapSkill(actor) : 0) + (aid?.bonus ?? 0);

  return {
    record: {
      action: request.action,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      selection,
      proficiency,
      skill,
      difficulty: request.difficulty,
      band: difficultyBand(request.difficulty),
      ...(aid ? { itemConsumed: aid.itemId } : {})
    },
    aid,
    refused: null
  };
}

/** Spend one of an aid item — attempts consume what they use, win or lose. */
export function consumeAid(inventory: InventoryItem[], itemId: string): InventoryItem[] {
  return inventory
    .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);
}

/** The proficiency bonus already folded into `skill`, exposed so a UI can explain the number. */
export function proficiencyContribution(proficiency: Proficiency): number {
  return proficiencyBonus(proficiency);
}
