import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { backgroundCatalog, classCatalog, traitCatalog } from "../src/domain/characterCreation";
import { isCasterClass, isMartialSkillClass } from "../src/domain/spells";
import { canonicalize } from "../src/tools/packExport";
import type { CharacterClassId } from "../src/domain/types";

// M2 (Godot migration): the character-creation catalogs Godot needs to build an adventurer identically
// to TS — class/background/trait definitions + the default aptitude + a PRECOMPUTED MP mode per class
// (caster / martial-skill / none), so the GDScript port does not have to re-derive it from SPELLS.
// Run with `npm run export:character-data`.

const defaultAptitude = { might: 2, agility: 2, spirit: 2, wit: 2, luck: 2 };

const mpModeByClass: Record<string, "caster" | "martial" | "none"> = {};
for (const def of classCatalog) {
  const id = def.id as CharacterClassId;
  mpModeByClass[id] = isCasterClass(id) ? "caster" : isMartialSkillClass(id) ? "martial" : "none";
}

const data = {
  schemaVersion: 1,
  defaultAptitude,
  classes: classCatalog.map((def) => ({
    id: def.id,
    roleTags: def.roleTags,
    rowPreference: def.rowPreference,
    aptitude: def.aptitude,
    base: def.base,
    // ORDERED [slot, id] pairs — createGuildCharacter's startingEquipment is Object.values(equipment),
    // i.e. class-insertion order (weapon before body). Canonicalizing an object would re-sort the keys
    // and change that order, so ship an array to preserve it.
    equipment: Object.entries(def.equipment).map(([slot, id]) => ({ slot, id }))
  })),
  backgrounds: backgroundCatalog.map((bg) => ({ id: bg.id, aptitude: bg.aptitude, accentColor: bg.accentColor })),
  traits: traitCatalog.map((tr) => ({ id: tr.id, aptitude: tr.aptitude })),
  mpModeByClass
};

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "character-data.json"), `${JSON.stringify(canonicalize(data), null, 2)}\n`);
console.log("exported character data → godot/data/character-data.json");
