---
id: dungeon.tl6f
name: F6 - Medical Records
locales: { ja: { name: F6・医療記録庫 } }
level: 6
role: attrition
dangerTier: 6
recommendedPartyLevel: 6
recommendedPartySize: 5
recommendedClearLevel: 7
tags: [branching, records, block-2]
authorNotes: >-
  Seed 20260810. Archive aisles form cover-like sight breaks without introducing a new combat rule. The
  records lift is a shortcut and the lower bureau stair is always available after the player finds it.
startRoom: room.tl6f.records-landing
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
  E: room.tl6f.records-landing
  a: room.tl6f.archive-lift
  H: room.tl6f.triage-hall
  T: room.tl6f.case-terminal
  M: room.tl6f.quarantine-shelves
  K: room.tl6f.sealed-case
  B: room.tl6f.records-vault
  C: room.tl6f.sample-cabinet
  Q: room.tl6f.lift-control
  L: room.tl6f.discharge-cache
  R: room.tl6f.return-marker
  D: room.tl6f.down-stair
corridor:
  name: Archive Aisle
  description: Water-stained case files narrow the aisles between old treatment rooms.
  locales: { ja: { name: 記録庫の書架路, description: 水染みの症例簿が、古い処置室の間の通路を狭めている。 } }
edges:
  - { from: room.tl6f.records-landing, direction: west, kind: stairs, to: room.tl5f.down-stair, targetFloorId: dungeon.tl5f }
  - { from: room.tl6f.archive-lift, direction: north, kind: shortcut, to: room.tl6f.lift-control }
  - { from: room.tl6f.down-stair, direction: north, kind: stairs, to: room.tl7f.bureau-landing, targetFloorId: dungeon.tl7f }
rooms:
  - { id: room.tl6f.records-landing, name: Records Landing, description: A clean staff stair ends before the water-stained archive., locales: { ja: { name: 記録庫の踊り場, description: 清潔だった職員階段が、水染みの記録庫の前で終わる。 } } }
  - id: room.tl6f.archive-lift
    name: Archive Lift
    description: A paper lift can carry a party through a recovered service channel.
    locales: { ja: { name: 書類用リフト, description: 書類用リフトは、復旧した保守路を通って一行を運べる。 } }
    gates: [{ id: gate.tl6f.lift, kind: shortcut, grantsFlag: flag.tl6f.lift-online, clue: The archive lift reconnects two record aisles. }]
  - { id: room.tl6f.triage-hall, name: Triage Hall, description: Numbered chairs face a wall where names have been scraped away., locales: { ja: { name: トリアージ広間, description: 番号だけの椅子が、名前を削られた壁へ向いている。 } }, encounterTable: encounters.tl6f.records }
  - id: room.tl6f.case-terminal
    name: Case Terminal
    description: The final medical records call every recovered passenger medically unfit for release.
    locales: { ja: { name: 症例端末, description: 最終記録は、回収された乗客全員を「解放不適」としている。 } }
    event: The party finds that the isolation line used medical clearance to prevent anyone from returning to the surface.
  - { id: room.tl6f.quarantine-shelves, name: Quarantine Shelves, description: High shelves turn the old ward into an echoing maze., locales: { ja: { name: 隔離書架, description: 高い書架が、元病棟を反響する迷路に変えている。 } }, encounterTable: encounters.tl6f.records }
  - { id: room.tl6f.sealed-case, name: Sealed Case File, description: A sealed cabinet holds a protected personnel record., locales: { ja: { name: 封印症例箱, description: 封じられた保管箱に、保護対象の職員記録がある。 } }, chest: { treasureTable: treasure.tl6f.records-cache, trap: { kind: gas, difficulty: 18, damage: 7 } } }
  - { id: room.tl6f.records-vault, name: Records Vault, description: The deepest files name the central isolation bureau as the line's destination., locales: { ja: { name: 記録金庫, description: 最も深い記録は、中央隔離局こそ路線の行先だと示す。 } }, encounterTable: encounters.tl6f.records, chamberGuardian: true }
  - { id: room.tl6f.sample-cabinet, name: Sample Cabinet, description: Dry medical supplies remain in a cabinet at the end of a silent aisle., locales: { ja: { name: 検体保管棚, description: 静かな書架の行き止まりに、乾いた医療品が残る。 } }, treasureTable: treasure.tl6f.records-cache }
  - { id: room.tl6f.lift-control, name: Lift Control, description: The lift control offers a route back without replacing the visible stair., locales: { ja: { name: リフト制御盤, description: 制御盤は戻り道を短くするが、見える階段を置き換えるものではない。 } } }
  - { id: room.tl6f.discharge-cache, name: Discharge Cache, description: A stamped release folder hides a reserve medicine pack., locales: { ja: { name: 退院書類の隠し場所, description: 押印済みの退院書類に、予備の薬包が隠されている。 } }, treasureTable: treasure.tl6f.records-cache }
  - { id: room.tl6f.return-marker, name: Records Call Box, description: A staffed-call button links deliberately back to the surface hub., locales: { ja: { name: 記録庫の非常通話, description: 職員呼出ボタンは、意図して地上拠点へ戻る回線につながる。 } }, stairsToTown: true, returnStyle: marker }
  - { id: room.tl6f.down-stair, name: Bureau Stair, description: A reinforced stair drops to the outer offices of the central bureau., locales: { ja: { name: 中央局への階段, description: 補強された階段が、中央隔離局の外縁へ下る。 } } }
---

# F6・医療記録庫

医療記録が帰還を拒むための道具になったことを知る。終盤帯への階段は、記録の発見で封じない。
