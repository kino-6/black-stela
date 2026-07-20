import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { characterSpeciesMultiplier, getEffectiveCharacterStats } from "../src/domain/economy";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { createInitialGameState } from "../src/domain/gameState";
import type { Character, Enemy, GameState, ScenarioAffix, ScenarioWorld } from "../src/domain/types";

// IMP-022: authored affix effects beyond four flat combat bonuses — resilience (hp/mp), status &
// element wards, in-combat regen, and species-specific bite. These prove the contract wires each new
// field through resolveAffixCatalog -> getEffectiveCharacterStats / the combat engine.
const AFFIXES: ScenarioAffix[] = [
  { id: "test.warded", label: "Warded", slots: ["accessory"], minFloor: 1, rarity: "rare", hpBonus: 8, resistBonus: { sleep: 40, poison: 30 } },
  { id: "test.woodward", label: "Woodward", slots: ["body"], minFloor: 1, rarity: "rare", elementResist: { wood: 0.5 } },
  { id: "test.sapfed", label: "Sapfed", slots: ["accessory"], minFloor: 1, rarity: "rare", regen: 4 },
  { id: "test.sporebane", label: "Sporebane", slots: ["weapon"], minFloor: 1, rarity: "rare", speciesBonus: { tag: "spore", multiplier: 2 } }
];

// Dummies that can't fight back (accuracy 0, no damage) so a single round isolates the wearer's
// effect. The spore/plain pair only differs by the `spore` tag.
const dummy = (id: string, tags: string[]): Enemy => ({
  id,
  name: id,
  hp: 200,
  attack: 0,
  armor: 0,
  accuracy: 0,
  damageMin: 0,
  damageMax: 0,
  speed: 1,
  morale: 12,
  xp: 0,
  gold: 0,
  tags
});

const world: ScenarioWorld = {
  ...defaultWorld,
  affixes: [...defaultWorld.affixes, ...AFFIXES],
  enemies: [...defaultWorld.enemies, dummy("test.spore-thing", ["spore"]), dummy("test.plain-thing", [])]
};

const RING = "equip.black-thread-ring"; // a real default accessory to hang the affix on

function hero(equipment: Character["equipment"]): Character {
  return { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "afx" }), row: "front", equipment };
}

function oneRound(member: Character, enemy: Enemy, turn = 0): GameState {
  const base = { ...createInitialGameState(), party: [member] };
  const state: GameState = {
    ...base,
    turn,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
  return executeCommand(state, world, {
    type: "declare_round",
    actions: [{ actorId: member.id, action: "attack", targetGroupId: state.combat!.enemyGroups[0].id }]
  });
}

function groupDamage(after: GameState, groupId: string): number {
  const beats = after.log.flatMap((entry) => (entry.event?.type === "combat_round_resolved" ? entry.event.beats : []));
  return beats.reduce((total, beat) => total + (beat?.targetGroupId === groupId ? beat?.damage ?? 0 : 0), 0);
}

describe("IMP-022 authored affix effects", () => {
  it("resilience & ward affixes harden the wearer (hp / status / element)", () => {
    const bare = getEffectiveCharacterStats(hero({ accessory: { id: RING } }), world);
    const warded = getEffectiveCharacterStats(hero({ accessory: { id: RING, affix: "test.warded" } }), world);
    expect(warded.maxHp).toBe(bare.maxHp + 8); // hpBonus
    expect(warded.resistance?.sleep ?? 0).toBe((bare.resistance?.sleep ?? 0) + 40); // status ward
    expect(warded.resistance?.poison ?? 0).toBe((bare.resistance?.poison ?? 0) + 30);

    const wooded = getEffectiveCharacterStats(hero({ body: { id: RING, affix: "test.woodward" } }), world);
    expect(wooded.elementResist.wood ?? 1).toBeLessThan(1); // element ward
  });

  it("a regen affix restores HP at the top of the round", () => {
    const wounded = { ...hero({ accessory: { id: RING, affix: "test.sapfed" } }), hp: 5 };
    const after = oneRound(wounded, dummy("test.harmless", []));
    // Regen lands BEFORE actions, so the first beat's party snapshot already shows +4 (later beats
    // may reflect the enemy's counter — rollDamage floors a hit at 1 even from a 0-damage dummy).
    const beats = after.log.flatMap((entry) => (entry.event?.type === "combat_round_resolved" ? entry.event.beats : []));
    const firstBeatHp = beats[0]?.party.find((snap) => snap.id === wounded.id)?.hp;
    expect(firstBeatHp).toBe(5 + 4);
    // A member with no regen affix does not heal.
    const plain = { ...hero({ accessory: { id: RING } }), hp: 5 };
    const plainAfter = oneRound(plain, dummy("test.harmless", []));
    const plainBeats = plainAfter.log.flatMap((entry) => (entry.event?.type === "combat_round_resolved" ? entry.event.beats : []));
    expect(plainBeats[0]?.party.find((snap) => snap.id === plain.id)?.hp).toBe(5);
  });

  it("a species-bane affix multiplies damage against its family, not others", () => {
    // ONE base adventurer, two loadouts — same id ⇒ same combat seeds, so the only difference in a
    // fight is the bane itself (a fresh hero() would get a different id and thus different rolls).
    const baseHero = hero({});
    const bane: Character = { ...baseHero, equipment: { weapon: { id: RING, affix: "test.sporebane" } } };
    const plain: Character = { ...baseHero, equipment: { weapon: { id: RING } } };
    // The contract math is deterministic: the multiplier is 2 only for a matching tag.
    expect(characterSpeciesMultiplier(bane, world, ["spore"])).toBe(2);
    expect(characterSpeciesMultiplier(bane, world, ["husk"])).toBe(1);
    expect(characterSpeciesMultiplier(plain, world, ["spore"])).toBe(1);

    // And the engine APPLIES it: summed over rounds (identical per-round seeds for bane vs plain, so
    // each round contributes exactly ×2 or 0 on a miss), the bane deals double against the spore
    // family and nothing extra against another.
    const spore = world.enemies.find((e) => e.id === "test.spore-thing")!;
    const other = world.enemies.find((e) => e.id === "test.plain-thing")!;
    const sumDamage = (member: Character, enemy: Enemy) => {
      let total = 0;
      for (let turn = 1; turn <= 10; turn += 1) {
        const after = oneRound(member, enemy, turn);
        total += groupDamage(after, after.combat!.enemyGroups[0].id);
      }
      return total;
    };
    expect(sumDamage(plain, spore)).toBeGreaterThan(0); // guard: some hits landed to compare
    // Engine applies the bane vs the family — roughly double (crit-then-round adds a little noise to
    // the exact ratio, which is why the deterministic helper above pins the ×2 precisely).
    expect(sumDamage(bane, spore)).toBeGreaterThan(sumDamage(plain, spore) * 1.5);
    // And NOTHING extra off-family — identical rolls, no multiplier, so byte-exact.
    expect(sumDamage(bane, other)).toBe(sumDamage(plain, other));
  });
});
