import { parseSaveDataV1, type SaveDataV1 } from "../domain/saveData";

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
      return { ok: true, save: parseSaveDataV1(JSON.parse(raw)) };
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
