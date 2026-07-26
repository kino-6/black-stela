---
id: dungeon.verdant.g1f
name: G1F - Root Gallery
level: 1
recommendedPartyLevel: 1
tags:
  - shortcut
startRoom: room.verdant.g1f.001
map: |
  ###################
  #E.s..........#...#
  #.#.#####.###.###.#
  #.#.....#.#.......#
  #.#...###.##..#.#.#
  #.#..B....#..C..#.#
  #.###.#.#.###.#.###
  #.....#.#.#...#...#
  #.#...##......#.#.#
  #.#..F...A...G..#.#
  #.#.#.##....#.#.###
  #.#.#.....#.#.#S..#
  #.#...#...#...#.###
  #.#..H...D...M....#
  #.#.#.#.#.###.#.###
  #.#...#.....#.....#
  #.###########.###.#
  #.........#1...2#X#
  ###################
symbols:
  1: room.verdant.g1f.nook1
  2: room.verdant.g1f.nook2
  E: room.verdant.g1f.001
  X: room.verdant.g1f.exit
  M: room.verdant.g1f.keep
  A: room.verdant.g1f.02
  B: room.verdant.g1f.03
  C: room.verdant.g1f.04
  D: room.verdant.g1f.05
  F: room.verdant.g1f.06
  G: room.verdant.g1f.07
  H: room.verdant.g1f.08
  s: room.verdant.g1f.gate
  S: room.verdant.g1f.lift
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
  - from: room.verdant.g1f.exit
    direction: west
    kind: stairs
    to: room.verdant.g2f.001
    targetFloorId: dungeon.verdant.g2f
  - from: room.verdant.g1f.gate
    direction: north
    kind: shortcut
    to: room.verdant.g1f.lift
rooms:
  - id: room.verdant.g1f.001
    name: Sunken Threshold
    description: The way in from the surface — a mossy stair climbs back toward daylight.
    stairsToTown: true
    returnStyle: stairs
    locales:
      ja:
        name: 沈んだ入口
        description: 地上への入口。苔むした階段が陽の光へと登っていく。
  - id: room.verdant.g1f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g1.pack
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g1f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g1.pack
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g1f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g1.pack
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g1f.05
    name: Green Chamber 4
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g1.pack
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 翠の間 4
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g1f.06
    name: Green Chamber 5
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g1.pack
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 翠の間 5
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g1f.07
    name: Green Chamber 6
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g1.pack
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 翠の間 6
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g1f.08
    name: Green Chamber 7
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g1.pack
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 翠の間 7
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g1f.keep
    name: Deep Grove
    description: A quiet grove deep in the gallery.
    encounterTable: encounters.verdant.g1.pack
    chest:
      treasureTable: treasure.verdant.g1.keep
      trap:
        kind: snare
        difficulty: 14
        damage: 5
    locales:
      ja:
        name: 奥の木立
        description: 回廊の奥の静かな木立。
  - id: room.verdant.g1f.exit
    name: Root Descent
    description: Roots twist down toward the next depth; a chain of vine falls away below.
    locales:
      ja:
        name: 根の下り
        description: 根が次の深みへとねじれ落ちる。蔦の鎖が下へ垂れている。
  - id: room.verdant.g1f.gate
    name: Sealed Bar
    description: A heavy vine-bar can be lifted to open a shorter way down.
    gates:
      - id: gate.verdant.g1f.shortcut
        direction: north
        kind: shortcut
        grantsFlag: flag.verdant.g1f.shortcut
        clue: The bar lifts toward the deeper dark.
        locales:
          ja:
            clue: 横木は奥の闇へ向かって上がる。
    locales:
      ja:
        name: 封じの横木
        description: 重い蔦の横木。上げれば下りの近道が開く。
  - id: room.verdant.g1f.lift
    name: Lifted Vine
    description: Where the lifted vine-bar lets you out, close to the descent.
    locales:
      ja:
        name: 上がる蔦
        description: 上げた蔦の横木が抜ける先。下りのすぐ近く。
  - id: room.verdant.g1f.nook1
    name: Spore Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 胞子の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.verdant.g1f.nook2
    name: Spore Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g1.side
    locales:
      ja:
        name: 胞子の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# G1F - Root Gallery

A verdant descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
