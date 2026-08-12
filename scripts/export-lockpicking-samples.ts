import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lockpickingSamplesToJson } from "../src/tools/lockpickingSamples";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "lockpicking-samples.json"), lockpickingSamplesToJson());
console.log("exported lockpicking samples → godot/data/lockpicking-samples.json");
