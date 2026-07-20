import type { AnyClassId, CharacterAptitudes, CharacterClassId } from "./types";
import { CLASS_CAPABILITIES } from "./classCapabilities";
import { resolveClassId } from "./classIds";
import { TECHNIQUES, type Technique, type TechniqueEffect, type TechniqueId, type TechniqueTarget } from "./techniques";

/**
 * THE CASTABLE VIEW of the technique catalog.
 *
 * The ability system lives in techniques.ts (what a technique can be) and classCapabilities.ts (who
 * knows it). This module projects the small slice the UI and the engine-data export need — id, kind,
 * MP cost, target scope — so those consumers never carry the full effect model around.
 *
 * It is a VIEW, not a second source: `SPELLS` and `CLASS_ABILITIES` are derived, so the two cannot drift.
 *
 * §9.4 CHANGED WHAT IT FILTERS. It used to narrow to "one effect, MP-only cost, ally-or-enemyGroup
 * target" because that was all the resolver could carry out; anything wider was dropped, and a class
 * granted such a technique silently learned nothing. The resolver now handles cure, ward, buff, debuff,
 * multi-effect techniques and every target scope, so the only thing still held back is a technique that
 * costs something combat cannot yet SPEND — a scroll's item, an HP price, a per-expedition charge.
 * Those arrive with the item routes in the same slice; until then they are refused here, loudly and in
 * one place, rather than half-applied in the middle of a fight.
 */

export type SpellId = TechniqueId;

export type SpellKind = "spell" | "skill";

export type SpellTarget = TechniqueTarget;

export interface Spell {
  id: SpellId;
  kind: SpellKind;
  mpCost: number;
  target: SpellTarget;
  /** Every effect the technique carries, in authored order — the resolver applies them all. */
  effects: TechniqueEffect[];
}

/**
 * Project one technique into the castable view, or `null` if combat cannot pay for it yet.
 */
export function toLegacySpell(technique: Technique): Spell | null {
  if (technique.cost.itemId || technique.cost.hp || technique.cost.usesPerExpedition) {
    return null;
  }
  return {
    id: technique.id,
    kind: technique.kind,
    mpCost: technique.cost.mp ?? 0,
    target: technique.target,
    effects: technique.effects
  };
}

/**
 * What the PLAYER must choose before a technique can be queued — the one place that decision is made,
 * so the command menu and the keyboard shortcut cannot disagree about it.
 *
 * `self`, `party` and `allEnemies` need no choice at all: the resolver derives the subjects from the
 * scope. Before §9.4 those scopes were unreachable, and the UI's "ally, else pick a group" branch
 * quietly dropped any technique that was neither — a party ward would have been selectable, asked for
 * nothing, and queued nothing.
 */
export type SpellTargeting = "none" | "ally" | "group";

export function spellTargeting(target: SpellTarget): SpellTargeting {
  if (target === "ally") return "ally";
  if (target === "enemyGroup") return "group";
  return "none";
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
