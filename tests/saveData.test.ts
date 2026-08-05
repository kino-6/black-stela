import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import {
  LATEST_SAVE_SCHEMA_VERSION,
  autosaveSlotId,
  fromSaveDataV1,
  isAutosaveSlot,
  isManualSlot,
  manualSlotId,
  manualSlotIndex,
  migrateSaveData,
  parseSaveData,
  parseSaveDataV1,
  toSaveDataV1
} from "../src/domain/saveData";

function progressedState() {
  const party = addCharacter(
    createInitialGameState(),
    createCharacter({ name: "Mira", notes: "Mapper", portraitRef: "data:image/png;base64,AAA" })
  );
  const entered = executeCommand(party, defaultWorld, { type: "enter_dungeon" });

  return executeCommand(entered, defaultWorld, { type: "move_forward" });
}

describe("save data", () => {
  it("creates versioned SaveDataV1 with scenario metadata and settings", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld, { savedAt: "2026-07-03T00:00:00.000Z" });

    expect(save.schemaVersion).toBe(1);
    expect(save.savedAt).toBe("2026-07-03T00:00:00.000Z");
    expect(save.scenario.worldId).toBe(defaultWorld.id);
    expect(save.settings).toEqual({ aiEnabled: true, locale: "en" });
  });

  it("round trips the current GameState exactly enough to resume", () => {
    const state = progressedState();
    const save = toSaveDataV1(state, defaultWorld, { savedAt: "2026-07-03T00:00:00.000Z" });
    const restored = fromSaveDataV1(save);

    expect(restored).toEqual(state);
  });

  it("uses safe defaults for missing optional future fields", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld, { savedAt: "2026-07-03T00:00:00.000Z" });
    const { partyGold, claimedTreasures, ...legacyState } = save.state;
    const parsed = parseSaveDataV1({
      schemaVersion: save.schemaVersion,
      savedAt: save.savedAt,
      scenario: save.scenario,
      state: legacyState
    });

    expect(parsed.settings).toEqual({ aiEnabled: true, locale: "en" });
    expect(parsed.state.partyGold).toBeGreaterThan(0);
    expect(parsed.state.claimedTreasures).toEqual([]);
  });

  it("round trips affixed and upgraded equipment instances", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld, { savedAt: "2026-07-03T00:00:00.000Z" });
    const parsed = parseSaveDataV1({
      ...save,
      state: {
        ...save.state,
        party: save.state.party.map((member) => ({
          ...member,
          equipment: { weapon: { id: "equip.militia-sabre", plus: 1, affix: "keen" }, body: { id: "equip.padded-jack" } }
        }))
      }
    });

    expect(parsed.state.party[0].equipment.weapon).toEqual({ id: "equip.militia-sabre", plus: 1, affix: "keen" });
    expect(parsed.state.party[0].equipment.body).toEqual({ id: "equip.padded-jack" });
  });

  it("round trips economy and equipment state", () => {
    const bought = executeCommand(
      addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" })),
      defaultWorld,
      {
        type: "buy_item",
        shopId: "shop.stela-general",
        itemId: "equip.militia-sabre"
      }
    );
    const save = toSaveDataV1(bought, defaultWorld, { savedAt: "2026-07-03T00:00:00.000Z" });
    const restored = fromSaveDataV1(save);

    expect(restored.partyGold).toBe(bought.partyGold);
    expect(restored.claimedTreasures).toEqual(bought.claimedTreasures);
    expect(restored.inventory.find((item) => item.id === "equip.militia-sabre")?.quantity).toBe(1);
  });

  it("rejects unknown future versions clearly", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld);

    expect(() => parseSaveDataV1({ ...save, schemaVersion: 99 })).toThrow(
      "Unsupported save data schema version: 99"
    );
  });

  // Lane G — save-schema migration seam. `parseSaveData` is the load entry point
  // the repositories use; it migrates forward then validates.
  it("migration seam loads a current-version save unchanged", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld);
    expect(save.schemaVersion).toBe(LATEST_SAVE_SCHEMA_VERSION);
    const restored = parseSaveData(save);
    expect(restored.state.partyGold).toBe(save.state.partyGold);
  });

  it("migration refuses a save newer than this build (no silent data loss)", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld);
    expect(() => migrateSaveData({ ...save, schemaVersion: LATEST_SAVE_SCHEMA_VERSION + 1 })).toThrow(
      /newer than this build supports/
    );
  });
});

// U4: per-scenario slot ids. The SAVE ENVELOPE is unchanged (worldId lives inside it); these ids are the
// storage/UI keys that make autosave per-scenario and give the player three manual slots each.
describe("save slot ids (U4)", () => {
  it("keys the autosave per world so scenarios never clobber each other", () => {
    expect(autosaveSlotId("world.default")).toBe("auto:world.default");
    expect(autosaveSlotId("world.terminal-line")).toBe("auto:world.terminal-line");
    expect(autosaveSlotId("world.default")).not.toBe(autosaveSlotId("world.verdant"));
  });

  it("numbers a world's manual slots and reads the number back", () => {
    expect(manualSlotId("world.verdant", 2)).toBe("manual:world.verdant:2");
    expect(manualSlotIndex("manual:world.verdant:2")).toBe(2);
    expect(manualSlotIndex("auto:world.verdant")).toBeNull();
    expect(manualSlotIndex("not-a-slot")).toBeNull();
  });

  it("classifies a slot id as autosave vs manual", () => {
    expect(isAutosaveSlot(autosaveSlotId("world.default"))).toBe(true);
    expect(isManualSlot(autosaveSlotId("world.default"))).toBe(false);
    expect(isManualSlot(manualSlotId("world.default", 1))).toBe(true);
    expect(isAutosaveSlot(manualSlotId("world.default", 1))).toBe(false);
  });

  it("round-trips a manual save under its own slot id, tagged with its world", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld);
    const slotId = manualSlotId(defaultWorld.id, 3);
    // The slot id and the envelope's worldId agree — the loader restores THIS scenario.
    expect(manualSlotIndex(slotId)).toBe(3);
    expect(save.scenario.worldId).toBe(defaultWorld.id);
    expect(fromSaveDataV1(save)).toEqual(save.state);
  });
});
