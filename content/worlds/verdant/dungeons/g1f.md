---
id: dungeon.verdant.g1f
name: G1F - Root Gallery
level: 1
startRoom: room.verdant.g1f.001
tags:
  - proof-fixture
map: |
  #######
  #E...A#
  #.###.#
  #G...R#
  #######
symbols:
  E: room.verdant.g1f.001
  A: room.verdant.g1f.002
  G: room.verdant.g1f.003
  R: room.verdant.g1f.004
corridor:
  name: Overgrown Path
  description: A root-laced passage; pale green light filters down through the canopy far above.
  locales:
    ja:
      name: 蔦の回廊
      description: 根が絡む通路。はるか頭上の樹冠から、淡い緑の光が差し込む。
rooms:
  - id: room.verdant.g1f.001
    name: Sunken Threshold
    description: The way in from the surface — a mossy stair climbs back toward daylight.
    stairsToTown: true
    returnStyle: stairs
    locales:
      ja:
        name: 沈んだ入口
        description: 地上への入口。苔むした階段が陽の光へと登っていく。
  - id: room.verdant.g1f.002
    name: Bramble Chamber
    description: A round chamber choked with thorn-vine; something green stirs among the roots.
    encounter:
      id: enemy.verdant.moss-shambler
      name: Moss Shambler
      hp: 8
      attack: 3
      xp: 4
      locales:
        ja:
          name: 苔の蠢き
      tags:
        - proof
    locales:
      ja:
        name: 茨の間
        description: 棘蔓が絡む円い間。根の間で、緑の何かが蠢いている。
  - id: room.verdant.g1f.003
    name: Fern Grove
    description: A quiet grove of ferns, the air thick with spores and green light.
    locales:
      ja:
        name: 羊歯の木立
        description: 静かな羊歯の木立。胞子と緑の光で空気が濃い。
  - id: room.verdant.g1f.004
    name: Root Hollow
    description: A hollow between great roots, dry enough to rest a moment.
    restPoint: true
    locales:
      ja:
        name: 根の洞
        description: 大樹の根の間の洞。しばし休めるほどには乾いている。
---

# G1F - Root Gallery

A single small floor for the verdant proof scenario: a navigable root-loop with
one fresh-party fight and a return stair. Not full content — a switching fixture.
