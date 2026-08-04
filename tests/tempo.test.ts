import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { chooseDefensiveRoundActions, getTempoModeForPhase, runTempoStep } from "../src/domain/tempo";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState } from "../src/domain/rulesEngine";
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

  it("defense auto heals the worst-hurt ally and lets a non-healer attack", () => {
    // A priest (knows heal) in the back and a badly-hurt warrior in the front.
    const priest = { ...createGuildCharacter({ name: "Sei", classId: "priest", seed: "def-heal" }), level: 5, row: "back" as const };
    const warrior = { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "def-atk" }), level: 5, row: "front" as const, hp: 4, maxHp: 30 };
    const enemy = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime")!;
    const state: GameState = {
      ...(({} as unknown) as GameState),
      phase: "combat",
      party: [warrior, priest],
      reserve: [],
      retired: [],
      position: { roomId: "room.b1f.001", facing: "north" },
      combat: createCombatState("room.b1f.001", enemy, 1),
      defeatedEnemies: [],
      floorClearedEnemies: [],
      stepsSinceEncounter: 0,
      expeditions: 1,
      resolvedTraps: [],
      discoveredSecrets: [],
      inventory: [],
      partyGold: 0,
      claimedTreasures: [],
      floorClaimedTreasures: [],
      map: { floorId: "dungeon.b1f", currentRoomId: "room.b1f.001", currentCellId: null, currentFacing: "north", visitedRooms: [], visitedCells: [], knownExits: {}, blockedExits: {}, secretCandidates: {} },
      log: [],
      turn: 1,
      aiEnabled: false,
      quests: []
    };

    const actions = chooseDefensiveRoundActions(state, defaultWorld);
    const priestAction = actions.find((action) => action.actorId === priest.id);
    const warriorAction = actions.find((action) => action.actorId === warrior.id);
    // The healer casts a technique at the wounded warrior; the warrior (no heal) attacks.
    expect(priestAction).toMatchObject({ action: "cast", targetCharacterId: warrior.id });
    expect(warriorAction?.action).toBe("attack");
  });

  it("defense auto attacks when nobody is hurt", () => {
    const priest = { ...createGuildCharacter({ name: "Sei", classId: "priest", seed: "def-full" }), level: 5, row: "front" as const };
    const enemy = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime")!;
    const state: GameState = {
      ...(({} as unknown) as GameState),
      phase: "combat",
      party: [priest],
      reserve: [],
      retired: [],
      position: { roomId: "room.b1f.001", facing: "north" },
      combat: createCombatState("room.b1f.001", enemy, 1),
      defeatedEnemies: [],
      floorClearedEnemies: [],
      stepsSinceEncounter: 0,
      expeditions: 1,
      resolvedTraps: [],
      discoveredSecrets: [],
      inventory: [],
      partyGold: 0,
      claimedTreasures: [],
      floorClaimedTreasures: [],
      map: { floorId: "dungeon.b1f", currentRoomId: "room.b1f.001", currentCellId: null, currentFacing: "north", visitedRooms: [], visitedCells: [], knownExits: {}, blockedExits: {}, secretCandidates: {} },
      log: [],
      turn: 1,
      aiEnabled: false,
      quests: []
    };
    const actions = chooseDefensiveRoundActions(state, defaultWorld);
    expect(actions.find((action) => action.actorId === priest.id)?.action).toBe("attack");
  });
});
