---
id: dungeon.tl7f
name: F7 - Bureau Perimeter
locales: { ja: { name: F7・中央隔離局外縁 } }
level: 7
role: attrition
dangerTier: 7
recommendedPartyLevel: 7
recommendedPartySize: 6
recommendedClearLevel: 8
tags: [branching, bureau, block-3]
authorNotes: >-
  Seed 20260811. The public utility architecture gives way to controlled office rings. A service archive
  bypass makes the outer loop legible; the route to train control is found, never artificially withheld.
startRoom: room.tl7f.bureau-landing
map: |
  ###################
  #E.a....#.........#
  #.#.#.###.###.#.#.#
  #.#.#.......#.#.#.#
  #.###.#.#####.#.###
  #....H.......T....#
  #.###.#.#####.#.#.#
  #.....#.....#...#.#
  ###.###.....###.#.#
  #...#....M..#...#.#
  ###.###.....#.#####
  #...#.....#.#.....#
  #.#.#####.#.#####.#
  #.#...#..B..#Q....#
  #.#######.###.###.#
  #.........#K...C#R#
  #.###.#.#.###.#####
  #...#.#.#.#L.....D#
  ###################
symbols:
  E: room.tl7f.bureau-landing
  a: room.tl7f.service-archive
  H: room.tl7f.outer-office-hall
  T: room.tl7f.clearance-terminal
  M: room.tl7f.badge-archive
  B: room.tl7f.perimeter-boardroom
  Q: room.tl7f.service-control
  K: room.tl7f.casework-cache
  C: room.tl7f.sealed-cabinet
  L: room.tl7f.breakroom-cache
  R: room.tl7f.return-marker
  D: room.tl7f.down-stair
corridor:
  name: Bureau Ring
  description: Frosted glass and metal doors divide offices built to keep people from one another.
  locales: { ja: { name: 局舎の環状廊下, description: 曇りガラスと金属扉が、人を隔てるための執務室を分けている。 } }
edges:
  - { from: room.tl7f.bureau-landing, direction: west, kind: stairs, to: room.tl6f.down-stair, targetFloorId: dungeon.tl6f }
  - { from: room.tl7f.down-stair, direction: north, kind: stairs, to: room.tl8f.control-landing, targetFloorId: dungeon.tl8f }
rooms:
  - { id: room.tl7f.bureau-landing, name: Bureau Landing, description: The reinforced stair opens onto an office ring with every nameplate removed., locales: { ja: { name: 中央局の踊り場, description: 補強階段の先には、名札をすべて外した執務環がある。 } } }
  - id: room.tl7f.service-archive
    name: Service Archive
    description: A records hatch keeps the maintenance clearance for the office perimeter.
    locales: { ja: { name: 保守書庫, description: 記録用の保守口には、外縁執務区の保守許可が保管されている。 } }
    gates: [{ id: gate.tl7f.archive, kind: shortcut, grantsFlag: flag.tl7f.archive-open, clue: The service archive logs a return-route clearance. }]
  - { id: room.tl7f.outer-office-hall, name: Outer Office Hall, description: Closed desks face one another under a muted evacuation map., locales: { ja: { name: 外縁執務広間, description: 閉じた机列が、色を失った避難地図の下で向かい合う。 } }, encounterTable: encounters.tl7f.bureau }
  - id: room.tl7f.clearance-terminal
    name: Clearance Terminal
    description: The bureau has been approving collection orders in place of escape permits.
    locales: { ja: { name: 許可端末, description: 中央局は脱出許可の代わりに、回収命令だけを承認してきた。 } }
    event: The party finds the signature chain that turned quarantine clearance into a collection mandate.
  - { id: room.tl7f.badge-archive, name: Badge Archive, description: A wall of expired badges leads to a guarded inner route., locales: { ja: { name: 身分証書庫, description: 失効した身分証の壁が、警備された内側の道へ続く。 } }, encounterTable: encounters.tl7f.bureau }
  - { id: room.tl7f.perimeter-boardroom, name: Perimeter Boardroom, description: The closure committee left its final meeting arranged around an empty chair., locales: { ja: { name: 封鎖委員会室, description: 封鎖委員会の最後の会議は、空席を囲んだまま残されている。 } }, encounterTable: encounters.tl7f.boardroom, chamberGuardian: true }
  - { id: room.tl7f.service-control, name: Service Control, description: A small control desk reconnects the archive bypass., locales: { ja: { name: 保守制御卓, description: 小さな制御卓が、書庫の迂回路をつなぎ直す。 } } }
  - { id: room.tl7f.casework-cache, name: Casework Cache, description: A dead-end file drawer holds sealed supplies., locales: { ja: { name: 事件簿の保管箱, description: 行き止まりの書類棚には、封じた補給品が残る。 } }, treasureTable: treasure.tl7f.bureau-cache }
  - { id: room.tl7f.sealed-cabinet, name: Sealed Cabinet, description: A cabinet holds the bureau keycard behind a simple lock., locales: { ja: { name: 封印キャビネット, description: キャビネットには、中央局の鍵札が簡素な錠の奥にある。 } }, chest: { treasureTable: treasure.tl7f.bureau-cache, lock: { difficulty: 21 } } }
  - { id: room.tl7f.breakroom-cache, name: Breakroom Cache, description: Cold tea tins hide a spare pack in the staff breakroom., locales: { ja: { name: 休憩室の隠し場所, description: 冷えた茶缶の奥に、職員用の予備品が隠されている。 } }, treasureTable: treasure.tl7f.bureau-cache }
  - { id: room.tl7f.return-marker, name: Bureau Evacuation Line, description: A staffed emergency line deliberately reaches Interchange Square., locales: { ja: { name: 中央局の退避回線, description: 職員用の非常回線は、意図して乗換広場へ届く。 } }, stairsToTown: true, returnStyle: marker }
  - { id: room.tl7f.down-stair, name: Control Stair, description: A secure but open stair descends to train control., locales: { ja: { name: 管制区への階段, description: 保安扉の先でも、階段自体は開いたまま列車管制区へ下る。 } } }
---

# F7・中央隔離局外縁

制度の中心へ入る第三帯。局内の近道は発見の報酬であり、深層への進行条件にはしない。
