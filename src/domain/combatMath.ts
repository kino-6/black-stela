import { getEffectiveCharacterStats } from "./economy";
import type { Character, ScenarioWorld } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Agility is already folded into Speed at creation; this is its defensive payoff. */
export function getEvasionChance(character: Character, world: ScenarioWorld) {
  const speed = getEffectiveCharacterStats(character, world).speed;
  return clamp(character.aptitude.agility * 3 + Math.floor(speed / 4), 0, 30);
}

/** Extra healing or damage applied only to arcane spells, never martial skills. */
export function getSpellPowerBonus(character: Character) {
  const wit = character.aptitude.wit ?? 0;
  return Math.max(0, Math.floor(wit / 2));
}

/** Final success chance after the target group's resistance is taken into account. */
export function getStatusSpellChance(character: Character, resistance: number) {
  return clamp(55 + (character.aptitude.wit ?? 0) * 4 - resistance, 5, 95);
}

export function getCriticalChance(character: Character) {
  return clamp(5 + (character.aptitude.luck ?? 0) * 3, 5, 50);
}

export function getInitiativeScore(character: Character, world: ScenarioWorld) {
  return getEffectiveCharacterStats(character, world).speed;
}
