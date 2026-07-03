# Black Stela Agent Instructions

Before any player-facing UI, gameplay, dungeon, prose, asset, character,
combat, automation, or save/debug change, read:

- `docs/skills/black-stela-gate-review-skill.md`
- `docs/gates/past-trouble-regression-gate.md`
- The relevant domain gate under `docs/gates/`

Do not call player-facing work done only because unit tests, build, or headless
reachability passed. Browser-visible proof, Japanese/layout checks when
relevant, and an explicit note about which past trouble could recur are required.

Normal play must not expose debug/admin/product controls, AI provider setup,
arbitrary save/load, raw route ids, or implementation terms. Dungeon work must
respect continuous grid topology, current-cell actions, visible stairs/returns,
visible enemies/doors/traps, compact minimap, six-person party formation, and
controller-friendly command surfaces.
