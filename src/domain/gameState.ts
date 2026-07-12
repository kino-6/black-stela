import type { Character, GameState } from "./types";
import { appendEventLogs } from "./replayLog";
import { createLegacyGuildCharacter, PARTY_SIZE_LIMIT } from "./characterCreation";
import { STARTING_PARTY_GOLD } from "./economy";

export function createInitialGameState(): GameState {
  return {
    phase: "town",
    party: [],
    reserve: [],
    retired: [],
    position: null,
    combat: null,
    defeatedEnemies: [],
    floorClearedEnemies: [],
    stepsSinceEncounter: 0,
    resolvedTraps: [],
    discoveredSecrets: [],
    inventory: [
      {
        id: "item.healing-draught",
        name: "Healing Draught",
        kind: "healing",
        quantity: 1,
        healAmount: 6
      }
    ],
    partyGold: STARTING_PARTY_GOLD,
    claimedTreasures: [],
    floorClaimedTreasures: [],
    map: {
      floorId: null,
      currentRoomId: null,
      currentCellId: null,
      currentFacing: null,
      visitedRooms: [],
      visitedCells: [],
      knownExits: {},
      blockedExits: {},
      secretCandidates: {}
    },
    log: [],
    turn: 0,
    aiEnabled: true
  };
}

export function createCharacter(input: { name: string; notes: string; portraitRef?: string }): Character {
  return createLegacyGuildCharacter(input);
}

export function addCharacter(state: GameState, character: Character): GameState {
  if (state.party.length >= PARTY_SIZE_LIMIT) {
    return state;
  }

  const next = {
    ...state,
    party: [...state.party, character]
  };

  return {
    ...next,
    log: appendEventLogs(next, [
      {
        type: "party_member_joined",
        characterId: character.id,
        characterName: character.name
      }
    ])
  };
}

export function appendLog(state: GameState, text: string, tags: string[]) {
  return [
    ...state.log,
    {
      id: crypto.randomUUID(),
      turn: state.turn,
      text,
      tags
    }
  ];
}
