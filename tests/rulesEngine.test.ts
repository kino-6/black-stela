import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand, listUnlockedCheckpoints, resolveCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function stateWithParty() {
  return addCharacter(
    createInitialGameState(),
    createCharacter({ name: "Mira", notes: "Mapper", portraitRef: "data:image/png;base64,AAA" })
  );
}

function resolveCombat(state: GameState) {
  let current = state;
  for (let round = 0; round < 6 && current.phase === "combat"; round += 1) {
    current = executeCommand(current, defaultWorld, { type: "attack" });
  }
  return current;
}

function advanceToB1fMarker(state: GameState) {
  let current = state;
  for (let step = 0; step < 4; step += 1) {
    current = executeCommand(current, defaultWorld, { type: "move_forward" });
  }
  return current;
}

describe("rules engine", () => {
  it("requires a party before entering the dungeon", () => {
    const state = executeCommand(createInitialGameState(), defaultWorld, { type: "enter_dungeon" });

    expect(state.phase).toBe("town");
    expect(state.log.at(-1)?.text).toMatch(/party is required/i);
  });

  it("emits typed events and projects them into canonical log entries", () => {
    const result = resolveCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });

    expect(result.events).toContainEqual({
      type: "dungeon_entered",
      roomId: "room.b1f.001",
      facing: "east"
    });
    expect(result.events).toContainEqual({
      type: "map_room_visited",
      floorId: "dungeon.b1f",
      roomId: "room.b1f.001"
    });
    expect(result.state.log).toContainEqual(
      expect.objectContaining({
        text: "The party descends beneath the black stela.",
        tags: ["dungeon"]
      })
    );
    expect(result.state.log.at(-1)).toMatchObject({
      text: "Found Healing Draught x1.",
      tags: ["item", "treasure"]
    });
    expect(result.state.map).toMatchObject({
      floorId: "dungeon.b1f",
      currentRoomId: "room.b1f.001",
      currentCellId: "cell.b1f.001",
      currentFacing: "east",
      visitedCells: ["cell.b1f.001"],
      knownExits: { "room.b1f.001": ["east"] }
    });
  });

  it("records blocked exits as map events without adding extra display prose", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const turned = executeCommand(entered, defaultWorld, { type: "turn_left" });
    const result = resolveCommand(turned, defaultWorld, { type: "move_forward" });

    expect(result.events).toContainEqual({
      type: "map_exit_blocked",
      floorId: "dungeon.b1f",
      roomId: "room.b1f.001",
      direction: "north"
    });
    expect(result.state.map.blockedExits["room.b1f.001"]).toEqual(["north"]);
    expect(result.state.log.at(-1)?.text).toBe("A cold wall blocks the way.");
  });

  it("enters the dungeon and triggers deterministic trap and combat on movement", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const moved = executeCommand(entered, defaultWorld, { type: "move_forward" });

    expect(moved.phase).toBe("combat");
    expect(moved.position?.roomId).toBe("room.b1f.002");
    expect(moved.position?.cellId).toBe("cell.b1f.002");
    expect(moved.map.currentCellId).toBe("cell.b1f.002");
    expect(moved.resolvedTraps).toContain("trap.b1f.needle");
    expect(moved.party[0].hp).toBe(moved.party[0].maxHp - 2);
    expect(moved.combat?.enemy.name).toBe("Ash Slime");
    expect(moved.log.map((entry) => entry.text)).toEqual(
      expect.arrayContaining([
        "The party advances into Hall of Old Dust.",
        "A hidden needle plate snaps shut. The party is injured, but nobody is erased.",
        "Ash Slime blocks the passage."
      ])
    );
  });

  it("blocks return to town until the party reaches a return stair", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const moved = executeCommand(entered, defaultWorld, { type: "move_forward" });
    const afterAttack = resolveCombat(moved);
    const blocked = executeCommand(afterAttack, defaultWorld, { type: "return_to_town" });
    const marker = advanceToB1fMarker(afterAttack);
    const town = executeCommand(marker, defaultWorld, { type: "return_to_town" });

    expect(afterAttack.phase).toBe("dungeon");
    expect(afterAttack.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(blocked.phase).toBe("dungeon");
    expect(blocked.position?.roomId).toBe("room.b1f.002");
    expect(blocked.log.at(-1)?.text).toBe("There is no stair or return seal here.");
    expect(marker.position?.roomId).toBe("room.b1f.006");
    expect(town.phase).toBe("town");
    expect(town.party).toHaveLength(1);
    expect(town.party[0].hp).toBeGreaterThan(0);
    expect(town.party[0].hp).toBeLessThanOrEqual(town.party[0].maxHp);
  });

  it("requires an explicit stair command instead of descending on move", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const afterCombat = resolveCombat(executeCommand(entered, defaultWorld, { type: "move_forward" }));
    const marker = advanceToB1fMarker(afterCombat);

    const moved = executeCommand(marker, defaultWorld, { type: "move_forward" });
    const descended = executeCommand(marker, defaultWorld, { type: "use_stairs" });

    expect(marker.position?.roomId).toBe("room.b1f.006");
    expect(moved.position?.roomId).toBe("room.b1f.006");
    expect(moved.map.floorId).toBe("dungeon.b1f");
    expect(moved.log.at(-1)?.text).toBe("A stair waits ahead. Choose Use stairs to descend.");
    expect(descended.position?.roomId).toBe("room.b2f.001");
    expect(descended.map.floorId).toBe("dungeon.b2f");
  });
});

describe("rest points and scarce return", () => {
  function dungeonAt(roomId: string): GameState {
    return { ...stateWithParty(), phase: "dungeon", position: { roomId, facing: "east" } };
  }

  it("allows return to town at block-cap rest points but not mid-floor", () => {
    for (const restRoom of ["room.b1f.006", "room.b3f.003", "room.b6f.003"]) {
      const returned = executeCommand(dungeonAt(restRoom), defaultWorld, { type: "return_to_town" });
      expect(returned.phase, `${restRoom} should allow return`).toBe("town");
    }

    const blocked = executeCommand(dungeonAt("room.b3f.002"), defaultWorld, { type: "return_to_town" });
    expect(blocked.phase).toBe("dungeon");
    expect(blocked.log.at(-1)?.tags).toContain("blocked");
  });

  it("marks the block-cap descent rooms as rest points in scenario data", () => {
    const restIds = defaultWorld.dungeons
      .flatMap((floor) => floor.rooms)
      .filter((room) => room.restPoint || room.stairsToTown)
      .map((room) => room.id);
    expect(restIds).toEqual(expect.arrayContaining(["room.b3f.003", "room.b6f.003"]));
  });
});

describe("checkpoint resume", () => {
  function townWithVisited(roomIds: string[]): GameState {
    return {
      ...stateWithParty(),
      map: { ...createInitialGameState().map, visitedRooms: roomIds }
    };
  }

  it("lists only reached rest points and resumes the party there", () => {
    const town = townWithVisited(["room.b3f.003"]);
    expect(listUnlockedCheckpoints(town, defaultWorld).map((cp) => cp.roomId)).toEqual(["room.b3f.003"]);

    const resumed = executeCommand(town, defaultWorld, { type: "resume_at_checkpoint", roomId: "room.b3f.003" });
    expect(resumed.phase).toBe("dungeon");
    expect(resumed.position?.roomId).toBe("room.b3f.003");
    expect(resumed.map.floorId).toBe("dungeon.b3f");
  });

  it("refuses to resume at a rest point that was never reached", () => {
    const resumed = executeCommand(townWithVisited([]), defaultWorld, {
      type: "resume_at_checkpoint",
      roomId: "room.b6f.003"
    });
    expect(resumed.phase).toBe("town");
    expect(resumed.position).toBeNull();
  });
});

describe("runtime gates and shortcuts", () => {
  function dungeonAt(roomId: string, extra: Partial<GameState> = {}): GameState {
    return { ...stateWithParty(), phase: "dungeon", position: { roomId, facing: "east" }, ...extra };
  }

  it("locks the ash vault until the party carries the ashen key", () => {
    const noKey = executeCommand(dungeonAt("room.b7f.002"), defaultWorld, { type: "move_forward" });
    expect(noKey.position?.roomId).toBe("room.b7f.002");
    expect(noKey.log.at(-1)?.tags).toContain("locked");

    const withKey = executeCommand(
      dungeonAt("room.b7f.002", {
        inventory: [{ id: "item.ashen-key", name: "Ashen Key", kind: "key", quantity: 1 }]
      }),
      defaultWorld,
      { type: "move_forward" }
    );
    expect(withKey.position?.roomId).toBe("room.b7f.003");
  });

  it("grants the shortcut flag and logs it when the party reaches the lifted bar", () => {
    const atBar = executeCommand(dungeonAt("room.b5f.002"), defaultWorld, { type: "move_forward" });
    expect(atBar.position?.roomId).toBe("room.b5f.003");
    expect(atBar.discoveredSecrets).toContain("flag.b5f.mid-shortcut");
    expect(atBar.log.some((entry) => entry.tags.includes("shortcut"))).toBe(true);
  });
});

describe("three-block dungeon structure", () => {
  it("caps each block with a boss gate, and B3/B6 caps add a rest point", () => {
    const capFloors = defaultWorld.dungeons.filter((floor) => floor.tags?.includes("block-cap"));
    expect(capFloors.map((floor) => floor.id)).toEqual(["dungeon.b3f", "dungeon.b6f", "dungeon.b8f"]);

    for (const floor of capFloors) {
      expect(floor.rooms.some((room) => room.encounter?.isBoss), `${floor.id} needs a boss gate`).toBe(true);
    }

    for (const id of ["dungeon.b3f", "dungeon.b6f"]) {
      const floor = defaultWorld.dungeons.find((candidate) => candidate.id === id)!;
      expect(floor.rooms.some((room) => room.restPoint), `${id} needs a rest point`).toBe(true);
    }
  });
});

describe("emergency return charm", () => {
  function dungeonWithCharm(roomId: string, floorId: string): GameState {
    return {
      ...stateWithParty(),
      phase: "dungeon",
      position: { roomId, facing: "east" },
      map: { ...createInitialGameState().map, floorId },
      inventory: [{ id: "item.return-charm", name: "Warding Return Charm", kind: "escape", quantity: 1 }]
    };
  }

  it("escapes to town mid-floor and consumes the charm", () => {
    const escaped = executeCommand(dungeonWithCharm("room.b3f.002", "dungeon.b3f"), defaultWorld, {
      type: "use_item",
      itemId: "item.return-charm",
      targetCharacterId: "unused"
    });
    expect(escaped.phase).toBe("town");
    expect(escaped.inventory.find((entry) => entry.id === "item.return-charm")?.quantity).toBe(0);
  });

  it("is barred on the boss floor", () => {
    const blocked = executeCommand(dungeonWithCharm("room.b8f.001", "dungeon.b8f"), defaultWorld, {
      type: "use_item",
      itemId: "item.return-charm",
      targetCharacterId: "unused"
    });
    expect(blocked.phase).toBe("dungeon");
    expect(blocked.inventory.find((entry) => entry.id === "item.return-charm")?.quantity).toBe(1);
  });
});
