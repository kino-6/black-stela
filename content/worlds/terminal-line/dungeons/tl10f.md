---
id: dungeon.tl10f
name: F10 - Platform Zero Terminus
locales: { ja: { name: F10・零番線終端 } }
level: 10
role: finale
dangerTier: 10
recommendedPartyLevel: 10
recommendedPartySize: 6
recommendedClearLevel: 11
tags: [boss, terminus, block-4]
authorNotes: >-
  Seed 20260814. A final full-sized terminal maze, not a boss corridor. The arrival is safe, four chambers
  form loops, and outer caches allow preparation before the terminus core. The return winch stays available
  before and after the confrontation so the ending is a decision rather than a trap.
startRoom: room.tl10f.terminus-landing
map: |
  ###################
  #E.a..#...........#
  ###.#.#.#####.###.#
  #...#.....#.....#.#
  #####.#.###.#.###.#
  #....H....#..T..#.#
  #####.#.#.#.#.#.###
  #.......#.#...#...#
  #.#####....##.#####
  #.....#..M..#.....#
  #.#.####...####.###
  #.#.....#.....#...#
  #####.#.#.#.#.###.#
  #.....#..B..#.#Q..#
  ###.#.###.#####.#.#
  #...#.#.....#K..#C#
  ###.#####.#####.###
  #L...R#.......#..X#
  ###################
symbols:
  E: room.tl10f.terminus-landing
  a: room.tl10f.service-bypass
  H: room.tl10f.arrival-hall
  T: room.tl10f.terminal-console
  M: room.tl10f.platform-ring
  B: room.tl10f.zero-core
  Q: room.tl10f.bypass-control
  K: room.tl10f.final-cache
  C: room.tl10f.signal-coffer
  L: room.tl10f.last-locker
  R: room.tl10f.return-winch
  X: room.tl10f.end-marker
corridor:
  name: Platform Zero Passage
  description: The last platform is too clean for a place abandoned this long, and every sign points inward.
  locales: { ja: { name: 零番線の通路, description: 最後のホームは放棄された年月にしては清潔すぎる。案内板はすべて内側を指す。 } }
edges:
  - { from: room.tl10f.terminus-landing, direction: west, kind: stairs, to: room.tl9f.down-stair, targetFloorId: dungeon.tl9f }
rooms:
  - { id: room.tl10f.terminus-landing, name: Terminus Landing, description: The steel stair arrives at the final platform under a working evacuation lamp., locales: { ja: { name: 終端の踊り場, description: 鋼階段は、働いたままの退避灯が照らす最後のホームへ着く。 } } }
  - id: room.tl10f.service-bypass
    name: Service Bypass
    description: A final service hatch keeps the clearance for the platform ring's maintenance route.
    locales: { ja: { name: 最終保守口, description: 最後の保守口には、ホーム環の保守経路の許可が残る。 } }
    gates: [{ id: gate.tl10f.bypass, kind: shortcut, grantsFlag: flag.tl10f.bypass-open, clue: The final service hatch logs a platform-route clearance. }]
  - { id: room.tl10f.arrival-hall, name: Arrival Hall, description: Empty benches face a train door that is painted onto concrete., locales: { ja: { name: 到着広間, description: 空のベンチが、コンクリートに描かれた列車扉へ向いている。 } }, encounterTable: encounters.tl10f.terminus }
  - id: room.tl10f.terminal-console
    name: Terminal Console
    description: The console offers no explanation, only three final rail commands waiting for a hand.
    locales: { ja: { name: 終端操作卓, description: 操作卓は説明をせず、手を待つ三つの最終運行命令だけを示す。 } }
    event: "The three routes are now explicit: stop collection, continue the line under new custody, or open the surface lift."
  - { id: room.tl10f.platform-ring, name: Platform Ring, description: The final platform has several approaches to the core and no forced single-file boss lane., locales: { ja: { name: ホーム環, description: 最終ホームには中枢への複数の近づき方があり、一列のボス通路ではない。 } }, encounterTable: encounters.tl10f.terminus }
  - id: room.tl10f.zero-core
    name: Zero Line Core
    description: A stationmaster shell has grown around the dispatch core and rings the collection chime for no one.
    locales: { ja: { name: 零番線中枢, description: 駅務長の殻が指令中枢を包み、誰もいない回収チャイムを鳴らしている。 } }
    encounterTable: encounters.tl10f.core
    chamberGuardian: true
  - { id: room.tl10f.bypass-control, name: Bypass Control, description: A dry relay rack maintains the loop around the core., locales: { ja: { name: 迂回制御盤, description: 乾いたリレー架台が、中枢を回る環状路を保っている。 } } }
  - { id: room.tl10f.final-cache, name: Final Cache, description: A dead-end service box contains equipment meant for a last repair., locales: { ja: { name: 最終保守箱, description: 行き止まりの保守箱には、最後の修理用具が入っている。 } }, treasureTable: treasure.tl10f.terminus-cache }
  - { id: room.tl10f.signal-coffer, name: Signal Coffer, description: A sealed coffer holds the original route plate., locales: { ja: { name: 信号金庫, description: 封じた金庫に、最初の運行板が残されている。 } }, chest: { treasureTable: treasure.tl10f.terminus-cache, lock: { difficulty: 28 }, trap: { kind: gas, difficulty: 28, damage: 12, status: fear } } }
  - { id: room.tl10f.last-locker, name: Last Locker, description: The final outer locker rewards a complete sweep before the core., locales: { ja: { name: 最後のロッカー, description: 外周の最後のロッカーは、中枢前に全体を巡る価値を返す。 } }, treasureTable: treasure.tl10f.terminus-cache }
  - { id: room.tl10f.return-winch, name: Return Winch, description: The emergency winch still reaches the Interchange Square; the ending never deletes the choice to return., locales: { ja: { name: 帰還巻上げ機, description: 非常巻上げ機はまだ乗換広場へ届く。終幕でも戻る選択を消さない。 } }, stairsToTown: true, returnStyle: marker }
  - { id: room.tl10f.end-marker, name: End Marker, description: A final platform marker waits beside the core for the line's new order., locales: { ja: { name: 終端標, description: 最終ホーム標が、中枢の脇で新しい運行命令を待つ。 } } }
---

# F10・零番線終端

真ボスと終幕選択の層。ただし到達即一方通行にはせず、帰還点と外周の準備余地を残す。
