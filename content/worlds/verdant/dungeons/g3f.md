---
id: dungeon.verdant.g3f
name: G3F - Pollen Cistern
level: 3
recommendedPartyLevel: 2
tags:
  - miniboss
  - shortcut
startRoom: room.verdant.g3f.001
map: |
  ###################
  #E.s..#.......#...#
  ###.#.#.#####.###.#
  #...#.......#.....#
  ###.#.###.#.#.###.#
  #....B..#.#..C..#.#
  ###.#.###.###.###.#
  #.......#...#...#.#
  #.######....###.#.#
  #........A..#...#.#
  ###.####...##.###.#
  #.......#...#...#.#
  #.#.#.###.#####.###
  #.#.#....M.....S..#
  #.#####.#.#.###.###
  #...#...#...#.....#
  #####.#####.#.###.#
  #1....#.....#2#X..#
  ###################
symbols:
  1: room.verdant.g3f.nook1
  2: room.verdant.g3f.nook2
  E: room.verdant.g3f.001
  X: room.verdant.g3f.exit
  M: room.verdant.g3f.keep
  A: room.verdant.g3f.02
  B: room.verdant.g3f.03
  C: room.verdant.g3f.04
  s: room.verdant.g3f.gate
  S: room.verdant.g3f.lift
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
  - from: room.verdant.g3f.001
    direction: west
    kind: stairs
    to: room.verdant.g2f.exit
    targetFloorId: dungeon.verdant.g2f
  - from: room.verdant.g3f.exit
    direction: west
    kind: stairs
    to: room.verdant.g4f.001
    targetFloorId: dungeon.verdant.g4f
  - from: room.verdant.g3f.gate
    direction: north
    kind: shortcut
    to: room.verdant.g3f.lift
rooms:
  - id: room.verdant.g3f.001
    name: Root Landing
    description: A landing of knotted roots; a stair climbs back toward the floor above.
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。階段が上の階へと登っていく。
  - id: room.verdant.g3f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g3.pack
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g3f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g3.pack
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g3f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g3.pack
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g3f.keep
    name: Bloom Warden
    description: A close, root-walled keep; the only way deeper passes through it.
    encounterTable: encounters.verdant.g3.keep
    treasureTable: treasure.verdant.g3.keep
    locales:
      ja:
        name: 花の番所
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g3f.exit
    name: Root Descent
    description: Roots twist down toward the next depth; a chain of vine falls away below.
    locales:
      ja:
        name: 根の下り
        description: 根が次の深みへとねじれ落ちる。蔦の鎖が下へ垂れている。
  - id: room.verdant.g3f.gate
    name: Sealed Bar
    description: A heavy vine-bar can be lifted to open a shorter way down.
    gates:
      - id: gate.verdant.g3f.shortcut
        direction: north
        kind: shortcut
        grantsFlag: flag.verdant.g3f.shortcut
        clue: The bar lifts toward the deeper dark.
        locales:
          ja:
            clue: 横木は奥の闇へ向かって上がる。
    locales:
      ja:
        name: 封じの横木
        description: 重い蔦の横木。上げれば下りの近道が開く。
  - id: room.verdant.g3f.lift
    name: Lifted Vine
    description: Where the lifted vine-bar lets you out, close to the descent.
    locales:
      ja:
        name: 上がる蔦
        description: 上げた蔦の横木が抜ける先。下りのすぐ近く。
  - id: room.verdant.g3f.nook1
    name: Spore Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 胞子の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.verdant.g3f.nook2
    name: Spore Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 胞子の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# G3F - Pollen Cistern

A verdant descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
