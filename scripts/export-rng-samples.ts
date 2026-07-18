import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rngSamplesToJson } from "../src/tools/rngSamples";

// S3 combat groundwork: write the seeded-RNG parity fixture to godot/data/rng-samples.json. The
// GDScript combat RNG port (godot/scripts/rules/combat_rng.gd) must reproduce every value.
// Run with `npm run export:rng`.

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "rng-samples.json"), rngSamplesToJson());
console.log("exported RNG samples → godot/data/rng-samples.json");
