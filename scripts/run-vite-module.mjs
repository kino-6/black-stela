import { runnerImport } from "vite";

const [modulePath, ...moduleArgs] = process.argv.slice(2);
if (!modulePath) {
  console.error("Usage: node scripts/run-vite-module.mjs <module.ts> [args...]");
  process.exit(1);
}

// The loaded CLI should see only its own arguments, not the runner module path.
process.argv = [process.argv[0], modulePath, ...moduleArgs];

await runnerImport(modulePath, { logLevel: "error" });
