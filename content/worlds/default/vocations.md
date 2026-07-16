---
# IMP-021A — authored ADVANCED vocations for 黒碑. The 12 basic classes are built-in; these are the
# destinations a build earns by MASTERING basics. Prerequisites are visible before committing, and
# the loader rejects unknown prereqs / unlock cycles. Stat modifiers layer on the aptitude base.
vocations:
  - id: vocation.ash-reaver
    tier: advanced
    name: Ash Reaver
    signature: A front-line breaker who turns mastered aggression into a single crushing swing.
    requires:
      mastered: [vanguard, sellsword]
      minLevel: 6
    statModifiers: { attack: 3, maxHp: 8, speed: -1 }
    allowedSlots: [weapon, offhand, body, head, hands, accessory]
    grantsTechniques: [power-strike]
    locales:
      ja:
        name: 灰の刃
        signature: 極めた攻めを一撃に込める、前線の破砕者。
  - id: vocation.salt-warden
    tier: advanced
    name: Salt Warden
    signature: A bulwark who learned to mend — holds the line and keeps the wounded standing.
    requires:
      mastered: [bulwark, mender]
      minLevel: 6
    statModifiers: { armor: 3, maxHp: 12, maxMp: 4 }
    allowedSlots: [offhand, body, head, hands, accessory]
    grantsTechniques: [heal]
    locales:
      ja:
        name: 塩の守り手
        signature: 癒しを覚えた盾守。戦線を保ち、倒れかけた者を立たせ続ける。
  - id: vocation.star-votary
    tier: advanced
    name: Star Votary
    signature: An occultist who read the late star-script — its fire answers only to the devoted.
    requires:
      mastered: [occultist, arcanist]
      minLevel: 8
    statModifiers: { maxMp: 8, attack: -1 }
    allowedSlots: [weapon, head, hands, accessory]
    grantsTechniques: [firebolt]
    locales:
      ja:
        name: 星の信徒
        signature: 遅く現れる星の文字を読んだ occultist。その火は、身を捧げた者にのみ応える。
---

# Vocations — Gate of Ash

Advanced vocations earned by mastering the basic classes. The basics themselves stay built-in; only
these authored destinations, their prerequisites, and their granted techniques are data.
