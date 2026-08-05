---
id: dungeon.tl-depot2
dungeon: depot
name: Freight Yard — Sorting
locales: { ja: { name: 貨物基地・仕分け } }
level: 6
role: optional
dangerTier: 3
recommendedPartyLevel: 6
recommendedPartySize: 4
recommendedClearLevel: 6
tags: [side, depot, farm, block-2]
authorNotes: >-
  Middle floor of the depot side dungeon. A sorting hall with a maintenance bay the party can rest in
  (restPoint) so a farm run does not have to surface between the entry and the vault. Packs are
  cold-store widows and pump sentinels — a step up from receiving, still under the main line.
startRoom: room.tl-depot2.sorting-landing
map: |
  #############
  #U.a.b.c.d.D#
  #.#########.#
  #P.........V#
  #.#########.#
  #.....W.....#
  #############
symbols:
  U: room.tl-depot2.sorting-landing
  a: room.tl-depot2.grading-line
  b: room.tl-depot2.container-stack
  c: room.tl-depot2.bonded-cage
  d: room.tl-depot2.chute-run
  D: room.tl-depot2.down-stair
  P: room.tl-depot2.up-stair
  V: room.tl-depot2.maintenance-bay
  W: room.tl-depot2.weigh-office
corridor:
  name: Sorting Hall
  description: Roller conveyors cross overhead, still holding freight that was never routed on.
  locales:
    ja:
      name: 仕分けホール
      description: ローラーコンベアが頭上を渡り、行き先を失った貨物をまだ載せている。
edges:
  - { from: room.tl-depot2.down-stair, direction: east, kind: stairs, to: room.tl-depot3.vault-landing, targetFloorId: dungeon.tl-depot3 }
  - { from: room.tl-depot2.up-stair, direction: west, kind: stairs, to: room.tl-depot1.down-stair, targetFloorId: dungeon.tl-depot1 }
rooms:
  - id: room.tl-depot2.sorting-landing
    name: Sorting Landing
    description: The cargo stair opens onto the sorting hall. The packs are further in, working the belts.
    locales: { ja: { name: 仕分け踊り場, description: 貨物階段が仕分けホールへ開く。群れはさらに奥、ベルトの上で働いている。 } }
  - id: room.tl-depot2.grading-line
    name: Grading Line
    description: A grading belt where widows string cold-store webbing between the racks.
    locales: { ja: { name: 選別ライン, description: 選別ベルトの棚の間に、冷蔵倉の未亡人が糸を張っている。 } }
    encounterTable: encounters.tl-depot2.sorting
  - id: room.tl-depot2.container-stack
    name: Container Stack
    description: Stacked containers, a few still sealed. Sealed usually means worth carrying.
    locales: { ja: { name: コンテナ段積み, description: 段積みのコンテナ。いくつかはまだ封がある。封があるものは、たいてい運ぶ価値がある。 } }
    treasureTable: treasure.tl-depot.salvage
  - id: room.tl-depot2.bonded-cage
    name: Bonded Cage
    description: A customs-bonded cage the seals outlasted the staff. Higher-grade salvage than the open floor.
    locales: { ja: { name: 保税ケージ, description: 職員より封印が長生きした保税ケージ。開架より上等な回収品が並ぶ。 } }
    treasureTable: treasure.tl-depot.bonded
  - id: room.tl-depot2.chute-run
    name: Chute Run
    description: A parcel chute jammed with a pump sentinel that keeps trying to clear it.
    locales: { ja: { name: シュート通路, description: 小口シュートに詰まったポンプ番兵が、それを片づけようとし続けている。 } }
    encounterTable: encounters.tl-depot2.sorting
  - id: room.tl-depot2.down-stair
    name: Vault Stair
    description: A guarded stair drops to the bonded store — the yard's strongroom.
    locales: { ja: { name: 保管庫階段, description: 見張り付きの階段が、保税倉庫へ落ちる。ヤードの金庫室だ。 } }
  - id: room.tl-depot2.up-stair
    name: Cargo Stair (Up)
    description: The cargo stair climbs back to receiving.
    locales: { ja: { name: 貨物階段（上り）, description: 貨物階段が受入へ上り返す。 } }
  - id: room.tl-depot2.maintenance-bay
    name: Maintenance Bay
    description: A powered-down repair bay. Safe enough to catch a breath and re-lamp before the vault.
    locales: { ja: { name: 整備ベイ, description: 電源の落ちた修理ベイ。金庫室の前に、一息ついて灯を替えるくらいは安全だ。 } }
    restPoint: true
    event: The party rests in the dead maintenance bay and marks it as a fallback point.
  - id: room.tl-depot2.weigh-office
    name: Weigh Office
    description: The sorting office. A porter shift and its logbook of what shipped where.
    locales: { ja: { name: 計量事務所, description: 仕分け事務所。運搬人のシフトと、何がどこへ送られたかの台帳が残る。 } }
    encounterTable: encounters.tl-depot2.office
    treasureTable: treasure.tl-depot.office
---

# Freight Yard — Sorting (side dungeon, floor 2/3)

The middle floor of the optional depot dungeon: a rest point + graded salvage, between receiving and the vault.
