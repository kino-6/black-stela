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
  #E.s........#...#.#
  #####.###.###.###.#
  #.....#...........#
  #.#.#.#######.#.#.#
  #.#..B.......C..#.#
  ###.#.#######.#.#.#
  #.........#.....#.#
  #####.##...##.#####
  #.....#..A........#
  ###.#.#.....#####.#
  #...#.#...#.....#.#
  ###.#####.#.###.#.#
  #........M..#...#.#
  #######.#.#######.#
  #.......#.#1......#
  #.#############.#.#
  #....S.......X#2#.#
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
    direction: north
    kind: stairs
    to: room.verdant.g3f.001
    targetFloorId: dungeon.verdant.g3f
  - from: room.verdant.g2f.gate
    direction: north
    kind: shortcut
    to: room.verdant.g2f.lift
rooms:
  - id: room.verdant.g2f.001
    name: Root Landing
    description: A vine-wrapped ladder climbs from the knotted-root landing.
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。蔦を巻いた梯子が上の階へ伸びている。
  - id: room.verdant.g2f.02
    name: Green Chamber 1
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 1
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.03
    name: Green Chamber 2
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 2
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.04
    name: Green Chamber 3
    description: A chamber where the canopy-light pools green on standing water.
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 翠の間 3
        description: 樹冠の光が水面に翠色を落とす間。
  - id: room.verdant.g2f.keep
    name: Bramble Warden
    description: A close, root-walled keep; the only way deeper passes through it.
    encounterSquad:
      - enemy.verdant.g2.bramble-shield
      - enemy.verdant.g2.spore-caster
    treasureTable: treasure.verdant.g2.keep
    # IMP-029 — a trapped chamber: clear the squad, then a snare-trapped chest bars the deeper way.
    chest:
      treasureTable: treasure.verdant.g2.keep
      trap:
        kind: snare
        difficulty: 16
        damage: 6
    locales:
      ja:
        name: 茨の番所
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g2f.exit
    name: Root Descent
    description: A vine-wrapped ladder drops through a gap in the roots.
    locales:
      ja:
        name: 根の下り
        description: 根の隙間から、蔦を巻いた梯子が下の階へ降りている。
  - id: room.verdant.g2f.gate
    name: Sealed Bar
    description: A heavy vine-bar can be lifted to open a shorter way down.
    gates:
      - id: gate.verdant.g2f.shortcut
        direction: north
        kind: shortcut
        grantsFlag: flag.verdant.g2f.shortcut
        clue: The bar lifts toward the deeper dark.
        locales:
          ja:
            clue: 横木は奥の闇へ向かって上がる。
    locales:
      ja:
        name: 封じの横木
        description: 重い蔦の横木。上げれば下りの近道が開く。
  - id: room.verdant.g2f.lift
    name: Lifted Vine
    description: Where the lifted vine-bar lets you out, close to the descent.
    locales:
      ja:
        name: 上がる蔦
        description: 上げた蔦の横木が抜ける先。下りのすぐ近く。
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
