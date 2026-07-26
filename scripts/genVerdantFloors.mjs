// Verdant floor skeleton generator (V1). Emits content/worlds/verdant/dungeons/g1f..g8f.md
// as navigable dense mazes with connected up/down stairs + an on-floor collapse shortcut.
// Reuses the 棒倒し maze core from genFloorMaze.mjs's approach. Room CONTENT (encounters,
// treasure) is referenced by table id here; those tables are authored in V2/V3. Rerun:
//   node scripts/genVerdantFloors.mjs
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

// Per-floor spec: seed + names (en/ja) for entrance, exit(down-stair), the miniboss/boss
// chamber, plain chambers, shortcut, and reward nooks. Enemy/table ids match the roster in
// docs/design/verdant-areas.md and are filled in V2/V3.
const FLOORS = [
  { n: 1, seed: 50501, level: 1, title: ["Root Gallery", "根の回廊"],
    boss: null, bossEnc: "encounters.verdant.g1.pack" },
  { n: 2, seed: 50502, level: 2, title: ["Spore Drift", "胞子の吹き溜まり"],
    boss: ["Bramble Warden", "茨の番人"], bossSquad: ["enemy.verdant.g2.bramble-shield", "enemy.verdant.g2.spore-caster"], bossEnc: "encounters.verdant.g2.squad" },
  { n: 3, seed: 50503, level: 3, title: ["Pollen Cistern", "花粉の貯水池"],
    boss: ["Bloom Warden", "花守り"], bossEnemy: "enemy.verdant.g3.bloom-warden", bossEnc: "encounters.verdant.g3.gate" },
  { n: 4, seed: 50504, level: 4, title: ["Bark Wards", "樹皮の衛"],
    boss: ["Bark Ward", "樹皮衛"], bossEnemy: "enemy.verdant.g4.bark-ward", bossEnc: "encounters.verdant.g4.gate" },
  { n: 5, seed: 50505, level: 5, title: ["Toll of Sap", "樹液の関"],
    boss: ["Sap Keeper", "樹液守り"], bossEnemy: "enemy.verdant.g5.sap-keeper", bossEnc: "encounters.verdant.g5.gate" },
  { n: 6, seed: 50506, level: 6, title: ["Strangling Oaths", "絞め殺しの誓い"],
    boss: ["Strangler Warden", "絞め殺しの番人"], bossEnemy: "enemy.verdant.g6.strangler-warden", bossEnc: "encounters.verdant.g6.gate" },
  { n: 7, seed: 50507, level: 7, title: ["Heartwood Husks", "樹心の殻"],
    boss: ["Heartwood Husk", "樹心の殻守"], bossEnemy: "enemy.verdant.g7.heartwood-husk", bossEnc: "encounters.verdant.g7.gate" },
  { n: 8, seed: 50508, level: 8, title: ["The Green Heart", "翠の樹心"],
    boss: ["Rootheart", "樹心の主"], bossEnemy: "enemy.verdant.g8.rootheart", bossEnc: null, finale: true }
];

const rid = (n, suffix) => `room.verdant.g${n}f.${suffix}`;
const did = (n) => `dungeon.verdant.g${n}f`;

function buildFloor(spec) {
  const { n } = spec;
  const w = genPerfect(CELLS, spec.seed);
  const S = w.length;
  // 玄室 (Wiz-style guaranteed-fight + treasure rooms). G1–G3 seat EIGHT (7 plain + 1 keep ≥ 6) so the early
  // floors are dense with rooms to clear (playtest); deeper floors keep the leaner four. One becomes the keep.
  const chamberCoords = n <= 3
    ? [[9, 9], [5, 5], [5, 13], [13, 9], [9, 5], [9, 13], [13, 5], [13, 13]]
    : [[9, 9], [5, 5], [5, 13], [13, 9]];
  const chambers = chamberCoords.filter(([y, x]) => y > 1 && x > 1 && y < S - 2 && x < S - 2);
  carveChamber(w, 9, 9, "block");
  for (const [cy, cx] of chambers.filter(([y, x]) => !(y === 9 && x === 9))) carveChamber(w, cy, cx, "plus");

  const entrance = [1, 1];
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
  put(usedChamber, "M"); symbols.M = rid(n, "keep");
  // Enough glyphs for every plain chamber to be PLACED on the grid — with only A/B/C, G1–G3's extra chambers
  // were defined as rooms but never put on the map, so export dropped them (playtest:玄室 stayed at 3–4).
  // Avoids the reserved E/X/M/s/S glyphs.
  const chamberGlyphs = ["A", "B", "C", "D", "F", "G", "H"];
  plainChambers.forEach((c, i) => { put(c, chamberGlyphs[i]); symbols[chamberGlyphs[i]] = rid(n, `0${i + 2}`); });
  put(scFrom, "s"); symbols.s = rid(n, "gate");
  put(scTo, "S"); symbols.S = rid(n, "lift");
  nooks.forEach((c, i) => { put(c, String(i + 1)); symbols[String(i + 1)] = rid(n, `nook${i + 1}`); });

  const mapText = glyph.map((r) => r.join("")).join("\n");
  const symbolLines = Object.entries(symbols).map(([g, id]) => `  ${g}: ${id}`).join("\n");

  // ---- edges: up-stair, down-stair, on-floor collapse shortcut ----
  const edges = [];
  if (n > 1) {
    edges.push(`  - from: ${rid(n, "001")}\n    direction: ${wallDir(w, entrance)}\n    kind: stairs\n    to: ${rid(n - 1, "exit")}\n    targetFloorId: ${did(n - 1)}`);
  }
  if (!spec.finale) {
    edges.push(`  - from: ${rid(n, "exit")}\n    direction: ${wallDir(w, exit)}\n    kind: stairs\n    to: ${rid(n + 1, "001")}\n    targetFloorId: ${did(n + 1)}`);
  }
  // The hidden door: a `secret` edge from the search side (gate) into the opened passage cell (lift). It is
  // revealed by 探索/search, never a warp; floorMap makes the reverse side secret too, and lift↔beyond stays
  // an open passage — so found, it collapses the descent; unfound, the honest sweep is unchanged.
  edges.push(`  - from: ${rid(n, "gate")}\n    direction: ${dirBetween(scFrom, scTo)}\n    kind: secret\n    to: ${rid(n, "lift")}`);

  // ---- rooms ----
  const rooms = [];
  const room = (id, name, ja, desc, jaDesc, extra = "") =>
    `  - id: ${id}\n    name: ${name}\n    description: ${desc}\n${extra}    locales:\n      ja:\n        name: ${ja}\n        description: ${jaDesc}`;

  rooms.push(room(
    rid(n, "001"),
    n === 1 ? "Sunken Threshold" : "Root Landing",
    n === 1 ? "沈んだ入口" : "根の踊り場",
    n === 1 ? "The way in from the surface — a mossy stair climbs back toward daylight." : "A landing of knotted roots; a stair climbs back toward the floor above.",
    n === 1 ? "地上への入口。苔むした階段が陽の光へと登っていく。" : "根の絡む踊り場。階段が上の階へと登っていく。",
    n === 1
      ? "    stairsToTown: true\n    returnStyle: stairs\n"
      : n === 4 || n === 7
        ? "    restPoint: true\n" // act-boundary checkpoint (resume from town), mirrors default b3/b6
        : ""
  ));
  plainChambers.forEach((c, i) => rooms.push(room(
    rid(n, `0${i + 2}`),
    `Green Chamber ${i + 1}`, `翠の間 ${i + 1}`,
    "A chamber where the canopy-light pools green on standing water.", "樹冠の光が水面に翠色を落とす間。",
    `    encounterTable: ${spec.bossEnc ? `encounters.verdant.g${n}.pack` : `encounters.verdant.g${n}.pack`}\n    treasureTable: treasure.verdant.g${n}.side\n`
  )));
  // The keep = miniboss/boss sole-approach choke (or a plain deep chamber on G1).
  // Enemy stats live in enemies.md; the keep references them by table (g3-g8) or as
  // a squad (g2). Boss-floor status comes from the floor's `boss` tag, not inline.
  if (spec.boss) {
    const field = spec.bossSquad
      ? `    encounterSquad:\n${spec.bossSquad.map((e) => `      - ${e}`).join("\n")}\n`
      : `    encounterTable: encounters.verdant.g${n}.keep\n`;
    rooms.push(room(
      rid(n, "keep"), spec.boss[0], spec.boss[1],
      "A close, root-walled keep; the only way deeper passes through it.", "根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。",
      `${field}    chest:\n      treasureTable: treasure.verdant.g${n}.keep\n      trap:\n        kind: snare\n        difficulty: ${13 + n}\n        damage: ${4 + n}\n`
    ));
  } else {
    rooms.push(room(rid(n, "keep"), "Deep Grove", "奥の木立", "A quiet grove deep in the gallery.", "回廊の奥の静かな木立。",
      `    encounterTable: encounters.verdant.g${n}.pack\n    chest:\n      treasureTable: treasure.verdant.g${n}.keep\n      trap:\n        kind: snare\n        difficulty: ${13 + n}\n        damage: ${4 + n}\n`));
  }
  if (!spec.finale) {
    rooms.push(room(rid(n, "exit"), "Root Descent", "根の下り", "Roots twist down toward the next depth; a chain of vine falls away below.", "根が次の深みへとねじれ落ちる。蔦の鎖が下へ垂れている。"));
  } else {
    rooms.push(room(rid(n, "exit"), "Beneath the Heart", "樹心の下", "The gallery ends here, beneath the living heart.", "回廊はここで尽きる。生きた樹心の真下。",
      "    restPoint: true\n"));
  }
  rooms.push(room(rid(n, "gate"), "Suspect Wall", "怪しい壁", "A stretch of root-wall rings hollow — search here to reveal a hidden way down.", "根の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。"));
  rooms.push(room(rid(n, "lift"), "Hidden Passage", "隠しみち", "A cramped passage behind the false wall, letting out close to the descent.", "偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。"));
  nooks.forEach((c, i) => rooms.push(room(rid(n, `nook${i + 1}`), `Spore Niche ${i + 1}`, `胞子の窪み ${i + 1}`,
    "A dead-end niche where something was left in the drift.", "吹き溜まりに何かが残された行き止まりの窪み。",
    `    treasureTable: treasure.verdant.g${n}.side\n`)));

  const tags = spec.finale ? "  - finale\n  - boss" : spec.boss ? "  - miniboss\n  - shortcut" : "  - shortcut";
  const md = `---
id: ${did(n)}
name: G${n}F - ${spec.title[0]}
level: ${spec.level}
recommendedPartyLevel: ${Math.max(1, spec.level - 1)}
tags:
${tags}
startRoom: ${rid(n, "001")}
map: |
${mapText.split("\n").map((r) => "  " + r).join("\n")}
symbols:
${symbolLines}
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
${edges.join("\n")}
rooms:
${rooms.join("\n")}
---

# G${n}F - ${spec.title[0]}

${spec.finale ? "The heartwood's guardian floor — the run's climax." : "A verdant descent floor."} Generated skeleton (V1); encounters/treasure tables in V2/V3.
`;
  writeFileSync(`content/worlds/verdant/dungeons/g${n}f.md`, md);
  return { n, cells: cells.length, exit, sweepOk: true };
}

for (const spec of FLOORS) {
  const r = buildFloor(spec);
  console.log(`g${r.n}f: ${r.cells} cells, exit=${r.exit}`);
}
