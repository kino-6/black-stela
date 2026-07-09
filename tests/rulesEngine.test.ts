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

// B1F's trunk runs due east from the entrance; walk it, resolving the placed
// slime fight along the way, until the party reaches the Black Marker.
// Walk the trunk east onto the Winding Stair (room.b1f.012), clearing the slime
// fight and crossing the needle plate along the way.
function advanceToB1fStair(state: GameState) {
  let current = state;
  for (let step = 0; step < 40 && current.position?.roomId !== "room.b1f.012"; step += 1) {
    current = executeCommand(current, defaultWorld, { type: "move_forward" });
    if (current.phase === "combat") {
      current = resolveCombat(current);
    }
  }
  return current;
}

// The return marker is the Warden's Hall crank in the south-east: east along the
// trunk to the hub, south down the central spoke to the south room, then east
// along the bottom ring to the warden.
function advanceToB1fMarker(state: GameState) {
  let current = state;
  const moveUntil = (roomId: string, max = 20) => {
    for (let i = 0; i < max && current.position?.roomId !== roomId; i += 1) {
      current = executeCommand(current, defaultWorld, { type: "move_forward" });
      if (current.phase === "combat") {
        current = resolveCombat(current);
      }
    }
  };
  moveUntil("room.b1f.hub"); // east to the central hub
  current = executeCommand(current, defaultWorld, { type: "turn_right" }); // face south
  moveUntil("room.b1f.south"); // south spoke to the south room
  current = executeCommand(current, defaultWorld, { type: "turn_left" }); // face east
  moveUntil("room.b1f.warden"); // bottom ring east to the warden
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

  it("triggers the placed slime fight and the searched trap along the B1F trunk", () => {
    // Entrance faces east straight into the slime hall; the needle plate sits on
    // the east spoke by the stair.
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const current = executeCommand(entered, defaultWorld, { type: "move_forward" });

    expect(current.phase).toBe("combat");
    expect(current.position?.roomId).toBe("room.b1f.002");
    expect(current.combat?.enemy.name).toBe("Ash Slime");

    // Walking on east to the stair crosses the needle-trap chamber, resolving it.
    const stair = advanceToB1fStair(resolveCombat(current));
    expect(stair.position?.roomId).toBe("room.b1f.012");
    expect(stair.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(stair.resolvedTraps).toContain("trap.b1f.needle");
    expect(stair.party[0].hp).toBeLessThan(stair.party[0].maxHp);
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
    expect(marker.position?.roomId).toBe("room.b1f.warden");
    expect(town.phase).toBe("town");
    expect(town.party).toHaveLength(1);
    expect(town.party[0].hp).toBeGreaterThan(0);
    expect(town.party[0].hp).toBeLessThanOrEqual(town.party[0].maxHp);
  });

  it("gates the descent behind the warden's crank AND an 80% sweep of the floor", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const stair = advanceToB1fStair(entered);
    expect(stair.position?.roomId).toBe("room.b1f.012");

    // No crank flag and little explored: the descent is locked.
    const raw = executeCommand(stair, defaultWorld, { type: "use_stairs" });
    expect(raw.map.floorId).not.toBe("dungeon.b2f");
    expect(raw.log.at(-1)?.tags).toContain("locked");

    // Reaching the Warden's Hall turns the crank, granting the drop-pin flag.
    const cranked = advanceToB1fMarker(entered);
    expect(cranked.discoveredSecrets).toContain("flag.b1f.descent");

    const b1fCells = defaultWorld.dungeons.find((d) => d.id === "dungeon.b1f")!.grid!.cells.map((c) => c.roomId);
    const atStair = (visited: string[]): GameState => ({
      ...cranked,
      position: { roomId: "room.b1f.012", facing: "east" },
      map: { ...cranked.map, currentRoomId: "room.b1f.012", visitedRooms: visited }
    });

    // Flag set but under 80% mapped: still locked (no beeline descent).
    expect(executeCommand(atStair(["room.b1f.012"]), defaultWorld, { type: "use_stairs" }).map.floorId).not.toBe(
      "dungeon.b2f"
    );

    // Flag set and the floor swept past 80%: the stair opens.
    const descended = executeCommand(atStair(b1fCells), defaultWorld, { type: "use_stairs" });
    expect(descended.position?.roomId).toBe("room.b2f.001");
    expect(descended.map.floorId).toBe("dungeon.b2f");
  });

  it("steps backward one cell without changing facing", () => {
    const at: GameState = {
      ...stateWithParty(),
      phase: "dungeon",
      position: { roomId: "room.b1f.c11_9", facing: "east" }
    };
    const back = executeCommand(at, defaultWorld, { type: "move_backward" });

    expect(back.position?.roomId).toBe("room.b1f.c10_9");
    expect(back.position?.facing).toBe("east");
    expect(back.log.some((entry) => entry.text.includes("steps back"))).toBe(true);
  });

  it("blocks a backward step into the wall behind the party", () => {
    const at: GameState = {
      ...stateWithParty(),
      phase: "dungeon",
      position: { roomId: "room.b1f.001", facing: "east" }
    };
    const back = executeCommand(at, defaultWorld, { type: "move_backward" });

    expect(back.position?.roomId).toBe("room.b1f.001");
    expect(back.log.at(-1)?.text).toBe("A cold wall blocks the way.");
  });

  it("sidesteps left and right through open halls without changing facing", () => {
    const at: GameState = {
      ...stateWithParty(),
      phase: "dungeon",
      position: { roomId: "room.b1f.hub", facing: "east" }
    };

    // Facing east: left is north, right is south. Neither turns the party.
    const left = executeCommand(at, defaultWorld, { type: "strafe_left" });
    expect(left.position?.roomId).toBe("room.b1f.c9_8");
    expect(left.position?.facing).toBe("east");
    expect(left.log.at(-1)?.text).toBe("The party sidesteps into Dust-Choked Gallery.");

    const right = executeCommand(at, defaultWorld, { type: "strafe_right" });
    expect(right.position?.roomId).toBe("room.b1f.c9_10");
    expect(right.position?.facing).toBe("east");
  });

  it("reforms a member's combat row while exploring but never mid-combat", () => {
    const base: GameState = {
      ...stateWithParty(),
      phase: "dungeon",
      position: { roomId: "room.b1f.001", facing: "east" }
    };
    const member = base.party[0];
    const target = member.row === "front" ? "back" : "front";

    const reformed = executeCommand(base, defaultWorld, { type: "set_member_row", characterId: member.id, row: target });
    expect(reformed.party[0].row).toBe(target);
    expect(reformed.log.at(-1)?.tags).toContain("party");

    // The formation is locked once blades are drawn.
    const locked = executeCommand({ ...base, phase: "combat" }, defaultWorld, {
      type: "set_member_row",
      characterId: member.id,
      row: target
    });
    expect(locked.party[0].row).toBe(member.row);
  });
});

describe("rest points and scarce return", () => {
  function dungeonAt(roomId: string): GameState {
    return { ...stateWithParty(), phase: "dungeon", position: { roomId, facing: "east" } };
  }

  it("allows return to town at block-cap rest points but not mid-floor", () => {
    for (const restRoom of ["room.b1f.warden", "room.b3f.003", "room.b6f.003"]) {
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

  it("gathers a resource once from the dry cistern", () => {
    const at = dungeonAt("room.b3f.001");
    const before = at.inventory.find((entry) => entry.id === "item.healing-draught")?.quantity ?? 0;

    const gathered = executeCommand(at, defaultWorld, { type: "search" });
    expect(gathered.inventory.find((entry) => entry.id === "item.healing-draught")?.quantity).toBe(before + 1);
    expect(gathered.log.some((entry) => entry.tags.includes("item"))).toBe(true);

    const again = executeCommand(gathered, defaultWorld, { type: "search" });
    expect(again.inventory.find((entry) => entry.id === "item.healing-draught")?.quantity).toBe(before + 1);
  });

  it("bleeds the party on the hooked-corridor damage floor", () => {
    const before = dungeonAt("room.b2f.001");
    const stepped = executeCommand(before, defaultWorld, { type: "move_forward" });
    expect(stepped.position?.roomId).toBe("room.b2f.002");
    expect(stepped.log.some((entry) => entry.tags.includes("hazard"))).toBe(true);
    expect(stepped.party[0].hp).toBeLessThan(before.party[0].hp);
  });

  it("teleports the party back when they step onto the one-way walk", () => {
    const stepped = executeCommand(dungeonAt("room.b4f.001"), defaultWorld, { type: "move_forward" });
    expect(stepped.position?.roomId).toBe("room.b4f.001");
    expect(stepped.log.some((entry) => entry.tags.includes("teleport"))).toBe(true);
  });

  it("opens the B3F drop-shaft shortcut only after the winch is wound", () => {
    // Entering the winch grants the flag and logs the shortcut opening.
    const atWinch = executeCommand(
      dungeonAt("room.b3f.c3_2", { position: { roomId: "room.b3f.c3_2", facing: "west" } }),
      defaultWorld,
      { type: "move_forward" }
    );
    expect(atWinch.position?.roomId).toBe("room.b3f.winch");
    expect(atWinch.discoveredSecrets).toContain("flag.b3f.winch");
    expect(atWinch.log.some((entry) => entry.tags.includes("shortcut"))).toBe(true);

    // Without the flag, the hub's shaft cage will not hold.
    const blocked = executeCommand(
      dungeonAt("room.b3f.hub", { position: { roomId: "room.b3f.hub", facing: "south" } }),
      defaultWorld,
      { type: "move_forward" }
    );
    expect(blocked.position?.roomId).toBe("room.b3f.hub");
    expect(blocked.log.at(-1)?.tags).toContain("locked");

    // With the winch wound, the shortcut rides straight back to the entry.
    const rode = executeCommand(
      dungeonAt("room.b3f.hub", {
        position: { roomId: "room.b3f.hub", facing: "south" },
        discoveredSecrets: ["flag.b3f.winch"]
      }),
      defaultWorld,
      { type: "move_forward" }
    );
    expect(rode.position?.roomId).toBe("room.b3f.001");
  });

  it("hides the ash-vault cache behind a secret wall until the party searches", () => {
    const facingSecret = dungeonAt("room.b7f.002", { position: { roomId: "room.b7f.002", facing: "south" } });

    const blocked = executeCommand(facingSecret, defaultWorld, { type: "move_forward" });
    expect(blocked.position?.roomId).toBe("room.b7f.002");
    expect(blocked.log.at(-1)?.tags).toContain("blocked");

    const searched = executeCommand(facingSecret, defaultWorld, { type: "search" });
    expect(searched.discoveredSecrets).toContain("secret:room.b7f.002:south");
    expect(searched.log.some((entry) => entry.tags.includes("secret"))).toBe(true);

    const revealed = executeCommand(
      { ...searched, position: { roomId: "room.b7f.002", facing: "south" } },
      defaultWorld,
      { type: "move_forward" }
    );
    expect(revealed.position?.roomId).toBe("room.b7f.004");
  });

  it("spins the party's facing when they reach the lanterns spinner floor", () => {
    const spin = ["north", "east", "south", "west"] as const;
    const spun = executeCommand(dungeonAt("room.b3f.003"), defaultWorld, { type: "use_stairs" });
    expect(spun.position?.roomId).toBe("room.b4f.001");
    expect(spun.position?.facing).toBe(spin[spun.turn % 4]);
    expect(spun.map.currentFacing).toBe(spun.position?.facing);
    expect(spun.log.some((entry) => entry.tags.includes("spinner"))).toBe(true);
  });

  it("bars a gated descent stair until the branch crank flag is set", () => {
    const atStair = dungeonAt("room.b2f.003", { position: { roomId: "room.b2f.003", facing: "east" } });
    const blocked = executeCommand(atStair, defaultWorld, { type: "use_stairs" });
    expect(blocked.position?.roomId).toBe("room.b2f.003");
    expect(blocked.log.at(-1)?.tags).toContain("locked");

    const unlocked = dungeonAt("room.b2f.003", {
      position: { roomId: "room.b2f.003", facing: "east" },
      discoveredSecrets: ["flag.b2f.descent"]
    });
    const descended = executeCommand(unlocked, defaultWorld, { type: "use_stairs" });
    expect(descended.position?.roomId).toBe("room.b3f.001");
    expect(descended.map.floorId).toBe("dungeon.b3f");
  });

  it("hides the B1F ashen reliquary behind a searchable secret wall", () => {
    const facing = dungeonAt("room.b1f.south", { position: { roomId: "room.b1f.south", facing: "south" } });

    const blocked = executeCommand(facing, defaultWorld, { type: "move_forward" });
    expect(blocked.position?.roomId).toBe("room.b1f.south");

    const searched = executeCommand(facing, defaultWorld, { type: "search" });
    expect(searched.discoveredSecrets).toContain("secret:room.b1f.south:south");

    const revealed = executeCommand(
      { ...searched, position: { roomId: "room.b1f.south", facing: "south" } },
      defaultWorld,
      { type: "move_forward" }
    );
    expect(revealed.position?.roomId).toBe("room.b1f.vault");
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
