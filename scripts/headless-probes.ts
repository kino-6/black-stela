import { defaultWorld } from "../src/data/defaultWorld";
import { runHeadlessProbes } from "../src/headless/headlessRunner";

const results = runHeadlessProbes(defaultWorld);
const report = results.map((result) => ({
  progress: result.progress,
  cleared: result.cleared,
  reason: result.reason,
  commands: result.commands.map((command) => command.type),
  diagnostic: result.diagnostic,
  final: {
    phase: result.state.phase,
    roomId: result.state.position?.roomId ?? null,
    floorId: result.state.map.floorId,
    visitedRooms: result.state.map.visitedRooms.length
  }
}));

console.log(JSON.stringify(report, null, 2));

if (results.some((result) => !result.cleared)) {
  process.exitCode = 1;
}
