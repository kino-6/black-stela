---
id: dungeon.tl1f
name: F1 - Outer Gates
locales: { ja: { name: F1・改札外縁 } }
level: 1
role: onboarding
dangerTier: 1
recommendedPartyLevel: 1
recommendedPartySize: 2
recommendedClearLevel: 2
tags: [onboarding, transit, block-1]
authorNotes: >-
  A 19x19 rod-falling maze, seed 20260804, post-carved into four public-infrastructure chambers.
  The security route and flooded concourse both reach the signal office; a service-shutter shortcut
  collapses a return route once found. The down stair is freely usable at the far end. Rewards pull
  toward dead ends and the stationmaster chamber rather than blocking descent.
startRoom: room.tl1f.entrance
map: |
  ###################
  #E.a..#...#...#...#
  #.#.#.#.###.#.###.#
  #.#.#.......#.....#
  #.###.#.#####.#####
  #....F.......S....#
  #.###.#####.#.#.###
  #.#.......#...#...#
  #####.#....##.###.#
  #.....#..H..#.#K..#
  #####.##...########
  #.......#.........#
  #.#.###.#.#####.#.#
  #.#.#....T....#.#.#
  ###.#####.#.#####.#
  #.........#....C#R#
  #.###.###########.#
  #.#......P.......D#
  ###################
symbols:
  E: room.tl1f.entrance
  a: room.tl1f.security-corridor
  F: room.tl1f.flooded-concourse
  S: room.tl1f.signal-office
  H: room.tl1f.stationmaster-hall
  K: room.tl1f.key-locker
  T: room.tl1f.maintenance-terminal
  C: room.tl1f.concourse-cache
  R: room.tl1f.return-marker
  P: room.tl1f.service-hatch
  D: room.tl1f.down-stair
corridor:
  name: Wet Ticket Gallery
  description: Low station lamps repeat across white-grey tile. Water threads between the rubber floor seams.
  locales:
    ja:
      name: 濡れた改札回廊
      description: 低い駅灯が白灰のタイルに繰り返し映る。黒いゴム床の継ぎ目を、雨水が細く流れている。
edges:
  - { from: room.tl1f.down-stair, direction: east, kind: stairs, to: room.tl2f.up-stair, targetFloorId: dungeon.tl2f }
rooms:
  - id: room.tl1f.entrance
    name: Raised Fire Shutter
    description: A half-raised fire shutter leaves a gap into the station. The Interchange Square is still behind the rain.
    event: A closing chime keeps steady time from somewhere deeper in the station — an empty platform, still being worked by someone.
    locales: { ja: { name: 上がった防火シャッター, description: 半ば上がった防火シャッターの下に、駅へ入る隙間がある。雨の向こうには、まだ乗換広場の灯が残っている。, event: 奥のどこかから、閉鎖チャイムが規則正しく鳴っている。無人のホームで、誰かがまだ働いているらしい。 } }
    stairsToTown: true
    returnStyle: stairs
  - id: room.tl1f.security-corridor
    name: Security Corridor
    description: A narrow lane of broken gates. A baton unit blocks the dry, direct line toward the signal office.
    locales: { ja: { name: 保安通路, description: 壊れた改札機が狭い通路をつくる。無線室への乾いた近道を、保安棒ユニットが塞いでいる。 } }
    encounterTable: encounters.tl1f.outer-gate
  - id: room.tl1f.flooded-concourse
    name: Flooded Concourse
    description: An ankle-deep detour beneath dark timetable boards. The way is slower, but old lockers remain above the waterline.
    locales: { ja: { name: 浸水コンコース, description: 消えた時刻表の下を、くるぶしまで水に浸かって回り込む。遅い道だが、古いロッカーはまだ水面より高い。, event: 浸水した道は、保安通路を通らずに時間と引き換えで補給を拾える。 } }
    treasureTable: treasure.tl1f.locker
    event: The flooded route trades time for supplies without forcing the security corridor.
  - id: room.tl1f.signal-office
    name: Signal Office
    description: A cracked platform display repeats a destination with no train number. A maintenance line answers from below.
    locales: { ja: { name: 信号室, description: 割れた案内表示が、列車番号のない行先だけを繰り返す。保守回線は、さらに下から応答している。, event: 一行は深夜の信号を記録し、下のホームにまだ電力が残っていることを知る。 } }
    event: The party records the midnight signal and learns that the lower platform still has power.
    gates:
      - id: gate.tl1f.route-signal
        kind: shortcut
        grantsFlag: flag.tl1f.signal-routed
        clue: The dead display reroutes a signal toward the lower platform.
        locales: { ja: { clue: 死んだ表示板が、下のホームへ向けて一度だけ信号を流した。 } }
  - id: room.tl1f.stationmaster-hall
    name: Unmanned Stationmaster Hall
    description: Ticket gates and a worker's coat have fused around a standing maintenance frame. It rings the closing chime at an empty platform.
    locales: { ja: { name: 無人駅務長の広間, description: 改札機と作業服が、立った保守架台の周りで癒着している。誰もいないホームへ、閉鎖チャイムだけを鳴らしている。 } }
    encounter:
      id: enemy.tl1f.unmanned-stationmaster
      name: Unmanned Stationmaster
      hp: 28
      attack: 5
      role: miniboss
    encounterTable: encounters.tl1f.stationmaster
    chamberGuardian: true
    treasureTable: treasure.tl1f.station-office
  - id: room.tl1f.key-locker
    name: Operations Locker
    description: A dented steel locker bears the faded seal of platform operations. A key fragment ticks inside it.
    locales: { ja: { name: 運行ロッカー, description: 鋼製ロッカーに、ホーム運行課の消えかけた印が残る。中で鍵片が小さく鳴っている。 } }
    chest: { treasureTable: treasure.tl1f.station-office, lock: { difficulty: 8 } }
  - id: room.tl1f.maintenance-terminal
    name: Maintenance Terminal
    description: A dark terminal beside a dry service hatch; the parts bins around it are still half-stocked with salvage.
    event: The parts bins here can be stripped for gear — but the more you rummage, the more noise you make.
    gatherTable: treasure.tl1f.station-office
    gatherMaxPulls: 4
    locales: { ja: { name: 保守端末, description: 乾いた保守口の脇の暗い端末。周りの部品箱には、まだ回収できる部品が半分ほど残っている。, event: 部品箱は漁れば使える装備が出る——が、掻き回すほど物音が響く。 } }
  - id: room.tl1f.concourse-cache
    name: Lost Property Cache
    description: A sealed lost-property box rests above the tide mark, heavy with forgotten work gear.
    locales: { ja: { name: 遺失物の保管箱, description: 水位線より高い棚に、封をされた遺失物箱が残る。中には忘れられた作業用具の重みがある。 } }
    treasureTable: treasure.tl1f.locker
    chest: { treasureTable: treasure.tl1f.locker, trap: { kind: gas, difficulty: 10, damage: 3, status: poison } }
  - id: room.tl1f.return-marker
    name: Emergency Call Point
    description: A battered emergency phone and a steady evacuation lamp mark a route back to the Interchange Square.
    locales: { ja: { name: 非常電話前, description: へこんだ非常電話と、消えない退避灯が乗換広場へ戻る道を示している。 } }
    stairsToTown: true
    returnStyle: marker
    # The evacuation shutter (the 17,16 passage down to the platform stairs) is a REAL cell on the map, not a
    # shortcut warp — it just stays LOCKED until the midnight signal is routed (信号室 grants flag.tl1f.signal-
    # routed), then a routed party can drop from 帰還 straight to 降り口, collapsing the ~34-step return trek.
    gates:
      - id: gate.tl1f.evac-shutter
        kind: lock
        direction: south
        requiredFlag: flag.tl1f.signal-routed
        # Diegetic: describe the sealed shutter the party can SEE, not the omniscient solution. Naming the
        # "signal" mechanism they haven't found yet reads as the game talking past the characters (playtest
        # 2026-08-14「主人公たちが認知してない信号がどうとか雑」). The routing itself is learned by DOING.
        clue: A steel evacuation shutter is bolted down across the way; it won't be forced up from here.
        locales: { ja: { clue: 鋼の退避シャッターが固く下りている。ここでは、どう押しても上がらない。 } }
  - id: room.tl1f.service-hatch
    name: Service Hatch
    description: A narrow service hatch off the lower corridor, its dry cabling still clipped to the wall.
    locales: { ja: { name: 保守口, description: 下の通路から分かれた狭い保守口。乾いた配線が、まだ壁に留められている。 } }
  - id: room.tl1f.down-stair
    name: Platform Service Stairs
    description: Steel steps descend beside the platform edge toward the flooded lower level. Nothing bars the way down.
    locales: { ja: { name: ホーム脇の保守階段, description: ホーム端の鋼階段が、浸水した下層へと降りている。下りること自体を止めるものはない。 } }
    gates:
      - id: gate.tl1f.platform-shutter
        kind: lock
        direction: north
        requiredFlag: flag.tl1f.signal-routed
        clue: A steel evacuation shutter is bolted down across the way; it won't be forced up from here.
        locales: { ja: { clue: 鋼の退避シャッターが固く下りている。ここでは、どう押しても上がらない。 } }
---

# F1・改札外縁

保安通路の速い道と、浸水コンコースの補給を拾う道の二択を置く。どちらを選んでも信号室と下り階段へ届く。
