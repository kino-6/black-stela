---
# Terminal Line re-skins the eight SHARED BASIC classes into the sealed-network's security / signals /
# demolition idiom. Each entry has the base class id (so reclass, stats, and the class technique line all
# stay wired to the same class) with tier: basic — resolveVocationCatalog replaces only the display name.
# The classes' native technique lines are themed separately in class-techniques.md. Advanced routes are
# authored with the later acts.
# `startingEquipment` — the kit a character CREATED as this vocation starts with. terminal-line hands out its
# OWN station gear (a sidearm/SMG/crowbar/buckler + a rain jacket), not the shared classes' fantasy sabre and
# gambeson (playtest 2026-08-10: "どうしてファンタジーな初期装備なのか"). Present overrides REPLACE the base kit outright.
vocations:
  - id: warrior
    tier: basic
    name: Security Officer
    startingEquipment: { weapon: equip.tl-service-pistol, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 保安隊員 }
  - id: knight
    tier: basic
    name: Containment Guard
    startingEquipment: { weapon: equip.tl-crowbar, offhand: equip.tl-platform-buckler, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 制圧隊 }
  - id: swordmaster
    tier: basic
    name: Special Agent
    startingEquipment: { weapon: equip.tl-drain-5-smg, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 特務員 }
  - id: thief
    tier: basic
    name: Infiltrator
    startingEquipment: { weapon: equip.tl-callbox-knife, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 潜行員 }
  - id: priest
    tier: basic
    name: Field Medic
    startingEquipment: { weapon: equip.tl-crowbar, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 衛生兵 }
  - id: chanter
    tier: basic
    name: Signals Operator
    startingEquipment: { weapon: equip.tl-crowbar, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 通信員 }
  - id: mage
    tier: basic
    name: Demolition Tech
    startingEquipment: { weapon: equip.tl-crowbar, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 爆破技師 }
  - id: occultist
    tier: basic
    name: Disruptor
    startingEquipment: { weapon: equip.tl-callbox-knife, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 攪乱員 }
---

# Vocations

Terminal Line re-skins the eight shared **basic** classes (names here; native technique lines in
`class-techniques.md`). Advanced routes are authored with the later acts.
