# Black Stela Improvement Backlog

Browser playtest: 2026-07-13, Chromium, 1280x720, build `ad4287b`.

## Purpose

This is a shared implementation handoff for Claude Code and Codex, not a general
review. The route started at the title screen, built a six-person party through
visible guild controls, entered Verdant G1F, moved with normal controls, and
queued a full six-member combat round. No debug progress, direct `GameState`
mutation, rules-engine call, or hidden route shortcut was used.

Before changing a player-facing surface, read `AGENTS.md`,
`docs/skills/black-stela-gate-review-skill.md`,
`docs/gates/past-trouble-regression-gate.md`, and the relevant domain Gate.
Headless reachability is not completion evidence.

## Execution Order

1. Fix the browser Gate so it can detect controller failures.
2. Fix focus ownership and one-screen layout in scenario, guild, and combat.
3. Correct Verdant G1F structure and enemy staging in the renderer.
4. Correct first-expedition town semantics and localization leaks.

## Codex / Claude Code Allocation

This split is capability-based, not permanent ownership. Keep one primary
implementer per slice and use the other agent as an independent verifier. Do not
let the same agent both create a player-facing change and declare its visual or
controller Gate passed.

| Workstream | Primary implementer | Independent verifier | Boundary |
| --- | --- | --- | --- |
| Controller focus, state transitions, E2E Gate | Claude Code | Codex | Claude implements the reusable focus model and keyboard/gamepad tests; Codex replays the route without mouse fallback. |
| Scenario, guild, town, and combat UI refactor | Claude Code | Codex | Claude owns React/state/layout changes; Codex checks 1280x720 screenshots and actual command flow. |
| Japanese localization and first-expedition semantics | Claude Code | Codex | Claude owns state-derived copy/data wiring; Codex checks natural Japanese, line breaks, and wrong-state wording. |
| New art, retakes, portraits, textures, sprites, and icons | Codex | Claude Code | Codex owns `Art.md` interpretation, generation, alpha/canvas quality, and pack placement; Claude checks resolver/build integration. |
| Asset contracts and regression tests | Codex | Claude Code | Codex locks dimensions, basenames, alpha expectations, and delivery audit; Claude reviews runtime compatibility. |
| Runtime asset wiring, Three.js geometry, UVs, and focusable UI | Claude Code | Codex | Claude owns renderer behavior; Codex verifies that delivered art is presented at the intended scale and structure. |
| Enemy staging and contact with the floor | Claude Code | Codex | Claude changes placement/shadow/size logic; Codex supplies the visual target and rejects renderer-side misuse of good art. |
| Final player-facing acceptance | Codex | Claude Code | Codex performs normal-route browser play and screenshot review; Claude reruns automated Gates and fixes implementation regressions. |

### Issue Assignment

| Item | Primary | Required handoff |
| --- | --- | --- |
| `IMP-001` | Claude Code | Codex must reproduce scenario, guild, and combat using directional input, Confirm, and Cancel only. |
| `IMP-002` | Claude Code | Codex verifies initial focus, Japanese scenario cards, and no raw ids. |
| `IMP-003` | Claude Code | Codex verifies manual and suggested registration at 1280x720. |
| `IMP-004` | Claude Code | Codex verifies that visible cursor, `activeElement`, and resulting command agree. |
| `IMP-005` | Claude Code | Codex plays through at least two combat rounds and reviews stable geometry. |
| `IMP-006A` Act I wall retake | Codex | Claude checks pack resolution and build; the retake is not wired by hardcoded path. |
| `IMP-006B` stair/renderer wiring | Claude Code | Codex verifies the vine/root stairs in normal G1F play. |
| `IMP-007` | Claude Code | Codex verifies scale, silhouette separation, and grounded/hovering baselines. |
| `IMP-008` | Claude Code | Codex verifies first departure and a real post-return state in both languages. |
| `IMP-009` | Codex | Claude checks pack resolution/build; Codex supplies a three-portrait pilot and does final browser acceptance. |

### Handoff Contract

1. Work on one `IMP` slice at a time; do not edit the same implementation files
   concurrently.
2. The primary agent reports changed files, tests run, browser states captured,
   and remaining risk.
3. The verifier starts from the acceptance criteria and evidence, not from the
   primary agent's explanation.
4. A failed visual review returns to the primary agent as a concrete retake or
   implementation defect. Passing unit/build output cannot override it.
5. Update this document only after evidence exists. Commit and push remain
   separate user-approved actions.

### Suggested Claude Code Prompt

```text
Read CLAUDE.md, AGENTS.md, Improve.md, and the relevant Gate. Implement only
IMP-00X and satisfy every acceptance checkbox. Use controller-first normal play;
do not substitute click-only E2E or headless reachability. Report changed files,
tests, screenshots, and unresolved risks. Do not mark visual acceptance passed;
leave that handoff to Codex.
```

### Suggested Codex Prompt

```text
Read AGENTS.md, Art.md, the scenario ART brief, and IMP-00X. For art work,
generate or retake the ordered assets, place them under the pack-owned basename,
and verify alpha/dimensions/build. For review work, use normal-route browser play
and compare against the acceptance criteria. Do not approve a UI merely because
automated tests passed.
```

## IMP-001: Browser Self-Play Gives False Controller Confidence

**Priority:** P0 / Gate defect  
**Category:** `blocked_control`

`tests/e2e/selfplay.spec.ts` is browser-visible, but most route actions use
`locator.click()`. `startNewExpedition()` and `createStarterParty()` also click
scenario and proposal buttons. The test can pass while controller navigation is
broken. This happened in the 2026-07-13 review: `npm run selfplay:browser`
passed in 38.5 seconds while manual directional input could not leave the
scenario selector without Tab. The three automated screenshot-review tests also
passed, although the 1280x720 combat controls and guild content were visibly
clipped during manual review; image creation alone is not visual acceptance.

**Required change**

- Add a controller-only route that uses directional keys, Confirm, and Cancel.
- Do not use click to select a scenario, answer the guild proposal, choose all
  six combat orders, enter the dungeon, or leave a reversible submenu.
- Assert `document.activeElement` after every phase transition.
- Keep the current click route only as secondary mouse coverage.

**Acceptance**

- [ ] The scenario selector receives an initial focus cursor without Tab.
- [ ] Six guild proposals can be accepted without mouse or Tab traversal.
- [ ] Confirm advances and Cancel returns one phase without losing prior state.
- [ ] The Gate fails if visible selection and DOM focus disagree.
- [ ] The report records controller commands and screenshots, not only clicks.

## IMP-002: Scenario Selection Has No Controller Entry Point

**Priority:** P1  
**Categories:** `blocked_control`, `localization_leak`

**Reproduction**

1. Start a new expedition.
2. On the scenario screen, press Down or `S`.
3. Selection does not move because focus remains on `BODY`; Tab is required.
4. In Japanese, the cards expose raw ids `default` and `verdant`.

**Evidence:**
`docs/evidence/browser-playtest-2026-07-13/01-scenario-controller-and-id-leak.jpg`.

**Required change**

- Focus the current scenario on entry and support directional wrap/navigation.
- Confirm starts the selected scenario; Cancel returns to title.
- Remove raw pack ids and localize scenario titles/supporting copy.
- Keep technical pack identity in debug/report data only.

**Acceptance**

- [ ] Keyboard/gamepad reaches both scenarios and Back from the initial state.
- [ ] Japanese normal play contains neither raw ids nor unexplained English.
- [ ] A 1280x720 screenshot shows one unambiguous focus cursor.

## IMP-003: Guild Registration Is Simultaneous, Clipped, and Loses Focus

**Priority:** P1  
**Categories:** `layout_overflow`, `blocked_control`, `command_shift`

The class list, Guild Master proposal, party formation, and character record are
presented together. At 1280x720 the 12-class list and lower controls are clipped.
After choosing "見繕う", the candidate appears but focus resets to `BODY`.
After one recruit, class selection and detailed roster management still compete
for the same screen.

**Evidence:** `docs/evidence/browser-playtest-2026-07-13/02-guild-proposal-focus-loss.jpg`
and `03-guild-overflow-after-recruit.jpg` in the same directory.

**Required change**

- Make registration a staged command flow: explanation -> class -> appearance
  and background -> abilities -> name -> confirmation.
- Show the Guild Master proposal as one modal command window with Yes/No only.
- After acceptance, return focus to the next meaningful command.
- Separate roster management from registration; show front/back rows as 3+3.
- Keep fixed command and message regions within 1280x720.

**Acceptance**

- [ ] No core registration step requires page scrolling at 1280x720.
- [ ] Every step has one focus group, Confirm, and Cancel/Back.
- [ ] Proposal appearance never moves focus to `BODY`.
- [ ] A six-person party is readable as three front and three back members.
- [ ] Browser evidence covers manual creation and suggested-candidate flow.

## IMP-004: Visible Cursor and Actual Focus Can Disagree

**Priority:** P1  
**Category:** `visual_mismatch`

On the Verdant town screen, "Enter dungeon" had selected-looking gold styling,
but Enter activated Guild. The next screenshot therefore returned to the guild
instead of entering the dungeon.

**Evidence:** `docs/evidence/browser-playtest-2026-07-13/04-first-departure-town.jpg`
and its recorded focus state in the adjacent `README.md`.

**Acceptance**

- [ ] Exactly one normal-play command has selected styling.
- [ ] Selected styling is derived from the same state as DOM/gamepad focus.
- [ ] Enter always activates the visibly selected command.
- [ ] Route E2E asserts label, focus, and resulting screen together.

## IMP-005: Combat Does Not Fit One Screen and the Log Occludes Commands

**Priority:** P1  
**Categories:** `layout_overflow`, `command_shift`

After one full six-member round, the second combat-log line is hidden behind the
command window. At 1280x720, Auto, Repeat, and Retreat begin at y=728 and are
outside the viewport. The combat log is also a focusable button, adding a
non-command stop to controller traversal.

**Evidence:** `docs/evidence/browser-playtest-2026-07-13/07-combat-log-and-command-overflow.jpg`.

**Required change**

- Reserve fixed-height regions for enemy stage, party vitals, concise log,
  command menu, and automation commands.
- Keep command rows compact; do not make every command a full-width web button.
- Clamp or page the log without covering commands and without moving focus.
- Keep Auto/Repeat/Retreat visible, interruptible, and disabled for bosses as
  defined by `AGENTS.md`.

**Acceptance**

- [ ] All combat commands fit in 1280x720 without scrolling.
- [ ] Three or more log lines cannot overlap or move the command window.
- [ ] Six actors receive commands in formation order using only keys/gamepad.
- [ ] Target selection and Cancel preserve already queued orders.
- [ ] Screenshot review captures round 1 and round 2 with stable geometry.

## IMP-006: Verdant G1F Still Reads as Green Stone Masonry

**Priority:** P1  
**Category:** `visual_mismatch`

**Status:** Completed 2026-07-13

The first playable Verdant wall is fitted stone masonry under a green tint,
which directly violates `content/worlds/verdant/ART.md`. The entrance stair is
still simple stacked geometry even though Verdant stair assets exist.

**Evidence:** before:
`docs/evidence/browser-playtest-2026-07-13/05-verdant-g1f-stone-and-stair.jpg`;
after:
`docs/evidence/browser-playtest-2026-07-13/08-verdant-g1f-organic-wall-and-stair.png`.

**Required change**

- Retake `stone-wall-block1.jpg` as braided roots, bark, and moss with no brick
  courses or ash-pack structure.
- Wire `stair-down.png` and `stair-up.png` into normal dungeon rendering.
- Review UV/geometry so perspective does not recreate masonry bands.
- Retain program-side lighting; do not bake global green light into the asset.

**Acceptance**

- [x] G1F reads as a living drowned wood before any text is read.
- [x] Stairs visibly use the Verdant vine/root structure before activation.
- [x] Minimap, movement truth, and first-person openings still agree.
- [x] Browser screenshots pass the scenario ART brief, not only asset existence.

## IMP-007: New Enemy Art Is Readable but Poorly Staged

**Priority:** P2  
**Category:** `visual_mismatch`

Spore Gnat and Moss Mite are distinguishable and their alpha edges are clean,
but four enemies are compressed into a small distant cluster. Ground creatures
have weak contact with the floor, so the asset quality is not carried into play.

**Evidence:** `docs/evidence/browser-playtest-2026-07-13/06-verdant-enemy-staging.jpg`.

**Acceptance**

- [ ] Small ground enemies visibly contact the floor through renderer-owned
  placement/shadow, without adding baked shadows to sprites.
- [ ] A four-enemy group uses more of the stage while preserving target order.
- [ ] Hovering enemies and grounded enemies have visibly different baselines.
- [ ] Exact enemy HP remains hidden; health/state cues remain readable.

## IMP-008: First Departure Is Presented as a Return

**Priority:** P2  
**Category:** `localization_leak`

After building the first party, the town screen says "Town return", shows a
return record containing only the last recruit, and says the party can descend
"again" even though no expedition occurred.

**Evidence:** `docs/evidence/browser-playtest-2026-07-13/04-first-departure-town.jpg`.

**Acceptance**

- [ ] A fresh party gets a first-departure state with no return record.
- [ ] Return records appear only after an actual dungeon return.
- [ ] Expedition results summarize the expedition, not the last UI event.
- [ ] Japanese and English variants describe the same game state naturally.

## IMP-009: Verdant Portraits Read as Homogeneous AI Fantasy Art

**Priority:** P1
**Category:** `visual_mismatch`

The twelve Verdant portraits are technically complete but do not feel like an
authored cast. Most use the same attractive young face, three-quarter bust,
direct gaze, glossy skin, fine hair strands, dense green filigree, and fully
painted forest background. At party-rail size the detail collapses into noise;
at full size the repeated facial proportions and decorative pseudo-detail make
the generation process more visible than the character.

Several portraits also illustrate their basename too literally: `vial` holds a
vial, `map` holds a map, `grave` stands among graves, and `gate` wears a cage-like
emblem. These are prompt answers, not convincing lives or silhouettes.

**Art direction**

- Replace the current diffusion-painting finish with original hand-drawn line
  art and opaque gouache/cel-like color. Use classic DRPG character-design
  lessons without copying a particular game's characters or linework.
- Build forms from readable shape and two or three local colors. Reserve fine
  detail for one identity anchor; leave visual rest around the face.
- Use a simple pack-owned botanical vignette or flat value field instead of a
  complete environment. The portrait must remain legible at 48-96px.
- Keep material color in the image, but do not bake canopy light, green grading,
  fog, bloom, or a dramatic rim light into it.
- Design a cast, not twelve variants of one model: vary age, face shape, build,
  skin tone, grooming, posture, expression, social background, and degree of
  wear. Include ordinary, weathered, awkward, severe, and older faces.
- Express origin through wear, posture, repair, and one useful object. Do not
  turn the basename into a prop checklist or bind a portrait to one class.

**Production plan**

1. Create a one-page portrait style sheet: crop, eye line, line weight, face
   construction, edge hierarchy, palette limits, background treatment, and
   forbidden AI artifacts.
2. Retake `gate`, `vial`, and `cloak` as a pilot trio. They must prove three
   distinct ages/builds and three different silhouettes while still reading as
   one scenario pack.
3. Review the trio as a contact sheet at 512px, 96px, and 48px, then in the real
   guild selector and six-person party rail. Do not proceed on isolated-image
   approval alone.
4. Lock twelve short character briefs before generation. Each brief specifies
   silhouette, age range, demeanor, practical wear, palette accent, and one
   asymmetry; it does not prescribe a literal basename prop.
5. Retake all twelve portraits. Do not mix the current glossy set with the new
   drawn set, even when an individual old image appears acceptable.
6. Curate and edit each output for repeated faces, malformed hands/ears,
   meaningless straps and jewelry, pseudo-text, merged foliage, excessive hair
   noise, and inconsistent eye rendering.
7. Replace files under the existing `assets/portraits/<basename>.png` contract,
   rebuild, and capture Japanese/English guild and dungeon-party evidence.

**Acceptance**

- [ ] A blind contact-sheet review identifies twelve distinct people, not one
  face model with different costumes.
- [ ] The set contains meaningful age, build, face, skin-tone, and demeanor
  variation without reducing anyone to a stereotype.
- [ ] Each portrait reads at 48px by silhouette, face value, and one color
  accent; background detail does not compete with the head.
- [ ] No portrait depends on literal basename props, decorative pseudo-text,
  implausible jewelry, or unmotivated straps to communicate identity.
- [ ] All twelve share the approved hand-drawn line/color grammar and neutral
  material lighting; none look like a leftover from the current glossy set.
- [ ] Basenames, 512x512 dimensions, pack ownership, and fallback behavior stay
  unchanged.
- [ ] Browser evidence shows the pilot trio and final set in character creation,
  the 3+3 party rail, and the dungeon HUD before visual acceptance.

## Preserve These Working Behaviors

- Title presentation is mood-forward and has no normal-play debug controls.
- Verdant guild/town stills and portraits clearly differ from Default/Ash.
- The party is six members with visible 3+3 front/back grouping in the dungeon.
- `W` movement works, combat removes the minimap, and exact enemy HP is hidden.
- Combat command entry advances through all six members in formation order.
- Pack-local Verdant enemy basenames resolve to the new sprites.

## Verification

Run at minimum:

```sh
npm run test -- tests/artAssets.test.ts
npm run build
npm run selfplay:browser
npm run test:e2e -- tests/e2e/screenshot-review.spec.ts
```

Passing commands are necessary but not sufficient. Review 1280x720 screenshots
for focus truth, clipping, overlap, Japanese line layout, enemy grounding, and
scenario-specific structure. Record which item in this file and which past
trouble could recur before marking work complete.
