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

Do not repeat recent Black Stela regressions: combat command entry must advance
through party members in formation order, not through arbitrary clicked actor
cards; Japanese normal play must not leak stray English enemy names, units, shop
text, or combat labels unless they are natural genre abbreviations.

## Controller-First Player UI Contract

All normal-play UI is designed for controller and keyboard first, then mouse.
Do not ship a player-facing screen whose primary interaction depends on free
cursor aiming, scattered form controls, hover-only affordances, or web-admin
layout habits. Guild registration, town services, dungeon movement, combat,
shops, records, configuration, and recovery must all be operable through a
stable focus order, directional navigation, confirm/cancel semantics, and fixed
command/message areas.

This is a blocking completion rule, not a preference. A player-facing change is
not done unless Playwright or screenshot evidence proves keyboard/controller
style traversal for the changed surface. Mouse support is allowed only as a
secondary convenience; it cannot be the only visible or tested path. If a normal
screen has no directional focus route, no confirm action, or no cancel/back
route where backtracking is possible, mark the task unfinished.

Forms are allowed only when the fantasy requires text entry, file import, or a
debug/developer workflow. Normal character creation must be staged as command
windows and focused choices: one decision at a time, visible preview, stable
next/back or confirm/cancel actions, no layout shift when messages update, and
browser evidence for keyboard/controller-style operation before completion.
