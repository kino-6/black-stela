import { parseSaveData, type SaveDataV1 } from "../domain/saveData";

const DEFAULT_PREFIX = "black-stela:save:";

export interface SaveRepository {
  write(slotId: string, save: SaveDataV1): void;
  read(slotId: string): SaveReadResult;
  list(): SaveSlotSummary[];
}

export type SaveReadResult =
  | { ok: true; save: SaveDataV1 }
  | { ok: false; reason: "missing" | "corrupt"; message: string };

export type SaveSlotSummary =
  | {
      slotId: string;
      status: "valid";
      savedAt: string;
      worldId: string;
      title: string;
    }
  | {
      slotId: string;
      status: "corrupt";
      message: string;
    };

export class LocalStorageSaveRepository implements SaveRepository {
  constructor(
    private readonly storage: Storage,
    private readonly prefix = DEFAULT_PREFIX
  ) {}

  write(slotId: string, save: SaveDataV1): void {
    this.storage.setItem(this.keyFor(slotId), JSON.stringify(save));
  }

  read(slotId: string): SaveReadResult {
    const raw = this.storage.getItem(this.keyFor(slotId));
    if (raw === null) {
      return { ok: false, reason: "missing", message: `Save slot not found: ${slotId}` };
    }

    return this.parse(raw);
  }

  list(): SaveSlotSummary[] {
    const summaries: SaveSlotSummary[] = [];

    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);
      if (!key?.startsWith(this.prefix)) {
        continue;
      }

      const slotId = key.slice(this.prefix.length);
      const result = this.read(slotId);
      if (result.ok) {
        summaries.push({
          slotId,
          status: "valid",
          savedAt: result.save.savedAt,
          worldId: result.save.scenario.worldId,
          title: result.save.scenario.title
        });
      } else {
        summaries.push({
          slotId,
          status: "corrupt",
          message: result.message
        });
      }
    }

    return summaries.sort((left, right) => left.slotId.localeCompare(right.slotId));
  }

  private parse(raw: string): SaveReadResult {
    try {
      return { ok: true, save: parseSaveData(JSON.parse(raw)) };
    } catch (error) {
      return {
        ok: false,
        reason: "corrupt",
        message: `Corrupt save data: ${error instanceof Error ? error.message : "Unknown parse error."}`
      };
    }
  }

  private keyFor(slotId: string): string {
    const trimmed = slotId.trim();
    if (!trimmed) {
      throw new Error("Save slot ID is required.");
    }

    return `${this.prefix}${trimmed}`;
  }
}

export interface TauriSaveFileApi {
  appDataDir(): Promise<string>;
  mkdir(path: string): Promise<void>;
  writeTextFile(path: string, contents: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
  readDir(path: string): Promise<Array<{ name: string }>>;
}

export class TauriFileSaveRepository {
  constructor(
    private readonly fileApi: TauriSaveFileApi,
    private readonly directoryName = "saves"
  ) {}

  async write(slotId: string, save: SaveDataV1): Promise<void> {
    const directory = await this.saveDirectory();
    await this.fileApi.mkdir(directory);
    await this.fileApi.writeTextFile(this.pathFor(directory, slotId), JSON.stringify(save));
  }

  async read(slotId: string): Promise<SaveReadResult> {
    try {
      const directory = await this.saveDirectory();
      return this.parse(await this.fileApi.readTextFile(this.pathFor(directory, slotId)));
    } catch (error) {
      return {
        ok: false,
        reason: "missing",
        message: error instanceof Error ? error.message : `Save slot not found: ${slotId}`
      };
    }
  }

  async list(): Promise<SaveSlotSummary[]> {
    const directory = await this.saveDirectory();
    const entries = await this.fileApi.readDir(directory);
    const summaries = await Promise.all(
      entries
        .filter((entry) => entry.name.endsWith(".json"))
        .map(async (entry) => {
          const slotId = entry.name.replace(/\.json$/, "");
          const result = await this.read(slotId);
          if (result.ok) {
            return {
              slotId,
              status: "valid" as const,
              savedAt: result.save.savedAt,
              worldId: result.save.scenario.worldId,
              title: result.save.scenario.title
            };
          }

          return { slotId, status: "corrupt" as const, message: result.message };
        })
    );

    return summaries.sort((left, right) => left.slotId.localeCompare(right.slotId));
  }

  private parse(raw: string): SaveReadResult {
    try {
      return { ok: true, save: parseSaveData(JSON.parse(raw)) };
    } catch (error) {
      return {
        ok: false,
        reason: "corrupt",
        message: `Corrupt save data: ${error instanceof Error ? error.message : "Unknown parse error."}`
      };
    }
  }

  private async saveDirectory() {
    const root = await this.fileApi.appDataDir();
    return `${root.replace(/\/$/, "")}/${this.directoryName}`;
  }

  private pathFor(directory: string, slotId: string) {
    const trimmed = slotId.trim();
    if (!trimmed) {
      throw new Error("Save slot ID is required.");
    }

    return `${directory}/${trimmed}.json`;
  }
}
