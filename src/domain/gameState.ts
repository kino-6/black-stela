import type { Character, GameState } from "./types";

export function createInitialGameState(): GameState {
  return {
    phase: "town",
    party: [],
    position: null,
    combat: null,
    defeatedEnemies: [],
    resolvedTraps: [],
    discoveredSecrets: [],
    map: {
      visitedRooms: [],
      knownExits: {}
    },
    log: [],
    turn: 0,
    aiEnabled: false
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
    hp: 12,
    maxHp: 12,
    attack: 4
  };
}

export function addCharacter(state: GameState, character: Character): GameState {
  return {
    ...state,
    party: [...state.party, character],
    log: appendLog(state, `${character.name} joined the roster.`, ["party"])
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
