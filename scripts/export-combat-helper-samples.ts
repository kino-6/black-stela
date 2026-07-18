import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { combatHelperSamplesToJson } from "../src/tools/combatHelperSamples";

// S3 chunk 3b: write the attack-helper parity fixture. Run with `npm run export:combat-helpers`.
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "combat-helper-samples.json"), combatHelperSamplesToJson());
console.log("exported combat-helper samples → godot/data/combat-helper-samples.json");
