---
quests:
  # The standing bounty on the rare star-weak runner. Its XP is prized (bypasses the out-levelling
  # falloff), and the bounty is repeatable — so a player who learns to corner the glimmer has a
  # steady, effort-earned way to grow that the difficulty design deliberately does not punish.
  - id: quest.glimmer-hunt
    kind: bounty
    name: Standing Bounty — Ashsilver Glimmer
    description: The archivists pay, and keep paying, for every ashsilver glimmer put down. Corner one and the ledger is yours.
    targetEnemyId: enemy.rare.ashsilver-glimmer
    requiredCount: 1
    repeatable: true
    reward:
      gold: 40
      xp: 55
    locales:
      ja:
        name: 常設依頼――灰銀の残光
        description: 灰銀の残光を仕留めるたび、文書庫は報いを惜しまない。追い詰めて討て。
  # An early, learnable cull. Five ash-slimes is a run's worth of B1F attrition turned into pay.
  - id: quest.cull-the-ash
    kind: bounty
    name: Cull the Ash Crawl
    description: The ash-slimes breed faster than the wardens can burn them. Put down five and bring word.
    targetEnemyId: enemy.b1f.ash-slime
    requiredCount: 5
    repeatable: true
    reward:
      gold: 45
    locales:
      ja:
        name: 灰の這い寄りを間引く
        description: 灰スライムは番人が焼くより早く湧く。五体を仕留めて報告せよ。
  # A repeatable delivery: relics carried up from the labyrinth, exchanged for a growth reward that
  # itself bypasses the falloff (emberwit ash raises wit permanently). Collection loop, not grind.
  - id: quest.shard-tithe
    kind: delivery
    name: Tithe of Stela Shards
    description: Bring three stela shards to the reliquary. The keepers trade knowledge for what the labyrinth gives up.
    targetItemId: item.stela-shard
    requiredCount: 3
    repeatable: true
    reward:
      gold: 30
      itemId: item.emberwit-ash
      itemQuantity: 1
    locales:
      ja:
        name: 黒碑片の納め
        description: 黒碑片を三つ、聖遺物室へ。守り手は迷宮の遺物と引き換えに知恵を分ける。
---

# Quest board — Gate of Ash

Standing work posted in the ash town. Bounties tally kills; the tithe is a delivery. All three are
repeatable, and each is authored here — no quest logic is hard-coded in source.
