import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import type { GameState } from "../src/domain/types";

// Nobody dies in this game: hp<=0 becomes hp:1 + `wounded`, and a wounded member cannot
// act. So once EVERY member is wounded there were zero able actors and combat could not
// be advanced, fled, or won — the run SOFT-LOCKED in the fight forever. There was no
// defeat path at all. These lock the wipe handling.
function partyInCombat(size: number): GameState {
  let state = createInitialGameState();
  for (let i = 0; i < size; i += 1) {
    state = addCharacter(state, createCharacter({ name: `A${i}`, notes: "x" }));
  }
  state = executeCommand(state, defaultWorld, { type: "enter_dungeon" });
  state = executeCommand(state, defaultWorld, { type: "move_forward" }); // into the B1F slime
  expect(state.phase).toBe("combat");
  return state;
}

describe("party wipe", () => {
  it("ends the fight and drags the party to town once nobody can act", () => {
    let state = partyInCombat(2);
    const goldBefore = state.partyGold;
    // Everyone is down (the end-state the engine itself produces on hp<=0).
    state = {
      ...state,
      party: state.party.map((m) => ({ ...m, hp: 1, injury: "wounded" as const }))
    } as GameState;
    expect(state.party.filter((m) => m.hp > 0 && !m.injury)).toHaveLength(0);

    const after = executeCommand(state, defaultWorld, { type: "declare_round", actions: [] });

    expect(after.phase).toBe("town"); // no longer stuck in combat
    expect(after.combat).toBeNull();
    expect(after.position).toBeNull();
    expect(after.log.some((entry) => entry.tags.includes("combat"))).toBe(true);
    // Rescue costs half the purse — a real consequence, not a free reset.
    expect(after.partyGold).toBe(goldBefore - Math.floor(goldBefore / 2));
    // They stay wounded: the infirmary still has to be paid.
    expect(after.party.every((m) => m.injury === "wounded")).toBe(true);
  });

  it("does NOT wipe while even one member can still act", () => {
    let state = partyInCombat(2);
    state = {
      ...state,
      party: state.party.map((m, index) =>
        index === 0 ? { ...m, hp: 1, injury: "wounded" as const } : m
      )
    } as GameState;
    const able = state.party.filter((m) => m.hp > 0 && !m.injury);
    expect(able).toHaveLength(1);

    const group = state.combat!.enemyGroups.find((g) => g.count > 0)!;
    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: able.map((a) => ({ actorId: a.id, action: "attack" as const, targetGroupId: group.id }))
    });

    // The fight resolves normally (won or ongoing) — never a wipe to town.
    expect(after.phase).not.toBe("town");
  });
});
