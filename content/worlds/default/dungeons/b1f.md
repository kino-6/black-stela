---
id: dungeon.b1f
name: B1F - Silent Approach
level: 1
role: onboarding
dangerTier: 1
recommendedPartyLevel: 1
recommendedClearLevel: 2
tags:
  - onboarding
  - mapping
  - block-1
authorNotes: >-
  Onboarding floor built as a Wizardry-style wheel of meaningful space: a perimeter
  ring joins four corner rooms, and four spokes run from the ring to a central hub
  (hub-and-spoke + nested loops). Every reachable cell serves a path, a room, a
  reward, or a hazard — no dead filler. The intro fight sits on the entry spoke, the
  needle plate on the east spoke by the stair. The Winding Stair is NOT locked — the
  party may descend whenever it likes — but the floor is laid out and balanced so a
  party that has read ~80% of it arrives at B2F ready, while a half-blind dash leaves
  it under-levelled and punished below (pressure by difficulty, not by a gate).
  Rewards pull the party outward: the Guarded Reliquary (NW), the Warden's Hall
  strongbox + winch home (SE), two dead-end niches off the top ring, and a premium
  cache behind a searched wall south of the hub.
startRoom: room.b1f.001
map: |
  ####################
  ######T#####U#######
  ###A.....N......B###
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  #ED......H......Q.X#
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  ###.#####.######.###
  ###C.....S......K###
  #########V##########
  ####################
  ####################
symbols:
  E: room.b1f.001
  D: room.b1f.002
  H: room.b1f.hub
  A: room.b1f.reliquary
  N: room.b1f.north
  B: room.b1f.ne
  Q: room.b1f.east
  X: room.b1f.012
  C: room.b1f.sw
  S: room.b1f.south
  K: room.b1f.warden
  T: room.b1f.niche1
  U: room.b1f.niche2
  V: room.b1f.vault
corridor:
  name: Dust-Choked Gallery
  description: A low run of fitted stone, dust banked along the walls and broken only by the party's own tracks.
  locales:
    ja:
      name: 塵の広廊
      description: 切石の低い通路。壁際に塵が積もり、隊列自身の足跡だけがそれを乱している。
edges:
  - from: room.b1f.012
    direction: east
    kind: stairs
    to: room.b2f.001
    targetFloorId: dungeon.b2f
  - from: room.b1f.south
    direction: south
    kind: secret
    to: room.b1f.vault
  - from: room.b1f.warden
    direction: south
    kind: shortcut
    to: room.b1f.001
rooms:
  - id: room.b1f.001
    name: Silent Stone Chamber
    description: Cold fitted blocks press close. Stairs climb back to town behind the party; the only way on leaks dry air to the east.
    locales:
      ja:
        name: 静まり返った石室
        description: 冷たい切石が近く迫る。背後には町へ上る階段。先へ続く唯一の道は、東へ乾いた空気を漏らしている。
    stairsToTown: true
    returnStyle: stairs
    treasureTable: treasure.b1f.safe
  - id: room.b1f.002
    name: Hall of Old Dust
    description: Dust lies in bands across the floor, broken by fresh marks — and something low and pale stirs in them.
    locales:
      ja:
        name: 古い塵の広間
        description: 床には古い塵が帯のように積もり、新しい跡だけがそれを乱している。その中で、低く青白い何かが蠢く。
    encounter:
      id: enemy.b1f.ash-slime
      name: Ash Slime
      hp: 4
      attack: 1
      role: attrition
      dangerTier: 1
      tags:
        - tutorial
    encounterTable: encounters.b1f.halls
  - id: room.b1f.hub
    name: Ashfall Crossing
    description: A wide chamber where the ways from every quarter meet under a slow fall of ash. It is the room the party keeps coming back to.
    locales:
      ja:
        name: 灰の辻
        description: 四方の道が、絶え間なく降る灰の下で交わる広間。隊列が何度も戻ってくることになる部屋だ。
    encounterTable: encounters.b1f.chambers
  - id: room.b1f.north
    name: Cold Antechamber
    description: A bare northern room, its far wall sweating cold. Two ways out flank a shelf of split stone.
    locales:
      ja:
        name: 冷えた前室
        description: 何もない北の部屋。奥の壁が冷たく汗をかいている。割れた石棚の両脇に、二つの出口。
    encounterTable: encounters.b1f.chambers
  - id: room.b1f.east
    name: Smoke-Bent Passage
    description: Smoke stains lean along the ceiling. A line of pinholes breaks the dust just where a boot would fall, and the stair curls off to the east.
    locales:
      ja:
        name: 煙に曲がる通路
        description: 天井の煤が斜めに流れている。ちょうど足を下ろす所で、細かな針穴の列が塵を破り、東には階段が渦を巻く。
    trap:
      id: trap.b1f.needle
      name: A hidden needle plate
      damage: 2
      detectDc: 10
      warning: A line of pinholes breaks the dust ahead.
    encounterTable: encounters.b1f.halls
  - id: room.b1f.reliquary
    name: Guarded Reliquary
    description: A north-west vault of niched stone, each hollow once meant for an offering. Most are empty; one is not.
    locales:
      ja:
        name: 守られた聖遺室
        description: 北西の、壁龕を穿った石室。それぞれの窪みはかつて供物のためのもの。大半は空だが、一つは違う。
    treasureTable: treasure.b1f.safe
  - id: room.b1f.ne
    name: Cracked Rotunda
    description: A round north-east room, its dome split by a hairline seam that lets down a thread of grey light.
    locales:
      ja:
        name: 罅割れた円堂
        description: 北東の丸い部屋。円蓋には髪ほどの裂け目が走り、灰色の光が一筋差し込む。
    encounterTable: encounters.b1f.halls
  - id: room.b1f.sw
    name: Sunken Gallery
    description: The floor dips here in the south-west, dust pooled in the low center like still water.
    locales:
      ja:
        name: 沈んだ回廊
        description: 南西で床が窪み、低い中央に塵が水のように溜まっている。
    encounterTable: encounters.b1f.chambers
  - id: room.b1f.south
    name: Guide Stone Chamber
    description: A sunken guide stone squats at the center, and the south wall rings hollow under a knuckle.
    locales:
      ja:
        name: 導石の間
        description: 中央に沈んだ導石がうずくまり、南の壁は指で叩くと空ろに鳴る。
    encounterTable: encounters.b1f.chambers
  - id: room.b1f.warden
    name: Warden's Hall
    description: A south-east hall of chained machinery, long stilled. A winch cage above hauls a climber straight back up to the entrance, and a strongbox sits forgotten in the gears.
    locales:
      ja:
        name: 番人の広間
        description: 南東の、鎖につながれた機構の広間。今は静まっている。頭上の籠は登る者を入口まで一気に引き上げ、歯車の間には忘れられた頑丈な箱が残されている。
    stairsToTown: true
    returnStyle: marker
    treasureTable: treasure.b1f.safe
  - id: room.b1f.012
    name: Winding Stair
    description: The stair curls east off the trunk's end, biting down through the stone toward B2F. Nothing bars it — but the party that walks down half-blind pays for it below.
    locales:
      ja:
        name: 巻き階段
        description: 通路の突き当たりから東へ、階段が渦を巻いて石を噛み下り、B2Fへ続いている。塞ぐものは何もない——が、この階を半ば手探りのまま降りた隊列は、下でその報いを受ける。
  - id: room.b1f.niche1
    name: West Offering Niche
    description: A dead-end slot off the top ring, a cloth-wrapped offering left in the dark.
    locales:
      ja:
        name: 西の供物龕
        description: 上部の環から外れた行き止まりの窪み。布に包まれた供物が闇に残されている。
    treasureTable: treasure.b1f.safe
  - id: room.b1f.niche2
    name: East Offering Niche
    description: A second dead-end slot off the top ring, its offering long since gone grey with ash.
    locales:
      ja:
        name: 東の供物龕
        description: 上部の環から外れた二つ目の行き止まり。供物はとうに灰をかぶって灰色だ。
    treasureTable: treasure.b1f.safe
  - id: room.b1f.vault
    name: Ashen Reliquary
    description: A slot of dry air hides behind the guide chamber's south wall, missed by every dusty boot before. A cloth-bound offering rests in the dark, richer than the open caches.
    locales:
      ja:
        name: 灰の宝室
        description: 導石の間の南壁の奥に、乾いた空気の隙間が隠れている。これまでどの足も見落としてきた。開けた物置より豊かな、布に包まれた供物が闇に鎮まる。
    treasureTable: treasure.b1f.secret
---

# B1F - Silent Approach

The onboarding floor: a wheel of ring, spokes, and hub that teaches movement,
combat, and searching. The stair is never locked — the floor earns its exploration
through rewards and the difficulty waiting below, not through a gate.
