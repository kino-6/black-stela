import { z } from "zod";
import type { GameState, ScenarioWorld } from "./types";

const DirectionSchema = z.enum(["north", "east", "south", "west"]);
const GamePhaseSchema = z.enum(["town", "dungeon", "combat"]);
const LocaleSchema = z.enum(["en", "ja"]);

const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  notes: z.string(),
  portraitRef: z.string().optional(),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  attack: z.number().int().nonnegative()
});

const EnemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hp: z.number().int().nonnegative(),
  attack: z.number().int().nonnegative()
});

const CombatStateSchema = z.object({
  enemy: EnemySchema,
  roomId: z.string().min(1)
});

const DungeonPositionSchema = z.object({
  roomId: z.string().min(1),
  facing: DirectionSchema
});

const DungeonMapStateSchema = z.object({
  visitedRooms: z.array(z.string().min(1)),
  knownExits: z.record(z.array(DirectionSchema))
});

const AdventureLogEntrySchema = z.object({
  id: z.string().min(1),
  turn: z.number().int().nonnegative(),
  text: z.string(),
  tags: z.array(z.string())
});

export const GameStateSchema = z.object({
  phase: GamePhaseSchema,
  party: z.array(CharacterSchema),
  position: DungeonPositionSchema.nullable(),
  combat: CombatStateSchema.nullable(),
  defeatedEnemies: z.array(z.string()),
  resolvedTraps: z.array(z.string()),
  discoveredSecrets: z.array(z.string()),
  map: DungeonMapStateSchema,
  log: z.array(AdventureLogEntrySchema),
  turn: z.number().int().nonnegative(),
  aiEnabled: z.boolean()
}) satisfies z.ZodType<GameState>;

export const SaveDataV1Schema = z.object({
  schemaVersion: z.literal(1),
  savedAt: z.string().datetime(),
  scenario: z.object({
    worldId: z.string().min(1),
    title: z.string().min(1)
  }),
  settings: z
    .object({
      aiEnabled: z.boolean().default(false),
      locale: LocaleSchema.default("en")
    })
    .default({ aiEnabled: false, locale: "en" }),
  state: GameStateSchema
});

export type SaveDataV1 = z.infer<typeof SaveDataV1Schema>;

export function toSaveDataV1(
  state: GameState,
  world: ScenarioWorld,
  options: { savedAt?: string; locale?: "en" | "ja" } = {}
): SaveDataV1 {
  return SaveDataV1Schema.parse({
    schemaVersion: 1,
    savedAt: options.savedAt ?? new Date().toISOString(),
    scenario: {
      worldId: world.id,
      title: world.title
    },
    settings: {
      aiEnabled: state.aiEnabled,
      locale: options.locale ?? "en"
    },
    state
  });
}

export function parseSaveDataV1(input: unknown): SaveDataV1 {
  const version = z.object({ schemaVersion: z.number() }).safeParse(input);
  if (version.success && version.data.schemaVersion !== 1) {
    throw new Error(`Unsupported save data schema version: ${version.data.schemaVersion}`);
  }

  return SaveDataV1Schema.parse(input);
}

export function fromSaveDataV1(input: SaveDataV1 | unknown): GameState {
  return parseSaveDataV1(input).state;
}
