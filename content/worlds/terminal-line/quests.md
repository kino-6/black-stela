---
quests:
  - id: quest.tl-drain-clearance
    kind: bounty
    name: Drain Clearance
    description: The lower drain is moving again. Thin the rats before they chew through another cable sleeve.
    targetEnemyId: enemy.tl1f.drain-rat
    requiredCount: 4
    repeatable: true
    reward: { gold: 30 }
    locales:
      ja:
        name: 排水路の掃除
        description: 下の排水路でまた齧る音がする。ケーブルを食い破られる前に、四匹だけ片づけてほしい。
  - id: quest.tl-fuse-return
    kind: delivery
    name: Return the Fuse
    description: Bring two sound terminal fuses to the interchange workshop for a small emergency reserve.
    targetItemId: item.tl-terminal-fuse
    requiredCount: 2
    repeatable: true
    reward: { gold: 26, itemId: item.tl-field-dressing, itemQuantity: 1 }
    locales:
      ja:
        name: ヒューズの返納
        description: 使える端末ヒューズを二つ、乗換広場の整備台へ。応急用品と交換する。
---

# 乗換広場の依頼

短い往復で、敵を倒すことと探索品を持ち帰ることの双方を町の準備へ戻す。
