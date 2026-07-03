import type { DungeonRoom, ScenarioWorld } from "../domain/types";

export interface ScenarioSummary {
  title: string;
  floorCount: number;
  roomCount: number;
  encounterTableCount: number;
  treasureTableCount: number;
  itemCount: number;
  equipmentCount: number;
  shopCount: number;
  gateCount: number;
  missingJapaneseRooms: number;
  floors: FloorSummary[];
  pacing: ScenarioPacingSummary;
}

export interface FloorSummary {
  id: string;
  name: string;
  level: number | null;
  role: string | null;
  dangerTier: number | null;
  roomCount: number;
  encounterReferences: number;
  treasureReferences: number;
  gateCount: number;
  trapCount: number;
  bossCount: number;
  hasTownReturn: boolean;
}

export interface ScenarioPacingSummary {
  expectedRoomsPerOuting: string;
  maxDangerTier: number;
  midpointFloor: string | null;
  finaleFloor: string | null;
  retreatAnchors: string[];
}

export function summarizeScenario(world: ScenarioWorld): ScenarioSummary {
  const floors = world.dungeons.map((floor) => summarizeFloor(floor.rooms, floor.id, floor.name, {
    level: floor.level ?? null,
    role: floor.role ?? null,
    dangerTier: floor.dangerTier ?? null
  }));
  const missingJapaneseRooms = world.dungeons
    .flatMap((floor) => floor.rooms)
    .filter((room) => !room.locales?.ja?.name || !room.locales?.ja?.description).length;

  return {
    title: world.title,
    floorCount: world.dungeons.length,
    roomCount: floors.reduce((total, floor) => total + floor.roomCount, 0),
    encounterTableCount: world.encounterTables.length,
    treasureTableCount: world.treasureTables.length,
    itemCount: world.items.length,
    equipmentCount: world.equipment.length,
    shopCount: world.shops.length,
    gateCount: floors.reduce((total, floor) => total + floor.gateCount, 0),
    missingJapaneseRooms,
    floors,
    pacing: {
      expectedRoomsPerOuting: estimateRoomsPerOuting(floors),
      maxDangerTier: Math.max(0, ...floors.map((floor) => floor.dangerTier ?? 0)),
      midpointFloor: floors.find((floor) => floor.role === "midpoint_gate")?.id ?? null,
      finaleFloor: floors.find((floor) => floor.role === "finale")?.id ?? null,
      retreatAnchors: floors.filter((floor) => floor.hasTownReturn || floor.role === "midpoint_gate").map((floor) => floor.id)
    }
  };
}

export function formatScenarioSummary(summary: ScenarioSummary): string {
  const lines = [
    `${summary.title}`,
    `Floors: ${summary.floorCount}`,
    `Rooms: ${summary.roomCount}`,
    `Items: ${summary.itemCount}`,
    `Equipment: ${summary.equipmentCount}`,
    `Encounter tables: ${summary.encounterTableCount}`,
    `Treasure tables: ${summary.treasureTableCount}`,
    `Gates: ${summary.gateCount}`,
    `Missing JA rooms: ${summary.missingJapaneseRooms}`,
    `Expected rooms per outing: ${summary.pacing.expectedRoomsPerOuting}`,
    `Max danger tier: ${summary.pacing.maxDangerTier}`,
    `Midpoint: ${summary.pacing.midpointFloor ?? "none"}`,
    `Finale: ${summary.pacing.finaleFloor ?? "none"}`,
    "Floor details:"
  ];

  for (const floor of summary.floors) {
    lines.push(
      `- ${floor.id} ${floor.name}: rooms=${floor.roomCount}, role=${floor.role ?? "none"}, danger=${
        floor.dangerTier ?? "none"
      }, encounters=${floor.encounterReferences}, treasure=${floor.treasureReferences}, gates=${floor.gateCount}`
    );
  }

  return `${lines.join("\n")}\n`;
}

function summarizeFloor(
  rooms: DungeonRoom[],
  id: string,
  name: string,
  metadata: Pick<FloorSummary, "level" | "role" | "dangerTier">
): FloorSummary {
  return {
    id,
    name,
    ...metadata,
    roomCount: rooms.length,
    encounterReferences: rooms.filter((room) => room.encounter || room.encounterTable).length,
    treasureReferences: rooms.filter((room) => room.treasureTable).length,
    gateCount: rooms.reduce((total, room) => total + (room.gates?.length ?? 0), 0),
    trapCount: rooms.filter((room) => room.trap).length,
    bossCount: rooms.filter((room) => room.encounter?.isBoss).length,
    hasTownReturn: rooms.some((room) => room.stairsToTown)
  };
}

function estimateRoomsPerOuting(floors: FloorSummary[]) {
  const earlyRooms = floors.slice(0, 2).reduce((total, floor) => total + floor.roomCount, 0);
  const deepRooms = floors.slice(0, 5).reduce((total, floor) => total + floor.roomCount, 0);
  return `${Math.max(3, Math.ceil(earlyRooms / 2))}-${Math.max(6, Math.ceil(deepRooms / 2))}`;
}
