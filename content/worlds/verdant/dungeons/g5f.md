---
id: dungeon.verdant.g5f
name: G5F - Toll of Sap
level: 5
recommendedPartyLevel: 4
tags:
  - miniboss
  - shortcut
startRoom: room.verdant.g5f.001
map: |
  ###################
  #E............#...#
  #.#####.#.###.###.#
  #.....#.#...#.....#
  #...#####.###.#.#.#
  #.#.#B.##...#C.##.#
  #.#.#..##.#.#..####
  #.#.....#....#....#
  #.#.#.#.###.###..##
  #.#.#.#..A.#..#...#
  #.#######..##...#.#
  #........##...#...#
  ###.#.#####.###.#.#
  #.....#..M.#X.#.#.#
  #####.###..##.#.###
  #.........#.......#
  #.#####.#.#S##..#.#
  #.....#.#..s..#2#1#
  ###################
symbols:
  1: room.verdant.g5f.nook1
  2: room.verdant.g5f.nook2
  E: room.verdant.g5f.001
  X: room.verdant.g5f.exit
  M: room.verdant.g5f.keep
  A: room.verdant.g5f.02
  B: room.verdant.g5f.03
  C: room.verdant.g5f.04
  s: room.verdant.g5f.gate
  S: room.verdant.g5f.lift
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
  - from: room.verdant.g5f.001
    direction: west
    kind: stairs
    to: room.verdant.g4f.exit
    targetFloorId: dungeon.verdant.g4f
  - from: room.verdant.g5f.exit
    direction: west
    kind: stairs
    to: room.verdant.g6f.001
    targetFloorId: dungeon.verdant.g6f
  - from: room.verdant.g5f.gate
    direction: north
    kind: secret
    to: room.verdant.g5f.lift
  - from: room.verdant.g5f.02
    direction: west
    kind: door
  - from: room.verdant.g5f.c6_6
    direction: south
    kind: door
  - from: room.verdant.g5f.c5_6
    direction: south
    kind: door
  - from: room.verdant.g5f.c14_6
    direction: south
    kind: door
  - from: room.verdant.g5f.04
    direction: north
    kind: door
  - from: room.verdant.g5f.keep
    direction: west
    kind: door
  - from: room.verdant.g5f.c9_14
    direction: south
    kind: door
rooms:
  - id: room.verdant.g5f.001
    name: Root Landing
    description: A landing of knotted roots; a stair climbs back toward the floor above.
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。階段が上の階へと登っていく。
  - id: room.verdant.g5f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g5.pack
    treasureTable: treasure.verdant.g5.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g5f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g5.pack
    treasureTable: treasure.verdant.g5.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g5f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g5.pack
    treasureTable: treasure.verdant.g5.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g5f.keep
    name: Sap Keeper
    description: A close, root-walled keep; the only way deeper passes through it.
    encounterTable: encounters.verdant.g5.keep
    chest:
      treasureTable: treasure.verdant.g5.keep
      trap:
        kind: snare
        difficulty: 18
        damage: 9
    locales:
      ja:
        name: 樹液守り
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g5f.exit
    name: Root Descent
    description: Roots twist down toward the next depth; a chain of vine falls away below.
    locales:
      ja:
        name: 根の下り
        description: 根が次の深みへとねじれ落ちる。蔦の鎖が下へ垂れている。
  - id: room.verdant.g5f.gate
    name: Suspect Wall
    description: A stretch of root-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 根の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.verdant.g5f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.verdant.g5f.nook1
    name: Spore Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g5.side
    locales:
      ja:
        name: 胞子の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.verdant.g5f.nook2
    name: Spore Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g5.side
    locales:
      ja:
        name: 胞子の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# G5F - Toll of Sap

A verdant descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
