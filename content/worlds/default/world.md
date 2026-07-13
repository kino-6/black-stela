---
id: world.default
title: Black Stela - Gate of Ash
tagline: A dead, ash-choked dungeon beneath the town. Eight floors down, the black stela has a root.
locales:
  ja:
    title: 黒碑 — 灰の門
    tagline: 町の下に、灰に埋もれた坑がある。八層の底で、黒い碑が根を張っている。
startDungeon: dungeon.b1f
startRoom: room.b1f.001
aiPolicy:
  allowed:
    - environment_flavor
    - npc_reaction
    - replay_log
  forbidden:
    - speak_for_pc
    - move_pc
    - create_exit
    - change_rules
dungeons: []
---

# Black Stela - Gate of Ash

The first authored scenario beneath the black stela at Stela Gate Town. The
Ashen Descent is planned as an eight-floor compact DRPG scenario about mapping,
attrition, controlled retreat, and the price of bringing evidence back alive.

YAML is scenario truth. Markdown is human-facing authoring context.
