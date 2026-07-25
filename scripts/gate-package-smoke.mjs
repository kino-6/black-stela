#!/usr/bin/env node
// gate:package-smoke — the SHIPPING artifact is the Godot native macOS export (Web/Tauri are not targets).
// It must build with ZERO warnings / SCRIPT ERRORs / missing resources / missing .gd.uid sidecars (#27).
// Run after `npm run stage:assets && npm run import:assets` (the gate:package-smoke script chains those).
// Requires the macOS export templates for this Godot version; if they are absent the export fails and this
// reports FAIL (you cannot certify a package you cannot build).
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "build", "macos", "BlackStela.zip");
mkdirSync(dirname(out), { recursive: true });

let log = "";
try {
  log = execSync(`godot --headless --path godot/ --export-release "macOS" "${out}" 2>&1`, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  console.error("[package-smoke] FAIL — the macOS export command errored (export templates missing?)");
  console.error(String(e.stdout ?? e.message ?? "").split("\n").slice(-15).join("\n"));
  process.exit(1);
}

// Lines that mean the packaged build would ship broken. Godot's own progress bars use "DONE"/percentages,
// not these words. `Infinite loop detected` is a known verify-script warning unrelated to the export.
const bad = log
  .split("\n")
  .filter((l) => /warning|SCRIPT ERROR|missing-resource|Nonexistent|\.uid/i.test(l))
  .filter((l) => !/Infinite loop detected/i.test(l));

if (bad.length > 0) {
  console.error(`[package-smoke] FAIL — ${bad.length} warning/error line(s) in the macOS export:`);
  for (const l of bad.slice(0, 25)) console.error("  " + l.trim());
  process.exit(1);
}

console.log("[package-smoke] PASS — macOS Godot export built with 0 warnings / 0 SCRIPT ERRORs / 0 missing / 0 orphan .uid");
