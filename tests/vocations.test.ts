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
  combatLoadout,
  findVocation,
  masteryGain,
  resolveVocationCatalog,
  resolveVocationState
} from "../src/domain/vocations";
import { createInitialGameState } from "../src/domain/gameState";
import { applyLevelUps } from "../src/domain/leveling";
import type { CharacterVocationState, Enemy, GameState } from "../src/domain/types";

function townState(): GameState {
  return { ...createInitialGameState(), phase: "town" };
}

const weakEnemy: Pick<Enemy, "level" | "dangerTier" | "prizedXp"> = { level: 1, dangerTier: 1 };
const strongEnemy: Pick<Enemy, "level" | "dangerTier" | "prizedXp"> = { level: 12, dangerTier: 4 };

// IMP-021A — the vocation/mastery contract. Basic vocations = the built-in classes; authored
// ADVANCED vocations are data, gated by mastering basics, and their stat modifiers layer on the
// base. Level is never reset by a vocation change, and mastery runs through the XP falloff.
describe("vocation mastery contract", () => {
  it("merges built-in basic classes with the world's authored advanced vocations", () => {
    const catalog = resolveVocationCatalog(defaultWorld);
    expect(catalog.some((v) => v.id === "warrior" && v.tier === "basic" && !v.authored)).toBe(true);
    const reaver = catalog.find((v) => v.id === "vocation.ash-reaver");
    expect(reaver).toMatchObject({ tier: "advanced", authored: true });
    expect(reaver?.requires?.mastered).toEqual(["warrior", "swordmaster"]);
  });

  it("defaults a vocation state from the character's class when none is stored", () => {
    const mender = createGuildCharacter({ name: "Sei", classId: "priest", seed: "voc" });
    const state = resolveVocationState(mender);
    expect(state.current).toBe("priest");
    expect(state.learned).toContain("heal"); // the mender's class ability is retained from the start
    expect(state.loadout.length).toBeLessThanOrEqual(6);
  });

  it("trims mastery gain for weak enemies (the same out-levelling falloff as XP)", () => {
    expect(masteryGain(8, weakEnemy)).toBeLessThan(masteryGain(8, strongEnemy));
    expect(masteryGain(1, weakEnemy)).toBeGreaterThan(0);
  });

  it("banks mastery into ranks and caps at MASTERED_RANK", () => {
    let state: CharacterVocationState = { current: "warrior", mastery: {}, progress: {}, learned: [], loadout: [] };
    state = applyMastery(state, MASTERY_POINTS_PER_RANK + 10);
    expect(state.mastery.warrior).toBe(1);
    expect(state.progress.warrior).toBe(10);
    state = applyMastery(state, MASTERY_POINTS_PER_RANK * 10); // overshoot far past mastered
    expect(state.mastery.warrior).toBe(MASTERED_RANK);
    expect(state.progress.warrior).toBe(0);
  });

  it("gates an advanced vocation behind mastered prerequisites and a level floor", () => {
    const hero = createGuildCharacter({ name: "Rook", classId: "warrior", seed: "adopt" });
    // Not mastered yet → cannot adopt.
    expect(canAdoptVocation({ ...hero, level: 8 }, "vocation.ash-reaver", defaultWorld)).toBe(false);

    const mastered: CharacterVocationState = {
      current: "warrior",
      mastery: { warrior: MASTERED_RANK, swordmaster: MASTERED_RANK },
      progress: {},
      learned: ["power-strike"],
      loadout: ["power-strike"]
    };
    // Prereqs mastered but below the level floor (6) → still no.
    expect(canAdoptVocation({ ...hero, level: 5, vocation: mastered }, "vocation.ash-reaver", defaultWorld)).toBe(false);
    // Prereqs mastered and at the floor → yes.
    expect(canAdoptVocation({ ...hero, level: 6, vocation: mastered }, "vocation.ash-reaver", defaultWorld)).toBe(true);
  });

  it("adopting a vocation keeps learned techniques, adds only its EXCLUSIVE signature, and preserves mastery", () => {
    const start: CharacterVocationState = { current: "warrior", mastery: { warrior: MASTERED_RANK }, progress: {}, learned: ["sleep"], loadout: ["sleep"] };
    const reaver = findVocation(defaultWorld, "vocation.ash-reaver")!;
    const next = adoptVocationState(start, reaver);
    expect(next.current).toBe("vocation.ash-reaver");
    // §7B: ash-reaver's grant is the EXCLUSIVE ash-stance, never the reused power-strike a parent teaches
    // (§7A removed that). The prior learned set is kept and the one exclusive is added — nothing faked.
    expect(reaver.grantsTechniques ?? []).toEqual(["ash-stance"]);
    expect(next.learned).toEqual(expect.arrayContaining(["sleep", "ash-stance"])); // old kept + exclusive added
    expect(next.loadout).toContain("ash-stance"); // the signature move is usable at once
    expect(next.mastery.warrior).toBe(MASTERED_RANK); // prior mastery untouched
  });

  it("applies an active vocation's stat modifiers on top of the base", () => {
    const hero = createGuildCharacter({ name: "Rook", classId: "warrior", seed: "stats" });
    const base = getEffectiveCharacterStats(hero, defaultWorld);
    const reaverState = { ...resolveVocationState(hero), current: "vocation.ash-reaver" };
    const asReaver = getEffectiveCharacterStats({ ...hero, vocation: reaverState }, defaultWorld);
    expect(asReaver.attack).toBe(base.attack + 3); // ash-reaver: attack +3
    expect(asReaver.maxHp).toBe(base.maxHp + 8);
  });

  it("change_vocation keeps the character's level and unions techniques (IMP-021C)", () => {
    const hero = applyLevelUps({ ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "cmd" }), xp: 400 }).character;
    const levelBefore = hero.level;
    expect(levelBefore).toBeGreaterThan(1);
    const state: GameState = { ...townState(), party: [hero] };
    // 戦士 → 剣客 (another basic vocation, no prereqs). The consolidation merged 傭兵 into 戦士, so the
    // old "retrain into the neighbouring front-liner" case is this one now.
    const after = executeCommand(state, defaultWorld, { type: "change_vocation", characterId: hero.id, vocationId: "swordmaster" });
    const changed = after.party[0];
    expect(changed.vocation?.current).toBe("swordmaster");
    expect(changed.classId).toBe("swordmaster");
    // §6: the discipline they registered as survives the change.
    expect(changed.startingDiscipline).toBe("warrior");
    expect(changed.level).toBe(levelBefore); // the vocation change does NOT reset level
  });

  it("change_vocation is refused when prerequisites are unmet", () => {
    const hero = createGuildCharacter({ name: "Rook", classId: "warrior", seed: "cmd2" });
    const state: GameState = { ...townState(), party: [{ ...hero, level: 3 }] };
    const after = executeCommand(state, defaultWorld, { type: "change_vocation", characterId: hero.id, vocationId: "vocation.ash-reaver" });
    expect(after.party[0].vocation?.current ?? "warrior").not.toBe("vocation.ash-reaver");
  });

  it("set_loadout keeps only learned techniques", () => {
    const hero = createGuildCharacter({ name: "Sei", classId: "priest", seed: "load" });
    const withState = { ...hero, vocation: { current: "priest", mastery: {}, progress: {}, learned: ["heal", "sleep"], loadout: [] } };
    const state: GameState = { ...townState(), party: [withState] };
    const after = executeCommand(state, defaultWorld, { type: "set_loadout", characterId: hero.id, loadout: ["heal", "firebolt", "sleep"] });
    // firebolt is not learned → dropped; heal + sleep kept.
    expect(after.party[0].vocation?.loadout).toEqual(["heal", "sleep"]);
  });

  // T32 — the old 6-slot LOADOUT_LIMIT is gone. A class/gear may grant MORE than six combat
  // techniques and every one must reach combat, never be silently truncated to the first six.
  it("carries MORE than six techniques into combat — no loadout cap (T32)", () => {
    const eight = ["heal", "firebolt", "sleep", "power-strike", "purge", "ward-hymn", "battle-hymn", "sunder"];
    const hero = createGuildCharacter({ name: "Octa", classId: "priest", seed: "t32" });
    const withState = { ...hero, vocation: { current: "priest", mastery: {}, progress: {}, learned: [...eight], loadout: [] } };

    // set_loadout keeps all eight — nothing is dropped for exceeding a limit.
    const state: GameState = { ...townState(), party: [withState] };
    const after = executeCommand(state, defaultWorld, { type: "set_loadout", characterId: hero.id, loadout: [...eight] });
    expect(after.party[0].vocation?.loadout).toEqual(eight);

    // combatLoadout — what the combat command menu shows — returns all eight, not the first six.
    expect(combatLoadout(after.party[0])).toEqual(eight);
  });

  // T32 — a member who LEARNS more techniques (levelling folds the class line in) has each new one
  // added to the combat set even when six are already in it. The old cap broke at six and silently
  // dropped the rest; there is no ceiling now.
  it("folds newly-learned techniques into the loadout past six (T32)", () => {
    const hero = createGuildCharacter({ name: "Grow", classId: "priest", seed: "t32b" });
    // A level-20 priest's class line is six; the stored state is missing one of them (sanctuary) and
    // carries two cross-vocation techniques instead, with a curated loadout already at the old cap.
    const stored = {
      current: "priest",
      mastery: {},
      progress: {},
      learned: ["heal", "purge", "greater-heal", "blessing", "purification", "battle-hymn", "sunder"],
      loadout: ["heal", "purge", "greater-heal", "blessing", "purification", "battle-hymn"]
    };
    const refreshed = resolveVocationState({ ...hero, level: 20, vocation: stored });
    // Reading folds the missing class spell (sanctuary) into `learned`, then appends BOTH the free
    // learned techniques (sunder, sanctuary) to the six-deep loadout — eight in all, none capped away.
    expect(refreshed.loadout).toContain("sunder");
    expect(refreshed.loadout).toContain("sanctuary");
    expect(refreshed.loadout.length).toBe(8);
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
  const hero = createGuildCharacter({ name: "Rook", classId: "warrior", seed: "win" });
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
