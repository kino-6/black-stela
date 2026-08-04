---
id: dungeon.b7f
name: B7F - The Sealed Vaults
level: 7
role: deep_route
recommendedPartyLevel: 7
tags:
  - block-3
  - shortcut
startRoom: room.b7f.001
map: |
  ###################
  #E..#...#.......#.#
  ###.#.#####.###...#
  #...........#.....#
  ###.#.#.#.#########
  #...#B.##...#.....#
  #.#.#..##.#.#C.##.#
  #....##.........#.#
  #.#.#.#.###.###.###
  #.#.#.#.#..##.....#
  #.###.#.#A.#..#####
  #...#....s#.......#
  #.#..##.#S#.#######
  #.#.....#.M.......#
  ###.##..#..########
  #........#........#
  #.#.#.#######.###.#
  #.#.#...#X.....2#1#
  ###################
symbols:
  1: room.b7f.nook1
  2: room.b7f.nook2
  E: room.b7f.001
  X: room.b7f.exit
  M: room.b7f.keep
  A: room.b7f.02
  B: room.b7f.03
  C: room.b7f.04
  s: room.b7f.gate
  S: room.b7f.lift
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
  - from: room.b7f.001
    direction: west
    kind: stairs
    to: room.b6f.exit
    targetFloorId: dungeon.b6f
  - from: room.b7f.exit
    direction: west
    kind: stairs
    to: room.b8f.001
    targetFloorId: dungeon.b8f
  - from: room.b7f.gate
    direction: south
    kind: secret
    to: room.b7f.lift
  - from: room.b7f.02
    direction: south
    kind: door
  - from: room.b7f.03
    direction: north
    kind: door
  - from: room.b7f.c14_5
    direction: east
    kind: door
  - from: room.b7f.c14_6
    direction: south
    kind: door
  - from: room.b7f.04
    direction: south
    kind: door
  - from: room.b7f.c10_14
    direction: south
    kind: door
  - from: room.b7f.keep
    direction: east
    kind: door
rooms:
  - id: room.b7f.001
    name: Ash Landing
    description: A landing of cracked ash-stone; a stair climbs back toward the floor above.
    event: Cold ash-light pools on the landing; someone in the party marks the way down into The Sealed Vaults.
    locales:
      ja:
        name: 灰の踊り場
        description: 灰石の踊り場。階段が上の階へと登っていく。
  - id: room.b7f.02
    name: Ash Chamber 1
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b7f.vaults
    treasureTable: treasure.b7f.side
    locales:
      ja:
        name: 灰の間 1
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b7f.03
    name: Ash Chamber 2
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b7f.chamber2
      name: A pressure-plate snare
      damage: 10
      detectDc: 18
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b7f.vaults
    treasureTable: treasure.b7f.side
    locales:
      ja:
        name: 灰の間 2
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b7f.04
    name: Ash Chamber 3
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b7f.vaults
    treasureTable: treasure.b7f.side
    locales:
      ja:
        name: 灰の間 3
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b7f.keep
    name: Deep Grove
    description: A quiet grove deep in the gallery.
    encounterTable: encounters.b7f.vaults
    chest:
      treasureTable: treasure.b7f.rare
      trap:
        kind: snare
        difficulty: 20
        damage: 11
    locales:
      ja:
        name: 奥の木立
        description: 回廊の奥の静かな木立。
  - id: room.b7f.exit
    name: Ash Descent
    description: A shaft drops toward the next depth; a chain of iron falls away below.
    locales:
      ja:
        name: 灰の下り
        description: 竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。
  - id: room.b7f.gate
    name: Suspect Wall
    description: A stretch of ash-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.b7f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.b7f.nook1
    name: Ash Niche 1
    description: A dead-end niche where something was left in the drift.
    chest:
      treasureTable: treasure.b7f.side
      trap:
        kind: snare
        difficulty: 18
        damage: 10
    locales:
      ja:
        name: 灰の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.b7f.nook2
    name: Ash Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b7f.side
    locales:
      ja:
        name: 灰の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# B7F - The Sealed Vaults

An ashen descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
