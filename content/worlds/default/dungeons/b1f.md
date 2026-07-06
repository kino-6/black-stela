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
  Onboarding floor on a 20x20 frame. A short forced trunk teaches the grammar in
  order (move, first fight, read the map, search the trap, reach the marker),
  while two wings off the central hub reward exploration. A one-way winch cage
  from the marker collapses the return climb. Entrance opens east so the fixed
  starting facing walks the party inward.
startRoom: room.b1f.001
map: |
  ####################
  ######1#############
  ######.....#########
  ######.#.###########
  ######...###########
  ########.###########
  ########.###########
  ########.###########
  #######...##########
  #EC.....H......N..M#
  #######...##########
  ########.###########
  ########.###########
  ########.###########
  ######...###########
  ######.#.###########
  ######.....#########
  ######2#############
  ####################
  ####################
symbols:
  E: room.b1f.001
  C: room.b1f.002
  H: room.b1f.003
  "1": room.b1f.004
  N: room.b1f.005
  M: room.b1f.006
  "2": room.b1f.007
corridor:
  name: Dust-Choked Corridor
  description: A low run of fitted stone, dust banked along the walls and broken only by the party's own tracks.
  locales:
    ja:
      name: 塵の廊下
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
    description: Cold fitted blocks press close. The only way on leaks dry air to the east.
    locales:
      ja:
        name: 静まり返った石室
        description: 冷たい切石が近く迫る。先へ続く唯一の道は、東へ乾いた空気を漏らしている。
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
    description: A wider chamber where four ways meet under a slow fall of ash. It is the one room you keep coming back to.
    locales:
      ja:
        name: 灰降りの辻
        description: ゆっくりと灰の降る下で四方の道が交わる、やや広い部屋。何度も戻ってくることになる場所だ。
  - id: room.b1f.004
    name: Chalk-Marked Niche
    description: A dead-end niche crowded with old chalk tallies, and a cloth bundle someone tucked behind them.
    locales:
      ja:
        name: 白墨の小間
        description: 古い白墨の刻み書きがひしめく行き止まりの小間。その裏に、誰かが押し込んだ布包みがある。
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
    name: Cinder Cache
    description: A dead-end cache where cinders drifted into a dry corner, half-burying a stitched pouch.
    locales:
      ja:
        name: 燃え殻の隠し
        description: 燃え殻が乾いた隅に吹き溜まった行き止まり。縫い綴じられた小袋が半ば埋もれている。
    treasureTable: treasure.b1f.nook
---

# B1F - Silent Approach

The first floor on a full 20x20 frame. A short forced trunk carries the teaching
beats in order — move, the first fight, the anchor hub, the searched trap, the
marker — while two wings off the hub reward the curious with dead-end caches. The
marker's winch cage opens a one-way shortcut straight back to the entrance.
