import { z } from "zod";
import type { GameEvent, GameState, ScenarioWorld } from "./types";

const DirectionSchema = z.enum(["north", "east", "south", "west"]);
const GamePhaseSchema = z.enum(["town", "dungeon", "combat"]);
const LocaleSchema = z.enum(["en", "ja"]);

const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  notes: z.string(),
  portraitRef: z.string().optional(),
  row: z.enum(["front", "back"]).default("front"),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  attack: z.number().int().nonnegative(),
  damageMin: z.number().int().nonnegative().default(1),
  damageMax: z.number().int().nonnegative().default(4),
  accuracy: z.number().int().min(0).max(100).default(80),
  armor: z.number().int().nonnegative().default(0),
  speed: z.number().int().nonnegative().default(6),
  resistance: z
    .object({
      poison: z.number().int().min(0).max(100).optional(),
      fear: z.number().int().min(0).max(100).optional(),
      silence: z.number().int().min(0).max(100).optional(),
      sleep: z.number().int().min(0).max(100).optional(),
      ward: z.number().int().min(0).max(100).optional()
    })
    .optional(),
  xp: z.number().int().nonnegative().default(0),
  gold: z.number().int().nonnegative().default(0),
  status: z.array(z.enum(["poison", "fear", "silence", "sleep", "ward"])).default([]),
  injury: z.enum(["wounded"]).optional()
});

const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["healing", "utility"]),
  quantity: z.number().int().nonnegative(),
  healAmount: z.number().int().positive().optional()
});

const EnemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hp: z.number().int().nonnegative(),
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
  drops: z.array(z.string()).optional(),
  role: z.enum(["attrition", "blocker", "status", "ambusher", "caster", "miniboss", "boss"]).optional(),
  dangerTier: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  isBoss: z.boolean().optional()
});

const CombatActionDeclarationSchema = z.object({
  actorId: z.string().min(1),
  action: z.enum(["attack", "defend", "use_item", "cast"]),
  targetGroupId: z.string().min(1).optional(),
  targetCharacterId: z.string().min(1).optional(),
  itemId: z.string().min(1).optional(),
  spellId: z.enum(["heal", "ward", "sleep"]).optional()
});

const CombatEnemyGroupSchema = z.object({
  id: z.string().min(1),
  enemyId: z.string().min(1),
  name: z.string().min(1),
  count: z.number().int().nonnegative(),
  hpEach: z.number().int().nonnegative(),
  maxHpEach: z.number().int().positive(),
  attack: z.number().int().nonnegative(),
  armor: z.number().int().nonnegative().default(0),
  accuracy: z.number().int().min(0).max(100).default(70),
  damageMin: z.number().int().nonnegative().default(1),
  damageMax: z.number().int().nonnegative().default(1),
  speed: z.number().int().nonnegative().default(4),
  morale: z.number().int().min(0).max(12).default(7),
  xp: z.number().int().nonnegative().default(0),
  gold: z.number().int().nonnegative().default(0),
  role: z.enum(["attrition", "blocker", "status", "ambusher", "caster", "miniboss", "boss"]).optional(),
  status: z.array(z.enum(["poison", "fear", "silence", "sleep", "ward"])).default([])
});

const CombatStateSchema = z.object({
  enemy: EnemySchema,
  roomId: z.string().min(1),
  round: z.number().int().positive().default(1),
  enemyGroups: z.array(CombatEnemyGroupSchema).default([]),
  pendingActions: z.array(CombatActionDeclarationSchema).default([]),
  selectedActorId: z.string().optional(),
  selectedTargetId: z.string().optional(),
  surprise: z.enum(["party", "enemy"]).optional()
});

const DungeonPositionSchema = z.object({
  roomId: z.string().min(1),
  facing: DirectionSchema
});

const DungeonMapStateSchema = z.object({
  floorId: z.string().nullable().default(null),
  currentRoomId: z.string().nullable().default(null),
  currentFacing: DirectionSchema.nullable().default(null),
  visitedRooms: z.array(z.string().min(1)),
  knownExits: z.record(z.array(DirectionSchema)),
  blockedExits: z.record(z.array(DirectionSchema)).default({}),
  secretCandidates: z.record(z.array(DirectionSchema)).default({})
});

const AdventureLogEntrySchema = z.object({
  id: z.string().min(1),
  turn: z.number().int().nonnegative(),
  text: z.string(),
  tags: z.array(z.string()),
  event: z.custom<GameEvent>().optional()
});

export const GameStateSchema = z.object({
  phase: GamePhaseSchema,
  party: z.array(CharacterSchema),
  position: DungeonPositionSchema.nullable(),
  combat: CombatStateSchema.nullable(),
  defeatedEnemies: z.array(z.string()),
  resolvedTraps: z.array(z.string()),
  discoveredSecrets: z.array(z.string()),
  inventory: z.array(InventoryItemSchema).default([]),
  map: DungeonMapStateSchema,
  log: z.array(AdventureLogEntrySchema),
  turn: z.number().int().nonnegative(),
  aiEnabled: z.boolean()
});

export const SaveDataV1Schema = z.object({
  schemaVersion: z.literal(1),
  savedAt: z.string().datetime(),
  scenario: z.object({
    worldId: z.string().min(1),
    title: z.string().min(1)
  }),
  settings: z
    .object({
      aiEnabled: z.boolean().default(true),
      locale: LocaleSchema.default("en")
    })
    .default({ aiEnabled: true, locale: "en" }),
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
