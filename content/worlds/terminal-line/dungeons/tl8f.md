---
id: dungeon.tl8f
name: F8 - Train Control
locales: { ja: { name: F8・列車管制区 } }
level: 8
role: attrition
dangerTier: 8
recommendedPartyLevel: 8
recommendedPartySize: 6
recommendedClearLevel: 9
tags: [branching, control, block-3]
authorNotes: >-
  Seed 20260812. Control consoles, cable trenches, and signal windows create a colder, more exposed deep
  station. The platform bypass exposes a useful loop but does not lock the descent to the lift machinery.
startRoom: room.tl8f.control-landing
map: |
  ###################
  #E.a........#.....#
  #.###.###.###.###.#
  #...#.#.........#.#
  #.###.#####.#.###.#
  #....H....#..T....#
  #.#.#.#.###.#.###.#
  #.#...#...#.#.....#
  #####.##...##.#####
  #........M........#
  #######....####.#.#
  #.......#Q..#K..#.#
  ###.#####.#####.###
  #.....#..B........#
  #.#####.#.#.#####.#
  #....L#...#...#C..#
  #.#####.#.###.#####
  #....R#.#..D#.....#
  ###################
symbols:
  E: room.tl8f.control-landing
  a: room.tl8f.platform-bypass
  H: room.tl8f.signal-hall
  T: room.tl8f.train-terminal
  M: room.tl8f.console-ring
  Q: room.tl8f.switch-control
  K: room.tl8f.signal-locker
  B: room.tl8f.dispatch-chamber
  L: room.tl8f.cable-cache
  C: room.tl8f.window-ledge
  R: room.tl8f.return-marker
  D: room.tl8f.down-stair
corridor:
  name: Control Cableway
  description: Cable trenches divide the floor under signal lamps that no longer serve passengers.
  locales: { ja: { name: 管制配線路, description: 乗客を導かなくなった信号灯の下で、ケーブル溝が床を分けている。 } }
edges:
  - { from: room.tl8f.control-landing, direction: west, kind: stairs, to: room.tl7f.down-stair, targetFloorId: dungeon.tl7f }
  - { from: room.tl8f.down-stair, direction: north, kind: stairs, to: room.tl9f.lift-landing, targetFloorId: dungeon.tl9f }
rooms:
  - { id: room.tl8f.control-landing, name: Control Landing, description: The office stair reaches a silent floor of railway relays., locales: { ja: { name: 管制区の踊り場, description: 局舎の階段は、鉄道リレーだけが沈黙する床へ着く。 } } }
  - id: room.tl8f.platform-bypass
    name: Platform Bypass
    description: A switchboard retains the clearance record for the far console ring.
    locales: { ja: { name: ホーム迂回線, description: 分電盤には、遠い操作卓へ通じた迂回経路の許可記録が残る。 } }
    gates: [{ id: gate.tl8f.switch, kind: shortcut, grantsFlag: flag.tl8f.switch-open, clue: A switchboard logs a control-route clearance. }]
  - { id: room.tl8f.signal-hall, name: Signal Hall, description: Station signals cycle for a train that never arrives., locales: { ja: { name: 信号広間, description: 来ない列車のために、駅信号だけが巡回している。 } }, encounterTable: encounters.tl8f.control }
  - id: room.tl8f.train-terminal
    name: Train Terminal
    description: The zero line is automatically dispatched whenever a recovered group is logged below.
    locales: { ja: { name: 列車端末, description: 下層で回収集団が記録されるたび、零番線は自動で発車する。, event: あの放送は生きた指令員ではなく、自動の収容プロトコルだと知る。 } }
    event: The party learns the broadcast is an automated collection protocol, not a living dispatcher.
  - { id: room.tl8f.console-ring, name: Console Ring, description: A ring of dead consoles makes multiple approaches to the dispatch room., locales: { ja: { name: 操作卓の環, description: 死んだ操作卓が、指令室へ複数の近づき方を作っている。 } }, encounterTable: encounters.tl8f.control }
  - { id: room.tl8f.switch-control, name: Switch Control, description: The bypass control overlooks the lower lift route., locales: { ja: { name: 分岐制御卓, description: 迂回路の制御卓から、下の昇降路が見下ろせる。 } } }
  - { id: room.tl8f.signal-locker, name: Signal Locker, description: A dead-end equipment locker preserves a calibrated tool., locales: { ja: { name: 信号機材ロッカー, description: 行き止まりの機材ロッカーに、調整済みの工具が残る。 } }, treasureTable: treasure.tl8f.control-cache }
  - { id: room.tl8f.dispatch-chamber, name: Dispatch Chamber, description: A deep control chamber keeps the final route alive., locales: { ja: { name: 指令室, description: 深い管制室が、最後の経路だけを生かしている。 } }, encounterTable: encounters.tl8f.dispatch-guard, chamberGuardian: true }
  - { id: room.tl8f.cable-cache, name: Cable Cache, description: A spare coil and sealed pack rest at the end of the trench., locales: { ja: { name: 予備ケーブル棚, description: 溝の奥に、予備コイルと封じた補給袋が残る。 } }, treasureTable: treasure.tl8f.control-cache }
  - { id: room.tl8f.window-ledge, name: Signal Window Ledge, description: A narrow ledge holds an overlooked maintenance cache., locales: { ja: { name: 信号窓の棚, description: 狭い窓棚に、見落とされた保守箱がある。 } }, chest: { treasureTable: treasure.tl8f.control-cache, trap: { kind: needle, difficulty: 23, damage: 9, status: poison } } }
  - { id: room.tl8f.return-marker, name: Control Emergency Link, description: A hardwired emergency link returns the party to the hub by design., locales: { ja: { name: 管制区の非常回線, description: 有線の非常回線は、意図して一行を拠点へ戻す。 } }, stairsToTown: true, returnStyle: marker }
  - { id: room.tl8f.down-stair, name: Liftworks Stair, description: A visible stair descends beside the surface-lift machinery., locales: { ja: { name: 昇降機区への階段, description: 地上昇降機の機械脇を、見える階段が下る。 } } }
---

# F8・列車管制区

零番線の放送に「主」はいない。回収手順を動かす自動管制へ、さらに深く降りる。
