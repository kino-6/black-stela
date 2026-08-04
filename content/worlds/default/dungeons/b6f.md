---
id: dungeon.b6f
name: B6F - The Oathvault
level: 6
role: deep_route
recommendedPartyLevel: 3
tags:
  - block-2
  - block-cap
startRoom: room.b6f.001
map: |
  ###################
  #E......#.......#.#
  #.#...###.###.#...#
  #.#.#.....#...#...#
  ###.#####.#######.#
  #....B.##....C.#..#
  #.###..######...###
  #....#....#...#...#
  #.#######.#.###.#.#
  #.#....##A.##.F.#.#
  #.###.M.#..##..##.#
  #.#...#...#.....#.#
  #.#####.#.###.#####
  #...#...#D.#.....1#
  #.###...#..####.###
  #...#....#....#..X#
  #####.#.#####.##S##
  #2....#...#.....s.#
  ###################
symbols:
  1: room.b6f.nook1
  2: room.b6f.nook2
  E: room.b6f.001
  X: room.b6f.exit
  M: room.b6f.keep
  A: room.b6f.02
  B: room.b6f.03
  C: room.b6f.04
  D: room.b6f.05
  F: room.b6f.06
  s: room.b6f.gate
  S: room.b6f.lift
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
  - from: room.b6f.001
    direction: west
    kind: stairs
    to: room.b5f.exit
    targetFloorId: dungeon.b5f
  - from: room.b6f.exit
    direction: north
    kind: stairs
    to: room.b7f.001
    targetFloorId: dungeon.b7f
  - from: room.b6f.gate
    direction: north
    kind: secret
    to: room.b6f.lift
  - from: room.b6f.c9_10
    direction: south
    kind: door
  - from: room.b6f.02
    direction: north
    kind: door
  - from: room.b6f.c6_6
    direction: south
    kind: door
  - from: room.b6f.03
    direction: west
    kind: door
  - from: room.b6f.c14_6
    direction: east
    kind: door
  - from: room.b6f.c13_6
    direction: south
    kind: door
  - from: room.b6f.04
    direction: west
    kind: door
  - from: room.b6f.c10_14
    direction: south
    kind: door
  - from: room.b6f.05
    direction: north
    kind: door
  - from: room.b6f.c13_10
    direction: south
    kind: door
  - from: room.b6f.c14_10
    direction: south
    kind: door
  - from: room.b6f.06
    direction: east
    kind: door
  - from: room.b6f.c5_9
    direction: west
    kind: door
  - from: room.b6f.c5_10
    direction: south
    kind: door
  - from: room.b6f.keep
    direction: east
    kind: door
rooms:
  - id: room.b6f.001
    name: Ash Landing
    description: A landing of cracked ash-stone; a stair climbs back toward the floor above.
    event: Cold ash-light pools on the landing; someone in the party marks the way down into The Oathvault.
    locales:
      ja:
        name: 灰の踊り場
        description: 灰石の踊り場。階段が上の階へと登っていく。
  - id: room.b6f.02
    name: Ash Chamber 1
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b6f.oaths
    treasureTable: treasure.b6f.side
    locales:
      ja:
        name: 灰の間 1
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b6f.03
    name: Ash Chamber 2
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b6f.chamber2
      name: A pressure-plate snare
      damage: 9
      detectDc: 17
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b6f.oaths
    treasureTable: treasure.b6f.side
    locales:
      ja:
        name: 灰の間 2
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b6f.04
    name: Ash Chamber 3
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b6f.oaths
    treasureTable: treasure.b6f.side
    locales:
      ja:
        name: 灰の間 3
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b6f.05
    name: Ash Chamber 4
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b6f.chamber4
      name: A pressure-plate snare
      damage: 9
      detectDc: 17
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b6f.oaths
    treasureTable: treasure.b6f.side
    locales:
      ja:
        name: 灰の間 4
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b6f.06
    name: Ash Chamber 5
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b6f.oaths
    treasureTable: treasure.b6f.side
    locales:
      ja:
        name: 灰の間 5
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b6f.keep
    name: Oath Warden
    description: A close, ash-walled keep; the only way deeper passes through it.
    encounter:
      id: enemy.b6f.oath-warden
      name: Oath Warden
      hp: 26
      attack: 8
      role: miniboss
      isBoss: true
    chest:
      treasureTable: treasure.b6f.oaths
      trap:
        kind: snare
        difficulty: 19
        damage: 10
    locales:
      ja:
        name: 誓いの番人
        description: 灰の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.b6f.exit
    name: Ash Descent
    description: A shaft drops toward the next depth; a chain of iron falls away below.
    restPoint: true
    locales:
      ja:
        name: 灰の下り
        description: 竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。
  - id: room.b6f.gate
    name: Suspect Wall
    description: A stretch of ash-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.b6f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.b6f.nook1
    name: Ash Niche 1
    description: A dead-end niche where something was left in the drift.
    chest:
      treasureTable: treasure.b6f.side
      trap:
        kind: snare
        difficulty: 17
        damage: 9
    locales:
      ja:
        name: 灰の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.b6f.nook2
    name: Ash Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b6f.side
    locales:
      ja:
        name: 灰の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# B6F - The Oathvault

An ashen descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
