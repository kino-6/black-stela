---
id: dungeon.verdant.g4f
name: G4F - Bark Wards
level: 4
recommendedPartyLevel: 3
tags:
  - miniboss
  - shortcut
startRoom: room.verdant.g4f.001
map: |
  ###################
  #E.s..............#
  #.#.#.#####.#.#####
  #.#.#...#...#.....#
  #.###.###.#.#.#.###
  #....B....#..C....#
  #.#.#.#######.#.###
  #.#.........#.#...#
  #.#####....####.###
  #...#....A....#...#
  #.#.#.#....##.###.#
  #.#.#.#.....#.#2..#
  #.#.#####.#######.#
  #.#...#..M......#.#
  ###.###.#.#########
  #.....#....S......#
  #.#.###.#.#.#####.#
  #.#.#...#.#....1#X#
  ###################
symbols:
  1: room.verdant.g4f.nook1
  2: room.verdant.g4f.nook2
  E: room.verdant.g4f.001
  X: room.verdant.g4f.exit
  M: room.verdant.g4f.keep
  A: room.verdant.g4f.02
  B: room.verdant.g4f.03
  C: room.verdant.g4f.04
  s: room.verdant.g4f.gate
  S: room.verdant.g4f.lift
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green canopy-light filters down through the leaves far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の葉むらから、淡い翠の光が差し込む。
edges:
  - from: room.verdant.g4f.001
    direction: west
    kind: stairs
    to: room.verdant.g3f.exit
    targetFloorId: dungeon.verdant.g3f
  - from: room.verdant.g4f.exit
    direction: west
    kind: stairs
    to: room.verdant.g5f.001
    targetFloorId: dungeon.verdant.g5f
  - from: room.verdant.g4f.gate
    direction: north
    kind: shortcut
    to: room.verdant.g4f.lift
rooms:
  - id: room.verdant.g4f.001
    name: Root Landing
    description: A vine-wrapped ladder climbs from the knotted-root landing.
    restPoint: true
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。蔦を巻いた梯子が上の階へ伸びている。
  - id: room.verdant.g4f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g4.pack
    treasureTable: treasure.verdant.g4.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g4f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g4.pack
    treasureTable: treasure.verdant.g4.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g4f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g4.pack
    treasureTable: treasure.verdant.g4.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g4f.keep
    name: Bark Ward
    description: A close, root-walled keep; the only way deeper passes through it.
    encounter:
      id: enemy.verdant.g4.bark-ward
      name: Bark Ward
      hp: 24
      attack: 9
      role: miniboss
      dangerTier: 3
      tags:
        - grove-warden
    encounterTable: encounters.verdant.g4.keep
    treasureTable: treasure.verdant.g4.keep
    locales:
      ja:
        name: 樹皮の番所
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g4f.exit
    name: Root Descent
    description: A vine-wrapped ladder drops through a gap in the roots.
    locales:
      ja:
        name: 根の下り
        description: 根の隙間から、蔦を巻いた梯子が下の階へ降りている。
  - id: room.verdant.g4f.gate
    name: Sealed Bar
    description: A heavy vine-bar can be lifted to open a shorter way down.
    gates:
      - id: gate.verdant.g4f.shortcut
        direction: north
        kind: shortcut
        grantsFlag: flag.verdant.g4f.shortcut
        clue: The bar lifts toward the deeper dark.
        locales:
          ja:
            clue: 横木は奥の闇へ向かって上がる。
    locales:
      ja:
        name: 封じの横木
        description: 重い蔦の横木。上げれば下りの近道が開く。
  - id: room.verdant.g4f.lift
    name: Lifted Vine
    description: Where the lifted vine-bar lets you out, close to the descent.
    locales:
      ja:
        name: 上がる蔦
        description: 上げた蔦の横木が抜ける先。下りのすぐ近く。
  - id: room.verdant.g4f.nook1
    name: Spore Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g4.side
    locales:
      ja:
        name: 胞子の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.verdant.g4f.nook2
    name: Spore Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.verdant.g4.side
    locales:
      ja:
        name: 胞子の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# G4F - Bark Wards

A verdant descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
