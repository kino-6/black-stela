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

/**
 * The techniques the game ships. §9.4a added the first member of each family the resolver could not
 * previously carry out; §9.4b authored the rest of the growth lines §5 asks for.
 *
 * SIX PER CLASS, deliberately. §5 says "roughly six to ten", and `LOADOUT_LIMIT` is 6 — a class with
 * seven would have its SEVENTH silently dropped from the default loadout, because that loadout is the
 * first six learned, i.e. the lowest levels. A capstone the player never sees unless they hand-edit the
 * loadout is worse than one that does not exist. If a class ever grows past six, the default-loadout
 * rule has to be fixed first.
 *
 * Elements are `physical` or `fire` ONLY. An element is a WORLD's cosmology (`world.md` `elements:`),
 * and these techniques are ENGINE code shared by every scenario; `fire` is the one element both the ash
 * pit and the drowned wood declare. A technique naming `salt` would be uncastable in Verdant.
 */
export type TechniqueId =
  // Recovery and cures
  | "heal"
  | "lesser-heal"
  | "greater-heal"
  | "sanctuary"
  | "purge"
  | "purification"
  // Wards and party song
  | "ward-hymn"
  | "battle-hymn"
  | "ember-chant"
  | "clarion-hymn"
  | "blessing"
  // Arcane damage
  | "firebolt"
  | "force-lance"
  | "flame-wave"
  | "conflagration"
  | "immolation"
  | "enfeeble"
  // Occult control
  | "sleep"
  | "dread"
  | "silence-hex"
  | "sunder"
  | "wither"
  | "life-siphon"
  // Warrior
  | "power-strike"
  | "shield-splitter"
  | "war-cry"
  | "sweeping-blow"
  | "second-wind"
  | "executioner"
  // Knight
  | "bulwark-blow"
  | "shield-wall"
  | "cover"
  | "challenge"
  | "iron-oath"
  | "unbroken"
  // Swordmaster
  | "precise-thrust"
  | "flowing-stance"
  | "riposte"
  | "crescent-cut"
  | "still-water"
  | "finishing-cut"
  // Thief
  | "hamstring"
  | "smoke-veil"
  | "shadow-step"
  | "blinding-dust"
  | "backstab"
  // §7B — exclusive advanced-vocation signatures (no basic class teaches these)
  | "star-nova"
  | "spore-burst"
  | "ash-stance"
  | "sheltering-prayer"
  | "needle-flurry"
  | "dust-volley"
  | "candle-ward"
  | "thorn-guard"
  | "bark-field"
  | "dew-cut"
  | "canopy-read"
  | "sap-weave";

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
  | {
      kind: "damage";
      min: number;
      max: number;
      element: Element;
      scalesWithSpellPower?: boolean;
      /**
       * §7B (class-system.md §7A gap 2) — the DETONATE / exploit-the-afflicted primitive. Extra damage
       * when the target group already carries one of `statuses`. `consume: true` spends that status on
       * the hit (a detonation — it cannot be re-triggered on the same affliction); omitted, the status
       * stays (an assassin exploiting a standing one). The damage effect could not read a target's status
       * before, so the hexer's detonate and the assassin's exploit were unbuildable (§7A).
       */
      bonusVsStatus?: { statuses: CombatStatus[]; bonusMin: number; bonusMax: number; consume?: boolean };
    }
  | { kind: "status"; status: CombatStatus; duration?: TechniqueDuration }
  /** Lifts afflictions — the priest's half of the status system, which had no shape at all. */
  | { kind: "cure"; statuses: CombatStatus[] }
  /** Raises resistance rather than removing a condition: the chanter's prevention half. */
  | { kind: "ward"; statusResist?: Partial<Record<CombatStatus, number>>; elementResist?: Record<string, number>; duration?: TechniqueDuration }
  | { kind: "buff"; stat: TechniqueStat; amount: number; duration?: TechniqueDuration }
  | { kind: "debuff"; stat: TechniqueStat; amount: number; duration?: TechniqueDuration }
  /**
   * §9.4b — the Knight's signature, and the only reason a Knight is a distinct class rather than a
   * warrior with more armour. While it runs, an enemy's BASIC attack lands on the coverer instead of
   * whoever it would have picked. Enemy ABILITIES deliberately ignore it: a back-row-seeking ability is
   * the counterplay, so cover is formation stability, not immunity.
   */
  | { kind: "cover"; duration?: TechniqueDuration };

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
 * Effects that make sense between fights. Combat-duration wards and buffs deliberately do not qualify:
 * the combat-effect store is reset when a battle ends, so silently making them persistent here would
 * invent a second rules system. New exploration utilities should add an explicit effect primitive and
 * extend this predicate together with its resolver.
 */
export function isCampUsableTechnique(technique: Technique): boolean {
  if (technique.target !== "self" && technique.target !== "ally" && technique.target !== "party") {
    return false;
  }
  return technique.effects.length > 0 && technique.effects.every((effect) => effect.kind === "heal" || effect.kind === "cure");
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
  },

  // ——— §9.4: the first member of each family the resolver learned to carry out ———

  // Priest. The cure half of the status system: poison and silence both had inflictors and no answer
  // but an item, which is what made the priest's promise ("healing, cures, purification") half-true.
  purge: {
    id: "purge",
    kind: "spell",
    target: "ally",
    cost: { mp: 4 },
    effects: [{ kind: "cure", statuses: ["poison", "silence"] }],
    duration: { kind: "instant" },
    tags: ["recovery", "cure"]
  },
  // Chanter. PREVENTION rather than removal — the other half of the priest/chanter split in §4. Party
  // scope and a whole-fight duration are exactly the two things the old resolver could not express, so
  // this technique is also the honest proof that it now can.
  "ward-hymn": {
    id: "ward-hymn",
    kind: "spell",
    target: "party",
    cost: { mp: 6 },
    // §9.4e TUNING: 25/25 left the Chanter only narrowly ahead of a one-shot charm. The ward line is
    // this class's whole reason to hold a back-row slot, so the specialist's own ward is the one that
    // clearly works: 35 on the two conditions it owns, and nothing on poison (that is the Priest's).
    effects: [{ kind: "ward", statusResist: { fear: 35, sleep: 35 } }],
    duration: { kind: "combat" },
    tags: ["ward"]
  },
  // Chanter. A party buff on a fixed timer: strong while it runs, and it must be re-sung. Rounds rather
  // than `combat` so the chanter keeps spending turns on it instead of buying a permanent bonus once.
  "battle-hymn": {
    id: "battle-hymn",
    kind: "spell",
    target: "party",
    cost: { mp: 5 },
    effects: [{ kind: "buff", stat: "damage", amount: 2 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["buff"]
  },
  // Occultist. Defence weakening — control that helps the WHOLE party's weapons rather than duplicating
  // the mage's damage, which is the line §5 draws between the two.
  sunder: {
    id: "sunder",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 4 },
    effects: [{ kind: "debuff", stat: "armor", amount: 3 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["control", "debuff"]
  },

  // ——————————————— §9.4b: the rest of the growth lines (§5) ———————————————

  // ——— Priest: recovery, cures, purification, later larger recovery (§5) ———
  "greater-heal": {
    id: "greater-heal",
    kind: "spell",
    target: "ally",
    cost: { mp: 6 },
    effects: [{ kind: "heal", amount: 18, scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["recovery"]
  },
  // The priest's "simple wards" (§4 secondary): prevention, but narrower and later than the chanter's,
  // so it supports the chanter rather than replacing them.
  blessing: {
    id: "blessing",
    kind: "spell",
    target: "party",
    cost: { mp: 6 },
    // §9.4e TUNING: fear/sleep were 15 each, and the coverage sim measured this ward as WORSE THAN
    // BRINGING NOTHING — it cost a turn to cast and prevented too little to pay for it (18 afflicted
    // member-rounds against 13 for a party with no ward at all). A "simple ward" (§4) that loses to no
    // ward is not a lesser answer, it is a trap. Raised to 20, still clearly under the Chanter's line.
    effects: [{ kind: "ward", statusResist: { poison: 25, fear: 20, sleep: 20 } }],
    duration: { kind: "combat" },
    tags: ["ward"]
  },
  // Purification: the whole party, every ailment. Expensive and late — the answer to a fight that has
  // gone wrong, not a routine cleanup.
  purification: {
    id: "purification",
    kind: "spell",
    target: "party",
    cost: { mp: 8 },
    effects: [{ kind: "cure", statuses: ["poison", "silence", "fear", "sleep"] }],
    duration: { kind: "instant" },
    tags: ["recovery", "cure"]
  },
  sanctuary: {
    id: "sanctuary",
    kind: "spell",
    target: "party",
    cost: { mp: 10 },
    effects: [{ kind: "heal", amount: 12, scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["recovery"]
  },

  // ——— Chanter: wards, buffs, resistance, "a deliberately weaker emergency heal" (§5) ———
  // THE POINT of this one: the chanter used to share the priest's `heal` outright, which flatly
  // contradicts §5 and left "everything it does, a specialist does better" untrue for healing — it did
  // it exactly as well. 5 against the priest's 8, so the chanter can save someone but never replace the
  // priest.
  "lesser-heal": {
    id: "lesser-heal",
    kind: "spell",
    target: "ally",
    cost: { mp: 3 },
    effects: [{ kind: "heal", amount: 5, scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["recovery"]
  },
  // Elemental resistance as a MULTIPLIER, the same currency gear uses, so a warded party can commit to
  // shrugging off the one element a floor leans on.
  "ember-chant": {
    id: "ember-chant",
    kind: "spell",
    target: "party",
    cost: { mp: 6 },
    effects: [{ kind: "ward", elementResist: { fire: 0.6 } }],
    duration: { kind: "combat" },
    tags: ["ward"]
  },
  "clarion-hymn": {
    id: "clarion-hymn",
    kind: "spell",
    target: "party",
    cost: { mp: 7 },
    effects: [
      { kind: "buff", stat: "accuracy", amount: 8 },
      { kind: "buff", stat: "speed", amount: 2 }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["buff"]
  },

  // ——— Mage: single-target and group elemental attacks plus utility (§5) ———
  // A physical bolt so the mage is not helpless against a fire-resistant floor — the "utility" half,
  // and the second choice §5 wants available at creation.
  "force-lance": {
    id: "force-lance",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 3 },
    effects: [{ kind: "damage", min: 5, max: 9, element: "physical", scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["elemental"]
  },
  // GROUP damage — every pack at once. This is the mage's real signature and the reason the class is
  // worth a back-row slot: `allEnemies` was unreachable before §9.4a.
  "flame-wave": {
    id: "flame-wave",
    kind: "spell",
    target: "allEnemies",
    cost: { mp: 8 },
    effects: [{ kind: "damage", min: 4, max: 8, element: "fire", scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["elemental"]
  },
  enfeeble: {
    id: "enfeeble",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [{ kind: "debuff", stat: "damage", amount: 3 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["debuff"]
  },
  conflagration: {
    id: "conflagration",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 9 },
    effects: [{ kind: "damage", min: 12, max: 20, element: "fire", scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["elemental"]
  },
  immolation: {
    id: "immolation",
    kind: "spell",
    target: "allEnemies",
    cost: { mp: 12 },
    effects: [{ kind: "damage", min: 9, max: 15, element: "fire", scalesWithSpellPower: true }],
    duration: { kind: "instant" },
    tags: ["elemental"]
  },

  // ——— Occultist: sleep, fear, silence, accuracy/defence weakening, a limited survival tool (§5) ———
  // Fear and silence did NOTHING to an enemy group before §9.4b — only sleep was read. Both are wired
  // now (fear costs the pack accuracy; silence cuts it down to its basic swing), which is what lets the
  // Occultist be written as control rather than as a second mage.
  dread: {
    id: "dread",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 3 },
    effects: [{ kind: "status", status: "fear" }],
    duration: { kind: "combat" },
    tags: ["control"]
  },
  "silence-hex": {
    id: "silence-hex",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [{ kind: "status", status: "silence" }],
    duration: { kind: "combat" },
    tags: ["control"]
  },
  wither: {
    id: "wither",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 6 },
    effects: [{ kind: "debuff", stat: "damage", amount: 4 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["control", "debuff"]
  },
  // The "limited survival tool" (§5) / "drains" (§4). An enemy-scope technique carrying a heal restores
  // the CASTER — see the drain rule in the resolver. Modest numbers: it keeps an occultist standing, it
  // does not make them a healer.
  "life-siphon": {
    id: "life-siphon",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 4 },
    effects: [
      { kind: "damage", min: 4, max: 7, element: "physical", scalesWithSpellPower: true },
      { kind: "heal", amount: 4 }
    ],
    duration: { kind: "instant" },
    tags: ["control", "recovery"]
  },

  // ——— Warrior: heavy pressure (§5). 特技 spend the small 気力 pool, so costs stay low. ———
  "shield-splitter": {
    id: "shield-splitter",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 4 },
    effects: [
      { kind: "damage", min: 4, max: 8, element: "physical" },
      { kind: "debuff", stat: "armor", amount: 2, duration: { kind: "rounds", rounds: 2 } }
    ],
    duration: { kind: "instant" },
    tags: ["martial", "debuff"]
  },
  "war-cry": {
    id: "war-cry",
    kind: "skill",
    target: "self",
    cost: { mp: 3 },
    effects: [{ kind: "buff", stat: "damage", amount: 3 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  "sweeping-blow": {
    id: "sweeping-blow",
    kind: "skill",
    target: "allEnemies",
    cost: { mp: 5 },
    effects: [{ kind: "damage", min: 3, max: 6, element: "physical" }],
    duration: { kind: "instant" },
    tags: ["martial"]
  },
  "second-wind": {
    id: "second-wind",
    kind: "skill",
    target: "self",
    cost: { mp: 4 },
    // No spell-power scaling: a 特技 is not arcane, so this is a flat, reliable patch rather than a heal.
    effects: [{ kind: "heal", amount: 10 }],
    duration: { kind: "instant" },
    tags: ["martial", "recovery"]
  },
  executioner: {
    id: "executioner",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 6 },
    effects: [{ kind: "damage", min: 12, max: 20, element: "physical" }],
    duration: { kind: "instant" },
    tags: ["martial"]
  },

  // ——— Knight: cover, defence, formation stability (§4) ———
  "bulwark-blow": {
    id: "bulwark-blow",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 3 },
    effects: [{ kind: "damage", min: 4, max: 8, element: "physical" }],
    duration: { kind: "instant" },
    tags: ["martial"]
  },
  "shield-wall": {
    id: "shield-wall",
    kind: "skill",
    target: "self",
    cost: { mp: 3 },
    effects: [{ kind: "buff", stat: "armor", amount: 4 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  // THE Knight. Without it the class is a warrior with more armour and no reason to exist (§3's finding
  // in miniature). Three rounds, so holding the line is a rhythm the player keeps paying for.
  cover: {
    id: "cover",
    kind: "skill",
    target: "self",
    cost: { mp: 4 },
    effects: [{ kind: "cover" }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "cover"]
  },
  challenge: {
    id: "challenge",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 4 },
    effects: [{ kind: "debuff", stat: "accuracy", amount: 12 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "debuff"]
  },
  "iron-oath": {
    id: "iron-oath",
    kind: "skill",
    target: "party",
    cost: { mp: 5 },
    effects: [{ kind: "buff", stat: "armor", amount: 2 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  unbroken: {
    id: "unbroken",
    kind: "skill",
    target: "self",
    cost: { mp: 5 },
    effects: [
      { kind: "heal", amount: 12 },
      { kind: "ward", statusResist: { fear: 30 } }
    ],
    duration: { kind: "combat" },
    tags: ["martial", "recovery"]
  },

  // ——— Swordmaster: precision, stance, single-target finish; evasive self-protection (§4) ———
  // A TIGHT damage band is what "precision" means in rules: less than power-strike at its luckiest,
  // far more than it at its worst.
  "precise-thrust": {
    id: "precise-thrust",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 3 },
    effects: [{ kind: "damage", min: 7, max: 10, element: "physical" }],
    duration: { kind: "instant" },
    tags: ["martial"]
  },
  "flowing-stance": {
    id: "flowing-stance",
    kind: "skill",
    target: "self",
    cost: { mp: 3 },
    effects: [{ kind: "buff", stat: "evasion", amount: 12 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  riposte: {
    id: "riposte",
    kind: "skill",
    target: "self",
    cost: { mp: 4 },
    effects: [
      { kind: "buff", stat: "accuracy", amount: 10 },
      { kind: "buff", stat: "damage", amount: 2 }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  "crescent-cut": {
    id: "crescent-cut",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 4 },
    effects: [
      { kind: "damage", min: 6, max: 11, element: "physical" },
      { kind: "debuff", stat: "accuracy", amount: 8, duration: { kind: "rounds", rounds: 2 } }
    ],
    duration: { kind: "instant" },
    tags: ["martial", "debuff"]
  },
  "still-water": {
    id: "still-water",
    kind: "skill",
    target: "self",
    cost: { mp: 4 },
    effects: [{ kind: "ward", statusResist: { fear: 30, sleep: 30 } }],
    duration: { kind: "combat" },
    tags: ["martial", "ward"]
  },
  "finishing-cut": {
    id: "finishing-cut",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [{ kind: "damage", min: 14, max: 22, element: "physical" }],
    duration: { kind: "instant" },
    tags: ["martial"]
  },

  // ——— Thief: skirmish damage supporting the exploration identity (§4/§5) ———
  hamstring: {
    id: "hamstring",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 3 },
    effects: [
      { kind: "damage", min: 4, max: 7, element: "physical" },
      { kind: "debuff", stat: "speed", amount: 3, duration: { kind: "rounds", rounds: 3 } }
    ],
    duration: { kind: "instant" },
    tags: ["martial", "debuff"]
  },
  "smoke-veil": {
    id: "smoke-veil",
    kind: "skill",
    target: "party",
    cost: { mp: 4 },
    effects: [{ kind: "buff", stat: "evasion", amount: 8 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  "shadow-step": {
    id: "shadow-step",
    kind: "skill",
    target: "self",
    cost: { mp: 4 },
    effects: [
      { kind: "buff", stat: "evasion", amount: 15 },
      { kind: "buff", stat: "speed", amount: 3 }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  "blinding-dust": {
    id: "blinding-dust",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 4 },
    effects: [{ kind: "debuff", stat: "accuracy", amount: 12 }],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "debuff"]
  },
  backstab: {
    id: "backstab",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [{ kind: "damage", min: 10, max: 18, element: "physical" }],
    duration: { kind: "instant" },
    tags: ["martial"]
  },

  // ——————————————— §7B: exclusive advanced-vocation signatures ———————————————

  // 星の信徒 (Star Votary, hexer). The DETONATE: modest base fire, but a heavy bonus against a pack the
  // Occultist half has already bound — and it SPENDS that status, so it is a setup-and-payoff, not a
  // spammable nuke. No basic class teaches it; the Occultist binds, the Mage burns, this is the bridge.
  "star-nova": {
    id: "star-nova",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 7 },
    effects: [
      {
        kind: "damage",
        min: 6,
        max: 10,
        element: "fire",
        scalesWithSpellPower: true,
        bonusVsStatus: { statuses: ["sleep", "silence", "fear"], bonusMin: 10, bonusMax: 16, consume: true }
      }
    ],
    duration: { kind: "instant" },
    tags: ["elemental", "control"]
  },
  // 胞子見 (Spore Seer, assassin). EXPLOIT: physical damage amplified against the sleeping / feared /
  // poisoned, and it does NOT consume — the assassin keeps hitting the afflicted while the affliction
  // lasts. The Occultist supplies the condition, the Thief supplies the blade.
  "spore-burst": {
    id: "spore-burst",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [
      {
        kind: "damage",
        min: 5,
        max: 9,
        element: "physical",
        bonusVsStatus: { statuses: ["sleep", "fear", "poison"], bonusMin: 8, bonusMax: 12 }
      }
    ],
    duration: { kind: "instant" },
    tags: ["martial", "control"]
  },

  // The other ten advanced signatures — each a distinct COMBINATION of §9.4 primitives no basic class
  // teaches, so the vocation opens a play pattern rather than a bigger stat line (§7). Each fits one
  // target scope (the resolver applies every effect against the same subject set), which is why the
  // "cover then heal the ally" fantasy is expressed as the coverer sustaining the line rather than as
  // two target scopes in one cast — the primitives are honest about what one technique can reach.

  // 灰の刃 (Ash Reaver, war master). The BANKED STANCE: a turn spent to make every follow-up strike
  // chain harder — more damage AND more accuracy than the Warrior's war-cry (+3 damage only), the reward
  // for pairing the Warrior's force with the Swordmaster's precision.
  "ash-stance": {
    id: "ash-stance",
    kind: "skill",
    target: "self",
    cost: { mp: 5 },
    effects: [
      { kind: "buff", stat: "damage", amount: 5 },
      { kind: "buff", stat: "accuracy", amount: 4 }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  // 塩の守り手 (Salt Warden, paladin). COVER AND MEND in one prayer: the warden draws the blow meant for
  // the line (cover) and closes their own wounds so the shield keeps standing. The Knight's cover with a
  // Priest's restore folded together — neither basic class does both.
  "sheltering-prayer": {
    id: "sheltering-prayer",
    kind: "spell",
    target: "self",
    cost: { mp: 6 },
    effects: [
      { kind: "cover" },
      { kind: "heal", amount: 12, scalesWithSpellPower: true }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["cover", "recovery"]
  },
  // 針舞い (Needle Dancer, ninja). The EVASION→OPENING: a dodge stance that ALSO sharpens the counter,
  // so a slipped blow becomes a guaranteed opening. High evasion (like flowing-stance) plus the accuracy
  // flowing-stance lacks — the Thief's footwork wedded to the Swordmaster's blade.
  "needle-flurry": {
    id: "needle-flurry",
    kind: "skill",
    target: "self",
    cost: { mp: 4 },
    effects: [
      { kind: "buff", stat: "evasion", amount: 16 },
      { kind: "buff", stat: "accuracy", amount: 12 }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "buff"]
  },
  // 塵路師 (Dust Ranger, arcane thief). The RANGED BURST: a volley across the whole pack that also kicks
  // up dust to blind them. A Thief has no group-damage technique of its own; this is what the Mage half buys.
  "dust-volley": {
    id: "dust-volley",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [
      { kind: "damage", min: 7, max: 12, element: "physical" },
      { kind: "debuff", stat: "accuracy", amount: 8, duration: { kind: "rounds", rounds: 2 } }
    ],
    duration: { kind: "instant" },
    tags: ["martial", "debuff"]
  },
  // 灯巡り (Candle Pilgrim, trickster). The WARD THAT BUYS A WITHDRAWAL: a party ward against fear/sleep
  // that also lifts everyone's footing (evasion) — keep the light, keep the way home. Ward-hymn wards; it
  // does not also open the escape the Thief half is there to guarantee.
  "candle-ward": {
    id: "candle-ward",
    kind: "spell",
    target: "party",
    cost: { mp: 6 },
    effects: [
      { kind: "ward", statusResist: { fear: 25, sleep: 25 } },
      { kind: "buff", stat: "evasion", amount: 8 }
    ],
    duration: { kind: "combat" },
    tags: ["ward", "buff"]
  },
  // 茨砕き (Briar Reaver, fortress guard). INTERCEPT THEN COUNTER: the guard takes the thorn-strike (cover)
  // and its own attacks bite harder while braced (attack buff) — the shielded counter that sunders what it
  // blocked. The Warrior's aggression on the Knight's cover; no basic class fuses them.
  "thorn-guard": {
    id: "thorn-guard",
    kind: "skill",
    target: "self",
    cost: { mp: 5 },
    effects: [
      { kind: "cover" },
      { kind: "buff", stat: "attack", amount: 4 }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["martial", "cover", "buff"]
  },
  // 樹皮守 (Bark Keeper, warder). The MAINTAINED FIELD: a bark-and-ward field of armour and fire
  // resistance over the party that FADES if not re-sung — rounds, not combat, so the warder keeps paying
  // for it. Combines what iron-oath (armour) and ember-chant (element) do apart, on a decaying timer.
  "bark-field": {
    id: "bark-field",
    kind: "spell",
    target: "party",
    cost: { mp: 7 },
    effects: [
      { kind: "buff", stat: "armor", amount: 4 },
      { kind: "ward", elementResist: { fire: 0.7 } }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["ward", "buff"]
  },
  // 露刃 (Dewblade, grove ninja). The FIRST CUT FROM CONCEALMENT: a deep precise strike that also robs the
  // pack of its footing (speed), so the answer never comes. Heavier than any single basic cut; the
  // Swordmaster's precision with the Thief's opening.
  "dew-cut": {
    id: "dew-cut",
    kind: "skill",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [
      { kind: "damage", min: 9, max: 15, element: "physical" },
      { kind: "debuff", stat: "speed", amount: 3, duration: { kind: "rounds", rounds: 2 } }
    ],
    duration: { kind: "instant" },
    tags: ["martial", "debuff"]
  },
  // 梢読み (Canopy Reader, grove trickster). PRE-EMPT: reads a telegraphed action and breaks it before it
  // lands — both the pack's aim (accuracy) and its force (damage) at once. Two single-stat debuffs
  // (blinding-dust, wither) folded into one pre-emptive read the Chanter half makes possible.
  "canopy-read": {
    id: "canopy-read",
    kind: "spell",
    target: "enemyGroup",
    cost: { mp: 5 },
    effects: [
      { kind: "debuff", stat: "accuracy", amount: 10 },
      { kind: "debuff", stat: "damage", amount: 3 }
    ],
    duration: { kind: "rounds", rounds: 3 },
    tags: ["control", "debuff"]
  },
  // 樹液結び (Sap Binder, sage). READ AND MATCH: reads the enemy's element and answers with a matched
  // restore — a party heal plus a fire-resistance ward woven together. The Priest's recovery on the Mage's
  // elemental knowledge; neither casts both in one breath.
  "sap-weave": {
    id: "sap-weave",
    kind: "spell",
    target: "party",
    cost: { mp: 7 },
    effects: [
      { kind: "heal", amount: 12, scalesWithSpellPower: true },
      { kind: "ward", elementResist: { fire: 0.7 } }
    ],
    duration: { kind: "combat" },
    tags: ["recovery", "ward"]
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
    const persists =
      effect.kind === "ward" || effect.kind === "buff" || effect.kind === "debuff" || effect.kind === "status" || effect.kind === "cover";
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
