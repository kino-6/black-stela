import yaml from "js-yaml";
import { z } from "zod";
import type { Direction, DungeonFloor, ScenarioWorld } from "./types";

const directionSchema = z.enum(["north", "east", "south", "west"]);

const enemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hp: z.number().int().positive(),
  attack: z.number().int().nonnegative()
});

const trapSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  damage: z.number().int().nonnegative(),
  detectDc: z.number().int().positive()
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
  event: z.string().optional()
});

export const dungeonFloorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  startRoom: z.string().min(1),
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
  dungeons: z.array(dungeonFloorSchema).min(1)
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
  dungeonMarkdowns: string[]
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
    dungeons
  }) as ScenarioWorld;
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
