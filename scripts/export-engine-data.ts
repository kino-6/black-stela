import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CLASS_ABILITIES } from "../src/domain/spells";
import { LOADOUT_LIMIT, MASTERED_RANK, MASTERY_POINTS_PER_RANK } from "../src/domain/vocations";
import { canonicalize } from "../src/tools/packExport";

// S3 chunk 3c: universal engine data Godot needs but that is not per-world (class abilities the default
// vocation learns, plus the mastery constants). Run with `npm run export:engine`.
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
const data = { schemaVersion: 1, classAbilities: canonicalize(CLASS_ABILITIES), loadoutLimit: LOADOUT_LIMIT, masteryPointsPerRank: MASTERY_POINTS_PER_RANK, masteredRank: MASTERED_RANK };
writeFileSync(join(outDir, "engine-data.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log("exported engine data → godot/data/engine-data.json");
