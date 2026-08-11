#!/usr/bin/env node
// The pre-push gate. Runs the FAST, high-signal half of CI locally so a red build/unit never reaches the
// remote (user rule 2026-08-12: "CI失敗しても気にしないのはNG. push時にLocalで検証するGateを"). It is
// deliberately NOT the whole of CI — e2e + the Godot parity gates take minutes and belong in CI. This runs
// the two checks that catch the vast majority of reds — the TypeScript typecheck and the unit suite — and
// runs them IN PARALLEL so the wall-clock is max(tsc, vitest), not the sum (user: "並列化や必要部分だけ").
//
// Escape hatches: `git push --no-verify` skips the hook entirely; `GATE_FULL=1 git push` escalates to the
// full `npm run gate:ci` (build + unit + gate:godot) when you want the whole thing before a release push.
//
// Exit 0 = all green (push proceeds). Exit 1 = a check failed (push blocked, offending output printed).

import { spawn } from "node:child_process";

const CHECKS = process.env.GATE_FULL === "1"
  ? [{ name: "gate:ci", cmd: "npm", args: ["run", "gate:ci"] }]
  : [
      { name: "typecheck (tsc -b)", cmd: "npm", args: ["run", "typecheck"] },
      { name: "unit (vitest)", cmd: "npm", args: ["run", "test"] },
    ];

function run(check) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(check.cmd, check.args, { encoding: "utf8" });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => {
      resolve({ ...check, code: code ?? 1, out, ms: Date.now() - started });
    });
  });
}

const label = process.env.GATE_FULL === "1" ? "GATE_FULL — full gate:ci" : "typecheck + unit, in parallel";
console.log(`[gate:prepush] ${label}\n`);

const results = await Promise.all(CHECKS.map(run));
let failed = false;
for (const r of results) {
  const secs = (r.ms / 1000).toFixed(1);
  if (r.code === 0) {
    console.log(`  ✓ ${r.name}  (${secs}s)`);
  } else {
    failed = true;
    console.log(`  ✗ ${r.name}  (${secs}s) — FAILED\n`);
    console.log(r.out.trimEnd() + "\n");
  }
}

if (failed) {
  console.error(
    "\n[gate:prepush] BLOCKED — fix the failure above, or bypass once with `git push --no-verify` if you\n" +
      "               are deliberately pushing WIP. Do not ignore a red push (user rule 2026-08-12).",
  );
  process.exit(1);
}
console.log("\n[gate:prepush] green — push proceeds. (e2e + Godot parity still run in CI.)");
process.exit(0);
