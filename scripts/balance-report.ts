// Difficulty DESIGN report — the sim+theory view the balance is tuned against, so the knobs
// (world.md `balance:` + floor recommendations) are set from MEASURED outcomes, not intuition.
//
// It reports, per world:
//   • preparationValue — the prepare-or-wipe axis (levelsSaved, target ~10; see drpg-balance skill)
//   • partySizeValue   — the party-size axis (levelsCost of running under-strength; Wiz-style attrition)
//   • a per-floor TROUGH matrix (lowest mid-fight HP%, `none` heal) for a few party configs, with the
//     act-curve target band the skill sets, so a designer sees WHERE the curve misses its target.
//
// Run: npm run sim:balance  (all worlds)  |  npm run sim:balance -- --world verdant --level 1 --sizes 6,3,1
import { getWorldById, worldRegistry } from "../src/data/worldRegistry";
import { partySizeValue, preparationValue, simulateDescent } from "../src/headless/descentSim";
import type { ScenarioWorld } from "../src/domain/types";

// The act-curve targets (drpg-balance skill): `none`-model trough per floor, escalating by act.
// 3-floor acts; the deepest floor of each act is the low end. Values are the FLOOR of the band.
const ACT_TARGET: Record<number, [number, number]> = {
  // actIndex (0=I,1=II,2=III) -> [gentle end, hard end] trough band
  0: [0.85, 0.65],
  1: [0.6, 0.42],
  2: [0.38, 0.28]
};

function targetFor(floorIndex: number): [number, number] {
  const act = Math.min(2, Math.floor(floorIndex / 3));
  return ACT_TARGET[act];
}

function parseOptions(args: string[]) {
  let worldInput = "all";
  let level = 1;
  let sizes = [6, 3, 1];
  for (let i = 0; i < args.length; i += 1) {
    const [flag, inline] = args[i].split("=", 2);
    const next = inline ?? args[i + 1];
    if (!inline && flag.startsWith("--")) i += 1;
    if (flag === "--world") worldInput = next ?? worldInput;
    if (flag === "--level") level = Number(next) || level;
    if (flag === "--sizes") sizes = (next ?? "").split(",").map((s) => Number(s.trim())).filter((n) => n > 0);
  }
  const worldIds = worldInput === "all" ? Object.keys(worldRegistry) : worldInput.split(",").map((s) => s.trim());
  return { worldIds, level, sizes };
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`.padStart(4);
}

function reportWorld(world: ScenarioWorld, level: number, sizes: number[]) {
  const prep = preparationValue(world);
  const psv = partySizeValue(world, "prepared");
  console.log(`\n=== ${world.title}  (${world.id}) ===`);
  console.log(`  balance knobs: threatScalar=${world.balance?.threatScalar ?? "—"}  counterplayBoost=${world.balance?.counterplayBoost ?? "—"}`);
  console.log(`  PREPARE-OR-WIPE : naive clears @Lv${prep.naiveMinLevel}, prepared @Lv${prep.preparedMinLevel}  →  levelsSaved=${prep.levelsSaved}  (target ~10)`);
  console.log(`  PARTY-SIZE      : full(${psv.fullSize}) clears @Lv${psv.fullMinLevel}, solo(${psv.soloSize}) @Lv${psv.soloMinLevel}  →  levelsCost=${psv.levelsCost}  (Wiz attrition: large, but a path remains)`);

  // Trough matrix: rows = floors, cols = (size × prepared) + full-naive, none-heal at `level`.
  const cols: { label: string; run: ReturnType<typeof simulateDescent> }[] = [];
  for (const size of sizes) {
    cols.push({ label: `${size}p·prep`, run: simulateDescent(world, { heal: "none", policy: "prepared", startLevel: level, partySize: size }) });
  }
  cols.push({ label: `${sizes[0]}p·naive`, run: simulateDescent(world, { heal: "none", policy: "naive", startLevel: level, partySize: sizes[0] }) });

  const floors = world.dungeons.map((d) => d.id);
  console.log(`\n  TROUGH (lowest mid-fight HP%, none-heal, startLv=${level}) vs act target:`);
  console.log(`    floor        target      ${cols.map((c) => c.label.padStart(10)).join("")}`);
  floors.forEach((floorId, i) => {
    const [hi, lo] = targetFor(i);
    const cells = cols.map((c) => {
      const f = c.run.floors.find((fl) => fl.floorId === floorId);
      if (!f) return "    —".padStart(10);
      return `${f.wiped ? "WIPE" : pct(f.lowestHpPct)}`.padStart(10);
    });
    const shortId = floorId.replace(/^dungeon\./, "");
    console.log(`    ${shortId.padEnd(12)} ${`${pct(hi)}-${pct(lo)}`.padStart(9)}   ${cells.join("")}`);
  });
}

function main() {
  const { worldIds, level, sizes } = parseOptions(process.argv.slice(2));
  console.log(`Balance report — startLevel ${level}, sizes [${sizes.join(", ")}], none-heal (pessimistic one-push lower bound).`);
  console.log(`Targets: prepare-or-wipe levelsSaved ~10; act-curve trough band per floor (I gentle → III tense, never a wipe for a full prepared party).`);
  for (const id of worldIds) {
    const world = getWorldById(id);
    if (!world) {
      console.log(`\n(unknown world: ${id})`);
      continue;
    }
    reportWorld(world, level, sizes);
  }
}

main();
