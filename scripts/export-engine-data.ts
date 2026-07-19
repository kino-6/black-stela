import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EQUIPMENT_AFFIXES } from "../src/domain/affixes";
import { classCatalog } from "../src/domain/characterCreation";
import { CLASS_ABILITIES, isCasterClass, isMartialSkillClass } from "../src/domain/spells";
import { LOADOUT_LIMIT, MASTERED_RANK, MASTERY_POINTS_PER_RANK } from "../src/domain/vocations";
import { canonicalize } from "../src/tools/packExport";
import type { CharacterClassId } from "../src/domain/types";

// S3 chunk 3c: universal engine data Godot needs but that is not per-world (class abilities the default
// vocation learns, plus the mastery constants). Run with `npm run export:engine`.
// M3 (vocations): the class catalog + per-class MP mode also ride here so change_vocation's reclass
// path (reclassCharacter) can re-derive a class base identically to TS without a second data file.
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
const mpModeByClass: Record<string, "caster" | "martial" | "none"> = {};
for (const def of classCatalog) {
  const id = def.id as CharacterClassId;
  mpModeByClass[id] = isCasterClass(id) ? "caster" : isMartialSkillClass(id) ? "martial" : "none";
}
// ORDERED [slot, id] equipment pairs (class-insertion order), matching export-character-data — the
// reclass startingEquipment is Object.values(equipment) and canonicalizing an object would re-sort it.
const classes = classCatalog.map((def) => ({
  id: def.id,
  label: def.label,
  roleTags: def.roleTags,
  rowPreference: def.rowPreference,
  aptitude: def.aptitude,
  base: def.base,
  equipment: Object.entries(def.equipment).map(([slot, id]) => ({ slot, id }))
}));
// The BUILT-IN equipment affixes live in code, not in any world pack, so a Godot loot roll cannot
// resolve them from the world alone. Ship them here and merge with world.affixes exactly as
// resolveAffixCatalog does (authored wins on a shared id).
const data = { schemaVersion: 1, equipmentAffixes: canonicalize(EQUIPMENT_AFFIXES), classAbilities: canonicalize(CLASS_ABILITIES), loadoutLimit: LOADOUT_LIMIT, masteryPointsPerRank: MASTERY_POINTS_PER_RANK, masteredRank: MASTERED_RANK, classes, mpModeByClass };
writeFileSync(join(outDir, "engine-data.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log("exported engine data → godot/data/engine-data.json");
