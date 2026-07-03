import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { toSaveDataV1 } from "../src/domain/saveData";
import { LocalStorageSaveRepository } from "../src/services/saveRepository";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function saveData() {
  const state = addCharacter(
    createInitialGameState(),
    createCharacter({ name: "Mira", notes: "Mapper", portraitRef: "data:image/png;base64,AAA" })
  );

  return toSaveDataV1(state, defaultWorld, { savedAt: "2026-07-03T00:00:00.000Z" });
}

describe("local storage save repository", () => {
  it("writes, reads, and lists save slots", () => {
    const repository = new LocalStorageSaveRepository(new MemoryStorage());
    const save = saveData();

    repository.write("slot-1", save);

    expect(repository.read("slot-1")).toEqual({ ok: true, save });
    expect(repository.list()).toEqual([
      {
        slotId: "slot-1",
        status: "valid",
        savedAt: "2026-07-03T00:00:00.000Z",
        worldId: defaultWorld.id,
        title: defaultWorld.title
      }
    ]);
  });

  it("reports corrupt save data without crashing", () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageSaveRepository(storage);

    storage.setItem("black-stela:save:broken", "{not json");

    expect(repository.read("broken")).toMatchObject({ ok: false, reason: "corrupt" });
    expect(repository.list()).toMatchObject([{ slotId: "broken", status: "corrupt" }]);
  });
});
