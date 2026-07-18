import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { worldRegistry } from "../src/data/worldRegistry";
import { WORLD_PACK_SCHEMA_VERSION, worldPackToJson } from "../src/tools/packExport";

// S1 of the Godot migration: compile every validated world pack into versioned, normalized JSON under
// godot/data/worlds/. Run with `npm run export:packs`. Godot loads these directly — it never re-parses
// Markdown/YAML, so both runtimes read the exact same world truth.

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data", "worlds");
mkdirSync(outDir, { recursive: true });

const worldIds = Object.keys(worldRegistry).sort();
for (const id of worldIds) {
  const file = join(outDir, `${id}.json`);
  writeFileSync(file, worldPackToJson(id, worldRegistry[id]));
  console.log(`exported ${id} → godot/data/worlds/${id}.json`);
}

// A small manifest so the loader can enumerate worlds without a directory scan.
const manifest = {
  schemaVersion: WORLD_PACK_SCHEMA_VERSION,
  worlds: worldIds
};
writeFileSync(join(outDir, "index.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`exported manifest → godot/data/worlds/index.json (${worldIds.length} worlds)`);
