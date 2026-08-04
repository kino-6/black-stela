import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { debugAutoExplore } from "../src/headless/headlessRunner";
import { createDebugStateFromProgress, type DebugProgress } from "../src/debug/debugStart";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

const floorDepth = (id: string | null | undefined) => Number(id?.match(/b(\d+)f/)?.[1] ?? 0);

function party(size: number): GameState {
  let state = createInitialGameState();
  for (let i = 0; i < size; i += 1) {
    state = addCharacter(state, createCharacter({ name: `Mira${i}`, notes: "Mapper" }));
  }
  return state;
}

// Force-win the fights the explorer stops on. This is a NAVIGATION test (does auto-explore descend on its
// own?), not an attrition test — and T13 (2026-08-02) made Act I bite hard enough that a small fresh party
// wipes a real fight, ending the walk. debug_force_victory records the defeat and returns to the dungeon
// so the explorer can keep walking, regardless of balance.
function resolveCombat(state: GameState): GameState {
  let current = state;
  if (current.phase === "combat") {
    current = executeCommand(current, defaultWorld, { type: "debug_force_victory" });
  }
  if (current.combatConclusion) {
    current = executeCommand(current, defaultWorld, { type: "continue_after_combat" });
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
    // now descends on its own, so this should reach a deeper floor. Wandering
    // encounters interrupt far more often now, so the pass budget is generous.
    for (let pass = 0; pass < 400; pass += 1) {
      state = debugAutoExplore(state, defaultWorld);
      if (state.phase === "combat") {
        state = resolveCombat(state);
        // This test is about NAVIGATION, not attrition: wandering encounters would
        // otherwise grind a 3-person party down until it wipes back to town. Patch
        // them up between fights so the explorer can keep walking.
        state = executeCommand(state, defaultWorld, { type: "debug_revive_party" });
        continue;
      }
      break; // no fight left: stopped at a barred descent or the finale
    }
    expect(state.map.visitedRooms.length).toBeGreaterThan(startVisited + 10);
    expect(depth(state.map.floorId)).toBeGreaterThanOrEqual(2); // descended off B1F on its own
  }, 30000); // up to 400 passes of walk+fight — well over the 5s default on a slow CI runner

  // Regression: a floor's always-open RETURN shortcut (e.g. B5F's bar → B2F) must
  // never be treated as a forward exploration path. Before the descendOnly fix the
  // auto-explorer walked B5F's west shortcut to B2F and then re-descended, so the
  // party visibly warped "B5F → B3F". Auto-explore must only ever go deeper.
  it("never warps backward up a return shortcut while auto-exploring", () => {
    for (const progress of ["floor_2", "floor_3", "floor_5", "floor_6", "floor_7"] as DebugProgress[]) {
      let state = createDebugStateFromProgress(defaultWorld, progress);
      const startDepth = floorDepth(state.map.floorId);
      let deepest = startDepth;
      for (let pass = 0; pass < 30; pass += 1) {
        const before = state;
        state = debugAutoExplore(state, defaultWorld);
        if (state.phase === "combat") {
          state = resolveCombat(state);
          continue;
        }
        deepest = Math.max(deepest, floorDepth(state.map.floorId));
        // The party must never end a pass on a floor SHALLOWER than where it began.
        expect(floorDepth(state.map.floorId)).toBeGreaterThanOrEqual(startDepth);
        if (state === before || state.phase === "town") break;
      }
      // And it should have made downward progress (or already been at the finale).
      expect(deepest).toBeGreaterThanOrEqual(startDepth);
    }
  }, 30000); // five progress states × up to 30 walk+fight passes — over the 5s default on slow CI
});
