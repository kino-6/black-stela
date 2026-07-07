import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { toPortableAdventurer, importAdventurer } from "../src/domain/characterCreation";
import { readVault, writeVault, depositToVault, removeFromVault, PortableAdventurerSchema } from "../src/domain/adventurerVault";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState, PortableAdventurer, ScenarioWorld } from "../src/domain/types";

function partyOf(count: number): GameState {
  let state = createInitialGameState();
  for (let index = 0; index < count; index += 1) {
    state = addCharacter(state, createCharacter({ name: `P${index}`, notes: "x" }));
  }
  return state;
}

function samplePortable(over: Partial<PortableAdventurer["progress"]> = {}, classId: PortableAdventurer["build"]["classId"] = "arcanist"): PortableAdventurer {
  const state = partyOf(1);
  const base = toPortableAdventurer({ ...state.party[0], classId }, defaultWorld, { exportedAt: "2026-01-01T00:00:00.000Z" });
  return { ...base, progress: { ...base.progress, level: 5, xp: 500, gold: 900, ...over } };
}

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

describe("portable adventurer format", () => {
  it("captures identity, build and progress but not scenario equipment", () => {
    const portable = toPortableAdventurer(partyOf(1).party[0], defaultWorld, { exportedAt: "2026-01-01T00:00:00.000Z" });
    expect(portable.formatVersion).toBe(1);
    expect(portable.origin.worldId).toBe(defaultWorld.id);
    expect(portable).not.toHaveProperty("equipment");
    expect(PortableAdventurerSchema.safeParse(portable).success).toBe(true);
  });
});

describe("importAdventurer clamps to scenario policy", () => {
  it("caps level and resets in-world dungeon progress", () => {
    const portable = samplePortable();
    const world: ScenarioWorld = { ...defaultWorld, importPolicy: { levelCap: 3 } };
    const { character, adjustments } = importAdventurer(portable, world);
    expect(character.level).toBe(3);
    expect(character.memory.deepestFloorId).toBeUndefined();
    expect(adjustments).toContain("level_capped");
    expect(character.equipment).toEqual({});
  });

  it("caps gold", () => {
    const world: ScenarioWorld = { ...defaultWorld, importPolicy: { goldCap: 100 } };
    const { character, adjustments } = importAdventurer(samplePortable(), world);
    expect(character.gold).toBe(100);
    expect(adjustments).toContain("gold_capped");
  });

  it("remaps a class the scenario disallows to the first allowed class", () => {
    const world: ScenarioWorld = { ...defaultWorld, importPolicy: { allowedClasses: ["vanguard", "mender"] } };
    const { character, adjustments } = importAdventurer(samplePortable({}, "arcanist"), world);
    expect(character.classId).toBe("vanguard");
    expect(adjustments).toContain("class_remapped");
  });

  it("mints a fresh id and rebuilds combat stats at full hp", () => {
    const { character } = importAdventurer(samplePortable(), defaultWorld);
    expect(character.id).toBeTruthy();
    expect(character.hp).toBe(character.maxHp);
    expect(character.maxHp).toBeGreaterThan(0);
  });
});

describe("vault storage boundary", () => {
  it("deposits, reads back, and removes entries", () => {
    const storage = new MemoryStorage();
    depositToVault(storage, samplePortable(), "v1");
    depositToVault(storage, samplePortable(), "v2");
    expect(readVault(storage).map((e) => e.vaultId)).toEqual(["v1", "v2"]);
    removeFromVault(storage, "v1");
    expect(readVault(storage).map((e) => e.vaultId)).toEqual(["v2"]);
  });

  it("drops corrupt entries instead of throwing", () => {
    const storage = new MemoryStorage();
    storage.setItem("black-stela:adventurer-vault:v1", JSON.stringify([{ vaultId: "bad" }, "junk"]));
    expect(readVault(storage)).toEqual([]);
  });

  it("survives non-JSON storage contents", () => {
    const storage = new MemoryStorage();
    storage.setItem("black-stela:adventurer-vault:v1", "not json");
    expect(readVault(storage)).toEqual([]);
  });
});

describe("import_member command", () => {
  it("adds an imported adventurer to the reserve in town", () => {
    const state = partyOf(1);
    const after = executeCommand(state, defaultWorld, { type: "import_member", adventurer: samplePortable() });
    expect(after.reserve).toHaveLength(1);
    expect(after.party).toHaveLength(1);
  });

  it("refuses to import mid-dungeon", () => {
    const state: GameState = { ...partyOf(1), phase: "dungeon" };
    const after = executeCommand(state, defaultWorld, { type: "import_member", adventurer: samplePortable() });
    expect(after.reserve).toHaveLength(0);
  });
});
