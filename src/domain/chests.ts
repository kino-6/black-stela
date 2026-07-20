import type { Character, ChestState, ChestTrapKind, GameState, ScenarioChest } from "./types";
import { classProficiency, proficiencyBonus } from "./classCapabilities";

// IMP-029 — the treasure-chest state machine + trap handling, kept a LEAF module (no rulesEngine
// import) so the rules engine can wire it without a cycle. Reward payout stays in rulesEngine (it owns
// the treasure-table roll + inventory); this module owns the judgement: who handles the trap, the
// seeded investigate/disarm/open outcomes, and the one-attempt-each guarantees. No caller can reload a
// failure into a success — each attempt is spent (a flag) AND the outcome is fixed per chest identity.

export const CHEST_TRAP_KINDS: ChestTrapKind[] = ["needle", "gas", "rune", "snare"];

export function isChestTrapKind(kind: string): kind is ChestTrapKind {
  return (CHEST_TRAP_KINDS as string[]).includes(kind);
}

// A leaf seeded RNG (FNV-1a → 1..100), same shape as rulesEngine.hashSeed but local to avoid a cycle.
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function rollPercent(seed: string): number {
  return (hashSeed(seed) % 100) + 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** A member's aptitude for handling traps. A specialist gets a real bonus, but ANYONE may try — a
 *  non-specialist just runs a worse check (higher risk). Never class-locked. Agility/wit/luck/level and
 *  the class's declared proficiency all feed it.
 *
 *  The proficiency now comes from the CLASS CONTRACT (classCapabilities.ts) rather than from a
 *  `trap_handling` string on the character: the tag was the one and only rules meaning any roleTag ever
 *  had, and leaving it here would keep the contract in two places. The numbers are unchanged — the same
 *  three classes are specialists, worth the same +8 — and a character carrying the old tag from a save
 *  still gets it, so nothing already in a save file loses a skill it had. */
export function trapSkill(member: Character): number {
  const apt = member.aptitude;
  const declared = proficiencyBonus(classProficiency(member.classId, "disarm"));
  const legacyTag = member.roleTags?.includes("trap_handling") ? proficiencyBonus("specialist") : 0;
  return member.level + (apt.agility ?? 0) * 2 + (apt.wit ?? 0) + (apt.luck ?? 0) + Math.max(declared, legacyTag);
}

/** The best standing (un-injured) handler the rules pick automatically, or null if nobody can act. */
export function selectTrapHandler(party: Character[]): Character | null {
  const able = party.filter((member) => member.hp > 0 && !member.injury);
  if (able.length === 0) {
    return null;
  }
  return able.reduce((best, member) => (trapSkill(member) > trapSkill(best) ? member : best), able[0]);
}

/**
 * Shared with the ROOM-trap checks (§9.4d) so a chest lock and a floor trap read the same curve.
 *
 * §9.4e TUNING: difficulty was weighted 1 against skill's 3, which made the authored number nearly
 * inert — a trap of DC 12 cost 12 points against a skill worth 30-50, so the coverage sim measured an
 * UNTRAINED party disarming 4 of 4 room traps and the Thief's specialism buying nothing visible.
 * Difficulty and skill are both "levels" and now weigh the same, which is what makes an authored DC a
 * design decision rather than decoration.
 */
export function successChance(skill: number, difficulty: number, base: number): number {
  return clamp(base + skill * 3 - difficulty * 3, 5, 95);
}

/** A fresh closed chest from an authored (or back-compat plain) scenario chest. */
export function makeChest(cellId: string, roomId: string, chest: ScenarioChest): ChestState {
  return {
    cellId,
    roomId,
    treasureTable: chest.treasureTable,
    trap: chest.trap ? { ...chest.trap } : null,
    phase: "closed",
    investigated: false,
    investigateResult: null,
    disarmAttempted: false,
    disarmed: false,
    sprung: false
  };
}

/** The chest on a given cell, if one has spawned. */
export function chestAt(state: GameState, cellId: string): ChestState | undefined {
  return state.chests?.find((chest) => chest.cellId === cellId);
}

/** Investigate ONCE. A successful check learns the truth (clear/trapped); a failed check is honestly
 *  "uncertain" — it never reports a trapped chest as clear. Re-calling is a no-op (attempt is spent). */
export function investigateChest(chest: ChestState, handler: Character | null, seed: string, aidBonus = 0): ChestState {
  if (chest.investigated || chest.phase === "opened") {
    return chest;
  }
  // The aid an item bought for this attempt (§8.2 / §4). Zero unless one was spent, so every existing
  // call resolves to exactly the number it always did.
  const skill = (handler ? trapSkill(handler) : 0) + aidBonus;
  const success = rollPercent(`${seed}:investigate`) < successChance(skill, chest.trap?.difficulty ?? 0, 55);
  const result: ChestState["investigateResult"] = !success ? "uncertain" : chest.trap ? "trapped" : "clear";
  return { ...chest, investigated: true, investigateResult: result };
}

/** Disarm ONCE. Success removes the trap; failure leaves it armed (it will trip on open). A plain chest
 *  or an already-disarmed one is a no-op. Re-calling is a no-op (attempt is spent). */
export function disarmChest(chest: ChestState, handler: Character | null, seed: string, aidBonus = 0): ChestState {
  if (chest.disarmAttempted || chest.phase === "opened" || !chest.trap || chest.disarmed) {
    return chest;
  }
  const skill = (handler ? trapSkill(handler) : 0) + aidBonus;
  const success = rollPercent(`${seed}:disarm`) < successChance(skill, chest.trap.difficulty, 45);
  return { ...chest, disarmAttempted: true, disarmed: success };
}

/** Open the chest. If the trap is present and not disarmed it TRIPS (returns damage) — but the reward is
 *  never destroyed; the caller still grants it. The chest becomes opened (reward can be taken once). */
export function openChest(chest: ChestState): { chest: ChestState; trapSprung: boolean; damage: number } {
  if (chest.phase === "opened") {
    return { chest, trapSprung: false, damage: 0 };
  }
  const trapSprung = Boolean(chest.trap) && !chest.disarmed && !chest.sprung;
  const damage = trapSprung ? chest.trap!.damage : 0;
  return {
    chest: { ...chest, phase: "opened", sprung: chest.sprung || trapSprung },
    trapSprung,
    damage
  };
}

/** Normalize a room's authored reward into a ScenarioChest: an explicit `chest`, else a bare
 *  `treasureTable` as a safe plain chest (back-compat), else null (no reward → no chest). */
export function roomChest(room: { treasureTable?: string; chest?: ScenarioChest }): ScenarioChest | null {
  if (room.chest) {
    return room.chest;
  }
  if (room.treasureTable) {
    return { treasureTable: room.treasureTable };
  }
  return null;
}
