---
# IMP-022B — rare and epic affixes for 翠碑. The pool covers every equipment
# slot inherited or authored by the world and supports more than one answer for
# force, endurance, accuracy, and initiative checks.
affixes:
  - id: affix.verdant.thorn-fanged
    label: Thorn-Fanged
    slots: [weapon]
    minFloor: 2
    rarity: rare
    weight: 4
    attackBonus: 2
    accuracyBonus: 1
    locales: { ja: { label: 棘牙の } }
  - id: affix.verdant.sap-hardened
    label: Sap-Hardened
    slots: [offhand, body, head]
    minFloor: 2
    rarity: rare
    weight: 4
    defenseBonus: 3
    locales: { ja: { label: 樹液固めの } }
  - id: affix.verdant.dew-sighted
    label: Dew-Sighted
    slots: [weapon, hands, accessory]
    minFloor: 3
    rarity: rare
    weight: 4
    accuracyBonus: 4
    locales: { ja: { label: 朝露の } }
  - id: affix.verdant.root-quick
    label: Root-Quick
    slots: [body, hands, accessory]
    minFloor: 4
    rarity: rare
    weight: 3
    speedBonus: 2
    locales: { ja: { label: 根走りの } }
  - id: affix.verdant.ironveined
    label: Ironveined
    slots: [weapon]
    minFloor: 5
    rarity: epic
    weight: 2
    attackBonus: 4
    accuracyBonus: 3
    locales: { ja: { label: 鉄脈の } }
  - id: affix.verdant.heartwood
    label: Heartwood
    slots: [offhand, body, head, accessory]
    minFloor: 6
    rarity: epic
    weight: 2
    defenseBonus: 4
    speedBonus: -1
    locales: { ja: { label: 樹心の } }
  - id: affix.verdant.pollen-light
    label: Pollen-Light
    slots: [head, hands, accessory]
    minFloor: 5
    rarity: rare
    weight: 3
    accuracyBonus: 2
    speedBonus: 2
    locales: { ja: { label: 花粉払いの } }
  - id: affix.verdant.strangler-bound
    label: Strangler-Bound
    slots: [weapon, body]
    minFloor: 7
    rarity: epic
    weight: 2
    attackBonus: 2
    defenseBonus: 2
    locales: { ja: { label: 絞り蔓の } }
  # IMP-022: affixes that ANSWER a family rather than adding a flat stat — a defensive and an
  # offensive answer for the grove's two dangerous families (spore casters, deep wood/husks).
  - id: affix.verdant.spore-proof
    label: Spore-Proof
    slots: [head, body, accessory]
    minFloor: 3
    rarity: rare
    weight: 3
    resistBonus: { sleep: 35, silence: 25 }
    locales: { ja: { label: 防胞子の } }
  - id: affix.verdant.grove-warded
    label: Grove-Warded
    slots: [offhand, body, accessory]
    minFloor: 5
    rarity: rare
    weight: 3
    elementResist: { wood: 0.6 }
    locales: { ja: { label: 森防ぎの } }
  - id: affix.verdant.sap-fed
    label: Sap-Fed
    slots: [accessory, body]
    minFloor: 4
    rarity: epic
    weight: 2
    regen: 3
    locales: { ja: { label: 樹液養いの } }
  - id: affix.verdant.spore-bane
    label: Spore-Bane
    slots: [weapon]
    minFloor: 3
    rarity: rare
    weight: 3
    speciesBonus: { tag: spore, multiplier: 1.6 }
    locales: { ja: { label: 胞子断ちの } }
  - id: affix.verdant.husk-cleaving
    label: Husk-Cleaving
    slots: [weapon]
    minFloor: 6
    rarity: epic
    weight: 2
    attackBonus: 1
    speciesBonus: { tag: husk, multiplier: 1.7 }
    locales: { ja: { label: 殻割りの } }
---

# Affixes — Verdant

The drowned grove leaves useful marks on recovered equipment: thorn, sap,
dew, iron, pollen, and heartwood rather than ash-town enchantments.
