import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDebugStateFromProgress, withDebugStartCell } from "../src/debug/debugStart";
import { toSaveDataV1, fromSaveDataV1 } from "../src/domain/saveData";
import { withDeterministicIds } from "../src/domain/ids";
import { hashState } from "../src/headless/traceFixture";
import { worldRegistry } from "../src/data/worldRegistry";
import { canonicalize } from "../src/tools/packExport";

// M6: the save round-trip oracle. TS writes a save from a known state and records the state hash the
// save must reproduce. Godot loads it, re-saves it, and must land on the SAME hash — proving a run
// started in one runtime continues in the other with no data loss.
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });

const fixtures = ["ready", "after_encounter", "floor_3"].map((progress) =>
  withDeterministicIds(`save:${progress}`, () => {
    const world = worldRegistry["default"];
    let state = createDebugStateFromProgress(world, progress as never);
    if (progress === "floor_3") {
      state = withDebugStartCell(state, world, "room.b3f.001", "north");
    }
    const save = toSaveDataV1(state, world, { savedAt: "2026-07-20T00:00:00.000Z", locale: "ja" });
    // The hash a correct load must reproduce — taken AFTER a TS round-trip so schema defaults are applied.
    return { name: progress, save: canonicalize(save), stateHash: hashState(fromSaveDataV1(save)) };
  })
);

writeFileSync(join(outDir, "save-fixtures.json"), `${JSON.stringify({ schemaVersion: 1, fixtures }, null, 2)}\n`);
console.log(`exported ${fixtures.length} save round-trip fixtures → godot/data/save-fixtures.json`);
