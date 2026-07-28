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
import { partySizeValue, preparationValue, provisionValue, simulateDescent } from "../src/headless/descentSim";
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
  const pv = provisionValue(world, "prepared");
  console.log(`\n=== ${world.title}  (${world.id}) ===`);
  console.log(`  balance knobs: threatScalar=${world.balance?.threatScalar ?? "—"}  counterplayBoost=${world.balance?.counterplayBoost ?? "—"}`);
  console.log(`  PREPARE-OR-WIPE : naive clears @Lv${prep.naiveMinLevel}, prepared @Lv${prep.preparedMinLevel}  →  levelsSaved=${prep.levelsSaved}  (target ~10)`);
  console.log(`  PARTY-SIZE      : full(${psv.fullSize}) clears @Lv${psv.fullMinLevel}, solo(${psv.soloSize}) @Lv${psv.soloMinLevel}  →  levelsCost=${psv.levelsCost}  (Wiz attrition: large, but a path remains)`);
  console.log(`  PROVISION (kit) : bare clears @Lv${pv.bareMinLevel}, kitted @Lv${pv.kittedMinLevel}  →  levelsSaved=${pv.levelsSaved}  (>0 = the kit buys survival; too large = consumables faceroll)`);

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

  reportEconomy(world, level, floors);
}

// The RESOURCE-ECONOMY axis (difficulty-design.md §3). A full PREPARED party carries the world's
// affordable kit and auto-uses it; we read the two danger channels apart (trash vs telegraphed spike),
// the kit burn per floor, where the kit runs dry (the retreat trigger), and whether the dive income
// covers a re-provision. A world with no `balance.economy` block is skipped (no scarcity authored).
function reportEconomy(world: ScenarioWorld, level: number, floors: string[]) {
  if (!world.balance?.economy) {
    console.log(`\n  RESOURCE-ECONOMY: (no balance.economy authored — modern no-scarcity)`);
    return;
  }
  const run = simulateDescent(world, { heal: "none", policy: "prepared", startLevel: level, provision: true });
  const cap = world.balance.economy.carryCap;
  console.log(`\n  RESOURCE-ECONOMY (full prepared party, provisioned, none-heal, startLv=${level}):`);
  console.log(
    `    kit cost ${run.kitCost}g  ·  dive income ${run.totalGold}g  ·  economy balance ${
      Number.isFinite(run.economyBalance) ? `${run.economyBalance.toFixed(1)}× re-provision` : "n/a"
    }  ·  kit runs dry: ${run.kitExhaustedFloor ? run.kitExhaustedFloor.replace(/^dungeon\./, "") : "never (too loose?)"}${
      cap ? `  ·  carryCap/act [${cap.join(", ")}]` : ""
    }`
  );
  console.log(`    floor        trough   trash   spike    heal  cure   kit   +gold`);
  floors.forEach((floorId) => {
    const f = run.floors.find((fl) => fl.floorId === floorId);
    const shortId = floorId.replace(/^dungeon\./, "");
    if (!f) {
      console.log(`    ${shortId.padEnd(12)}    —`);
      return;
    }
    const trash = f.trashFights === 0 ? "  — " : pct(f.trashLowestHpPct);
    const spike = f.spikeFights === 0 ? "  — " : pct(f.spikeLowestHpPct);
    console.log(
      `    ${shortId.padEnd(12)} ${(f.wiped ? "WIPE" : pct(f.lowestHpPct)).padStart(6)}  ${trash.padStart(5)}  ${spike.padStart(5)}   ${String(
        f.healsUsed
      ).padStart(4)}  ${String(f.curesUsed).padStart(4)}  ${String(f.kitRemaining).padStart(4)}  ${String(f.goldEarned).padStart(5)}`
    );
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
