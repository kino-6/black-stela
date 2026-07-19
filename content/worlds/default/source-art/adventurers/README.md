# Adventurer Source Masters

This folder holds the P17 character library described in
`content/worlds/default/ART.md`.

Filename:

`adventurer-<class>-<species>-<gender>-<pose>.png`

- Classes: `vanguard`, `sellsword`, `bulwark`, `duelist`, `seeker`, `scout`,
  `cutpurse`, `mender`, `chanter`, `occultist`, `arcanist`, `wayfinder`
- Species: `human`, `sylvan`, `beastkin`
- Genders: `male`, `female`
- Poses: `base`, `attack`

Every base/attack pair is one persistent identity. Source masters are
1024x1536 PNG RGBA with no scenery or baked encounter effects. Do not place the
full library under `assets/`; the current Vite glob would ship every unused
variant.

Delivery: 144/144 masters complete (2026-07-18). Review sheets live under
`docs/evidence/art-adventurer-library-p17/`.
