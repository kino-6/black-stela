import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { debugAutoExplore } from "../src/headless/headlessRunner";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function party(size: number): GameState {
  let state = createInitialGameState();
  for (let i = 0; i < size; i += 1) {
    state = addCharacter(state, createCharacter({ name: `Mira${i}`, notes: "Mapper" }));
  }
  return state;
}

function resolveCombat(state: GameState): GameState {
  let current = state;
  for (let round = 0; round < 20 && current.phase === "combat"; round += 1) {
    current = executeCommand(current, defaultWorld, { type: "attack" });
  }
  return current;
}

// The debug auto-explore walks the floor for the tester (no manual WASD): real
// movement that fires encounters and reveals the map, stopping at each fight, and
// finally standing on the down-stair.
describe("debug auto-explore", () => {
  it("walks into the first fight instead of the player tapping move", () => {
    const entered = executeCommand(party(3), defaultWorld, { type: "enter_dungeon" });
    const stepped = debugAutoExplore(entered, defaultWorld);
    // The entrance opens onto the intro slime — auto-explore hands that fight over.
    expect(stepped.phase).toBe("combat");
    expect(stepped.position?.roomId).toBe("room.b1f.002");
  });

  it("blitzes down through floors, clearing fights, and descends past B1F", () => {
    let state = executeCommand(party(3), defaultWorld, { type: "enter_dungeon" });
    const startVisited = state.map.visitedRooms.length;
    const depth = (id: string | null | undefined) => Number(id?.match(/b(\d+)f/)?.[1] ?? 0);
    // Alternate auto-explore with clearing whatever fight it stops on. Auto-explore
    // now descends on its own, so this should reach a deeper floor.
    for (let pass = 0; pass < 20; pass += 1) {
      state = debugAutoExplore(state, defaultWorld);
      if (state.phase === "combat") {
        state = resolveCombat(state);
        continue;
      }
      break; // no fight left: stopped at a barred descent or the finale
    }
    expect(state.map.visitedRooms.length).toBeGreaterThan(startVisited + 10);
    expect(depth(state.map.floorId)).toBeGreaterThanOrEqual(2); // descended off B1F on its own
  });
});
