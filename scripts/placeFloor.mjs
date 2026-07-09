// Placement helper: parse a maze ASCII (from genFloorMaze) and reason about it.
//   node scripts/placeFloor.mjs <seed>            -> print grid with row/col guides + dead-ends
//   node scripts/placeFloor.mjs <seed> r c        -> print a cell's walkable neighbors
//   node scripts/placeFloor.mjs <seed> --sole r c -> verify (r,c) is the sole walkable approach to its only-other-neighbor
// Regenerates the same maze the generator prints, then analyzes it as ground truth.
import { execSync } from "node:child_process";

const seed = process.argv[2];
const out = execSync(`node scripts/genFloorMaze.mjs ${seed}`, { encoding: "utf8" });
const lines = out.split("\n");
const gridLines = lines.filter((l) => /^[#.EXsSO$]+$/.test(l) && l.length > 5);
const grid = gridLines.map((l) => l.split(""));
const H = grid.length;
const W = grid[0].length;
const walk = (r, c) => r >= 0 && r < H && c >= 0 && c < W && grid[r][c] !== "#";
const nbrs = (r, c) =>
  [[r - 1, c, "north"], [r + 1, c, "south"], [r, c - 1, "west"], [r, c + 1, "east"]]
    .filter(([nr, nc]) => walk(nr, nc));

const arg = process.argv[3];
if (arg === "--glyph") {
  // node scripts/placeFloor.mjs <seed> --glyph '{"1,1":"E","5,5":"A",...}'
  // Substitutes glyphs at coords; normalizes all other markers (s S O $ X) to '.'.
  const assign = JSON.parse(process.argv[4]);
  const g = grid.map((row) => row.map((ch) => (ch === "#" ? "#" : ".")));
  for (const [key, glyph] of Object.entries(assign)) {
    const [r, c] = key.split(",").map(Number);
    if (g[r]?.[c] !== ".") throw new Error(`(${r},${c}) is not a floor cell (='${g[r]?.[c]}')`);
    g[r][c] = glyph;
  }
  console.log(g.map((row) => "  " + row.join("")).join("\n"));
  process.exit(0);
}
if (!arg) {
  // print grid with column ruler and dead-ends
  const ruler = "   " + Array.from({ length: W }, (_, c) => (c % 10)).join("");
  console.log(ruler);
  grid.forEach((row, r) => console.log(String(r).padStart(2) + " " + row.join("")));
  const deadEnds = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (walk(r, c) && nbrs(r, c).length === 1) deadEnds.push([r, c]);
  console.log("dead-ends (deg1):", JSON.stringify(deadEnds));
} else if (arg === "--sole") {
  const r = Number(process.argv[4]), c = Number(process.argv[5]);
  const n = nbrs(r, c);
  console.log(`(${r},${c}) neighbors:`, n.map(([nr, nc, d]) => `${d}=(${nr},${nc})`).join(" "));
  // for each neighbor, is (r,c) that neighbor's only walkable neighbor?
  for (const [nr, nc, d] of n) {
    const nn = nbrs(nr, nc);
    const sole = nn.length === 1 && nn[0][0] === r && nn[0][1] === c;
    console.log(`  ${d} (${nr},${nc}) is ${sole ? "SEALED behind (" + r + "," + c + ") [sole approach]" : "reachable via " + nn.length + " ways"}`);
  }
} else {
  const r = Number(arg), c = Number(process.argv[4]);
  console.log(`(${r},${c})='${grid[r][c]}' neighbors:`, nbrs(r, c).map(([nr, nc, d]) => `${d}=(${nr},${nc})='${grid[nr][nc]}'`).join(" "));
}
