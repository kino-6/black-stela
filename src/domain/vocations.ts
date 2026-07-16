// IMP-021A — vocation / mastery contract (rules). Data lives in content/worlds/<id>/vocations.md;
// this holds only the mechanism. See docs/design/vocation-mastery.md for the frozen contract.
//
// A vocation id is a string: the 12 built-in classes use their class id, authored ADVANCED
// vocations add their own, and resolveVocationCatalog merges them. Character LEVEL is untouched by
// vocation changes; MASTERY advances separately (through the same out-levelling falloff as XP, so
// farming weak floors is not the optimal mastery route), and learned techniques are kept forever.
import { classCatalog } from "./characterCreation";
import { rewardXpFor } from "./leveling";
import { knownSpells } from "./spells";
import type { Character, CharacterVocationState, Enemy, EquipmentSlot, ScenarioVocation, ScenarioWorld, VocationId } from "./types";

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
  if (character.vocation) {
    return character.vocation;
  }
  const learned = knownSpells(character.classId, character.level) as string[];
  return {
    current: character.classId,
    mastery: {},
    progress: {},
    learned: [...learned],
    loadout: learned.slice(0, LOADOUT_LIMIT)
  };
}

/** Mastery points a fight grants a member — the XP falloff applies, so weak-floor farming decays. */
export function masteryGain(memberLevel: number, enemy: Pick<Enemy, "level" | "dangerTier" | "prizedXp">): number {
  return rewardXpFor(MASTERY_BASE_PER_FIGHT, memberLevel, enemy);
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
