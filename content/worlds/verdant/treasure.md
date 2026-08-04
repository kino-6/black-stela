---
treasureTables:
  - id: treasure.verdant.g1.side
    tier: 1
    # G1 side chests now hand VARIETY — gear across slots (whip / buckler / hood) and a sellable valuable,
    # not just potions or the one thorn-lash (playtest 2026-08-03「イバラの鞭か二束三文ばかり」).
    entries:
      - { itemId: item.healing-draught, weight: 5 }
      - { itemId: item.verdant.sap-draught, weight: 4 }
      - { itemId: item.verdant.pollen-salve, weight: 3 }
      - { itemId: item.verdant.amber-resin, weight: 4 }
      - { itemId: equip.verdant.thorn-lash, weight: 3 }
      - { itemId: equip.verdant.bark-buckler, weight: 3 }
      - { itemId: equip.verdant.moss-hood, weight: 3 }
      - { itemId: equip.verdant.vinewrap-gloves, weight: 3 }
  - id: treasure.verdant.g1.keep
    tier: 1
    # The G1 keep (a guardian fight) reliably yields GEAR — spread across the whip, body, offhand and head,
    # so it's a real equip upgrade, not a near-guaranteed duplicate thorn-lash. Gear weight stays ≥ the
    # consumable weight (treasureRewards gate).
    entries:
      - { itemId: equip.verdant.thorn-lash, weight: 4 }
      - { itemId: equip.verdant.bark-plate, weight: 4 }
      - { itemId: equip.verdant.bark-buckler, weight: 3 }
      - { itemId: equip.verdant.moss-hood, weight: 3 }
      - { itemId: item.verdant.amber-resin, weight: 3 }
      - { itemId: item.verdant.greater-sap, weight: 2 }
      - { itemId: item.verdant.homing-spore, weight: 2 }
  - id: treasure.verdant.g2.side
    tier: 1
    entries:
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.pollen-salve, weight: 4 }
      - { itemId: equip.verdant.thorn-lash, weight: 3 }
      - { itemId: equip.verdant.bark-plate, weight: 2 }
  - id: treasure.verdant.g2.keep
    tier: 1
    entries:
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: item.verdant.homing-spore, weight: 3 }
      - { itemId: equip.verdant.thorn-lash, weight: 10 }
  - id: treasure.verdant.g3.side
    tier: 1
    entries:
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.pollen-salve, weight: 4 }
      - { itemId: equip.verdant.thorn-lash, weight: 3 }
      - { itemId: equip.verdant.bark-plate, weight: 2 }
  - id: treasure.verdant.g3.keep
    tier: 1
    entries:
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: item.verdant.homing-spore, weight: 3 }
      - { itemId: equip.verdant.thorn-lash, weight: 10 }
  - id: treasure.verdant.g4.side
    tier: 2
    entries:
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.pollen-salve, weight: 4 }
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: equip.verdant.iron-edge, weight: 3 }
      - { itemId: equip.verdant.bark-plate, weight: 2 }
  - id: treasure.verdant.g4.keep
    tier: 2
    entries:
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: item.verdant.homing-spore, weight: 3 }
      - { itemId: equip.verdant.thorn-lash, weight: 10 }
  - id: treasure.verdant.g5.side
    tier: 2
    entries:
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.pollen-salve, weight: 4 }
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: equip.verdant.iron-edge, weight: 3 }
      - { itemId: equip.verdant.living-charm, weight: 2 }
  - id: treasure.verdant.g5.keep
    tier: 2
    entries:
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: item.verdant.homing-spore, weight: 3 }
      - { itemId: equip.verdant.thorn-lash, weight: 10 }
      - { itemId: equip.verdant.living-charm, weight: 10 }
  - id: treasure.verdant.g6.side
    tier: 2
    entries:
      - { itemId: item.verdant.rootgrowth-seed, weight: 4 }
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.pollen-salve, weight: 4 }
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: equip.verdant.iron-edge, weight: 3 }
      - { itemId: equip.verdant.living-charm, weight: 2 }
  - id: treasure.verdant.g6.keep
    tier: 2
    entries:
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: item.verdant.homing-spore, weight: 3 }
      - { itemId: equip.verdant.thorn-lash, weight: 10 }
      - { itemId: equip.verdant.living-charm, weight: 10 }
  - id: treasure.verdant.g7.side
    tier: 3
    entries:
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.pollen-salve, weight: 4 }
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: equip.verdant.reaver-axe, weight: 3 }
      - { itemId: equip.verdant.heartwood-ward, weight: 2 }
  - id: treasure.verdant.g7.keep
    tier: 3
    entries:
      # The axe to the heart — found before the rootheart, never sold. The boss resists fire and
      # is weak to metal, so a party that explored for this fells it; one that did not, does not.
      - { itemId: equip.verdant.reaver-axe, weight: 10 }
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: item.verdant.homing-spore, weight: 3 }
      - { itemId: equip.verdant.living-charm, weight: 10 }
  - id: treasure.verdant.g8.side
    tier: 3
    entries:
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.pollen-salve, weight: 4 }
      - { itemId: item.verdant.greater-sap, weight: 3 }
      - { itemId: equip.verdant.reaver-axe, weight: 3 }
      - { itemId: equip.verdant.heartwood-ward, weight: 2 }
  - id: treasure.verdant.g8.keep
    tier: 3
    entries:
      - { itemId: item.verdant.heartseed, weight: 10, quantity: 1 }
      - { itemId: equip.verdant.bark-plate, weight: 10 }
  # G9 (scenario boss) + G10 (真層 true boss) — the deepest rewards. Reuses tier-3 gear (T31).
  - id: treasure.verdant.g9.side
    tier: 3
    entries:
      - { itemId: item.healing-draught, weight: 6 }
      - { itemId: item.verdant.sap-draught, weight: 5 }
      - { itemId: item.verdant.greater-sap, weight: 4 }
      - { itemId: equip.verdant.reaver-axe, weight: 3 }
      - { itemId: equip.verdant.heartwood-ward, weight: 2 }
  - id: treasure.verdant.g9.keep
    tier: 3
    entries:
      - { itemId: item.verdant.heartseed, weight: 10, quantity: 1 }
      - { itemId: equip.verdant.reaver-axe, weight: 8 }
      - { itemId: equip.verdant.heartwood-ward, weight: 6 }
  - id: treasure.verdant.g10.side
    tier: 3
    entries:
      - { itemId: item.verdant.greater-sap, weight: 5 }
      - { itemId: item.verdant.heartsap-tonic, weight: 3 }
      - { itemId: equip.verdant.heartwood-ward, weight: 3 }
  - id: treasure.verdant.g10.keep
    tier: 3
    entries:
      - { itemId: item.verdant.heartseed, weight: 10, quantity: 2 }
      - { itemId: equip.verdant.reaver-axe, weight: 8 }
      - { itemId: equip.verdant.heartwood-ward, weight: 8 }
---

# Verdant treasure

Per-floor side nooks (consumables) and keep chokes (better loot + gear); the
G8 keep drops the Heartseed. Weights are first-pass.
