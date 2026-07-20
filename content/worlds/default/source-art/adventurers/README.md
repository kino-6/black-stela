# Adventurer Source Masters

This folder holds the P17/P20 character library described in
`content/worlds/default/ART.md`.

Filename:

`adventurer-<class>-<species>-<gender>-<pose>.png`

- Current classes: `warrior`, `knight`, `swordmaster`, `thief`, `priest`,
  `chanter`, `mage`, `occultist`
- Species: `human`, `sylvan`, `beastkin`
- Genders: `male`, `female`
- Poses: `base`, `attack`

Every base/attack pair is one persistent identity. Source masters are
1024x1536 PNG RGBA with no scenery or baked encounter effects. Do not place the
full library under `assets/`; the current Vite glob would ship every unused
variant.

P20 re-filed the six changed lines to the current IDs: `vanguard` → `warrior`,
`bulwark` → `knight`, `duelist` → `swordmaster`, `cutpurse` → `thief`,
`mender` → `priest`, and `arcanist` → `mage`. The Thief anchor is the former
lock-tool `cutpurse` line; the remaining `seeker`, `scout`, and `wayfinder`
masters are retained as optional future variants. The former `sellsword` line
is likewise retained as a future Warrior variant.

The current matrix is 96 masters (8 classes × 3 species × 2 genders × 2 poses).
Review sheets for the original, full 144-master delivery live under
`docs/evidence/art-adventurer-library-p17/`.
