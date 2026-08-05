import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { dungeonGroupOfRoom, resolveEntrances } from "../src/domain/scenario";
import type { DungeonFloor, DungeonRoom, ScenarioWorld } from "../src/domain/types";

// T30/U5: a scenario may offer MORE THAN ONE dungeon, each entered from its own town portal. Build a
// two-dungeon world by grafting a small ANNEX dungeon onto the default world and prove the mechanism —
// without disturbing any shipped world (the single-dungeon default is the back-compat baseline).
function twoDungeonWorld(): ScenarioWorld {
  const annexRoom: DungeonRoom = {
    id: "room.annex.001",
    name: "Annex Landing",
    description: "A separate vault, reached by its own door from town.",
    exits: {}
  } as DungeonRoom;
  const annexFloor: DungeonFloor = {
    id: "dungeon.annex",
    dungeon: "annex", // a DIFFERENT group ⇒ an independent dungeon
    name: "The Annex",
    startRoom: "room.annex.001",
    rooms: [annexRoom],
    level: 1
  };
  return {
    ...defaultWorld,
    dungeons: [...defaultWorld.dungeons, annexFloor],
    entrances: [
      { id: "main", startRoom: defaultWorld.startRoom, label: "Descend the black stela" },
      { id: "annex", startRoom: "room.annex.001", label: "Enter the Annex" }
    ]
  };
}

function party() {
  return addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" }));
}

describe("N dungeons per scenario (T30/U5)", () => {
  it("resolves one entrance for a single-dungeon world (back-compat)", () => {
    const entrances = resolveEntrances(defaultWorld);
    expect(entrances).toHaveLength(1);
    expect(entrances[0]).toMatchObject({ startRoom: defaultWorld.startRoom, dungeon: defaultWorld.startDungeon });
  });

  it("resolves every authored entrance, tagged with the dungeon its room belongs to", () => {
    const world = twoDungeonWorld();
    const entrances = resolveEntrances(world);
    expect(entrances.map((entrance) => entrance.id)).toEqual(["main", "annex"]);
    // The main portal opens the default dungeon; the annex portal opens the annex group.
    expect(entrances[0].dungeon).toBe(defaultWorld.startDungeon);
    expect(entrances[1].dungeon).toBe("annex");
  });

  it("classifies a room by its dungeon group", () => {
    const world = twoDungeonWorld();
    expect(dungeonGroupOfRoom(world, defaultWorld.startRoom)).toBe(defaultWorld.startDungeon);
    expect(dungeonGroupOfRoom(world, "room.annex.001")).toBe("annex");
  });

  it("enters the CHOSEN dungeon at its portal", () => {
    const world = twoDungeonWorld();
    const entered = executeCommand(party(), world, { type: "enter_dungeon", startRoom: "room.annex.001" });
    expect(entered.phase).toBe("dungeon");
    expect(entered.position?.roomId).toBe("room.annex.001");
    expect(entered.map.floorId).toBe("dungeon.annex");
  });

  it("defaults to the world's start room when no portal is named (back-compat)", () => {
    const world = twoDungeonWorld();
    const entered = executeCommand(party(), world, { type: "enter_dungeon" });
    expect(entered.position?.roomId).toBe(defaultWorld.startRoom);
    expect(entered.map.floorId).toBe(defaultWorld.startDungeon);
  });

  it("falls back to the default entrance for an unknown/foreign portal room (never strands the party)", () => {
    const world = twoDungeonWorld();
    const entered = executeCommand(party(), world, { type: "enter_dungeon", startRoom: "room.nowhere" });
    expect(entered.position?.roomId).toBe(defaultWorld.startRoom);
  });
});
