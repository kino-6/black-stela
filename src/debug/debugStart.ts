import { appendEventLogs } from "../domain/replayLog";
import { getFloorIdForRoom, getGridCellForRoom, getKnownGridDirections } from "../domain/scenario";
import type { Character, Direction, GameState, ScenarioWorld } from "../domain/types";
import { createGuildCharacter } from "../domain/characterCreation";
import { STARTING_PARTY_GOLD } from "../domain/economy";

export type DebugProgress =
  | "ready"
  | "after_encounter"
  | "return_ready"
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
  "return_ready",
  "floor_2",
  "floor_3",
  "floor_4",
  "floor_5",
  "floor_6",
  "floor_7",
  "floor_8"
];

export function parseDebugProgress(value: string | null): DebugProgress {
  if (value === "clear_ready") {
    return "return_ready";
  }

  return debugProgressValues.includes(value as DebugProgress) ? (value as DebugProgress) : "ready";
}

export function createDebugStateFromProgress(world: ScenarioWorld, progress: DebugProgress): GameState {
  const party = createExpectedParty();
  const base: GameState = {
    phase: "town",
    party,
    reserve: [],
    retired: [],
    position: null,
    combat: null,
    defeatedEnemies: [],
    floorClearedEnemies: [],
    stepsSinceEncounter: 0,
    resolvedTraps: [],
    discoveredSecrets: [],
    partyGold: STARTING_PARTY_GOLD,
    claimedTreasures: [],
    floorClaimedTreasures: [],
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

  if (progress === "ready") {
    return {
      ...base,
      log: appendEventLogs(base, [{ type: "debug_started", text: "Debug start: expected party assembled in town." }])
    };
  }

  if (progress === "after_encounter") {
    if (!hasRoom(world, "room.b1f.002")) {
      return createFloorDebugState(base, world, 1); // scenario without the default's opening
    }
    const state: GameState = {
      ...base,
      phase: "dungeon",
      position: createPosition(world, "room.b1f.002", "south"),
      defeatedEnemies: ["enemy.b1f.ash-slime"],
      resolvedTraps: ["trap.b1f.needle"],
      discoveredSecrets: ["trap.b1f.needle"],
      map: createMapState(world, ["room.b1f.001", "room.b1f.002"], "south"),
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
    return createFloorDebugState(base, world, Number(progress.replace("floor_", "")));
  }

  // return_ready — a default-world narrative state (standing at the B1F warden). Any
  // scenario lacking those rooms falls back to a plain floor-1 start.
  if (!hasRoom(world, "room.b1f.warden")) {
    return createFloorDebugState(base, world, 1);
  }

  const state: GameState = {
    ...base,
    phase: "dungeon",
    position: createPosition(world, "room.b1f.warden", "north"),
    defeatedEnemies: ["enemy.b1f.ash-slime"],
    resolvedTraps: ["trap.b1f.needle"],
    discoveredSecrets: ["trap.b1f.needle"],
    map: createMapState(world, [
      "room.b1f.001",
      "room.b1f.002",
      "room.b1f.hub",
      "room.b1f.gate",
      "room.b1f.east",
      "room.b1f.reliquary",
      "room.b1f.warden"
    ]),
    turn: 5
  };

  return {
    ...state,
    log: appendEventLogs(state, [
      { type: "debug_started", text: "Debug start: party stands at the return marker with full map progress." }
    ])
  };
}

// Reposition a seeded debug state directly onto a specific room (and facing).
// Lets a mechanic e2e (secret search, choke, trap) start ON the cell under test
// instead of walking a long maze path — which is what made those specs brittle
// every time a floor's layout changed. Unknown room id is a no-op.
export function withDebugStartCell(
  state: GameState,
  world: ScenarioWorld,
  roomId: string,
  facing: Direction = "north"
): GameState {
  if (!getGridCellForRoom(world, roomId)) {
    return state;
  }
  const visitedRooms = [...state.map.visitedRooms.filter((id) => id !== roomId), roomId];
  return {
    ...state,
    phase: "dungeon",
    position: createPosition(world, roomId, facing),
    map: createMapState(world, visitedRooms, facing)
  };
}

// Debug starts must work in ANY scenario, so a floor start is derived from the world's
// own dungeon list (its Nth floor and that floor's startRoom) instead of default-world
// room ids like `room.b3f.001`. Verdant's floors are g1f..g8f — hard-coding B-floors is
// exactly why the debug mode could not open a non-default scenario.
function createFloorDebugState(base: GameState, world: ScenarioWorld, floorNumber: number): GameState {
  const floor = world.dungeons[Math.min(Math.max(floorNumber, 1), world.dungeons.length) - 1];
  const roomId = floor?.startRoom ?? world.startRoom;
  const visitedRooms = createVisitedPathToFloor(world, floorNumber);
  const state: GameState = {
    ...base,
    phase: "dungeon",
    position: createPosition(world, roomId, "east"),
    inventory: [
      ...base.inventory,
      {
        id: "item.lantern-oil",
        name: "Lantern Oil",
        kind: "utility",
        quantity: 1
      },
      {
        id: "item.return-charm",
        name: "Warding Return Charm",
        kind: "escape",
        quantity: 1
      }
    ],
    map: createMapState(world, visitedRooms),
    turn: 5 + floorNumber
  };

  return {
    ...state,
    log: appendEventLogs(state, [
      { type: "debug_started", text: `Debug start: party begins checks on ${floor?.name ?? `floor ${floorNumber}`}.` }
    ])
  };
}

// The landing of every floor down to this one — derived from the world, so it holds for
// b1f..b8f, g1f..g8f, or any future scenario's floor ids. The default world additionally
// seeds its authored B1F route (its return marker lives there); rooms a scenario doesn't
// have are simply dropped, so this stays world-generic.
const DEFAULT_B1F_ROUTE = [
  "room.b1f.001",
  "room.b1f.002",
  "room.b1f.hub",
  "room.b1f.gate",
  "room.b1f.east",
  "room.b1f.reliquary",
  "room.b1f.warden"
];

function createVisitedPathToFloor(world: ScenarioWorld, floorNumber: number) {
  const landings = world.dungeons.slice(0, Math.max(1, floorNumber)).map((floor) => floor.startRoom);
  const seeded = DEFAULT_B1F_ROUTE.filter((roomId) => hasRoom(world, roomId));
  return Array.from(new Set([...seeded, ...landings]));
}

/** Does this world actually contain that room? Default-world narrative debug states
 *  (after_encounter / return_ready) name B1F rooms that a different scenario lacks. */
function hasRoom(world: ScenarioWorld, roomId: string) {
  return world.dungeons.some((floor) => floor.rooms.some((room) => room.id === roomId));
}

export function createMapState(world: ScenarioWorld, visitedRooms: string[], facing: Direction = "east") {
  const currentRoomId = visitedRooms.at(-1) ?? null;
  const floorId = currentRoomId ? getFloorIdForRoom(world, currentRoomId) : null;
  const currentCell = currentRoomId ? getGridCellForRoom(world, currentRoomId) : null;
  const visitedCells = visitedRooms
    .map((roomId) => getGridCellForRoom(world, roomId)?.id)
    .filter((cellId): cellId is string => Boolean(cellId));

  return {
    floorId,
    currentRoomId,
    currentCellId: currentCell?.id ?? null,
    currentFacing: facing,
    visitedRooms,
    visitedCells,
    knownExits: Object.fromEntries(
      visitedRooms.map((roomId) => {
        return [roomId, getKnownGridDirections(world, roomId)];
      })
    ),
    blockedExits: {},
    secretCandidates: {}
  };
}

function createPosition(world: ScenarioWorld, roomId: string, facing: Direction) {
  return { roomId, cellId: getGridCellForRoom(world, roomId)?.id, facing };
}

function createExpectedParty(): Character[] {
  return [
    {
      ...createGuildCharacter({
        name: "Mira",
        notes: "Mapper. Tracks visited rooms and return routes.",
        classId: "occultist",
        backgroundId: "cartographer",
        traitIds: ["curious"],
        portraitRef: "debug://portrait/mira",
        method: "debug"
      }),
      id: "debug.mira",
      row: "back",
      hp: 12,
      maxHp: 12,
      attack: 4,
      damageMin: 3,
      damageMax: 5,
      accuracy: 82,
      armor: 0,
      speed: 7
    },
    {
      ...createGuildCharacter({
        name: "Sei",
        notes: "Lamp bearer. Keeps the party calm in fixed events.",
        classId: "mender",
        backgroundId: "apothecary",
        traitIds: ["steady"],
        portraitRef: "debug://portrait/sei",
        method: "debug"
      }),
      id: "debug.sei",
      row: "back",
      hp: 11,
      maxHp: 11,
      attack: 3,
      damageMin: 2,
      damageMax: 4,
      accuracy: 78,
      armor: 0,
      speed: 6
    },
    {
      ...createGuildCharacter({
        name: "Rook",
        notes: "Front line. Tests recovery instead of irreversible loss.",
        classId: "vanguard",
        backgroundId: "watch",
        traitIds: ["scarred"],
        portraitRef: "debug://portrait/rook",
        method: "debug"
      }),
      id: "debug.rook",
      row: "front",
      hp: 14,
      maxHp: 14,
      attack: 5,
      damageMin: 4,
      damageMax: 6,
      accuracy: 78,
      armor: 2,
      speed: 5
    },
    {
      ...createGuildCharacter({
        name: "Vale",
        notes: "Scout. Represents search and trap progress.",
        classId: "seeker",
        backgroundId: "ruinborn",
        traitIds: ["lucky"],
        portraitRef: "debug://portrait/vale",
        method: "debug"
      }),
      id: "debug.vale",
      row: "front",
      hp: 10,
      maxHp: 10,
      attack: 3,
      damageMin: 2,
      damageMax: 4,
      accuracy: 84,
      armor: 1,
      speed: 9
    },
    {
      ...createGuildCharacter({
        name: "Bran",
        notes: "Second front line. Keeps six-member formation visible in debug starts.",
        classId: "vanguard",
        backgroundId: "debtor",
        traitIds: ["steady"],
        portraitRef: "debug://portrait/bran",
        method: "debug"
      }),
      id: "debug.bran",
      row: "front",
      hp: 13,
      maxHp: 13,
      attack: 5,
      damageMin: 4,
      damageMax: 6,
      accuracy: 76,
      armor: 2,
      speed: 5
    },
    {
      ...createGuildCharacter({
        name: "Lio",
        notes: "Rear support. Keeps row separation visible in debug starts.",
        classId: "mender",
        backgroundId: "cartographer",
        traitIds: ["curious"],
        portraitRef: "debug://portrait/lio",
        method: "debug"
      }),
      id: "debug.lio",
      row: "back",
      hp: 11,
      maxHp: 11,
      attack: 3,
      damageMin: 2,
      damageMax: 4,
      accuracy: 78,
      armor: 0,
      speed: 7
    }
  ];
}
