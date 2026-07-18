import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { statSamplesToJson } from "../src/tools/statSamples";

// S3 chunk 3a: write the getEffectiveCharacterStats parity fixture. Run with `npm run export:stats`.
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "stat-samples.json"), statSamplesToJson());
console.log("exported stat samples → godot/data/stat-samples.json");
