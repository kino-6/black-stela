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
  - block-3
authorNotes: Optional high-risk side objective before the finale.
startRoom: room.b7f.001
grid:
  cells:
    - id: cell.b7f.001
      roomId: room.b7f.001
      x: 0
      y: 0
      edges:
        west:
          kind: stairs
          targetRoomId: room.b6f.003
          targetFloorId: dungeon.b6f
        east:
          kind: stairs
          targetRoomId: room.b8f.001
          targetFloorId: dungeon.b8f
        south:
          kind: door
          targetRoomId: room.b7f.002
          targetCellId: cell.b7f.002
    - id: cell.b7f.002
      roomId: room.b7f.002
      x: 0
      y: 1
      edges:
        north:
          kind: door
          targetRoomId: room.b7f.001
          targetCellId: cell.b7f.001
        east:
          kind: locked
          targetRoomId: room.b7f.003
          targetCellId: cell.b7f.003
    - id: cell.b7f.003
      roomId: room.b7f.003
      x: 1
      y: 1
      edges:
        west:
          kind: door
          targetRoomId: room.b7f.002
          targetCellId: cell.b7f.002
rooms:
  - id: room.b7f.001
    name: Fork of Quiet Vaults
    description: A lower passage continues east; a sealed vault lies south.
    locales:
      ja:
        name: 静かな納骨庫の分岐
        description: 低い通路は東へ続き、南の封じ石から冷気がにじむ。
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
