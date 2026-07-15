import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { defaultWorld } from "../src/data/defaultWorld";
import { worldRegistry } from "../src/data/worldRegistry";
import type { Character, GameState } from "../src/domain/types";

function frontliner(equipment: Character["equipment"]): Character {
  const base = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "elem" });
  return { ...base, row: "front", equipment };
}

function fightWith(member: Character, enemyId: string): GameState {
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === enemyId)!;
  const base = { ...createInitialGameState(), party: [member] };
  return {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
}

/** Rounds of "everyone attacks the front group" until it falls. Averages over the seeded RNG, so
 *  it compares loadouts honestly rather than one noisy roll (different weapons map the same seed to
 *  different numbers, so a single-blow comparison is not apples to apples). */
/** Total damage the party deals to the front group in a single declared round (seeded). */
function oneRoundDamage(state: GameState): number {
  const group = state.combat!.enemyGroups[0];
  const after = executeCommand(state, defaultWorld, {
    type: "declare_round",
    actions: state.party.filter((m) => m.hp > 0).map((m) => ({ actorId: m.id, action: "attack" as const, targetGroupId: group.id }))
  });
  const beats = after.log.map((entry) => entry.event).flatMap((event) =>
    event?.type === "combat_round_resolved" ? event.beats : []
  );
  return beats.reduce((total, beat) => total + ((beat?.targetGroupId === group.id ? beat?.damage ?? 0 : 0)), 0);
}

function roundsToClear(state: GameState, maxRounds = 40): number {
  let current = state;
  for (let round = 0; round < maxRounds; round += 1) {
    if (current.phase !== "combat") {
      return round;
    }
    const group = current.combat!.enemyGroups.find((candidate) => candidate.count > 0);
    if (!group) {
      return round;
    }
    current = executeCommand(current, defaultWorld, {
      type: "declare_round",
      actions: current.party.filter((m) => m.hp > 0).map((m) => ({ actorId: m.id, action: "attack" as const, targetGroupId: group.id }))
    });
  }
  return maxRounds;
}

// The counterplay loop, proven on the real engine (2026-07-15). Matching the tool to the enemy is
// the whole point: a salt weapon into a damp, salt-weak cyst lands far harder than a plain blade,
// and the armour a party wore for the fire-throwers actually turns their fire aside. This is what
// lets a lower-level PREPARED party get through where a naive one is walled.
describe("elemental counterplay in combat", () => {
  it("gear resolves the wielder's attack element and the party's resistances", () => {
    const salt = frontliner({ weapon: { id: "equip.salt-etched-blade" } });
    const plain = frontliner({ weapon: { id: "equip.rusted-dirk" } });
    expect(getEffectiveCharacterStats(salt, defaultWorld).attackElement).toBe("salt");
    expect(getEffectiveCharacterStats(plain, defaultWorld).attackElement).toBe("physical");

    const warded = frontliner({ body: { id: "equip.cinder-warded-jack" } });
    // <1 = resistant (the exact depth is the world's counterplayBoost; direction is what matters).
    expect(getEffectiveCharacterStats(warded, defaultWorld).elementResist.fire).toBeLessThan(1);
  });

  it("a salt loadout deals more to the salt-weak, fire-resistant cyst than a plain one", () => {
    // The cistern-warden is salt-weak / fire-resistant. In one round, a full salt party lands more
    // than a plain (physical) one — the counterplay loop, measured on the real engine. (Rounds-to-
    // clear is too coarse once damage is scaled up; total damage in a round is the clean signal.)
    const salt = oneRoundDamage(fightWith(frontliner({ weapon: { id: "equip.salt-etched-blade" } }), "enemy.b3f.cistern-warden"));
    const plain = oneRoundDamage(fightWith(frontliner({ weapon: { id: "equip.rusted-dirk" } }), "enemy.b3f.cistern-warden"));
    expect(salt).toBeGreaterThan(plain);
  });

  it("bringing fire to the drowned wood is the WRONG tool — wet bark shrugs it off, metal cuts it", () => {
    // enemy.verdant.g4.bark-ward is fire 0.4 / metal 1.75. The engine reads each world's OWN
    // cosmology, so the ash-folk's fire is punished exactly where the design says it should be.
    const barkWard = worldRegistry.verdant.enemies.find((candidate) => candidate.id === "enemy.verdant.g4.bark-ward")!;
    expect(barkWard.weaknesses?.fire).toBeLessThan(1);
    expect(barkWard.weaknesses?.metal).toBeGreaterThan(1);
  });
});
