# Past Trouble Regression Gate

This gate records user-visible failures that Black Stela must not repeat. Use it
before planning, coding, reviewing, or claiming completion for player-facing
work.

## Required Loop

- [ ] Read this file plus `docs/gates/human-requirement-gate.md`.
- [ ] Read the relevant domain gate: DRPG UX, Grid Labyrinth, Scenario Prose, or
  Player-Facing Red Flags.
- [ ] Name which past trouble could recur in the task.
- [ ] Add browser-visible evidence for the exact player state touched.
- [ ] Run or cite Browser Self-Play when the normal player route is touched.
- [ ] State what headless proves and what it does not prove.
- [ ] If a past trouble recurs, do not merge or mark done.

## Recorded Troubles

| Area | Past failure | Blocking expectation |
| --- | --- | --- |
| Startup | Title/header used product copy, local-narration copy, or developer-facing explanation. | Title/startup must preserve mood and avoid explaining systems. |
| Normal play controls | Language, save/load, AI settings, slot controls, and debug-like affordances were exposed as web UI. | Normal play hides configuration, provider, arbitrary save/load, and debug controls. |
| AI | AI was treated as a user-facing switch or suggestion panel. | Local AI is hidden, on by concept, non-canonical, and never asks the player to configure it in normal play. |
| Headless | `clear` wording and scenario-truth reachability implied the browser game was proven. | Headless is reachability only; browser proof is required for UX and play parity. |
| Browser proof | Codex could rely on scattered E2E claims without performing a player-like route. | Browser Self-Play must drive normal controls from title through party, dungeon, combat, stair/return, and town service when the normal route is touched. |
| Character creation | Guild registration became a plain form and lost portrait/profile/stat customization. | Character creation must support player-authored identity, roster fantasy, roles, and party experimentation without an always-on scoring panel. |
| Party guidance | "Party coverage" / `隊列の備え` over-explained composition and spoiled trial-and-error. | Show class, row, and role texture; do not grade the roster in normal guild registration. |
| Character creation copy | Guild copy described out-of-world setup such as choosing a face, spending bonus points, or listing registration steps. | Registration copy must sound like a guild master judging candidates in-world, not UI instructions in costume. |
| Japanese dialogue | Guild copy used written exposition and rhetorical lists that no NPC would say aloud. | Spoken Japanese must pass the Japanese Dialogue Gate: clear speaker/listener/intent, short spoken phrasing, and no fake literary checklist. |
| Guild shortcuts | Quick recruit/templates appeared immediately on the first registration screen as convenience UI. | Fallback recruits stay contextual and in-world, appearing only after the player starts past the briefing. |
| Origin/trait authorship | Backgrounds and traits had too few options, no reroll, blank default portraits, or unexplained color swatches. | Origins and temperaments provide enough variety, can be rerolled in the creation step, and drive default portrait/accent presentation without exposing raw color picking. |
| Ability allocation | Talent allocation displayed zeroed rows, making adventurers look like empty forms rather than trained candidates. | Ability rows show class minimums plus origin/trait totals first; bonus points are only added on top. |
| Identity fields | Name/title/notes were bare form fields with blunt labels like "memo" and no candidate generation. | The final registration step offers rerollable name, epithet, and record suggestions; labels must fit the guild fiction. |
| Dungeon topology | The maze behaved like room cards or a graph of named places. | Dungeon is a continuous grid of cells, edge walls/doors, facing, stairs, and current-cell actions. |
| Tiny floor slices | B1F shipped as a three-cell line that felt like nodes, not a dungeon floor. | Authored floors need enough cells, branches, loops, and current-facing decisions to read as a maze, even in MVP form. |
| Minimap | Map layout was missing, too large, or revealed/warped topology. | Minimap is compact, nearby, explored-only, and derived from grid coordinates. |
| First-person/map mismatch | First-person view suggested an open passage while minimap and movement rules said the facing edge was a wall. | Dungeon view is derived from current cell edge truth; a blocked front edge renders as an unmistakable nearby wall and has browser regression coverage. |
| Stairs/return | Return was free/always available, stairs/return worked from an implausible distance, or moving forward silently changed floors. | Return/stair actions require the current cell or current edge, and stairs require an explicit contextual command. |
| Visual affordances | Enemies, doors, stairs, traps, or route state existed only in logs/text. | Important DRPG affordances must be visible in the first-person view or compact HUD. |
| Assets | Enemies and landmarks were primitive circles/rectangles. | Player-facing assets need authored/generated silhouettes, material texture, and screenshot review. |
| Floating enemies | Enemy sprites appeared detached from the floor plane. | Enemies need believable contact with the dungeon space: grounded placement, shadow/contact cue, and screenshot review. |
| Enemy HP leakage | Exact enemy HP was exposed in normal battle UI. | Normal play hides exact enemy HP unless a deliberate scan/identify mechanic reveals it; show only count and coarse condition. |
| Combat commands | "Round resolve" or missing attack read as debug/unfinished UI. | Combat uses clear command selection, target selection, message advance, and stable command positions. |
| Combat command order | Combat let a clicked/selected party card decide the only actor, unlike classic party-command RPGs. | Combat commands advance through standing party members in formation order; formation cards are status, not arbitrary actor selectors. |
| Mouse-first targeting | Enemy groups were clickable targets, making combat depend on free cursor selection. | Targeting is controller-first: a visible target cursor/cycle command selects enemy groups; enemy display itself is status, not a mouse button. |
| Logs | Messages pushed commands around or duplicated the same idea. | Logs/messages are bounded; command surfaces never shift after results. |
| Controller-first UI | Guild/town/combat/dungeon UI was designed as web forms or scattered mouse targets. | Normal play is controller/keyboard first: staged choices, stable focus order, confirm/cancel, and fixed command/message areas. |
| Controller rule drift | Controller-first was written as a rule but player-facing changes still shipped without directional focus proof. | Controller-first is a blocking completion rule: changed surfaces need browser evidence for directional focus, confirm, and cancel/back where applicable. |
| Viewport overflow | Combat/dungeon UI required scrolling for the core command loop on desktop-sized play. | Core view, status, message, and command window fit in one viewport for standard desktop review states. |
| Combat minimap clutter | Minimap stayed visible during combat even though mapping is not the active decision. | Hide minimap during combat; preserve first-person enemy view, formation, message, and command windows. |
| Node-like minimap | Minimap cells and connector strokes looked like a node graph. | Minimap renders as compact contiguous grid tiles from coordinates/edges, not isolated nodes with graph links. |
| Repeat/auto | Repeat produced "cannot repeat" or hid risk instead of helping tempo. | Repeat/auto is an explicit mode, cancellable, and stops on danger, branch, or unsafe state. |
| Party formation | Party display was a flat row/list or wrong size. | Six-person party, front/back rows, and row meaning are visible in exploration and combat. |
| Dungeon party HUD | Exploration HUD reduced adventurers to small HP readouts and omitted portraits, class, and combat identity. | Dungeon HUD shows each member's portrait, name, class/title, row grouping, HP, and compact combat stats without opening a profile panel. |
| Guild formation display | Guild roster showed a 2x3 card grid and duplicate text like `Seeker / Seeker`, hiding front/back meaning. | Roster display groups members into explicit front and back rows, three slots each, and suppresses default title/class duplication. |
| Class roster | Six-person parties had only four classes, and class cards showed design tags such as front/damage/retreat support. | Guild registration offers enough class variety for experimentation and each class has a short in-world job description. |
| Prose | Japanese sounded translated, abstract, or told the player what to feel. | Prose is Japanese-first, concrete, short, sensory/spatial, and never speaks for player characters. |
| Localization | Japanese normal play mixed stray English enemy names, units, or combat/shop text. | Japanese mode localizes enemy/place names, rewards, shop units, and logs; only genre-natural abbreviations remain. |
| Town equipment | Equipment/shop screens felt like shallow admin lists without DRPG preparation weight. | Equipment has meaningful slots, role/class constraints, prices, tradeoffs, and browser-reviewed presentation. |
| Reference misuse | "Wiz-like" was treated as surface flavor while violating the play structure. | Use classic DRPGs for interaction structure only: party order, formation, attrition, grid maze, command windows, and town prep. Do not copy proprietary content. |
| Claiming done | Codex declared completion before checking the actual browser UI. | Any player-facing change needs browser screenshot/DOM review and a remaining-risk note. |

### Combat feel & command UX (2026-07-11 playtest — found by hand in ~3 minutes)

These are the exact things a player found by touching combat; each now has an
automated regression check (see `tests/e2e/combat-regression.spec.ts` + others).

| Area | Past failure | Blocking expectation | Regression cover |
| --- | --- | --- | --- |
| Command order | Command entry started on a back-row caster (raw party-array order). | The front row is commanded first, then the back row, in formation order. | `combat-order.spec.ts` |
| Command surface | Combat was a flat button toolbar ("ボタンぽちぽち"), not a command RPG. | Per-actor input is a nested command MENU (command → target/spell), cursor/keyboard-first. | `combat.spec.ts`, `keyboard-combat.spec.ts` |
| Keyboard scheme | Combat could not be driven by WASD (only arrows). | The command menu accepts WASD (W/S cursor, A back, D confirm) as well as arrows. | `combat-regression.spec.ts` |
| Back-row attack | Back-row members (incl. casters with a staff) could not attack at all. | Back-row members carry a reach weapon (bow / long spear / staff) and can attack over the front line. | `reachWeapons.test.ts`, `combat-regression.spec.ts` |
| Lonely encounters | Combat fielded a single enemy — worse than an FC-era DRPG. | Encounters can field multiple groups of multiple monsters. | `multiGroupEncounter.test.ts` |
| Item command | Using an item completed with no selection at all. | どうぐ opens an item/target submenu; a target must be chosen. | `combat-regression.spec.ts` |
| Resource visibility | HP/MP were bare numbers; MP status was hard to read at a glance. | HP and MP render as gauge bars in the combat roster and dungeon formation. | `combat-regression.spec.ts` |
| Auto-battle stops | Auto/Repeat kept stopping itself and popping a menu ("謎UIが出て止まる"). | Discretionary auto-stops are OFF by default and Config-gated; auto just runs. | `squadCombat.test.ts` |
| UI reflow | Context buttons/clues reflowed the command dock (stretch/shrink). | The command area is fixed-footprint; contextual clues ride tooltips/log, not variable-width tiles. | `combat.spec.ts` (#68) |
| Instant combat | A round resolved instantly, then a log trickled in AFTER — desynced from the battlefield, with no felt weight or "数字感". | A declared round PLAYS OUT before it commits: the battlefield renders each beat's snapshot (enemies fall / HP drains as the blow lands), the struck target shakes, and a floating damage number rises. Instant-log Config escapes it. | `combatRoundBeats.test.ts`, `combatLog.test.ts`, `combat-regression.spec.ts` (hit-number) |
| Front-row depth | Only casters had a non-attack action; front row had no skills/特技. | Front-row members can use class 特技 (spending a 気力 pool), not just attack/defend. | `martialSkills.test.ts`, `combat-regression.spec.ts` |

## Browser Self-Play

Use [Browser Self-Play Gate](browser-selfplay-gate.md) when a change touches the
normal player route. The command `npm run selfplay:browser` starts at the title
screen, uses normal controls only, captures screenshots, and writes a route
report under `test-results/selfplay/`.

Browser Self-Play complements E2E and screenshot review. It does not replace
unit tests, scenario validation, or headless reachability.

## Completion Note Template

```md
Past trouble checked:
- Could recur:
- Gate used:
- Browser evidence:
- Headless limitation:
- Remaining UX risk:
```
