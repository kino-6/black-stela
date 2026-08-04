import yaml from "js-yaml";
import { expandFloorMap, isMapFloor } from "./floorMap";
import { z } from "zod";
import type { Direction, DungeonFloor, DungeonGridCell, DungeonGridEdge, ScenarioAffix, ScenarioClassTechniques, ScenarioQuest, ScenarioTechnique, ScenarioVocation, ScenarioWorld } from "./types";
import { TECHNIQUES, validateTechnique, type Technique, type TechniqueId } from "./techniques";

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
  inflicts: z
    .object({
      status: z.enum(["poison", "fear", "silence", "sleep", "ward"]),
      chance: z.number().int().min(0).max(100)
    })
    .optional(),
  // An incoming-damage multiplier per element id (>1 weak, <1 resistant). The keys are the
  // world's own element ids — validated against `world.elements` by the loader, so a typo or an
  // element the world never declared fails at load rather than reading as multiplier 1 forever.
  weaknesses: z.record(z.string().min(1), z.number().min(0).max(4)).optional(),
  abilities: z
    .array(
      z.object({
        name: z.string().min(1),
        chance: z.number().int().min(0).max(100),
        // Who it strikes: front (default, tank soaks) / back (reaches the exposed casters) / any.
        target: z.enum(["front", "back", "any"]).optional(),
        // Localized ability name for the combat log (falls back to `name`).
        locales: z.record(z.object({ name: z.string().min(1).optional() })).optional(),
        effect: z.union([
          z.object({
            kind: z.literal("damage"),
            min: z.number().int().nonnegative(),
            max: z.number().int().nonnegative(),
            // The threat's element — any string; the loader checks it against `world.elements`.
            element: z.string().min(1)
          }),
          z.object({ kind: z.literal("status"), status: z.enum(["poison", "fear", "silence", "sleep", "ward"]) })
        ])
      })
    )
    .optional(),
  drops: z.array(z.string().min(1)).optional(),
  role: enemyRoleSchema.optional(),
  dangerTier: z.number().int().positive().optional(),
  level: z.number().int().positive().optional(),
  prizedXp: z.boolean().optional(),
  tags: z.array(z.string().min(1)).default([]),
  isBoss: z.boolean().optional(),
  elevation: z.enum(["ground", "mid", "air"]).optional(),
  size: z.enum(["small", "medium", "large", "huge"]).optional(),
  // Presentation only — see Enemy.hover. Does NOT gate melee reach; `elevation` does.
  hover: z.boolean().optional()
});

const trapSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  damage: z.number().int().nonnegative(),
  detectDc: z.number().int().positive(),
  warning: z.string().min(1).optional()
});

const equipmentSlotSchema = z.enum(["weapon", "offhand", "body", "head", "hands", "accessory"]);

const scenarioAffixSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  slots: z.array(equipmentSlotSchema).min(1),
  minFloor: z.number().int().positive(),
  rarity: z.enum(["common", "rare", "epic"]),
  weight: z.number().int().positive().optional(),
  attackBonus: z.number().int().optional(),
  defenseBonus: z.number().int().optional(),
  accuracyBonus: z.number().int().optional(),
  speedBonus: z.number().int().optional(),
  // IMP-022: affix effects beyond four flat bonuses, so gear can ANSWER an enemy family —
  // resilience (hp/mp), status/element wards, in-combat regen, and species/tag-specific bite.
  hpBonus: z.number().int().optional(),
  mpBonus: z.number().int().optional(),
  resistBonus: z.record(z.enum(["poison", "fear", "silence", "sleep", "ward"]), z.number().int().min(0).max(100)).optional(),
  elementResist: z.record(z.string().min(1), z.number().min(0).max(2)).optional(),
  // HP restored to the wearer at the start of each combat round they act.
  regen: z.number().int().positive().optional(),
  // A multiplier applied to this wearer's outgoing damage against enemies carrying `tag`.
  speciesBonus: z.object({ tag: z.string().min(1), multiplier: z.number().min(1).max(4) }).optional(),
  locales: z.record(z.object({ label: z.string().min(1).optional() })).optional()
});

const scenarioVocationSchema = z.object({
  id: z.string().min(1),
  tier: z.enum(["basic", "advanced"]),
  name: z.string().min(1),
  signature: z.string().min(1).optional(),
  requires: z
    .object({
      mastered: z.array(z.string().min(1)).optional(),
      minLevel: z.number().int().positive().optional()
    })
    .optional(),
  statModifiers: z
    .object({
      maxHp: z.number().int().optional(),
      maxMp: z.number().int().optional(),
      attack: z.number().int().optional(),
      damageMin: z.number().int().optional(),
      damageMax: z.number().int().optional(),
      accuracy: z.number().int().optional(),
      armor: z.number().int().optional(),
      speed: z.number().int().optional()
    })
    .optional(),
  allowedSlots: z.array(equipmentSlotSchema).optional(),
  grantsTechniques: z.array(z.string().min(1)).optional(),
  locales: z.record(z.object({ name: z.string().min(1).optional(), signature: z.string().min(1).optional() })).optional()
});

// ── Authored techniques (content/worlds/<id>/techniques.md) ─────────────────────────────────────────
// A Zod mirror of the Technique interface (domain/techniques.ts). A world may author only the effect
// KINDS the resolver already implements — externalising DEFINITIONS, never new mechanics. The honesty
// rules are NOT duplicated here: the post-parse refine calls the canonical validateTechnique so the
// authoring guardrail can never fork from the code path.
const combatStatusSchema = z.enum(["poison", "fear", "silence", "sleep", "ward"]);
const techniqueStatSchema = z.enum(["attack", "damage", "armor", "accuracy", "speed", "evasion"]);
const techniqueDurationSchema = z.union([
  z.object({ kind: z.literal("instant") }),
  z.object({ kind: z.literal("rounds"), rounds: z.number().int() }),
  z.object({ kind: z.literal("combat") })
]);
const techniqueEffectSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("heal"), amount: z.number().int(), scalesWithSpellPower: z.boolean().optional() }),
  z.object({
    kind: z.literal("damage"),
    min: z.number().int(),
    max: z.number().int(),
    element: z.string().min(1),
    scalesWithSpellPower: z.boolean().optional(),
    bonusVsStatus: z
      .object({ statuses: z.array(combatStatusSchema), bonusMin: z.number().int(), bonusMax: z.number().int(), consume: z.boolean().optional() })
      .optional()
  }),
  z.object({ kind: z.literal("status"), status: combatStatusSchema, duration: techniqueDurationSchema.optional() }),
  z.object({ kind: z.literal("cure"), statuses: z.array(combatStatusSchema) }),
  z.object({
    kind: z.literal("ward"),
    statusResist: z.record(combatStatusSchema, z.number()).optional(),
    elementResist: z.record(z.string().min(1), z.number()).optional(),
    duration: techniqueDurationSchema.optional()
  }),
  z.object({ kind: z.literal("buff"), stat: techniqueStatSchema, amount: z.number().int(), duration: techniqueDurationSchema.optional() }),
  z.object({ kind: z.literal("debuff"), stat: techniqueStatSchema, amount: z.number().int(), duration: techniqueDurationSchema.optional() }),
  z.object({ kind: z.literal("cover"), duration: techniqueDurationSchema.optional() })
]);
const passiveTechniqueBonusSchema = z.object({
  attack: z.number().int().optional(),
  armor: z.number().int().optional(),
  accuracy: z.number().int().optional(),
  speed: z.number().int().optional(),
  resistance: z.record(combatStatusSchema, z.number()).optional()
});
const scenarioTechniqueSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["spell", "skill", "passive"]),
    target: z.enum(["self", "ally", "party", "enemyGroup", "allEnemies"]),
    cost: z
      .object({
        mp: z.number().int().optional(),
        hp: z.number().int().optional(),
        itemId: z.string().min(1).optional(),
        usesPerExpedition: z.number().int().optional()
      })
      .default({}),
    effects: z.array(techniqueEffectSchema).default([]),
    duration: techniqueDurationSchema.default({ kind: "instant" }),
    tags: z.array(z.string().min(1)).optional(),
    passiveBonus: passiveTechniqueBonusSchema.optional(),
    // Per-locale display name (the built-in table lives in SPELL_LABEL/i18n; authored techniques carry
    // their own, exactly like authored vocations and enemy abilities).
    locales: z.record(z.string(), z.object({ name: z.string().min(1).optional() })).optional()
  })
  .superRefine((technique, ctx) => {
    for (const problem of validateTechnique(technique as unknown as Technique)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
    }
  });

// Authored class-learned lines (content/worlds/<id>/class-techniques.md). Each entry REPLACES one
// class's built-in combatTechniques with themed ids (resolveClassCapabilities). techniqueId is a free
// string; validateScenarioGraph checks it resolves and is not a firearm (a class never natively learns one).
const scenarioClassTechniquesSchema = z.object({
  classId: z.string().min(1),
  combatTechniques: z
    .array(z.object({ level: z.number().int().positive(), techniqueId: z.string().min(1) }))
    .default([])
});

const scenarioItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["healing", "utility", "key", "treasure", "escape", "cure", "focus", "growth", "ward", "throwable", "scroll"]),
  // §9.4c — the technique a ward charm / thrown flask / scroll performs. A free string so it may name an
  // AUTHORED technique (content/worlds/<id>/techniques.md), not only a built-in; validateScenarioGraph
  // rejects any id absent from the resolved catalog, so a world naming a technique that does not exist is
  // still caught at load rather than silently doing nothing mid-fight.
  useTechnique: z.string().min(1).optional(),
  // §9.4c — a tool that buys a better exploration attempt (lock picks, trap shims, a detection lens).
  // The TYPE and the spending rule existed since §9.2, but this schema field did not, so an authored
  // `explorationAid` was silently STRIPPED by the loader and the tool did nothing at all.
  explorationAid: z
    .object({
      actions: z.array(z.enum(["investigate", "disarm", "unlock", "detectSecret", "escape", "map"])).min(1),
      bonus: z.number().int()
    })
    .optional(),
  tier: z.number().int().nonnegative(),
  price: z.number().int().nonnegative().optional(),
  sellValue: z.number().int().nonnegative().optional(),
  healAmount: z.number().int().positive().optional(),
  restoreMp: z.number().int().positive().optional(),
  curesStatuses: z.array(z.enum(["poison", "fear", "silence", "sleep"])).optional(),
  // Permanent growth granted on use (outside combat); see ItemGrants. `xp` bypasses the falloff.
  grants: z
    .object({
      might: z.number().int().optional(),
      agility: z.number().int().optional(),
      spirit: z.number().int().optional(),
      wit: z.number().int().optional(),
      luck: z.number().int().optional(),
      maxHp: z.number().int().optional(),
      maxMp: z.number().int().optional(),
      attack: z.number().int().optional(),
      xp: z.number().int().positive().optional()
    })
    .optional(),
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
  hpBonus: z.number().int().optional(),
  mpBonus: z.number().int().optional(),
  resistBonus: z.record(z.enum(["poison", "fear", "silence", "sleep", "ward"]), z.number()).optional(),
  // A weapon's damage element (loader-checked against world.elements). Weapons only.
  element: z.string().min(1).optional(),
  // Incoming-damage multipliers per element id (loader-checked). <1 resistant, >1 vulnerable.
  elementResist: z.record(z.string().min(1), z.number().min(0).max(2)).optional(),
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
  /** Active combat techniques supplied by this equipped item (Terminal Line firearms). Free strings so
   *  they may name AUTHORED techniques; validateScenarioGraph checks each id against the resolved catalog. */
  grantsTechniques: z.array(z.string().min(1)).optional(),
  /** Passive techniques supplied while this item is equipped. */
  grantsPassives: z.array(z.string().min(1)).optional(),
  /** The stat change from a supplied passive, exported with the world for Godot's stat pipeline. */
  passiveBonus: z.object({
    attack: z.number().int().optional(),
    armor: z.number().int().optional(),
    accuracy: z.number().int().optional(),
    speed: z.number().int().optional(),
    resistance: z.record(z.enum(["poison", "fear", "silence", "sleep", "ward"]), z.number()).optional()
  }).optional(),
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
  // How many distinct enemy groups a roll may field at once (FC-style multi-group
  // fights). Default 1 = single group. Capped at the number of distinct entries.
  groupsMax: z.number().int().positive().optional(),
  groupsMin: z.number().int().positive().optional(),
  // When true, this table's rolls IGNORE the first-contact suppression (floorClearedEnemies), so its
  // enemy types keep appearing instead of the floor going silent once each has been met. Default
  // (omitted/false) = the deliberate first-contact model. Lets a scenario choose "always-populated"
  // vs "each foe is a set-piece" per encounter table (playtest #20).
  respawns: z.boolean().optional(),
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

// IMP-029 — an authored chest: a reward table + an optional trap. A bare `treasureTable` on a room
// still loads (as a plain chest) for back-compat; `chest` is how a scenario adds a trap + difficulty.
const chestTrapSchema = z.object({
  kind: z.enum(["needle", "gas", "rune", "snare"]),
  difficulty: z.number().int().positive(),
  damage: z.number().int().nonnegative()
});

const chestLockSchema = z.object({ difficulty: z.number().int().positive() });

const chestSchema = z.object({
  treasureTable: z.string().min(1),
  trap: chestTrapSchema.optional(),
  lock: chestLockSchema.optional()
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

const questRewardSchema = z.object({
  gold: z.number().int().nonnegative().optional(),
  // A direct XP grant per active member. It never runs through the combat-reward path, so the
  // out-levelling falloff cannot trim it — the mechanical reason a bounty stays worth doing.
  xp: z.number().int().positive().optional(),
  itemId: z.string().min(1).optional(),
  itemQuantity: z.number().int().positive().optional()
});

const scenarioQuestSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["bounty", "delivery"]),
  name: z.string().min(1),
  description: z.string().min(1),
  // A bounty names the enemy whose kills count; a delivery names the item the party hands over.
  // The loader checks each against the world's enemy/item catalogs (validateScenarioGraph).
  targetEnemyId: z.string().min(1).optional(),
  targetItemId: z.string().min(1).optional(),
  requiredCount: z.number().int().positive().default(1),
  repeatable: z.boolean().optional(),
  reward: questRewardSchema,
  locales: localizedNameDescriptionSchema.optional()
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
  // How a town-return reads to the player: literal stairs up (e.g. the floor-1
  // entrance) or the mystical return waystone. Defaults to the waystone.
  returnStyle: z.enum(["stairs", "marker"]).optional(),
  restPoint: z.boolean().optional(),
  spinner: z.boolean().optional(),
  teleportTo: z.string().optional(),
  damageTile: z.number().int().positive().optional(),
  gatherItem: z.string().optional(),
  trap: trapSchema.optional(),
  encounter: enemySchema.optional(),
  encounterSquad: z.array(z.string().min(1)).min(2).optional(),
  encounterTable: z.string().min(1).optional(),
  // A Wiz-style 玄室: its guardian is gated PER-ROOM (by this room's own chest claim), not by enemy-type
  // first contact — so every chamber on a floor is its own guaranteed fight even when they share a pack
  // table. Cleared once its chest is claimed; a fresh descent re-arms it. Set by genVerdantFloors.
  chamberGuardian: z.boolean().optional(),
  treasureTable: z.string().min(1).optional(),
  chest: chestSchema.optional(),
  gates: z.array(explorationGateSchema).default([]),
  zone: z.string().min(1).optional(),
  event: z.string().optional()
});

// Scene colour (fog/lights/wall+floor+ceiling tint, and lighting intensity/reach). Authored at the WORLD
// level (the scenario's base look) and, optionally, overridden per DUNGEON FLOOR so the descent can shift —
// a deeper floor darker/more corrupt than the entrance (IMP-063). A floor's palette merges OVER the world's;
// omitted keys fall through to the world value, then to the renderer's ash defaults.
export const scenePaletteSchema = z.object({
  fog: z.string().min(1).optional(),
  ambient: z.string().min(1).optional(),
  torch: z.string().min(1).optional(),
  front: z.string().min(1).optional(),
  wall: z.string().min(1).optional(),
  floor: z.string().min(1).optional(),
  ceiling: z.string().min(1).optional(),
  chamberFloor: z.string().min(1).optional(),
  chamberWall: z.string().min(1).optional(),
  chamberAccent: z.string().min(1).optional(),
  ambientEnergy: z.number().min(0).optional(),
  fogDensity: z.number().min(0).optional(),
  torchRange: z.number().min(0).optional()
});

export const dungeonFloorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // Optional per-floor palette override for the descent arc (IMP-063). Merges over the world palette.
  palette: scenePaletteSchema.optional(),
  locales: z.record(z.object({ name: z.string().min(1).optional() })).optional(),
  startRoom: z.string().min(1),
  grid: z.object({ cells: z.array(gridCellSchema).min(1) }).optional(),
  level: z.number().int().positive().optional(),
  role: floorRoleSchema.optional(),
  dangerTier: z.number().int().positive().optional(),
  recommendedPartyLevel: z.number().int().positive().optional(),
  recommendedPartySize: z.number().int().positive().optional(),
  recommendedClearLevel: z.number().int().positive().optional(),
  tags: z.array(z.string().min(1)).default([]),
  authorNotes: z.string().min(1).optional(),
  rooms: z.array(roomSchema).min(1)
});

export const scenarioWorldSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  // One line the player reads on the scenario card. Without it the card had nothing to
  // say and showed the raw pack id instead.
  tagline: z.string().min(1).optional(),
  locales: z
    .record(z.string(), z.object({ title: z.string().min(1).optional(), tagline: z.string().min(1).optional() }))
    .optional(),
  // Scenario-owned player-facing copy, keyed by locale then by translation key. Overrides the
  // i18n dictionary for this world only; anything omitted falls through. See createWorldTranslator.
  copy: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  // This world's elemental cosmology. Weaknesses and threats may only name these ids (plus the
  // universal `physical`). Each id carries a UI label and may localize it.
  elements: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        locales: z.record(z.string(), z.object({ label: z.string().min(1).optional() })).optional(),
        color: z.string().min(1).optional()
      })
    )
    .optional(),
  // Difficulty knobs the balance tuner settles (see domain/balance.ts). Applied once at world load.
  balance: z
    .object({
      threatScalar: z.number().positive().optional(),
      hpScalar: z.number().positive().optional(),
      counterplayBoost: z.number().positive().optional(),
      // Wandering-encounter density, scenario-authored (IMP-041); omitted ⇒ engine defaults.
      wanderingEncounterPct: z.number().int().positive().optional(),
      wanderingCooldownSteps: z.number().int().nonnegative().optional(),
      // Resource-scarcity / economy (docs/design/difficulty-design.md). Per-act arrays index by act
      // (0 = Act I …); omitted ⇒ modern no-scarcity behaviour. Data receptacle — see difficulty-design.
      economy: z
        .object({
          carryCap: z.array(z.number().int().positive()).optional(),
          stackCap: z.number().int().positive().optional(),
          priceScalar: z.array(z.number().positive()).optional(),
          incomeScalar: z.array(z.number().positive()).optional(),
          provisionKit: z
            .object({
              heals: z.number().int().nonnegative().optional(),
              cures: z.number().int().nonnegative().optional(),
              revives: z.number().int().nonnegative().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  assetPack: z.string().min(1).optional(),
  // Per-scenario scene colour (fog/lights/wall+floor+ceiling tint). Omitted → default ash. A floor may
  // override any of these (dungeonFloorSchema.palette) for the descent arc (IMP-063).
  palette: scenePaletteSchema.optional(),
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
  progressionFlags: z.array(progressionFlagSchema).default([]),
  quests: z.array(scenarioQuestSchema).default([]),
  vocations: z.array(scenarioVocationSchema).default([]),
  affixes: z.array(scenarioAffixSchema).default([]),
  techniques: z.array(scenarioTechniqueSchema).default([]),
  classTechniques: z.array(scenarioClassTechniquesSchema).default([])
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

export const scenarioQuestsSchema = z.object({
  quests: z.array(scenarioQuestSchema).default([])
});

export const scenarioVocationsSchema = z.object({
  vocations: z.array(scenarioVocationSchema).default([])
});

export const scenarioAffixesSchema = z.object({
  affixes: z.array(scenarioAffixSchema).default([])
});

export const scenarioTechniquesSchema = z.object({
  techniques: z.array(scenarioTechniqueSchema).default([])
});

export const scenarioClassTechniquesFileSchema = z.object({
  classTechniques: z.array(scenarioClassTechniquesSchema).default([])
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
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Scenario document is missing YAML front matter.");
  }

  const raw = yaml.load(match[1]);
  // A floor may be authored either as an explicit `grid`/`rooms` pair or as a
  // dense ASCII `map`; expand the latter into the canonical shape first.
  const source = isMapFloor(raw) ? expandFloorMap(raw) : raw;
  return dungeonFloorSchema.parse(source) as DungeonFloor;
}

export function parseScenarioWorld(
  worldMarkdown: string,
  dungeonMarkdowns: string[],
  data: Partial<
    Pick<
      ScenarioWorld,
      "items" | "equipment" | "shops" | "enemies" | "encounterTables" | "treasureTables" | "progressionFlags" | "quests" | "vocations" | "affixes" | "techniques" | "classTechniques"
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
    progressionFlags: data.progressionFlags ?? [],
    quests: data.quests ?? [],
    vocations: data.vocations ?? [],
    affixes: data.affixes ?? [],
    techniques: data.techniques ?? [],
    classTechniques: data.classTechniques ?? []
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

export function parseScenarioQuests(markdown: string): { quests: ScenarioQuest[] } {
  // parseMarkdownFrontMatter's generic collapses zod's input/output types, so a `.default()`
  // field (requiredCount) reads back as optional. The schema guarantees it at runtime; assert
  // the resolved shape so callers get the canonical ScenarioQuest.
  return parseMarkdownFrontMatter(markdown, scenarioQuestsSchema).data as { quests: ScenarioQuest[] };
}

export function parseScenarioVocations(markdown: string): { vocations: ScenarioVocation[] } {
  return parseMarkdownFrontMatter(markdown, scenarioVocationsSchema).data as { vocations: ScenarioVocation[] };
}

export function parseScenarioAffixes(markdown: string): { affixes: ScenarioAffix[] } {
  return parseMarkdownFrontMatter(markdown, scenarioAffixesSchema).data as { affixes: ScenarioAffix[] };
}

export function parseScenarioTechniques(markdown: string): { techniques: ScenarioTechnique[] } {
  return parseMarkdownFrontMatter(markdown, scenarioTechniquesSchema).data as { techniques: ScenarioTechnique[] };
}

export function parseScenarioClassTechniques(markdown: string): { classTechniques: ScenarioClassTechniques[] } {
  return parseMarkdownFrontMatter(markdown, scenarioClassTechniquesFileSchema).data as { classTechniques: ScenarioClassTechniques[] };
}

export function getRoom(world: ScenarioWorld, roomId: string) {
  const room = world.dungeons.flatMap((dungeon) => dungeon.rooms).find((candidate) => candidate.id === roomId);

  if (!room) {
    throw new Error(`Unknown room: ${roomId}`);
  }

  return room;
}

export function isBossFloor(world: ScenarioWorld, floorId: string | null): boolean {
  return Boolean(world.dungeons.find((dungeon) => dungeon.id === floorId)?.tags?.includes("boss"));
}

// A hidden passage (secret grid edge) is discovered per room+direction and the
// flag persists in discoveredSecrets.
export function secretKey(roomId: string, direction: Direction): string {
  return `secret:${roomId}:${direction}`;
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

// A player-facing floor name (e.g. "B2F - Split Dust") for a floor id, so the UI shows the authored
// title instead of the raw "dungeon.b2f" implementation id. Locale-aware: a JA route reads the floor's
// `locales.ja.name` (e.g. 蔦の回廊) instead of the English authored name (IMP-056).
export function floorName(world: ScenarioWorld, floorId: string | null | undefined, locale?: string): string {
  if (!floorId) {
    return "";
  }
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  if (!floor) {
    return floorId;
  }
  return (locale ? floor.locales?.[locale]?.name : undefined) ?? floor.name;
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
