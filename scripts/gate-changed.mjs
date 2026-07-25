#!/usr/bin/env node
// IMP-049 — the scoped change gate. `npm run gate:changed -- --scope <scope>` runs the FAST + AFFECTED
// checks a change of that scope must pass, a named NATIVE slice when the scope declares one, and
// AUTO-ESCALATES to the full normal-route gate (gate:migration) when a high-risk file is in the diff, the
// scope names its own escalation trigger, or the scope is alwaysFullRoute (save). It prints the contract it
// selected — commands run, commands deliberately NOT run, and why — then a machine-readable handoff line, so
// a player-facing task can be reported ready with an auditable stop condition instead of a self-assessment.
//
// Exit codes: 0 pass · 1 a required command failed · 2 bad usage (unknown/missing scope, no mapping).

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "godot", "gates", "change-impact.json");

function fail(code, msg) {
  console.error(`[gate:changed] ${msg}`);
  process.exit(code);
}

// --- args ---
const argv = process.argv.slice(2);
const scopeIdx = argv.indexOf("--scope");
const scope = scopeIdx >= 0 ? argv[scopeIdx + 1] : undefined;
const planOnly = argv.includes("--plan"); // preview the selected contract without running it
if (!scope) {
  fail(2, "usage: npm run gate:changed -- --scope <scope>  (scopes: see godot/gates/change-impact.json)");
}

// --- manifest ---
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  fail(2, `could not read ${manifestPath}: ${e.message}`);
}
const spec = manifest.scopes[scope];
if (!spec) {
  fail(2, `unknown scope "${scope}". Known scopes: ${Object.keys(manifest.scopes).join(", ")}`);
}

// --- changed files (staged + unstaged + untracked), used only to decide escalation ---
function changedFiles() {
  try {
    const out = execSync("git status --porcelain --untracked-files=all", { cwd: root, encoding: "utf8" });
    return out
      .split("\n")
      .map((l) => l.slice(3).trim())
      .filter(Boolean)
      .map((p) => (p.includes(" -> ") ? p.split(" -> ")[1] : p)); // renames
  } catch {
    return [];
  }
}
const changed = changedFiles();

// --- decide escalation to the full normal route ---
const highRisk = (manifest.highRiskFiles || []).filter((f) => changed.includes(f));
const scopeTriggers = (spec.escalateOn || []).filter((f) => changed.includes(f));
const alwaysFull = spec.alwaysFullRoute === true;
const escalate = alwaysFull || highRisk.length > 0 || scopeTriggers.length > 0;
const escalateReason = alwaysFull
  ? "scope is alwaysFullRoute"
  : highRisk.length
    ? `high-risk file(s) changed: ${highRisk.join(", ")}`
    : scopeTriggers.length
      ? `scope trigger file(s) changed: ${scopeTriggers.join(", ")}`
      : "no full-route trigger in the diff";

// --- expand a check spec into a shell command ---
function toCommand(check) {
  if (check.godot) return `godot --headless --path godot/ --script res://tests/${check.godot}.gd`;
  if (check.npm) return `npm run ${check.npm}`;
  if (check.sh) return check.sh;
  fail(2, `manifest check has no godot|npm|sh key: ${JSON.stringify(check)}`);
}

const levels = [
  ["fast", spec.fast || []],
  ["affected", spec.affected || []],
  ["native", spec.native || []],
];
const planned = [];
for (const [level, checks] of levels) {
  for (const c of checks) planned.push({ level, command: toCommand(c) });
}
const fullRouteCommand = toCommand(manifest.fullRoute);
if (escalate) planned.push({ level: "full-route", command: fullRouteCommand });

// A scope that proves nothing (docs) is legal; every other scope must run at least one check.
if (scope !== "docs" && planned.length === 0) {
  fail(2, `scope "${scope}" declares no checks — a player-facing scope must map to at least one`);
}

// --- print the selected contract ---
console.log(`\n[gate:changed] scope: ${scope}`);
console.log(`[gate:changed] contract: ${spec.contract}`);
console.log(`[gate:changed] changed files: ${changed.length}`);
console.log(`[gate:changed] full route: ${escalate ? "SELECTED" : "not selected"} — ${escalateReason}`);
if (planned.length === 0) {
  console.log("[gate:changed] no checks for this scope (diff-only).");
} else {
  console.log("[gate:changed] commands to run:");
  for (const p of planned) console.log(`    • [${p.level}] ${p.command}`);
}
if (!escalate) {
  console.log(`[gate:changed] deliberately NOT run: [full-route] ${fullRouteCommand} (no trigger in the diff)`);
}
console.log("");

// --- plan-only: print the handoff and stop, so escalation/selection can be previewed cheaply ---
if (planOnly) {
  const plan = {
    gate: "changed",
    scope,
    contract: spec.contract,
    commands: planned.map((p) => ({ level: p.level, command: p.command })),
    notRun: escalate ? [] : [{ level: "full-route", command: fullRouteCommand }],
    fullRouteSelected: escalate,
    reason: escalateReason,
    result: "planned",
  };
  console.log(`[gate:changed] handoff: ${JSON.stringify(plan)}`);
  console.log(`[gate:changed] PLAN — scope "${scope}" would run ${planned.length} command(s)${escalate ? " (full route included)" : ""}.`);
  process.exit(0);
}

// --- run them ---
const results = [];
let failedAt = null;
for (const p of planned) {
  console.log(`\n[gate:changed] ▶ ${p.command}`);
  try {
    execSync(p.command, { cwd: root, stdio: "inherit" });
    results.push({ ...p, result: "pass" });
  } catch {
    results.push({ ...p, result: "fail" });
    failedAt = p;
    break;
  }
}

// --- machine-readable handoff ---
const handoff = {
  gate: "changed",
  scope,
  contract: spec.contract,
  commands: results.map((r) => ({ level: r.level, command: r.command, result: r.result })),
  notRun: escalate ? [] : [{ level: "full-route", command: fullRouteCommand }],
  fullRouteSelected: escalate,
  reason: escalateReason,
  result: failedAt ? "fail" : "pass",
};
console.log(`\n[gate:changed] handoff: ${JSON.stringify(handoff)}`);

if (failedAt) {
  fail(1, `FAIL at [${failedAt.level}] ${failedAt.command}`);
}
console.log(`[gate:changed] PASS — scope "${scope}" cleared${escalate ? " (full route included)" : ""}.`);
