import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { WORLD_PACK_SCHEMA_VERSION, canonicalize, exportWorldPack, worldPackToJson } from "../src/tools/packExport";

// S1 migration bridge: every world compiles to versioned JSON that the Godot runtime loads directly.
// These lock the two properties Godot depends on — the export is STABLE (re-running produces identical
// bytes) and LOSSLESS (the JSON still validates as the same world truth).
// The source (pre-export) cell, whose `edges` key order is the authored one.
function worldCell(dungeonId: string, cellId: string) {
  const dungeon = (worldRegistry["default"].dungeons as { id: string; grid?: { cells: { id: string; edges: Record<string, unknown> }[] } }[]).find(
    (candidate) => candidate.id === dungeonId
  );
  return dungeon!.grid!.cells.find((cell) => cell.id === cellId)!;
}

// Drop the derived `edgeOrder` the export adds, so the losslessness check compares like with like.
function withoutEdgeOrder<T>(world: T): T {
  const clone = JSON.parse(JSON.stringify(world));
  for (const dungeon of clone.dungeons ?? []) {
    for (const cell of dungeon.grid?.cells ?? []) {
      delete cell.edgeOrder;
    }
  }
  return clone;
}

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
      //
      // The export ADDS one derived field: each grid cell's `edgeOrder`. canonicalize sorts object
      // keys, but the rules read a cell's `edges` in AUTHORED insertion order (that order decides
      // map_exits_known and secret-discovery order, so it is game truth). Strip it before comparing —
      // nothing may be DROPPED, and this is the one thing deliberately added.
      expect(withoutEdgeOrder(roundTripped)).toEqual(canonicalize(worldRegistry[id]));
    }
  });

  it("ships each grid cell's authored edge order, which canonicalize would otherwise destroy", () => {
    const exported = JSON.parse(worldPackToJson("default", worldRegistry["default"])).world;
    for (const dungeon of exported.dungeons) {
      for (const cell of dungeon.grid?.cells ?? []) {
        expect(cell.edgeOrder).toEqual(Object.keys(worldCell(dungeon.id, cell.id).edges));
      }
    }
  });

  it("canonicalizes deterministically — sorts object keys, preserves array order, drops undefined", () => {
    expect(canonicalize({ b: 1, a: 2, c: undefined })).toEqual({ a: 2, b: 1 });
    expect(JSON.stringify(canonicalize({ b: 1, a: 2 }))).toBe('{"a":2,"b":1}');
    // Arrays keep their order (dungeon/room/stock ordering is meaningful).
    expect(canonicalize([{ z: 1, a: 2 }, "x"])).toEqual([{ a: 2, z: 1 }, "x"]);
  });
});
