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
  // node scripts/placeFloor.mjs <seed> --glyph '{"1,1":"E",...}' ['{"12,1":"V",...}']
  // 1st obj: glyphs on existing floor cells. 2nd obj (optional): CARVE glyphs onto
  // wall cells (appendage cells connected only by scripted edges). Normalizes all
  // other markers (s S O $ X) to '.'. Reports carved cells' auto-open neighbors so
  // isolation (or intended adjacency) is visible before authoring edges.
  const assign = JSON.parse(process.argv[4]);
  const carve = process.argv[5] ? JSON.parse(process.argv[5]) : {};
  const g = grid.map((row) => row.map((ch) => (ch === "#" ? "#" : ".")));
  for (const [key, glyph] of Object.entries(assign)) {
    const [r, c] = key.split(",").map(Number);
    if (g[r]?.[c] !== ".") throw new Error(`(${r},${c}) is not a floor cell (='${g[r]?.[c]}')`);
    g[r][c] = glyph;
  }
  const carved = new Set(Object.keys(carve));
  for (const [key, glyph] of Object.entries(carve)) {
    const [r, c] = key.split(",").map(Number);
    if (g[r]?.[c] !== "#") throw new Error(`carve (${r},${c}) is not a wall (='${g[r]?.[c]}')`);
    g[r][c] = glyph;
  }
  console.log(g.map((row) => "  " + row.join("")).join("\n"));
  const gwalk = (r, c) => r >= 0 && r < H && c >= 0 && c < W && g[r]?.[c] !== "#";
  for (const key of carved) {
    const [r, c] = key.split(",").map(Number);
    const auto = [[r - 1, c, "north"], [r + 1, c, "south"], [r, c - 1, "west"], [r, c + 1, "east"]]
      .filter(([nr, nc]) => gwalk(nr, nc))
      .map(([nr, nc, d]) => `${d}=(${nr},${nc})='${g[nr][nc]}'`);
    console.log(`carved ${g[r][c]} (${r},${c}) auto-open:`, auto.length ? auto.join(" ") : "NONE (isolated)");
  }
  process.exit(0);
}
if (arg === "--appendage") {
  // Find isolated 2-cell linear vault appendages: a floor dead-end D (fork),
  // a wall cell V adjacent to D (002, door), and a wall cell R adjacent to V
  // (003, locked) such that V and R touch NO floor cell other than the chain.
  const DIRS = [[-1, 0, "north"], [1, 0, "south"], [0, -1, "west"], [0, 1, "east"]];
  const isWall = (r, c) => !(r >= 0 && r < H && c >= 0 && c < W) || grid[r][c] === "#";
  const isFloor = (r, c) => r >= 0 && r < H && c >= 0 && c < W && grid[r][c] !== "#";
  const deadEnds = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++)
    if (isFloor(r, c) && DIRS.filter(([dr, dc]) => isFloor(r + dr, c + dc)).length === 1) deadEnds.push([r, c]);
  for (const [dr0, dc0] of deadEnds) {
    for (const [vdr, vdc, vdir] of DIRS) {
      const vr = dr0 + vdr, vc = dc0 + vdc;
      if (!isWall(vr, vc) || vr <= 0 || vr >= H - 1 || vc <= 0 || vc >= W - 1) continue;
      // V's floor neighbors must be ONLY D
      const vFloorNbrs = DIRS.filter(([a, b]) => isFloor(vr + a, vc + b));
      if (vFloorNbrs.length !== 1) continue;
      for (const [rdr, rdc, rdir] of DIRS) {
        const rr = vr + rdr, rc = vc + rdc;
        if ((rr === dr0 && rc === dc0) || !isWall(rr, rc) || rr <= 0 || rr >= H - 1 || rc <= 0 || rc >= W - 1) continue;
        // R's floor neighbors must be NONE (isolated tip)
        if (DIRS.some(([a, b]) => isFloor(rr + a, rc + b))) continue;
        console.log(`fork D=(${dr0},${dc0}) --${vdir}--> V=(${vr},${vc}) --${rdir}--> R=(${rr},${rc})  [open side of D leads to gallery]`);
      }
    }
  }
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
