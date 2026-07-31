import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Character, CombatStatus, GameState } from "../src/domain/types";

function expeditionState(): GameState {
  const priest: Character = {
    ...createGuildCharacter({ name: "Sei", classId: "priest", seed: "camp-priest" }),
    hp: 9,
    mp: 12,
    maxMp: 12
  };
  const ally = {
    ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "camp-warrior" }),
    hp: 1,
    status: ["poison", "silence", "fear"] as CombatStatus[]
  };
  return {
    ...addCharacter(addCharacter(createInitialGameState(), priest), ally),
    phase: "dungeon"
  };
}

describe("camp techniques", () => {
  it("spends the caster's MP to heal a selected ally outside combat", () => {
    const state = expeditionState();
    const caster = state.party[0];
    const target = state.party[1];

    const after = executeCommand(state, defaultWorld, {
      type: "use_technique",
      characterId: caster.id,
      techniqueId: "heal",
      targetCharacterId: target.id
    });

    expect(after.party[1].hp).toBeGreaterThan(target.hp);
    expect(after.party[0].mp).toBe(caster.mp - 3);
    expect(after.turn).toBe(state.turn + 1);
  });

  it("removes only the named afflictions and cannot be cast by a silenced priest", () => {
    const state = expeditionState();
    const caster = state.party[0];
    const target = state.party[1];

    const cured = executeCommand(state, defaultWorld, {
      type: "use_technique",
      characterId: caster.id,
      techniqueId: "purge",
      targetCharacterId: target.id
    });
    expect(cured.party[1].status).toEqual(["fear"]);
    expect(cured.party[0].mp).toBe(caster.mp - 4);

    const silenced: GameState = {
      ...state,
      party: state.party.map((member) => member.id === caster.id ? { ...member, status: ["silence"] as CombatStatus[] } : member)
    };
    const refused = executeCommand(silenced, defaultWorld, {
      type: "use_technique",
      characterId: caster.id,
      techniqueId: "purge",
      targetCharacterId: target.id
    });
    expect(refused).toEqual(silenced);
  });

  it("rejects combat-only and unknown techniques instead of creating an exploration-only buff rule", () => {
    const state = expeditionState();
    const caster = state.party[0];

    const battleOnly = executeCommand(state, defaultWorld, {
      type: "use_technique",
      characterId: caster.id,
      techniqueId: "blessing"
    });
    expect(battleOnly).toEqual(state);

    const unlearned = executeCommand(state, defaultWorld, {
      type: "use_technique",
      characterId: caster.id,
      techniqueId: "greater-heal",
      targetCharacterId: caster.id
    });
    expect(unlearned).toEqual(state);
  });
});
