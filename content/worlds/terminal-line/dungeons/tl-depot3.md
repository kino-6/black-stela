---
id: dungeon.tl-depot3
dungeon: depot
name: Freight Yard — Bonded Store
locales: { ja: { name: 貨物基地・保税倉庫 } }
level: 7
role: optional
dangerTier: 4
recommendedPartyLevel: 7
recommendedPartySize: 4
recommendedClearLevel: 7
tags: [side, depot, farm, vault, block-2]
authorNotes: >-
  Bottom floor of the depot side dungeon: the strongroom. One graded pack (a pallbearer + bailiffs) sits
  on the vault, and the vault pays the run — the richest salvage table in the dungeon plus a bonded cache.
  NOT a boss (no isBoss): the fight re-arms each expedition, so this is a repeatable payday, not a wall.
  The bonded lift returns straight to town so a heavy pack does not have to climb back out.
startRoom: room.tl-depot3.vault-landing
map: |
  #############
  #U.a.....b.T#
  #.#####.###.#
  #L....#V#...#
  #.###.#.#.#.#
  #.....#...#.#
  #.#######.#.#
  #H.........#
  #############
symbols:
  U: room.tl-depot3.vault-landing
  a: room.tl-depot3.strong-aisle
  b: room.tl-depot3.seal-room
  T: room.tl-depot3.up-stair
  L: room.tl-depot3.lost-freight
  V: room.tl-depot3.vault
  H: room.tl-depot3.bonded-lift
corridor:
  name: Strongroom Aisle
  description: Blast-rated doors line a concrete spine. The air is dry and still, kept for what was stored, not who.
  locales:
    ja:
      name: 金庫室通路
      description: 防爆扉がコンクリートの背骨に並ぶ。空気は乾いて動かない。守られてきたのは中身で、人ではない。
edges:
  - { from: room.tl-depot3.up-stair, direction: east, kind: stairs, to: room.tl-depot2.down-stair, targetFloorId: dungeon.tl-depot2 }
rooms:
  - id: room.tl-depot3.vault-landing
    name: Vault Landing
    description: The guarded stair opens onto the strongroom spine. A bailiff pack patrols deeper in the aisle.
    locales: { ja: { name: 保管庫踊り場, description: 見張りの階段が金庫室の背骨へ開く。執行の組は、通路の奥を巡回している。 } }
  - id: room.tl-depot3.strong-aisle
    name: Strong Aisle
    description: A run of blast doors, most stripped, a few not. The unstripped ones are the point.
    locales: { ja: { name: 金庫通路, description: 防爆扉が連なる。多くは剥がされ、いくつかは無事。無事な扉こそが目当てだ。 } }
    treasureTable: treasure.tl-depot.bonded
  - id: room.tl-depot3.seal-room
    name: Seal Room
    description: Where consignments were sealed. A pump sentinel still stamps an empty manifest.
    locales: { ja: { name: 封印室, description: 荷が封印されていた部屋。ポンプ番兵が、空の目録にまだ判を押している。 } }
    encounterTable: encounters.tl-depot3.strongroom
  - id: room.tl-depot3.up-stair
    name: Vault Stair (Up)
    description: The guarded stair climbs back to the sorting hall.
    locales: { ja: { name: 保管庫階段（上り）, description: 見張りの階段が仕分けホールへ上り返す。 } }
  - id: room.tl-depot3.lost-freight
    name: Lost Freight Vault
    description: A cage of freight no one ever claimed. Weeks of a yard's earnings, if it can be carried out.
    locales: { ja: { name: 遺失貨物庫, description: 誰も引き取らなかった貨物の檻。運び出せれば、ヤードの数週ぶんの稼ぎになる。 } }
    treasureTable: treasure.tl-depot.salvage
  - id: room.tl-depot3.vault
    name: Bonded Vault
    description: The strongroom proper. A pallbearer stands its shift over the richest cache in the yard.
    locales: { ja: { name: 保税金庫, description: 金庫室の本体。運び手が、ヤードで最も豊かな蓄えの前で見張りを続ける。, event: 保税金庫には、ヤードが溜め込んだ売上——この探索の本当の稼ぎが眠る。 } }
    encounterTable: encounters.tl-depot3.vault
    treasureTable: treasure.tl-depot.vault
    event: The bonded vault holds the yard's kept takings — the run's real payoff.
  - id: room.tl-depot3.bonded-lift
    name: Bonded Lift
    description: A freight lift keyed straight to the interchange dock. It takes a full load home.
    locales: { ja: { name: 保税リフト, description: 乗換ドックへ直通の貨物リフト。満載のまま町へ運んでくれる。 } }
    stairsToTown: true
    returnStyle: stairs
---

# Freight Yard — Bonded Store (side dungeon, floor 3/3)

The vault floor: the depot's payday — richest salvage + a re-arming guardian pack, and a lift straight home.
