---
id: dungeon.b5f
name: B5F - The Cinder Gate
level: 5
role: deep_route
recommendedPartyLevel: 3
# IMP-064: B5 is a deeper, cold ash layer, not an unreadable black screen. Keep the character of the
# descent in material colour and low, local light while reserving enough floor/wall separation to read a
# route, a threshold and a landmark at ordinary walking distance.
palette:
  ambient: "#3d3328"
  ambientEnergy: 0.82
  fog: "#20160f"
  fogDensity: 0.032
  torch: "#ffd4a0"
  torchRange: 10.5
  materialEmission: 0.22
  wall: "#8e7657"
  floor: "#695744"
  ceiling: "#4d4034"
tags:
  - block-2
  - shortcut
startRoom: room.b5f.001
map: |
  ###################
  #E..........#.....#
  ###.#####.#.#.###.#
  #...#.....#...#...#
  #.#####.#######.#.#
  #sS.#.B......C.##.#
  ###.#..####.#...###
  #....##......##...#
  ###.###.#######.###
  #.....D..A.##.F...#
  ###.#...#..##..##.#
  #...#.#..##...#...#
  #####.#.####..#.#.#
  #.....#.#.M...#.#.#
  #.##..###...#.###.#
  #...#....##.#.#...#
  #.#.###.###.#.#.#.#
  #1#..X#.#2..#.#...#
  ###################
symbols:
  1: room.b5f.nook1
  2: room.b5f.nook2
  E: room.b5f.001
  X: room.b5f.exit
  M: room.b5f.keep
  A: room.b5f.02
  B: room.b5f.03
  C: room.b5f.04
  D: room.b5f.05
  F: room.b5f.06
  s: room.b5f.gate
  S: room.b5f.lift
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
  - from: room.b5f.001
    direction: west
    kind: stairs
    to: room.b4f.exit
    targetFloorId: dungeon.b4f
  - from: room.b5f.exit
    direction: north
    kind: stairs
    to: room.b6f.001
    targetFloorId: dungeon.b6f
  - from: room.b5f.gate
    direction: east
    kind: secret
    to: room.b5f.lift
  - from: room.b5f.02
    direction: west
    kind: door
  - from: room.b5f.03
    direction: east
    kind: door
  - from: room.b5f.c14_6
    direction: east
    kind: door
  - from: room.b5f.04
    direction: west
    kind: door
  - from: room.b5f.c5_10
    direction: south
    kind: door
  - from: room.b5f.c5_9
    direction: west
    kind: door
  - from: room.b5f.c6_10
    direction: east
    kind: door
  - from: room.b5f.05
    direction: east
    kind: door
  - from: room.b5f.c13_10
    direction: south
    kind: door
  - from: room.b5f.06
    direction: east
    kind: door
  - from: room.b5f.c10_14
    direction: east
    kind: door
  - from: room.b5f.keep
    direction: east
    kind: door
rooms:
  - id: room.b5f.001
    name: Ash Landing
    description: A landing of cracked ash-stone; a stair climbs back toward the floor above.
    event: Cold ash-light pools on the landing; someone in the party marks the way down into The Cinder Gate.
    locales:
      ja:
        name: 灰の踊り場
        description: 灰石の踊り場。階段が上の階へと登っていく。
  - id: room.b5f.02
    name: Ash Chamber 1
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b5f.gate
    treasureTable: treasure.b5f.side
    locales:
      ja:
        name: 灰の間 1
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b5f.03
    name: Ash Chamber 2
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b5f.chamber2
      name: A pressure-plate snare
      damage: 8
      detectDc: 16
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b5f.gate
    treasureTable: treasure.b5f.side
    locales:
      ja:
        name: 灰の間 2
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b5f.04
    name: Ash Chamber 3
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b5f.gate
    treasureTable: treasure.b5f.side
    locales:
      ja:
        name: 灰の間 3
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b5f.05
    name: Ash Chamber 4
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b5f.chamber4
      name: A pressure-plate snare
      damage: 8
      detectDc: 16
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b5f.gate
    treasureTable: treasure.b5f.side
    locales:
      ja:
        name: 灰の間 4
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b5f.06
    name: Ash Chamber 5
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b5f.gate
    treasureTable: treasure.b5f.side
    locales:
      ja:
        name: 灰の間 5
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b5f.keep
    name: Cinder Keeper
    description: A close, ash-walled keep; the only way deeper passes through it.
    encounter:
      id: enemy.b5f.cinder-keeper
      name: Cinder Keeper
      hp: 22
      attack: 5
      role: miniboss
      isBoss: true
    chest:
      treasureTable: treasure.b5f.keeper
      trap:
        kind: snare
        difficulty: 18
        damage: 9
    locales:
      ja:
        name: 燠火の守り手
        description: 灰の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.b5f.exit
    name: Ash Descent
    description: A shaft drops toward the next depth; a chain of iron falls away below.
    locales:
      ja:
        name: 灰の下り
        description: 竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。
  - id: room.b5f.gate
    name: Suspect Wall
    description: A stretch of ash-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.b5f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.b5f.nook1
    name: Ash Niche 1
    description: A dead-end niche where something was left in the drift.
    chest:
      treasureTable: treasure.b5f.side
      trap:
        kind: snare
        difficulty: 16
        damage: 8
    locales:
      ja:
        name: 灰の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.b5f.nook2
    name: Ash Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b5f.side
    locales:
      ja:
        name: 灰の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# B5F - The Cinder Gate

An ashen descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
