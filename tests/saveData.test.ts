import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { fromSaveDataV1, parseSaveDataV1, toSaveDataV1 } from "../src/domain/saveData";

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
    const parsed = parseSaveDataV1({
      schemaVersion: save.schemaVersion,
      savedAt: save.savedAt,
      scenario: save.scenario,
      state: save.state
    });

    expect(parsed.settings).toEqual({ aiEnabled: true, locale: "en" });
  });

  it("rejects unknown future versions clearly", () => {
    const save = toSaveDataV1(progressedState(), defaultWorld);

    expect(() => parseSaveDataV1({ ...save, schemaVersion: 99 })).toThrow(
      "Unsupported save data schema version: 99"
    );
  });
});
