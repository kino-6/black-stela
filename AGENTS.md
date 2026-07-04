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

## Lessons From Strong User Feedback

Treat the following as non-negotiable product constraints. They come from
repeated user-visible failures and are recorded here so the user does not have
to keep restating them.

- Do not mistake "route passes" for "the game is good." Headless proves engine
  reachability only. Browser Self-Play, screenshots, and actual player-facing
  review are required for UI, UX, dungeon, combat, shop, recovery, character
  creation, and town-loop claims.
- Do not build a generic web UI. Black Stela is a DRPG, not an admin dashboard.
  Avoid top bars, config panels, arbitrary save/load buttons, AI switches,
  scattered forms, visible implementation ids, route ids, provider settings, or
  debug-like commands in normal play.
- Do not expose AI configuration or AI narration controls to players. Local AI
  is conceptually on, hidden, local-first, non-canonical, and unable to mutate
  `GameState`.
- Do not rely on mouse-first interactions. Normal play must work through
  controller/keyboard-style focus, confirm, cancel/back, and stable command
  windows. Enemy clicking, actor-card clicking, hover-only actions, or shifting
  command positions are unfinished work.
- Do not present DRPG movement as arbitrary linked rooms. The labyrinth must be
  a continuous grid with walls, doors, stairs, current-cell actions, compact
  local minimap, and first-person view generated from the same map truth.
  If the view suggests a passage, movement and minimap must agree.
- Do not make stairs, returns, exits, or escape feel free or automatic. Stairs
  must be visible and used from the current cell. Return is an authored affordance
  or earned resource, not a permanent normal command that erases attrition.
- Do not let combat feel like a debug command. Party combat queues commands for
  every active member in formation order, resolves a round, hides exact enemy HP
  unless a special means reveals it, shows enemy presence clearly, and explains
  outcomes through concise in-world feedback.
- Do not leave enemies, doors, stairs, traps, portraits, or dungeon assets as
  placeholder shapes when the screen asks the player to care about them. Asset
  quality is part of the game, not decoration.
- Do not flatten character creation into data entry. It must support the fantasy
  of making one's own adventurers: six-person party, visible front/back rows,
  many distinct classes, portraits/assets, names, epithets, backgrounds,
  temperament, profiles, stats with class baselines, reroll/regenerate affordances,
  and staged choices that reveal information in order.
- Do not over-explain party quality in normal play. Trial-and-error is part of
  the game. Offer in-world help or candidate suggestions when asked, but do not
  grade the roster or show "coverage" lectures by default.
- Do not mix stray English into Japanese normal play. Use natural Japanese RPG
  labels and prose. Avoid translated-English sentence shapes, theme explanation,
  out-of-world setup wording, and direct UI-instruction dialogue disguised as
  character speech.
- Do not let logs or messages push commands around. Command areas, party rows,
  minimap, and core combat/town controls must remain stable within one screen.
- Do not call town services done if they are just lists. Returning to town must
  show expedition result, wounds, gold, loot, and the next preparation choices.
  Shops must show who can use equipment and what changes. Recovery must show
  cost, wounds, before/after, and insufficient-funds states.
- If a requirement is ambiguous, ask before filling the gap with a convenient
  implementation. "Wiz-like" means structural lessons from classic DRPGs
  (grid maze, party order, attrition, town prep, command windows), not surface
  flavor or copied proprietary content.

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
