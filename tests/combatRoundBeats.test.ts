import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

// #69 (real fix): a resolved round carries structured beats — each with the battlefield
// state AFTER that blow — so the UI can play the round forward instead of snapping to
// the final state. These lock that the domain emits them with usable snapshots.
function slimeFight(): GameState {
  const vanguard = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "beats" }));
  const entered = executeCommand(vanguard, defaultWorld, { type: "enter_dungeon" });
  return executeCommand(entered, defaultWorld, { type: "move_forward" });
}

function findHit(state: GameState) {
  const entry = [...state.log].reverse().find((candidate) => candidate.event?.type === "combat_round_resolved");
  const beats = entry?.event?.type === "combat_round_resolved" ? entry.event.beats ?? [] : [];
  return beats.find((beat) => beat.kind === "hit");
}

describe("combat_round_resolved beats", () => {
  it("emits a beat per action with a battlefield snapshot and the hit's number", () => {
    let state = slimeFight();
    expect(state.phase).toBe("combat");

    // Attack round by round until a landed blow is recorded (a single roll can miss);
    // that hit beat must carry its target, a damage number, and a battlefield snapshot.
    let hit: NonNullable<ReturnType<typeof findHit>> | undefined;
    for (let round = 0; round < 6 && state.phase === "combat" && !hit; round += 1) {
      const actor = state.party[0];
      const group = state.combat!.enemyGroups.find((candidate) => candidate.count > 0)!;
      state = executeCommand(state, defaultWorld, {
        type: "declare_round",
        actions: [{ actorId: actor.id, action: "attack", targetGroupId: group.id }]
      });
      hit = findHit(state);
    }

    expect(hit).toBeTruthy();
    expect(hit?.damage).toBeGreaterThan(0);
    expect(hit?.groups.length).toBeGreaterThan(0);
    expect(hit?.text).toMatch(/for \d+/);
  });
});
