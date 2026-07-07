import type { CharacterAptitudes, CharacterClassId, CombatStatus } from "./types";

/**
 * Spell/skill system. A small Famicom-era set: a heal, an attack bolt, and a
 * sleep. Spells are learned on a per-class level schedule (derived, not saved),
 * cost MP, and resolve in the combat round.
 */

export type SpellId = "heal" | "firebolt" | "sleep";

export type SpellTarget = "ally" | "enemyGroup";

export type SpellEffect =
  | { kind: "heal"; amount: number }
  | { kind: "damage"; min: number; max: number }
  | { kind: "status"; status: CombatStatus };

export interface Spell {
  id: SpellId;
  mpCost: number;
  target: SpellTarget;
  effect: SpellEffect;
}

export const SPELLS: Record<SpellId, Spell> = {
  heal: { id: "heal", mpCost: 3, target: "ally", effect: { kind: "heal", amount: 8 } },
  firebolt: { id: "firebolt", mpCost: 4, target: "enemyGroup", effect: { kind: "damage", min: 4, max: 9 } },
  sleep: { id: "sleep", mpCost: 3, target: "enemyGroup", effect: { kind: "status", status: "sleep" } }
};

// The level at which each class learns each spell.
const CLASS_SPELLS: Partial<Record<CharacterClassId, { level: number; spellId: SpellId }[]>> = {
  mender: [{ level: 1, spellId: "heal" }],
  chanter: [
    { level: 1, spellId: "heal" },
    { level: 3, spellId: "sleep" }
  ],
  occultist: [
    { level: 1, spellId: "firebolt" },
    { level: 3, spellId: "sleep" }
  ],
  arcanist: [{ level: 1, spellId: "firebolt" }]
};

export function knownSpells(classId: CharacterClassId, level: number): SpellId[] {
  return (CLASS_SPELLS[classId] ?? []).filter((entry) => level >= entry.level).map((entry) => entry.spellId);
}

export function isCasterClass(classId: CharacterClassId): boolean {
  return (CLASS_SPELLS[classId] ?? []).length > 0;
}

// Casters start with a small MP pool that scales with their arcane aptitude;
// martial classes have none.
export function baseMaxMpForClass(classId: CharacterClassId, aptitude: CharacterAptitudes): number {
  if (!isCasterClass(classId)) {
    return 0;
  }
  const arcane = (aptitude.spirit ?? 0) + (aptitude.wit ?? 0);
  return 4 + arcane * 2;
}
