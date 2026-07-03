import {
  getExit,
  parseScenarioEnemies,
  parseScenarioEncounters,
  parseScenarioItems,
  parseScenarioProgression,
  parseScenarioTreasure,
  parseScenarioWorld
} from "../domain/scenario";
import { parseScenarioPackManifest, type ScenarioPackManifest, type ScenarioValidationError } from "../domain/scenarioPack";
import type { ScenarioWorld } from "../domain/types";

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
