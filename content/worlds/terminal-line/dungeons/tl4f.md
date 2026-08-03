---
id: dungeon.tl4f
name: F4 - Rainwater Works
locales: { ja: { name: F4・雨水処理区 } }
level: 4
role: attrition
dangerTier: 4
recommendedPartyLevel: 4
recommendedPartySize: 4
recommendedClearLevel: 5
tags: [branching, rainworks, block-2]
authorNotes: >-
  Seed 20260808. Pumps and sediment channels introduce the colder second material band. The sluice bypass
  is an authored loop, while the treatment descent remains open and rewards occupy the outer drainage ends.
startRoom: room.tl4f.rainworks-landing
map: |
  ###################
  #E.a#.......#.....#
  ###.#.#.#####.#.###
  #.....#.......#...#
  #.###.###.###.###.#
  #....H.......T..#.#
  ###.#.#######.#####
  #...#...#.........#
  #####.##....#####.#
  #........M....#...#
  #.###.##....###.###
  #...#.#...#...#..K#
  #.#####.#.#####.###
  #.#......B....#...#
  #####.#.#.#.###.#.#
  #..Q..#.#.#...#.#C#
  ###.#########.#.###
  #L.......D#...#..R#
  ###################
symbols:
  E: room.tl4f.rainworks-landing
  a: room.tl4f.sluice-bypass
  H: room.tl4f.pump-hall
  T: room.tl4f.treatment-terminal
  M: room.tl4f.sediment-basin
  K: room.tl4f.chemical-locker
  B: room.tl4f.filter-gallery
  Q: room.tl4f.sluice-control
  C: room.tl4f.dry-filter-cache
  L: room.tl4f.drainage-niche
  R: room.tl4f.return-marker
  D: room.tl4f.down-stair
corridor:
  name: Rainworks Channel
  description: Cold water ticks behind metal grates beneath a ceiling of sweating concrete.
  locales: { ja: { name: 雨水処理路, description: 汗をかくコンクリート天井の下、金属格子の奥で冷たい水が刻む。 } }
edges:
  - { from: room.tl4f.rainworks-landing, direction: west, kind: stairs, to: room.tl3f.down-stair, targetFloorId: dungeon.tl3f }
  - { from: room.tl4f.sluice-bypass, direction: north, kind: shortcut, to: room.tl4f.sluice-control }
  - { from: room.tl4f.down-stair, direction: north, kind: stairs, to: room.tl5f.ration-landing, targetFloorId: dungeon.tl5f }
rooms:
  - id: room.tl4f.rainworks-landing
    name: Rainworks Landing
    description: The relay stair reaches a dry inspection shelf above the treatment channels.
    locales: { ja: { name: 処理区の踊り場, description: 中継階段は、処理水路より高い乾いた点検棚に着く。 } }
  - id: room.tl4f.sluice-bypass
    name: Sluice Bypass
    description: A wheel valve can uncover a narrow maintenance bridge between two channels.
    locales: { ja: { name: 水門の迂回路, description: 手輪を回せば、二本の水路を結ぶ細い保守橋が現れる。 } }
    gates: [{ id: gate.tl4f.sluice, kind: shortcut, grantsFlag: flag.tl4f.sluice-open, clue: A wheel valve lowers the bypass bridge. }]
  - id: room.tl4f.pump-hall
    name: Pump Hall
    description: Idle pumps thump once whenever the zero line broadcasts.
    locales: { ja: { name: ポンプ室, description: 零番線の放送が流れるたび、止まったポンプが一度だけ脈打つ。 } }
    encounterTable: encounters.tl4f.rainworks
  - id: room.tl4f.treatment-terminal
    name: Treatment Terminal
    description: A treatment log says the water was diverted away from a sealed population below.
    locales: { ja: { name: 処理端末, description: 処理記録には、封鎖区画の人々から水を逸らしたと残されている。 } }
    event: The water was not an accident; the lower wards were deliberately deprived during the first closure.
  - id: room.tl4f.sediment-basin
    name: Sediment Basin
    description: Black mineral silt hides the shallow path around the basin.
    locales: { ja: { name: 沈砂池, description: 黒い鉱泥が、沈砂池を回る浅い道を隠している。 } }
    encounterTable: encounters.tl4f.rainworks
  - id: room.tl4f.chemical-locker
    name: Chemical Locker
    description: An inspection locker keeps sealed neutraliser packs dry.
    locales: { ja: { name: 薬剤ロッカー, description: 点検用ロッカーには、中和剤の袋が乾いたまま残る。 } }
    treasureTable: treasure.tl4f.rainworks-cache
  - id: room.tl4f.filter-gallery
    name: Filter Gallery
    description: Tall filter frames turn the chamber into a noisy blind corner.
    locales: { ja: { name: ろ過枠の回廊, description: 高いろ過枠が、部屋を音の多い死角へ変えている。 } }
    encounterTable: encounters.tl4f.rainworks
  - id: room.tl4f.sluice-control
    name: Sluice Control
    description: Rusted levers select the bypass without sealing the route to the next floor.
    locales: { ja: { name: 水門制御盤, description: 錆びたレバーは迂回路を選べるが、次階への道を封じるものではない。 } }
  - id: room.tl4f.dry-filter-cache
    name: Dry Filter Cache
    description: A high filter shelf preserves a supply tin above the cold water.
    locales: { ja: { name: 乾いたろ過棚, description: 高いろ過棚の上だけに、冷水を免れた補給缶が残る。 } }
    chest: { treasureTable: treasure.tl4f.rainworks-cache, trap: { kind: snare, difficulty: 15, damage: 6 } }
  - id: room.tl4f.drainage-niche
    name: Drainage Niche
    description: A narrow end chamber holds a stamped pump badge and a reserve pack.
    locales: { ja: { name: 排水の窪み, description: 狭い行き止まりに、ポンプの徽章と予備の包みが残る。 } }
    treasureTable: treasure.tl4f.rainworks-cache
  - id: room.tl4f.return-marker
    name: Rainworks Call Box
    description: An emergency call box has a direct, deliberate line to Interchange Square.
    locales: { ja: { name: 処理区の非常通話箱, description: 非常通話箱には、乗換広場へ戻るための直通回線が残っている。 } }
    stairsToTown: true
    returnStyle: marker
  - id: room.tl4f.down-stair
    name: Ration Stair
    description: Concrete steps descend beside an empty treatment tank toward the ration depot.
    locales: { ja: { name: 配給庫への階段, description: 空の処理槽の脇を、コンクリート階段が配給庫へ下る。 } }
---

# F4・雨水処理区

冷えた第二帯の開始。水を巡る道は複数あるが、下層への階段に認証や探索率の足止めを置かない。
