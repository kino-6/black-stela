#!/usr/bin/env node
// Derive each manifest screen's requiredKeys FROM the React panel it replaces.
//
// Why this exists: the manifest's requirements were hand-written — by the same person who wrote the
// Godot screens, from the same understanding. Where that understanding was too small, the screen was
// thin AND its contract was thin, so the gate certified the omission. A contract you author yourself
// cannot catch what you never thought of. These come from the source of truth instead.
//
// Usage: node scripts/derive-ux-requirements.mjs [--write]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const manifestPath = join(root, "godot", "gates", "ux-parity-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const copy = JSON.parse(readFileSync(join(root, "godot", "data", "i18n-ja.json"), "utf8"));

// Panels whose keys belong to a screen but live in another file (a cockpit composed of parts).
const EXTRA_SOURCES = {
  "dungeon-dock": ["src/components/DungeonCockpit.tsx", "src/components/DungeonCommandDock.tsx"],
  "combat-command": ["src/components/CombatCommandMenu.tsx", "src/components/CombatPartyStrip.tsx"],
  "combat-tempo": ["src/components/CombatCommandDock.tsx"],
  result: ["src/components/CombatResultPanel.tsx"]
};

// Keys a Godot screen legitimately cannot carry: developer tooling, and web-only affordances.
const NEVER_REQUIRED = /^(debug\.|tempo\.autoMove|scenario\.(import|error|field|file|issues|category|blocked))/;

function keysIn(file) {
  const path = join(root, file);
  if (!existsSync(path)) return [];
  const src = readFileSync(path, "utf8");
  const found = new Set();
  for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z0-9._]+)"/g)) found.add(m[1]);
  // `t(\`ns.${x}\`)` template families: require the namespace's keys that exist in ja.ts.
  for (const m of src.matchAll(/\bt\(\s*`([a-zA-Z0-9._]+)\.\$\{/g)) {
    for (const key of Object.keys(copy)) if (key.startsWith(`${m[1]}.`)) found.add(key);
  }
  return [...found];
}

let changed = 0;
const report = [];
for (const screen of manifest.screens) {
  const sources = [screen.reactPanel, ...(EXTRA_SOURCES[screen.id] ?? [])].filter((s) => s?.endsWith(".tsx"));
  if (sources.length === 0) continue; // e.g. "src/i18n (config.*)" — described, not a panel
  // A template family — t(`career.stat.${k}`) — expands to the whole namespace, but the code may only
  // reach a few of them. A narrowing must be DECLARED with a reason so it stays visible; it can never
  // be dropped silently, which is the failure mode this whole script exists to prevent.
  const exclusions = new Map((screen.derivedExclusions ?? []).map((e) => [e.key, e.reason]));
  const derived = [...new Set(sources.flatMap(keysIn))]
    .filter((k) => copy[k] !== undefined && !NEVER_REQUIRED.test(k) && !exclusions.has(k))
    .sort();
  for (const [key, reason] of exclusions) {
    if (!reason) throw new Error(`${screen.id}: derivedExclusions["${key}"] needs a reason`);
  }
  if (derived.length === 0) continue;
  const missing = derived.filter((k) => !(screen.requiredKeys ?? []).includes(k));
  if (missing.length > 0) {
    report.push(`${screen.id}: +${missing.length} key(s) the React panel renders that the contract never asked for`);
    for (const k of missing) report.push(`      - ${k} ("${copy[k]}")`);
    changed += 1;
  }
  if (process.argv.includes("--write")) screen.requiredKeys = derived;
}

if (process.argv.includes("--write")) {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`derived requiredKeys for ${manifest.screens.length} screens (${changed} widened)`);
} else {
  console.log(report.join("\n") || "every contract already matches its React panel");
  console.log(`\n${changed} screen contract(s) are NARROWER than the panel they claim to replace.`);
}
