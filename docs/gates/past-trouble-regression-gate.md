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

### Controller, layout, and honesty of the Gate itself (2026-07-13/14 hand playtest)

Codex played the game by hand at 1280x720 and could not leave the scenario picker without Tab,
while `npm run selfplay:browser` passed in 38.5 seconds. **The Gate was the first defect.**

| Area | Past failure | Blocking expectation | Regression cover |
| --- | --- | --- | --- |
| **The Gate could not fail** | The self-play route navigated with `locator.click()` end to end and never pressed a directional key, so a screen with NO keyboard entry point passed it. The only overflow assertion checked `scrollWidth` — the HORIZONTAL axis — so commands hanging below the fold were invisible to it. | "No mouse" is **measured**, not declared: count real `pointerdown`/`mousedown` (a keyboard Enter fires `click` but never a pointer event, so there are no false positives). Viewport is checked on **all four edges** and **per command**. | `controllerGate.ts`, `controller-route.spec.ts` |
| **A known gap passed as green** | `test.fail()` is reported by Playwright as a **PASS**. Fixing one defect turned the whole command green while the guild was still unplayable. | `npm run gate:final` (`FINAL_GATE=1`) strips every marker. **A green `test:e2e` is not a green gate.** | `gate:final` |
| Half a lock | A layout lock asserted the combat screen does not **move**; it never asserted it **fits**. Playwright's default viewport already IS 1280x720, so it measured the reported size and still passed while the command dock sat at y=719..786 on a page that cannot scroll. | A layout lock asserts BOTH: it does not reflow, AND every command is on screen. | `combat-stage.spec.ts` |
| No controller entry point | The scenario picker registered no controller surface, so the focus ring was empty: arrows did nothing and a gamepad player was stuck. | Every top-level screen registers `data-controller-surface` + `data-controller-active`, and hands the cursor a place to land. | `controller-route.spec.ts` |
| **No way out** | "Back to town" belonged to no controller surface, so a gamepad player could enter the guild — or the shop — and **never leave**. | Every command belongs to a surface. Always-present navigation is `data-controller-chrome="true"`: it joins the ring, answers Cancel, and is never the cursor's starting place. | `controller-route.spec.ts` |
| Cancel ejected the player | Escape inside a text field blurs FIRST, so the "active surface" fell back to the first one in DOM order — the way out. Escape in the name field threw the player out of registration entirely. | The surface fallback prefers the screen the player is ON, never chrome. | `controller.spec.ts` |
| Two rings, one screen | Sibling controller surfaces flatten into ONE focus ring, so the guild's roster shared the ring with the class grid and arrows wandered out of the step the player was being asked for. | One non-chrome surface per screen. A step is a step; another screen's controls do not sit beside it. | `controller-route.spec.ts` (`exclusive`) |
| **The cursor lied** | The town painted "Enter dungeon" permanently gold while the focus ring — also gold — sat on "Guild". Enter opened the guild. | Gold means focus and nothing else. What LOOKS selected IS what is focused. | `expectSelectionMatchesFocus` |
| **A decoration renamed its own button** | The focus caret was `::before { content: "▸" }`. **Chrome folds `::before` content into the accessible name**, so the button silently became `"▸Enter dungeon"` and every exact-name query broke — *only while focused*, which surfaced as an intermittent failure of a completely unrelated test. | Carets and decorations are CSS **shapes**. Never `content:` text on an interactive element. | — (the bug is invisible to tests that do not use exact names) |
| Everything at once | The guild showed a 12-class grid, the Guild Master's offer, the formation, the reserve, the retired and a character sheet on one 720px screen; the column ran to 1370px. | Registration is a form and nothing else. The hall is a room. A question is a modal that owns the screen. | `controller-route.spec.ts` |
| A first departure read as a return | No state distinguished "never went below" from "came back", and the "Return record" was `latestLogText` — the last LOG LINE, which for a new party is the last recruit joining. | State counts expeditions. The town greets a party that has never left with a departure ledger. | `first-departure.spec.ts` |
| Copy hardcoded in code | Town/service copy lived in the i18n TypeScript dictionary, so the ash town and a drowned grove greeted the player with the same sentence. | Player-facing copy belongs to the SCENARIO: `world.md` `copy: { <locale>: { <key>: "…" } }`, layered over the dictionary by `createWorldTranslator`. | `worldCopy.test.ts` |
| Raw route ids | The picker printed the pack id (`default` / `verdant`) under each title. The test that should have caught it used `/\bdefault\b/` — and `"Gate of Ashdefault"` has **no word boundary**, so it passed on a card that plainly leaked. | No raw ids in normal play. Compare visible text against the id itself, not against a regex that can miss it. | `controller-route.spec.ts` |
| No sense of place | **Nothing on any screen said which world you were in.** A picker that started the WRONG world would have left no trace. | The active scenario is named on screen. | `controller-route.spec.ts` |

### Renderer and content boundaries (2026-07-13/14)

| Area | Past failure | Blocking expectation | Regression cover |
| --- | --- | --- | --- |
| Two representations of one thing | Enemies were drawn TWICE — sprites in the 3D view AND a row of DOM cards below it. The cards resized with their contents and the stage (flex:1) shrank by exactly as much, so the screen breathed every blow. A group of three was ONE sprite with a "×3". | The creatures are the only representation. A pack of N is N bodies. | `combat-stage.spec.ts` |
| The renderer depended on the art's framing | Every sprite was anchored with ONE hand-tuned constant (`center.y = 0.38`) meant to fake "feet on the floor". Each image pads its subject differently, so most creatures hovered and slime and boss drew the same size. | The engine MEASURES the silhouette (alpha) and owns grounding and size (`Enemy.size`). Art owes only a clean alpha. **Retune apparent size in data, never by re-ordering art.** | `spriteMetrics.test.ts` |
| A formula with no term for the thing it was for | Figure spacing was `min(bodyWidth * 0.82, cap)` — it can only ever place creatures CLOSER TOGETHER THAN THEY ARE WIDE. There was no "spread" term at all, so a pack always huddled. | Spread first, then clamp. | — |
| **A rendering change that was a rules change** | `elevation` was set on an enemy to make it hover. `elevation` is a COMBAT field: `enemyGroupIsBack()` shields air/mid groups from melee while a ground group stands (the front-blocker/back-caster squad). A Verdant fight deadlocked. | Presentation-only hovering is `hover: true`. **Before changing a data field to change a picture, grep what reads it.** | `verdant-playthrough.spec.ts` |
| The enemies get the leftovers | Fixed bands (command zone + log + party strip) reserve ~250px, so at 1280x720 the enemy stage is 227px and the art reads small. Etrian Odyssey gives the enemies a WHOLE SCREEN; modern single-screen JRPGs OVERLAY commands and log on the scene. | **OPEN.** Overlay the command menu and log on the stage rather than reserving a permanent band. | — (not yet built) |


### Town services and completion screens (2026-07-14)

| Area | Past failure | Blocking expectation | Regression cover |
| --- | --- | --- | --- |
| Completion mixed with administration | The 6/6 guild screen said "Party ready", showed the finished 3+3 — and under it six Bench buttons, the reserve, the retired, the portable vault and a character sheet with Retire / Reclass / Deposit / Edit. Five commands sat below the fold at y=986 in a 720px frame. | A completion screen says ONE thing. Administration is behind a command. | `town-services.spec.ts` |
| A service that reads as a web form | Recovery was a large empty field, then six plain cards edge to edge (five saying "No treatment."), then a full-width submit the height of a paragraph. The healthy members used most of the screen to say nothing, and the cost — the number that decides the answer — was a footnote. | A town service is a counter: only what needs deciding, the price, and two ordinary commands. A healthy party gets one line. | `town-services.spec.ts` |
| **A test that passed by luck** | The first recovery lock assumed the party would take a hit on one expedition. It passed the day it was written and would have failed the next. | If a screen needs a state, DRIVE the game to that state and fail loudly if it cannot be reached — do not hope for it. | `town-services.spec.ts` (`returnToTownHurt`) |
| Dead CSS from an earlier layout | An old `.recovery-plan` auto-fit grid template was still in the sheet, so the rebuilt rows collapsed into one narrow column and "Mira" rendered as "M". | When rebuilding a component, name the properties the old rules set. `styles.css` keeps its ghosts. | — |
| A chrome label reused as a screen's command | A "Back to town" button added inside the recovery panel collided with the chrome bar's identically-named one, quietly made the service-navigation helper ambiguous, and hung a test that had nothing to do with recovery. | A screen's own commands do not borrow chrome's labels. | `town.spec.ts` |
| **The enemies get the leftovers** | Fixed rows (party strip / message / command zone / dock) reserve the screen, so at the 1280x720 minimum Gate the enemy stage is **227px — 32% of the screen** (534px / 49% at 1920x1080). Etrian Odyssey gives the enemies a whole screen; modern single-screen JRPGs OVERLAY the command box and log on the scene. | **OPEN.** Overlay the command menu and log on the stage rather than reserving rows for them. | — (not yet built) |


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
