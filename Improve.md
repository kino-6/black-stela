# Black Stela Active Improvement Backlog

Last browser review: 2026-07-18, Chromium. Primary review at 1280x720;
career presentation also checked at 1920x1080.

## Review Evidence

- The same-day normal-route evidence archived with `IMP-013/014` covers:
  title -> six-person guild -> B1F combat -> B2F -> return -> recovery.
- The final combined evidence run passed 8/8: browser self-play, screenshot
  review, and `IMP-021/022` controller verification on one current build.
- The latest isolated rerun passed 17/17 controller, screenshot, camp, career,
  appraiser, loot, and quest-board tests, plus 4/4 `IMP-021/022` verification
  tests. Controller-only routes measured zero pointer events.
- A broader 9-test rerun passed 8/9. The wounded-party recovery case timed out
  after the scripted expedition wiped: its helper recognized town, but the
  outer path kept attempting dungeon movement. Treat this as E2E Gate debt,
  not fresh proof that the recovery screen failed.
- Screens reviewed:
  `test-results/screenshot-review/desktop-guild-class.png`,
  `test-results/screenshot-review/desktop-guild-bonus.png`,
  `test-results/screenshot-review/desktop-dungeon-start.png`,
  `test-results/screenshot-review/desktop-combat.png`,
  `test-results/screenshot-review/desktop-post-return-town.png`,
  `test-results/screenshot-review/desktop-shop.png`,
  and `test-results/codex-imp-021-022/*.png`.
- This was Scripted Regression plus audited screenshot review. It proves the
  normal route and exposes visible defects; it is not a blind first-play claim.
- The shared working tree also contained concurrent gameplay edits outside this
  review. Re-run the targeted route after those edits are committed before using
  this evidence as a merge Gate; this review changed documentation only.

Passing the route is not visual acceptance. Current tests prove that surfaces
fit and accept controller input, but they do not yet prove that the screen reads
like a DRPG rather than a web service.

## Active Status

| Item | Priority | State | Player-visible problem |
| --- | --- | --- | --- |
| `IMP-021` | High | A/B/C shipped; V blocked | Career rules exist, but the service still reads as a long text catalog and loses decision context while focus scrolls. |
| `IMP-022` | High | A/B/C/D shipped; V blocked | Appraisal and forging work, but loot handling still lacks filtered bulk selection and broad enemy-answer affixes. |
| `IMP-023` | High | A/B/C shipped; V pending | The deterministic simulator has not received independent production-rule parity review. |
| `IMP-024` | P1 | Reproduced | The combat command window covers the enemy presentation that should inform the command. |
| `IMP-025` | P2 | Reproduced | Town is a grid of ten equal service buttons rather than a readable preparation loop. |
| `IMP-026` | P2 | Reproduced | Exploration presents movement and utility as eleven web-toolbar buttons despite controller-first input. |
| `IMP-027` | P1 | Reproduced | A direct guild departure can return from the dungeon to Adventurer Registration instead of the town return loop. |
| `IMP-028` | P1 | Reproduced | Character creation remains a scrolling card catalog and stat-entry form rather than a focused adventurer-making flow. |
| `IMP-029` | High | Approved capability | Entering a room auto-grabs its treasure; there is no chamber-fight → chest → investigate/disarm/open exploration loop, and thief-class trap handling is unused. |

## Archive

- `IMP-001` to `IMP-008`:
  [completed browser slices](docs/archive/Improve.completed-browser-slices-2026-07-14.md)
- `IMP-009` to `IMP-011`:
  [completion record](docs/archive/Improve.completed-imp-009-011-2026-07-14.md)
- `IMP-012`:
  [completion record](docs/archive/Improve.completed-imp-012-2026-07-14.md)
- `IMP-013` to `IMP-014`:
  [completion record](docs/archive/Improve.completed-imp-013-014-2026-07-18.md)
- `IMP-015` to `IMP-016`:
  [completion record](docs/archive/Improve.completed-imp-015-016-2026-07-14.md)
- `IMP-017`:
  [completion record](docs/archive/Improve.completed-imp-017-2026-07-14.md)
- `IMP-018` to `IMP-020`:
  [completion record](docs/archive/Improve.completed-imp-018-020-2026-07-15.md)

## IMP-021: Career Mastery And Advanced Vocations

**Category:** Character growth / party building

The contract, authored vocation graph, mastery simulation, career change, and
bounded combat loadout are implemented. Current controller routes pass at both
review viewports, and vocation previews now expose signature, stat changes,
equipment access, prerequisites, and techniques.

### Verified

- [x] Advanced destinations and their prerequisite routes are visible.
- [x] Character level and learned techniques survive vocation changes.
- [x] Current vocation owns modifiers, equipment permission, and signature.
- [x] Combat techniques use a bounded loadout.
- [x] Seeded progression checks early-floor mastery farming and dominant routes.
- [x] Existing saves migrate through the current schema.

### Remaining Visual Acceptance

- [ ] Keep the selected adventurer, current vocation, target vocation, and
  confirm/cancel context visible while focus moves through the catalog.
- [ ] Replace the long text-card scroll with bounded basic/advanced destinations
  and a stable detail pane.
- [ ] Give vocation choice an authored visual identity; it must not be only a
  database-like list of names, tags, and deltas.
- [ ] Re-run Japanese line-layout review after the service composition changes.

**Browser route:** town -> vocations -> basic/advanced preview -> change/cancel
-> combat -> retained technique.

**Past trouble likely to recur:** character growth becoming data entry;
controller focus scrolling away from decision context; raw formulas or English
ids; commands below the 720p frame.

## IMP-022: Rare Equipment, Appraisal, And Bulk Asset Conversion

**Category:** Expedition rewards / equipment economy

Rare appraisal now costs gold, shows current-equipment comparison, supports an
equip decision, protects important items, confirms bulk conversion, and feeds
materials into the Forge. The old "materials have no use" blocker is closed.

### Verified

- [x] Common items are known on acquisition; rare properties can remain hidden.
- [x] Rare appraisal charges a visible cost.
- [x] Appraised equipment can be compared with the selected adventurer's gear.
- [x] Bulk conversion has a preview and confirm/cancel step.
- [x] Equipped, locked, favorite, and protected unidentified items survive bulk
  conversion.
- [x] Dismantled materials can reinforce equipped gear in the Forge.
- [x] The enemy record accumulates observed information without exact hidden HP.

### Remaining Capability And Visual Acceptance

- [ ] Add controller-first bulk filters and selection before confirmation;
  "all eligible" alone is not enough for a rare-loot keep/convert decision.
- [ ] Expand authored affix effects beyond four flat combat bonuses so equipment
  can answer armor, regeneration, evasion, status, groups, and species.
- [ ] Prove at least two viable equipment/party answers for each dangerous enemy
  family without creating mandatory key gear.
- [ ] Recompose Appraiser and Forge empty/populated states as full town service
  scenes. A narrow left list plus a large unused field is still web-service UI.
- [ ] Re-run reward cadence, appraisal cost, and conversion-profit simulation
  after affix and filter changes.

**Browser route:** expedition result -> appraiser -> compare/equip -> filtered
bulk conversion -> confirm/cancel -> Forge -> enemy record.

**Past trouble likely to recur:** destructive bulk action; controller focus
drift; unexplained colors or English affix fragments; long inventory web lists;
economy evidence being mistaken for reward excitement.

## IMP-023: Deterministic Content And Economy Simulation Gate

**Category:** External content tooling / balance evidence

### Verified

- [x] A fixed seed, content pack, party, and rules produce a reproducible report.
- [x] Validation catches invalid vocation graphs, dead affixes, and insufficient
  enemy-counter coverage.
- [x] Reports include unlock timing, route performance, economy, equipment
  cadence, affix use, counter coverage, defeat rate, and outlier seeds.
- [x] Thresholds are versioned data rather than hidden AI prompt instructions.
- [x] The authoring loop keeps AI outside runtime `GameState`.

### Remaining Acceptance

- [ ] `IMP-023V` / Claude Code: compare selected simulator seeds against
  production loaders and browser outcomes, then record any parity drift.
- [ ] Keep browser reward and combat review mandatory even after parity passes.

**Verification route:** seeded simulation -> selected-seed browser reproduction
-> expedition reward, career, and enemy-counter review.

**Past trouble likely to recur:** headless evidence being called UX proof;
duplicated formulas drifting from production; AI acting as hidden game authority.

## IMP-024: Preserve Enemy Readability During Combat Commands

**Category:** Combat readability / tactical command entry

**Evidence:** `test-results/screenshot-review/desktop-combat.png`. At 1280x720,
the active portrait and translucent command window occupy the same central band
as the enemy. The creature becomes a blurred shape behind the menu, and its
name, group condition, role, and target relationship are not readable while the
player is choosing an action. All current combat-stage tests still pass because
they measure stage height, minimum silhouette size, and viewport fit, not HUD
occlusion. The same frame also flattens the six-member party into one horizontal
strip, so the front/back formation is no longer visible during the phase where
row and reach determine valid commands.

**Player outcome:** The player can look at enemy groups, understand which group
is dangerous or reachable, and issue six commands without the decision surface
hiding the subject of that decision. Party order remains legible as three front
and three back positions rather than six interchangeable actor cards.

### Implementation Slices

- [ ] Reserve renderer-safe screen regions for enemy bodies and marks after all
  combat HUD rectangles are known.
- [ ] Place portrait, command list, message beat, and target prompt in fixed
  regions that never intersect enemy bodies or enemy marks.
- [ ] Keep group name, coarse condition, status, row/reachability, and target
  cursor readable; do not reveal exact HP without an authored ability.
- [ ] Restore a compact 3+3 formation readout in combat. Keep HP/MP/status and
  active-order cues, but do not use the party strip as an actor picker.
- [ ] Scale and ground enemies by authored footprint/threat, not one universal
  size, while preserving the corridor perspective.
- [ ] Add E2E geometry assertions for enemy screen-space bounds versus every HUD
  rectangle. Stage share and silhouette size alone are insufficient.

### Acceptance

- [ ] No enemy body or mark intersects the active portrait, command, message, or
  party-vital regions at 1280x720 and 1920x1080.
- [ ] Command -> target -> cancel -> next actor preserves enemy context and
  formation order without layout movement.
- [ ] A screenshot alone communicates which three adventurers are front and
  which three are back; no repeated per-character row labels are required.
- [ ] A screenshot review can identify each visible enemy group before reading
  the combat log.

**Browser route:** normal encounter -> six-member command entry -> target change
-> cancel -> round playback -> next round.

**Past trouble likely to recur:** enemy art given leftover space; large-but-hidden
sprites; exact HP leaks; command/log reflow; a numeric Gate passing an unreadable
screen.

## IMP-025: Turn Town Services Into A Preparation Loop

**Category:** Town information architecture / expedition rhythm

**Evidence:** `test-results/selfplay/09-post-return-town.png`. After returning,
ten equal rectangular commands compete in one grid: Guild, Party, Shop,
Recovery, Quest board, Vocations, Appraiser, Forge, Records, and Enter dungeon.
The route is controller-operable, but the hierarchy is a generic service
dashboard and the next useful preparation is not reflected in command priority.

**Player outcome:** Returning to town reads as relief, assessment, preparation,
and departure. The player sees what changed and reaches the next relevant
decision without scanning every unlocked system.

### Implementation Slices

- [ ] Establish a diegetic town hub with a small first-level destination set.
  Group roster/vocations, shop/appraisal/Forge, and records/quests behind their
  natural locations instead of exposing every subsystem at once.
- [ ] Keep the return summary as a short arrival state, then hand focus to the
  most relevant preparation destination without grading the party.
- [ ] Surface only truthful urgency: wounded members, unidentified finds,
  available reinforcement, accepted quest updates, and expedition readiness.
- [ ] Preserve one-step Cancel back to the hub and one stable departure command.
- [ ] Give each destination an authored scene/keeper identity rather than a
  blank panel containing a web list.

### Acceptance

- [ ] The first town level contains no more than five peer destinations plus a
  clearly separated departure action.
- [ ] Recovery, loot handling, equipment improvement, party work, and departure
  remain reachable without pointer input or page scroll.
- [ ] The screen fits at 1280x720 in Japanese and English without tiny labels or
  command wrapping.
- [ ] First arrival and later returns use different, concise states.

**Browser route:** first arrival -> guild -> departure -> expedition return ->
recovery -> market/appraisal/Forge -> re-departure.

**Past trouble likely to recur:** admin-dashboard town; oversized top navigation;
systems exposed because they exist rather than because the player needs them;
return summary becoming a lecture.

## IMP-026: Reduce Exploration To D-Pad Movement And Current-Cell Decisions

**Category:** Dungeon controller UX / exploration purity

**Evidence:** `test-results/screenshot-review/desktop-dungeon-start.png`. The
controller route works, but the screen exposes eleven permanent buttons plus
the current-cell stair action: Auto, four turn/strafe actions, Move, Back,
Search, Listen, Party, and Map. Movement is already driven by directional input,
so the visible toolbar duplicates the controller and competes with the few
decisions that matter on the current cell.

**Player outcome:** Exploration feels like controlling a party in a labyrinth,
not choosing verbs from a browser toolbar. Directional input handles movement;
the command window contains only contextual decisions.

### Implementation Slices

- [ ] Remove turn, strafe, forward, and back from the primary command list.
  Keep compact controller legends/configurable help outside the focus order.
- [ ] Reserve the command window for current-cell actions such as stairs,
  doors, search/listen findings, camp/party, and map.
- [ ] Show stairs, returns, treasure, and other authored actions only when the
  party occupies the correct cell and facing matters.
- [ ] Move repeat/auto state to a compact exploration status with immediate
  interrupt; it must not become the first command in every room.
- [ ] Preserve stable focus and a short Cancel path between map, party, event,
  and exploration.

### Acceptance

- [ ] Normal movement and turning require no focus traversal and no pointer.
- [ ] The primary exploration command window presents at most five relevant
  actions, with unavailable current-cell actions absent rather than disabled.
- [ ] Mini-map, first-person view, facing, and movement result remain sourced
  from the same map truth.
- [ ] Japanese 1280x720 and 1920x1080 views keep the dungeon dominant and the
  command surface on one stable line or bounded compact window.

**Browser route:** dungeon entry -> movement/turn -> current-cell stairs ->
map -> party -> cancel -> search/event -> auto start/interrupt.

**Past trouble likely to recur:** generic web toolbar; direction buttons
duplicating controller input; remote stairs/actions; command movement after logs;
mini-map and first-person view disagreeing.

## IMP-027: Make Every Dungeon Return Enter The Same Town Loop

**Category:** Core-loop continuity / return transition

**Evidence:** `test-results/screenshot-review/desktop-post-return-town.png`.
Starting the expedition directly from the 6/6 guild-completion screen leaves
the town mode on Guild. After using the authored return marker, the screen says
Town but renders Adventurer Registration and another Enter dungeon command.
The existing self-play route misses this because it explicitly backs out to the
town hub before departing.

**Player outcome:** Every successful return lands on the expedition result and
town preparation loop, regardless of whether departure began from the guild
completion screen or the town hub.

### Implementation Slices

- [ ] Make dungeon entry record only expedition context, not a stale town
  service panel that can be restored on return.
- [ ] Route stairs, return markers, defeat rescue, and other authored returns
  through one arrival state before town destinations become selectable.
- [ ] Show concise expedition changes: wounds, gold, loot, quest updates, and
  any unidentified or reinforceable finds. Do not reopen Guild automatically.
- [ ] Add a controller-only E2E route that departs directly from 6/6 Guild,
  returns through the B1F marker, and asserts the arrival state.

### Acceptance

- [ ] Direct guild departure and hub departure produce the same return cockpit.
- [ ] The first focused choice after arrival belongs to the return/preparation
  surface, not Guild or another stale service.
- [ ] Continue to a service, cancel to the hub, and re-depart without page
  scroll, pointer input, or duplicated return messages.

**Browser route:** new expedition -> 6/6 Guild -> direct departure -> combat ->
return marker -> arrival summary -> recovery/market -> re-departure.

**Past trouble likely to recur:** route-specific UI state; return treated as a
raw phase change; guild controls leaking into dungeon completion; scripted E2E
passing because it takes only one departure path.

## IMP-028: Recompose Character Creation As A Character-Focused Sequence

**Category:** Character authorship / guild presentation

**Evidence:** `test-results/screenshot-review/desktop-guild-class.png` and
`desktop-guild-bonus.png`. The flow is staged and controller-operable, but Class
is a long two-column card page and Talent is a full-width set of plus/minus form
rows. The chosen portrait and developing character are absent from the decision
space, while Next can sit below the catalog's internal scroll.

**Player outcome:** Creating one adventurer feels like shaping a person for the
party. Each step keeps the chosen visual identity and current character summary
visible while one bounded decision window explains what the choice changes.

### Implementation Slices

- [ ] Replace the class card wall with a bounded class command list and stable
  detail pane showing role, formation, signature, starting gear, and aptitude.
- [ ] Keep the character portrait/battle framing and current party formation in
  a reserved preview region through class, origin, talent, and name.
- [ ] Present bonus allocation as a compact RPG status window with base,
  allocated, final, remaining points, reroll, and confirm; avoid scattered form
  controls and page scroll.
- [ ] Keep Back/Confirm in fixed positions and preserve the current draft when
  moving between steps.
- [ ] Verify six consecutive registrations with controller input in Japanese;
  no one-character wrap tails and no focus scrolling the decision context away.

### Acceptance

- [ ] Each step asks one decision and fits without page scroll at 1280x720.
- [ ] Class and aptitude changes update the same visible character preview
  immediately, including starting equipment and front/back suitability.
- [ ] Portrait import remains optional and secondary; default assets provide a
  complete, varied creation flow without a pointer.
- [ ] Finishing one adventurer returns to a clear 3+3 party state and offers the
  next registration without exposing roster administration.

**Browser route:** Guild explanation -> class -> origin/appearance -> aptitude
allocation/reroll -> name/profile -> register -> repeat six times.

**Past trouble likely to recur:** character creation as data entry; scrolling
card walls; web-form steppers; absent character art; Next/Back moving or leaving
the viewport; controller support proven only by Enter on focused HTML controls.

## IMP-029: Chamber Fights, Treasure Chests, And Trap-Handling Vocations

**Category:** Dungeon exploration loop / loot / vocation payoff

**Player outcome:** Step into a chamber → fight its fixed pack → after victory a
closed chest remains on the current cell → investigate / disarm / open / leave →
take the loot and return to exploration. Entering a room no longer auto-collects
treasure.

### Implementation Slices

- [ ] **Chamber cells** — an authored cell with a fixed encounter + reward (not
  just any named room). The chest is inoperable until the pack is defeated; on
  victory a closed chest appears on the same cell. Do not surface the design term
  "玄室/chamber" verbatim in normal UI.
- [ ] **Chest state machine** — `treasureTable` reward is NOT auto-taken on room
  entry or stair use. A chest is operable only on the current cell; plain chests
  open simply, trapped chests demand a decision. Investigate / disarm / open each
  resolve once per chest (no re-roll on the same chest), no duplicate claim from an
  opened chest, state persists while on the floor (chamber may re-arm on floor
  re-entry, as today).
- [ ] **Trap handling via vocations** — `cutpurse` / `seeker` / `scout`
  `trap_handling` drives the check; the rules pick the best handler from agility,
  wit, luck, level, and aptitude. Usable without a specialist (higher risk), never
  class-locked. A failed investigation says "cannot tell", never a false "safe".
  Investigate and disarm are one attempt each; opening undisarmed/failed trips the
  trap but never destroys the reward. Never show success rates or internal formulas.
- [ ] **External scenario contract** — chests, trap kinds, difficulty, reward
  tables authored in scenario data; existing `treasureTable`-only data loads as a
  safe plain chest (back-compat); invalid trap kind / difficulty / reward-table
  ref rejected by scenario validation. Seed Default AND Verdant with ≥1 trapped
  chamber each.
- [ ] **UI (React)** — use the delivered `treasure-chest-closed.png` /
  `treasure-chest-open.png`, grounded on the floor in the first-person view; no
  chest UI during combat; controller directional + confirm + cancel only; no web
  forms, no clicking enemies/chests, no centered app popups; fixed command/message
  regions (no reflow on result); after opening keep the open image + a short loot
  line, confirm returns to exploration.

### Acceptance / Required tests (fixed seed, headless)

- [ ] Entering a room or using stairs alone collects NO treasure.
- [ ] Chest is inoperable before the chamber fight is won.
- [ ] A closed chest appears on the current cell after victory.
- [ ] Investigate success/uncertain, disarm success/failure, and undisarmed-open
  are deterministic under a fixed seed.
- [ ] After a trap trips, the reward is still claimable and cannot be double-taken.
- [ ] Leaving and returning preserves chest state (same floor visit).
- [ ] Old saves and existing `treasureTable` migrate.
- [ ] Default and Verdant data resolve under the same rules.

**Browser Gate:** controller-only normal route — town → B1F chamber → fight →
investigate → disarm → open → resume exploration. Assert: 0 pointer events; chest
inoperable off-cell; correct closed/open display around the kill; focus/confirm/
cancel consistent; chest, message, and command never overlap; no English IDs or
one-character wrap tails in Japanese. 1280x720 is the no-scroll/no-overlap Gate;
1920x1080 is the composition review. Headless proves judgement, reproducibility,
and no-double-claim only; grounding, current-cell integrity, feel, and transitions
require browser evidence.

**Out of scope:** IMP-024..028 rework; Godot migration; new art; Appraiser/Forge
redesign; any required class/key to open a chest; remote/auto operation or
auto-collect on entry.

## Review Baseline

- 1920x1080 is the primary desktop presentation target.
- 1280x720 remains the minimum no-overlap, no-scroll controller Gate.
- Normal browser play is required. Debug routes are diagnostic and headless
  reachability proves only engine reachability.
- Visual review must check enemy readability, Japanese line layout, focus truth,
  transition rhythm, and scene identity after the route passes.
- Add a new numbered item only for a reproduced defect or approved capability.
  Do not reopen an archived item when a later defect appears on the same screen.
