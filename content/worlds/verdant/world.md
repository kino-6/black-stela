---
id: world.verdant
title: Verdant - Sunken Arboretum
assetPack: verdant
startDungeon: dungeon.verdant.g1f
startRoom: room.verdant.g1f.001
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

# Verdant - Sunken Arboretum

A second scenario used to prove scenario switching end-to-end. It ships only its
own dungeon and title; the standard party's starter gear comes from the shared
base catalog, and art falls back to the default pack until a verdant pack is
supplied. See docs/design/scenario-switching.md.
