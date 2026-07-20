import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { applyLastingEffects, statModifier, tickEffects, wardStatusResist } from "../src/domain/combatEffects";
import { TECHNIQUES } from "../src/domain/techniques";
import { SPELLS, spellTargeting } from "../src/domain/spells";
import { defaultWorld } from "../src/domain/../data/defaultWorld";
import { withDeterministicIds } from "../src/domain/ids";
import type { Character, GameState } from "../src/domain/types";

/**
 * §9.4 — the four ability families the resolver could not previously carry out.
 *
 * The catalog could DESCRIBE a cure, a ward, a buff and a debuff since §9.1, but the resolver understood
 * only "heal a number, deal damage, inflict one status", so `toLegacySpell` refused them and a class
 * granted one silently learned nothing. These tests exist to prove each family changes a real OUTCOME —
 * not that a technique exists, and not that an id was stored. If the resolver ever narrows again, the
 * families stop shipping quietly, and these are what make that loud.
 */

/**
 * Drop a party of one into the first fight on B1F, at a level where it knows the technique.
 *
 * Built under `withDeterministicIds` for the same reason the trace fixture is: a character's id comes
 * from crypto.randomUUID by default, and the combat RNG seeds every roll on it, so ailment wear-off and
 * damage would vary run to run and these tests would go intermittently red for no reason.
 */
function enterCombatWith(classId: Character["classId"], level: number, seed: string): { state: GameState; actor: Character } {
  return withDeterministicIds(`family-${seed}`, () => {
    const base = createGuildCharacter({ name: "Probe", classId, seed });
    // Level is what gates a grant; the rest of the character is left exactly as the guild built it.
    const levelled: Character = { ...base, level, mp: 40, maxMp: 40 };
    const state = executeCommand(addCharacter(createInitialGameState(), levelled), defaultWorld, { type: "enter_dungeon" });
    const combat = executeCommand(state, defaultWorld, { type: "move_forward" });
    expect(combat.phase, "the probe party must actually be in a fight").toBe("combat");
    return { state: combat, actor: combat.party[0] };
  });
}

describe("§9.4 cure — the priest can lift an affliction, not only out-heal it", () => {
  it("purge removes poison and silence from an ally, and says so", () => {
    // Two priests: the caster must be CLEAN, because silence rightly blocks a spell (see the next test).
    // Curing silence therefore has to be something one caster does for another — which is itself the
    // reason a silenced party is not simply stuck.
    const { state, actor } = enterCombatWith("priest", 3, "cure");
    const patient: Character = withDeterministicIds("cure-patient", () => ({
      ...createGuildCharacter({ name: "Patient", classId: "priest", seed: "cure-patient" }),
      level: 3,
      status: ["poison", "silence", "fear"] as Character["status"]
    }));
    const afflicted: GameState = { ...state, party: [...state.party, patient] };

    const after = executeCommand(afflicted, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "purge", targetCharacterId: patient.id }]
    });

    const healed = after.party.find((member) => member.id === patient.id)!;
    // Poison and silence are gone; fear — which purge does not name — is untouched. A cure that
    // stripped everything would make the chanter's ward and every other cure pointless.
    expect(healed.status).not.toContain("poison");
    expect(healed.status).not.toContain("silence");
    expect(healed.status).toContain("fear");
  });

  it("a silenced priest still cannot cast it — the cure is a spell, not a way around silence", () => {
    const { state, actor } = enterCombatWith("priest", 3, "cure-silenced");
    const silenced: GameState = {
      ...state,
      party: state.party.map((member) => ({ ...member, status: ["poison", "silence"] as Character["status"] }))
    };

    const after = executeCommand(silenced, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "purge", targetCharacterId: actor.id }]
    });

    expect(after.party[0].status).toContain("poison");
    expect(after.party[0].mp, "a refused cast spends nothing").toBe(silenced.party[0].mp);
  });
});

describe("§9.4 ward — the chanter prevents rather than removes", () => {
  it("ward-hymn raises the whole party's resistance and lasts the fight", () => {
    const { state, actor } = enterCombatWith("chanter", 4, "ward");

    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "ward-hymn" }]
    });

    // Party scope needs no target field at all — that is exactly what the old resolver could not do.
    const effects = after.combat!.effects ?? [];
    expect(effects.some((active) => active.source === "ward-hymn" && active.subjectId === actor.id)).toBe(true);
    // `combat` duration = runs until the fight ends, so it survives the round tick with no counter.
    expect(effects.find((active) => active.source === "ward-hymn")?.remaining).toBeNull();
    // §9.4e raised this from 25: the coverage sim showed the Chanter only narrowly ahead of a one-shot charm.
    expect(wardStatusResist(effects, actor.id, "fear")).toBe(35);

    // And it reaches the stat pipeline every other rule reads, rather than sitting in a list.
    const warded = getEffectiveCharacterStats(after.party[0], defaultWorld, effects);
    const bare = getEffectiveCharacterStats(after.party[0], defaultWorld);
    expect(warded.resistance.fear ?? 0).toBeGreaterThan(bare.resistance.fear ?? 0);
  });
});

describe("§9.4 buff and debuff — the numbers actually move", () => {
  it("battle-hymn raises the party's damage for a fixed number of rounds, then expires", () => {
    const { state, actor } = enterCombatWith("chanter", 5, "buff");

    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "battle-hymn" }]
    });

    let effects = after.combat!.effects ?? [];
    expect(statModifier(effects, actor.id, "damage")).toBe(2);
    const buffed = getEffectiveCharacterStats(after.party[0], defaultWorld, effects);
    const bare = getEffectiveCharacterStats(after.party[0], defaultWorld);
    expect(buffed.damageMin).toBe(bare.damageMin + 2);
    expect(buffed.damageMax).toBe(bare.damageMax + 2);

    // Three rounds, and it is gone — a timed buff the chanter must re-sing, not a permanent gift.
    // (One round was already spent by the cast itself, so two more exhaust it.)
    expect(effects.find((active) => active.source === "battle-hymn")?.remaining).toBe(2);
    effects = tickEffects(tickEffects(effects));
    expect(statModifier(effects, actor.id, "damage")).toBe(0);
  });

  it("sunder strips a pack's armour, which every weapon in the party benefits from", () => {
    const { state, actor } = enterCombatWith("occultist", 4, "debuff");
    const group = state.combat!.enemyGroups[0];

    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "sunder", targetGroupId: group.id }]
    });

    // The debuff is recorded against the ENEMY GROUP, not the caster — the same effect list serves both
    // sides, which is why a party buff and an enemy debuff cannot drift apart.
    const effects = after.combat!.effects ?? [];
    expect(statModifier(effects, group.id, "armor")).toBe(-3);
    expect(statModifier(effects, actor.id, "armor")).toBe(0);
  });
});

describe("§9.4 the player can actually reach the new scopes", () => {
  it("classifies what the player must choose, for every technique that ships", () => {
    // The bug this locks: the combat UI branched "ally → pick a party member, ELSE pick an enemy
    // group". A party-scope ward is neither, so it fell into the enemy branch, the menu correctly
    // never asked for a group, and the order was silently dropped — selectable in the menu, and
    // nothing happened. Every unit test still passed, because the resolver was fine. Only a real
    // cast in the browser shows it.
    for (const technique of Object.values(TECHNIQUES)) {
      const spell = SPELLS[technique.id];
      if (!spell) continue;
      const targeting = spellTargeting(spell.target);
      if (technique.target === "ally") expect(targeting, technique.id).toBe("ally");
      else if (technique.target === "enemyGroup") expect(targeting, technique.id).toBe("group");
      // self / party / allEnemies must ask the player for NOTHING — the scope is the target.
      else expect(targeting, technique.id).toBe("none");
    }
  });

  it("a party-scope technique resolves when queued with no target fields at all", () => {
    const { state, actor } = enterCombatWith("chanter", 5, "notarget");
    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "battle-hymn" }]
    });
    expect(statModifier(after.combat!.effects ?? [], actor.id, "damage")).toBe(2);
    expect(after.party[0].mp).toBe(state.party[0].mp - 5);
  });
});

describe("§9.4 the effect layer itself", () => {
  it("re-casting the same technique refreshes rather than stacks", () => {
    // Otherwise a chanter could spend a fight re-singing one hymn and walk out with an unbounded
    // bonus — the "every job at once" failure §6 forbids.
    let effects = applyLastingEffects([], "subject", TECHNIQUES["battle-hymn"]);
    effects = applyLastingEffects(effects, "subject", TECHNIQUES["battle-hymn"]);
    expect(effects).toHaveLength(1);
    expect(statModifier(effects, "subject", "damage")).toBe(2);
  });

  it("two different techniques touching one stat do stack — that is the composition reward", () => {
    const effects = applyLastingEffects(
      applyLastingEffects([], "subject", TECHNIQUES["battle-hymn"]),
      "subject",
      { ...TECHNIQUES.sunder, id: "power-strike", target: "party", effects: [{ kind: "buff", stat: "damage", amount: 1 }] }
    );
    expect(statModifier(effects, "subject", "damage")).toBe(3);
  });

  it("never leaks out of the fight it was cast in", () => {
    // The whole reason these live on CombatState and not on Character: a ward that rode home in a save
    // would be a permanent stat gift, and every future save migration would have to reason about it.
    const { state, actor } = enterCombatWith("chanter", 4, "leak");
    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "ward-hymn" }]
    });
    expect((after.combat!.effects ?? []).length).toBeGreaterThan(0);
    // Nothing was written onto the character, so there is nothing to clean up when combat ends.
    expect(after.party[0]).not.toHaveProperty("effects");
    expect(getEffectiveCharacterStats(after.party[0], defaultWorld).resistance.fear ?? 0).toBe(
      getEffectiveCharacterStats(state.party[0], defaultWorld).resistance.fear ?? 0
    );
  });
});
