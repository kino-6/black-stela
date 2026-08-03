---
id: dungeon.b9f
name: B9F - Votary's Sanctum
level: 9
role: deep_route
recommendedPartyLevel: 8
tags:
  - block-3
  - block-cap
startRoom: room.b9f.001
map: |
  ###################
  #E......#...#.....#
  #.#.#.###.###.#####
  #.#.#.............#
  #.#.#####.#.####..#
  #...#..#..#..C.#..#
  #.###B.####.#..#.##
  #.#...#.....###...#
  #.#.#.#######.##..#
  #...#....A.##.....#
  #.#.###.#..###..#.#
  #.#.#....##.....#.#
  #..##.#####.#.###.#
  #...#.#...M.#.#...#
  #####.#S#...###.#.#
  #......s###.#2..#.#
  #.#########.#####.#
  #........X#....1#.#
  ###################
symbols:
  1: room.b9f.nook1
  2: room.b9f.nook2
  E: room.b9f.001
  X: room.b9f.exit
  M: room.b9f.keep
  A: room.b9f.02
  B: room.b9f.03
  C: room.b9f.04
  s: room.b9f.gate
  S: room.b9f.lift
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
  - from: room.b9f.001
    direction: west
    kind: stairs
    to: room.b8f.exit
    targetFloorId: dungeon.b8f
  - from: room.b9f.exit
    direction: north
    kind: stairs
    to: room.b10f.001
    targetFloorId: dungeon.b10f
  - from: room.b9f.gate
    direction: north
    kind: secret
    to: room.b9f.lift
  - from: room.b9f.02
    direction: west
    kind: door
  - from: room.b9f.03
    direction: south
    kind: door
  - from: room.b9f.04
    direction: west
    kind: door
  - from: room.b9f.c9_13
    direction: west
    kind: door
  - from: room.b9f.c10_14
    direction: east
    kind: door
  - from: room.b9f.keep
    direction: east
    kind: door
rooms:
  - id: room.b9f.001
    name: Ash Landing
    description: A landing of cracked ash-stone; a stair climbs back toward the floor above.
    locales:
      ja:
        name: 灰の踊り場
        description: 灰石の踊り場。階段が上の階へと登っていく。
  - id: room.b9f.02
    name: Ash Chamber 1
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b9f.chambers
    treasureTable: treasure.b9f.side
    locales:
      ja:
        name: 灰の間 1
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b9f.03
    name: Ash Chamber 2
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b9f.chambers
    chest:
      treasureTable: treasure.b9f.side
      trap:
        kind: snare
        difficulty: 20
        damage: 12
    locales:
      ja:
        name: 灰の間 2
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b9f.04
    name: Ash Chamber 3
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b9f.chambers
    treasureTable: treasure.b9f.side
    locales:
      ja:
        name: 灰の間 3
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b9f.keep
    name: Ash Votary
    description: A close, ash-walled keep; the only way deeper passes through it.
    encounter:
      id: enemy.b8f.ash-votary
      name: Ash Votary
      hp: 28
      attack: 6
      role: boss
      isBoss: true
    chest:
      treasureTable: treasure.b9f.keep
      trap:
        kind: snare
        difficulty: 22
        damage: 13
    locales:
      ja:
        name: 灰の奉者
        description: 灰の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.b9f.exit
    name: Ash Descent
    description: A shaft drops toward the next depth; a chain of iron falls away below.
    locales:
      ja:
        name: 灰の下り
        description: 竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。
  - id: room.b9f.gate
    name: Suspect Wall
    description: A stretch of ash-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.b9f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.b9f.nook1
    name: Ash Niche 1
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b9f.side
    locales:
      ja:
        name: 灰の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.b9f.nook2
    name: Ash Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b9f.side
    locales:
      ja:
        name: 灰の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# B9F - Votary's Sanctum

An ashen descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
