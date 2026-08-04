---
id: dungeon.b3f
name: B3F - The Chain Descent
level: 3
role: deep_route
recommendedPartyLevel: 2
tags:
  - block-1
  - block-cap
startRoom: room.b3f.001
map: |
  ###################
  #E#...............#
  #.#.#####.#.##..###
  #.....#...#...#...#
  ##..###.###..######
  #...#.B...#..C....#
  #.###..######..##.#
  #....#....#.....#.#
  ##..#####.#.###.###
  #...#.sS.A.##.G...#
  #.###F.##..##...###
  #.....#.###...#...#
  ###.#.#.###.###.###
  #...#H...D.##.M...#
  ###.#...#...#...#.#
  #....##.#.#...#.#1#
  #..#..#.#.###.#.###
  #...#.#.#.#2..#..X#
  ###################
symbols:
  1: room.b3f.nook1
  2: room.b3f.nook2
  E: room.b3f.001
  X: room.b3f.exit
  M: room.b3f.keep
  A: room.b3f.02
  B: room.b3f.03
  C: room.b3f.04
  D: room.b3f.05
  F: room.b3f.06
  G: room.b3f.07
  H: room.b3f.08
  s: room.b3f.gate
  S: room.b3f.lift
corridor:
  name: Ashen Gallery
  description: An ash-choked passage; cold light seeps down from cracks far above.
  locales:
    ja:
      name: 灰の回廊
      description: 灰の詰まる通路。はるか頭上の裂け目から、冷たい光が差し込む。
edges:
  - from: room.b3f.001
    direction: west
    kind: stairs
    to: room.b2f.exit
    targetFloorId: dungeon.b2f
  - from: room.b3f.exit
    direction: north
    kind: stairs
    to: room.b4f.001
    targetFloorId: dungeon.b4f
  - from: room.b3f.gate
    direction: east
    kind: secret
    to: room.b3f.lift
  - from: room.b3f.02
    direction: west
    kind: door
  - from: room.b3f.02
    direction: north
    kind: door
  - from: room.b3f.c6_6
    direction: south
    kind: door
  - from: room.b3f.03
    direction: east
    kind: door
  - from: room.b3f.c14_6
    direction: south
    kind: door
  - from: room.b3f.c14_5
    direction: east
    kind: door
  - from: room.b3f.c13_6
    direction: south
    kind: door
  - from: room.b3f.04
    direction: west
    kind: door
  - from: room.b3f.c10_14
    direction: east
    kind: door
  - from: room.b3f.c9_14
    direction: south
    kind: door
  - from: room.b3f.05
    direction: west
    kind: door
  - from: room.b3f.06
    direction: south
    kind: door
  - from: room.b3f.c14_10
    direction: east
    kind: door
  - from: room.b3f.07
    direction: east
    kind: door
  - from: room.b3f.c13_10
    direction: south
    kind: door
  - from: room.b3f.c6_14
    direction: east
    kind: door
  - from: room.b3f.c6_13
    direction: east
    kind: door
  - from: room.b3f.08
    direction: north
    kind: door
  - from: room.b3f.c14_14
    direction: east
    kind: door
  - from: room.b3f.keep
    direction: east
    kind: door
  - from: room.b3f.c13_14
    direction: south
    kind: door
rooms:
  - id: room.b3f.001
    name: Ash Landing
    description: A landing of cracked ash-stone; a stair climbs back toward the floor above.
    event: Cold ash-light pools on the landing; someone in the party marks the way down into The Chain Descent.
    locales:
      ja:
        name: 灰の踊り場
        description: 灰石の踊り場。階段が上の階へと登っていく。
  - id: room.b3f.02
    name: Ash Chamber 1
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b3f.cistern
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の間 1
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b3f.03
    name: Ash Chamber 2
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b3f.chamber2
      name: A pressure-plate snare
      damage: 6
      detectDc: 14
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b3f.cistern
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の間 2
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b3f.04
    name: Ash Chamber 3
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b3f.cistern
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の間 3
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b3f.05
    name: Ash Chamber 4
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b3f.chamber4
      name: A pressure-plate snare
      damage: 6
      detectDc: 14
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b3f.cistern
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の間 4
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b3f.06
    name: Ash Chamber 5
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b3f.cistern
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の間 5
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b3f.07
    name: Ash Chamber 6
    description: A vaulted chamber where cold ash-light pools on the black stone.
    trap:
      id: trap.b3f.chamber6
      name: A pressure-plate snare
      damage: 6
      detectDc: 14
      warning: The floorstones here sit a hair proud, sprung to bite.
    chamberGuardian: true
    encounterTable: encounters.b3f.cistern
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の間 6
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b3f.08
    name: Ash Chamber 7
    description: A vaulted chamber where cold ash-light pools on the black stone.
    chamberGuardian: true
    encounterTable: encounters.b3f.cistern
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の間 7
        description: 冷たい灰光が黒石に淀む、天井の高い間。
  - id: room.b3f.keep
    name: Cistern Warden
    description: A close, ash-walled keep; the only way deeper passes through it.
    encounter:
      id: enemy.b3f.cistern-warden
      name: Cistern Warden
      hp: 17
      attack: 6
      role: miniboss
      isBoss: true
    chest:
      treasureTable: treasure.b3f.watermark
      trap:
        kind: snare
        difficulty: 16
        damage: 7
    locales:
      ja:
        name: 貯水の番人
        description: 灰の壁に囲まれた狭い番所。奥へはここを抜けるほかない。
  - id: room.b3f.exit
    name: Ash Descent
    description: A shaft drops toward the next depth; a chain of iron falls away below.
    restPoint: true
    locales:
      ja:
        name: 灰の下り
        description: 竪坑が次の深みへ落ちる。鉄の鎖が下へ垂れている。
  - id: room.b3f.gate
    name: Suspect Wall
    description: A stretch of ash-wall rings hollow — search here to reveal a hidden way down.
    locales:
      ja:
        name: 怪しい壁
        description: 灰の壁の一角が虚ろに響く。ここを調べれば、下りへの隠しみちが現れるかもしれない。
  - id: room.b3f.lift
    name: Hidden Passage
    description: A cramped passage behind the false wall, letting out close to the descent.
    locales:
      ja:
        name: 隠しみち
        description: 偽りの壁の奥の狭い抜け道。下りのすぐ近くへ通じている。
  - id: room.b3f.nook1
    name: Ash Niche 1
    description: A dead-end niche where something was left in the drift.
    chest:
      treasureTable: treasure.b3f.side
      trap:
        kind: snare
        difficulty: 14
        damage: 6
    locales:
      ja:
        name: 灰の窪み 1
        description: 吹き溜まりに何かが残された行き止まりの窪み。
  - id: room.b3f.nook2
    name: Ash Niche 2
    description: A dead-end niche where something was left in the drift.
    treasureTable: treasure.b3f.side
    locales:
      ja:
        name: 灰の窪み 2
        description: 吹き溜まりに何かが残された行き止まりの窪み。
---

# B3F - The Chain Descent

An ashen descent floor. Generated skeleton (V1); encounters/treasure tables in V2/V3.
