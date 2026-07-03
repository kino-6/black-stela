import {
  getExit,
  getGridCellForRoom,
  parseScenarioEnemies,
  parseScenarioEncounters,
  parseScenarioItems,
  parseScenarioProgression,
  parseScenarioTreasure,
  parseScenarioWorld
} from "../domain/scenario";
import { parseScenarioPackManifest, type ScenarioPackManifest, type ScenarioValidationError } from "../domain/scenarioPack";
import type { ScenarioWorld } from "../domain/types";
import type { Direction, DungeonGridCell, DungeonGridEdge } from "../domain/types";

export interface ScenarioPackFiles {
  [path: string]: string;
}

export type ScenarioPackLoadResult =
  | { ok: true; manifest: ScenarioPackManifest; world: ScenarioWorld }
  | { ok: false; errors: ScenarioValidationError[] };

export function loadScenarioPack(files: ScenarioPackFiles, rootPath = ""): ScenarioPackLoadResult {
  const errors: ScenarioValidationError[] = [];
  const manifestPath = joinPath(rootPath, "manifest.md");
  const manifestMarkdown = files[manifestPath];
  if (!manifestMarkdown) {
    return {
      ok: false,
      errors: [{ filePath: manifestPath, fieldPath: "manifest", reason: "Missing scenario pack manifest." }]
    };
  }

  const manifest = parseWithContext(manifestPath, () => parseScenarioPackManifest(manifestMarkdown), errors);
  if (!manifest) {
    return { ok: false, errors };
  }

  const worldPath = joinPath(rootPath, manifest.entryWorld);
  const worldMarkdown = files[worldPath];
  if (!worldMarkdown) {
    errors.push({ filePath: worldPath, fieldPath: "entryWorld", reason: "Missing entry world file." });
  }

  const dungeonMarkdowns = manifest.dungeons.flatMap((path) => {
    const fullPath = joinPath(rootPath, path);
    const markdown = files[fullPath];
    if (!markdown) {
      errors.push({ filePath: fullPath, fieldPath: "dungeons", reason: "Missing dungeon file." });
      return [];
    }

    return [markdown];
  });

  if (!worldMarkdown || errors.length > 0) {
    return { ok: false, errors };
  }

  const catalogData = loadCatalogData(files, rootPath, manifest, errors);
  if (errors.some((error) => error.severity !== "warning")) {
    return { ok: false, errors };
  }

  const world = parseWithContext(
    worldPath,
    () => parseScenarioWorld(worldMarkdown, dungeonMarkdowns, catalogData),
    errors
  );
  if (!world) {
    return { ok: false, errors };
  }

  errors.push(...validateScenarioGraph(world, worldPath));

  return errors.some((error) => error.severity !== "warning") ? { ok: false, errors } : { ok: true, manifest, world };
}

function loadCatalogData(
  files: ScenarioPackFiles,
  rootPath: string,
  manifest: ScenarioPackManifest,
  errors: ScenarioValidationError[]
) {
  const data: Partial<
    Pick<
      ScenarioWorld,
      "items" | "equipment" | "shops" | "enemies" | "encounterTables" | "treasureTables" | "progressionFlags"
    >
  > = {};

  const items = parseOptionalDataFile(files, rootPath, manifest.dataFiles.items, "dataFiles.items", parseScenarioItems, errors);
  if (items) {
    data.items = items.items;
    data.equipment = items.equipment;
    data.shops = items.shops;
  }

  const enemies = parseOptionalDataFile(
    files,
    rootPath,
    manifest.dataFiles.enemies,
    "dataFiles.enemies",
    parseScenarioEnemies,
    errors
  );
  if (enemies) {
    data.enemies = enemies.enemies;
  }

  const encounters = parseOptionalDataFile(
    files,
    rootPath,
    manifest.dataFiles.encounters,
    "dataFiles.encounters",
    parseScenarioEncounters,
    errors
  );
  if (encounters) {
    data.encounterTables = encounters.encounterTables;
  }

  const treasure = parseOptionalDataFile(
    files,
    rootPath,
    manifest.dataFiles.treasure,
    "dataFiles.treasure",
    parseScenarioTreasure,
    errors
  );
  if (treasure) {
    data.treasureTables = treasure.treasureTables;
  }

  const progression = parseOptionalDataFile(
    files,
    rootPath,
    manifest.dataFiles.progression,
    "dataFiles.progression",
    parseScenarioProgression,
    errors
  );
  if (progression) {
    data.progressionFlags = progression.progressionFlags;
  }

  return data;
}

export function validateScenarioGraph(world: ScenarioWorld, filePath = "world.md"): ScenarioValidationError[] {
  const errors: ScenarioValidationError[] = [];
  const roomIds = new Set(world.dungeons.flatMap((dungeon) => dungeon.rooms.map((room) => room.id)));
  const floorIds = new Set(world.dungeons.map((dungeon) => dungeon.id));
  const itemIds = new Set(world.items.map((item) => item.id));
  const equipmentIds = new Set(world.equipment.map((item) => item.id));
  const purchasableIds = new Set([...itemIds, ...equipmentIds]);
  const enemyIds = new Set(world.enemies.map((enemy) => enemy.id));
  const encounterTableIds = new Set(world.encounterTables.map((table) => table.id));
  const treasureTableIds = new Set(world.treasureTables.map((table) => table.id));
  const flagIds = new Set(world.progressionFlags.map((flag) => flag.id));

  if (!world.aiPolicy.allowed.length && !world.aiPolicy.forbidden.length) {
    errors.push({ filePath, fieldPath: "aiPolicy", reason: "AI policy must declare allowed or forbidden behavior." });
  }

  for (const dungeon of world.dungeons) {
    if (!roomIds.has(dungeon.startRoom)) {
      errors.push({ filePath, fieldPath: `${dungeon.id}.startRoom`, reason: `Unknown start room: ${dungeon.startRoom}` });
    }

    errors.push(...validateGridTopology(world, dungeon.id, filePath));

    for (const room of dungeon.rooms) {
      for (const direction of ["north", "east", "south", "west"] as const) {
        const target = getExit(world, room.id, direction);
        if (target && !roomIds.has(target)) {
          errors.push({
            filePath,
            fieldPath: `${room.id}.exits.${direction}`,
            reason: `Exit references unknown room: ${target}`
          });
        }
      }

      const cell = getGridCellForRoom(world, room.id);
      if (dungeon.grid && !cell) {
        errors.push({
          filePath,
          fieldPath: `${room.id}.grid`,
          reason: `Room has no grid cell: ${room.id}`
        });
      }

      if (room.encounter && world.enemies.length > 0 && !enemyIds.has(room.encounter.id)) {
        errors.push({
          filePath,
          fieldPath: `${room.id}.encounter.id`,
          reason: `Room encounter is not defined in enemy catalog: ${room.encounter.id}`
        });
      }

      if (room.encounterTable && !encounterTableIds.has(room.encounterTable)) {
        errors.push({
          filePath,
          fieldPath: `${room.id}.encounterTable`,
          reason: `Unknown encounter table: ${room.encounterTable}`
        });
      }

      if (room.treasureTable && !treasureTableIds.has(room.treasureTable)) {
        errors.push({
          filePath,
          fieldPath: `${room.id}.treasureTable`,
          reason: `Unknown treasure table: ${room.treasureTable}`
        });
      }

      for (const gate of room.gates ?? []) {
        if (gate.requiredKeyId && !purchasableIds.has(gate.requiredKeyId)) {
          errors.push({
            filePath,
            fieldPath: `${room.id}.gates.${gate.id}.requiredKeyId`,
            reason: `Unknown key item: ${gate.requiredKeyId}`
          });
        }

        for (const flag of [gate.requiredFlag, gate.grantsFlag].filter(Boolean)) {
          if (flag && !flagIds.has(flag)) {
            errors.push({
              filePath,
              fieldPath: `${room.id}.gates.${gate.id}.flag`,
              reason: `Unknown progression flag: ${flag}`
            });
          }
        }
      }

      if (room.locales && !room.locales.ja) {
        errors.push({
          filePath,
          fieldPath: `${room.id}.locales.ja`,
          reason: "Missing Japanese room localization.",
          severity: "warning"
        });
      }
    }
  }

  const reachableRooms = collectReachableRooms(world);
  for (const roomId of roomIds) {
    if (!reachableRooms.has(roomId)) {
      errors.push({
        filePath,
        fieldPath: `${roomId}.reachability`,
        reason: `Room is unreachable from scenario start: ${roomId}`
      });
    }
  }

  const returnableRooms = collectRoomsThatCanReachTownReturn(world);
  for (const roomId of reachableRooms) {
    if (!roomIds.has(roomId)) {
      continue;
    }

    if (!returnableRooms.has(roomId)) {
      errors.push({
        filePath,
        fieldPath: `${roomId}.returnability`,
        reason: `Reachable room cannot route back to an authored town return: ${roomId}`
      });
    }
  }

  for (const missingProgression of findMissingFloorProgression(world)) {
    errors.push({
      filePath,
      fieldPath: `${missingProgression.floorId}.floorProgression`,
      reason: `No authored route from ${missingProgression.floorId} to ${missingProgression.nextFloorId}.`
    });
  }

  for (const table of world.encounterTables) {
    if (table.floorId && !floorIds.has(table.floorId)) {
      errors.push({
        filePath,
        fieldPath: `${table.id}.floorId`,
        reason: `Unknown floor for encounter table: ${table.floorId}`
      });
    }

    for (const entry of table.entries) {
      if (!enemyIds.has(entry.enemyId)) {
        errors.push({
          filePath,
          fieldPath: `${table.id}.entries.enemyId`,
          reason: `Unknown enemy reference: ${entry.enemyId}`
        });
      }
    }
  }

  for (const table of world.treasureTables) {
    for (const entry of table.entries) {
      if (!purchasableIds.has(entry.itemId)) {
        errors.push({
          filePath,
          fieldPath: `${table.id}.entries.itemId`,
          reason: `Unknown treasure item reference: ${entry.itemId}`
        });
      }
    }
  }

  for (const shop of world.shops) {
    for (const stock of shop.stock ?? []) {
      if (!purchasableIds.has(stock.itemId)) {
        errors.push({
          filePath,
          fieldPath: `${shop.id}.stock.itemId`,
          reason: `Unknown shop stock reference: ${stock.itemId}`
        });
      }

      if (stock.unlockFlag && !flagIds.has(stock.unlockFlag)) {
        errors.push({
          filePath,
          fieldPath: `${shop.id}.stock.unlockFlag`,
          reason: `Unknown shop unlock flag: ${stock.unlockFlag}`
        });
      }
    }
  }

  return errors;
}

function validateGridTopology(world: ScenarioWorld, floorId: string, filePath: string): ScenarioValidationError[] {
  const errors: ScenarioValidationError[] = [];
  const floor = world.dungeons.find((candidate) => candidate.id === floorId);
  if (!floor?.grid) {
    return errors;
  }

  const floorRoomIds = new Set(floor.rooms.map((room) => room.id));
  const allRoomIds = new Set(world.dungeons.flatMap((dungeon) => dungeon.rooms.map((room) => room.id)));
  const cellsByRoom = new Map(floor.grid.cells.map((cell) => [cell.roomId, cell]));
  const cellsById = new Map(floor.grid.cells.map((cell) => [cell.id, cell]));
  const coordinateKeys = new Set<string>();

  for (const cell of floor.grid.cells) {
    const coordinateKey = `${cell.x},${cell.y}`;
    if (coordinateKeys.has(coordinateKey)) {
      errors.push({
        filePath,
        fieldPath: `${cell.id}.grid.coordinate`,
        reason: `Duplicate grid coordinate on ${floor.id}: ${coordinateKey}`
      });
    }
    coordinateKeys.add(coordinateKey);

    if (!floorRoomIds.has(cell.roomId)) {
      errors.push({
        filePath,
        fieldPath: `${cell.id}.grid.roomId`,
        reason: `Grid cell references a room outside its floor: ${cell.roomId}`
      });
    }

    for (const direction of ["north", "east", "south", "west"] as const) {
      const edge = cell.edges[direction];
      if (!edge) {
        continue;
      }

      if (edge.targetRoomId && !allRoomIds.has(edge.targetRoomId)) {
        errors.push({
          filePath,
          fieldPath: `${cell.id}.edges.${direction}.targetRoomId`,
          reason: `Grid edge references unknown room: ${edge.targetRoomId}`
        });
      }

      if (edge.targetCellId && !cellsById.has(edge.targetCellId) && edge.targetFloorId === floor.id) {
        errors.push({
          filePath,
          fieldPath: `${cell.id}.edges.${direction}.targetCellId`,
          reason: `Grid edge references unknown cell: ${edge.targetCellId}`
        });
      }

      if (edge.targetRoomId && floorRoomIds.has(edge.targetRoomId)) {
        const targetCell = cellsByRoom.get(edge.targetRoomId);
        if (targetCell && !isDeclaredSpecial(edge) && !isAdjacent(cell, targetCell, direction)) {
          errors.push({
            filePath,
            fieldPath: `${cell.roomId}.grid.${direction}`,
            reason: `Grid movement must be adjacent unless declared special: ${cell.roomId} -> ${edge.targetRoomId}`
          });
        }
      }

      const roomExit = floor.rooms.find((room) => room.id === cell.roomId)?.exits[direction];
      if (roomExit && edge.targetRoomId !== roomExit) {
        errors.push({
          filePath,
          fieldPath: `${cell.roomId}.exits.${direction}`,
          reason: `Room exit and grid edge disagree: ${roomExit} vs ${edge.targetRoomId ?? "none"}`
        });
      }
    }
  }

  for (const room of floor.rooms) {
    const cell = cellsByRoom.get(room.id);
    if (!cell) {
      continue;
    }

    for (const direction of Object.keys(room.exits) as Direction[]) {
      if (!cell.edges[direction]?.targetRoomId) {
        errors.push({
          filePath,
          fieldPath: `${room.id}.grid.${direction}`,
          reason: `Room exit must be represented as a grid edge: ${room.id}.${direction}`
        });
      }
    }
  }

  return errors;
}

function isDeclaredSpecial(edge: DungeonGridEdge) {
  return ["stairs", "shortcut", "one_way"].includes(edge.kind) || Boolean(edge.targetFloorId);
}

function isAdjacent(source: DungeonGridCell, target: DungeonGridCell, direction: Direction) {
  const offsets: Record<Direction, { x: number; y: number }> = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
  };
  const offset = offsets[direction];
  return target.x === source.x + offset.x && target.y === source.y + offset.y;
}

function collectReachableRooms(world: ScenarioWorld) {
  const reachable = new Set<string>();
  const pending = [world.startRoom];

  while (pending.length > 0) {
    const roomId = pending.shift()!;
    if (reachable.has(roomId)) {
      continue;
    }

    reachable.add(roomId);
    const room = world.dungeons.flatMap((dungeon) => dungeon.rooms).find((candidate) => candidate.id === roomId);
    if (!room) {
      continue;
    }

    for (const target of Object.values(room.exits)) {
      if (target && !reachable.has(target)) {
        pending.push(target);
      }
    }
  }

  return reachable;
}

function collectRoomsThatCanReachTownReturn(world: ScenarioWorld) {
  const rooms = world.dungeons.flatMap((dungeon) => dungeon.rooms);
  const reverseExits = new Map<string, string[]>();
  const returnable = new Set<string>();
  const pending: string[] = [];

  for (const room of rooms) {
    if (room.stairsToTown) {
      returnable.add(room.id);
      pending.push(room.id);
    }

    for (const target of Object.values(room.exits)) {
      if (!target) {
        continue;
      }

      reverseExits.set(target, [...(reverseExits.get(target) ?? []), room.id]);
    }
  }

  while (pending.length > 0) {
    const roomId = pending.shift()!;
    for (const source of reverseExits.get(roomId) ?? []) {
      if (returnable.has(source)) {
        continue;
      }

      returnable.add(source);
      pending.push(source);
    }
  }

  return returnable;
}

function findMissingFloorProgression(world: ScenarioWorld) {
  return world.dungeons.flatMap((dungeon, index) => {
    const next = world.dungeons[index + 1];
    if (!next) {
      return [];
    }

    const nextRoomIds = new Set(next.rooms.map((room) => room.id));
    const hasNextFloorExit = dungeon.rooms.some((room) =>
      Object.values(room.exits).some((target) => target ? nextRoomIds.has(target) : false)
    );

    return hasNextFloorExit ? [] : [{ floorId: dungeon.id, nextFloorId: next.id }];
  });
}

function parseOptionalDataFile<T>(
  files: ScenarioPackFiles,
  rootPath: string,
  path: string | undefined,
  fieldPath: string,
  parse: (markdown: string) => T,
  errors: ScenarioValidationError[]
): T | null {
  if (!path) {
    return null;
  }

  const fullPath = joinPath(rootPath, path);
  const markdown = files[fullPath];
  if (!markdown) {
    errors.push({ filePath: fullPath, fieldPath, reason: `Missing data file: ${path}` });
    return null;
  }

  return parseWithContext(fullPath, () => parse(markdown), errors);
}

function parseWithContext<T>(
  filePath: string,
  parse: () => T,
  errors: ScenarioValidationError[]
): T | null {
  try {
    return parse();
  } catch (error) {
    errors.push({
      filePath,
      fieldPath: "yaml",
      reason: error instanceof Error ? error.message : "Unable to parse scenario document."
    });
    return null;
  }
}

function joinPath(rootPath: string, path: string) {
  return rootPath ? `${rootPath.replace(/\/$/, "")}/${path}` : path;
}
