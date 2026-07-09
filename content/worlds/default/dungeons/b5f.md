---
id: dungeon.b5f
name: B5F - Toll of Cinders
level: 5
role: midpoint_gate
dangerTier: 4
recommendedPartyLevel: 3
tags:
  - miniboss
  - shortcut
  - block-2
authorNotes: >-
  Midpoint gate on the full 20x20 frame. Two toll halls of cinder-drift flank the
  entry, each with a warren and a cache; the only way deeper is the Keeper's
  Niche, a one-wide choke where the Cinder Keeper takes its toll. Beyond it the
  Lifted Bar throws a long shortcut up to B2F and drops to B6F, and a walled vault
  hangs off it for the party that pays the price. Economy pressure by design.
startRoom: room.b5f.001
map: |
  ###################
  #E............#...#
  #.#####.#.###.###.#
  #.....#.#...#.....#
  #.#.#.###.###.#.#.#
  #.#..A..#....B..#.#
  #.#.#.###.###.#####
  #.#.....#.........#
  #.#.#.#.....###.###
  #.#.#.#..S....#...#
  #.######...##.###.#
  #.........#...#...#
  ###.#.###.#.###.#.#
  #...#.#..K....#.#T#
  #####.###.###.#.###
  #.........#V..#...#
  #.#####.#.#####.#M#
  #....P#.#.....#G#D#
  ###################
symbols:
  E: room.b5f.001
  M: room.b5f.002
  D: room.b5f.003
  A: room.b5f.004
  B: room.b5f.005
  P: room.b5f.006
  S: room.b5f.007
  K: room.b5f.008
  G: room.b5f.009
  V: room.b5f.010
  T: room.b5f.011
corridor:
  name: Toll Gallery
  description: A gallery of gray cinder-drift, finger bones ground into the grit underfoot.
  locales:
    ja:
      name: 灰税の回廊
      description: 灰色の燃え殻が吹き溜まる回廊。指骨が砂利に混じって踏み砕かれている。
edges:
  - from: room.b5f.001
    direction: west
    kind: stairs
    to: room.b4f.003
    targetFloorId: dungeon.b4f
  - from: room.b5f.003
    direction: west
    kind: shortcut
    to: room.b2f.001
    targetFloorId: dungeon.b2f
  - from: room.b5f.003
    direction: east
    kind: stairs
    to: room.b6f.001
    targetFloorId: dungeon.b6f
  - from: room.b5f.c17_12
    direction: south
    kind: secret
    to: room.b5f.011
rooms:
  - id: room.b5f.001
    name: Cinder Toll Hall
    description: A stone bowl sits on a pedestal, full of gray finger bones. Stairs climb west toward B4F; two toll halls open north and south.
    locales:
      ja:
        name: 灰税の広間
        description: 台座の石鉢には、灰色の指骨が満ちている。西の階段はB4Fへ上り、灰税の回廊が奥へ折れていく。
  - id: room.b5f.004
    name: North Toll Hall
    description: The upper toll hall, cinder-drift banked in the corners where the tithe-takers wait.
    locales:
      ja:
        name: 北の税の広間
        description: 上の灰税の広間。隅に燃え殻が吹き溜まり、徴収する者がその奥に潜む。
    encounterTable: encounters.b5f.gate
    treasureTable: treasure.b5f.side
  - id: room.b5f.005
    name: North Toll Cache
    description: A niche in the north hall where a coffer was left half-buried in ash.
    locales:
      ja:
        name: 北の税の隠し
        description: 北の広間の窪み。小箱が灰に半ば埋もれて残されている。
    treasureTable: treasure.b5f.side
  - id: room.b5f.006
    name: Ash-Dust Niche
    description: A dead-end niche off the north hall, a satchel abandoned in the drift.
    locales:
      ja:
        name: 灰塵の小間
        description: 北の広間から外れた行き止まりの小間。吹き溜まりに鞄が捨て置かれている。
    treasureTable: treasure.b1f.nook
  - id: room.b5f.002
    name: The Keeper's Niche
    description: A narrow statue blocks half the passage and watches the other half. The only way deeper passes under its gaze.
    locales:
      ja:
        name: 番人の龕
        description: 細い像が通路の半分を塞ぎ、残り半分を見張っている。奥へ続く道は、その視線の下を抜けるほかない。
    encounter:
      id: enemy.b5f.cinder-keeper
      name: Cinder Keeper
      hp: 14
      attack: 4
      role: miniboss
      dangerTier: 4
      isBoss: true
      tags:
        - midpoint
    treasureTable: treasure.b5f.keeper
  - id: room.b5f.003
    name: Lifted Bar
    description: A heavy bar can be lifted to make a shorter return route. Beyond it a walled vault stands sealed, and a chain falls to B6F.
    locales:
      ja:
        name: 上がる横木
        description: 重い横木を上げれば、帰り道は短くなる。その先に壁で囲まれた宝庫が待ち、B6Fへ鎖が落ちている。
    gates:
      - id: gate.b5f.mid-shortcut
        direction: west
        kind: shortcut
        grantsFlag: flag.b5f.mid-shortcut
        clue: The bar opens toward the upper dust.
        locales:
          ja:
            clue: 横木は上層の塵へ向かって開く。
  - id: room.b5f.010
    name: Toll Vault
    description: A walled vault beyond the lifted bar, its shelf stacked with what the Keeper's toll bought back.
    locales:
      ja:
        name: 税の宝庫
        description: 上がる横木の先の壁で囲まれた宝庫。棚には、番人の税が贖い戻したものが積まれている。
    treasureTable: treasure.b5f.side
  - id: room.b5f.007
    name: South Toll Hall
    description: The lower toll hall, where the drift is deepest and something patient stirs it.
    locales:
      ja:
        name: 南の税の広間
        description: 下の灰税の広間。吹き溜まりが最も深く、辛抱強い何かがそれをかき乱している。
    encounterTable: encounters.b5f.gate
    treasureTable: treasure.b5f.side
  - id: room.b5f.008
    name: South Toll Cache
    description: A low shelf in the south hall where a pouch was pressed into the cinder wall.
    locales:
      ja:
        name: 南の税の隠し
        description: 南の広間の低い棚。燃え殻の壁に小袋が押し込まれている。
    treasureTable: treasure.b5f.side
  - id: room.b5f.009
    name: Cinder Niche
    description: A dead-end pocket off the south hall, a bundle half-sunk in gray ash.
    locales:
      ja:
        name: 燃え殻の小間
        description: 南の広間から外れた行き止まりの窪み。灰色の灰に包みが半ば沈んでいる。
    treasureTable: treasure.b1f.nook
  - id: room.b5f.011
    name: Toll Cache
    description: A slot of dead air hides behind the north toll hall's east wall, its seam banked over with cold cinders — a cloth-bound cache rests within, richer than the open niches.
    locales:
      ja:
        name: 通行料の隠し宝処
        description: 北の関門の東壁の裏に、淀んだ空気の隙間が隠れている。継ぎ目は冷えた燃え殻に埋もれ、布に包まれた蓄えが中に置かれ、開けた小間よりも実り多い。
    treasureTable: treasure.b5f.secret
---

# B5F - Toll of Cinders

The scenario's midpoint commitment on the full 20x20 frame. Two toll halls of
cinder-drift flank the entry, each with a warren and a cache; the only way deeper
is the Keeper's Niche, a one-wide choke where the Cinder Keeper takes its toll.
Beyond it the Lifted Bar throws a long shortcut up to B2F and drops to B6F, and a
walled vault rewards the party that paid the price.
