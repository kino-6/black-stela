import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { WORLD_PACK_SCHEMA_VERSION, canonicalize, exportWorldPack, worldPackToJson } from "../src/tools/packExport";

// S1 migration bridge: every world compiles to versioned JSON that the Godot runtime loads directly.
// These lock the two properties Godot depends on — the export is STABLE (re-running produces identical
// bytes) and LOSSLESS (the JSON still validates as the same world truth).
describe("world-pack JSON export (Godot migration S1)", () => {
  const worldIds = Object.keys(worldRegistry).sort();

  it("covers every registered world with a versioned envelope", () => {
    expect(worldIds.length).toBeGreaterThan(0);
    for (const id of worldIds) {
      const pack = exportWorldPack(id, worldRegistry[id]);
      expect(pack.schemaVersion).toBe(WORLD_PACK_SCHEMA_VERSION);
      expect(pack.worldId).toBe(id);
    }
  });

  it("is stable — re-exporting a world produces byte-identical JSON", () => {
    for (const id of worldIds) {
      expect(worldPackToJson(id, worldRegistry[id])).toBe(worldPackToJson(id, worldRegistry[id]));
    }
  });

  it("is lossless — the exported JSON round-trips to the canonical world with nothing dropped", () => {
    for (const id of worldIds) {
      const roundTripped = JSON.parse(worldPackToJson(id, worldRegistry[id])).world;
      // JSON serialization loses nothing: the parsed world equals the canonical source world. (The
      // runtime world is already loaded + validated on the TS side; Godot consumes this normalized
      // JSON directly rather than re-parsing Markdown/YAML.)
      expect(roundTripped).toEqual(canonicalize(worldRegistry[id]));
    }
  });

  it("canonicalizes deterministically — sorts object keys, preserves array order, drops undefined", () => {
    expect(canonicalize({ b: 1, a: 2, c: undefined })).toEqual({ a: 2, b: 1 });
    expect(JSON.stringify(canonicalize({ b: 1, a: 2 }))).toBe('{"a":2,"b":1}');
    // Arrays keep their order (dungeon/room/stock ordering is meaningful).
    expect(canonicalize([{ z: 1, a: 2 }, "x"])).toEqual([{ a: 2, z: 1 }, "x"]);
  });
});
