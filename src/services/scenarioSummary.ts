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
  shopStockReferenceCount: number;
  gateCount: number;
  returnAnchorCount: number;
  nextFloorLinkCount: number;
  lockCount: number;
  lootReferenceCount: number;
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
  lootReferenceCount: number;
  gateCount: number;
  lockCount: number;
  trapCount: number;
  bossCount: number;
  hasTownReturn: boolean;
  returnAnchorCount: number;
  nextFloorLinks: string[];
  localizationGaps: number;
  encounterBudget: string;
}

export interface ScenarioPacingSummary {
  expectedRoomsPerOuting: string;
  maxDangerTier: number;
  midpointFloor: string | null;
  finaleFloor: string | null;
  retreatAnchors: string[];
}

export function summarizeScenario(world: ScenarioWorld): ScenarioSummary {
  const roomFloorIndex = buildRoomFloorIndex(world);
  const floorOrderIndex = new Map(world.dungeons.map((floor, index) => [floor.id, index]));
  const floors = world.dungeons.map((floor) =>
    summarizeFloor(world, floor.rooms, floor.id, floor.name, roomFloorIndex, floorOrderIndex, {
      level: floor.level ?? null,
      role: floor.role ?? null,
      dangerTier: floor.dangerTier ?? null
    })
  );
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
    shopStockReferenceCount: world.shops.reduce((total, shop) => total + (shop.stock?.length ?? 0), 0),
    gateCount: floors.reduce((total, floor) => total + floor.gateCount, 0),
    returnAnchorCount: floors.reduce((total, floor) => total + floor.returnAnchorCount, 0),
    nextFloorLinkCount: floors.reduce((total, floor) => total + floor.nextFloorLinks.length, 0),
    lockCount: floors.reduce((total, floor) => total + floor.lockCount, 0),
    lootReferenceCount: floors.reduce((total, floor) => total + floor.lootReferenceCount, 0),
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
    `Shops: ${summary.shopCount}`,
    `Shop stock refs: ${summary.shopStockReferenceCount}`,
    `Encounter tables: ${summary.encounterTableCount}`,
    `Treasure tables: ${summary.treasureTableCount}`,
    `Gates: ${summary.gateCount}`,
    `Locks: ${summary.lockCount}`,
    `Town returns: ${summary.returnAnchorCount}`,
    `Next-floor links: ${summary.nextFloorLinkCount}`,
    `Loot refs: ${summary.lootReferenceCount}`,
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
      }, encounters=${floor.encounterReferences}, budget=${floor.encounterBudget}, treasure=${floor.treasureReferences}, loot=${
        floor.lootReferenceCount
      }, gates=${floor.gateCount}, locks=${floor.lockCount}, returns=${floor.returnAnchorCount}, next=${
        floor.nextFloorLinks.join("|") || "none"
      }, jaGaps=${floor.localizationGaps}`
    );
  }

  return `${lines.join("\n")}\n`;
}

function summarizeFloor(
  world: ScenarioWorld,
  rooms: DungeonRoom[],
  id: string,
  name: string,
  roomFloorIndex: Map<string, string>,
  floorOrderIndex: Map<string, number>,
  metadata: Pick<FloorSummary, "level" | "role" | "dangerTier">
): FloorSummary {
  const nextFloorLinks = collectNextFloorLinks(rooms, id, roomFloorIndex, floorOrderIndex);
  const encounterReferences = rooms.filter((room) => room.encounter || room.encounterTable).length;
  return {
    id,
    name,
    ...metadata,
    roomCount: rooms.length,
    encounterReferences,
    treasureReferences: rooms.filter((room) => room.treasureTable).length,
    lootReferenceCount: countLootReferences(world, rooms),
    gateCount: rooms.reduce((total, room) => total + (room.gates?.length ?? 0), 0),
    lockCount: rooms.reduce((total, room) => total + (room.gates?.filter((gate) => gate.kind === "lock").length ?? 0), 0),
    trapCount: rooms.filter((room) => room.trap).length,
    bossCount: rooms.filter((room) => room.encounter?.isBoss).length,
    hasTownReturn: rooms.some((room) => room.stairsToTown),
    returnAnchorCount: rooms.filter((room) => room.stairsToTown).length,
    nextFloorLinks,
    localizationGaps: rooms.filter((room) => !room.locales?.ja?.name || !room.locales?.ja?.description).length,
    encounterBudget: formatEncounterBudget(world, rooms)
  };
}

function estimateRoomsPerOuting(floors: FloorSummary[]) {
  const earlyRooms = floors.slice(0, 2).reduce((total, floor) => total + floor.roomCount, 0);
  const deepRooms = floors.slice(0, 5).reduce((total, floor) => total + floor.roomCount, 0);
  return `${Math.max(3, Math.ceil(earlyRooms / 2))}-${Math.max(6, Math.ceil(deepRooms / 2))}`;
}

function buildRoomFloorIndex(world: ScenarioWorld) {
  const index = new Map<string, string>();
  for (const floor of world.dungeons) {
    for (const room of floor.rooms) {
      index.set(room.id, floor.id);
    }
  }
  return index;
}

function collectNextFloorLinks(
  rooms: DungeonRoom[],
  floorId: string,
  roomFloorIndex: Map<string, string>,
  floorOrderIndex: Map<string, number>
) {
  const links = new Set<string>();
  const sourceIndex = floorOrderIndex.get(floorId) ?? -1;
  for (const room of rooms) {
    for (const targetRoomId of Object.values(room.exits)) {
      const targetFloorId = targetRoomId ? roomFloorIndex.get(targetRoomId) : null;
      const targetIndex = targetFloorId ? floorOrderIndex.get(targetFloorId) ?? -1 : -1;
      if (targetFloorId && targetIndex > sourceIndex) {
        links.add(targetFloorId);
      }
    }
  }
  return Array.from(links).sort();
}

function countLootReferences(world: ScenarioWorld, rooms: DungeonRoom[]) {
  const tableIds = new Set(rooms.map((room) => room.treasureTable).filter(Boolean));
  return world.treasureTables
    .filter((table) => tableIds.has(table.id))
    .reduce((total, table) => total + table.entries.length, 0);
}

function formatEncounterBudget(world: ScenarioWorld, rooms: DungeonRoom[]) {
  const directEncounters = rooms.filter((room) => room.encounter).length;
  const tableIds = new Set(rooms.map((room) => room.encounterTable).filter(Boolean));
  const tableEntries = world.encounterTables
    .filter((table) => tableIds.has(table.id))
    .reduce((total, table) => total + table.entries.length, 0);
  return `${directEncounters}+${tableEntries}`;
}
