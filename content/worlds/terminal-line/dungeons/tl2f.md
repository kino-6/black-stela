---
id: dungeon.tl2f
name: F2 - Flooded Platforms
locales: { ja: { name: F2・浸水ホーム } }
level: 2
role: attrition
dangerTier: 2
recommendedPartyLevel: 2
recommendedPartySize: 3
recommendedClearLevel: 3
tags: [branching, transit, block-1]
authorNotes: >-
  A 19x19 rod-falling maze, seed 20260805, with four carved platform and maintenance chambers.
  The landing is safe; the looped platform, a power terminal, and a sealed office make supplies and
  exploration worth a full sweep. The up stair is visible and the emergency call point gives a town return.
startRoom: room.tl2f.platform-landing
map: |
  ###################
  #E#.......#.....#.#
  #.#.#.###.###.###.#
  #a..#...#.........#
  ###.#.###.###.###.#
  #....F....#..M....#
  #.###.#######.###.#
  #...........#P#L..#
  #.#####....##.#####
  #.....#..H..#.....#
  ###.#.#.....###.#.#
  #...#.#...#...#.#U#
  #.#####.#.#.#######
  #...#....T........#
  ###.###.#.#####.###
  #...#.........#..K#
  #.#####.###.###.###
  #..C#.....#...#D.R#
  ###################
symbols:
  E: room.tl2f.platform-landing
  a: room.tl2f.platform-bay
  F: room.tl2f.floodgate-loop
  M: room.tl2f.maintenance-locker
  P: room.tl2f.sealed-platform-office
  L: room.tl2f.lost-luggage
  H: room.tl2f.hound-run
  T: room.tl2f.power-terminal
  K: room.tl2f.dry-cache
  C: room.tl2f.cable-culvert
  U: room.tl2f.up-stair
  D: room.tl2f.down-stair
  R: room.tl2f.return-marker
corridor:
  name: Flooded Platform Passage
  description: Water mirrors the dead platform lamps. The rail trench is hidden beneath a sheet of black water.
  locales:
    ja:
      name: 浸水ホーム通路
      description: 水面に消えたホーム灯が映る。線路溝は黒い水の下に隠れ、足元の音だけが先へ走る。
edges:
  - { from: room.tl2f.up-stair, direction: east, kind: stairs, to: room.tl1f.down-stair, targetFloorId: dungeon.tl1f }
  - { from: room.tl2f.down-stair, direction: north, kind: stairs, to: room.tl3f.transfer-landing, targetFloorId: dungeon.tl3f }
rooms:
  - id: room.tl2f.platform-landing
    name: Lower Platform Landing
    description: The stair arrives above a drowned platform. Water slaps softly against a row of empty benches.
    locales: { ja: { name: 下層ホームの踊り場, description: 階段は水没したホームの上に着く。空のベンチ列へ、水が小さく当たっている。 } }
  - id: room.tl2f.platform-bay
    name: Platform Bay
    description: A narrow dry strip runs along the wall while the open platform floods to the east. Cable hounds use the edge for cover.
    locales: { ja: { name: ホーム脇の通路, description: 壁際だけが細く乾き、東のホームは水に沈む。配線犬はその境目を使って近づいてくる。 } }
    encounterTable: encounters.tl2f.platform
  - id: room.tl2f.floodgate-loop
    name: Floodgate Loop
    description: A broken floodgate has left two routes around the platform. One stays shallow; the other passes the supply lockers.
    locales: { ja: { name: 防潮扉の輪, description: 壊れた防潮扉のため、ホームを回る道が二つに分かれる。浅い道と、補給ロッカーを通る道だ。 } }
    encounterTable: encounters.tl2f.platform
  - id: room.tl2f.maintenance-locker
    name: Maintenance Locker
    description: A row of sealed metal lockers stands above the water. One still holds a fuse and emergency dressings.
    locales: { ja: { name: 保守ロッカー, description: 水位より高いところに、封をされた金属ロッカーが並ぶ。一つだけにヒューズと応急用品が残っている。 } }
    treasureTable: treasure.tl2f.platform-cache
    event: A maintained locker is an authored supply point; alert reduction connects when W3a is complete.
  - id: room.tl2f.sealed-platform-office
    name: Sealed Platform Office
    description: A small office is sealed behind a thick service door, not a fortress gate. Its lock is tied to the power terminal nearby.
    locales: { ja: { name: 封鎖ホーム事務所, description: 小さな事務所が厚い保守扉の奥に封じられている。要塞の門ではない。近くの電源端末と錠がつながっている。 } }
    chest: { treasureTable: treasure.tl2f.sealed-cache, lock: { difficulty: 12 }, trap: { kind: snare, difficulty: 12, damage: 5 } }
    gates:
      - id: gate.tl2f.office-power
        kind: lock
        requiredFlag: flag.tl2f.office-seal
        clue: The office seal listens for a maintenance-terminal acknowledgement.
        locales: { ja: { clue: 事務所の封印は、保守端末からの応答を待っている。 } }
  - id: room.tl2f.lost-luggage
    name: Lost Luggage Bay
    description: A luggage cart has tipped into the water. The dry cases at its top are worth searching.
    locales: { ja: { name: 遺失手荷物置場, description: 荷物台車が水に倒れ込んでいる。上に残った乾いた鞄には、探す価値がある。 } }
    chest: { treasureTable: treasure.tl2f.platform-cache, trap: { kind: gas, difficulty: 11, damage: 4 } }
  - id: room.tl2f.hound-run
    name: Cable Hound Run
    description: Ceramic teeth scrape the platform tiles. The hounds have chewed a quick route through the cable trough.
    locales: { ja: { name: 配線犬の走り場, description: 陶器の歯がホームタイルを擦る。配線犬はケーブル溝を食い破り、素早い抜け道にしている。 } }
    encounterTable: encounters.tl2f.platform
  - id: room.tl2f.power-terminal
    name: Platform Power Terminal
    description: A service terminal gives one amber acknowledgement when a sound fuse is seated. The office seal clicks loose.
    locales: { ja: { name: ホーム電源端末, description: 使えるヒューズを差すと、保守端末が一度だけ琥珀色に応答する。事務所の封印がかすかに外れる。 } }
    gates:
      - id: gate.tl2f.power-office
        kind: shortcut
        grantsFlag: flag.tl2f.office-seal
        clue: The platform office seal releases after the maintenance acknowledgement.
        locales: { ja: { clue: 保守端末の応答とともに、事務所の封印が外れた。 } }
  - id: room.tl2f.dry-cache
    name: Dry Cable Cache
    description: A high cable shelf stayed dry above the platform flood. A maintenance bar is wedged behind it.
    locales: { ja: { name: 乾いたケーブル棚, description: ホームの水位より高いケーブル棚だけが乾いている。奥には保守用の鋼棒が挟まっている。 } }
    treasureTable: treasure.tl2f.platform-cache
  - id: room.tl2f.cable-culvert
    name: Cable Culvert
    description: A low drainage culvert runs under the platform. It is unpleasant, but it joins the far side without a fight.
    locales: { ja: { name: 配線暗渠, description: 低い排水暗渠がホームの下を通る。不快な道だが、戦わずに反対側へ回り込める。 } }
    damageTile: 1
  - id: room.tl2f.up-stair
    name: Emergency Stair Up
    description: A bolted stair rises toward the outer gates. It is visibly fixed to the landing above, not floating from a wall.
    locales: { ja: { name: 上り非常階段, description: ボルトで固定された非常階段が改札外縁へ上がる。壁から生えた梯子ではなく、上の踊り場へ確かにつながっている。 } }
  - id: room.tl2f.return-marker
    name: Platform Emergency Phone
    description: An emergency phone, a dry signal lamp, and the Interchange Square call sign make a deliberate return point.
    locales: { ja: { name: ホーム非常電話, description: 非常電話、乾いた信号灯、乗換広場の呼出符号。ここは意図して戻るための地点だ。 } }
    stairsToTown: true
    returnStyle: marker
  - id: room.tl2f.down-stair
    name: Transfer Relay Stair
    description: A lit service stair descends past the platform drainage trench toward the transfer relay.
    locales: { ja: { name: 中継所への階段, description: ホーム排水溝の脇を、灯の残る保守階段が乗換中継所へ下る。 } }
---

# F2・浸水ホーム

ホームを回る複数経路と、電源端末で正当な封鎖事務所を開ける小目的を置く。到着セルは安全で、上り階段と帰還地点は物理的に見える。
