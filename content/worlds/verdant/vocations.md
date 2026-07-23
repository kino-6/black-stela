---
# §7A (class-system.md §7A) — the ADOPTED advanced vocations for 翠碑. Each destination combines two of
# the shared basic vocations, but the work and imagery belong to the drowned grove rather than the ash
# town. grantsTechniques names each vocation's ONE EXCLUSIVE signature technique (§7B; see the default
# pack's header): never a redundant parent technique, always a distinct combination of §9.4 primitives no
# basic class teaches. Each `signature` states the mechanism the technique implements.
vocations:
  - id: vocation.verdant.briar-reaver
    tier: advanced
    name: Briar Reaver
    signature: A fortress guard who intercepts the thorn-strike, then sunders what it blocked.
    requires:
      mastered: [warrior, knight]
      minLevel: 6
    statModifiers: { maxHp: 7, attack: 3, speed: 1 }
    allowedSlots: [weapon, offhand, body, head, hands, accessory]
    # §7B EXCLUSIVE signature — INTERCEPT then a braced counter (thorn-guard): cover + attack.
    grantsTechniques: [thorn-guard]
    locales:
      ja:
        name: 茨砕き
        signature: 絡む茨の一撃を受け止め、防いだそばから鎧ごと断つ前線の守り。
  - id: vocation.verdant.bark-keeper
    tier: advanced
    name: Bark Keeper
    signature: A warder who maintains a bark-and-ward field over a row that fades if not re-sung.
    requires:
      mastered: [knight, chanter]
      minLevel: 6
    statModifiers: { maxHp: 10, maxMp: 3, armor: 4, speed: -1 }
    allowedSlots: [offhand, body, head, hands, accessory]
    # §7B EXCLUSIVE signature — a maintained DEFENSIVE FIELD (bark-field) that fades if not re-sung.
    grantsTechniques: [bark-field]
    locales:
      ja:
        name: 樹皮守
        signature: 樹皮と札の護りを列に張り続け、詠唱を絶やせば薄れる守り手。
  - id: vocation.verdant.dewblade
    tier: advanced
    name: Dewblade
    signature: A ninja of the grove whose first cut from concealment lands deeper while unseen.
    requires:
      mastered: [swordmaster, thief]
      minLevel: 6
    statModifiers: { attack: 2, accuracy: 5, speed: 3, maxHp: -2 }
    allowedSlots: [weapon, body, hands, accessory]
    # §7B EXCLUSIVE signature — a deep FIRST CUT from concealment (dew-cut): heavy hit + slows the pack.
    grantsTechniques: [dew-cut]
    locales:
      ja:
        name: 露刃
        signature: 濡れ葉に紛れ、気取られぬ間の初太刀ほど深く急所を裂く。
  - id: vocation.verdant.canopy-reader
    tier: advanced
    name: Canopy Reader
    signature: A trickster who reads a telegraphed action and pre-empts it with a debuff.
    requires:
      mastered: [thief, chanter]
      minLevel: 6
    statModifiers: { maxHp: 3, accuracy: 6, speed: 2 }
    allowedSlots: [weapon, body, head, hands, accessory]
    # §7B EXCLUSIVE signature — a PRE-EMPT debuff (canopy-read): breaks the pack's aim and force at once.
    grantsTechniques: [canopy-read]
    locales:
      ja:
        name: 梢読み
        signature: 滴る兆しから敵の動きを先読みし、起こる前に崩す道読み。
  - id: vocation.verdant.sap-binder
    tier: advanced
    name: Sap Binder
    signature: A sage who reads an enemy's element and turns the reading into a matched heal or ward.
    requires:
      mastered: [priest, mage]
      minLevel: 8
    statModifiers: { maxHp: 4, maxMp: 8, attack: 1 }
    allowedSlots: [weapon, offhand, body, head, accessory]
    # §7B EXCLUSIVE signature — READ AND MATCH (sap-weave): a party heal woven with an element ward.
    grantsTechniques: [sap-weave]
    locales:
      ja:
        name: 樹液結び
        signature: 敵の相を読み、その理を癒しや護りへ結び替える樹の賢者。
  - id: vocation.verdant.spore-seer
    tier: advanced
    name: Spore Seer
    signature: An assassin who strikes hardest at the sleeping, feared, or already-afflicted.
    requires:
      mastered: [occultist, thief]
      minLevel: 8
    statModifiers: { maxMp: 7, accuracy: 3, speed: 2 }
    allowedSlots: [weapon, body, head, hands, accessory]
    # §7B: the EXCLUSIVE signature — an exploit no basic class teaches (spore-burst amplifies against the
    # afflicted, and does NOT consume, so the assassin keeps cutting while the condition lasts).
    grantsTechniques: [spore-burst]
    locales:
      ja:
        name: 胞子見
        signature: 眠り・怯え・弱りに沈む者ほど深く突く、胞子を読む刺客。
---

# Vocations — Verdant

Six advanced destinations shaped by the drowned grove. Together they give every shared basic vocation
at least one authored route into later play.

7A adopted the roster and fixed its prerequisites; 7B authored each vocation's one exclusive signature
technique (class-system.md §7A/§7B) — a distinct combination of §9.4 primitives no basic class teaches.
