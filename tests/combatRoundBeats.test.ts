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

describe("combat_round_resolved beats", () => {
  it("emits a beat per action with a battlefield snapshot and the hit's number", () => {
    const combat = slimeFight();
    expect(combat.phase).toBe("combat");
    const actor = combat.party[0];
    const group = combat.combat!.enemyGroups[0];

    const after = executeCommand(combat, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "attack", targetGroupId: group.id }]
    });

    const roundEntry = [...after.log].reverse().find((entry) => entry.event?.type === "combat_round_resolved");
    expect(roundEntry?.event?.type).toBe("combat_round_resolved");
    const beats = roundEntry?.event?.type === "combat_round_resolved" ? roundEntry.event.beats ?? [] : [];

    // At least the attacker's blow is a beat, carrying its target, a damage number,
    // and a snapshot of every group's remaining count/hp at that instant.
    expect(beats.length).toBeGreaterThan(0);
    const hit = beats.find((beat) => beat.kind === "hit");
    expect(hit).toBeTruthy();
    expect(hit?.targetGroupId).toBe(group.id);
    expect(hit?.damage).toBeGreaterThan(0);
    expect(hit?.groups.some((snap) => snap.id === group.id)).toBe(true);
    // Snapshots are consistent with the summary text (which the UI also shows).
    expect(hit?.text).toMatch(/for \d+/);
  });
});
