// IMP-021A — vocation / mastery contract (rules). Data lives in content/worlds/<id>/vocations.md;
// this holds only the mechanism. See docs/design/vocation-mastery.md for the frozen contract.
//
// A vocation id is a string: the 12 built-in classes use their class id, authored ADVANCED
// vocations add their own, and resolveVocationCatalog merges them. Character LEVEL is untouched by
// vocation changes; MASTERY advances separately (through the same out-levelling falloff as XP, so
// farming weak floors is not the optimal mastery route), and learned techniques are kept forever.
import { classCatalog, reclassCharacter } from "./characterCreation";
import { rewardXpFor } from "./leveling";
import { SPELLS, knownSpells, type SpellId } from "./spells";
import type { Character, CharacterClassId, CharacterVocationState, Enemy, EquipmentSlot, ScenarioVocation, ScenarioWorld, VocationId } from "./types";

export const BUILTIN_VOCATION_IDS: VocationId[] = classCatalog.map((definition) => definition.id);

/** Mastery points for one rank, and the rank at which a vocation counts as MASTERED. */
export const MASTERY_POINTS_PER_RANK = 100;
export const MASTERED_RANK = 5;
/** How many techniques may be active in combat at once (the bounded loadout). */
export const LOADOUT_LIMIT = 6;
/** Base mastery points a fight is worth before the level falloff trims it. */
const MASTERY_BASE_PER_FIGHT = 34;

export interface ResolvedVocation {
  id: VocationId;
  tier: "basic" | "advanced";
  name: string;
  /** True for an authored (content) vocation; false for a built-in class. */
  authored: boolean;
  requires?: { mastered?: VocationId[]; minLevel?: number };
  statModifiers?: ScenarioVocation["statModifiers"];
  allowedSlots?: EquipmentSlot[];
  grantsTechniques?: string[];
}

// Built-in basics + authored vocations, authored winning on a shared id (a world may re-skin a basic).
export function resolveVocationCatalog(world: ScenarioWorld): ResolvedVocation[] {
  const authoredIds = new Set(world.vocations.map((vocation) => vocation.id));
  const basics: ResolvedVocation[] = classCatalog
    .filter((definition) => !authoredIds.has(definition.id))
    .map((definition) => ({ id: definition.id, tier: "basic", name: definition.label.en, authored: false }));
  const authored: ResolvedVocation[] = world.vocations.map((vocation) => ({
    id: vocation.id,
    tier: vocation.tier,
    name: vocation.name,
    authored: true,
    requires: vocation.requires,
    statModifiers: vocation.statModifiers,
    allowedSlots: vocation.allowedSlots,
    grantsTechniques: vocation.grantsTechniques
  }));
  return [...basics, ...authored];
}

export function findVocation(world: ScenarioWorld, id: VocationId): ResolvedVocation | undefined {
  return resolveVocationCatalog(world).find((vocation) => vocation.id === id);
}

// A character created before IMP-021 has no vocation state; materialise a sane default from its
// class so every rule can assume one. The class is the current (basic) vocation, its spells are the
// learned techniques, and the loadout is the first LOADOUT_LIMIT of them.
export function resolveVocationState(character: Character): CharacterVocationState {
  const classLine = knownSpells(character.classId, character.level) as string[];

  if (character.vocation) {
    // LEVELLING MUST STILL TEACH. The stored state is only ever written by a vocation CHANGE, so a
    // character who had touched the career UI once had their `learned` set frozen at that moment and
    // never learned anything again — a level 9 Knight would never receive `cover`. The bug was nearly
    // invisible while a class knew one or two techniques; §9.4b's six-per-class lines make it glaring.
    // The class's line at the CURRENT level is therefore folded in on every read. It is a union, never
    // a replacement: §6 says learned techniques always persist, so training from other vocations stays.
    const learned = Array.from(new Set([...character.vocation.learned, ...classLine]));
    if (learned.length === character.vocation.learned.length) {
      return character.vocation;
    }
    // A newly learned technique fills a free loadout slot rather than sitting unusable behind the
    // career screen — but the player's own picks and their order are never disturbed.
    const loadout = [...character.vocation.loadout];
    for (const technique of learned) {
      if (loadout.length >= LOADOUT_LIMIT) break;
      if (!loadout.includes(technique)) loadout.push(technique);
    }
    return { ...character.vocation, learned, loadout };
  }

  return {
    current: character.classId,
    mastery: {},
    progress: {},
    learned: [...classLine],
    loadout: classLine.slice(0, LOADOUT_LIMIT)
  };
}

/** Mastery points a fight grants a member — the XP falloff applies, so weak-floor farming decays. */
export function masteryGain(memberLevel: number, enemy: Pick<Enemy, "level" | "dangerTier" | "prizedXp">): number {
  return rewardXpFor(MASTERY_BASE_PER_FIGHT, memberLevel, enemy);
}

// The techniques usable in combat this fight: the bounded loadout, resolved to real spells/skills.
// For a character that has never touched the vocation UI, resolveVocationState defaults the loadout
// to its class's known spells — so combat is unchanged until a player edits a loadout.
export function combatLoadout(character: Character): SpellId[] {
  return resolveVocationState(character).loadout.filter((id): id is SpellId => Object.prototype.hasOwnProperty.call(SPELLS, id));
}

export function masteryRank(state: CharacterVocationState, vocationId: VocationId): number {
  return state.mastery[vocationId] ?? 0;
}

export function isMastered(state: CharacterVocationState, vocationId: VocationId): boolean {
  return masteryRank(state, vocationId) >= MASTERED_RANK;
}

// Whether an adventurer may adopt a vocation now: every prerequisite vocation is MASTERED and the
// character meets the level floor. A basic vocation with no `requires` is always available.
export function canAdoptVocation(character: Character, vocationId: VocationId, world: ScenarioWorld): boolean {
  const vocation = findVocation(world, vocationId);
  if (!vocation) {
    return false;
  }
  const state = resolveVocationState(character);
  if (vocation.requires?.minLevel && character.level < vocation.requires.minLevel) {
    return false;
  }
  return (vocation.requires?.mastered ?? []).every((required) => isMastered(state, required));
}

// Advance the CURRENT vocation's mastery by `points`; ranks bank at MASTERY_POINTS_PER_RANK each and
// cap at MASTERED_RANK. Returns the next vocation state (pure).
export function applyMastery(state: CharacterVocationState, points: number): CharacterVocationState {
  const current = state.current;
  if (masteryRank(state, current) >= MASTERED_RANK) {
    return state;
  }
  const banked = (state.progress[current] ?? 0) + Math.max(0, points);
  const gainedRanks = Math.floor(banked / MASTERY_POINTS_PER_RANK);
  const nextRank = Math.min(MASTERED_RANK, masteryRank(state, current) + gainedRanks);
  const remainder = nextRank >= MASTERED_RANK ? 0 : banked % MASTERY_POINTS_PER_RANK;
  return {
    ...state,
    mastery: { ...state.mastery, [current]: nextRank },
    progress: { ...state.progress, [current]: remainder }
  };
}

// Change vocation WITHOUT resetting level or forgetting techniques (the bug in the old reclass path):
// switch `current`, keep the level/xp/learned, and union in the new vocation's granted techniques.
// The active vocation's stat modifiers are applied at effective-stat time (vocationStatModifiers).
export function adoptVocationState(
  state: CharacterVocationState,
  vocation: ResolvedVocation
): CharacterVocationState {
  const learned = Array.from(new Set([...state.learned, ...(vocation.grantsTechniques ?? [])]));
  const touchedMastery = state.mastery[vocation.id] === undefined ? { ...state.mastery, [vocation.id]: 0 } : state.mastery;
  const loadout = state.loadout.filter((technique) => learned.includes(technique));
  // Fill the loadout up to the limit from freshly-granted techniques, so a new vocation's signature
  // move is usable at once rather than hidden until the player opens a menu.
  for (const technique of vocation.grantsTechniques ?? []) {
    if (loadout.length >= LOADOUT_LIMIT) break;
    if (!loadout.includes(technique)) loadout.push(technique);
  }
  return { ...state, current: vocation.id, learned, mastery: touchedMastery, loadout };
}

// The stat delta the ACTIVE vocation contributes, added on top of the aptitude-derived base at
// effective-stat resolution (see economy.getEffectiveCharacterStats). A basic (class) vocation
// contributes nothing here — its stats are already the character's base.
export function vocationStatModifiers(
  character: Character,
  world: ScenarioWorld
): NonNullable<ScenarioVocation["statModifiers"]> {
  const state = resolveVocationState(character);
  return findVocation(world, state.current)?.statModifiers ?? {};
}

// Apply a whole vocation change to a character (IMP-021C). A BASIC vocation IS a class, so it
// reclasses — re-deriving the class base at the character's LEVEL (reclassCharacter re-levels from
// the retained xp, so level is kept) and learning that class's techniques. An ADVANCED vocation
// keeps the class base and layers its modifiers (via vocationStatModifiers). Either way the learned
// set is a UNION — nothing is forgotten — and `current` points at the new vocation.
export function changeCharacterVocation(character: Character, vocation: ResolvedVocation, world: ScenarioWorld): Character {
  const isBasicClass = vocation.tier === "basic" && BUILTIN_VOCATION_IDS.includes(vocation.id);
  const rebuilt = isBasicClass ? reclassCharacter(character, vocation.id as CharacterClassId, world) : character;
  const priorState = resolveVocationState(rebuilt);
  const classTechniques = isBasicClass ? (knownSpells(rebuilt.classId, rebuilt.level) as string[]) : [];
  const withClassTechniques: CharacterVocationState = {
    ...priorState,
    learned: Array.from(new Set([...priorState.learned, ...classTechniques]))
  };
  return { ...rebuilt, vocation: adoptVocationState(withClassTechniques, vocation) };
}

// Set the bounded combat loadout to `desired`, keeping only genuinely-learned techniques and never
// exceeding LOADOUT_LIMIT. Order is preserved (the loadout is reorderable in the UI).
export function setLoadout(state: CharacterVocationState, desired: string[]): CharacterVocationState {
  const learned = new Set(state.learned);
  const loadout: string[] = [];
  for (const technique of desired) {
    if (learned.has(technique) && !loadout.includes(technique) && loadout.length < LOADOUT_LIMIT) {
      loadout.push(technique);
    }
  }
  return { ...state, loadout };
}

// The localized display name of a vocation (authored locales win; a built-in falls back to its
// class label). `world.vocations` carries authored locales; the built-in label lives in the class.
export function localizedVocationName(world: ScenarioWorld, id: VocationId, locale: string): string {
  const authored = world.vocations.find((vocation) => vocation.id === id);
  if (authored) {
    return authored.locales?.[locale]?.name ?? authored.name;
  }
  const builtIn = classCatalog.find((definition) => definition.id === id);
  return (builtIn?.label as Record<string, string> | undefined)?.[locale] ?? builtIn?.label.en ?? id;
}

/** The one-line role signature a player reads to judge a destination, in the active locale.
 *  Authored vocations carry it; a built-in basic has none (returns ""). */
export function localizedVocationSignature(world: ScenarioWorld, id: VocationId, locale: string): string {
  const authored = world.vocations.find((vocation) => vocation.id === id);
  return authored?.locales?.[locale]?.signature ?? authored?.signature ?? "";
}
