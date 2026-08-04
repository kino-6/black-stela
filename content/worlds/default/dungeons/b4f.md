---
id: dungeon.b4f
name: B4F - The Dark Gallery
level: 4
role: deep_route
recommendedPartyLevel: 2
tags:
  - block-2
  - shortcut
startRoom: room.b4f.001
map: |
  ###################
  #E......#.#...#.#.#
  #.###.#.#.###.#.#.#
  #...#.#...........#
  ###.#.#####..####.#
  #...#B.##....C.##.#
  #.###...#.###..####
  #...#.#.#.#..s#...#
  #.###.#######S#X#.#
  #.#..F.##..##..##.#
  #.###..##.A##.M.#.#
  #....#...#..###...#
  #.########.####.###
  #........D.#......#
  ###...###..##.#.#.#
  #...#...#.#...#.#.#
  #.#.###.#...###...#
  #.#.#...#.....#2#1#
  ###################
symbols:
  1: room.b4f.nook1
  2: room.b4f.nook2
  E: room.b4f.001
  X: room.b4f.exit
  M: room.b4f.keep
  A: room.b4f.02
  B: room.b4f.03
  C: room.b4f.04
  D: room.b4f.05
  F: room.b4f.06
  s: room.b4f.gate
  S: room.b4f.lift
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
  - from: room.b4f.001
    direction: west
    kind: stairs
    to: room.b3f.exit
    targetFloorId: dungeon.b3f
  - from: room.b4f.exit
    direction: west
    kind: stairs
    to: room.b5f.001
    targetFloorId: dungeon.b5f
  - from: room.b4f.gate
    direction: south
    kind: secret
    to: room.b4f.lift
  - from: room.b4f.02
    direction: south
    kind: door
  - from: room.b4f.c6_6
    direction: east
    kind: door
  - from: room.b4f.c5_6
    direction: south
    kind: door
  - from: room.b4f.03
    direction: north
    kind: door
  - from: room.b4f.c13_6
    direction: south
    kind: door
  - from: room.b4f.04
    direction: west
    kind: door
  - from: room.b4f.c10_13
    direction: north
    kind: door
  - from: room.b4f.c9_14
    direction: south
    kind: door
  - from: room.b4f.05
    direction: west
    kind: door
  - from: room.b4f.c6_10
    direction: south
    kind: door
  - from: room.b4f.06
    direction: west
    kind: door
  - from: room.b4f.06
    direction: north
    kind: door
  - from: room.b4f.keep
    direction: east
    kind: door
rooms:
  - id: room.b4f.001
    name: Ash Landing
    description: A landing of cracked ash-stone; a stair climbs back toward the floor above.
    event: Cold ash-light pools on the landing; someone in the party marks the way down into The Dark Gallery.
    locales:
      ja:
        name: 灰の踊り場
        description: 灰石の踊り場。階段が上の階へと登っていく。
  - id: room.b4f.02
    name: Ash Chamber 1
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b4f.dark
    treasureTable: treasure.b4f.side
    locales:
      ja:
        name: 灰の間 1
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b4f.03
    name: Ash Chamber 2
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b4f.chamber2
      name: A pressure-plate snare
      damage: 7
      detectDc: 15
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b4f.dark
    treasureTable: treasure.b4f.side
    locales:
      ja:
        name: 灰の間 2
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b4f.04
    name: Ash Chamber 3
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b4f.dark
    treasureTable: treasure.b4f.side
    locales:
      ja:
        name: 灰の間 3
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b4f.05
    name: Ash Chamber 4
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b4f.chamber4
      name: A pressure-plate snare
      damage: 7
      detectDc: 15
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b4f.dark
    treasureTable: treasure.b4f.side
    locales:
      ja:
        name: 灰の間 4
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b4f.06
    name: Ash Chamber 5
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b4f.dark
    treasureTable: treasure.b4f.side
    locales:
      ja:
        name: 灰の間 5
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b4f.keep
    name: Deep Grove
    description: A quiet grove deep in the gallery.
    encounterTable: encounters.b4f.dark
    chest:
      treasureTable: treasure.b4f.dark
      trap:
        kind: snare
        difficulty: 17
        damage: 8
    locales:
      ja:
        name: 奥の木立
        description: 回廊の奥の静かな木立。
  - id: room.b4f.exit
    name: Ash Descent
    description: A shaft drops toward the next depth; a chain of iron falls away below.
    locales:
      ja:
        name: 灰の下り
        description: 竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。
  - id: room.b4f.gate
    name: Suspect Wall
    description: A stretch of ash-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.b4f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.b4f.nook1
    name: Ash Niche 1
    description: A dead-end niche where something was left in the drift.
    chest:
      treasureTable: treasure.b4f.side
      trap:
        kind: snare
        difficulty: 15
        damage: 7
    locales:
      ja:
        name: 灰の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.b4f.nook2
    name: Ash Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b4f.side
    locales:
      ja:
        name: 灰の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# B4F - The Dark Gallery

An ashen descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
