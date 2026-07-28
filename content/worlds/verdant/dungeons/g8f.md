---
id: dungeon.verdant.g8f
name: G8F - The Green Heart
level: 8
recommendedPartyLevel: 7
tags:
  - finale
  - boss
startRoom: room.verdant.g8f.001
map: |
  ###################
  #E#...#.#...#.....#
  #.#..##.#.#.#.#####
  #.................#
  ###.####..#.#######
  #....B.#..#.#C....#
  #..##..##.#.#..##.#
  #....##.......#...#
  #.#.#####.#.#.#.###
  #.#...#..A.#..#...#
  #.#######..#.####.#
  #.......###...#...#
  ###.#######.#####.#
  #.......#M.##.....#
  #.#.###.#..##.###.#
  #.#...#s..#...#...#
  #.#####S###.###.#.#
  #.....#X....#1..#2#
  ###################
symbols:
  1: room.verdant.g8f.nook1
  2: room.verdant.g8f.nook2
  E: room.verdant.g8f.001
  X: room.verdant.g8f.exit
  M: room.verdant.g8f.keep
  A: room.verdant.g8f.02
  B: room.verdant.g8f.03
  C: room.verdant.g8f.04
  s: room.verdant.g8f.gate
  S: room.verdant.g8f.lift
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
  - from: room.verdant.g8f.001
    direction: west
    kind: stairs
    to: room.verdant.g7f.exit
    targetFloorId: dungeon.verdant.g7f
  - from: room.verdant.g8f.gate
    direction: south
    kind: secret
    to: room.verdant.g8f.lift
  - from: room.verdant.g8f.02
    direction: west
    kind: door
  - from: room.verdant.g8f.02
    direction: north
    kind: door
  - from: room.verdant.g8f.03
    direction: west
    kind: door
  - from: room.verdant.g8f.c14_5
    direction: east
    kind: door
  - from: room.verdant.g8f.c13_6
    direction: south
    kind: door
  - from: room.verdant.g8f.c9_14
    direction: south
    kind: door
rooms:
  - id: room.verdant.g8f.001
    name: Root Landing
    description: A landing of knotted roots; a stair climbs back toward the floor above.
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。階段が上の階へと登っていく。
  - id: room.verdant.g8f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g8.pack
    treasureTable: treasure.verdant.g8.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g8f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g8.pack
    treasureTable: treasure.verdant.g8.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g8f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g8.pack
    treasureTable: treasure.verdant.g8.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g8f.keep
    name: Rootheart
    description: A close, root-walled keep; the only way deeper passes through it.
    encounterTable: encounters.verdant.g8.keep
    chest:
      treasureTable: treasure.verdant.g8.keep
      trap:
        kind: snare
        difficulty: 21
        damage: 12
    locales:
      ja:
        name: 樹心の主
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g8f.exit
    name: Beneath the Heart
    description: The gallery ends here, beneath the living heart.
    restPoint: true
    locales:
      ja:
        name: 樹心の下
        description: 回廊はここで尽きる。生きた樹心の真下。
  - id: room.verdant.g8f.gate
    name: Suspect Wall
    description: A stretch of root-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 根の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.verdant.g8f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.verdant.g8f.nook1
    name: Spore Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g8.side
    locales:
      ja:
        name: 胞子の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.verdant.g8f.nook2
    name: Spore Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g8.side
    locales:
      ja:
        name: 胞子の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# G8F - The Green Heart

The heartwood's guardian floor — the run's climax. Generated skeleton (V1); encounters/treasure tables in V2/V3.
