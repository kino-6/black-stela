---
id: world.default
title: Black Stela Prototype
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

# Black Stela Prototype

The first playable floor below the ancient black stela. This file is editable
outside the compiled game; YAML is scenario truth and Markdown is human-facing
context.
