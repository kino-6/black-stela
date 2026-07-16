import { getWorldById, worldRegistry } from "../src/data/worldRegistry";
import { simulateContent } from "../src/headless/contentSim";

interface Options {
  worldIds: string[];
  seed: string;
  drops: number;
  floor: number;
  memberLevel: number;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOptions(args: string[]): Options {
  let worldInput = "all";
  let seed = "content-review";
  let drops = 2400;
  let floor = 8;
  let memberLevel = 8;

  for (let index = 0; index < args.length; index += 1) {
    const [flag, inlineValue] = args[index].split("=", 2);
    const nextValue = inlineValue ?? args[index + 1];
    if (!inlineValue && flag.startsWith("--")) {
      index += 1;
    }
    if (flag === "--world") worldInput = nextValue ?? worldInput;
    if (flag === "--seed") seed = nextValue ?? seed;
    if (flag === "--drops") drops = positiveInteger(nextValue, drops);
    if (flag === "--floor") floor = positiveInteger(nextValue, floor);
    if (flag === "--member-level") memberLevel = positiveInteger(nextValue, memberLevel);
  }

  return {
    worldIds: worldInput === "all" ? Object.keys(worldRegistry).sort() : worldInput.split(",").map((id) => id.trim()),
    seed,
    drops,
    floor,
    memberLevel
  };
}

const options = parseOptions(process.argv.slice(2));
const reports = options.worldIds.map((worldId) => {
  const world = getWorldById(worldId);
  if (!world) {
    throw new Error(`Unknown world "${worldId}". Available: ${Object.keys(worldRegistry).sort().join(", ")}`);
  }
  return {
    worldId,
    report: simulateContent(world, {
      seed: `${options.seed}:${worldId}`,
      drops: options.drops,
      floor: options.floor,
      memberLevel: options.memberLevel
    })
  };
});

console.log(JSON.stringify({ options, reports }, null, 2));

if (reports.some(({ report }) => report.findings.length > 0)) {
  process.exitCode = 1;
}
