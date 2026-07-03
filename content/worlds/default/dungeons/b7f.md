---
id: dungeon.b7f
name: B7F - Side Ash Vaults
level: 7
role: optional
dangerTier: 5
recommendedPartyLevel: 4
tags:
  - optional
  - rare-reward
authorNotes: Optional high-risk side objective before the finale.
startRoom: room.b7f.001
rooms:
  - id: room.b7f.001
    name: Fork of Quiet Vaults
    description: A lower passage continues east; a sealed vault waits south.
    locales:
      ja:
        name: 静かな納骨庫の分岐
        description: 低い通路は東へ続き、封じた納骨庫が南で待つ。
    exits:
      west: room.b6f.003
      east: room.b8f.001
      south: room.b7f.002
    encounterTable: encounters.b7f.vaults
  - id: room.b7f.002
    name: Sealed Ash Vault
    description: A keyhole of black glass watches from the sealed slab.
    locales:
      ja:
        name: 封灰の納骨庫
        description: 封じ石の黒硝子の鍵穴がこちらを見ている。
    exits:
      north: room.b7f.001
      east: room.b7f.003
    gates:
      - id: gate.b7f.ash-vault
        direction: east
        kind: lock
        requiredKeyId: item.ashen-key
        clue: The keyhole is not metal; it wants cooled ash.
        locales:
          ja:
            clue: 鍵穴は金属ではない。冷えた灰を求めている。
  - id: room.b7f.003
    name: Optional Reliquary
    description: Something valuable rests here because something dangerous chose not to leave.
    locales:
      ja:
        name: 任意の聖遺物室
        description: 危険なものが去らなかったから、価値あるものもここに残った。
    exits:
      west: room.b7f.002
    treasureTable: treasure.b7f.rare
---

# B7F - Side Ash Vaults

Optional danger gives prepared parties a reason to return.
