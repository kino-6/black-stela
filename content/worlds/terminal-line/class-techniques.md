---
classTechniques:
  # Each entry REPLACES one base class's built-in combatTechniques (resolveClassCapabilities):
  # terminal-line re-skins WHAT each class natively learns. Level bands mirror
  # src/domain/classCapabilities.ts exactly (warrior 1/1/3/5/7/9, priest 1/1/4/6/8/10, …); the
  # referenced ids are the themed class-line techniques authored in techniques.md — a 1:1 power
  # re-skin, so every balance gate holds. No firearm ids (a class never natively learns a firearm).

  # 保安隊員 (warrior)
  - classId: warrior
    combatTechniques:
      - { level: 1, techniqueId: tl-riot-strike }
      - { level: 1, techniqueId: tl-armor-breach }
      - { level: 3, techniqueId: tl-rally-call }
      - { level: 5, techniqueId: tl-sweeping-charge }
      - { level: 7, techniqueId: tl-adrenaline-shot }
      - { level: 9, techniqueId: tl-takedown }

  # 制圧隊 (knight)
  - classId: knight
    combatTechniques:
      - { level: 1, techniqueId: tl-shield-bash }
      - { level: 1, techniqueId: tl-barricade }
      - { level: 3, techniqueId: tl-bodyguard }
      - { level: 5, techniqueId: tl-provoke }
      - { level: 7, techniqueId: tl-hold-the-line }
      - { level: 9, techniqueId: tl-unyielding }

  # 特務員 (swordmaster)
  - classId: swordmaster
    combatTechniques:
      - { level: 1, techniqueId: tl-precise-strike }
      - { level: 1, techniqueId: tl-evasive-footwork }
      - { level: 3, techniqueId: tl-counter-read }
      - { level: 5, techniqueId: tl-arc-cut }
      - { level: 7, techniqueId: tl-cold-focus }
      - { level: 9, techniqueId: tl-lethal-strike }

  # 潜行員 (thief)
  - classId: thief
    combatTechniques:
      - { level: 1, techniqueId: tl-ambush-strike }
      - { level: 1, techniqueId: tl-hobble }
      - { level: 3, techniqueId: tl-smoke-screen }
      - { level: 5, techniqueId: tl-blindside }
      - { level: 7, techniqueId: tl-flashbang }
      - { level: 9, techniqueId: tl-assassinate }

  # 衛生兵 (priest)
  - classId: priest
    combatTechniques:
      - { level: 1, techniqueId: tl-first-aid }
      - { level: 1, techniqueId: tl-antitoxin }
      - { level: 4, techniqueId: tl-field-surgery }
      - { level: 6, techniqueId: tl-inoculation }
      - { level: 8, techniqueId: tl-decontamination }
      - { level: 10, techniqueId: tl-field-hospital }

  # 通信員 (chanter)
  - classId: chanter
    combatTechniques:
      - { level: 1, techniqueId: tl-stimulant }
      - { level: 1, techniqueId: tl-encrypted-channel }
      - { level: 3, techniqueId: tl-lull-signal }
      - { level: 5, techniqueId: tl-combat-net }
      - { level: 7, techniqueId: tl-thermal-shielding }
      - { level: 9, techniqueId: tl-clear-comms }

  # 爆破技師 (mage)
  - classId: mage
    combatTechniques:
      - { level: 1, techniqueId: tl-incendiary-round }
      - { level: 1, techniqueId: tl-slug-round }
      - { level: 4, techniqueId: tl-thermite-spread }
      - { level: 6, techniqueId: tl-concussion-charge }
      - { level: 8, techniqueId: tl-thermobaric-charge }
      - { level: 10, techniqueId: tl-firestorm }

  # 攪乱員 (occultist)
  - classId: occultist
    combatTechniques:
      - { level: 1, techniqueId: tl-terror-broadcast }
      - { level: 1, techniqueId: tl-power-tap }
      - { level: 3, techniqueId: tl-jamming }
      - { level: 4, techniqueId: tl-corrosion }
      - { level: 6, techniqueId: tl-signal-cut }
      - { level: 8, techniqueId: tl-power-drain }
---

# Terminal Line — class-learned technique lines

What each basic class NATIVELY learns in this world, re-skinned from the shared base lines
(`src/domain/classCapabilities.ts`) into the setting's security / signals / demolition idiom. This is a
strict 1:1 power re-skin: identical level bands, `kind` (spell vs skill), target, MP cost, and effect
amounts — only the id, display name, and theme change. The technique definitions live in `techniques.md`;
this file only wires class → level → technique. Firearms remain gear-granted and are never listed here.
