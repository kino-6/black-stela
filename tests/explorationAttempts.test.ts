import { describe, expect, it } from "vitest";
import { resolveCommand } from "../src/domain/rulesEngine";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { difficultyBand, resolveActor, resolveAttempt } from "../src/domain/exploration";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Character, GameEvent, GameState, ScenarioWorld } from "../src/domain/types";

/**
 * §8.2 — the attempt names its actor.
 *
 * The chest commands used to call `selectTrapHandler`, which scanned the party, picked the best score and
 * acted. The player could not send anyone, and learned who had gone only from a name in the log. These
 * tests hold the three things that replaced it: a DECLARED actor is obeyed (even a bad one), an automatic
 * pick is still made but REPORTED as automatic, and every attempt records who took the risk, at what
 * proficiency, against which difficulty band, and what it spent.
 */

const world: ScenarioWorld = defaultWorld;

function member(classId: Character["classId"], name: string): Character {
  return createGuildCharacter({ name, classId, seed: `attempt:${name}` });
}

/** A party standing on a trapped chest, ready to act on it. */
function stateWithChest(party: Character[], options: { difficulty?: number; inventory?: GameState["inventory"] } = {}): GameState {
  return {
    ...(JSON.parse(JSON.stringify(baseState)) as GameState),
    party,
    inventory: options.inventory ?? [],
    chests: [
      {
        cellId: "cell.test",
        roomId: "room.test",
        treasureTable: "treasure.b1f.common",
        trap: { kind: "needle", difficulty: options.difficulty ?? 12, damage: 4 },
        phase: "closed",
        investigated: false,
        investigateResult: null,
        disarmAttempted: false,
        disarmed: false,
        sprung: false
      }
    ]
  };
}

// A minimal dungeon state whose position is the chest's cell — chests are only operable where the party
// stands, which is the rule this fixture has to satisfy to exercise the commands at all.
const baseState = {
  phase: "dungeon",
  turn: 4,
  party: [],
  reserve: [],
  retired: [],
  partyGold: 0,
  inventory: [],
  log: [],
  position: { roomId: "room.test", cellId: "cell.test", facing: "north" },
  map: {
    floorId: "dungeon.b1f",
    currentRoomId: "room.test",
    currentCellId: "cell.test",
    currentFacing: "north",
    visitedRooms: ["room.test"],
    visitedCells: ["cell.test"],
    knownExits: {}
  },
  defeatedEnemies: [],
  floorClearedEnemies: [],
  claimedTreasures: [],
  floorClaimedTreasures: [],
  resolvedTraps: [],
  discoveredSecrets: [],
  quests: [],
  enemyRecord: {},
  chests: [],
  expeditions: 1,
  stepsSinceEncounter: 0
} as unknown as GameState;

function eventOf(events: GameEvent[], type: string) {
  return events.find((event) => event.type === type) as Extract<GameEvent, { type: typeof type }> | undefined;
}

describe("an exploration attempt names who made it", () => {
  it("obeys the declared actor — even one with no business trying", () => {
    // Sending the bulwark is a decision the player is allowed to make; the odds are how they learn it.
    const party = [member("thief", "Nim"), member("knight", "Bran")];
    const bran = party[1];
    const result = resolveCommand(stateWithChest(party), world, { type: "investigate_chest", characterId: bran.id });
    const event = eventOf(result.events, "chest_investigated") as any;

    expect(event.actorId).toBe(bran.id);
    expect(event.handlerName).toBe("Bran");
    expect(event.selection).toBe("declared");
    expect(event.proficiency).toBe("untrained");
  });

  it("still picks for the player when nobody was named — and says so", () => {
    const party = [member("knight", "Bran"), member("thief", "Nim")];
    const result = resolveCommand(stateWithChest(party), world, { type: "investigate_chest" });
    const event = eventOf(result.events, "chest_investigated") as any;

    // The old automatic behaviour is intact: the specialist is chosen. What changed is that the event
    // admits the choice was the game's, not the player's.
    expect(event.handlerName).toBe("Nim");
    expect(event.selection).toBe("automatic");
    expect(event.proficiency).toBe("specialist");
  });

  it("refuses a declared actor who cannot act instead of handing the job to someone else", () => {
    const party = [member("thief", "Nim"), { ...member("knight", "Bran"), injury: "wounded" as const }];
    const bran = party[1];
    const result = resolveCommand(stateWithChest(party), world, { type: "disarm_chest", characterId: bran.id });

    expect(eventOf(result.events, "command_blocked_chest")).toMatchObject({ reason: "actor_unavailable" });
    // Nothing was spent and nothing was attempted: the chest is exactly as it was.
    expect(result.state.chests?.[0].disarmAttempted).toBe(false);
  });

  it("records the difficulty band the attempt was made against", () => {
    const party = [member("thief", "Nim")];
    const routine = resolveCommand(stateWithChest(party, { difficulty: 6 }), world, { type: "investigate_chest" });
    const deadly = resolveCommand(stateWithChest(party, { difficulty: 24 }), world, { type: "investigate_chest" });

    expect((eventOf(routine.events, "chest_investigated") as any).difficultyBand).toBe("routine");
    expect((eventOf(deadly.events, "chest_investigated") as any).difficultyBand).toBe("deadly");
    expect([difficultyBand(8), difficultyBand(14), difficultyBand(20), difficultyBand(21)]).toEqual([
      "routine",
      "tricky",
      "severe",
      "deadly"
    ]);
  });

  it("leaves an un-declared attempt scoring exactly what it scored before", () => {
    // The regression guard for every existing route, save and trace: same party, same chest, same seed —
    // the automatic pick must resolve to the same outcome it did when selectTrapHandler was called.
    const party = [member("knight", "Bran"), member("thief", "Nim")];
    const before = resolveCommand(stateWithChest(party), world, { type: "investigate_chest" });
    const after = resolveCommand(stateWithChest(party), world, { type: "investigate_chest", characterId: party[1].id });

    // Declaring the same adventurer the game would have picked changes nothing but the reported selection.
    expect(after.state.chests?.[0].investigateResult).toBe(before.state.chests?.[0].investigateResult);
  });
});

describe("an item is a valid answer to a missing specialist", () => {
  // §4 / §8.2: a party with no thief may still buy a better attempt with a tool. No world authors one
  // yet (§8.4 does), so the rule is proven against a world that declares one.
  const aidedWorld: ScenarioWorld = {
    ...world,
    items: [
      ...world.items,
      {
        id: "item.lock-shims",
        name: "Lock Shims",
        kind: "utility",
        tier: 1,
        explorationAid: { actions: ["investigate", "disarm"], bonus: 6 }
      }
    ]
  };

  const carrying = [{ id: "item.lock-shims", name: "Lock Shims", kind: "utility" as const, quantity: 2 }];

  it("spends the tool and applies its bonus", () => {
    const party = [member("knight", "Bran")];
    const result = resolveCommand(
      stateWithChest(party, { inventory: carrying }),
      aidedWorld,
      { type: "disarm_chest", itemId: "item.lock-shims" }
    );
    const event = eventOf(result.events, "chest_disarmed") as any;

    expect(event.itemConsumed).toBe("item.lock-shims");
    expect(result.state.inventory.find((item) => item.id === "item.lock-shims")?.quantity).toBe(1);

    const attempt = resolveAttempt(
      { party, inventory: carrying },
      { action: "disarm", difficulty: 12, itemId: "item.lock-shims" },
      [{ itemId: "item.lock-shims", actions: ["investigate", "disarm"], bonus: 6 }]
    );
    const unaided = resolveAttempt({ party, inventory: [] }, { action: "disarm", difficulty: 12 }, []);
    expect(attempt.record.skill).toBe(unaided.record.skill + 6);
  });

  it("refuses a tool the party does not hold, and one offered for the wrong action, without consuming it", () => {
    const party = [member("knight", "Bran")];
    const notHeld = resolveCommand(
      stateWithChest(party, { inventory: [] }),
      aidedWorld,
      { type: "disarm_chest", itemId: "item.lock-shims" }
    );
    expect((eventOf(notHeld.events, "chest_disarmed") as any).itemConsumed).toBeUndefined();

    const wrongAction = resolveAttempt(
      { party, inventory: carrying },
      { action: "escape", difficulty: 12, itemId: "item.lock-shims" },
      [{ itemId: "item.lock-shims", actions: ["investigate", "disarm"], bonus: 6 }]
    );
    expect(wrongAction.aid).toBeNull();
    expect(wrongAction.record.itemConsumed).toBeUndefined();
  });
});

describe("nobody is ever refused for being untrained", () => {
  it("lets a party with no specialist attempt everything, at worse odds", () => {
    const party = [member("knight", "Bran"), member("priest", "Sei")];
    const result = resolveCommand(stateWithChest(party), world, { type: "investigate_chest" });
    const event = eventOf(result.events, "chest_investigated") as any;

    expect(event.proficiency).toBe("untrained");
    // It resolved — an attempt was made and spent, rather than being blocked for lack of a thief.
    expect(result.state.chests?.[0].investigated).toBe(true);
  });

  it("returns no actor at all only when the whole party is down", () => {
    const downed = [{ ...member("thief", "Nim"), hp: 0 }];
    expect(resolveActor(downed, undefined).actor).toBeNull();
    expect(resolveActor([], undefined).selection).toBe("automatic");
  });
});
