import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { withDeterministicIds } from "../src/domain/ids";
import { canonicalize } from "../src/tools/packExport";
import type { GuildCharacterInput } from "../src/domain/characterCreation";

// M2 (Godot migration): createGuildCharacter samples so the GDScript port (buildAptitude + deriveStats +
// baseMaxMpForClass + equipment) can be proven to build a byte-identical adventurer. Each sample carries
// the INPUT and the resulting character; the Godot verifier rebuilds from the input and compares every
// field except the minted id (which is not part of the creation math). Run `npm run export:character-samples`.

const inputs: GuildCharacterInput[] = [
  { name: "Rook", classId: "vanguard", seed: "s" }, // front martial, mp mode none
  { name: "Vex", classId: "arcanist", backgroundId: "apothecary", traitIds: ["curious"], aptitudeFocus: "wit", seed: "s" }, // caster
  { name: "Nim", classId: "cutpurse", backgroundId: "ruinborn", traitIds: ["nimble", "lucky"], aptitudeFocus: "agility", seed: "s" },
  { name: "Sella", classId: "mender", backgroundId: "apothecary", traitIds: ["devout"], aptitudeFocus: "spirit", bonusAptitude: { spirit: 1, wit: 1 }, seed: "s" }
];

const samples = withDeterministicIds("charsamples", () =>
  inputs.map((input) => ({ input, character: createGuildCharacter(input) }))
);

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "character-samples.json"),
  `${JSON.stringify(canonicalize({ schemaVersion: 1, samples }), null, 2)}\n`
);
console.log(`exported ${samples.length} character samples → godot/data/character-samples.json`);
