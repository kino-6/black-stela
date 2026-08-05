---
id: dungeon.tl-depot1
dungeon: depot
name: Freight Yard — Receiving
locales: { ja: { name: 貨物基地・受入 } }
level: 5
role: optional
dangerTier: 3
recommendedPartyLevel: 5
recommendedPartySize: 4
recommendedClearLevel: 5
tags: [side, depot, farm, block-1]
authorNotes: >-
  A THREE-FLOOR SIDE DUNGEON (dungeon group "depot"), reached by its own town portal — a breather a
  mid-game party drops into to grind salvage and cash rather than pressing the main descent. A compact
  ring loop: enter, sweep the platform packs, empty two salvage lockers, drop to the sorting yard.
  Danger sits a notch UNDER the main line at this depth (packs are porters and lampreys, not marshals),
  but the lockers pay in sellable gear — the point is a quick, repeatable earning circuit.
startRoom: room.tl-depot1.gate
map: |
  #############
  #G.a.b.c.d.D#
  #.#########.#
  #R.........L#
  #.#########.#
  #.....M.....#
  #############
symbols:
  G: room.tl-depot1.gate
  a: room.tl-depot1.receiving-dock
  b: room.tl-depot1.pallet-run
  c: room.tl-depot1.salvage-locker
  d: room.tl-depot1.weighbridge
  D: room.tl-depot1.down-stair
  R: room.tl-depot1.return-lift
  L: room.tl-depot1.lost-property
  M: room.tl-depot1.foreman-office
corridor:
  name: Cargo Aisle
  description: Steel racking runs off into the dark. Faded consignment labels flap where a draught still moves.
  locales:
    ja:
      name: 貨物通路
      description: 鋼の棚が闇へ続く。まだ動く隙間風に、褪せた荷札がはためいている。
edges:
  - { from: room.tl-depot1.down-stair, direction: east, kind: stairs, to: room.tl-depot2.sorting-landing, targetFloorId: dungeon.tl-depot2 }
rooms:
  - id: room.tl-depot1.gate
    name: Freight Shutter
    description: A cargo shutter propped on a jack, opening off the interchange back-of-house. The way home is the goods lift behind you.
    locales: { ja: { name: 貨物シャッター, description: ジャッキで支えた貨物シャッターが、乗換場の裏手へ開く。帰り道は背後の荷役リフトだ。 } }
    stairsToTown: true
    returnStyle: stairs
  - id: room.tl-depot1.receiving-dock
    name: Receiving Dock
    description: A loading bay where drain-rats nest in split crates. Easy pickings for a party warming up.
    locales: { ja: { name: 受入ドック, description: 割れた木箱に排水ネズミが巣くう荷受場。肩慣らしにちょうどいい。 } }
    encounterTable: encounters.tl-depot1.receiving
  - id: room.tl-depot1.pallet-run
    name: Pallet Run
    description: Toppled pallets funnel a porter pack into a narrow lane.
    locales: { ja: { name: パレット通路, description: 崩れたパレットが、運搬人の群れを狭い通路へ押し込む。 } }
    encounterTable: encounters.tl-depot1.receiving
  - id: room.tl-depot1.salvage-locker
    name: Salvage Locker
    description: A crew locker the yard never cleared out. Sellable gear, if the latch gives.
    locales: { ja: { name: 回収ロッカー, description: 基地が片づけ損ねた作業員ロッカー。掛け金が外れれば、売れる装備が眠っている。 } }
    treasureTable: treasure.tl-depot.salvage
    event: A jammed crew locker yields tools and gear the yard wrote off — worth carrying out to sell.
  - id: room.tl-depot1.weighbridge
    name: Weighbridge
    description: A flooded weighbridge pit. A silt lamprey coils in the mechanism.
    locales: { ja: { name: 計量台, description: 浸水した計量ピット。機構の中に泥ウナギがとぐろを巻く。 } }
    damageTile: 1
    encounterTable: encounters.tl-depot1.receiving
  - id: room.tl-depot1.down-stair
    name: Cargo Stair
    description: A freight stair drops toward the sorting yard, where the real salvage is graded.
    locales: { ja: { name: 貨物階段, description: 貨物階段が、仕分けヤードへ落ちていく。本当の回収品は、その先で選別される。 } }
  - id: room.tl-depot1.return-lift
    name: Goods Lift
    description: The goods lift still climbs to the interchange — a clean way back up with a full pack.
    locales: { ja: { name: 荷役リフト, description: 荷役リフトはまだ乗換場まで上がる。荷を積んで戻るには、綺麗な帰り道だ。 } }
    stairsToTown: true
    returnStyle: stairs
  - id: room.tl-depot1.lost-property
    name: Lost Property Cage
    description: A wire cage of unclaimed freight. Someone's loss, the party's earnings.
    locales: { ja: { name: 遺失物ケージ, description: 引き取り手のない貨物を囲う金網。誰かの損失が、一党の稼ぎになる。 } }
    treasureTable: treasure.tl-depot.salvage
  - id: room.tl-depot1.foreman-office
    name: Foreman's Office
    description: The yard foreman's post. A porter crew still runs the shift that never ended.
    locales: { ja: { name: 班長詰所, description: ヤード班長の詰所。終わらないシフトを、運搬人の組がまだ回している。 } }
    encounterTable: encounters.tl-depot1.foreman
    treasureTable: treasure.tl-depot.office
    event: The foreman's safe still holds a shift's takings.
---

# Freight Yard — Receiving (side dungeon, floor 1/3)

The first floor of the optional "depot" dungeon (T30/U5 multi-dungeon proof). A mid-game earning loop
authored as pure data — no code change — off its own town portal.
