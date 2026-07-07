---
id: dungeon.b1f
name: B1F - Silent Approach
level: 1
role: onboarding
dangerTier: 1
recommendedPartyLevel: 1
tags:
  - onboarding
  - mapping
  - block-1
authorNotes: >-
  Onboarding floor filling the full 20x20 frame. A short forced trunk teaches the
  grammar in order (move east into the first fight, cross the central hub, search
  the needle plate, reach the black marker), and off the hub two open halls reward
  exploration — a guarded reliquary to the north and a warden's hall to the south,
  each an open Wizardry-style room with a fight and a cache. Side galleries loop
  the halls back to the trunk so the floor reads as a weave, not a line; dead-end
  niches hide extra treasure. The trunk stays one-wide from the trap to the marker
  so the descent always passes the searched plate. The marker's winch cage opens a
  one-way shortcut back to the entrance. The entrance opens east so the fixed
  starting facing walks the party straight into the teaching fight.
startRoom: room.b1f.001
map: |
  ####################
  ######D#############
  ###............#####
  ###............#####
  ###...A....B...#####
  ###............#####
  ###............#####
  ###.####.#.###.#####
  ###.####.#.###.#####
  #EC.....H......N..M#
  ###.####.#.###.#####
  ###.####.#.###.#####
  ###............#####
  ###............#####
  ###...S....K...#####
  ###............#####
  ###............#####
  ######G#############
  ####################
  ####################
symbols:
  E: room.b1f.001
  C: room.b1f.002
  H: room.b1f.003
  D: room.b1f.004
  N: room.b1f.005
  M: room.b1f.006
  G: room.b1f.007
  A: room.b1f.008
  B: room.b1f.009
  S: room.b1f.010
  K: room.b1f.011
corridor:
  name: Dust-Choked Gallery
  description: A low run of fitted stone, dust banked along the walls and broken only by the party's own tracks.
  locales:
    ja:
      name: 塵の広廊
      description: 切石の低い通路。壁際に塵が積もり、隊列自身の足跡だけがそれを乱している。
edges:
  - from: room.b1f.006
    direction: east
    kind: stairs
    to: room.b2f.001
    targetFloorId: dungeon.b2f
  - from: room.b1f.006
    direction: north
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
  - id: room.b1f.003
    name: Ashfall Crossing
    description: A wide chamber where the ways from every quarter meet under a slow fall of ash. It is the room you keep coming back to.
    locales:
      ja:
        name: 灰降りの辻
        description: ゆっくりと灰の降る下で、四方の道が交わる広い部屋。何度も戻ってくることになる場所だ。
    encounterTable: encounters.b1f.chambers
  - id: room.b1f.004
    name: Chalk-Marked Niche
    description: A dead-end niche off the north hall, an old cloth bundle wedged behind the chalk tallies.
    locales:
      ja:
        name: 白墨の小間
        description: 北の広間から外れた行き止まりの小間。白墨の刻み書きの裏に、古い布包みが挟まっている。
    treasureTable: treasure.b1f.nook
  - id: room.b1f.005
    name: Smoke-Bent Passage
    description: Smoke stains lean along the ceiling. A line of pinholes breaks the dust just where a boot would fall.
    locales:
      ja:
        name: 煙に曲がる通路
        description: 天井の煤が斜めに流れている。ちょうど足を下ろす所で、細かな針穴の列が塵を破っている。
    trap:
      id: trap.b1f.needle
      name: A hidden needle plate
      damage: 2
      detectDc: 10
      warning: A line of pinholes breaks the dust ahead.
  - id: room.b1f.006
    name: Black Marker
    description: A narrow marker of black stone leans beside a capped shaft and a stair curling east. A winch cage hangs over the shaft.
    locales:
      ja:
        name: 黒い標石
        description: 蓋をされた竪坑と、東へ巻く階段のそばに、細い黒石の標が傾いている。竪坑の上には籠が掛かっている。
        event: 標石は手に温かい。竪坑の籠は、入口まで一気に戻る道を約束している。
    stairsToTown: true
    returnStyle: marker
    gates:
      - id: gate.b1f.first-descent
        direction: east
        kind: shortcut
        grantsFlag: flag.b1f.marker-read
        clue: The lower stair accepts only a party that knows how to return.
        locales:
          ja:
            clue: 下り階段は、帰還を知る隊列だけを受け入れる。
    event: The marker is warm to the touch; the shaft cage promises a quick way back to the entrance.
  - id: room.b1f.007
    name: Drift Cache
    description: A dead-end pocket off the south hall where ash drifted deep over a forgotten satchel.
    locales:
      ja:
        name: 吹き溜まりの隠し
        description: 南の広間から外れた行き止まりの窪み。灰が深く吹き溜まり、忘れられた鞄を覆っている。
    treasureTable: treasure.b1f.nook
  - id: room.b1f.008
    name: Chalk-Marked Reliquary
    description: The heart of the north hall — old chalk tallies crowd the walls, a cloth-wrapped offering rests on a ledge, and a pale crawler coils to guard it.
    locales:
      ja:
        name: 白墨の宝処
        description: 北の広間の中心。古い白墨の刻み書きが壁を埋め、棚には布に包まれた供物が置かれ、それを守るように青白い這い者がとぐろを巻いている。
    encounter:
      id: enemy.b1f.dust-crawler
      name: Dust Crawler
      hp: 6
      attack: 2
      role: attrition
      dangerTier: 1
      tags:
        - beast
    treasureTable: treasure.b1f.chamber
  - id: room.b1f.009
    name: Ledger Ledge
    description: A stone shelf along the north hall where a stitched pouch was tucked behind the tallies.
    locales:
      ja:
        name: 帳面の棚
        description: 北の広間沿いの石棚。刻み書きの裏に、縫い綴じられた小袋が押し込まれている。
    treasureTable: treasure.b1f.nook
  - id: room.b1f.010
    name: Warden's Hall
    description: The heart of the south hall, cinders drifted into the corners. Something heavier than a slime shifts its weight in the dark.
    locales:
      ja:
        name: 番人の広間
        description: 南の広間の中心。燃え殻が隅に吹き溜まっている。前方の闇で、泥よりも重い何かが身じろぎする。
    encounter:
      id: enemy.b1f.dust-crawler
      name: Dust Crawler
      hp: 6
      attack: 2
      role: attrition
      dangerTier: 1
      tags:
        - beast
    treasureTable: treasure.b1f.chamber
  - id: room.b1f.011
    name: Cinder Cache
    description: A cinder-choked corner of the warden's hall, a stitched pouch half-buried in the drift.
    locales:
      ja:
        name: 燃え殻の隠し
        description: 番人の広間の燃え殻に塞がれた隅。縫い綴じの小袋が吹き溜まりに半ば埋もれている。
    treasureTable: treasure.b1f.chamber
---

# B1F - Silent Approach

The first floor, filling the full 20x20 frame. A short forced trunk carries the
teaching beats in order — move east into the first fight, cross the central
Ashfall Crossing, search the needle plate, reach the black marker — while two
open halls off the hub reward the curious: a guarded reliquary to the north and a
warden's hall to the south, each an open room with a fight and a cache, looped
back to the trunk by side galleries. Dead-end niches hide extra treasure. From
the trap to the marker the trunk stays one-wide, so the descent always passes the
searched plate; the marker's winch cage opens a one-way shortcut back to the
entrance.
