---
id: dungeon.verdant.g2f
name: G2F - Spore Drift
level: 2
recommendedPartyLevel: 1
tags:
  - miniboss
  - shortcut
startRoom: room.verdant.g2f.001
map: |
  ###################
  #E#.............#.#
  #.#.###.###.###.#.#
  #...#.....#...#...#
  #.##..#####...###.#
  #.#..B....Ss.C..#.#
  #.#.#.#######.#####
  #.#.....#........1#
  #.##..##...#..#####
  #....F...A...G....#
  #.#.#.##....#.###.#
  #.#.......#.....#2#
  ###...##..###.#.###
  #....H...D...M....#
  #.#.#.###.#.#.###.#
  #.#...#.....#.....#
  #.###.###########.#
  #.#.........#X....#
  ###################
symbols:
  1: room.verdant.g2f.nook1
  2: room.verdant.g2f.nook2
  E: room.verdant.g2f.001
  X: room.verdant.g2f.exit
  M: room.verdant.g2f.keep
  A: room.verdant.g2f.02
  B: room.verdant.g2f.03
  C: room.verdant.g2f.04
  D: room.verdant.g2f.05
  F: room.verdant.g2f.06
  G: room.verdant.g2f.07
  H: room.verdant.g2f.08
  s: room.verdant.g2f.gate
  S: room.verdant.g2f.lift
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
  - from: room.verdant.g2f.001
    direction: west
    kind: stairs
    to: room.verdant.g1f.exit
    targetFloorId: dungeon.verdant.g1f
  - from: room.verdant.g2f.exit
    direction: west
    kind: stairs
    to: room.verdant.g3f.001
    targetFloorId: dungeon.verdant.g3f
  - from: room.verdant.g2f.gate
    direction: west
    kind: secret
    to: room.verdant.g2f.lift
rooms:
  - id: room.verdant.g2f.001
    name: Root Landing
    description: A landing of knotted roots; a stair climbs back toward the floor above.
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。階段が上の階へと登っていく。
  - id: room.verdant.g2f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.05
    name: Green Chamber 4
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 4
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.06
    name: Green Chamber 5
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 5
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.07
    name: Green Chamber 6
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 6
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.08
    name: Green Chamber 7
    description: A chamber where the canopy-light pools green on standing water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 7
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.keep
    name: Bramble Warden
    description: A close, root-walled keep; the only way deeper passes through it.
    encounterSquad:
      - enemy.verdant.g2.bramble-shield
      - enemy.verdant.g2.spore-caster
    chest:
      treasureTable: treasure.verdant.g2.keep
      trap:
        kind: snare
        difficulty: 15
        damage: 6
    locales:
      ja:
        name: 茨の番人
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g2f.exit
    name: Root Descent
    description: Roots twist down toward the next depth; a chain of vine falls away below.
    locales:
      ja:
        name: 根の下り
        description: 根が次の深みへとねじれ落ちる。蔦の鎖が下へ垂れている。
  - id: room.verdant.g2f.gate
    name: Suspect Wall
    description: A stretch of root-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 根の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.verdant.g2f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.verdant.g2f.nook1
    name: Spore Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 胞子の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.verdant.g2f.nook2
    name: Spore Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 胞子の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# G2F - Spore Drift

A verdant descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
