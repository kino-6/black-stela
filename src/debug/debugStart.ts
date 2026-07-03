import { appendLog } from "../domain/gameState";
import { getRoom } from "../domain/scenario";
import type { Character, Direction, GameState, ScenarioWorld } from "../domain/types";

export type DebugProgress = "ready" | "after_encounter" | "clear_ready";

const debugProgressValues: DebugProgress[] = ["ready", "after_encounter", "clear_ready"];

export function parseDebugProgress(value: string | null): DebugProgress {
  return debugProgressValues.includes(value as DebugProgress) ? (value as DebugProgress) : "ready";
}

export function createDebugStateFromProgress(world: ScenarioWorld, progress: DebugProgress): GameState {
  const party = createExpectedParty();
  const base: GameState = {
    phase: "town",
    party,
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

  if (progress === "ready") {
    return {
      ...base,
      log: appendLog(base, "Debug start: expected party assembled in town.", ["debug"])
    };
  }

  if (progress === "after_encounter") {
    const state: GameState = {
      ...base,
      phase: "dungeon",
      position: { roomId: "room.b1f.002", facing: "east" },
      defeatedEnemies: ["enemy.b1f.ash-slime"],
      resolvedTraps: ["trap.b1f.needle"],
      discoveredSecrets: ["trap.b1f.needle"],
      map: createMapState(world, ["room.b1f.001", "room.b1f.002"]),
      turn: 4
    };

    return {
      ...state,
      log: appendLog(state, "Debug start: party has beaten the first encounter and faces deeper east.", ["debug"])
    };
  }

  const state: GameState = {
    ...base,
    phase: "dungeon",
    position: { roomId: "room.b1f.003", facing: "east" },
    defeatedEnemies: ["enemy.b1f.ash-slime"],
    resolvedTraps: ["trap.b1f.needle"],
    discoveredSecrets: ["trap.b1f.needle"],
    map: createMapState(world, ["room.b1f.001", "room.b1f.002", "room.b1f.003"]),
    turn: 5
  };

  return {
    ...state,
    log: appendLog(state, "Debug start: party stands at the return marker with full map progress.", ["debug"])
  };
}

export function createMapState(world: ScenarioWorld, visitedRooms: string[]) {
  return {
    visitedRooms,
    knownExits: Object.fromEntries(
      visitedRooms.map((roomId) => {
        const room = getRoom(world, roomId);
        return [roomId, Object.keys(room.exits) as Direction[]];
      })
    )
  };
}

function createExpectedParty(): Character[] {
  return [
    {
      id: "debug.mira",
      name: "Mira",
      notes: "Mapper. Tracks visited rooms and return routes.",
      portraitRef: "debug://portrait/mira",
      hp: 12,
      maxHp: 12,
      attack: 4
    },
    {
      id: "debug.sei",
      name: "Sei",
      notes: "Lamp bearer. Keeps the party calm in fixed events.",
      portraitRef: "debug://portrait/sei",
      hp: 11,
      maxHp: 11,
      attack: 3
    },
    {
      id: "debug.rook",
      name: "Rook",
      notes: "Front line. Tests recovery instead of irreversible loss.",
      portraitRef: "debug://portrait/rook",
      hp: 14,
      maxHp: 14,
      attack: 5
    },
    {
      id: "debug.vale",
      name: "Vale",
      notes: "Scout. Represents search and trap progress.",
      portraitRef: "debug://portrait/vale",
      hp: 10,
      maxHp: 10,
      attack: 3
    }
  ];
}
