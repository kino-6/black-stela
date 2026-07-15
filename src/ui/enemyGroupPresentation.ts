export interface EnemyGroupCondition {
  count: number;
  initialCount?: number;
  hpEach: number;
  maxHpEach: number;
}

/**
 * Return the condition of the whole enemy group, not only the front-most body.
 * `hpEach` resets when a member falls and the next member steps forward; folding
 * the untouched bodies into the total keeps the visible bar monotonic.
 */
export function enemyGroupHealthPercent(group: EnemyGroupCondition): number {
  if (group.count <= 0 || group.maxHpEach <= 0) {
    return 0;
  }

  const initialCount = Math.max(group.initialCount ?? group.count, group.count, 1);
  const activeBodyHp = Math.max(0, Math.min(group.hpEach, group.maxHpEach));
  const remainingHp = (group.count - 1) * group.maxHpEach + activeBodyHp;
  return Math.max(0, Math.min(100, (remainingHp / (initialCount * group.maxHpEach)) * 100));
}
