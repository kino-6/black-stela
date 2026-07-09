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

Japanese text quality includes line layout. Do not accept player-facing Japanese
copy that wraps with a lonely one-character tail, awkward punctuation at the
start of a line, or a visual break that makes the sentence look translated or
careless. Rewrite the line, shorten it, or author an explicit line variant for
the target message box. Prefer moving dialogue, service copy, room text, item
text, and tutorial-like messages into scenario/localization data instead of
hardcoding them inside React components.

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
- Do not treat Japanese copy as only a string value. Its displayed line breaks
  are part of the writing. If a message box leaves a one-character orphan after
  wrapping, rewrite the sentence, adjust the planned break, or provide a
  display-specific variant in scenario/localization data.
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

## Dungeon Design Rules

Learned from research (`docs/dungeon-patterns.md`) and hard user feedback. These
are enforced by `tests/dungeonDesign.test.ts` (the Gate) and `tests/b1fStructure.test.ts`,
using the graph metrics in `src/domain/floorGraph.ts`. Do not hand-wave "make it
fun" — a floor either meets these or the Gate fails.

1. **Meaningful, dense space.** A floor fills its ~20×20 frame with purposeful,
   connected space: every reachable cell serves a path, a room, a reward, or a
   hazard. No large dead regions, no single thin corridor. (Gate: reachable cells
   ≥ 80; every authored room is a junction or carries content.)
2. **Non-linear (Jaquays).** Loops, branches, and multiple connections — the player
   chooses route and order, and the shortest solution doesn't reuse one corridor.
   (Gate: cyclomatic loops ≥ 4; on-path branch points ≥ 3 on the entrance→down-stair
   route.)
3. **No contrived gates on shallow public floors.** Do NOT lock descent behind
   unexplained "authentication" — cranks, keys, or coverage-% thresholds — on a
   shallow, publicly-accessible floor. Stairs are freely usable. Locks belong only
   where diegetically justified (a sealed vault, a thematic ward), never as a generic
   anti-skip device. (This was a real mistake on B1F. B2/B4/B7 still carry crank-gated
   descents — pending rollout removal.)
4. **Pressure is reward + difficulty, not a gate.** Lay out and balance the floor so
   a party that has read ~80% of it reaches the next floor ready, while a half-blind
   dash arrives under-levelled and is punished below. "80% explored" is a *balance
   target*, not a lock condition.
5. **Rewards pull outward.** Treasure in dead-end niches, premium loot behind
   searchable secrets, meaningful rooms at spoke/corner ends — so covering the whole
   floor is worth it.
6. **Adopt patterns deliberately.** Use the catalog in `docs/dungeon-patterns.md`
   (hub-and-spoke, loops, figure-eight, loop-back shortcut, secret vault, gauntlet,
   …) and note which a floor uses in its `authorNotes`.

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

## Combat & Party UI Standards

The SNES JRPG baseline (FF IV–VI, Dragon Quest, Chrono Trigger) is the solved
minimum; classic DRPGs (Wizardry, Etrian Odyssey, SMT) add grid party + front/back
rows; Persona 5 / SMT V / Octopath are the readability bar. Combat and party UI must
follow these conventions (researched — see docs/dungeon-patterns.md sources list):

1. **Always-on vitals.** Every party member's HP, MP/SP, level, and status-ailment
   icons are visible at all times in combat — never hidden behind a submenu. Show HP/MP
   as both a number and a bar/color.
2. **Stable roster.** Members are one row each in a fixed order; never reorder, re-sort,
   or reflow the panel mid-battle. Highlight the active actor by moving a cursor/glow onto
   their existing row, not by resizing or re-sorting.
3. **Row by position, not label.** Front/back row is conveyed by the member's slot/section
   position, NOT by a redundant per-character "front row / back row" tag. (This was a real
   mistake — the combat roster printed "· 前衛" on every row under a 前衛 header.)
4. **Docked, constant command menu.** The command menu sits in a fixed region with the same
   item order every turn (no layout shift). Core is Attack, Skill/Magic, Item, Guard/Defend;
   game-specific commands append, not interleave. Offensive actions open a separate target
   step over the enemy field, leaving the command window in place.
5. **Enemy readouts.** Enemies show a name + a health/state cue + status icons; same-type
   enemies stack and the target cursor cycles them.
6. **Turn economy shown.** If any action grants extra turns (press-turn / one-more), show the
   turn economy on screen (depleting icons or a turn-order rail).
7. **Keyboard AND gamepad, never mouse-only.** A directional focus cursor drives everything;
   Confirm = advance phase (command → target → execute), Cancel = back one phase without
   losing prior choices; shoulder keys cycle actors and jump the target cursor. Combat must be
   fully playable without the mouse (blocking completion rule, proven by e2e).
8. **Repeat + auto-battle.** Provide "repeat last action/turn" for trivial fights and an
   auto-battle + battle-speed toggle; ANY button press instantly interrupts auto and restores
   manual control. Disable auto/repeat during bosses and minibosses.

Common mistakes to avoid: redundant per-character row labels; hidden/omitted MP; layout shift
that makes the cursor jump; mouse-only interaction; re-sorting the party by turn order;
numbers-only or bar-only HP; extra-turn mechanics with no on-screen indicator; auto-battle that
can't be interrupted or stays on during bosses; a command menu that repositions between turns.
