import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { getTempoModeForPhase, runTempoStep } from "../src/domain/tempo";
import { defaultWorld } from "../src/data/defaultWorld";
import { createTranslator } from "../src/i18n";
import type { GameState } from "../src/domain/types";

const t = createTranslator("en");

function partyState(): GameState {
  return addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" }));
}

function dungeonAt(roomId: string): GameState {
  return { ...partyState(), phase: "dungeon", position: { roomId, facing: "east" } };
}

describe("tempo rules", () => {
  it("maps phase to tempo mode", () => {
    expect(getTempoModeForPhase("combat")).toBe("combat");
    expect(getTempoModeForPhase("dungeon")).toBe("dungeon");
    expect(getTempoModeForPhase("town")).toBe("idle");
  });

  it("auto-walks a straight corridor and keeps running", () => {
    const result = runTempoStep(dungeonAt("room.b1f.c8_3"), "dungeon", defaultWorld, t);
    expect(result.keepRunning).toBe(true);
    expect(result.state.position?.roomId).toBe("room.b1f.c9_3");
  });

  it("stops at a branching junction", () => {
    // The hub is a four-way chamber.
    const result = runTempoStep(dungeonAt("room.b1f.hub"), "dungeon", defaultWorld, t);
    expect(result.keepRunning).toBe(false);
    expect(result.state.position?.roomId).toBe("room.b1f.hub");
  });

  it("stops on a tile with an encounter", () => {
    const result = runTempoStep(dungeonAt("room.b1f.002"), "dungeon", defaultWorld, t);
    expect(result.keepRunning).toBe(false);
  });

  it("acts in a normal fight rather than stopping", () => {
    const combat = executeCommand(
      executeCommand(partyState(), defaultWorld, { type: "enter_dungeon" }),
      defaultWorld,
      { type: "move_forward" }
    );
    expect(combat.phase).toBe("combat");

    const result = runTempoStep(combat, "combat", defaultWorld, t);
    // A round was declared (or the fight resolved) rather than stopping for a boss.
    expect(result.state).not.toBe(combat);
    expect(result.status).not.toBe(t("tempo.autoStoppedBoss"));
  });
});
