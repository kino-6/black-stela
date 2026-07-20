import type { CombatStatus, Element } from "./types";

/**
 * THE TECHNIQUE CATALOG — the data shape a class's combat promise is written in.
 *
 * Why this exists (docs/design/class-system.md §3, §5): the game shipped twelve class labels standing on
 * FOUR abilities and a list of `roleTags`. A tag is a note to the designer; it is not something a class
 * can do. Worse, the old `Spell` shape could only express three things — heal a number, deal damage,
 * inflict one status — so healing arts, cures, wards, buffs, debuffs, party-wide effects, effects that
 * last, and anything costing something other than MP were not merely unwritten, they were UNWRITABLE.
 *
 * So the model comes first. This file defines what a technique can BE; the class table
 * (classCapabilities.ts) says who knows it. The catalog below is deliberately still the four techniques
 * the game already has, expressed in the new shape — this change is the vocabulary, not the content. New
 * families arrive with their balance pass (§5), and `validateTechnique` is what will hold them honest.
 *
 * Existing behaviour is preserved exactly: spells.ts derives the old `SPELLS` map from this catalog, so
 * every consumer (the combat resolver, the command menu, the career counter) sees what it always saw.
 */

/** The techniques the game currently ships. Widens as families are authored (§5). */
export type TechniqueId = "heal" | "firebolt" | "sleep" | "power-strike";

/** 呪文 (arcane, scales with spell power, stopped by silence) vs 特技 (martial, spends 気力). */
export type TechniqueKind = "spell" | "skill";

/**
 * Who a technique reaches. `ally`/`enemyGroup` are what the resolver understands today; the wider scopes
 * are here because a priest's purification and a chanter's party ward are party-wide by nature, and a
 * model that cannot say so forces those classes to be written as something they are not.
 */
export type TechniqueTarget = "self" | "ally" | "party" | "enemyGroup" | "allEnemies";

/** The stats a buff or a debuff can move. */
export type TechniqueStat = "attack" | "damage" | "armor" | "accuracy" | "speed" | "evasion";

/**
 * How long an effect lasts. `instant` resolves and is gone (a heal, a bolt); `combat` lasts until the
 * fight ends or it is removed — which is how the engine already treats afflictions, since they wear off
 * by roll rather than by counter; `rounds` is a fixed timer for effects that need one (a ward that must
 * be re-cast, a stance).
 */
export type TechniqueDuration =
  | { kind: "instant" }
  | { kind: "rounds"; rounds: number }
  | { kind: "combat" };

/**
 * What casting SPENDS. MP today; the other fields exist because a scroll, a thrown flask, and a
 * once-per-expedition art are all valid answers to a missing class (§4 "items are valid answers") and
 * each of them costs something that is not MP.
 */
export interface TechniqueCost {
  mp?: number;
  hp?: number;
  /** Consumes an inventory item — the shape a scroll or a thrown flask needs. */
  itemId?: string;
  /** A limited art: refreshed on return to town rather than by resting. */
  usesPerExpedition?: number;
}

export type TechniqueEffect =
  | { kind: "heal"; amount: number; scalesWithSpellPower?: boolean }
  | { kind: "damage"; min: number; max: number; element: Element; scalesWithSpellPower?: boolean }
  | { kind: "status"; status: CombatStatus; duration?: TechniqueDuration }
  /** Lifts afflictions — the priest's half of the status system, which had no shape at all. */
  | { kind: "cure"; statuses: CombatStatus[] }
  /** Raises resistance rather than removing a condition: the chanter's prevention half. */
  | { kind: "ward"; statusResist?: Partial<Record<CombatStatus, number>>; elementResist?: Record<string, number>; duration?: TechniqueDuration }
  | { kind: "buff"; stat: TechniqueStat; amount: number; duration?: TechniqueDuration }
  | { kind: "debuff"; stat: TechniqueStat; amount: number; duration?: TechniqueDuration };

export interface Technique {
  id: TechniqueId;
  kind: TechniqueKind;
  target: TechniqueTarget;
  cost: TechniqueCost;
  /** A technique may do more than one thing (a strike that also lowers defence); most do one. */
  effects: TechniqueEffect[];
  /**
   * The technique's default lifetime, and the one its lasting effects take unless they carry their own.
   * A mixed technique — an instant strike that ALSO leaves the target weakened for two rounds — is a
   * real design, so the instant halves simply resolve and the lasting halves read this.
   */
  duration: TechniqueDuration;
  /** Free-form grouping for authoring and UI ("recovery", "elemental", "control") — never a rule. */
  tags?: string[];
}

/**
 * The catalog. Same four techniques, same numbers, same costs as the old SPELLS map — see
 * tests/classCapabilities.test.ts, which pins the derived legacy view against the literal old table.
 */
export const TECHNIQUES: Record<TechniqueId, Technique> = {
  heal: {
    id: "heal",
    kind: "spell",
    target: "ally",
    cost: { mp: 3 },
    effects: [{ kind: "heal", amount: 8, scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["recovery"]
  },
  firebolt: {
    id: "firebolt",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 4 },
    effects: [{ kind: "damage", min: 4, max: 9, element: "fire", scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["elemental"]
  },
  sleep: {
    id: "sleep",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 3 },
    effects: [{ kind: "status", status: "sleep" }],
    // Afflictions end by the engine's wear-off roll, not by a counter — "until it ends" is the truth.
    duration: { kind: "combat" },
    tags: ["control"]
  },
  // 特技: a heavy front-row swing — more damage than a plain attack, at the cost of 気力 (the martial
  // pool), so the front line has a real choice too.
  "power-strike": {
    id: "power-strike",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 3 },
    effects: [{ kind: "damage", min: 6, max: 12, element: "physical" }],
    duration: { kind: "instant" },
    tags: ["martial"]
  }
};

export function findTechnique(id: string): Technique | undefined {
  return Object.prototype.hasOwnProperty.call(TECHNIQUES, id) ? TECHNIQUES[id as TechniqueId] : undefined;
}

export function techniqueMpCost(technique: Technique): number {
  return technique.cost.mp ?? 0;
}

/** 呪文 are stopped by silence and scale with spell power; 特技 are not and do not. */
export function isArcane(technique: Technique): boolean {
  return technique.kind === "spell";
}

/**
 * Problems with a technique definition, as sentences. Used by the tests that guard the catalog, and by
 * whoever authors the next family — a technique whose duration contradicts its effect, or which costs
 * nothing at all, is a balance hole rather than a design.
 */
export function validateTechnique(technique: Technique): string[] {
  const problems: string[] = [];
  if (technique.effects.length === 0) {
    problems.push(`${technique.id}: a technique with no effects does nothing`);
  }

  const cost = technique.cost;
  for (const [field, value] of [["mp", cost.mp], ["hp", cost.hp], ["usesPerExpedition", cost.usesPerExpedition]] as const) {
    if (value !== undefined && value < 0) {
      problems.push(`${technique.id}: ${field} cost cannot be negative`);
    }
  }
  const spendsSomething = Boolean(cost.mp || cost.hp || cost.itemId || cost.usesPerExpedition);
  if (!spendsSomething) {
    problems.push(`${technique.id}: spends nothing — a free technique is never a choice, it is the only move`);
  }

  let anyPersists = false;
  for (const effect of technique.effects) {
    // A lasting effect needs a lifetime: an "instant ward" is a mistake the author cannot see at the
    // call site. An effect may carry its own duration, so one technique can strike NOW and leave the
    // target weakened for two rounds.
    const persists = effect.kind === "ward" || effect.kind === "buff" || effect.kind === "debuff" || effect.kind === "status";
    if (persists) {
      anyPersists = true;
      const lifetime = ("duration" in effect && effect.duration) || technique.duration;
      if (lifetime.kind === "instant") {
        problems.push(`${technique.id}: ${effect.kind} needs a duration — it is not instant`);
      }
      if (lifetime.kind === "rounds" && lifetime.rounds <= 0) {
        problems.push(`${technique.id}: a duration of ${lifetime.rounds} rounds never applies`);
      }
    }
    if (effect.kind === "heal" && effect.amount <= 0) {
      problems.push(`${technique.id}: heals nothing`);
    }
    if (effect.kind === "damage" && effect.min > effect.max) {
      problems.push(`${technique.id}: damage range is inverted`);
    }
    if (effect.kind === "cure" && effect.statuses.length === 0) {
      problems.push(`${technique.id}: cures nothing`);
    }
  }

  // Nothing here lasts, so claiming a lifetime is the other half of the same mistake.
  if (!anyPersists && technique.duration.kind !== "instant") {
    problems.push(`${technique.id}: every effect resolves at once, so its duration must be instant`);
  }
  if (technique.duration.kind === "rounds" && technique.duration.rounds <= 0) {
    problems.push(`${technique.id}: a duration of ${technique.duration.rounds} rounds never applies`);
  }

  return problems;
}
