---
id: dungeon.verdant.g2f
name: G2F - Spore Drift
locales:
  ja:
    name: G2F・胞子溜まり
level: 2
recommendedPartyLevel: 1
tags:
  - miniboss
  - shortcut
startRoom: room.verdant.g2f.001
map: |
  ###################
  #E#.............#.#
  #...##..###.###.#.#
  #...#.....#.......#
  #.#######.#.#####.#
  #.#.#B.#..#..C.##.#
  #.#....######..####
  #....#..#.........#
  #.##.########.#####
  #...#D...A.##F....#
  #.#.#..##..##..##.#
  #.#......##...#2#.#
  ###.#########.#.###
  #...#G.##M...H....#
  #.#.#..##..#...##.#
  #.#...#...#..##1..#
  #.###.#S#########.#
  #.#....s....#X....#
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
    direction: north
    kind: secret
    to: room.verdant.g2f.lift
  - from: room.verdant.g2f.02
    direction: west
    kind: door
  - from: room.verdant.g2f.c6_6
    direction: south
    kind: door
  - from: room.verdant.g2f.c5_6
    direction: west
    kind: door
  - from: room.verdant.g2f.c14_6
    direction: south
    kind: door
  - from: room.verdant.g2f.c13_6
    direction: south
    kind: door
  - from: room.verdant.g2f.04
    direction: west
    kind: door
  - from: room.verdant.g2f.c6_10
    direction: south
    kind: door
  - from: room.verdant.g2f.c6_9
    direction: east
    kind: door
  - from: room.verdant.g2f.c5_10
    direction: south
    kind: door
  - from: room.verdant.g2f.c14_9
    direction: east
    kind: door
  - from: room.verdant.g2f.c13_10
    direction: south
    kind: door
  - from: room.verdant.g2f.06
    direction: north
    kind: door
  - from: room.verdant.g2f.c5_14
    direction: south
    kind: door
  - from: room.verdant.g2f.c14_13
    direction: east
    kind: door
  - from: room.verdant.g2f.c13_14
    direction: west
    kind: door
  - from: room.verdant.g2f.08
    direction: west
    kind: door
  - from: room.verdant.g2f.08
    direction: north
    kind: door
  - from: room.verdant.g2f.c9_14
    direction: south
    kind: door
  - from: room.verdant.g2f.c10_13
    direction: east
    kind: door
rooms:
  - id: room.verdant.g2f.001
    name: Root Landing
    description: A landing of knotted roots; a stair climbs back toward the floor above.
    locales:
      ja:
        name: 根の踊り場
        description: 根の絡む踊り場。階段が上の階へと登っていく。
  - id: room.verdant.g2f.02
    name: Standing Pool
    description: Green canopy-light pools on black standing water; the air is thick with drifting spores.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 淀みの間
        description: 黒い溜まり水に樹冠の翠光が落ち、胞子が濃く漂う間。
  - id: room.verdant.g2f.03
    name: Spore Bed
    description: A soft floor of packed fungus — every step puffs a cloud that stings the eyes.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    chest:
      treasureTable: treasure.verdant.g2.side
      trap:
        kind: snare
        difficulty: 13
        damage: 5
    locales:
      ja:
        name: 胞子の苗床
        description: 菌糸が敷き詰まった柔らかな床。踏むたび目を刺す胞子が舞う。
  - id: room.verdant.g2f.04
    name: Root Arch
    description: Buttress roots vault overhead like ribs; the drift thins where they drink the damp.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 梁根の拱廊
        description: 梁のような支根が頭上に架かり、湿気を吸う根元だけ靄が薄い。
  - id: room.verdant.g2f.05
    name: Sunken Cistern
    description: A collapsed cistern half-full of green water; something bright glints under the surface.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    chest:
      treasureTable: treasure.verdant.g2.side
      trap:
        kind: snare
        difficulty: 13
        damage: 5
    locales:
      ja:
        name: 沈み水槽
        description: 崩れた水槽に翠水が半ば満ち、水面下で何かが光る。
  - id: room.verdant.g2f.06
    name: Haze Hall
    description: The spore-haze hangs so still it seems solid; sound dies a pace from your mouth.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 靄籠りの広間
        description: 胞子の靄が固まって見えるほど淀み、声は一歩で消える。
  - id: room.verdant.g2f.07
    name: Fungal Vault
    description: Shelf-fungus tiers the walls to the ceiling; a dry cache sits at the top shelf.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    chest:
      treasureTable: treasure.verdant.g2.side
      trap:
        kind: snare
        difficulty: 13
        damage: 5
    locales:
      ja:
        name: 茸棚の蔵
        description: 棚茸が壁を天井まで段に覆い、最上段に乾いた隠し物がある。
  - id: room.verdant.g2f.08
    name: Still Water
    description: No drift here — only mirror-flat water and the drip that measures the dark.
    chamberGuardian: true
    encounterTable: encounters.verdant.g2.pack
    treasureTable: treasure.verdant.g2.side
    locales:
      ja:
        name: 静水の間
        description: 靄はなく、鏡のような水面と闇を刻む滴だけがある間。
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
