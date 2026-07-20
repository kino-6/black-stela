---
quests:
  # The grove's standing bounty on the metal-weak prized runner — repeatable XP that bypasses the
  # out-levelling falloff, the reward for a player who learns to bring metal and corner it.
  - id: quest.verdant.sporecloud-hunt
    kind: bounty
    name: Standing Bounty — Gilded Sporecloud
    description: The grovekeepers reward every gilded sporecloud dispersed. Bring an iron edge and end it before it drifts.
    targetEnemyId: enemy.verdant.rare.gilded-sporecloud
    requiredCount: 1
    repeatable: true
    reward:
      gold: 40
      xp: 55
    locales:
      ja:
        name: 常設依頼――黄金の胞子雲
        description: 黄金の胞子雲、見つけ次第散らしてほしい。漂い出すと手がつけられない。鉄の刃があるとよい。――森守
  # An early cull the grove can teach a new party.
  - id: quest.verdant.thin-the-swarm
    kind: bounty
    name: Thin the Spore Swarm
    description: The spore gnats choke the lower paths. Scatter five and the wardens breathe easier.
    targetEnemyId: enemy.verdant.g1.spore-gnat
    requiredCount: 5
    repeatable: true
    reward:
      gold: 45
    locales:
      ja:
        name: 胞子の群れを間引く
        description: 胞子蚋が下層の道を塞いでいる。五体も散らせば、こちらも息をつける。
  # A repeatable delivery of the heartwood relic for a growth reward.
  - id: quest.verdant.heartseed-tithe
    kind: delivery
    name: Tithe of Heartseeds
    description: Carry three heartseeds to the root-shrine. The grove trades its own growth for what you return.
    targetItemId: item.verdant.heartseed
    requiredCount: 3
    repeatable: true
    reward:
      gold: 30
      itemId: item.verdant.rootgrowth-seed
      itemQuantity: 1
    locales:
      ja:
        name: 大樹の種の納め
        description: 大樹の種を三つ、根の社までお納めください。返された実りと引き換えに、森はその育ちを分け与えます。
---

# Quest board — The Drowned Grove

Standing work posted at the grove's edge. Bounties tally kills; the tithe is a delivery. All are
authored here — the quest system is data, not code.
