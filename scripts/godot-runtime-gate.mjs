#!/usr/bin/env node
// Godot runtime-error gate.
//
// Recurring class of defect (playtest 2026-08-03「これ系、毎回指摘している」): the game PARSES and unit
// tests pass, but a real scene emits a runtime SCRIPT ERROR — get_viewport() null in an _input handler after
// a scene change, grab_focus() on a node pulled out of the tree, a null-instance method call. Godot logs
// these to stderr but STILL EXITS 0, so nothing fails. This gate boots the input/scene-heavy controller and
// loop verifiers headlessly and FAILS if any of them printed an error signature — so the class is caught in
// CI instead of by the player, every time.
import { spawnSync } from "node:child_process";

// The scenes worth exercising: every controller a player drives with the keyboard, plus the loop/transition
// verifiers where teardown-timing bugs live. This catches IN-SCENE runtime faults (grab_focus on a freed
// node, a null-instance method call, an invalid key access) that print a SCRIPT ERROR while the verifier
// still exits 0.
//
// LIMITATION: `--script` headless mode does NOT register project autoloads, so any verifier that drives a
// real SceneManager scene TRANSITION (town→dungeon→combat) trips a compile-time "Identifier not found:
// SceneManager" that never happens in the running game. verify_played_loop is exactly that and is therefore
// EXCLUDED here (gate:play runs it for its own assertions). The cross-scene transition crash class is
// instead defended by construction — consume input before dispatching, and _grab_focus_safe guards.
const SCENE_TESTS = [
  "res://tests/verify_dungeon_controller.gd",
  "res://tests/verify_combat_controller.gd",
  "res://tests/verify_town_controller.gd",
  "res://tests/verify_guild_controller.gd",
  "res://tests/verify_character_creation.gd",
  "res://tests/verify_return_loop.gd",
  "res://tests/verify_flow.gd",
  "res://tests/verify_scene_transition.gd"
];

// Signatures that mean a real runtime fault, not a benign warning. Kept narrow so the gate does not flake on
// Godot's ordinary leaked-ObjectDB / driver noise.
const ERROR_SIGNATURES = [
  /SCRIPT ERROR/,
  /Cannot call method '[^']*' on a null value/,
  /Condition "!is_inside_tree\(\)" is true/,
  /Attempt to call function '[^']*' (in base '[^']*' )?on a null instance/,
  /Trying to assign .* to a null/,
  /Invalid access to property or key/
];

const GODOT = process.env.GODOT_BIN || "godot";

let failed = false;
for (const test of SCENE_TESTS) {
  const res = spawnSync(
    GODOT,
    ["--headless", "--path", "godot/", "--script", test],
    { encoding: "utf8", timeout: 180000 }
  );
  if (res.error) {
    console.error(`✗ ${test}: could not launch Godot (${res.error.message})`);
    failed = true;
    continue;
  }
  const out = `${res.stdout || ""}\n${res.stderr || ""}`;
  const hits = [];
  for (const line of out.split("\n")) {
    if (ERROR_SIGNATURES.some((re) => re.test(line))) hits.push(line.trim());
  }
  // A verifier that reports its own "FAIL (N failures)" is a broken assertion, also worth surfacing here.
  if (/\bFAIL\b|\bFAILED\b/.test(out)) hits.push("verifier reported an assertion failure");
  if (hits.length > 0) {
    console.error(`✗ ${test}`);
    for (const h of [...new Set(hits)]) console.error(`     ${h}`);
    failed = true;
  } else {
    console.log(`✓ ${test}`);
  }
}

if (failed) {
  console.error("\nGodot runtime gate FAILED — a scene emitted a runtime error. Fix the SCRIPT ERROR above.");
  process.exit(1);
}
console.log("\nGodot runtime gate passed — no scene emitted a runtime error.");
