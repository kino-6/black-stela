import type { CharacterAptitudes, CharacterClassId, CombatStatus, Element } from "./types";

/**
 * Ability system. A small Famicom-era set of arcane spells (heal, firebolt,
 * sleep) plus front-row martial 特技 (power-strike). Abilities are learned on a
 * per-class level schedule (derived, not saved), spend the MP/気力 pool, and
 * resolve in the combat round through the same cast path.
 */

export type SpellId = "heal" | "firebolt" | "sleep" | "power-strike";

export type SpellKind = "spell" | "skill";

export type SpellTarget = "ally" | "enemyGroup";

export type SpellEffect =
  | { kind: "heal"; amount: number }
  | { kind: "damage"; min: number; max: number; element: Element }
  | { kind: "status"; status: CombatStatus };

export interface Spell {
  id: SpellId;
  kind: SpellKind;
  mpCost: number;
  target: SpellTarget;
  effect: SpellEffect;
}

export const SPELLS: Record<SpellId, Spell> = {
  heal: { id: "heal", kind: "spell", mpCost: 3, target: "ally", effect: { kind: "heal", amount: 8 } },
  firebolt: { id: "firebolt", kind: "spell", mpCost: 4, target: "enemyGroup", effect: { kind: "damage", min: 4, max: 9, element: "fire" } },
  sleep: { id: "sleep", kind: "spell", mpCost: 3, target: "enemyGroup", effect: { kind: "status", status: "sleep" } },
  // 特技: a heavy front-row swing — more damage than a plain attack, at the cost
  // of 気力 (the martial MP/stamina pool), so the front line has a real choice too.
  "power-strike": { id: "power-strike", kind: "skill", mpCost: 3, target: "enemyGroup", effect: { kind: "damage", min: 6, max: 12, element: "physical" } }
};

// The level at which each class learns each ability (spell or 特技).
const CLASS_ABILITIES: Partial<Record<CharacterClassId, { level: number; spellId: SpellId }[]>> = {
  mender: [{ level: 1, spellId: "heal" }],
  chanter: [
    { level: 1, spellId: "heal" },
    { level: 3, spellId: "sleep" }
  ],
  occultist: [
    { level: 1, spellId: "firebolt" },
    { level: 3, spellId: "sleep" }
  ],
  arcanist: [{ level: 1, spellId: "firebolt" }],
  // Front-row martial classes wield 特技 instead of spells.
  vanguard: [{ level: 1, spellId: "power-strike" }],
  seeker: [{ level: 1, spellId: "power-strike" }]
};

export function knownSpells(classId: CharacterClassId, level: number): SpellId[] {
  return (CLASS_ABILITIES[classId] ?? []).filter((entry) => level >= entry.level).map((entry) => entry.spellId);
}

// True only for arcane spellcasters — a class whose abilities include an actual
// spell. Martial 特技 classes are not casters (they command "特技", not "呪文").
export function isCasterClass(classId: CharacterClassId): boolean {
  return (CLASS_ABILITIES[classId] ?? []).some((entry) => SPELLS[entry.spellId].kind === "spell");
}

// True for front-row classes that carry a 特技 but no spell.
export function isMartialSkillClass(classId: CharacterClassId): boolean {
  const abilities = CLASS_ABILITIES[classId] ?? [];
  return abilities.length > 0 && abilities.every((entry) => SPELLS[entry.spellId].kind === "skill");
}

// Casters get an MP pool scaled by arcane aptitude; 特技 classes get a smaller
// 気力 pool scaled by might; everyone else has none.
export function baseMaxMpForClass(classId: CharacterClassId, aptitude: CharacterAptitudes): number {
  if (isCasterClass(classId)) {
    const arcane = (aptitude.spirit ?? 0) + (aptitude.wit ?? 0);
    return 4 + arcane * 2;
  }
  if (isMartialSkillClass(classId)) {
    return 3 + (aptitude.might ?? 0);
  }
  return 0;
}
