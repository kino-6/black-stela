---
id: dungeon.tl3f
name: F3 - Transfer Relay
locales: { ja: { name: F3・乗換中継所 } }
level: 3
role: attrition
dangerTier: 3
recommendedPartyLevel: 3
recommendedPartySize: 4
recommendedClearLevel: 4
tags: [branching, transit, block-1]
authorNotes: >-
  Seed 20260806. The relay joins platform power to the deeper rainworks. Its early bypass and late
  terminal form a visible loop; supply niches sit away from the direct descent, which stays freely usable.
startRoom: room.tl3f.transfer-landing
map: |
  ###################
  #E.a....#.......#.#
  ###.#########.###.#
  #.................#
  #.###.#######.#.#.#
  #....H..#....T..#.#
  ###.#.#######.###.#
  #...............#.#
  #.######....#.#.#.#
  #........M..#.#.#.#
  #.###.##...##.###.#
  #.#.....#.....#K..#
  #.#######.#.#.###.#
  #........B..#.#C..#
  #.#.#.###.###.###.#
  #.#.#.....#Q...L#R#
  #.#####.#.#.#######
  #.....#.#.#......D#
  ###################
symbols:
  E: room.tl3f.transfer-landing
  a: room.tl3f.bypass-shutter
  H: room.tl3f.relay-hall
  T: room.tl3f.dispatch-terminal
  M: room.tl3f.water-clock
  K: room.tl3f.tool-cache
  B: room.tl3f.broadcast-booth
  Q: room.tl3f.signal-splice
  C: room.tl3f.cable-cache
  L: room.tl3f.flood-locker
  R: room.tl3f.return-phone
  D: room.tl3f.down-stair
corridor:
  name: Transfer Conduit
  description: Switch cabinets carry a weak relay click through the wet concrete.
  locales: { ja: { name: 乗換配線路, description: 濡れたコンクリートの奥で、転轍盤のリレー音だけが小さく続く。 } }
edges:
  - { from: room.tl3f.transfer-landing, direction: west, kind: stairs, to: room.tl2f.up-stair, targetFloorId: dungeon.tl2f }
  - { from: room.tl3f.down-stair, direction: north, kind: stairs, to: room.tl4f.rainworks-landing, targetFloorId: dungeon.tl4f }
rooms:
  - id: room.tl3f.transfer-landing
    name: Transfer Landing
    description: Bolted stairs arrive at a dry relay landing. The flooded platforms remain visibly above.
    locales: { ja: { name: 中継踊り場, description: ボルト留めの階段が乾いた中継踊り場へ着く。浸水ホームは、はっきり上に残っている。 } }
  - id: room.tl3f.bypass-shutter
    name: Bypass Shutter
    description: A hand-cranked shutter records an old maintenance bypass after the route is read.
    locales: { ja: { name: 迂回シャッター, description: 経路を読めば、手回しシャッターは古い保守経路を記録する。 } }
    gates: [{ id: gate.tl3f.bypass, kind: shortcut, grantsFlag: flag.tl3f.bypass-open, clue: The shutter logs a relay-route clearance. }]
  - id: room.tl3f.relay-hall
    name: Relay Hall
    description: A public transfer hall has become a maze of unplugged signal cabinets.
    locales: { ja: { name: 中継盤の広間, description: 乗換広間は、抜かれた信号盤の迷路になっている。 } }
    encounterTable: encounters.tl3f.relay
  - id: room.tl3f.dispatch-terminal
    name: Dispatch Terminal
    description: A terminal displays an evacuation order that returns every passenger to isolation.
    locales: { ja: { name: 指令端末, description: 端末は、避難民を全員ふたたび隔離区画へ送る命令を表示している。 } }
    event: The party records the re-isolation order and learns that the zero line is collecting people, not rescuing them.
  - id: room.tl3f.water-clock
    name: Water Clock
    description: A drip counter measures flood pressure against the relay wall.
    locales: { ja: { name: 水圧計, description: 滴りを数える装置が、中継壁の向こうの水圧を測っている。 } }
    encounterTable: encounters.tl3f.relay
  - id: room.tl3f.tool-cache
    name: Relay Tool Cache
    description: Insulated pliers and a dry dressing wait in a dead-end service nook.
    locales: { ja: { name: 中継工具箱, description: 行き止まりの保守口に、絶縁工具と乾いた応急包帯が残されている。 } }
    treasureTable: treasure.tl3f.relay-cache
  - id: room.tl3f.broadcast-booth
    name: Broadcast Booth
    description: The midnight announcement plays here without a speaker or a train number.
    locales: { ja: { name: 放送ブース, description: 深夜の案内が、スピーカーも列車番号もないままここで流れる。 } }
    encounterTable: encounters.tl3f.transfer-warden
    chamberGuardian: true
  - id: room.tl3f.signal-splice
    name: Signal Splice
    description: A jumper cable can connect the bypass to the deep rainworks route.
    locales: { ja: { name: 信号接続口, description: ジャンパ線をつなげば、迂回路と深い雨水区画の信号が結ばれる。 } }
  - id: room.tl3f.cable-cache
    name: Cable Cache
    description: A sealed cable drum holds a small reserve above the waterline.
    locales: { ja: { name: ケーブル保管棚, description: 封をされたケーブルドラムに、水位線より高い予備品が残る。 } }
    chest: { treasureTable: treasure.tl3f.relay-cache, trap: { kind: gas, difficulty: 13, damage: 5, status: poison } }
  - id: room.tl3f.flood-locker
    name: Flood Locker
    description: A locker at the end of the wet spur contains a stamped access plate.
    locales: { ja: { name: 浸水ロッカー, description: 濡れた枝道の奥にあるロッカーには、刻印入りの通行板が入っている。 } }
    treasureTable: treasure.tl3f.relay-cache
  - id: room.tl3f.return-phone
    name: Relay Emergency Phone
    description: The call sign for Interchange Square is still painted beside this dry phone.
    locales: { ja: { name: 中継非常電話, description: 乾いた非常電話の横に、乗換広場の呼出符号がまだ残っている。 } }
    stairsToTown: true
    returnStyle: marker
  - id: room.tl3f.down-stair
    name: Rainworks Stair
    description: A concrete stair descends into the rainwater works. Its handrail is anchored to the floor below.
    locales: { ja: { name: 雨水処理区への階段, description: コンクリート階段が雨水処理区へ下る。手すりは下の床へ確かに固定されている。 } }
---

# F3・乗換中継所

零番線が避難でなく回収の路線だと知る、第一幕の終点。下り階段は記録の有無で止めず、迂回路と補給を探索の報酬にする。
