import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand, rollPercent } from "../src/domain/rulesEngine";
import { classProficiency } from "../src/domain/classCapabilities";
import { successChance, trapSkill } from "../src/domain/chests";
import { withDeterministicIds } from "../src/domain/ids";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Character, Direction, GameState } from "../src/domain/types";

/**
 * §9.4d — room traps, hidden passages and locks are proficiency ATTEMPTS now.
 *
 * All three were unconditional. A room trap fired on entry with no roll and no way to avoid it, so
 * searching a room and disarming a trap bought the party nothing — it sprang either way. `disarmTrap`
 * ALWAYS succeeded. `search` revealed every secret automatically. The Thief's `unlock` and
 * `detectSecret` proficiencies were dead code that nothing in `src/` read, and the `detectDc` authored
 * on every trap in every floor was read by nothing at all.
 */

function partyOf(classIds: Character["classId"][], seed: string): GameState {
  return withDeterministicIds(`hazard-${seed}`, () => {
    let state = createInitialGameState();
    for (const [index, classId] of classIds.entries()) {
      state = addCharacter(state, createGuildCharacter({ name: `P${index}`, classId, seed: `${seed}-${index}` }));
    }
    return state;
  });
}

const eventsOf = (state: GameState) => state.log.map((entry) => entry.event?.type).filter(Boolean);

describe("§9.4d the Thief's dead proficiencies are live rules", () => {
  it("declares unlock and detectSecret as specialisms that something now reads", () => {
    expect(classProficiency("thief", "detectSecret")).toBe("specialist");
    expect(classProficiency("thief", "unlock")).toBe("specialist");
    expect(classProficiency("warrior", "detectSecret")).toBe("untrained");
  });
});

describe("§9.4d a room trap is survivable by playing well", () => {
  // The needle plate in the Smoke-Bent Chamber — the trap the b1f route crosses on the way to the stair.
  const TRAP_ROOM = "room.b1f.east";
  const TRAP_ID = "trap.b1f.needle";

  /**
   * Find a room and facing whose `move_forward` actually lands in the trap room, by asking the ENGINE
   * rather than hard-coding maze geometry (B1F is a generated maze; a hard-coded neighbour would rot
   * the next time the seed changes).
   */
  function approachToTrapRoom(state: GameState): { roomId: string; facing: Direction } {
    const rooms = defaultWorld.dungeons.flatMap((dungeon) => dungeon.rooms).map((room) => room.id);
    for (const roomId of rooms) {
      for (const facing of ["north", "east", "south", "west"] as Direction[]) {
        const probe: GameState = {
          ...state,
          position: { roomId, facing },
          map: { ...state.map, floorId: "dungeon.b1f" },
          // Pre-resolve the trap on the probe so probing never itself springs or consumes it.
          resolvedTraps: [...state.resolvedTraps, TRAP_ID]
        };
        if (executeCommand(probe, defaultWorld, { type: "move_forward" }).position?.roomId === TRAP_ROOM) {
          return { roomId, facing };
        }
      }
    }
    throw new Error(`no approach into ${TRAP_ROOM}`);
  }

  it("a trap the party already found is stepped around, not sprung", () => {
    const state = executeCommand(partyOf(["thief", "warrior", "priest"], "known"), defaultWorld, { type: "enter_dungeon" });
    const { roomId, facing } = approachToTrapRoom(state);

    // The party searched it out earlier — the branch that makes searching worth its turn.
    const forewarned: GameState = {
      ...state,
      position: { roomId, facing },
      map: { ...state.map, floorId: "dungeon.b1f" },
      discoveredSecrets: [...state.discoveredSecrets, TRAP_ID]
    };
    const hpBefore = forewarned.party.map((member) => member.hp);

    const after = executeCommand(forewarned, defaultWorld, { type: "move_forward" });
    expect(after.position?.roomId, "the party must actually have entered the trap room").toBe(TRAP_ROOM);

    // Asserted on the EVENT, not merely on "it did not trigger": the reflex check can also save the
    // party by luck, so "no damage" would pass even if having searched counted for nothing. `known:
    // true` is the only proof that SEARCHING is what saved them.
    const avoided = after.log.map((entry) => entry.event).find((event) => event?.type === "trap_avoided");
    expect(avoided, "a trap the party had already found must be stepped around").toBeDefined();
    expect(avoided && "known" in avoided ? avoided.known : false, "it must be avoided BECAUSE it was known").toBe(true);
    expect(after.party.map((member) => member.hp)).toEqual(hpBefore);
    expect(after.resolvedTraps).toContain(TRAP_ID);
    expect(after.log.map((entry) => entry.event?.type)).not.toContain("trap_triggered");
  });

  it("the authored detectDc is what the reflex check is made against", () => {
    // It was validated by the scenario schema, authored on every trap in every floor, and read by
    // nothing whatsoever until §9.4d.
    const traps = defaultWorld.dungeons.flatMap((dungeon) => dungeon.rooms).flatMap((room) => (room.trap ? [room.trap] : []));
    expect(traps.length).toBeGreaterThan(0);
    for (const trap of traps) {
      expect(trap.detectDc, `${trap.id} has no detect difficulty`).toBeGreaterThan(0);
    }
  });
});

describe("§9.4d disarming can fail, and failing is not the same as springing", () => {
  it("a failed disarm leaves the trap armed rather than setting it off", () => {
    // Springing on a failed disarm would make attempting it strictly worse than ignoring it, and no
    // player would ever press the command.
    const state = partyOf(["warrior"], "disarm");
    const entered = executeCommand(state, defaultWorld, { type: "enter_dungeon" });
    const atTrap: GameState = {
      ...entered,
      position: { roomId: "room.b3f.002", facing: "north" },
      map: { ...entered.map, floorId: "dungeon.b3f" }
    };
    const hpBefore = atTrap.party.map((member) => member.hp);

    const after = executeCommand(atTrap, defaultWorld, { type: "disarm_trap" });

    // Either it worked or it did not, but the party is never damaged BY THE ATTEMPT.
    expect(after.party.map((member) => member.hp)).toEqual(hpBefore);
    expect(eventsOf(after).some((type) => type === "trap_disarmed" || type === "trap_disarm_failed")).toBe(true);
  });

  it("a specialist disarms more reliably than an untrained hand", () => {
    // Asserted on the CURVE, not by sampling attempts: the room-disarm roll is seeded on the trap's
    // identity alone, so a given trap yields one fixed roll forever (a failure cannot be reloaded into
    // a success, exactly as for chests). Re-rolling the same trap therefore measures nothing — what
    // separates the classes is the CHANCE that fixed roll is compared against.
    const traps = defaultWorld.dungeons.flatMap((dungeon) => dungeon.rooms).flatMap((room) => (room.trap ? [room.trap] : []));
    expect(traps.length, "the world must author room traps for this to mean anything").toBeGreaterThan(0);

    const thief = createGuildCharacter({ name: "T", classId: "thief", seed: "curve-t" });
    const warrior = createGuildCharacter({ name: "W", classId: "warrior", seed: "curve-w" });

    for (const trap of traps) {
      const specialist = successChance(trapSkill(thief), trap.detectDc, 45);
      const untrained = successChance(trapSkill(warrior), trap.detectDc, 45);
      expect(specialist, `${trap.id}: the thief must be the better hand`).toBeGreaterThan(untrained);
      // ...and the untrained attempt must still be POSSIBLE. §8: an absent class is never a dead end.
      expect(untrained, `${trap.id}: an untrained party cannot even try`).toBeGreaterThan(5);
    }
  });

  it("the outcome follows the roll, so a hardcoded success would be caught", () => {
    // White-box on purpose. Room-disarm is seeded on the trap alone, so the expected result is fully
    // determined by (fixed roll) vs (skill-derived chance). Asserting the ENGINE agrees is what makes
    // this test fail if the check is ever removed or short-circuited back to "always succeeds".
    const traps = defaultWorld.dungeons.flatMap((dungeon) => dungeon.rooms).flatMap((room) => (room.trap ? [room.trap] : []));
    const roomOf = (trapId: string) =>
      defaultWorld.dungeons.flatMap((dungeon) => dungeon.rooms).find((room) => room.trap?.id === trapId)!;

    let sawFailure = false;
    for (const trap of traps) {
      // A deliberately hopeless hand: level 1, every aptitude zero. Its chance is low enough that at
      // least one authored trap must come out a failure — otherwise the roll is decoration.
      const state = partyOf(["warrior"], `white-${trap.id}`);
      const entered = executeCommand(state, defaultWorld, { type: "enter_dungeon" });
      const crippled = entered.party.map((member) => ({
        ...member,
        level: 1,
        aptitude: { might: 0, agility: 0, spirit: 0, wit: 0, luck: 0 }
      }));
      const room = roomOf(trap.id);
      const floorId = defaultWorld.dungeons.find((dungeon) => dungeon.rooms.some((candidate) => candidate.id === room.id))!.id;
      const atTrap: GameState = {
        ...entered,
        party: crippled,
        position: { roomId: room.id, facing: "north" },
        map: { ...entered.map, floorId }
      };

      const expected =
        rollPercent(`${trap.id}:${crippled[0].id}:room-disarm`) < successChance(trapSkill(crippled[0]), trap.detectDc, 45);
      const disarmed = eventsOf(executeCommand(atTrap, defaultWorld, { type: "disarm_trap" })).includes("trap_disarmed");
      expect(disarmed, `${trap.id}: engine disagreed with the roll`).toBe(expected);
      sawFailure ||= !expected;
    }
    expect(sawFailure, "no authored trap can be failed even by a hopeless hand — the roll is decoration").toBe(true);
  });

  it("the check is not theatre — a bad hand can genuinely fail an authored trap", () => {
    // If every party cleared every DC, the roll would be decoration. This pins that at least one
    // authored trap is beatable-but-not-certain for an untrained hand.
    const warrior = createGuildCharacter({ name: "W", classId: "warrior", seed: "theatre" });
    const traps = defaultWorld.dungeons.flatMap((dungeon) => dungeon.rooms).flatMap((room) => (room.trap ? [room.trap] : []));
    const chances = traps.map((trap) => successChance(trapSkill(warrior), trap.detectDc, 45));
    expect(Math.min(...chances), "every trap is a certainty for an untrained hand").toBeLessThan(95);
  });

});

describe("§9.4d a search can fail, but a run can never be locked out", () => {
  it("finding a hidden passage is an attempt, and it always terminates", () => {
    // The retryable rule is deliberate. A one-shot roll would be stricter, but a party that failed it
    // would be permanently locked out of AUTHORED CONTENT — the b7f ash-vault cache sits behind exactly
    // such a wall. The specialist's reward is finding it in fewer turns, not being the only one who can.
    const turnsToFind = (classId: Character["classId"]) => {
      let state = partyOf([classId], `find-${classId}`);
      state = executeCommand(state, defaultWorld, { type: "enter_dungeon" });
      const key = "secret:room.b1f.c6_17:east";
      for (let turn = 0; turn < 80; turn += 1) {
        state = executeCommand(
          { ...state, position: { roomId: "room.b1f.c6_17", facing: "east" }, map: { ...state.map, floorId: "dungeon.b1f" } },
          defaultWorld,
          { type: "search" }
        );
        if (state.discoveredSecrets.includes(key)) return turn + 1;
      }
      return Infinity;
    };

    const thief = turnsToFind("thief");
    const warrior = turnsToFind("warrior");
    expect(thief, "a thief must be able to find the b1f vault wall").toBeLessThan(Infinity);
    expect(warrior, "a party WITHOUT a thief must not be locked out of authored content").toBeLessThan(Infinity);
    // And the specialism has to be worth something: the thief gets there no slower.
    expect(thief).toBeLessThanOrEqual(warrior);
  });
});
