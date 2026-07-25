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

// Shared UI font (not per-world): the Web export has no OS font fallback, so Japanese needs an EMBEDDED
// font (IMP-047 Web / #30). Source lives at assets/fonts/ui.ttf (tracked); staged into the generated
// godot/assets so boot.gd:_install_ui_font can load res://assets/fonts/ui.ttf.
const fontSrc = join(here, "..", "assets", "fonts", "ui.ttf");
const fontDest = join(here, "..", "godot", "assets", "fonts", "ui.ttf");
if (existsSync(fontSrc)) {
  mkdirSync(dirname(fontDest), { recursive: true });
  cpSync(fontSrc, fontDest);
  console.log("staged UI font → godot/assets/fonts/ui.ttf");
} else {
  console.warn("no assets/fonts/ui.ttf — the Web export will render Japanese as tofu (see assets/fonts/README.md)");
}
