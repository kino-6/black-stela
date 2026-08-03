---
id: dungeon.tl5f
name: F5 - Ration Depot
locales: { ja: { name: F5・配給庫 } }
level: 5
role: attrition
dangerTier: 5
recommendedPartyLevel: 5
recommendedPartySize: 5
recommendedClearLevel: 6
tags: [branching, depot, block-2]
authorNotes: >-
  Seed 20260809. Crate lanes, cold stores, and a distribution office make a public logistics floor. The
  loading cut-through is a reward shortcut; ration stock, not a forced key, pulls the player into its ends.
startRoom: room.tl5f.ration-landing
map: |
  ###################
  #E#.#.............#
  #.#.###.###.###.#.#
  #a......#...#...#.#
  ###.#.#.#####.#.#.#
  #....H.......T..#.#
  #.###.#.###.#.###.#
  #.....#...#.#.#...#
  ###.###....####.#.#
  #.....#..Q......#.#
  #.######....###.#.#
  #.......#.....#.#K#
  ###.#####.#####.###
  #........M..#.....#
  #.#######.###.#.#.#
  #.....#D......#.#.#
  ###.#.#####.#.#.#.#
  #L..#..C#...#.#R..#
  ###################
symbols:
  E: room.tl5f.ration-landing
  a: room.tl5f.loading-cut-through
  H: room.tl5f.distribution-hall
  T: room.tl5f.allocation-terminal
  Q: room.tl5f.cold-store
  K: room.tl5f.vacant-locker
  M: room.tl5f.manifest-office
  D: room.tl5f.down-stair
  L: room.tl5f.dry-ration-cache
  C: room.tl5f.crate-maze
  R: room.tl5f.return-marker
corridor:
  name: Crate Lane
  description: Empty ration crates leave narrow lanes through a depot built to feed a crowd.
  locales: { ja: { name: 配給箱の通路, description: 空の配給箱が、人を養うための倉庫に狭い通路を残している。 } }
edges:
  - { from: room.tl5f.ration-landing, direction: west, kind: stairs, to: room.tl4f.down-stair, targetFloorId: dungeon.tl4f }
  - { from: room.tl5f.loading-cut-through, direction: north, kind: shortcut, to: room.tl5f.cold-store }
  - { from: room.tl5f.down-stair, direction: north, kind: stairs, to: room.tl6f.records-landing, targetFloorId: dungeon.tl6f }
rooms:
  - { id: room.tl5f.ration-landing, name: Ration Landing, description: The rainworks stair meets a dry receiving shelf., locales: { ja: { name: 配給庫の踊り場, description: 雨水処理区からの階段は、乾いた受入棚に着く。 } } }
  - id: room.tl5f.loading-cut-through
    name: Loading Cut-through
    description: A rolling door opens a short path through the stacked crates.
    locales: { ja: { name: 搬入口の抜け道, description: 荷役扉を開ければ、積み箱を横切る短い道ができる。 } }
    gates: [{ id: gate.tl5f.loading, kind: shortcut, grantsFlag: flag.tl5f.loading-open, clue: A loading latch joins two crate lanes. }]
  - { id: room.tl5f.distribution-hall, name: Distribution Hall, description: Broken ticket printers stamp food tallies onto the floor., locales: { ja: { name: 配給広間, description: 壊れた整理券機が、食料の数を床へ打ち続けている。 } }, encounterTable: encounters.tl5f.depot }
  - id: room.tl5f.allocation-terminal
    name: Allocation Terminal
    description: The terminal records that the last convoy left with guards and no civilians.
    locales: { ja: { name: 割当端末, description: 最後の輸送隊は、民間人を乗せず警備だけを連れて出たと端末に残る。 } }
    event: The party learns that the public ration system was converted into a one-way collection queue.
  - { id: room.tl5f.cold-store, name: Cold Store, description: Frost remains on a sealed room despite the failed power., locales: { ja: { name: 冷蔵保管室, description: 電力が落ちた後も、封じられた部屋には霜が残る。 } }, encounterTable: encounters.tl5f.depot }
  - { id: room.tl5f.vacant-locker, name: Vacant Locker, description: A dry staff locker holds a wrapped reserve., locales: { ja: { name: 空の職員ロッカー, description: 乾いた職員ロッカーに、包まれた予備品が残る。 } }, treasureTable: treasure.tl5f.depot-cache }
  - { id: room.tl5f.manifest-office, name: Manifest Office, description: Paper manifests identify whole families as recovered cargo., locales: { ja: { name: 積荷台帳室, description: 紙の台帳は、家族ごとを「回収貨物」として記している。 } }, encounterTable: encounters.tl5f.depot }
  - { id: room.tl5f.dry-ration-cache, name: Dry Ration Cache, description: A dead-end dry box contains preserved field food., locales: { ja: { name: 乾燥配給箱, description: 行き止まりの乾いた箱には、保存食が残されている。 } }, chest: { treasureTable: treasure.tl5f.depot-cache, lock: { difficulty: 16 } } }
  - { id: room.tl5f.crate-maze, name: Crate Maze, description: Fallen supply crates make a blind but rewarding outer route., locales: { ja: { name: 配給箱の迷路, description: 倒れた配給箱が、見えにくいが報酬のある外周路を作る。 } }, treasureTable: treasure.tl5f.depot-cache }
  - { id: room.tl5f.return-marker, name: Depot Call Sign, description: A distribution handset still dials Interchange Square., locales: { ja: { name: 配給庫の通話符号, description: 配給用の受話器は、まだ乗換広場へつながる。 } }, stairsToTown: true, returnStyle: marker }
  - { id: room.tl5f.down-stair, name: Records Stair, description: A marked staff stair descends to the medical archives., locales: { ja: { name: 医療記録庫への階段, description: 職員用の標識階段が、医療記録庫へ下る。 } } }
---

# F5・配給庫

配給は救済でなく回収の導線へ変えられていた。補給箱は探索の理由であり、下りを止める鍵ではない。
