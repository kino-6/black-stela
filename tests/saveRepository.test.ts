import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { toSaveDataV1 } from "../src/domain/saveData";
import { LocalStorageSaveRepository, TauriFileSaveRepository, type TauriSaveFileApi } from "../src/services/saveRepository";

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

class MemoryTauriFileApi implements TauriSaveFileApi {
  readonly files = new Map<string, string>();

  async appDataDir(): Promise<string> {
    return "/app-data/black-stela";
  }

  async mkdir(_path: string): Promise<void> {}

  async writeTextFile(path: string, contents: string): Promise<void> {
    this.files.set(path, contents);
  }

  async readTextFile(path: string): Promise<string> {
    const value = this.files.get(path);
    if (value === undefined) {
      throw new Error(`Missing file: ${path}`);
    }

    return value;
  }

  async readDir(path: string): Promise<Array<{ name: string }>> {
    return Array.from(this.files.keys())
      .filter((filePath) => filePath.startsWith(`${path}/`))
      .map((filePath) => ({ name: filePath.slice(path.length + 1) }));
  }
}

describe("tauri file save repository", () => {
  it("writes, reads, and lists save slots under app data", async () => {
    const fileApi = new MemoryTauriFileApi();
    const repository = new TauriFileSaveRepository(fileApi);
    const save = saveData();

    await repository.write("slot-1", save);

    expect(fileApi.files.has("/app-data/black-stela/saves/slot-1.json")).toBe(true);
    await expect(repository.read("slot-1")).resolves.toEqual({ ok: true, save });
    await expect(repository.list()).resolves.toEqual([
      {
        slotId: "slot-1",
        status: "valid",
        savedAt: "2026-07-03T00:00:00.000Z",
        worldId: defaultWorld.id,
        title: defaultWorld.title
      }
    ]);
  });
});
