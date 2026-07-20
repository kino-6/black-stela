import type { AnyClassId, CharacterAptitudes, CharacterClassId } from "./types";
import { CLASS_CAPABILITIES } from "./classCapabilities";
import { resolveClassId } from "./classIds";
import { TECHNIQUES, type Technique, type TechniqueEffect, type TechniqueId } from "./techniques";

/**
 * The LEGACY VIEW of the technique catalog.
 *
 * The ability system now lives in techniques.ts (what a technique can be) and classCapabilities.ts (who
 * knows it). This module keeps the old `Spell` shape alive on top of them, unchanged, so the combat
 * resolver, the command menu and the career counter carry on reading exactly what they always read while
 * the class system is rebuilt underneath (docs/design/class-system.md §8.1).
 *
 * It is a VIEW, not a second source: `SPELLS` and `CLASS_ABILITIES` are derived from the catalog, so the
 * two cannot drift. The narrowing it performs — one effect, MP-only cost, ally-or-enemyGroup target — is
 * the exact shape the current resolver understands, and a technique that does not fit it is refused
 * loudly rather than silently half-applied. Teaching the resolver the wider model is §8.2's work.
 */

export type SpellId = TechniqueId;

export type SpellKind = "spell" | "skill";

export type SpellTarget = "ally" | "enemyGroup";

export type SpellEffect = Extract<TechniqueEffect, { kind: "heal" } | { kind: "damage" } | { kind: "status" }>;

export interface Spell {
  id: SpellId;
  kind: SpellKind;
  mpCost: number;
  target: SpellTarget;
  effect: SpellEffect;
}

/**
 * Narrow one technique to the shape the current resolver understands. A technique the resolver cannot
 * yet carry out (multiple effects, a party-wide ward, a scroll's item cost) is left OUT of this view
 * instead of being flattened into something it is not — a half-applied technique in combat is worse
 * than a technique that has not shipped.
 */
export function toLegacySpell(technique: Technique): Spell | null {
  if (technique.effects.length !== 1) {
    return null;
  }
  const [effect] = technique.effects;
  if (effect.kind !== "heal" && effect.kind !== "damage" && effect.kind !== "status") {
    return null;
  }
  if (technique.target !== "ally" && technique.target !== "enemyGroup") {
    return null;
  }
  if (technique.cost.itemId || technique.cost.hp || technique.cost.usesPerExpedition) {
    return null;
  }
  return {
    id: technique.id,
    kind: technique.kind,
    mpCost: technique.cost.mp ?? 0,
    target: technique.target,
    effect
  };
}

export const SPELLS: Record<SpellId, Spell> = Object.fromEntries(
  Object.values(TECHNIQUES)
    .map((technique) => [technique.id, toLegacySpell(technique)] as const)
    .filter((entry): entry is readonly [SpellId, Spell] => entry[1] !== null)
) as Record<SpellId, Spell>;

/**
 * The level at which each class learns each ability, projected from the class contract. Kept in the old
 * `{ level, spellId }` shape because engine-data export, the Godot port and the parity traces all read
 * it; techniques the legacy view cannot represent are omitted here too, so nothing can be granted that
 * the resolver would then refuse.
 */
export const CLASS_ABILITIES: Partial<Record<CharacterClassId, { level: number; spellId: SpellId }[]>> =
  Object.fromEntries(
    Object.entries(CLASS_CAPABILITIES)
      .map(([classId, capabilities]) => [
        classId,
        capabilities.combatTechniques
          .filter((grant) => Object.prototype.hasOwnProperty.call(SPELLS, grant.techniqueId))
          .map((grant) => ({ level: grant.level, spellId: grant.techniqueId }))
      ] as const)
      .filter(([, grants]) => grants.length > 0)
  );

export function knownSpells(classId: AnyClassId, level: number): SpellId[] {
  // Resolved: an adventurer stored as a 斥候 knows what a 盗賊 knows (characterCreation §8.3 mapping).
  return (CLASS_ABILITIES[resolveClassId(classId)] ?? []).filter((entry) => level >= entry.level).map((entry) => entry.spellId);
}

// True only for arcane spellcasters — a class whose abilities include an actual
// spell. Martial 特技 classes are not casters (they command "特技", not "呪文").
export function isCasterClass(classId: AnyClassId): boolean {
  return (CLASS_ABILITIES[resolveClassId(classId)] ?? []).some((entry) => SPELLS[entry.spellId].kind === "spell");
}

// True for front-row classes that carry a 特技 but no spell.
export function isMartialSkillClass(classId: AnyClassId): boolean {
  const abilities = CLASS_ABILITIES[resolveClassId(classId)] ?? [];
  return abilities.length > 0 && abilities.every((entry) => SPELLS[entry.spellId].kind === "skill");
}

// Casters get an MP pool scaled by arcane aptitude; 特技 classes get a smaller
// 気力 pool scaled by might; everyone else has none.
export function baseMaxMpForClass(classId: AnyClassId, aptitude: CharacterAptitudes): number {
  if (isCasterClass(classId)) {
    const arcane = (aptitude.spirit ?? 0) + (aptitude.wit ?? 0);
    return 4 + arcane * 2;
  }
  if (isMartialSkillClass(classId)) {
    return 3 + (aptitude.might ?? 0);
  }
  return 0;
}
