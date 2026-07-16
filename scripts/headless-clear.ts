import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress, parseDebugProgress } from "../src/debug/debugStart";
import { runHeadlessClear } from "../src/headless/headlessRunner";
import type { GameState } from "../src/domain/types";

interface HeadlessReachabilityOptions {
  progress: ReturnType<typeof parseDebugProgress>;
  maxSteps?: number;
}

const DEFAULT_MAX_STEPS = 3000;

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
// Dense floors need a larger walk budget than the old linear layout.
const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
const result = runHeadlessClear(initialState, defaultWorld, maxSteps);
const hpLost = result.state.party.reduce((total, member) => total + Math.max(0, member.maxHp - member.hp), 0);
const carriedItems = result.state.inventory
  .filter((item) => item.quantity > 0)
  .map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, kind: item.kind }));

const report = {
  reachable: result.cleared,
  outcome: result.cleared ? "reachable" : result.reason,
  engineReason: result.reason,
  progress,
  maxSteps,
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
    returnOutcome: describeReturnOutcome(result.state, result.cleared),
    partyGold: result.state.partyGold,
    consumables: carriedItems.filter((item) => item.kind === "healing" || item.kind === "utility"),
    loot: {
      carriedItems,
      claimedTreasures: result.state.claimedTreasures,
      rewardLogs: result.state.log
        .filter((entry) => entry.tags.includes("treasure") || entry.tags.includes("reward"))
        .map((entry) => entry.text)
    },
    hpPressure: {
      hpLost,
      injuredCount: result.state.party.filter((member) => member.injury).length,
      lowestHp: Math.min(...result.state.party.map((member) => member.hp))
    },
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

function describeReturnOutcome(state: GameState, reached: boolean) {
  if (reached && state.phase === "town") {
    return "returned_to_town";
  }

  if (state.phase === "town") {
    return "town_without_reachability_goal";
  }

  return "not_returned";
}
