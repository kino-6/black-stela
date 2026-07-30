---
id: dungeon.verdant.g3f
name: G3F - Pollen Cistern
locales:
  ja:
    name: G3F・花粉の水槽
level: 3
recommendedPartyLevel: 2
tags:
  - miniboss
  - shortcut
startRoom: room.verdant.g3f.001
map: |
  ###################
  #E....#.......#...#
  ###.#.#.#.###.###.#
  #...#.......#.....#
  ###.#####.#.#####.#
  #....B.##.#..C.#..#
  ###.#..##.###..##.#
  #....#..#...###.#.#
  #.######..#.###.#.#
  #....D.##A.##F..#.#
  ###.#..##..##...#.#
  #....#..##..###...#
  #.#.###########.###
  #.#.#G.##M.##H....#
  #.###..##......####
  #...#..s###.##....#
  ###.#.#S#...#..##.#
  #.....#X....#2#1..#
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
  D: room.verdant.g3f.05
  F: room.verdant.g3f.06
  G: room.verdant.g3f.07
  H: room.verdant.g3f.08
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
    direction: south
    kind: secret
    to: room.verdant.g3f.lift
  - from: room.verdant.g3f.c10_10
    direction: south
    kind: door
  - from: room.verdant.g3f.02
    direction: north
    kind: door
  - from: room.verdant.g3f.c6_6
    direction: south
    kind: door
  - from: room.verdant.g3f.03
    direction: west
    kind: door
  - from: room.verdant.g3f.04
    direction: west
    kind: door
  - from: room.verdant.g3f.c6_10
    direction: south
    kind: door
  - from: room.verdant.g3f.05
    direction: west
    kind: door
  - from: room.verdant.g3f.c14_9
    direction: east
    kind: door
  - from: room.verdant.g3f.c14_10
    direction: east
    kind: door
  - from: room.verdant.g3f.c6_14
    direction: south
    kind: door
  - from: room.verdant.g3f.c5_14
    direction: south
    kind: door
  - from: room.verdant.g3f.c13_14
    direction: west
    kind: door
  - from: room.verdant.g3f.c14_14
    direction: south
    kind: door
  - from: room.verdant.g3f.c14_13
    direction: east
    kind: door
  - from: room.verdant.g3f.c10_14
    direction: east
    kind: door
rooms:
  - id: room.verdant.g3f.001
    name: Root Landing
    description: A landing of knotted roots; a stair climbs back toward the floor above.
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。階段が上の階へと登っていく。
  - id: room.verdant.g3f.02
    name: Pollen Drift
    description: Yellow pollen sifts down through the canopy and settles on the still green water.
    chamberGuardian: true
    encounterTable: encounters.verdant.g3.pack
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 花粉溜まりの間
        description: 樹冠から黄の花粉が降り、淀む翠水の上に厚く積もる間。
  - id: room.verdant.g3f.03
    name: Sunken Reservoir
    description: A drowned reservoir; drowned shelving juts from the water, and one shelf still holds a box.
    chamberGuardian: true
    encounterTable: encounters.verdant.g3.pack
    chest:
      treasureTable: treasure.verdant.g3.side
      trap:
        kind: snare
        difficulty: 14
        damage: 6
    locales:
      ja:
        name: 沈んだ貯水室
        description: 水没した貯水室。棚が水面から突き出し、一段に箱が残る。
  - id: room.verdant.g3f.04
    name: Golden Haze
    description: The pollen hangs so dense it glows gold in the canopy-light — and clogs every breath.
    chamberGuardian: true
    encounterTable: encounters.verdant.g3.pack
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 黄金の靄の間
        description: 花粉が濃く、樹冠の光に金色に燃え、呼吸を詰まらせる間。
  - id: room.verdant.g3f.05
    name: Mossed Conduit
    description: A broken feed-pipe furred with moss; a dry alcove behind it kept something safe.
    chamberGuardian: true
    encounterTable: encounters.verdant.g3.pack
    chest:
      treasureTable: treasure.verdant.g3.side
      trap:
        kind: snare
        difficulty: 14
        damage: 6
    locales:
      ja:
        name: 苔生す導管
        description: 苔むした破れた送水管。その裏の乾いた窪みが何かを守っていた。
  - id: room.verdant.g3f.06
    name: Overflow Hall
    description: Water spills in a slow sheet across the floor and vanishes into unseen drains.
    chamberGuardian: true
    encounterTable: encounters.verdant.g3.pack
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 溢水の広間
        description: 床を薄く水が流れ、見えぬ排水へと消えていく広間。
  - id: room.verdant.g3f.07
    name: Pollen Cache
    description: Pollen has drifted into a dune against the far wall, half-burying a strongbox.
    chamberGuardian: true
    encounterTable: encounters.verdant.g3.pack
    chest:
      treasureTable: treasure.verdant.g3.side
      trap:
        kind: snare
        difficulty: 14
        damage: 6
    locales:
      ja:
        name: 花粉の蔵
        description: 奥壁に花粉が吹き溜まって丘をなし、金庫を半ば埋めている。
  - id: room.verdant.g3f.08
    name: Dry Cistern
    description: The one tank that never filled — cracked, empty, and silent but for the drip.
    chamberGuardian: true
    encounterTable: encounters.verdant.g3.pack
    treasureTable: treasure.verdant.g3.side
    locales:
      ja:
        name: 涸れ水槽の間
        description: 満ちなかった唯一の槽。ひび割れ、空で、滴の音だけが響く間。
  - id: room.verdant.g3f.keep
    name: Bloom Warden
    description: A close, root-walled keep; the only way deeper passes through it.
    encounterTable: encounters.verdant.g3.keep
    chest:
      treasureTable: treasure.verdant.g3.keep
      trap:
        kind: snare
        difficulty: 16
        damage: 7
    locales:
      ja:
        name: 花守り
        description: 根の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.verdant.g3f.exit
    name: Root Descent
    description: Roots twist down toward the next depth; a chain of vine falls away below.
    locales:
      ja:
        name: 根の下り
        description: 根が次の深みへとねじれ落ちる。蔦の鎖が下へ垂れている。
  - id: room.verdant.g3f.gate
    name: Suspect Wall
    description: A stretch of root-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 根の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.verdant.g3f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
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
