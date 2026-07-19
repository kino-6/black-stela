import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGuildCharacter, importAdventurer } from "../src/domain/characterCreation";
import { worldRegistry } from "../src/data/worldRegistry";
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

// importAdventurer samples: a PORTABLE adventurer re-derived under a world's import policy. Like
// creation, this mints an id internally, so it is proven by SAMPLE (mechanical fields) rather than by a
// state-hash trace. Each sample records the reported `adjustments` too — the player must be told what
// the policy clamped.
const importInputs = [
  {
    schemaVersion: 1,
    identity: { name: "Wanderer", title: "Veteran", notes: "From another run.", accentColor: "#88aacc" },
    build: { classId: "seeker", backgroundId: "watch", traitIds: ["steady"], aptitude: { might: 3, agility: 5, spirit: 2, wit: 4, luck: 3 } },
    progress: { level: 9, xp: 400, gold: 900, memory: { deepestFloorId: "dungeon.b7f", firstExpeditionTurn: 12, injuries: 2, retreats: 1, notableVictories: ["Rootheart"] } }
  },
  {
    schemaVersion: 1,
    identity: { name: "Novice", title: "", notes: "", accentColor: "#c9a765" },
    build: { classId: "mender", backgroundId: "apothecary", traitIds: ["devout"], aptitude: { might: 2, agility: 2, spirit: 5, wit: 4, luck: 2 } },
    progress: { level: 1, xp: 0, gold: 0, memory: { injuries: 0, retreats: 0, notableVictories: [] } }
  }
];

const imports = withDeterministicIds("importsamples", () =>
  importInputs.map((portable) => {
    const result = importAdventurer(portable as never, worldRegistry["default"]);
    return { portable, character: result.character, adjustments: result.adjustments };
  })
);

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "character-samples.json"),
  `${JSON.stringify(canonicalize({ schemaVersion: 1, samples, imports }), null, 2)}\n`
);
console.log(`exported ${samples.length} character + ${imports.length} import samples → godot/data/character-samples.json`);
