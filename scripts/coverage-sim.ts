import { getWorldById, worldRegistry } from "../src/data/worldRegistry";
import { hasSecondaryExplorationClass, simulateCoverage } from "../src/headless/coverageSim";

/**
 * §9.4e — print the varied-party coverage table for one or all worlds.
 *
 *   npm run sim:coverage            # every registered world
 *   npm run sim:coverage -- default
 *
 * Read it as two questions per problem: does EVERY row resolve (no class is compulsory), and does the
 * specialist row still win (the class is worth its slot)? `cost` means fights survived for recovery
 * — more is better — and afflictions landed / traps left armed elsewhere, where less is better.
 */
const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const worldIds = requested.length > 0 ? requested : Object.keys(worldRegistry);

for (const worldId of worldIds) {
  const world = getWorldById(worldId);
  if (!world) {
    console.error(`unknown world: ${worldId}`);
    process.exitCode = 1;
    continue;
  }

  console.log(`\n=== ${worldId} — varied-party coverage (class-system.md §9.4e / §10) ===`);
  console.log("problem    coverage    ok  cost  gold  charges  detail");
  for (const row of simulateCoverage(world)) {
    console.log(
      [
        row.problem.padEnd(10),
        row.coverage.padEnd(11),
        row.resolved ? " Y" : " N",
        String(row.cost).padStart(5),
        String(row.gold).padStart(5),
        String(row.charges).padStart(8),
        ` ${row.detail}`
      ].join(" ")
    );
  }
}

if (!hasSecondaryExplorationClass()) {
  console.log("\nNOTE: no class other than the Thief has ANY exploration proficiency, so traps have no");
  console.log("      `secondary` party — only specialist, item, or nothing (class-system.md §4).");
}
