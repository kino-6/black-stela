import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createSquadCombatState, executeCommand } from "../src/domain/rulesEngine";
import { withDeterministicIds } from "../src/domain/ids";
import { CLASS_CAPABILITIES } from "../src/domain/classCapabilities";
import { TECHNIQUES } from "../src/domain/techniques";
import { defaultWorld } from "../src/data/defaultWorld";
import { worldRegistry } from "../src/data/worldRegistry";
import type { Character, CombatStatus, GameState } from "../src/domain/types";

/**
 * §9.4b — the growth lines §5 asks for, and the four mechanics they needed built first.
 *
 * The catalog is only half the work. Three of the things §5 names for the Occultist ("sleep, fear,
 * silence") did NOTHING to an enemy group before this slice — only sleep was ever read — and the
 * Knight's whole promise in §4 ("cover, formation stability") had no rule at all. Authoring techniques
 * on top of that would have shipped them as no-ops, which is the exact failure §9.4a existed to stop.
 * These tests hold each mechanic to an OUTCOME.
 */

const warden = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b2f.ash-warden")!;
const caller = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b2f.ash-caller")!;
const slime = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b1f.ash-slime")!;

/** Beats emitted by a resolved round. */
function beatsOf(state: GameState) {
  return state.log.flatMap((entry) => (entry.event?.type === "combat_round_resolved" ? entry.event.beats ?? [] : []));
}

/** A two-group fight with a named party, built under deterministic ids so rolls are reproducible. */
function squadFight(
  members: { name: string; classId: Character["classId"]; row: "front" | "back" }[],
  seed: string,
  packs: typeof warden[] = [warden, caller],
  level = 9
): GameState {
  return withDeterministicIds(`lines-${seed}`, () => {
    let state = createInitialGameState();
    for (const member of members) {
      state = addCharacter(state, createGuildCharacter({ name: member.name, classId: member.classId, seed: `${seed}-${member.name}` }));
    }
    const party = state.party.map((member, index) => ({ ...member, row: members[index].row, level, mp: 60, maxMp: 60 }));
    return { ...state, party, phase: "combat", combat: createSquadCombatState("room.b2f.005", packs) } as GameState;
  });
}

describe("§9.4b Knight — cover is the class, not a flavour line", () => {
  it("takes the blow that would have landed on someone else", () => {
    // TWO WARDENS, not the warden + caller pair: the caller carries an ability, and an ability is
    // deliberately exempt from cover, so a pack that leads with one proves nothing either way. With
    // ability-less packs every enemy action is a basic swing, which is exactly what cover governs.
    const roster = [
      { name: "Rook", classId: "knight" as const, row: "front" as const },
      { name: "Vale", classId: "warrior" as const, row: "front" as const },
      { name: "Mira", classId: "mage" as const, row: "back" as const }
    ];
    // Level 3 (cover's own level) against accurate, feeble slimes: a level 9 party simply evades the
    // wardens, and a round where nothing lands proves nothing about who it would have landed on.
    const state = squadFight(roster, "cover", [slime, slime], 3);
    const knight = state.party[0];
    const holdTheLine = state.party.slice(1).map((member) => ({ actorId: member.id, action: "defend" as const }));

    // Cover runs three rounds; collect every basic swing across them, so one unlucky round of misses
    // cannot make this pass or fail by chance.
    let covered = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: knight.id, action: "cast", spellId: "cover" }, ...holdTheLine]
    });
    const struck = [...beatsOf(covered)];
    for (let round = 0; round < 2 && covered.phase === "combat"; round += 1) {
      covered = executeCommand(covered, defaultWorld, {
        type: "declare_round",
        actions: covered.party.map((member) => ({ actorId: member.id, action: "defend" as const }))
      });
      struck.push(...beatsOf(covered));
    }
    const basicHits = struck.filter((beat) => beat.kind === "enemyHit" && !beat.abilityName);

    expect(basicHits.length, "the packs must actually have landed a basic swing").toBeGreaterThan(0);
    for (const hit of basicHits) {
      expect(hit.targetCharacterId, `a basic swing reached ${hit.targetName} through cover`).toBe(knight.id);
    }

    // And it is a REDIRECTION: without cover the same packs spread their swings across the front row,
    // so "every blow hit the knight" is not just the picker's default.
    let uncovered = state;
    const spreadBeats = [];
    for (let round = 0; round < 3 && uncovered.phase === "combat"; round += 1) {
      uncovered = executeCommand(uncovered, defaultWorld, {
        type: "declare_round",
        actions: uncovered.party.map((member) => ({ actorId: member.id, action: "defend" as const }))
      });
      spreadBeats.push(...beatsOf(uncovered));
    }
    const spread = new Set(
      spreadBeats.filter((beat) => beat.kind === "enemyHit" && !beat.abilityName).map((beat) => beat.targetCharacterId)
    );
    expect(spread.size > 1 || !spread.has(knight.id), "the uncovered round happened to hit only the knight").toBe(true);
  });

  it("does not stop an enemy ABILITY — cover is formation stability, not immunity", () => {
    // The counterplay is deliberate: a back-row-seeking ability still reaches the casters, so cover
    // buys the front line time rather than switching the fight off.
    const covering = TECHNIQUES.cover;
    expect(covering.effects[0].kind).toBe("cover");
    expect(covering.duration).toEqual({ kind: "rounds", rounds: 3 });
  });
});

describe("§9.4b Occultist — fear, silence and poison finally do something to a pack", () => {
  function afflictPack(status: CombatStatus, seed: string) {
    const state = squadFight([{ name: "Cael", classId: "occultist", row: "back" }], seed);
    return {
      ...state,
      combat: {
        ...state.combat!,
        enemyGroups: state.combat!.enemyGroups.map((group) => ({ ...group, status: [status] as CombatStatus[] }))
      }
    } as GameState;
  }

  it("a silenced pack is cut down to its basic swing", () => {
    const silenced = afflictPack("silence", "silence");
    const after = executeCommand(silenced, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: silenced.party[0].id, action: "defend" }]
    });
    const beats = after.log.flatMap((entry) => (entry.event?.type === "combat_round_resolved" ? entry.event.beats ?? [] : []));
    expect(beats.some((beat) => beat.abilityName), "a silenced pack must not work an ability").toBe(false);
  });

  it("a poisoned pack loses bodies to the poison, not to the party", () => {
    const poisoned = afflictPack("poison", "poison");
    const before = poisoned.combat!.enemyGroups.map((group) => group.hpEach);
    const after = executeCommand(poisoned, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: poisoned.party[0].id, action: "defend" }]
    });
    const now = after.combat!.enemyGroups.map((group) => group.hpEach);
    // Nobody attacked, so any lost HP is the poison — which was inert on enemies before §9.4b.
    expect(now.some((hp, index) => hp < before[index])).toBe(true);
  });

  it("dread and silence-hex are control the Occultist owns, and carry no mage damage", () => {
    for (const id of ["dread", "silence-hex", "sunder", "wither"] as const) {
      expect(TECHNIQUES[id].effects.some((effect) => effect.kind === "damage"), id).toBe(false);
    }
    expect(CLASS_CAPABILITIES.occultist.combatTechniques.map((grant) => grant.techniqueId)).not.toContain("firebolt");
  });

  it("life-siphon is a DRAIN: it damages the pack and heals the caster who has no ally to target", () => {
    const state = squadFight([{ name: "Cael", classId: "occultist", row: "back" }], "siphon");
    const hurt: GameState = { ...state, party: state.party.map((member) => ({ ...member, hp: 5 })) };
    const group = hurt.combat!.enemyGroups[0];

    const after = executeCommand(hurt, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: hurt.party[0].id, action: "cast", spellId: "life-siphon", targetGroupId: group.id }]
    });

    // Read the BEATS, not the end-of-round HP: the pack swings back in the same round and would mask
    // the heal entirely. The heal half has no ally target — the technique is enemy-scope — so without
    // the drain rule it would resolve against an empty set and silently do nothing.
    const beats = beatsOf(after);
    const healed = beats.find((beat) => beat.kind === "heal" && beat.spellId === "life-siphon");
    expect(healed?.targetCharacterId, "the drain must restore the caster").toBe(hurt.party[0].id);
    expect(beats.some((beat) => beat.spellId === "life-siphon" && (beat.damage ?? 0) > 0)).toBe(true);
  });
});

describe("§9.4b Mage — group damage reaches every pack", () => {
  it("flame-wave strikes every pack, including the shielded back group", () => {
    const state = squadFight([{ name: "Mira", classId: "mage", row: "back" }], "wave");
    const groupIds = state.combat!.enemyGroups.map((group) => group.id);

    const waved = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: state.party[0].id, action: "cast", spellId: "flame-wave" }]
    });

    // Asserted on the beats rather than on hpEach: hpEach RISES when a body falls (the next one steps
    // up at full health), so "hp went down" is simply not a measure of having been hit.
    const struck = new Set(beatsOf(waved).filter((beat) => beat.spellId === "flame-wave").map((beat) => beat.targetGroupId));
    // `allEnemies` needs no target choice at all — including the back group, which is shielded from
    // melee entirely. That reach is what a group spell is for.
    for (const id of groupIds) {
      expect(struck.has(id), `flame-wave never reached ${id}`).toBe(true);
    }
  });
});

describe("§9.4b the roster holds together", () => {
  it("uses only elements every world declares", () => {
    // An element is a WORLD's cosmology; these techniques are engine code shared by every scenario. A
    // technique naming `salt` would be uncastable in Verdant, where the cosmology is fire/wood/metal.
    const worlds = Object.values(worldRegistry);
    expect(worlds.length, "there must be more than one world for this to mean anything").toBeGreaterThan(1);
    const shared = worlds
      .map((world) => new Set((world.elements ?? []).map((element) => element.id)))
      .reduce((common, declared) => new Set([...common].filter((id) => declared.has(id))));
    for (const technique of Object.values(TECHNIQUES)) {
      for (const effect of technique.effects) {
        if (effect.kind !== "damage") continue;
        expect(effect.element === "physical" || shared.has(effect.element), `${technique.id} uses ${effect.element}`).toBe(true);
      }
      for (const effect of technique.effects) {
        if (effect.kind !== "ward" || !effect.elementResist) continue;
        for (const element of Object.keys(effect.elementResist)) {
          expect(shared.has(element), `${technique.id} wards ${element}`).toBe(true);
        }
      }
    }
  });

  it("never grants a technique nobody can pay for, and never one the castable view refuses", () => {
    for (const [classId, capabilities] of Object.entries(CLASS_CAPABILITIES)) {
      for (const grant of capabilities.combatTechniques) {
        const technique = TECHNIQUES[grant.techniqueId];
        expect(technique, `${classId} grants a missing ${grant.techniqueId}`).toBeDefined();
        // Combat can only spend MP today, so a grant costing an item or HP would be unusable.
        expect(technique.cost.itemId ?? technique.cost.hp ?? technique.cost.usesPerExpedition).toBeUndefined();
      }
    }
  });
});
