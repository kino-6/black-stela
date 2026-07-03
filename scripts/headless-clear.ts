import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress, parseDebugProgress } from "../src/debug/debugStart";
import { runHeadlessClear } from "../src/headless/headlessRunner";

interface HeadlessReachabilityOptions {
  progress: ReturnType<typeof parseDebugProgress>;
  maxSteps?: number;
}

function parseOptions(args: string[]): HeadlessReachabilityOptions {
  let progressInput: string | null = null;
  let maxSteps: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--progress" || arg === "-p") {
      progressInput = args[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--progress=")) {
      progressInput = arg.slice("--progress=".length);
      continue;
    }

    if (arg === "--max-steps") {
      const value = Number(args[index + 1]);
      maxSteps = Number.isFinite(value) && value > 0 ? value : undefined;
      index += 1;
      continue;
    }

    if (arg.startsWith("--max-steps=")) {
      const value = Number(arg.slice("--max-steps=".length));
      maxSteps = Number.isFinite(value) && value > 0 ? value : undefined;
      continue;
    }

    if (!arg.startsWith("-") && progressInput === null) {
      progressInput = arg;
    }
  }

  return {
    progress: parseDebugProgress(progressInput),
    maxSteps
  };
}

const options = parseOptions(process.argv.slice(2));
const progress = options.progress;
const initialState = createDebugStateFromProgress(defaultWorld, progress);
const result = runHeadlessClear(initialState, defaultWorld, options.maxSteps);

const report = {
  reachable: result.cleared,
  outcome: result.cleared ? "reachable" : result.reason,
  engineReason: result.reason,
  progress,
  maxSteps: options.maxSteps ?? 20,
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
