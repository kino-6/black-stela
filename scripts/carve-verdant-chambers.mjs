#!/usr/bin/env node
// ⚠️ RETIRED (Phase B, 玄室 redesign). genVerdantFloors.mjs now carves each 玄室 as an ENCLOSED 2×2 room with
// ONE door itself (carveEnclosedChamber). This old pass OPENED walls to widen chambers into halls — running it
// now would BREACH the enclosure. Kept for history only; it no-ops immediately.
if (process.env.RUN_RETIRED_CARVE !== "1") {
  console.log("[carve-chambers] RETIRED — enclosure now lives in genVerdantFloors.mjs. Skipped.");
  process.exit(0);
}

// #19 玄室 — the Verdant floors are already open fields, so open halls exist; the real gap is that the
// rooms NAMED as chambers (翠の間 / 奥の木立) mostly sit on a single 1-wide corridor cell, so walking into
// "翠の間" lands you in a corridor (the player's "玄室未実装？"). This SEATS every fight room in an open
// hall: for each chamber-type room not already in a 2×2 walkable block, it opens the fewest interior walls
// needed to form one around it. Opening walls only ADDS passages, so a reachable floor stays reachable and
// no labelled cell is ever clobbered — safe by construction. It is surgical (a handful of walls per floor),
// not a flatten: corridors between the halls stay corridors. Verdant is deliberately outside the default-
// world maze gate (dungeonDesign.test.ts pins B1F to a winding sweep). Re-runnable; idempotent.
//
// Run: node scripts/carve-verdant-chambers.mjs   (then npm run export:packs to refresh the Godot pack)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "content", "worlds", "verdant", "dungeons");

let carvedTotal = 0;
const summary = [];

for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
  const path = join(dir, file);
  const text = readFileSync(path, "utf8");

  // 1. Frontmatter → which symbols are fight rooms (a 玄室 is a HALL where something happens). Treasure-only
  //    dead-ends (the 胞子の窪み nooks) are left as narrow niches so the reward dead-ends survive.
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;
  const fm = yaml.load(fmMatch[1]);
  const symbols = fm.symbols ?? {};
  const roomById = new Map((fm.rooms ?? []).map((r) => [r.id, r]));
  const isChamber = (room) => room && (room.encounterTable || room.encounter);
  const chamberSyms = new Set(
    Object.entries(symbols)
      .filter(([, roomId]) => isChamber(roomById.get(roomId)))
      .map(([sym]) => sym)
  );
  if (chamberSyms.size === 0) {
    summary.push(`${file}: no fight rooms — skipped`);
    continue;
  }

  // 2. Pull the raw `map: |` block so only those lines are edited.
  const lines = text.split("\n");
  const mapKey = lines.findIndex((l) => /^map:\s*\|/.test(l));
  if (mapKey < 0) continue;
  let end = mapKey + 1;
  while (end < lines.length && /^ {2}\S/.test(lines[end])) end += 1;
  const gridLines = lines.slice(mapKey + 1, end).map((l) => l.slice(2));
  const grid = gridLines.map((row) => row.split(""));
  const H = grid.length;
  const W = Math.max(...grid.map((r) => r.length));

  const walkable = (x, y) => y >= 0 && y < H && x >= 0 && x < grid[y].length && grid[y][x] !== "#" && grid[y][x] !== " ";
  const interiorWall = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && grid[y] && grid[y][x] === "#";
  // The four 2×2 squares that include (ax,ay) as a corner.
  const quadrants = (ax, ay) => [
    [[ax - 1, ay - 1], [ax, ay - 1], [ax - 1, ay]],
    [[ax, ay - 1], [ax + 1, ay - 1], [ax + 1, ay]],
    [[ax - 1, ay], [ax - 1, ay + 1], [ax, ay + 1]],
    [[ax + 1, ay], [ax, ay + 1], [ax + 1, ay + 1]],
  ];
  const inHall = (ax, ay) =>
    quadrants(ax, ay).some((q) => q.every(([x, y]) => walkable(x, y)));

  // 3. Seat each fight room in a 2×2 hall by opening the cheapest quadrant (fewest interior walls to open).
  let carved = 0;
  const seated = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!chamberSyms.has(grid[y][x])) continue;
      if (inHall(x, y)) {
        seated.push("kept");
        continue;
      }
      // Only quadrants whose non-anchor cells are all already-walkable OR openable interior walls qualify.
      const candidates = quadrants(x, y)
        .map((q) => q.filter(([cx, cy]) => !walkable(cx, cy)))
        .filter((walls) => walls.every(([cx, cy]) => interiorWall(cx, cy)));
      if (candidates.length === 0) {
        seated.push("blocked"); // hemmed in by the border on every side — leave it (never breach the frame)
        continue;
      }
      candidates.sort((a, b) => a.length - b.length);
      for (const [cx, cy] of candidates[0]) {
        grid[cy][cx] = ".";
        carved += 1;
      }
      seated.push("carved");
    }
  }

  for (let i = 0; i < gridLines.length; i++) lines[mapKey + 1 + i] = "  " + grid[i].join("");
  writeFileSync(path, lines.join("\n"));
  carvedTotal += carved;
  const carvedN = seated.filter((s) => s === "carved").length;
  summary.push(`${file}: ${chamberSyms.size} fight room(s) — ${carvedN} newly seated, opened ${carved} wall(s)`);
}

for (const s of summary) console.log("  " + s);
console.log(`[carve-chambers] seated Verdant fight rooms in halls; opened ${carvedTotal} wall cell(s)`);
