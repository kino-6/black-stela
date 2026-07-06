import yaml from "js-yaml";
import { z } from "zod";
import type { Direction, DungeonFloor, DungeonGridCell, DungeonGridEdge, ScenarioWorld } from "./types";

const directionSchema = z.enum(["north", "east", "south", "west"]);
const floorRoleSchema = z.enum([
  "onboarding",
  "attrition",
  "navigation_twist",
  "midpoint_gate",
  "deep_route",
  "finale",
  "optional"
]);
const enemyRoleSchema = z.enum(["attrition", "blocker", "status", "ambusher", "caster", "miniboss", "boss"]);

const localizedNameDescriptionSchema = z.record(
  z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional()
  })
);

const enemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  locales: localizedNameDescriptionSchema.optional(),
  hp: z.number().int().positive(),
  attack: z.number().int().nonnegative(),
  armor: z.number().int().nonnegative().optional(),
  accuracy: z.number().int().min(0).max(100).optional(),
  damageMin: z.number().int().nonnegative().optional(),
  damageMax: z.number().int().nonnegative().optional(),
  speed: z.number().int().nonnegative().optional(),
  morale: z.number().int().min(0).max(12).optional(),
  xp: z.number().int().nonnegative().optional(),
  gold: z.number().int().nonnegative().optional(),
  resistances: z
    .object({
      poison: z.number().int().min(0).max(100).optional(),
      fear: z.number().int().min(0).max(100).optional(),
      silence: z.number().int().min(0).max(100).optional(),
      sleep: z.number().int().min(0).max(100).optional(),
      ward: z.number().int().min(0).max(100).optional()
    })
    .optional(),
  drops: z.array(z.string().min(1)).optional(),
  role: enemyRoleSchema.optional(),
  dangerTier: z.number().int().positive().optional(),
  tags: z.array(z.string().min(1)).default([]),
  isBoss: z.boolean().optional()
});

const trapSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  damage: z.number().int().nonnegative(),
  detectDc: z.number().int().positive(),
  warning: z.string().min(1).optional()
});

const scenarioItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["healing", "utility", "key", "treasure", "escape"]),
  tier: z.number().int().nonnegative(),
  price: z.number().int().nonnegative().optional(),
  sellValue: z.number().int().nonnegative().optional(),
  healAmount: z.number().int().positive().optional(),
  locales: localizedNameDescriptionSchema.optional()
});

const scenarioEquipmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  slot: z.enum(["weapon", "offhand", "body", "head", "hands", "accessory"]),
  tier: z.number().int().nonnegative(),
  attackBonus: z.number().int().optional(),
  defenseBonus: z.number().int().optional(),
  accuracyBonus: z.number().int().optional(),
  speedBonus: z.number().int().optional(),
  allowedClasses: z
    .array(
      z.enum([
        "vanguard",
        "sellsword",
        "bulwark",
        "duelist",
        "seeker",
        "scout",
        "cutpurse",
        "mender",
        "chanter",
        "occultist",
        "arcanist",
        "wayfinder"
      ])
    )
    .optional(),
  tags: z.array(z.string().min(1)).default([]),
  price: z.number().int().nonnegative().optional(),
  sellValue: z.number().int().nonnegative().optional(),
  locales: localizedNameDescriptionSchema.optional()
});

const shopStockItemSchema = z.object({
  itemId: z.string().min(1),
  price: z.number().int().nonnegative(),
  availability: z.enum(["always", "limited", "unlocked"]).optional(),
  unlockFlag: z.string().min(1).optional()
});

const scenarioShopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  service: z.enum(["general_store", "armory", "recovery"]),
  stock: z.array(shopStockItemSchema).default([]),
  locales: localizedNameDescriptionSchema.optional()
});

const encounterTableSchema = z.object({
  id: z.string().min(1),
  floorId: z.string().min(1).optional(),
  entries: z
    .array(
      z.object({
        enemyId: z.string().min(1),
        weight: z.number().int().positive(),
        minCount: z.number().int().positive().optional(),
        maxCount: z.number().int().positive().optional()
      })
    )
    .min(1)
});

const treasureTableSchema = z.object({
  id: z.string().min(1),
  tier: z.number().int().nonnegative(),
  entries: z
    .array(
      z.object({
        itemId: z.string().min(1),
        weight: z.number().int().positive(),
        quantity: z.number().int().positive().optional()
      })
    )
    .min(1)
});

const progressionFlagSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1)
});

const explorationGateSchema = z.object({
  id: z.string().min(1),
  direction: directionSchema.optional(),
  kind: z.enum(["lock", "hidden", "one_way", "dark_zone", "shortcut"]),
  requiredKeyId: z.string().min(1).optional(),
  requiredFlag: z.string().min(1).optional(),
  grantsFlag: z.string().min(1).optional(),
  clue: z.string().min(1).optional(),
  locales: z.record(z.object({ clue: z.string().min(1).optional() })).optional()
});

const gridEdgeSchema = z.object({
  kind: z.enum(["open", "wall", "door", "locked", "secret", "one_way", "shortcut", "stairs"]),
  targetRoomId: z.string().min(1).optional(),
  targetCellId: z.string().min(1).optional(),
  targetFloorId: z.string().min(1).optional()
});

const gridCellSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  x: z.number().int(),
  y: z.number().int(),
  edges: z.record(directionSchema, gridEdgeSchema).default({})
});

const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  locales: z
    .record(
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        event: z.string().min(1).optional()
      })
    )
    .optional(),
  exits: z.record(directionSchema, z.string().min(1)).default({}),
  doors: z.array(directionSchema).optional(),
  stairsToTown: z.boolean().optional(),
  restPoint: z.boolean().optional(),
  spinner: z.boolean().optional(),
  trap: trapSchema.optional(),
  encounter: enemySchema.optional(),
  encounterTable: z.string().min(1).optional(),
  treasureTable: z.string().min(1).optional(),
  gates: z.array(explorationGateSchema).default([]),
  zone: z.string().min(1).optional(),
  event: z.string().optional()
});

export const dungeonFloorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  startRoom: z.string().min(1),
  grid: z.object({ cells: z.array(gridCellSchema).min(1) }).optional(),
  level: z.number().int().positive().optional(),
  role: floorRoleSchema.optional(),
  dangerTier: z.number().int().positive().optional(),
  recommendedPartyLevel: z.number().int().positive().optional(),
  tags: z.array(z.string().min(1)).default([]),
  authorNotes: z.string().min(1).optional(),
  rooms: z.array(roomSchema).min(1)
});

export const scenarioWorldSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startDungeon: z.string().min(1),
  startRoom: z.string().min(1),
  aiPolicy: z.object({
    allowed: z.array(z.string()).default([]),
    forbidden: z.array(z.string()).default([])
  }),
  dungeons: z.array(dungeonFloorSchema).min(1),
  items: z.array(scenarioItemSchema).default([]),
  equipment: z.array(scenarioEquipmentSchema).default([]),
  shops: z.array(scenarioShopSchema).default([]),
  enemies: z.array(enemySchema).default([]),
  encounterTables: z.array(encounterTableSchema).default([]),
  treasureTables: z.array(treasureTableSchema).default([]),
  progressionFlags: z.array(progressionFlagSchema).default([])
});

export const scenarioItemsSchema = z.object({
  items: z.array(scenarioItemSchema).default([]),
  equipment: z.array(scenarioEquipmentSchema).default([]),
  shops: z.array(scenarioShopSchema).default([])
});

export const scenarioEnemiesSchema = z.object({
  enemies: z.array(enemySchema).default([])
});

export const scenarioEncountersSchema = z.object({
  encounterTables: z.array(encounterTableSchema).default([])
});

export const scenarioTreasureSchema = z.object({
  treasureTables: z.array(treasureTableSchema).default([])
});

export const scenarioProgressionSchema = z.object({
  progressionFlags: z.array(progressionFlagSchema).default([])
});

interface FrontMatterDocument<T> {
  data: T;
  body: string;
}

export function parseMarkdownFrontMatter<T>(
  markdown: string,
  schema: z.ZodSchema<T>
): FrontMatterDocument<T> {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error("Scenario document is missing YAML front matter.");
  }

  const data = schema.parse(yaml.load(match[1]));
  return {
    data,
    body: match[2].trim()
  };
}

export function parseDungeonFloor(markdown: string): DungeonFloor {
  return parseMarkdownFrontMatter(markdown, dungeonFloorSchema).data as DungeonFloor;
}

export function parseScenarioWorld(
  worldMarkdown: string,
  dungeonMarkdowns: string[],
  data: Partial<
    Pick<
      ScenarioWorld,
      "items" | "equipment" | "shops" | "enemies" | "encounterTables" | "treasureTables" | "progressionFlags"
    >
  > = {}
): ScenarioWorld {
  const world = parseMarkdownFrontMatter(
    worldMarkdown,
    scenarioWorldSchema.omit({ dungeons: true }).extend({
      dungeons: z.array(z.unknown()).default([])
    })
  ).data;

  const dungeons = dungeonMarkdowns.map(parseDungeonFloor);
  return scenarioWorldSchema.parse({
    ...world,
    dungeons,
    items: data.items ?? [],
    equipment: data.equipment ?? [],
    shops: data.shops ?? [],
    enemies: data.enemies ?? [],
    encounterTables: data.encounterTables ?? [],
    treasureTables: data.treasureTables ?? [],
    progressionFlags: data.progressionFlags ?? []
  }) as ScenarioWorld;
}

export function parseScenarioItems(markdown: string) {
  return parseMarkdownFrontMatter(markdown, scenarioItemsSchema).data;
}

export function parseScenarioEnemies(markdown: string) {
  return parseMarkdownFrontMatter(markdown, scenarioEnemiesSchema).data;
}

export function parseScenarioEncounters(markdown: string) {
  return parseMarkdownFrontMatter(markdown, scenarioEncountersSchema).data;
}

export function parseScenarioTreasure(markdown: string) {
  return parseMarkdownFrontMatter(markdown, scenarioTreasureSchema).data;
}

export function parseScenarioProgression(markdown: string) {
  return parseMarkdownFrontMatter(markdown, scenarioProgressionSchema).data;
}

export function getRoom(world: ScenarioWorld, roomId: string) {
  const room = world.dungeons.flatMap((dungeon) => dungeon.rooms).find((candidate) => candidate.id === roomId);

  if (!room) {
    throw new Error(`Unknown room: ${roomId}`);
  }

  return room;
}

export function getLocalizedRoomText(world: ScenarioWorld, roomId: string, locale: string) {
  const room = getRoom(world, roomId);
  const localized = room.locales?.[locale];

  return {
    name: localized?.name ?? room.name,
    description: localized?.description ?? room.description,
    event: localized?.event ?? room.event
  };
}

export function getExit(world: ScenarioWorld, roomId: string, direction: Direction) {
  const edge = getGridEdge(world, roomId, direction);
  if (edge) {
    return isTraversableEdge(edge) ? edge.targetRoomId : undefined;
  }

  return getRoom(world, roomId).exits[direction];
}

export function getFloorForRoom(world: ScenarioWorld, roomId: string) {
  return world.dungeons.find((dungeon) => dungeon.rooms.some((room) => room.id === roomId)) ?? null;
}

export function getFloorIdForRoom(world: ScenarioWorld, roomId: string) {
  return getFloorForRoom(world, roomId)?.id ?? null;
}

export function getGridCellForRoom(world: ScenarioWorld, roomId: string) {
  const floor = getFloorForRoom(world, roomId);
  return floor?.grid?.cells.find((cell) => cell.roomId === roomId) ?? null;
}

export function getGridEdge(world: ScenarioWorld, roomId: string, direction: Direction) {
  return getGridCellForRoom(world, roomId)?.edges[direction] ?? null;
}

export function isTraversableEdge(edge: DungeonGridEdge) {
  return ["open", "door", "one_way", "shortcut", "stairs"].includes(edge.kind) && Boolean(edge.targetRoomId);
}

export function getKnownGridDirections(world: ScenarioWorld, roomId: string) {
  const cell = getGridCellForRoom(world, roomId);
  if (!cell) {
    return Object.keys(getRoom(world, roomId).exits) as Direction[];
  }

  return (Object.keys(cell.edges) as Direction[]).filter((direction) => {
    const edge = cell.edges[direction];
    return edge ? edge.kind !== "wall" : false;
  });
}
