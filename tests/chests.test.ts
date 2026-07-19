import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { getWorldById } from "../src/data/worldRegistry";

const verdantWorld = getWorldById("verdant")!;
import { createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand, resolveCommand } from "../src/domain/rulesEngine";
import { GameStateSchema } from "../src/domain/saveData";
import {
  disarmChest,
  investigateChest,
  makeChest,
  openChest,
  roomChest,
  selectTrapHandler,
  trapSkill
} from "../src/domain/chests";
import type { Character, GameState, ScenarioChest } from "../src/domain/types";

// IMP-029 — chamber fights, treasure chests, and trap-handling vocations. Entering a room no longer
// auto-grabs loot: a chamber's reward is a chest left on the cell after the fight, and the party
// investigates / disarms / opens it. These headless tests prove the judgement, reproducibility, and
// no-double-claim; grounding/feel/transitions are the browser Gate's job.

const CHAMBER_ROOM = "room.b1f.002";
const CHAMBER_CELL = "cell.b1f.002";

function chamberVictoryState(): GameState {
  const hero: Character = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "imp029" }), row: "front" };
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime")!;
  const base = createInitialGameState();
  const combatState: GameState = {
    ...base,
    party: [hero],
    phase: "combat",
    position: { roomId: CHAMBER_ROOM, cellId: CHAMBER_CELL, facing: "south" },
    map: { ...base.map, floorId: "dungeon.b1f", currentRoomId: CHAMBER_ROOM, currentCellId: CHAMBER_CELL },
    combat: createCombatState(CHAMBER_ROOM, enemy, 1)
  };
  const group = combatState.combat!.enemyGroups[0];
  // Attack until the chamber is won (a lone hero may need a few swings) → chamber chest appears. Then
  // continue_after_combat clears the result screen back to dungeon exploration (chest commands accepted).
  let state = combatState;
  for (let round = 0; round < 8 && state.phase === "combat"; round += 1) {
    state = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: hero.id, action: "attack", targetGroupId: group.id }]
    });
  }
  return executeCommand(state, defaultWorld, { type: "continue_after_combat" });
}

describe("IMP-029 chest state machine (pure)", () => {
  const trapped: ScenarioChest = { treasureTable: "treasure.b1f.safe", trap: { kind: "needle", difficulty: 12, damage: 4 } };
  const plain: ScenarioChest = { treasureTable: "treasure.b1f.safe" };

  it("a trapped-chest investigation never reports a false 'clear'", () => {
    const chest = makeChest(CHAMBER_CELL, CHAMBER_ROOM, trapped);
    const handler = null; // no specialist — worst case
    const result = investigateChest(chest, handler, "seedA").investigateResult;
    expect(["trapped", "uncertain"]).toContain(result);
    expect(result).not.toBe("clear");
  });

  it("a plain-chest investigation never reports 'trapped'", () => {
    const chest = makeChest(CHAMBER_CELL, CHAMBER_ROOM, plain);
    const result = investigateChest(chest, null, "seedB").investigateResult;
    expect(["clear", "uncertain"]).toContain(result);
  });

  it("investigate and disarm are one attempt each (a failure cannot be reloaded)", () => {
    let chest = makeChest(CHAMBER_CELL, CHAMBER_ROOM, trapped);
    const master: Character = { ...createGuildCharacter({ name: "Nim", classId: "cutpurse", seed: "x" }), level: 5 };
    chest = investigateChest(chest, master, "s");
    const afterFirst = { ...chest };
    chest = investigateChest(chest, master, "s"); // second call is a no-op
    expect(chest).toEqual(afterFirst);

    chest = disarmChest(chest, master, "s");
    const afterDisarm = { ...chest };
    chest = disarmChest(chest, master, "s"); // spent
    expect(chest).toEqual(afterDisarm);
    expect(chest.disarmAttempted).toBe(true);
  });

  it("opening an undisarmed trapped chest springs the trap but keeps the reward; opening a disarmed one does not", () => {
    const chest = makeChest(CHAMBER_CELL, CHAMBER_ROOM, trapped);
    const undisarmed = openChest(chest);
    expect(undisarmed.trapSprung).toBe(true);
    expect(undisarmed.damage).toBe(4);
    expect(undisarmed.chest.phase).toBe("opened");

    const disarmed = openChest({ ...chest, disarmed: true });
    expect(disarmed.trapSprung).toBe(false);
    expect(disarmed.damage).toBe(0);
  });

  it("selectTrapHandler prefers a trap-handling vocation over a plain fighter", () => {
    const cutpurse = createGuildCharacter({ name: "Nim", classId: "cutpurse", seed: "a" });
    const fighter = createGuildCharacter({ name: "Bran", classId: "vanguard", seed: "b" });
    expect(trapSkill(cutpurse)).toBeGreaterThan(trapSkill(fighter));
    expect(selectTrapHandler([fighter, cutpurse])?.id).toBe(cutpurse.id);
    // …but anyone can be chosen when no specialist stands.
    expect(selectTrapHandler([fighter])?.id).toBe(fighter.id);
  });

  it("roomChest loads a bare treasureTable as a safe plain chest (back-compat)", () => {
    expect(roomChest({ treasureTable: "t" })).toEqual({ treasureTable: "t" });
    expect(roomChest({ chest: { treasureTable: "t", trap: { kind: "gas", difficulty: 8, damage: 2 } } })?.trap?.kind).toBe("gas");
    expect(roomChest({})).toBeNull();
  });
});

describe("IMP-029 integration (default world)", () => {
  it("entering the dungeon collects NO treasure — a chest is left instead", () => {
    const base = { ...createInitialGameState(), party: [createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "e" })] };
    const entered = executeCommand(base, defaultWorld, { type: "enter_dungeon" });
    expect(entered.inventory.length).toBe(base.inventory.length); // no auto-loot on descent
    const landingChest = (entered.chests ?? []).find((chest) => chest.roomId === defaultWorld.startRoom);
    expect(landingChest?.phase).toBe("closed");
    expect(entered.floorClaimedTreasures).not.toContain(defaultWorld.startRoom);
  });

  it("a chest is inoperable before the chamber fight is won", () => {
    const hero = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "g" }), row: "front" as const };
    const enemy = defaultWorld.enemies.find((c) => c.id === "enemy.b1f.ash-slime")!;
    const base = createInitialGameState();
    const inCombat: GameState = {
      ...base,
      party: [hero],
      phase: "combat",
      position: { roomId: CHAMBER_ROOM, cellId: CHAMBER_CELL, facing: "south" },
      combat: createCombatState(CHAMBER_ROOM, enemy, 1)
    };
    const result = resolveCommand(inCombat, defaultWorld, { type: "investigate_chest" });
    expect(result.events).toContainEqual({ type: "command_blocked_chest", reason: "no_chest" });
  });

  it("a closed chest appears on the current cell after a chamber victory", () => {
    const won = chamberVictoryState();
    expect(won.phase).toBe("dungeon");
    const chest = (won.chests ?? []).find((c) => c.cellId === CHAMBER_CELL);
    expect(chest).toBeDefined();
    expect(chest?.phase).toBe("closed");
    expect(chest?.trap?.kind).toBe("needle");
    // The reward was NOT auto-taken by winning — the chamber room is unclaimed until the chest opens.
    expect(won.floorClaimedTreasures).not.toContain(CHAMBER_ROOM);
  });

  it("opening springs the trap yet grants the reward exactly once — no double-claim", () => {
    const won = chamberVictoryState();
    const hpBefore = won.party[0].hp;

    const opened = resolveCommand(won, defaultWorld, { type: "open_chest" });
    expect(opened.events).toContainEqual(expect.objectContaining({ type: "chest_trap_sprung", trapKind: "needle" }));
    expect(opened.events.some((e) => e.type === "inventory_item_gained")).toBe(true);
    expect(opened.state.party[0].hp).toBeLessThan(hpBefore); // trap bit, but…
    expect(opened.state.party[0].hp).toBeGreaterThanOrEqual(1); // …never below 1
    expect(opened.state.inventory.length).toBe(1);
    expect(opened.state.floorClaimedTreasures).toContain(CHAMBER_ROOM);

    const again = resolveCommand(opened.state, defaultWorld, { type: "open_chest" });
    expect(again.events).toContainEqual({ type: "command_blocked_chest", reason: "already_open" });
    expect(again.state.inventory.length).toBe(1); // still one — no duplicate
  });

  it("chest state persists while the party is on the floor (leave and it is still there)", () => {
    const won = chamberVictoryState();
    const investigated = executeCommand(won, defaultWorld, { type: "investigate_chest" });
    // A turn/probe that does not change floor keeps the chest and its spent investigation.
    const later = executeCommand(investigated, defaultWorld, { type: "listen" });
    const chest = (later.chests ?? []).find((c) => c.cellId === CHAMBER_CELL);
    expect(chest?.investigated).toBe(true);
    expect(chest?.phase).toBe("closed");
  });

  it("old saves with no `chests` field load (defaults to [])", () => {
    const base = createInitialGameState();
    const { chests: _drop, ...withoutChests } = base as GameState & { chests?: unknown };
    const parsed = GameStateSchema.parse(withoutChests);
    expect(parsed.chests).toEqual([]);
  });
});

describe("IMP-029 both worlds resolve under the same rules", () => {
  it("default and verdant each author a trapped chamber", () => {
    const defRoom = defaultWorld.dungeons.flatMap((d) => d.rooms).find((r) => r.chest?.trap);
    const verRoom = verdantWorld.dungeons.flatMap((d) => d.rooms).find((r) => r.chest?.trap);
    expect(defRoom?.chest?.trap?.kind).toBeDefined();
    expect(verRoom?.chest?.trap?.kind).toBeDefined();
    // Both build a live chest through the same makeChest path.
    expect(makeChest("c", defRoom!.id, defRoom!.chest!).trap?.difficulty).toBeGreaterThan(0);
    expect(makeChest("c", verRoom!.id, verRoom!.chest!).trap?.difficulty).toBeGreaterThan(0);
  });
});
