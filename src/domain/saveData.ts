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
const EquippedItemSchema = z.object({
  id: z.string().min(1),
  plus: z.number().int().positive().optional(),
  affix: z.string().min(1).optional()
});
const EquipmentRecordSchema = z.object({
  weapon: EquippedItemSchema.optional(),
  offhand: EquippedItemSchema.optional(),
  body: EquippedItemSchema.optional(),
  head: EquippedItemSchema.optional(),
  hands: EquippedItemSchema.optional(),
  accessory: EquippedItemSchema.optional()
});

const CharacterVisualProfileSchema = z.object({
  baseRef: z.string().optional(),
  battleRef: z.string().optional(),
  focusX: z.number().min(0).max(100).default(50),
  focusY: z.number().min(0).max(100).default(38)
});

const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  notes: z.string(),
  title: z.string().default("Vanguard"),
  classId: z
    .enum([
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
    .default("vanguard"),
  roleTags: z.array(z.string().min(1)).default(["front_line", "damage", "retreat_guard"]),
  rowPreference: z.enum(["front", "back"]).default("front"),
  backgroundId: z
    .enum([
      "watch",
      "ruinborn",
      "apothecary",
      "debtor",
      "cartographer",
      "shrine_ward",
      "caravan_guard",
      "pit_fighter",
      "scriptorium",
      "grave_tender",
      "dock_rat",
      "deserter"
    ])
    .default("watch"),
  aptitude: z
    .object({
      might: z.number().int().nonnegative().default(2),
      agility: z.number().int().nonnegative().default(2),
      spirit: z.number().int().nonnegative().default(2),
      wit: z.number().int().nonnegative().default(2),
      luck: z.number().int().nonnegative().default(2)
    })
    .default({ might: 2, agility: 2, spirit: 2, wit: 2, luck: 2 }),
  traitIds: z
    .array(
      z.enum([
        "steady",
        "scarred",
        "lucky",
        "grim",
        "curious",
        "cautious",
        "bold",
        "devout",
        "nimble",
        "stubborn",
        "sharp_eyed",
        "soft_spoken"
      ])
    )
    .default(["steady"]),
  accentColor: z.string().default("#c9a765"),
  startingEquipment: z.array(z.string().min(1)).default(["worn mail", "short sword"]),
  equipment: EquipmentRecordSchema.default({}),
  creation: z
    .object({
      method: z.enum(["legacy", "quick", "detailed", "template", "debug", "import"]).default("legacy"),
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
  visualProfile: CharacterVisualProfileSchema.optional(),
  // IMP-021A vocation/mastery state (optional; resolveVocationState defaults it from classId).
  vocation: z
    .object({
      current: z.string().min(1),
      mastery: z.record(z.string(), z.number().int().nonnegative()).default({}),
      progress: z.record(z.string(), z.number().nonnegative()).default({}),
      learned: z.array(z.string().min(1)).default([]),
      loadout: z.array(z.string().min(1)).default([])
    })
    .optional(),
  row: z.enum(["front", "back"]).default("front"),
  level: z.number().int().positive().default(1),
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  mp: z.number().int().nonnegative().default(0),
  maxMp: z.number().int().nonnegative().default(0),
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
  kind: z.enum(["healing", "utility", "key", "treasure", "equipment", "escape"]),
  quantity: z.number().int().nonnegative(),
  healAmount: z.number().int().positive().optional(),
  slot: EquipmentSlotSchema.optional(),
  attackBonus: z.number().int().optional(),
  defenseBonus: z.number().int().optional(),
  accuracyBonus: z.number().int().optional(),
  speedBonus: z.number().int().optional(),
  sellValue: z.number().int().nonnegative().optional(),
  plus: z.number().int().positive().optional(),
  affix: z.string().min(1).optional()
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
  // Element weaknesses were being dropped on save, so a reloaded fight lost every element
  // interaction — the salt blade stopped mattering the moment you continued a run.
  weaknesses: z.record(z.string(), z.number()).optional(),
  role: z.enum(["attrition", "blocker", "status", "ambusher", "caster", "miniboss", "boss"]).optional(),
  dangerTier: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  isBoss: z.boolean().optional(),
  // How the creature is staged. Both were being dropped on save, so a reloaded fight
  // re-staged every enemy on the floor at one size.
  elevation: z.enum(["ground", "mid", "air"]).optional(),
  size: z.enum(["small", "medium", "large", "huge"]).optional()
});

const CombatActionDeclarationSchema = z.object({
  actorId: z.string().min(1),
  action: z.enum(["attack", "defend", "use_item", "cast"]),
  targetGroupId: z.string().min(1).optional(),
  targetCharacterId: z.string().min(1).optional(),
  itemId: z.string().min(1).optional(),
  spellId: z.enum(["heal", "firebolt", "sleep"]).optional()
});

const CombatEnemyGroupSchema = z.object({
  id: z.string().min(1),
  enemyId: z.string().min(1),
  name: z.string().min(1),
  count: z.number().int().nonnegative(),
  initialCount: z.number().int().positive().optional(),
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
  // The group carries the enemy's weaknesses/elevation/level (createCombatState copies them), so a
  // reloaded fight must keep them or the element interactions and XP falloff vanish on continue.
  weaknesses: z.record(z.string(), z.number()).optional(),
  elevation: z.enum(["ground", "mid", "air"]).optional(),
  level: z.number().int().positive().optional(),
  dangerTier: z.number().int().positive().optional(),
  prizedXp: z.boolean().optional(),
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

const CombatConclusionSchema = z.object({
  enemyIds: z.array(z.string().min(1)),
  enemyNames: z.array(z.string().min(1)),
  xp: z.number().int().nonnegative(),
  gold: z.number().int().nonnegative(),
  levelUps: z.array(z.object({
    characterId: z.string().min(1).optional(),
    name: z.string().min(1),
    level: z.number().int().positive()
  })),
  resumePosition: DungeonPositionSchema.nullable()
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
  reserve: z.array(CharacterSchema).default([]),
  retired: z.array(CharacterSchema).default([]),
  position: DungeonPositionSchema.nullable(),
  combat: CombatStateSchema.nullable(),
  combatConclusion: CombatConclusionSchema.nullable().optional(),
  defeatedEnemies: z.array(z.string()),
  floorClearedEnemies: z.array(z.string()).default([]),
  stepsSinceEncounter: z.number().default(0),
  // Optional so existing saves load; an old save simply reads as "has descended" once it is
  // in the dungeon, and as a first departure otherwise — which is what it was.
  expeditions: z.number().default(0),
  resolvedTraps: z.array(z.string()),
  discoveredSecrets: z.array(z.string()),
  inventory: z.array(InventoryItemSchema).default([]),
  partyGold: z.number().int().nonnegative().default(75),
  claimedTreasures: z.array(z.string()).default([]),
  floorClaimedTreasures: z.array(z.string()).default([]),
  map: DungeonMapStateSchema,
  log: z.array(AdventureLogEntrySchema),
  turn: z.number().int().nonnegative(),
  aiEnabled: z.boolean(),
  // Optional so existing saves load with no accepted quests — same reasoning as `expeditions`.
  quests: z
    .array(
      z.object({
        questId: z.string().min(1),
        status: z.enum(["active", "done"]).default("active"),
        killCount: z.number().int().nonnegative().default(0),
        claims: z.number().int().nonnegative().default(0)
      })
    )
    .default([])
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

// Save-schema migration policy (Lane G — Desktop Productization).
// Every save carries a numeric `schemaVersion`. LATEST_SAVE_SCHEMA_VERSION is the
// version this build writes. On load, an older save is upgraded FORWARD one version
// at a time through the MIGRATIONS chain before validation, so old saves keep
// working across releases. A save NEWER than LATEST is refused with a clear message
// (a newer build wrote it — the user must update rather than silently lose data).
//
// To introduce SaveDataV2: (1) bump LATEST to 2; (2) add SaveDataV2Schema +
// toSaveDataV2; (3) add MIGRATIONS[2] mapping a parsed V1 object to the V2 shape;
// (4) point `parseSaveData` at SaveDataV2Schema. Nothing else changes — the repos
// already call `parseSaveData`, so migration runs everywhere a save is read.
export const LATEST_SAVE_SCHEMA_VERSION = 1;

type SaveMigration = (input: Record<string, unknown>) => Record<string, unknown>;

// MIGRATIONS[n] upgrades a v(n-1) save to v(n). Empty until V2 lands.
const MIGRATIONS: Record<number, SaveMigration> = {};

export function migrateSaveData(input: unknown): unknown {
  const parsed = z.object({ schemaVersion: z.number() }).safeParse(input);
  if (!parsed.success) {
    return input; // not a versioned save — let the schema validator report it
  }

  let version = parsed.data.schemaVersion;
  if (version > LATEST_SAVE_SCHEMA_VERSION) {
    throw new Error(
      `Save schema version ${version} is newer than this build supports (${LATEST_SAVE_SCHEMA_VERSION}); update the app.`
    );
  }

  let data = input as Record<string, unknown>;
  while (version < LATEST_SAVE_SCHEMA_VERSION) {
    const next = version + 1;
    const migrate = MIGRATIONS[next];
    if (!migrate) {
      throw new Error(`No migration registered to save schema version ${next}.`);
    }
    data = migrate(data);
    version = next;
  }

  return data;
}

// Migrate an incoming save forward, then validate it against the current schema.
// This is the single entry point the save repositories use on load.
export function parseSaveData(input: unknown): SaveDataV1 {
  return parseSaveDataV1(migrateSaveData(input));
}

export function fromSaveDataV1(input: SaveDataV1 | unknown): GameState {
  return parseSaveData(input).state;
}
