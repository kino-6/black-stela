import yaml from "js-yaml";
import { z } from "zod";
import type { Direction, DungeonFloor, ScenarioWorld } from "./types";

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
  hp: z.number().int().positive(),
  attack: z.number().int().nonnegative(),
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
  kind: z.enum(["healing", "utility", "key", "treasure"]),
  tier: z.number().int().nonnegative(),
  price: z.number().int().nonnegative().optional(),
  sellValue: z.number().int().nonnegative().optional(),
  healAmount: z.number().int().positive().optional(),
  locales: localizedNameDescriptionSchema.optional()
});

const scenarioEquipmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slot: z.enum(["weapon", "armor", "accessory"]),
  tier: z.number().int().nonnegative(),
  attackBonus: z.number().int().optional(),
  defenseBonus: z.number().int().optional(),
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
  return getRoom(world, roomId).exits[direction];
}
