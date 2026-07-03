import { defaultWorld } from "../src/data/defaultWorld";
import { runHeadlessProbes } from "../src/headless/headlessRunner";

const results = runHeadlessProbes(defaultWorld);
const report = results.map((result) => ({
  progress: result.progress,
  cleared: result.cleared,
  reason: result.reason,
  commands: result.commands.map((command) => command.type),
  trace: result.trace.map((step) => ({
    command: step.command,
    from: step.fromRoomId ?? step.fromPhase,
    to: step.toRoomId ?? step.toPhase,
    knowledge: step.knowledge
  })),
  diagnostic: result.diagnostic,
  final: {
    phase: result.state.phase,
    roomId: result.state.position?.roomId ?? null,
    floorId: result.state.map.floorId,
    visitedRooms: result.state.map.visitedRooms.length
  }
}));

console.log(JSON.stringify(report, null, 2));
