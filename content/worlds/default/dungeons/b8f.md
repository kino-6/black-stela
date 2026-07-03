---
id: dungeon.b8f
name: B8F - Gate of Ash
level: 8
role: finale
dangerTier: 5
recommendedPartyLevel: 4
tags:
  - finale
  - boss
authorNotes: Final commitment area and return-path pressure.
startRoom: room.b8f.001
rooms:
  - id: room.b8f.001
    name: Ash Gate Approach
    description: The air tastes like a candle just after it dies.
    locales:
      ja:
        name: 灰門の前庭
        description: 空気は、蝋燭が消えた直後の味がする。
    exits:
      west: room.b7f.001
      east: room.b8f.002
    encounterTable: encounters.b8f.gate
  - id: room.b8f.002
    name: Black Stela Root
    description: The buried root of the stela rises from stone like a blade without an edge.
    locales:
      ja:
        name: 黒碑の根
        description: 埋もれた黒碑の根が、刃のない刃物のように石から立つ。
    exits:
      west: room.b8f.001
      east: room.b8f.003
    encounter:
      id: enemy.b8f.ash-votary
      name: Ash Votary
      hp: 22
      attack: 5
      role: boss
      dangerTier: 5
      isBoss: true
      tags:
        - finale
    treasureTable: treasure.b8f.final
  - id: room.b8f.003
    name: Return Scar
    description: A scar in the wall opens toward the town stair only after the ash quiets.
    locales:
      ja:
        name: 帰還の傷跡
        description: 壁の傷跡は、灰が静まった後でだけ街への階段へ開く。
    exits:
      west: room.b8f.002
    stairsToTown: true
    event: The ash gate grows quiet. The party can carry the first proof home.
---

# B8F - Gate of Ash

Finale floor for the first scenario pass.
