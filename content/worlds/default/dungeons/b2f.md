---
id: dungeon.b2f
name: B2F - Split Dust
level: 2
role: attrition
dangerTier: 2
recommendedPartyLevel: 1
tags:
  - branching
  - shortcut
authorNotes: Introduces branch choice, locked shortcut, and a stronger hallway mix.
startRoom: room.b2f.001
rooms:
  - id: room.b2f.001
    name: Landing of Split Dust
    description: Two dust trails divide around a sunken guide stone.
    locales:
      ja:
        name: 分かれ塵の踊り場
        description: 沈んだ導石を挟み、二本の塵の道が分かれている。
    exits:
      west: room.b1f.003
      east: room.b2f.002
      south: room.b2f.003
    encounterTable: encounters.b2f.branches
  - id: room.b2f.002
    name: Hooked Corridor
    description: Iron hooks line the mortar gaps. Most are too old to move.
    locales:
      ja:
        name: 鉤の通廊
        description: 目地に鉄の鉤が並ぶ。ほとんどは古すぎて動かない。
    exits:
      west: room.b2f.001
      south: room.b2f.003
    trap:
      id: trap.b2f.hook-line
      name: Hook Line
      damage: 3
      detectDc: 11
      warning: A hook near the floor has no dust on it.
    treasureTable: treasure.b2f.risk
  - id: room.b2f.003
    name: Soot-Locked Door
    description: A smoke-black door can be opened from this side after the latch is found.
    locales:
      ja:
        name: 煤鍵の扉
        description: 煙で黒ずんだ扉は、こちら側から掛け金を見つければ開く。
    exits:
      north: room.b2f.002
      east: room.b3f.001
      west: room.b2f.001
    gates:
      - id: gate.b2f.soot-shortcut
        direction: west
        kind: shortcut
        grantsFlag: flag.b2f.soot-shortcut
        clue: The latch is hidden behind a square of cleaner stone.
        locales:
          ja:
            clue: きれいすぎる石板の裏に掛け金が隠れている。
---

# B2F - Split Dust

A compact branch floor that teaches route choice and shortcut memory.
