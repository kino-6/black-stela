import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseScenarioWorld } from "../src/domain/scenario";
import { createDebugStateFromProgress, parseDebugProgress } from "../src/debug/debugStart";
import { runHeadlessClear } from "../src/headless/headlessRunner";

const root = resolve(import.meta.dirname, "..");
const defaultWorld = parseScenarioWorld(
  readFileSync(resolve(root, "content/worlds/default/world.md"), "utf8"),
  [readFileSync(resolve(root, "content/worlds/default/dungeons/b1f.md"), "utf8")]
);

const progress = parseDebugProgress(process.argv[2] ?? "ready");
const initialState = createDebugStateFromProgress(defaultWorld, progress);
const result = runHeadlessClear(initialState, defaultWorld);

const report = {
  cleared: result.cleared,
  reason: result.reason,
  progress,
  commands: result.commands.map((command) => command.type),
  trace: result.trace.map((step) => ({
    command: step.command,
    from: step.fromRoomId ?? step.fromPhase,
    to: step.toRoomId ?? step.toPhase,
    phase: `${step.fromPhase}->${step.toPhase}`,
    floorId: step.floorId,
    knowledge: step.knowledge
  })),
  diagnostic: result.diagnostic,
  final: {
    phase: result.state.phase,
    visitedRooms: result.state.map.visitedRooms,
    defeatedEnemies: result.state.defeatedEnemies,
    resolvedTraps: result.state.resolvedTraps,
    logEntries: result.state.log.length
  }
};

console.log(JSON.stringify(report, null, 2));

if (!result.cleared) {
  process.exitCode = 1;
}
