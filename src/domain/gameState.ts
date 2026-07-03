import type { Character, GameState } from "./types";
import { appendEventLogs } from "./replayLog";

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
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Character name is required.");
  }

  return {
    id: crypto.randomUUID(),
    name: trimmedName,
    notes: input.notes.trim(),
    portraitRef: input.portraitRef,
    row: "front",
    hp: 12,
    maxHp: 12,
    attack: 4,
    damageMin: 3,
    damageMax: 5,
    accuracy: 80,
    armor: 1,
    speed: 8,
    xp: 0,
    gold: 0,
    status: [],
    injury: undefined
  };
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
