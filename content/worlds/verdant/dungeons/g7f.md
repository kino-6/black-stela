---
id: dungeon.verdant.g7f
name: G7F - Heartwood Husks
level: 7
recommendedPartyLevel: 6
tags:
  - miniboss
  - shortcut
startRoom: room.verdant.g7f.001
map: |
  ###################
  #E#.....#.........#
  #.#.###.#####.#.###
  #...#.........#...#
  #.##..#.#.##..#.#.#
  #....B..#.#..M..#.#
  #.###.#######.#.###
  #...#.........#...#
  ###.###.....#.###.#
  #.....#..A..#...#.#
  ###.#.#....##.###.#
  #...#sS...#.....#2#
  #.######..#.#.#####
  #........C..#.....#
  #######.#.###.#.#.#
  #.......#.#...#.#.#
  #.###.#.#.###.#.#.#
  #..X#.#.#.#...#.#1#
  ###################
symbols:
  1: room.verdant.g7f.nook1
  2: room.verdant.g7f.nook2
  E: room.verdant.g7f.001
  X: room.verdant.g7f.exit
  M: room.verdant.g7f.keep
  A: room.verdant.g7f.02
  B: room.verdant.g7f.03
  C: room.verdant.g7f.04
  s: room.verdant.g7f.gate
  S: room.verdant.g7f.lift
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
  - from: room.verdant.g7f.001
    direction: west
    kind: stairs
    to: room.verdant.g6f.exit
    targetFloorId: dungeon.verdant.g6f
  - from: room.verdant.g7f.exit
    direction: north
    kind: stairs
    to: room.verdant.g8f.001
    targetFloorId: dungeon.verdant.g8f
  - from: room.verdant.g7f.gate
    direction: east
    kind: secret
    to: room.verdant.g7f.lift
rooms:
  - id: room.verdant.g7f.001
    name: Root Landing
    description: A landing of knotted roots; a stair climbs back toward the floor above.
    restPoint: true
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。階段が上の階へと登っていく。
  - id: room.verdant.g7f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g7.pack
    treasureTable: treasure.verdant.g7.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g7f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g7.pack
    treasureTable: treasure.verdant.g7.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g7f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g7.pack
    treasureTable: treasure.verdant.g7.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g7f.keep
    name: Heartwood Husk
    description: A close, root-walled keep; the only way deeper passes through it.
    encounterTable: encounters.verdant.g7.keep
    chest:
      treasureTable: treasure.verdant.g7.keep
      trap:
        kind: snare
        difficulty: 20
        damage: 11
    locales:
      ja:
        name: 樹心の殻守
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g7f.exit
    name: Root Descent
    description: Roots twist down toward the next depth; a chain of vine falls away below.
    locales:
      ja:
        name: 根の下り
        description: 根が次の深みへとねじれ落ちる。蔦の鎖が下へ垂れている。
  - id: room.verdant.g7f.gate
    name: Suspect Wall
    description: A stretch of root-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 根の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.verdant.g7f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.verdant.g7f.nook1
    name: Spore Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g7.side
    locales:
      ja:
        name: 胞子の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.verdant.g7f.nook2
    name: Spore Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g7.side
    locales:
      ja:
        name: 胞子の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# G7F - Heartwood Husks

A verdant descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
