import type { Character, Enemy, GameEvent } from "./types";

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

// The level a fight is "meant for". Authored per-enemy where it matters; otherwise derived from
// dangerTier so every enemy has one. Tier 1..5 → level 1,3,5,7,9 — spread across the party's range.
export function enemyLevel(enemy: Pick<Enemy, "level" | "dangerTier">): number {
  return enemy.level ?? Math.max(1, (enemy.dangerTier ?? 1) * 2 - 1);
}

// Diminishing returns for out-levelling the content. NOT a cap (the user's call: "頭打ちは言い過ぎ
// で、成長速度がUXとして明らかに鈍るがいい") — grinding a floor you have outgrown keeps paying, but
// visibly less each level over: each level of gap trims XP by ~14%, flooring at 12%. So time-in
// spent farming trash is quietly discouraged, while a PREPARED lower-level party still earns full
// value from fights that are actually a threat. Enemies that are a deliberate growth reward
// (bounty targets, the rare "prized" runners) bypass this entirely — see rewardXpFor.
const FALLOFF_PER_LEVEL = 0.86;
const FALLOFF_FLOOR = 0.12;
export function xpFalloffMultiplier(memberLevel: number, targetLevel: number): number {
  const over = memberLevel - targetLevel;
  if (over <= 0) {
    return 1;
  }
  return Math.max(FALLOFF_FLOOR, FALLOFF_PER_LEVEL ** over);
}

// The XP one member earns from one defeated enemy: the enemy's base XP, trimmed by how far the
// member has out-levelled it — unless the enemy is `prizedXp` (a metal-slime-style reward you had
// to seek out and land), which pays in full at any level. This is the single place the "grinding
// slows, preparation doesn't" rule and its exceptions live.
export function rewardXpFor(baseXp: number, memberLevel: number, enemy: Pick<Enemy, "level" | "dangerTier" | "prizedXp">): number {
  if (enemy.prizedXp) {
    return baseXp;
  }
  return Math.max(1, Math.round(baseXp * xpFalloffMultiplier(memberLevel, enemyLevel(enemy))));
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
