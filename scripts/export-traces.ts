import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { worldRegistry } from "../src/data/worldRegistry";
import { SLICE_ROUTES, TRACE_SCHEMA_VERSION, traceFixtureToJson } from "../src/tools/traceExport";

// S1 of the Godot migration: emit the golden trace fixtures under godot/data/traces/. Run with
// `npm run export:traces`. A GDScript port replays each fixture's commands from its initial state and
// must reproduce every event and canonical state hash the TS oracle recorded.

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data", "traces");
mkdirSync(outDir, { recursive: true });

for (const route of SLICE_ROUTES) {
  const world = worldRegistry[route.worldId];
  if (!world) {
    throw new Error(`trace route "${route.name}" references unknown world "${route.worldId}"`);
  }
  writeFileSync(join(outDir, `${route.name}.json`), traceFixtureToJson(route, world));
  console.log(`exported trace ${route.name} → godot/data/traces/${route.name}.json`);
}

const manifest = {
  schemaVersion: TRACE_SCHEMA_VERSION,
  traces: SLICE_ROUTES.map((route) => ({ name: route.name, worldId: route.worldId }))
};
writeFileSync(join(outDir, "index.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`exported manifest → godot/data/traces/index.json (${SLICE_ROUTES.length} traces)`);
