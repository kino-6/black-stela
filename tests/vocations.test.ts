import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { executeCommand, createCombatState } from "../src/domain/rulesEngine";
import {
  MASTERED_RANK,
  MASTERY_POINTS_PER_RANK,
  adoptVocationState,
  applyMastery,
  canAdoptVocation,
  findVocation,
  masteryGain,
  resolveVocationCatalog,
  resolveVocationState
} from "../src/domain/vocations";
import type { CharacterVocationState, Enemy, GameState } from "../src/domain/types";

const weakEnemy: Pick<Enemy, "level" | "dangerTier" | "prizedXp"> = { level: 1, dangerTier: 1 };
const strongEnemy: Pick<Enemy, "level" | "dangerTier" | "prizedXp"> = { level: 12, dangerTier: 4 };

// IMP-021A — the vocation/mastery contract. Basic vocations = the built-in classes; authored
// ADVANCED vocations are data, gated by mastering basics, and their stat modifiers layer on the
// base. Level is never reset by a vocation change, and mastery runs through the XP falloff.
describe("vocation mastery contract", () => {
  it("merges built-in basic classes with the world's authored advanced vocations", () => {
    const catalog = resolveVocationCatalog(defaultWorld);
    expect(catalog.some((v) => v.id === "vanguard" && v.tier === "basic" && !v.authored)).toBe(true);
    const reaver = catalog.find((v) => v.id === "vocation.ash-reaver");
    expect(reaver).toMatchObject({ tier: "advanced", authored: true });
    expect(reaver?.requires?.mastered).toEqual(["vanguard", "sellsword"]);
  });

  it("defaults a vocation state from the character's class when none is stored", () => {
    const mender = createGuildCharacter({ name: "Sei", classId: "mender", seed: "voc" });
    const state = resolveVocationState(mender);
    expect(state.current).toBe("mender");
    expect(state.learned).toContain("heal"); // the mender's class ability is retained from the start
    expect(state.loadout.length).toBeLessThanOrEqual(6);
  });

  it("trims mastery gain for weak enemies (the same out-levelling falloff as XP)", () => {
    expect(masteryGain(8, weakEnemy)).toBeLessThan(masteryGain(8, strongEnemy));
    expect(masteryGain(1, weakEnemy)).toBeGreaterThan(0);
  });

  it("banks mastery into ranks and caps at MASTERED_RANK", () => {
    let state: CharacterVocationState = { current: "vanguard", mastery: {}, progress: {}, learned: [], loadout: [] };
    state = applyMastery(state, MASTERY_POINTS_PER_RANK + 10);
    expect(state.mastery.vanguard).toBe(1);
    expect(state.progress.vanguard).toBe(10);
    state = applyMastery(state, MASTERY_POINTS_PER_RANK * 10); // overshoot far past mastered
    expect(state.mastery.vanguard).toBe(MASTERED_RANK);
    expect(state.progress.vanguard).toBe(0);
  });

  it("gates an advanced vocation behind mastered prerequisites and a level floor", () => {
    const hero = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "adopt" });
    // Not mastered yet → cannot adopt.
    expect(canAdoptVocation({ ...hero, level: 8 }, "vocation.ash-reaver", defaultWorld)).toBe(false);

    const mastered: CharacterVocationState = {
      current: "vanguard",
      mastery: { vanguard: MASTERED_RANK, sellsword: MASTERED_RANK },
      progress: {},
      learned: ["power-strike"],
      loadout: ["power-strike"]
    };
    // Prereqs mastered but below the level floor (6) → still no.
    expect(canAdoptVocation({ ...hero, level: 5, vocation: mastered }, "vocation.ash-reaver", defaultWorld)).toBe(false);
    // Prereqs mastered and at the floor → yes.
    expect(canAdoptVocation({ ...hero, level: 6, vocation: mastered }, "vocation.ash-reaver", defaultWorld)).toBe(true);
  });

  it("adopting a vocation keeps learned techniques and adds the new one, without touching level", () => {
    const start: CharacterVocationState = { current: "vanguard", mastery: { vanguard: MASTERED_RANK }, progress: {}, learned: ["sleep"], loadout: ["sleep"] };
    const reaver = findVocation(defaultWorld, "vocation.ash-reaver")!;
    const next = adoptVocationState(start, reaver);
    expect(next.current).toBe("vocation.ash-reaver");
    expect(next.learned).toEqual(expect.arrayContaining(["sleep", "power-strike"])); // old kept + new granted
    expect(next.loadout).toContain("power-strike"); // the signature move is usable at once
    expect(next.mastery.vanguard).toBe(MASTERED_RANK); // prior mastery untouched
  });

  it("applies an active vocation's stat modifiers on top of the base", () => {
    const hero = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "stats" });
    const base = getEffectiveCharacterStats(hero, defaultWorld);
    const reaverState = { ...resolveVocationState(hero), current: "vocation.ash-reaver" };
    const asReaver = getEffectiveCharacterStats({ ...hero, vocation: reaverState }, defaultWorld);
    expect(asReaver.attack).toBe(base.attack + 3); // ash-reaver: attack +3
    expect(asReaver.maxHp).toBe(base.maxHp + 8);
  });

  it("a combat victory advances the current vocation's mastery", () => {
    let state = createInitialCombat();
    const before = resolveVocationState(state.party[0]);
    state = executeCommand(state, defaultWorld, { type: "debug_force_victory" });
    const after = state.party[0].vocation!;
    const gained = (after.progress[after.current] ?? 0) + (after.mastery[after.current] ?? 0) * MASTERY_POINTS_PER_RANK;
    const had = (before.progress[before.current] ?? 0) + (before.mastery[before.current] ?? 0) * MASTERY_POINTS_PER_RANK;
    expect(gained).toBeGreaterThan(had);
  });
});

function createInitialCombat(): GameState {
  const enemy = defaultWorld.enemies.find((e) => e.id === "enemy.b1f.ash-slime")!;
  const hero = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "win" });
  const base = {
    ...(({} as unknown) as GameState),
    phase: "combat" as const,
    party: [{ ...hero, level: 3 }],
    reserve: [],
    retired: [],
    position: { roomId: "room.b1f.001", facing: "north" as const },
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
    map: { floorId: "dungeon.b1f", currentRoomId: "room.b1f.001", currentCellId: null, currentFacing: "north" as const, visitedRooms: [], visitedCells: [], knownExits: {}, blockedExits: {}, secretCandidates: {} },
    log: [],
    turn: 1,
    aiEnabled: false,
    quests: []
  };
  return base as GameState;
}
