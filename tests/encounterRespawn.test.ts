import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import type { GameState } from "../src/domain/types";

// Before this, the dungeon was FINITE and FIXED: a defeated enemy TYPE was suppressed
// for the whole run (first-contact), treasure was claimed forever, and corridors never
// ambushed you — so after ~11 fights the maze was empty. Now: suppression + treasure are
// scoped to the FLOOR VISIT (re-enter a floor and its 玄室 repopulate), and walking can
// trigger a wandering encounter.
function party(size: number): GameState {
  let s = createInitialGameState();
  for (let i = 0; i < size; i += 1) s = addCharacter(s, createCharacter({ name: `A${i}`, notes: "x" }));
  return s;
}

describe("encounter model", () => {
  it("scopes cleared enemies + claimed treasure to the floor visit, and resets on floor change", () => {
    let s = party(3);
    s = executeCommand(s, defaultWorld, { type: "enter_dungeon" });
    // Pretend a fight and a chest happened on this floor.
    s = {
      ...s,
      defeatedEnemies: ["enemy.b1f.ash-slime"],
      floorClearedEnemies: ["enemy.b1f.ash-slime"],
      claimedTreasures: ["room.b1f.002"],
      floorClaimedTreasures: ["room.b1f.002"]
    } as GameState;

    // Re-entering the dungeon (a floor arrival) repopulates the floor.
    const back = executeCommand(s, defaultWorld, { type: "enter_dungeon" });
    expect(back.floorClearedEnemies).toEqual([]);
    // The floor's claim list is reset — the chest we had looted is lootable again.
    // (The landing room's own chest is collected on arrival, so the list isn't empty.)
    expect(back.floorClaimedTreasures).not.toContain("room.b1f.002");
    // The run-long record is NOT wiped — it still remembers what was ever killed.
    expect(back.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(back.claimedTreasures).toContain("room.b1f.002");
  });

  it("re-fights a floor's chamber enemy after the floor is re-entered", () => {
    let s = party(3);
    s = executeCommand(s, defaultWorld, { type: "enter_dungeon" });
    s = executeCommand(s, defaultWorld, { type: "move_forward" }); // the B1F slime room
    expect(s.phase).toBe("combat");
    const first = s.combat!.enemy.id;

    // Clear it (as a victory would) and step back out, then re-enter the floor.
    s = { ...s, phase: "dungeon", combat: null, floorClearedEnemies: [first] } as GameState;
    const reentered = executeCommand(s, defaultWorld, { type: "enter_dungeon" });
    const refought = executeCommand(reentered, defaultWorld, { type: "move_forward" });

    // The chamber holds its enemy again — the dungeon is no longer a one-shot.
    expect(refought.phase).toBe("combat");
    expect(refought.combat!.enemy.id).toBe(first);
  });

  it("a wandering encounter can fire while walking a corridor (verdant)", () => {
    const verdant = worldRegistry.verdant;
    let s = party(3);
    s = executeCommand(s, verdant, { type: "enter_dungeon" });
    let wandered = false;
    for (let step = 0; step < 120 && !wandered; step += 1) {
      const before = s.position?.roomId;
      s = executeCommand(s, verdant, { type: "move_forward" });
      if (s.phase === "combat") {
        const room = verdant.dungeons[0].rooms.find((r) => r.id === s.combat!.roomId);
        // Fired in a room with NO authored fight → it was a wandering pack.
        if (!room?.encounter && !room?.encounterTable && !room?.encounterSquad) wandered = true;
        s = { ...s, phase: "dungeon", combat: null } as GameState; // shrug it off and keep walking
      }
      if (s.position?.roomId === before) s = executeCommand(s, verdant, { type: "turn_right" });
    }
    expect(wandered, "walking the maze should eventually be ambushed").toBe(true);
  });
});
