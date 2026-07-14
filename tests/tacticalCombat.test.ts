import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import type { Character, GameState } from "../src/domain/types";

function character(name: string, row: Character["row"], attack = 4): Character {
  return {
    ...createCharacter({ name, notes: `${row} line` }),
    row,
    attack,
    damageMin: Math.max(1, attack - 1),
    damageMax: attack + 1,
    accuracy: 80,
    armor: row === "front" ? 1 : 0,
    speed: row === "front" ? 8 : 6
  };
}

function tacticalCombatState(): GameState {
  const base = createInitialGameState();
  return {
    ...addCharacter(addCharacter(base, character("Mira", "front", 4)), character("Sei", "back", 3)),
    phase: "combat",
    position: { roomId: "room.b1f.002", facing: "east" },
    combat: {
      roomId: "room.b1f.002",
      round: 1,
      selectedActorId: "char.front",
      selectedTargetId: "group.slime",
      enemy: {
        id: "enemy.b1f.ash-slime",
        name: "Ash Slime",
        hp: 4,
        attack: 1
      },
      enemyGroups: [
        {
          id: "group.slime",
          enemyId: "enemy.b1f.ash-slime",
          name: "Ash Slime",
          count: 2,
          hpEach: 4,
          maxHpEach: 4,
          attack: 1,
          armor: 0,
          accuracy: 65,
          damageMin: 1,
          damageMax: 2,
          speed: 4,
          morale: 7,
          xp: 3,
          gold: 2,
          role: "attrition"
        }
      ],
      pendingActions: []
    },
    party: [
      { ...character("Mira", "front", 4), id: "char.front" },
      { ...character("Sei", "back", 3), id: "char.back" }
    ]
  };
}

describe("tactical combat", () => {
  it("blocks back-row melee while a front-row ally is still standing", () => {
    const state = tacticalCombatState();
    const blocked = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: "char.back", action: "attack", targetGroupId: "group.slime" }]
    });

    expect(blocked.combat?.pendingActions).toEqual([]);
    expect(blocked.log.at(-1)?.text).toMatch(/front row/i);
  });

  it("declares actor-target actions and resolves a deterministic combat round", () => {
    const state = tacticalCombatState();
    const next = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: "char.front", action: "attack", targetGroupId: "group.slime" }]
    });

    expect(next.combat?.round).toBe(2);
    expect(next.combat?.enemyGroups[0].count).toBe(1);
    expect(next.log.map((entry) => entry.tags).flat()).toContain("round");
    expect(next.log.at(-1)?.text).toMatch(/Round 1/i);
  });

  it("resolves multiple front-row orders before enemies answer", () => {
    const state = {
      ...tacticalCombatState(),
      party: [
        { ...character("Mira", "front", 8), id: "char.front" },
        { ...character("Bran", "front", 8), id: "char.second" }
      ],
      combat: {
        ...tacticalCombatState().combat!,
        enemyGroups: [{ ...tacticalCombatState().combat!.enemyGroups[0], count: 2, hpEach: 2, maxHpEach: 2 }]
      }
    };

    const next = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [
        { actorId: "char.front", action: "attack", targetGroupId: "group.slime" },
        { actorId: "char.second", action: "attack", targetGroupId: "group.slime" }
      ]
    });

    expect(next.phase).toBe("dungeon");
    expect(next.combat).toBeNull();
    expect(next.party.every((member) => member.hp === state.party.find((before) => before.id === member.id)?.hp)).toBe(true);
  });

  it("grants rewards and clears combat when the last enemy group falls", () => {
    const state = {
      ...tacticalCombatState(),
      combat: {
        ...tacticalCombatState().combat!,
        enemyGroups: [{ ...tacticalCombatState().combat!.enemyGroups[0], count: 1, hpEach: 2, xp: 5, gold: 3 }]
      }
    };

    const next = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: "char.front", action: "attack", targetGroupId: "group.slime" }]
    });

    expect(next.phase).toBe("dungeon");
    expect(next.combat).toBeNull();
    expect(next.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(next.party[0]).toMatchObject({ xp: 5, gold: 3 });
    expect(next.partyGold).toBe(state.partyGold + 3);
    expect(next.log.at(-1)?.text).toMatch(/Victory/i);
    expect(next.combatConclusion).toMatchObject({
      enemyIds: ["enemy.b1f.ash-slime"],
      xp: 5,
      gold: 3,
      resumePosition: state.position
    });

    const blocked = executeCommand(next, defaultWorld, { type: "move_forward" });
    expect(blocked).toBe(next);

    const resumed = executeCommand(next, defaultWorld, { type: "continue_after_combat" });
    expect(resumed.combatConclusion).toBeNull();
    expect(resumed.position).toEqual(state.position);
  });

  it("consumes healing items used as declared round actions", () => {
    const state = {
      ...tacticalCombatState(),
      party: tacticalCombatState().party.map((member) => (member.id === "char.front" ? { ...member, hp: 4 } : member)),
      inventory: [
        {
          id: "item.healing-draught",
          name: "Healing Draught",
          kind: "healing" as const,
          quantity: 1,
          healAmount: 4
        }
      ]
    };

    const next = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [
        {
          actorId: "char.front",
          action: "use_item",
          itemId: "item.healing-draught",
          targetCharacterId: "char.front"
        }
      ]
    });

    expect(next.party.find((member) => member.id === "char.front")?.hp).toBeGreaterThan(4);
    expect(next.inventory.find((item) => item.id === "item.healing-draught")?.quantity).toBe(0);
  });
});
