import type { Character, GameState } from "./types";
import { appendEventLogs } from "./replayLog";
import { createLegacyGuildCharacter } from "./characterCreation";

export function createInitialGameState(): GameState {
  return {
    phase: "town",
    party: [],
    position: null,
    combat: null,
    defeatedEnemies: [],
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
    map: {
      floorId: null,
      currentRoomId: null,
      currentFacing: null,
      visitedRooms: [],
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
