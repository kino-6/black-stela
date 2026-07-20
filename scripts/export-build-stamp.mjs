#!/usr/bin/env node
// The build stamp the React build shows (vite.config.ts) — git short SHA (+ if dirty) and the time the
// build was made, so it is obvious at a glance WHICH build is on screen. The Godot port dropped it;
// this writes the same stamp into the data bridge so both runtimes show the same thing.
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let sha = "dev";
try {
  sha = execSync("git rev-parse --short HEAD").toString().trim();
  if (execSync("git status --porcelain").toString().trim()) sha += "+";
} catch {
  /* not a git checkout */
}
const now = new Date();
const stamp = `${sha} · ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "godot", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "build-stamp.json"), `${JSON.stringify({ build: stamp }, null, 2)}\n`);
console.log(`build stamp ${stamp} → godot/data/build-stamp.json`);
