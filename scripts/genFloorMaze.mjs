// Floor maze generator for Black Stela.
//
// Pipeline (per the design decision): 棒倒し法 (rod-falling) builds a PERFECT maze
// as the BASE skeleton — a long, winding single-solution labyrinth whose full
// sweep (visit every cell, backtracking each dead-end) runs ~300 steps in a 20×20
// frame. Then POST-PROCESS carves chambers (玄室), which knocks out a few walls and
// so also braids in the handful of loops the non-linearity Gate wants.
//
// This is a design TOOL, not runtime: it prints a reviewable ASCII map + metrics.
// A chosen seed's output is then hand-authored into content/.../dungeons/*.md.
//
//   node scripts/genFloorMaze.mjs [seed] [cellsPerSide]
//
// Deterministic: same (seed, cellsPerSide) → same maze.

const seed0 = Number(process.argv[2] ?? 20250709);
const CELLS = Number(process.argv[3] ?? 9); // 9 → 19×19 grid, fits a 20×20 frame

function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- 棒倒し法: build a perfect maze (true = wall) ---
function genPerfect(cells, seed) {
  const S = 2 * cells + 1;
  const w = Array.from({ length: S }, () => Array(S).fill(false));
  const rng = mulberry(seed);
  for (let i = 0; i < S; i++) { w[0][i] = w[S - 1][i] = w[i][0] = w[i][S - 1] = true; }
  for (let py = 2; py <= S - 3; py += 2) {
    for (let px = 2; px <= S - 3; px += 2) {
      w[py][px] = true; // pillar
      // top interior row may fall in any direction; the rest never fall up — the
      // invariant that keeps the result a perfect (loop-free) maze.
      const dirs = py === 2 ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[1, 0], [0, -1], [0, 1]];
      for (let t = 0; t < 24; t++) {
        const [dy, dx] = dirs[Math.floor(rng() * dirs.length)];
        if (!w[py + dy][px + dx]) { w[py + dy][px + dx] = true; break; }
      }
    }
  }
  return w;
}

const nbrs = (y, x) => [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]];
const inb = (w, y, x) => y >= 0 && x >= 0 && y < w.length && x < w.length;
function openCells(w) {
  const o = [];
  for (let y = 0; y < w.length; y++) for (let x = 0; x < w.length; x++) if (!w[y][x]) o.push([y, x]);
  return o;
}
function bfs(w, sy, sx) {
  const dist = new Map([[`${sy},${sx}`, 0]]);
  let q = [[sy, sx]];
  while (q.length) {
    const nq = [];
    for (const [y, x] of q) {
      const d = dist.get(`${y},${x}`);
      for (const [ny, nx] of nbrs(y, x)) {
        const k = `${ny},${nx}`;
        if (!inb(w, ny, nx) || w[ny][nx] || dist.has(k)) continue;
        dist.set(k, d + 1); nq.push([ny, nx]);
      }
    }
    q = nq;
  }
  return dist;
}
function farthest(w, sy, sx) {
  const d = bfs(w, sy, sx);
  let best = [sy, sx], bd = -1;
  for (const [y, x] of openCells(w)) { const v = d.get(`${y},${x}`) ?? -1; if (v > bd) { bd = v; best = [y, x]; } }
  return { cell: best, dist: bd };
}
function fullSweep(w, sy, sx) {
  const total = openCells(w).length;
  const seen = new Set([`${sy},${sx}`]); const stack = [[sy, sx]]; let steps = 0;
  while (seen.size < total && stack.length) {
    const [y, x] = stack[stack.length - 1]; let moved = false;
    for (const [ny, nx] of nbrs(y, x)) {
      const k = `${ny},${nx}`;
      if (!inb(w, ny, nx) || w[ny][nx] || seen.has(k)) continue;
      seen.add(k); stack.push([ny, nx]); steps++; moved = true; break;
    }
    if (!moved) { stack.pop(); steps++; }
  }
  return steps;
}
const degree = (w, y, x) => nbrs(y, x).filter(([ny, nx]) => inb(w, ny, nx) && !w[ny][nx]).length;
function loopCount(w) {
  // cyclomatic: E - N + C (C=1, connected). Perfect maze → 0. Each carved loop → +1.
  const cells = openCells(w); const N = cells.length; let E = 0;
  for (const [y, x] of cells) { if (inb(w, y + 1, x) && !w[y + 1][x]) E++; if (inb(w, y, x + 1) && !w[y][x + 1]) E++; }
  return E - N + 1;
}

// --- post-process: carve a chamber around an odd,odd center. "plus" opens the 4
// orthogonal walls (a 5-cell room, +1-2 loops); "block" opens the full 3×3 (a
// proper 玄室, more loops). A few of these braid in the loops the Gate wants
// without dissolving the maze into open field. ---
function carveChamber(w, cy, cx, shape = "plus") {
  const cellsToOpen = shape === "block"
    ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]]
    : [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dy, dx] of cellsToOpen) {
    const y = cy + dy, x = cx + dx;
    if (y > 0 && x > 0 && y < w.length - 1 && x < w.length - 1) w[y][x] = false;
  }
}

// ---------------- build B1F ----------------
const w = genPerfect(CELLS, seed0);
const S = w.length;
const entrance = [1, 1];
const exit = farthest(w, entrance[0], entrance[1]).cell; // diameter far cell = down-stair

// Carve a few chambers (玄室): one central 3×3 hub + three smaller plus-rooms.
// Enough to braid in loops and host content (traps, encounters, treasure) without
// dissolving the winding maze into an open field.
const chambers = [
  { at: [9, 9], shape: "block" }, // central hub
  { at: [5, 5], shape: "plus" },
  { at: [5, 13], shape: "plus" },
  { at: [13, 9], shape: "plus" },
].filter(({ at: [y, x] }) => y > 1 && x > 1 && y < S - 2 && x < S - 2);
const chamberCenters = chambers.map((c) => c.at);
for (const { at: [cy, cx], shape } of chambers) carveChamber(w, cy, cx, shape);

// Metrics after carving
const cells = openCells(w);
const sweep = fullSweep(w, entrance[0], entrance[1]);
const loops = loopCount(w);
const deadEnds = cells.filter(([y, x]) => degree(w, y, x) === 1 && !(y === entrance[0] && x === entrance[1]));
// shortcut: secret door from a cell 2 from entrance → warp to a cell ~7 before exit
const dEnt = bfs(w, entrance[0], entrance[1]);
const dExit = bfs(w, exit[0], exit[1]);
const shortcutFrom = cells.find(([y, x]) => (dEnt.get(`${y},${x}`) ?? 99) === 2);
const shortcutTo = cells.find(([y, x]) => { const d = dExit.get(`${y},${x}`) ?? 99; return d >= 6 && d <= 8; });
const shortcutSteps = 2 + 1 + (dExit.get(`${shortcutTo[0]},${shortcutTo[1]}`) ?? 7);

// ---------------- render ----------------
const glyph = Array.from({ length: S }, (_, y) => Array.from({ length: S }, (_, x) => (w[y][x] ? "#" : ".")));
glyph[entrance[0]][entrance[1]] = "E";
glyph[exit[0]][exit[1]] = "X";
for (const [cy, cx] of chamberCenters) glyph[cy][cx] = "O";
if (shortcutFrom) glyph[shortcutFrom[0]][shortcutFrom[1]] = "s";
if (shortcutTo) glyph[shortcutTo[0]][shortcutTo[1]] = "S";
// mark a few reward dead-ends (farthest ones)
const rankedDeads = deadEnds
  .map(([y, x]) => ({ y, x, d: dEnt.get(`${y},${x}`) ?? 0 }))
  .sort((a, b) => b.d - a.d)
  .slice(0, 5);
for (const { y, x } of rankedDeads) if (glyph[y][x] === ".") glyph[y][x] = "$";

console.log(`seed=${seed0} grid=${S}x${S}`);
console.log(glyph.map((r) => r.join("")).join("\n"));
console.log("");
console.log(`cells (walkable) : ${cells.length}`);
console.log(`full-sweep steps : ${sweep}   (target 300-350)`);
console.log(`shortcut steps   : ${shortcutSteps}   (target ~10)`);
console.log(`loops (cyclomatic): ${loops}   (Gate wants >=4)`);
console.log(`dead-ends        : ${deadEnds.length}  (reward niches available)`);
console.log(`entrance E=${entrance}  exit X=${exit}`);
console.log(`chambers O=${JSON.stringify(chamberCenters)}`);
console.log(`shortcut s${JSON.stringify(shortcutFrom)} -> S${JSON.stringify(shortcutTo)}`);

// ---- authoring aids: reward dead-end coords + directional paths (for e2e) ----
function pathDirs(w, [sy, sx], [ty, tx]) {
  const prev = new Map(); const seen = new Set([`${sy},${sx}`]); let q = [[sy, sx]];
  while (q.length) {
    const nq = [];
    for (const [y, x] of q) {
      if (y === ty && x === tx) { q = []; break; }
      for (const [ny, nx] of nbrs(y, x)) {
        const k = `${ny},${nx}`;
        if (!inb(w, ny, nx) || w[ny][nx] || seen.has(k)) continue;
        seen.add(k); prev.set(k, [y, x]); nq.push([ny, nx]);
      }
    }
    q = nq;
  }
  const dirName = (dy, dx) => (dy === -1 ? "north" : dy === 1 ? "south" : dx === -1 ? "west" : "east");
  const rev = []; let cur = `${ty},${tx}`;
  while (cur !== `${sy},${sx}`) {
    const [py, px] = prev.get(cur); const [cy, cx] = cur.split(",").map(Number);
    rev.push(dirName(cy - py, cx - px)); cur = `${py},${px}`;
  }
  return rev.reverse();
}
const warden = [13, 9];
console.log("");
console.log("reward dead-ends (deg1, top6 by dist):", JSON.stringify(rankedDeads.slice(0, 6).map((d) => [d.y, d.x])));
console.log("path E->X:", pathDirs(w, entrance, exit).join(","));
console.log("path E->warden:", pathDirs(w, entrance, warden).join(","));
console.log("path X->warden:", pathDirs(w, exit, warden).join(","));
const eastRoom = [5, 13];
console.log("path E->east:", pathDirs(w, entrance, eastRoom).join(","));
console.log("path east->warden:", pathDirs(w, eastRoom, warden).join(","));
