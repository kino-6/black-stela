import { z } from "zod";
import type { GameEvent, GameState, ScenarioWorld } from "./types";

const DirectionSchema = z.enum(["north", "east", "south", "west"]);
const GamePhaseSchema = z.enum(["town", "dungeon", "combat"]);
const LocaleSchema = z.enum(["en", "ja"]);
const LocalizedNameDescriptionSchema = z
  .object({
    en: z.object({ name: z.string().optional(), description: z.string().optional() }).optional(),
    ja: z.object({ name: z.string().optional(), description: z.string().optional() }).optional()
  });
const EquipmentSlotSchema = z.enum(["weapon", "offhand", "body", "head", "hands", "accessory"]);
const EquipmentRecordSchema = z
  .object({
    weapon: z.string().min(1).optional(),
    offhand: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    armor: z.string().min(1).optional(),
    head: z.string().min(1).optional(),
    hands: z.string().min(1).optional(),
    accessory: z.string().min(1).optional()
  })
  .transform(({ armor, ...equipment }) => ({
    ...equipment,
    body: equipment.body ?? armor
  }));

const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  notes: z.string(),
  title: z.string().default("Vanguard"),
  classId: z.enum(["vanguard", "seeker", "mender", "occultist"]).default("vanguard"),
  roleTags: z.array(z.string().min(1)).default(["front_line", "damage", "retreat_guard"]),
  rowPreference: z.enum(["front", "back"]).default("front"),
  backgroundId: z.enum(["watch", "ruinborn", "apothecary", "debtor", "cartographer"]).default("watch"),
  aptitude: z
    .object({
      might: z.number().int().nonnegative().default(2),
      agility: z.number().int().nonnegative().default(2),
      spirit: z.number().int().nonnegative().default(2),
      wit: z.number().int().nonnegative().default(2),
      luck: z.number().int().nonnegative().default(2)
    })
    .default({ might: 2, agility: 2, spirit: 2, wit: 2, luck: 2 }),
  traitIds: z.array(z.enum(["steady", "scarred", "lucky", "grim", "curious"])).default(["steady"]),
  accentColor: z.string().default("#c9a765"),
  startingEquipment: z.array(z.string().min(1)).default(["worn mail", "short sword"]),
  equipment: EquipmentRecordSchema.default({}),
  creation: z
    .object({
      method: z.enum(["legacy", "quick", "detailed", "template", "debug"]).default("legacy"),
      seed: z.string().optional(),
      registeredAtTurn: z.number().int().nonnegative().default(0)
    })
    .default({ method: "legacy", registeredAtTurn: 0 }),
  memory: z
    .object({
      firstExpeditionTurn: z.number().int().nonnegative().optional(),
      deepestFloorId: z.string().optional(),
      injuries: z.number().int().nonnegative().default(0),
      retreats: z.number().int().nonnegative().default(0),
      notableVictories: z.array(z.string()).default([]),
      deeds: z.array(z.string()).default([])
    })
    .default({ injuries: 0, retreats: 0, notableVictories: [], deeds: [] }),
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
  kind: z.enum(["healing", "utility", "key", "treasure", "equipment"]),
  quantity: z.number().int().nonnegative(),
  healAmount: z.number().int().positive().optional(),
  slot: EquipmentSlotSchema.optional(),
  attackBonus: z.number().int().optional(),
  defenseBonus: z.number().int().optional(),
  accuracyBonus: z.number().int().optional(),
  speedBonus: z.number().int().optional(),
  sellValue: z.number().int().nonnegative().optional()
});

const EnemySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  locales: LocalizedNameDescriptionSchema.optional(),
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
  cellId: z.string().min(1).optional(),
  facing: DirectionSchema
});

const DungeonMapStateSchema = z.object({
  floorId: z.string().nullable().default(null),
  currentRoomId: z.string().nullable().default(null),
  currentCellId: z.string().nullable().default(null),
  currentFacing: DirectionSchema.nullable().default(null),
  visitedRooms: z.array(z.string().min(1)),
  visitedCells: z.array(z.string().min(1)).default([]),
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
  partyGold: z.number().int().nonnegative().default(75),
  claimedTreasures: z.array(z.string()).default([]),
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
