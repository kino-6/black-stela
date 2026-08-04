---
id: dungeon.b2f
name: B2F - The Branch Cisterns
level: 2
role: deep_route
recommendedPartyLevel: 2
recommendedPartySize: 3
tags:
  - block-1
  - shortcut
startRoom: room.b2f.001
map: |
  ###################
  #E........#.#.....#
  #.###.#...#.###.#.#
  #.#...#.#.........#
  #.###.#.#.#########
  #...#B.##....C....#
  #.#.#...#.#.#...###
  #.#..##.#.#..##...#
  #..######.#.###.###
  #....F.##A.##.G...#
  #...#..sS...#...###
  #.#..##.###.#.#...#
  ###.###.#####.###.#
  #...#.H..D.##M.##.#
  #.###..##..##...###
  #.#.....###...#..2#
  #.###.#########.###
  #...#.....#X.....1#
  ###################
symbols:
  1: room.b2f.nook1
  2: room.b2f.nook2
  E: room.b2f.001
  X: room.b2f.exit
  M: room.b2f.keep
  A: room.b2f.02
  B: room.b2f.03
  C: room.b2f.04
  D: room.b2f.05
  F: room.b2f.06
  G: room.b2f.07
  H: room.b2f.08
  s: room.b2f.gate
  S: room.b2f.lift
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
  - from: room.b2f.001
    direction: west
    kind: stairs
    to: room.b1f.012
    targetFloorId: dungeon.b1f
  - from: room.b2f.exit
    direction: west
    kind: stairs
    to: room.b3f.001
    targetFloorId: dungeon.b3f
  - from: room.b2f.gate
    direction: east
    kind: secret
    to: room.b2f.lift
  - from: room.b2f.c10_10
    direction: east
    kind: door
  - from: room.b2f.02
    direction: north
    kind: door
  - from: room.b2f.c6_6
    direction: east
    kind: door
  - from: room.b2f.03
    direction: north
    kind: door
  - from: room.b2f.c14_6
    direction: east
    kind: door
  - from: room.b2f.c14_5
    direction: east
    kind: door
  - from: room.b2f.04
    direction: west
    kind: door
  - from: room.b2f.05
    direction: west
    kind: door
  - from: room.b2f.c6_10
    direction: east
    kind: door
  - from: room.b2f.06
    direction: west
    kind: door
  - from: room.b2f.c13_10
    direction: south
    kind: door
  - from: room.b2f.c14_10
    direction: east
    kind: door
  - from: room.b2f.07
    direction: east
    kind: door
  - from: room.b2f.c5_14
    direction: south
    kind: door
  - from: room.b2f.c6_14
    direction: south
    kind: door
  - from: room.b2f.08
    direction: east
    kind: door
  - from: room.b2f.c14_14
    direction: east
    kind: door
  - from: room.b2f.c13_14
    direction: south
    kind: door
  - from: room.b2f.keep
    direction: north
    kind: door
rooms:
  - id: room.b2f.001
    name: Ash Landing
    description: A landing of cracked ash-stone; a stair climbs back toward the floor above.
    event: Cold ash-light pools on the landing; someone in the party marks the way down into The Branch Cisterns.
    locales:
      ja:
        name: 灰の踊り場
        description: 灰石の踊り場。階段が上の階へと登っていく。
  - id: room.b2f.02
    name: Ash Chamber 1
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b2f.branches
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の間 1
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b2f.03
    name: Ash Chamber 2
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b2f.chamber2
      name: A pressure-plate snare
      damage: 5
      detectDc: 13
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b2f.branches
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の間 2
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b2f.04
    name: Ash Chamber 3
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b2f.branches
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の間 3
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b2f.05
    name: Ash Chamber 4
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b2f.chamber4
      name: A pressure-plate snare
      damage: 5
      detectDc: 13
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b2f.branches
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の間 4
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b2f.06
    name: Ash Chamber 5
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b2f.branches
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の間 5
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b2f.07
    name: Ash Chamber 6
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b2f.chamber6
      name: A pressure-plate snare
      damage: 5
      detectDc: 13
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b2f.branches
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の間 6
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b2f.08
    name: Ash Chamber 7
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b2f.branches
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の間 7
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b2f.keep
    name: Deep Grove
    description: A quiet grove deep in the gallery.
    encounterTable: encounters.b2f.branches
    chest:
      treasureTable: treasure.b2f.risk
      trap:
        kind: snare
        difficulty: 15
        damage: 6
    locales:
      ja:
        name: 奥の木立
        description: 回廊の奥の静かな木立。
  - id: room.b2f.exit
    name: Ash Descent
    description: A shaft drops toward the next depth; a chain of iron falls away below.
    locales:
      ja:
        name: 灰の下り
        description: 竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。
  - id: room.b2f.gate
    name: Suspect Wall
    description: A stretch of ash-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.b2f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.b2f.nook1
    name: Ash Niche 1
    description: A dead-end niche where something was left in the drift.
    chest:
      treasureTable: treasure.b2f.cache
      trap:
        kind: snare
        difficulty: 13
        damage: 5
    locales:
      ja:
        name: 灰の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.b2f.nook2
    name: Ash Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b2f.cache
    locales:
      ja:
        name: 灰の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# B2F - The Branch Cisterns

An ashen descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
