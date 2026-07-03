import { appendEventLogs } from "../domain/replayLog";
import { getRoom } from "../domain/scenario";
import type { Character, Direction, GameState, ScenarioWorld } from "../domain/types";

export type DebugProgress =
  | "ready"
  | "after_encounter"
  | "clear_ready"
  | "floor_2"
  | "floor_3"
  | "floor_4"
  | "floor_5"
  | "floor_6"
  | "floor_7"
  | "floor_8";

export const debugProgressValues: DebugProgress[] = [
  "ready",
  "after_encounter",
  "clear_ready",
  "floor_2",
  "floor_3",
  "floor_4",
  "floor_5",
  "floor_6",
  "floor_7",
  "floor_8"
];

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
    aiEnabled: false
  };

  if (progress === "ready") {
    return {
      ...base,
      log: appendEventLogs(base, [{ type: "debug_started", text: "Debug start: expected party assembled in town." }])
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
      log: appendEventLogs(state, [
        { type: "debug_started", text: "Debug start: party has beaten the first encounter and faces deeper east." }
      ])
    };
  }

  if (progress.startsWith("floor_")) {
    return createFloorDebugState(base, world, progress);
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
    log: appendEventLogs(state, [
      { type: "debug_started", text: "Debug start: party stands at the return marker with full map progress." }
    ])
  };
}

function createFloorDebugState(base: GameState, world: ScenarioWorld, progress: DebugProgress): GameState {
  const floorNumber = Number(progress.replace("floor_", ""));
  const roomId = `room.b${floorNumber}f.001`;
  const visitedRooms = createVisitedPathToFloor(floorNumber);
  const state: GameState = {
    ...base,
    phase: "dungeon",
    position: { roomId, facing: "east" },
    defeatedEnemies: ["enemy.b1f.ash-slime"],
    resolvedTraps: ["trap.b1f.needle"],
    discoveredSecrets: ["trap.b1f.needle"],
    inventory: [
      ...base.inventory,
      {
        id: "item.lantern-oil",
        name: "Lantern Oil",
        kind: "utility",
        quantity: 1
      }
    ],
    map: createMapState(world, visitedRooms),
    turn: 5 + floorNumber
  };

  return {
    ...state,
    log: appendEventLogs(state, [
      { type: "debug_started", text: `Debug start: party begins checks on B${floorNumber}F.` }
    ])
  };
}

function createVisitedPathToFloor(floorNumber: number) {
  const visited = ["room.b1f.001", "room.b1f.002", "room.b1f.003"];
  for (let floor = 2; floor <= floorNumber; floor += 1) {
    visited.push(`room.b${floor}f.001`);
  }

  return visited;
}

export function createMapState(world: ScenarioWorld, visitedRooms: string[]) {
  const currentRoomId = visitedRooms.at(-1) ?? null;
  const floorId = currentRoomId ? getFloorIdForRoom(world, currentRoomId) : null;

  return {
    floorId,
    currentRoomId,
    currentFacing: "east" as Direction,
    visitedRooms,
    knownExits: Object.fromEntries(
      visitedRooms.map((roomId) => {
        const room = getRoom(world, roomId);
        return [roomId, Object.keys(room.exits) as Direction[]];
      })
    ),
    blockedExits: {},
    secretCandidates: {}
  };
}

function getFloorIdForRoom(world: ScenarioWorld, roomId: string) {
  return world.dungeons.find((dungeon) => dungeon.rooms.some((room) => room.id === roomId))?.id ?? null;
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
      attack: 4,
      injury: undefined
    },
    {
      id: "debug.sei",
      name: "Sei",
      notes: "Lamp bearer. Keeps the party calm in fixed events.",
      portraitRef: "debug://portrait/sei",
      hp: 11,
      maxHp: 11,
      attack: 3,
      injury: undefined
    },
    {
      id: "debug.rook",
      name: "Rook",
      notes: "Front line. Tests recovery instead of irreversible loss.",
      portraitRef: "debug://portrait/rook",
      hp: 14,
      maxHp: 14,
      attack: 5,
      injury: undefined
    },
    {
      id: "debug.vale",
      name: "Vale",
      notes: "Scout. Represents search and trap progress.",
      portraitRef: "debug://portrait/vale",
      hp: 10,
      maxHp: 10,
      attack: 3,
      injury: undefined
    }
  ];
}
