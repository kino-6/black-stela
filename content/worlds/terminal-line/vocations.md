---
# Terminal Line re-skins the eight SHARED BASIC classes into the sealed-network's security / signals /
# demolition idiom. Each entry has the base class id (so reclass, stats, and the class technique line all
# stay wired to the same class) with tier: basic — resolveVocationCatalog replaces only the display name.
# The classes' native technique lines are themed separately in class-techniques.md. Advanced routes are
# authored with the later acts.
# `startingEquipment` — the kit a character CREATED as this vocation starts with. terminal-line's CONCEPT is
# mowing down hordes with automatic fire, so EVERY basic vocation starts on a weapon that sprays (SMG 3 shots /
# shotgun 2) — never a single-shot sidearm or a melee club — else a normal party walks the swarms holding a
# pistol and the mow-down never happens (playtest 2026-08-13: "大量の敵を薙ぎ倒すコンセプト" 未達 → 全員自動火器).
# Class identity lives in the ten techniques per firearm family and in stats, not the basic weapon. Frontline
# breachers carry the wide shotgun; skirmishers and the support trio carry the compact SMG. (2026-08-10: station
# gear replaced the fantasy sabre/gambeson — "どうしてファンタジーな初期装備なのか".) Present overrides REPLACE the base kit.
vocations:
  - id: warrior
    tier: basic
    name: Security Officer
    startingEquipment: { weapon: equip.tl-maintenance-10-shotgun, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 保安隊員 }
  - id: knight
    tier: basic
    name: Containment Guard
    startingEquipment: { weapon: equip.tl-maintenance-10-shotgun, offhand: equip.tl-platform-buckler, body: equip.tl-rain-jacket }
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
    startingEquipment: { weapon: equip.tl-drain-5-smg, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 潜行員 }
  - id: priest
    tier: basic
    name: Field Medic
    startingEquipment: { weapon: equip.tl-drain-5-smg, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 衛生兵 }
  - id: chanter
    tier: basic
    name: Signals Operator
    startingEquipment: { weapon: equip.tl-drain-5-smg, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 通信員 }
  - id: mage
    tier: basic
    name: Demolition Tech
    startingEquipment: { weapon: equip.tl-maintenance-10-shotgun, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 爆破技師 }
  - id: occultist
    tier: basic
    name: Disruptor
    startingEquipment: { weapon: equip.tl-drain-5-smg, body: equip.tl-rain-jacket }
    locales:
      ja: { name: 攪乱員 }
---

# Vocations

Terminal Line re-skins the eight shared **basic** classes (names here; native technique lines in
`class-techniques.md`). Advanced routes are authored with the later acts.
