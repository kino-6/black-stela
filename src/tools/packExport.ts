import type { ScenarioWorld } from "../domain/types";

// S1 of the Godot migration (docs/design/migration-execution-plan.md): compile a validated,
// balance-applied ScenarioWorld into versioned, normalized JSON that the Godot runtime loads directly.
// Godot never re-parses Markdown/YAML — this is the single build-time bridge, so both runtimes read the
// exact same normalized world truth.

// Bump when the exported shape changes in a way a consumer must notice.
export const WORLD_PACK_SCHEMA_VERSION = 1;

export interface ExportedWorldPack {
  schemaVersion: number;
  worldId: string;
  world: ScenarioWorld;
}

// Recursively sort object keys (arrays keep their order — order is meaningful for dungeons, rooms,
// stock, …). Canonical output means a re-export produces a byte-identical file, so diffs are real
// changes and a GDScript-side loader/compare is stable.
export function canonicalize<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item)) as unknown as T;
  }
  const record = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    if (record[key] !== undefined) {
      sorted[key] = canonicalize(record[key]);
    }
  }
  return sorted as unknown as T;
}

// The normalized, versioned pack object for one world.
export function exportWorldPack(worldId: string, world: ScenarioWorld): ExportedWorldPack {
  return {
    schemaVersion: WORLD_PACK_SCHEMA_VERSION,
    worldId,
    world: canonicalize(world)
  };
}

// Canonical pretty JSON string, ready to write to godot/data/worlds/<id>.json.
export function worldPackToJson(worldId: string, world: ScenarioWorld): string {
  return `${JSON.stringify(exportWorldPack(worldId, world), null, 2)}\n`;
}
