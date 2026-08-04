// Default (黒碑) floor skeleton generator. Emits content/worlds/default/dungeons/b2f..b10f.md
// as navigable dense mazes with connected up/down stairs, enclosed door-choke 玄室, and an on-floor
// hidden-door shortcut. Forked from genVerdantFloors.mjs (the only generator that outputs door-choke
// chambers). Room CONTENT (encounters, treasure) is referenced by existing default table id. Rerun:
//   node scripts/genDefaultFloors.mjs
import { writeFileSync } from "node:fs";

const CELLS = 9; // 19x19 frame

function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function genPerfect(cells, seed) {
  const S = 2 * cells + 1;
  const w = Array.from({ length: S }, () => Array(S).fill(false));
  const rng = mulberry(seed);
  for (let i = 0; i < S; i++) { w[0][i] = w[S - 1][i] = w[i][0] = w[i][S - 1] = true; }
  for (let py = 2; py <= S - 3; py += 2) {
    for (let px = 2; px <= S - 3; px += 2) {
      w[py][px] = true;
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
  return best;
}
const degree = (w, y, x) => nbrs(y, x).filter(([ny, nx]) => inb(w, ny, nx) && !w[ny][nx]).length;
function carveChamber(w, cy, cx, shape) {
  const cellsToOpen = shape === "block"
    ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]]
    : [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dy, dx] of cellsToOpen) {
    const y = cy + dy, x = cx + dx;
    if (y > 0 && x > 0 && y < w.length - 1 && x < w.length - 1) w[y][x] = false;
  }
}
// Direction from a cell toward a wall (so a stair/shortcut edge sits on a closed side).
function wallDir(w, [y, x]) {
  const order = [["west", 0, -1], ["north", -1, 0], ["east", 0, 1], ["south", 1, 0]];
  for (const [name, dy, dx] of order) if (inb(w, y + dy, x + dx) && w[y + dy][x + dx]) return name;
  return "west";
}
// Compass direction from cell `a` to an orthogonally-adjacent cell `b`.
function dirBetween([ay, ax], [by, bx]) {
  if (by === ay - 1) return "north";
  if (by === ay + 1) return "south";
  if (bx === ax - 1) return "west";
  return "east";
}
// A HIDDEN-DOOR shortcut (no warp): find a single maze wall W whose two opposite neighbours A/B are open
// corridors, and whose perpendicular sides stay walled — so opening W bridges ONLY A↔B and adds no stray
// loop that would flatten the honest sweep. Opening W and hiding the A↔W edge behind a `secret` override
// makes a physical hidden passage: search at A, step through W onto the far corridor B. We pick the wall
// whose two sides are FARTHEST apart in the maze (max dMaze(A,B)) — that door short-circuits the longest way
// round, the physical analogue of the old warp. A = search side (nearer the entrance), W = the passage cell.
function secretShortcut(w, dEnt) {
  const g = (m, [y, x]) => m.get(`${y},${x}`);
  let best = null;
  for (let y = 2; y < w.length - 2; y++) {
    for (let x = 2; x < w.length - 2; x++) {
      if (!w[y][x]) continue; // must be a wall to open
      const vert = !w[y - 1][x] && !w[y + 1][x] && w[y][x - 1] && w[y][x + 1];
      const horz = !w[y][x - 1] && !w[y][x + 1] && w[y - 1][x] && w[y + 1][x];
      if (!vert && !horz) continue;
      const [p, q] = vert ? [[y - 1, x], [y + 1, x]] : [[y, x - 1], [y, x + 1]];
      if (g(dEnt, p) == null || g(dEnt, q) == null) continue;
      const loop = bfs(w, p[0], p[1]).get(`${q[0]},${q[1]}`) ?? -1; // way round with the wall still closed
      if (loop < 0) continue;
      // A = whichever side you reach first while exploring (smaller dEnt), so the door is found on the way in.
      const [A, B] = g(dEnt, p) <= g(dEnt, q) ? [p, q] : [q, p];
      if (!best || loop > best.loop) best = { W: [y, x], A, B, loop };
    }
  }
  return best;
}

// Every open cell reachable from the entrance? (the connectivity guard for enclosing rooms.)
function fullyConnected(w, entrance) {
  const d = bfs(w, entrance[0], entrance[1]);
  for (const [y, x] of openCells(w)) if (!d.has(`${y},${x}`)) return false;
  return true;
}

// BRAID the perfect maze: open a few walls that each join two already-open corridors, so the floor has real
// LOOPS (alternate routes). A perfect maze is a tree with zero loops; enclosing 玄室 into dead-end pockets
// removes the loops the old open chambers gave, so we add them back here instead. Deterministic per seed.
function braid(w, rng, count) {
  const S = w.length;
  let opened = 0;
  for (let tries = 0; tries < 4000 && opened < count; tries++) {
    const y = 2 + Math.floor(rng() * (S - 4));
    const x = 2 + Math.floor(rng() * (S - 4));
    if (!w[y][x]) continue; // already a corridor
    const openNbrs = nbrs(y, x).filter(([ny, nx]) => inb(w, ny, nx) && !w[ny][nx]).length;
    if (openNbrs >= 2) { w[y][x] = false; opened++; } // joining ≥2 corridors makes a loop
  }
}

// Carve an ENCLOSED 2×2 玄室 at anchor [ay,ax]: open a 2×2 block (oriented to fit the frame), then WALL as
// much of its perimeter as the connectivity guard allows (farthest-from-entrance openings first, so the
// natural approach survives). Every opening that CANNOT be walled without stranding a corridor becomes a
// CLOSED DOOR — so the room is entered only through doors, from whichever side, and the gimmick always
// applies. Returns { block, openings } where openings = [[blockY, blockX, dir], ...] to author as `door`
// edges from the block cell (the anchor's named room, or the corridor cell it sits on).
const DIRS4 = [["north", -1, 0], ["south", 1, 0], ["east", 0, 1], ["west", 0, -1]];
function carveEnclosedChamber(w, ay, ax, entrance) {
  const S = w.length;
  const dx = ax + 1 <= S - 2 ? 1 : -1;
  const dy = ay + 1 <= S - 2 ? 1 : -1;
  const block = [[ay, ax], [ay, ax + dx], [ay + dy, ax], [ay + dy, ax + dx]];
  for (const [by, bx] of block) w[by][bx] = false; // open the room
  const blockSet = new Set(block.map((c) => `${c[0]},${c[1]}`));
  // Boundary openings: a block cell with an OPEN outside neighbour (col/row = x/y).
  const boundary = [];
  for (const [by, bx] of block) {
    for (const [dir, ddy, ddx] of DIRS4) {
      const ny = by + ddy, nx = bx + ddx;
      if (!inb(w, ny, nx) || blockSet.has(`${ny},${nx}`)) continue;
      if (!w[ny][nx]) boundary.push([by, bx, dir, ny, nx]);
    }
  }
  const dEnt = bfs(w, entrance[0], entrance[1]);
  const g = (y, x) => dEnt.get(`${y},${x}`) ?? 1e9;
  // Wall the FARTHEST openings first, so the entrance-facing approach is the one most likely left as a door.
  boundary.sort((a, b) => g(b[3], b[4]) - g(a[3], a[4]));
  const openings = [];
  for (const [by, bx, dir, ny, nx] of boundary) {
    if (w[ny][nx]) continue; // already walled via a shared boundary
    w[ny][nx] = true;
    if (!fullyConnected(w, entrance)) {
      w[ny][nx] = false;
      openings.push([by, bx, dir]); // can't wall it → it becomes a door
    }
  }
  return { block, openings };
}

// Per-floor spec: seed + names (en/ja) for entrance, exit(down-stair), the miniboss/boss
// chamber, plain chambers, shortcut, and reward nooks. Enemy/table ids match the roster in
// docs/design/verdant-areas.md and are filled in V2/V3.
// DEFAULT (黒碑) FULL descent generator — T29 rebuilt B2F–B8F to Verdant-equivalent maze quality + enclosed
// 玄室 (door-choke guardian chambers), and T31 added B9 (scenario-boss cap) + B10 (真層 true boss). B1F stays
// hand-authored (its own 棒倒し maze, genFloorMaze.mjs). Every floor here REUSES the existing default
// encounter/treasure tables (no new authoring) — the chambers add real-play density (guaranteed fights +
// treasure) without introducing new enemy types, so the calibrated difficulty curve is preserved. Minibosses
// are kept as KEEP BOSSES (the sole-approach choke room's forced fight): b3 cistern-warden, b5 cinder-keeper,
// b6 oath-warden. Block-caps (rules-level descent bars + return-to-town checkpoints, ~every 3 floors) sit on
// b3/b6/b9; b3/b6 also carry a rest point on their descent room. Rerun: node scripts/genDefaultFloors.mjs
//
// Spec fields: n, seed, level, title[en,ja], block(act tag), chamberCount, packTable/sideTreasure/keepTreasure
// (existing table ids), upTo(up-stair target room, defaults to room.b{n-1}f.exit), blockCap(→block-cap tag),
// restPoint(→rest point on the descent room), boss[en,ja]+bossEnemy/bossHp/bossAtk/bossRole (keep is an inline
// forced fight; role "miniboss" or "boss"), finale(b10 set-piece).
const FLOORS = [
  // ── Act I (block-1) ─────────────────────────────────────────────────────────────────────────────
  { n: 2, seed: 30502, level: 2, title: ["The Branch Cisterns", "枝分かれの貯水"], block: "block-1",
    recLevel: 2, recSize: 3, chamberCount: 8, packTable: "encounters.b2f.branches",
    sideTreasure: "treasure.b2f.cache", keepTreasure: "treasure.b2f.risk", upTo: "room.b1f.012" },
  { n: 3, seed: 30503, level: 3, title: ["The Chain Descent", "鎖の降り"], block: "block-1",
    recLevel: 2, blockCap: true, restPoint: true, chamberCount: 8, packTable: "encounters.b3f.cistern",
    sideTreasure: "treasure.b3f.side", keepTreasure: "treasure.b3f.watermark",
    boss: ["Cistern Warden", "貯水の番人"], bossEnemy: "enemy.b3f.cistern-warden", bossHp: 17, bossAtk: 6, bossRole: "miniboss" },
  // ── Act II (block-2) ────────────────────────────────────────────────────────────────────────────
  { n: 4, seed: 30504, level: 4, title: ["The Dark Gallery", "闇の回廊"], block: "block-2",
    recLevel: 2, chamberCount: 6, packTable: "encounters.b4f.dark", sideTreasure: "treasure.b4f.side",
    keepTreasure: "treasure.b4f.dark" },
  { n: 5, seed: 30505, level: 5, title: ["The Cinder Gate", "燠火の門"], block: "block-2",
    recLevel: 3, chamberCount: 6, packTable: "encounters.b5f.gate", sideTreasure: "treasure.b5f.side",
    keepTreasure: "treasure.b5f.keeper",
    boss: ["Cinder Keeper", "燠火の守り手"], bossEnemy: "enemy.b5f.cinder-keeper", bossHp: 22, bossAtk: 5, bossRole: "miniboss" },
  { n: 6, seed: 30506, level: 6, title: ["The Oathvault", "誓いの蔵"], block: "block-2",
    recLevel: 3, blockCap: true, restPoint: true, chamberCount: 6, packTable: "encounters.b6f.oaths",
    sideTreasure: "treasure.b6f.side", keepTreasure: "treasure.b6f.oaths",
    boss: ["Oath Warden", "誓いの番人"], bossEnemy: "enemy.b6f.oath-warden", bossHp: 26, bossAtk: 8, bossRole: "miniboss" },
  // ── Act III (block-3) ───────────────────────────────────────────────────────────────────────────
  // Act III expects a party AT its floor level (b7), and the true-layer approach expects floor+1 (b8–b10) — so
  // an under-levelled diver faces swelled packs (underpowerFactor) and the finale becomes the climax, instead
  // of a party that out-levels the deepest enemies coasting through them. T29 balance calibration (2026-08-04):
  // this is the per-floor lever that makes act3 bite (a global threat scalar can't — it hits the whole descent);
  // measured curve b7:47 b8:42 b9:32 b10:38 (b9 真層cap = deepest), naive wipes / prepared clears / act3≤act2.
  { n: 7, seed: 30507, level: 7, title: ["The Sealed Vaults", "封じの蔵"], block: "block-3",
    recLevel: 7, chamberCount: 4, packTable: "encounters.b7f.vaults", sideTreasure: "treasure.b7f.side",
    keepTreasure: "treasure.b7f.rare" },
  { n: 8, seed: 30508, level: 8, title: ["The Last Gate", "最後の門"], block: "block-3",
    recLevel: 9, chamberCount: 4, packTable: "encounters.b8f.gate", sideTreasure: "treasure.b8f.side",
    keepTreasure: "treasure.b8f.final" },
  // ── Act III true layer (T31) — B9 scenario-boss cap (bars B10), B10 真層 finale ────────────────────
  { n: 9, seed: 30509, level: 9, title: ["Votary's Sanctum", "奉者の聖域"], block: "block-3",
    recLevel: 10, blockCap: true, chamberCount: 4, packTable: "encounters.b9f.chambers",
    sideTreasure: "treasure.b9f.side", keepTreasure: "treasure.b9f.keep",
    boss: ["Ash Votary", "灰の奉者"], bossEnemy: "enemy.b8f.ash-votary", bossHp: 28, bossAtk: 6, bossRole: "boss" },
  { n: 10, seed: 30510, level: 10, title: ["The Inmost Stela", "黒碑の真層"], block: "block-3",
    recLevel: 11, chamberCount: 4, packTable: "encounters.b10f.chambers", sideTreasure: "treasure.b10f.side",
    keepTreasure: "treasure.b10f.keep",
    boss: ["Heart of the Stela", "黒碑の主"], bossEnemy: "enemy.b10.dark-stela", bossHp: 44, bossAtk: 8, bossRole: "boss", finale: true }
];

const rid = (n, suffix) => `room.b${n}f.${suffix}`;
const did = (n) => `dungeon.b${n}f`;

function buildFloor(spec) {
  const { n } = spec;
  const w = genPerfect(CELLS, spec.seed);
  const S = w.length;
  // 玄室 (Wiz-style guaranteed-fight + treasure rooms). G1–G3 seat EIGHT (7 plain + 1 keep ≥ 6) so the early
  // floors are dense with rooms to clear (playtest); deeper floors keep the leaner four. One becomes the keep.
  const CHAMBER_POOL = [[9, 9], [5, 5], [5, 13], [13, 9], [9, 5], [9, 13], [13, 5], [13, 13]];
  const want = spec.chamberCount ?? (n <= 3 ? 8 : 4);
  const chamberCoords = CHAMBER_POOL.slice(0, Math.max(1, want));
  const chambers = chamberCoords.filter(([y, x]) => y > 1 && x > 1 && y < S - 3 && x < S - 3);
  const entrance = [1, 1];
  // Braid the perfect (tree) maze so it has real loops — enclosing the 玄室 into dead-end pockets removes the
  // loops the old OPEN chamber blocks used to give.
  braid(w, mulberry(spec.seed + 4444), n <= 3 ? 12 : 10);
  // Every 玄室 is an ENCLOSED 2×2 room with ONE door (walled perimeter + a single doorway), so the map reads
  // it as a Wiz room, not a wide corridor. carveEnclosedChamber keeps the floor connected (BFS guard).
  const chamberOpenings = new Map();
  for (const c of chambers) {
    const info = carveEnclosedChamber(w, c[0], c[1], entrance);
    chamberOpenings.set(`${c[0]},${c[1]}`, info.openings);
  }
  const exit = farthest(w, 1, 1);
  const dEnt = bfs(w, ...entrance);
  // Hidden-door shortcut: open ONE maze wall between two far-apart corridors and hide it behind a `secret`
  // edge — a physical hidden passage, NOT a warp (playtest rule). scFrom = the search side (gate), scTo = the
  // opened wall cell (lift), stepping through which lands on the far corridor, short-circuiting a long loop.
  const sc = secretShortcut(w, dEnt);
  const scFrom = sc.A;
  const scTo = sc.W;
  w[scTo[0]][scTo[1]] = false; // physically open the wall so the passage exists once the door is found
  const cells = openCells(w);
  // Boss/miniboss chamber = the carved chamber nearest the exit (a natural deep choke).
  const key = (c) => `${c[0]},${c[1]}`;
  const usedChamber = chambers.slice().sort((a, b) => (dEnt.get(key(b)) ?? 0) - (dEnt.get(key(a)) ?? 0))[0] ?? [9, 9];
  const plainChambers = chambers.filter((c) => key(c) !== key(usedChamber));
  // T2 (「エンカウントするマスをドア側に」): name each 玄室 on its entrance-NEAREST door (opening) cell, so
  // opening the door steps straight onto the guardian (begin_room_encounter fires AT the door), not one cell
  // in. Only the room NAME moves within the already-enclosed 2×2 block — the walls/maze are unchanged.
  const chamberDoorCell = (coord) => {
    const ops = chamberOpenings.get(key(coord)) ?? [];
    if (ops.length === 0) return coord;
    const best = ops.slice().sort((a, b) => (dEnt.get(`${a[0]},${a[1]}`) ?? 1e9) - (dEnt.get(`${b[0]},${b[1]}`) ?? 1e9))[0];
    return [best[0], best[1]];
  };
  // Reward nooks: farthest dead-ends not already used.
  const reserved = new Set([key(entrance), key(exit), key(scFrom), key(scTo), key(usedChamber), ...plainChambers.map(key)]);
  const nooks = cells
    .filter(([y, x]) => degree(w, y, x) === 1 && !reserved.has(`${y},${x}`))
    .map((c) => ({ c, d: dEnt.get(key(c)) ?? 0 }))
    .sort((a, b) => b.d - a.d)
    .slice(0, 2)
    .map((o) => o.c);

  // Assign unique glyphs.
  const glyph = Array.from({ length: S }, (_, y) => Array.from({ length: S }, (_, x) => (w[y][x] ? "#" : ".")));
  const put = (c, g) => { glyph[c[0]][c[1]] = g; };
  const symbols = {};
  put(entrance, "E"); symbols.E = rid(n, "001");
  put(exit, "X"); symbols.X = rid(n, "exit");
  put(chamberDoorCell(usedChamber), "M"); symbols.M = rid(n, "keep");
  // Enough glyphs for every plain chamber to be PLACED on the grid — with only A/B/C, G1–G3's extra chambers
  // were defined as rooms but never put on the map, so export dropped them (playtest:玄室 stayed at 3–4).
  // Avoids the reserved E/X/M/s/S glyphs.
  const chamberGlyphs = ["A", "B", "C", "D", "F", "G", "H"];
  plainChambers.forEach((c, i) => { put(chamberDoorCell(c), chamberGlyphs[i]); symbols[chamberGlyphs[i]] = rid(n, `0${i + 2}`); });
  put(scFrom, "s"); symbols.s = rid(n, "gate");
  put(scTo, "S"); symbols.S = rid(n, "lift");
  nooks.forEach((c, i) => { put(c, String(i + 1)); symbols[String(i + 1)] = rid(n, `nook${i + 1}`); });

  const mapText = glyph.map((r) => r.join("")).join("\n");
  const symbolLines = Object.entries(symbols).map(([g, id]) => `  ${g}: ${id}`).join("\n");

  // ---- edges: up-stair, down-stair, on-floor collapse shortcut ----
  const edges = [];
  if (n > 1) {
    edges.push(`  - from: ${rid(n, "001")}\n    direction: ${wallDir(w, entrance)}\n    kind: stairs\n    to: ${spec.upTo ?? rid(n - 1, "exit")}\n    targetFloorId: ${did(n - 1)}`);
  }
  if (!spec.finale) {
    edges.push(`  - from: ${rid(n, "exit")}\n    direction: ${wallDir(w, exit)}\n    kind: stairs\n    to: ${rid(n + 1, "001")}\n    targetFloorId: ${did(n + 1)}`);
  }
  // The hidden door: a `secret` edge from the search side (gate) into the opened passage cell (lift). It is
  // revealed by 探索/search, never a warp; floorMap makes the reverse side secret too, and lift↔beyond stays
  // an open passage — so found, it collapses the descent; unfound, the honest sweep is unchanged.
  edges.push(`  - from: ${rid(n, "gate")}\n    direction: ${dirBetween(scFrom, scTo)}\n    kind: secret\n    to: ${rid(n, "lift")}`);

  // EVERY remaining opening of each ENCLOSED 玄室 is a CLOSED DOOR, so the room is entered only through doors
  // from whichever side survived the enclosure (Wiz gimmick — no bypassing an open flank). Authored from the
  // block cell: the anchor's named room for its own side, or the corridor cell (room.<slug>.c<x>_<y>) the
  // 2×2 sits on for the others. floorMap mirrors the reverse side.
  const slug = `b${n}f`;
  const chamberDoorEdges = (coord, anchorRoomId) => {
    const named = chamberDoorCell(coord); // the block cell that carries the chamber's NAME (its door cell)
    for (const [by, bx, dir] of chamberOpenings.get(`${coord[0]},${coord[1]}`) ?? []) {
      const fromId = by === named[0] && bx === named[1] ? anchorRoomId : `room.${slug}.c${bx}_${by}`;
      edges.push(`  - from: ${fromId}\n    direction: ${dir}\n    kind: door`);
    }
  };
  plainChambers.forEach((c, i) => chamberDoorEdges(c, rid(n, `0${i + 2}`)));
  chamberDoorEdges(usedChamber, rid(n, "keep"));

  // ---- rooms ----
  const rooms = [];
  const room = (id, name, ja, desc, jaDesc, extra = "") =>
    `  - id: ${id}\n    name: ${name}\n    description: ${desc}\n${extra}    locales:\n      ja:\n        name: ${ja}\n        description: ${jaDesc}`;

  // The landing carries a room `event` — a one-line arrival narration that drives the character-presence
  // reaction (one rule-selected party member acknowledges the new depth). Balance-neutral flavour, but it
  // keeps every floor's arrival a "someone reacts" beat instead of a silent drop.
  const landingReturn = n === 1
    ? "    stairsToTown: true\n    returnStyle: stairs\n"
    : spec.finale
      ? "    restPoint: true\n" // 真層 landing checkpoint (resume from town at the true-layer entrance)
      : "";
  const landingEvent = n === 1
    ? "    event: Daylight thins behind you; someone in the party takes a last look back before the dark.\n"
    : `    event: Cold ash-light pools on the landing; someone in the party marks the way down into ${spec.title[0]}.\n`;
  rooms.push(room(
    rid(n, "001"),
    n === 1 ? "Sunken Threshold" : "Ash Landing",
    n === 1 ? "沈んだ入口" : "灰の踊り場",
    n === 1 ? "The way in from the surface — a mossy stair climbs back toward daylight." : "A landing of cracked ash-stone; a stair climbs back toward the floor above.",
    n === 1 ? "地上への入口。苔むした階段が陽の光へと登っていく。" : "灰石の踊り場。階段が上の階へと登っていく。",
    landingEvent + landingReturn
  ));
  // Each plain chamber is a true 玄室: chamberGuardian gates its fight PER-ROOM (by its own chest claim),
  // so all of them fire even though they share the floor's pack table — enter, clear the guardian, and the
  // side-treasure chest is left behind on victory. (The keep below stays a once-only unique boss fight.)
  plainChambers.forEach((c, i) => {
    // Roughly HALF the side 玄室 hide a ROOM-level snare on the approach floor (detectDc/damage scale with depth),
    // so a thief's detect/disarm is worth a party slot (playtest: "盗賊による罠の処理もない"). Room traps — not
    // chest traps — so the counterplay-coverage sim (which measures room.trap) sees a real, escalating trap
    // population across the descent. The rest leave a plain chamber. Either reward is claimable only after the
    // guardian falls; the keep below keeps a chest trap so both disarm mechanics stay authored.
    const trapped = i % 2 === 1;
    const trapField = trapped
      ? `    trap:\n      id: trap.b${n}f.chamber${i + 1}\n      name: A pressure-plate snare\n      damage: ${3 + n}\n      detectDc: ${11 + n}\n      warning: The floorstones here sit a hair proud, sprung to bite.\n`
      : "";
    const reward = `${trapField}    chamberGuardian: true\n    encounterTable: ${spec.packTable}\n    treasureTable: ${spec.sideTreasure}\n`;
    rooms.push(room(
      rid(n, `0${i + 2}`),
      `Ash Chamber ${i + 1}`, `灰の間 ${i + 1}`,
      "A vaulted chamber where cold ash-light pools on the black stone.", "冷たい灰光が黒石に淀む、天井の高い間。",
      reward
    ));
  });
  // The keep = miniboss/boss sole-approach choke (or a plain deep chamber on G1).
  // Enemy stats live in enemies.md; the keep references them by table (g3-g8) or as
  // a squad (g2). Boss-floor status comes from the floor's `boss` tag, not inline.
  if (spec.boss) {
    // Default's boss convention is an INLINE `encounter` with isBoss (the block-cap boss-gate the
    // rules read to bar the descent until the boss falls), NOT an encounterTable — so B10 opens only
    // after the B9 votary is cleared.
    const field = `    encounter:\n      id: ${spec.bossEnemy}\n      name: ${spec.boss[0]}\n      hp: ${spec.bossHp}\n      attack: ${spec.bossAtk}\n      role: ${spec.bossRole ?? "boss"}\n      isBoss: true\n`;
    rooms.push(room(
      rid(n, "keep"), spec.boss[0], spec.boss[1],
      "A close, ash-walled keep; the only way deeper passes through it.", "灰の壁に囲まれた狭い番所。奥へはここを抜けるほかない。",
      `${field}    chest:\n      treasureTable: ${spec.keepTreasure}\n      trap:\n        kind: snare\n        difficulty: ${13 + n}\n        damage: ${4 + n}\n`
    ));
  } else {
    rooms.push(room(rid(n, "keep"), "Deep Grove", "奥の木立", "A quiet grove deep in the gallery.", "回廊の奥の静かな木立。",
      `    encounterTable: ${spec.packTable}\n    chest:\n      treasureTable: ${spec.keepTreasure}\n      trap:\n        kind: snare\n        difficulty: ${13 + n}\n        damage: ${4 + n}\n`));
  }
  if (!spec.finale) {
    // A block-cap floor's descent room doubles as the return-to-town checkpoint (rest point ~every 3 floors).
    rooms.push(room(rid(n, "exit"), "Ash Descent", "灰の下り", "A shaft drops toward the next depth; a chain of iron falls away below.", "竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。",
      spec.restPoint ? "    restPoint: true\n" : ""));
  } else {
    rooms.push(room(rid(n, "exit"), "Beneath the Stela", "黒碑の下", "The descent ends here, beneath the black stela.s heart.", "降下はここで尽きる。黒碑の心臓の真下。",
      "    restPoint: true\n"));
  }
  rooms.push(room(rid(n, "gate"), "Suspect Wall", "怪しい壁", "A stretch of ash-wall rings hollow — search here to reveal a hidden way down.", "灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。"));
  rooms.push(room(rid(n, "lift"), "Hidden Passage", "隠しみち", "A cramped passage behind the false wall, letting out close to the descent.", "偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。"));
  // Dead-end reward niches. The FIRST is a TRAPPED CHEST (a closed chest appears on entry; investigate →
  // disarm → open is the thief's other job, distinct from the chamber floor-snares), the SECOND a plain
  // treasure table (a bare reward dead-end that keeps the maze's reward-pull rule honest). So each floor
  // authors BOTH disarm mechanics: room snares in the 玄室, a chest trap in a niche.
  nooks.forEach((c, i) => rooms.push(room(rid(n, `nook${i + 1}`), `Ash Niche ${i + 1}`, `灰の窪み ${i + 1}`,
    "A dead-end niche where something was left in the drift.", "吹き溜まりに何かが残された行き止まりの窪み。",
    i === 0
      ? `    chest:\n      treasureTable: ${spec.sideTreasure}\n      trap:\n        kind: snare\n        difficulty: ${11 + n}\n        damage: ${3 + n}\n`
      : `    treasureTable: ${spec.sideTreasure}\n`)));

  // B9 = the scenario boss = the block-3 CAP (block-cap bars the descent to B10 until it falls). B10 = the
  // 真層 finale (boss-tagged → its own maze-exempt set-piece). Both sit in block-3 (Act III / true layer).
  // Act label (block-1/2/3) + the descent-bar / set-piece tags. `boss` is the maze-exempt marker, so ONLY the
  // b10 finale carries it — b3/b6/b9 hold inline bosses but stay generated mazes held to the full rules.
  // block-cap (rules descent bar + checkpoint) sits on b3/b6/b9; every other non-finale floor is a shortcut floor.
  const tagList = [spec.block ?? "block-3"];
  if (spec.finale) {
    tagList.push("finale", "boss");
  } else if (spec.blockCap) {
    tagList.push("block-cap");
  } else {
    tagList.push("shortcut");
  }
  const tags = tagList.map((tag) => `  - ${tag}`).join("\n");
  const md = `---
id: ${did(n)}
name: B${n}F - ${spec.title[0]}
level: ${spec.level}
role: ${spec.finale ? "finale" : "deep_route"}
recommendedPartyLevel: ${spec.recLevel ?? Math.max(1, spec.level - 1)}${spec.recSize ? `\nrecommendedPartySize: ${spec.recSize}` : ""}
tags:
${tags}
startRoom: ${rid(n, "001")}
map: |
${mapText.split("\n").map((r) => "  " + r).join("\n")}
symbols:
${symbolLines}
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
${edges.join("\n")}
rooms:
${rooms.join("\n")}
---

# B${n}F - ${spec.title[0]}

${spec.finale ? "The heartwood's guardian floor — the run's climax." : "An ashen descent floor."} Generated skeleton (V1); encounters/treasure tables in V2/V3.
`;
  writeFileSync(`content/worlds/default/dungeons/b${n}f.md`, md);
  return { n, cells: cells.length, exit, sweepOk: true };
}

for (const spec of FLOORS) {
  const r = buildFloor(spec);
  console.log(`b${r.n}f: ${r.cells} cells, exit=${r.exit}`);
}
