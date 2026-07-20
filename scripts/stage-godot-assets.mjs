#!/usr/bin/env node
// Stage the authored art into the Godot project.
//
// This exists because the art was originally copied BY HAND, and `dungeon/` was simply forgotten — so
// the Godot maze rendered untextured flat colour for the whole migration and the packaged build would
// have shipped that way. Staging is now part of `npm run export:godot`, so what the player sees cannot
// drift from what was authored.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(here, "..", "content", "worlds");
const godotRoot = join(here, "..", "godot", "assets", "worlds");

// Per-world art the runtime loads at play time (Image.load_from_file), by subdirectory.
const SUBDIRS = ["dungeon", "ui", "npc", "title", "portraits", "icons", "characters", "minimap"];

let copied = 0;
for (const worldId of readdirSync(contentRoot)) {
  const from = join(contentRoot, worldId, "assets");
  if (!existsSync(from)) continue;
  for (const sub of SUBDIRS) {
    const src = join(from, sub);
    if (!existsSync(src)) continue;
    const dest = join(godotRoot, worldId, sub);
    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });
    copied += readdirSync(src).length;
  }
  console.log(`staged ${worldId}`);
}
console.log(`staged ${copied} art files → godot/assets/worlds/`);
