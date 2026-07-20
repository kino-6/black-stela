import type { AnyClassId, CharacterClassId, CombatRow, EquipmentSlot } from "./types";
import { resolveClassId } from "./classIds";
import type { TechniqueId } from "./techniques";

/**
 * WHAT A CLASS CAN DO — the class contract, in rules rather than in prose.
 *
 * docs/design/class-system.md §2.1: "a class is a rules identity, not a label. Every selectable class
 * needs a combat action or spell family, an exploration proficiency or clearly stated absence of one,
 * equipment/row consequences, and an observable weakness." The catalog in characterCreation.ts described
 * classes with `roleTags` — "damage", "mapping", "trap_handling" — which read like a contract but are
 * only strings. Exactly one of them was ever consulted by a rule (`trap_handling`, worth a flat +8 to a
 * chest attempt); the rest were explanation.
 *
 * This table is where a class's promise is now declared, and §7's three levels of access are what it is
 * declared in:
 *   untrained  — may still attempt ordinary work, at worse odds and with less information
 *   trained    — handles normal difficulty reliably
 *   specialist — safe at high difficulty, and learns more from the attempt
 * No class is ever the ONLY way through (§2.3): the tiers change cost, risk and information, never
 * permission.
 *
 * BEHAVIOUR IS UNCHANGED BY THIS FILE. The proficiencies below are exactly the old `trap_handling` and
 * `mapping` tags restated: the three trap classes are specialists (the same +8), everyone else is
 * untrained (the same +0). `trained` is real in the model and deliberately unused until the class
 * consolidation authors it — a tier introduced here would silently re-balance every chest in the game.
 */

export type Proficiency = "untrained" | "trained" | "specialist";

/**
 * The exploration actions a class can be measured against. `investigate` / `disarm` are what chests.ts
 * resolves today; `unlock`, `detectSecret` and `escape` are named because they are the Thief family's
 * identity (§5) and the rules that will read them are the next slice, not this one.
 */
export type ExplorationAction = "investigate" | "disarm" | "unlock" | "detectSecret" | "escape" | "map";

/** A technique the class learns, and the level it arrives at. */
export interface ClassTechniqueGrant {
  level: number;
  techniqueId: TechniqueId;
}

/**
 * What the class wears. NOTE the boundary: permission still lives in world data
 * (`equipment.allowedClasses`, read by economy.isEquipmentUsableBy) and this profile does not override
 * it — moving permission here would change what every existing adventurer may equip, which belongs to
 * the class consolidation (§8.3) with its save migration, not to this slice. Until then this is the
 * class's SHAPE: the slots it starts kitted for and the gear it is written around.
 */
export interface EquipmentProfile {
  slots: EquipmentSlot[];
  tags: string[];
}

export interface ClassCapabilities {
  combatTechniques: ClassTechniqueGrant[];
  exploration: Partial<Record<ExplorationAction, Proficiency>>;
  equipmentProfile: EquipmentProfile;
  rowPreference: CombatRow;
  /** The observable weakness §2.1 demands — what this class is bad at, in the player's terms. */
  weakness: { en: string; ja: string };
}

const TRAP_SPECIALIST: Partial<Record<ExplorationAction, Proficiency>> = {
  investigate: "specialist",
  disarm: "specialist",
  unlock: "specialist",
  detectSecret: "specialist"
};

export const CLASS_CAPABILITIES: Record<CharacterClassId, ClassCapabilities> = {
  warrior: {
    combatTechniques: [{ level: 1, techniqueId: "power-strike" }],
    exploration: {},
    equipmentProfile: { slots: ["weapon", "body"], tags: ["blade", "front_line"] },
    rowPreference: "front",
    weakness: { en: "No answer to anything the front line cannot reach.", ja: "前列の届かないものには手が出ない。" }
  },
  knight: {
    combatTechniques: [],
    exploration: {},
    equipmentProfile: { slots: ["offhand", "body"], tags: ["shield", "mail", "front_line"] },
    rowPreference: "front",
    weakness: { en: "Slow, and cannot press an advantage.", ja: "鈍く、好機を押し切れない。" }
  },
  swordmaster: {
    combatTechniques: [],
    exploration: {},
    equipmentProfile: { slots: ["weapon", "hands"], tags: ["blade", "accuracy"] },
    rowPreference: "front",
    weakness: { en: "Thin armour: a round that goes wrong goes very wrong.", ja: "装甲が薄い。崩れた一手が致命になる。" }
  },
  thief: {
    // The consolidation's clearest win: 探索者 / 斥候 / 鍵師 all carried the SAME trap bonus, so the
    // exploration family that was split three ways is one identity now.
    combatTechniques: [{ level: 1, techniqueId: "power-strike" }],
    exploration: { ...TRAP_SPECIALIST, map: "specialist", escape: "trained" },
    equipmentProfile: { slots: ["weapon", "hands"], tags: ["tools", "reach"] },
    rowPreference: "front",
    weakness: { en: "Reads the room better than it fights in it.", ja: "読むことに長け、戦うことには長けない。" }
  },
  priest: {
    combatTechniques: [{ level: 1, techniqueId: "heal" }],
    exploration: {},
    equipmentProfile: { slots: ["weapon", "body"], tags: ["focus", "back_row"] },
    rowPreference: "back",
    weakness: { en: "Almost no offence; the party must protect the source of its healing.", ja: "攻め手を持たない。回復の源は守られねばならない。" }
  },
  chanter: {
    combatTechniques: [
      { level: 1, techniqueId: "heal" },
      { level: 3, techniqueId: "sleep" }
    ],
    exploration: {},
    equipmentProfile: { slots: ["weapon", "body"], tags: ["focus", "ward", "back_row"] },
    rowPreference: "back",
    weakness: { en: "Everything it does, a specialist does better.", ja: "何でもこなすが、何も専門家には及ばない。" }
  },
  mage: {
    combatTechniques: [{ level: 1, techniqueId: "firebolt" }],
    exploration: {},
    equipmentProfile: { slots: ["weapon"], tags: ["focus", "back_row"] },
    rowPreference: "back",
    weakness: { en: "Runs on MP: out of it, out of the fight.", ja: "MPが尽きれば、戦いから降りるほかない。" }
  },
  occultist: {
    combatTechniques: [
      { level: 1, techniqueId: "firebolt" },
      { level: 3, techniqueId: "sleep" }
    ],
    exploration: {},
    equipmentProfile: { slots: ["weapon"], tags: ["focus", "back_row"] },
    rowPreference: "back",
    weakness: { en: "Control fails on what cannot be controlled; then it is nearly unarmed.", ja: "効かない相手には無力に等しい。" }
  }
};

export function classCapabilities(classId: AnyClassId): ClassCapabilities | undefined {
  return CLASS_CAPABILITIES[resolveClassId(classId)];
}

/** What a class knows about an exploration action. An unlisted action is untrained — never forbidden. */
export function classProficiency(classId: AnyClassId, action: ExplorationAction): Proficiency {
  // Resolved, so a character stored as a 斥候 is read with the Thief's contract without their save being
  // rewritten (characterCreation.LEGACY_CLASS_MAPPING documents every old id).
  return CLASS_CAPABILITIES[resolveClassId(classId)]?.exploration[action] ?? "untrained";
}

/**
 * The bonus a proficiency is worth to an attempt. The specialist's +8 is the number the old
 * `trap_handling` tag carried, kept exactly; `trained` sits between, and is unreachable until a class
 * declares it.
 */
export function proficiencyBonus(proficiency: Proficiency): number {
  switch (proficiency) {
    case "specialist":
      return 8;
    case "trained":
      return 4;
    default:
      return 0;
  }
}

/** Every technique a class ever learns, in the order it learns them. */
export function classTechniqueGrants(classId: AnyClassId): ClassTechniqueGrant[] {
  return CLASS_CAPABILITIES[resolveClassId(classId)]?.combatTechniques ?? [];
}
