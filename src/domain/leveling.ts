import type { Character, GameEvent } from "./types";

/**
 * Character growth: XP thresholds and the stat gains applied on level-up.
 * Numbers are a deliberately gentle first pass and meant to be tuned.
 */

// Total XP required to have reached a given level. Level 1 costs nothing;
// each level after that is a widening step (L2=8, L3=24, L4=48, L5=80, …).
export function xpForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return 4 * (level - 1) * level;
}

export interface LevelUpResult {
  character: Character;
  events: GameEvent[];
}

// Apply as many level-ups as the character's current XP allows, growing stats a
// little each level (flavoured by aptitude) and topping up HP by the gain.
export function applyLevelUps(character: Character): LevelUpResult {
  let current = character;
  const events: GameEvent[] = [];

  while (current.xp >= xpForLevel(current.level + 1)) {
    const nextLevel = current.level + 1;
    const gain = growthForLevel(current, nextLevel);
    const maxHp = current.maxHp + gain.maxHp;
    const maxMp = current.maxMp + gain.maxMp;
    current = {
      ...current,
      level: nextLevel,
      maxHp,
      hp: Math.min(current.hp + gain.maxHp, maxHp),
      maxMp,
      mp: Math.min(current.mp + gain.maxMp, maxMp),
      attack: current.attack + gain.attack,
      damageMin: current.damageMin + gain.damageMin,
      damageMax: current.damageMax + gain.damageMax,
      accuracy: current.accuracy + gain.accuracy,
      armor: current.armor + gain.armor,
      speed: current.speed + gain.speed
    };
    events.push({
      type: "character_leveled_up",
      characterId: current.id,
      characterName: current.name,
      level: nextLevel
    });
  }

  return { character: current, events };
}

interface StatGain {
  maxHp: number;
  maxMp: number;
  attack: number;
  damageMin: number;
  damageMax: number;
  accuracy: number;
  armor: number;
  speed: number;
}

function growthForLevel(character: Character, newLevel: number): StatGain {
  const might = character.aptitude.might ?? 0;
  const agility = character.aptitude.agility ?? 0;
  const spirit = character.aptitude.spirit ?? 0;
  const everyOther = newLevel % 2 === 0;

  const wit = character.aptitude.wit ?? 0;
  return {
    maxHp: 2 + Math.max(might, spirit),
    maxMp: character.maxMp > 0 && spirit + wit >= 2 ? 2 : character.maxMp > 0 ? 1 : 0,
    attack: everyOther ? 1 : 0,
    damageMin: newLevel % 3 === 0 ? 1 : 0,
    damageMax: everyOther ? 1 : 0,
    accuracy: everyOther ? 1 : 0,
    armor: newLevel % 4 === 0 ? 1 : 0,
    speed: agility >= 2 && everyOther ? 1 : 0
  };
}
