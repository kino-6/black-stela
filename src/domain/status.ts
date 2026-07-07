import type { CombatStatus } from "./types";

/**
 * Status-ailment tuning. Ward is the one-round defend buff; poison/sleep/
 * silence/fear are persistent ailments that bite and/or hinder, then roll to
 * wear off each round.
 */

export const POISON_DAMAGE = 2;
export const FEAR_ACCURACY_PENALTY = 20;

// Per-round chance (%) that an ailment wears off. Ward always drops after a round.
export const STATUS_WEAR_OFF: Record<CombatStatus, number> = {
  ward: 100,
  poison: 30,
  sleep: 45,
  silence: 35,
  fear: 35
};

// A target's chance (%) to resist an incoming ailment.
export function statusResistPct(
  resistance: Partial<Record<CombatStatus, number>> | undefined,
  status: CombatStatus
): number {
  return Math.max(0, Math.min(100, resistance?.[status] ?? 0));
}
