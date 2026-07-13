# Black Stela Active Improvement Backlog

Last browser review: 2026-07-14, Chromium, current worktree on `f6147b3`.
Evidence: `docs/evidence/browser-playtest-2026-07-14/README.md`.

This file contains only work that is not yet accepted. Completed slices from the
2026-07-13 review moved to
`docs/archive/Improve.completed-browser-slices-2026-07-14.md`.

## Review Baseline

- Use `1920x1080` as the primary desktop presentation target.
- Keep `1280x720` as the minimum no-overlap, no-scroll controller Gate. Do not
  design the whole combat presentation as if 720p were its ideal canvas.
- Verify through the normal title -> guild -> town -> dungeon -> combat route.
  Debug routes are diagnostic only; headless proves reachability only.
- A passing Playwright route is not visual acceptance. Enemy readability,
  Japanese layout, focus truth, and transition rhythm require screenshot review.
- Do not edit the same implementation files concurrently. Claude Code currently
  owns `IMP-008`; Codex is the visual verifier unless the user reassigns it.

## Active Status

| Item | Priority | State | Primary | Independent check |
| --- | --- | --- | --- | --- |
| `IMP-007` | P0 | Reopened: implementation landed, visual acceptance failed | Claude Code | Codex normal-route screenshots |
| `IMP-008` | P1 | In progress in the current uncommitted worktree | Claude Code | Codex first-departure and real-return review |
| `IMP-009` | P1 | Planned, not started | Codex | Claude pack/build check |
| `IMP-010` | P0 | Newly formalized from 2026-07-14 combat review | Claude Code | Codex flow and screenshot review |

## IMP-007: Enemy Staging Still Makes the Art Look Small

**Category:** `visual_mismatch`

The first pass improved horizontal spacing, contact shadows, and the distinction
between combat `elevation` and presentation-only `hover`. It did not make the
enemy art readable enough in combat.

At 1280x720, a Verdant group still reads as a small cluster at the far end of a
large corridor. At 1920x1080, the enemy stage grows to about 533px high, but a
single Ash Slime remains a modest central figure while the walls and empty floor
dominate the composition. More resolution currently creates more scenery, not a
stronger encounter presentation.

**Evidence**

- `docs/evidence/browser-playtest-2026-07-14/01-1280-enemy-scale.png`
- `docs/evidence/browser-playtest-2026-07-14/03-1920-combat-manual.png`
- Implementation handoff:
  `docs/handoff/2026-07-14-codex-to-claude-enemy-scale.md`

**Required change**

- Frame combat from measured sprite silhouettes, enemy size class, group count,
  and stage dimensions. Prefer combat camera/framing changes over changing
  enemy rules or pretending every small creature is physically huge.
- Use the extra 1080p height for the battlefield and enemy presentation. Do not
  leave enemies at the same relative distance while surrounding geometry grows.
- Compose one enemy, a mixed small pack, several large enemies, and a boss
  differently. Group count should change spread and depth, not globally shrink
  every sprite into one distant slot.
- Keep labels, state cues, target cursor, floor contact, and hover shadow tied to
  the measured feet/baseline. Do not expose exact enemy HP.
- Do not change `elevation`, encounter count, HP, reach, or initiative as a
  presentation fix.

**Acceptance**

- [ ] At 1920x1080, enemies are the first visual subject of combat, not a detail
  inside the corridor.
- [ ] At 1280x720, small silhouettes meet the handoff's 72-96px target and a
  normal group uses roughly 40-65% of stage width without clipping.
- [ ] Small, medium, large, and boss enemies remain visibly different in scale.
- [ ] Grounded and hovering baselines are unmistakable during target selection
  and hit playback.
- [ ] Normal-route Japanese screenshots pass; a debug-only composition does not.

## IMP-008: First Departure Must Not Read as a Return

**Category:** `localization_leak`, `wrong_state_copy`

Claude Code has an uncommitted implementation in progress. The focused E2E
currently passes, but the item remains active until browser evidence covers both
a fresh party and an actual return in Japanese and English.

**Acceptance**

- [ ] A fresh party gets a first-departure state with no return record, wounds,
  carried-goods report, or wording equivalent to "again".
- [ ] Return records appear only after an actual dungeon return.
- [ ] Expedition results summarize the expedition, not the last guild UI event.
- [ ] Japanese and English describe the same state naturally and fit their boxes.
- [ ] The implementation is committed or explicitly handed off before archive.

## IMP-009: Verdant Portraits Look Like One AI-Generated Cast

**Category:** `visual_mismatch`

The twelve portraits repeat a glossy three-quarter bust, similar young faces,
dense green detail, and literal basename props. At party-rail size their detail
collapses; at full size the repeated generation grammar is conspicuous.

**Production plan**

1. Define crop, eye line, line weight, palette, background treatment, and banned
   artifacts for hand-drawn line art with opaque gouache/cel-like color.
2. Retake `gate`, `vial`, and `cloak` as a pilot trio with distinct age, build,
   face, posture, and silhouette.
3. Review the trio at 512px, 96px, and 48px and in the actual guild and party UI.
4. Lock twelve short cast briefs, then replace all twelve portraits under the
   existing 512x512 pack basenames. Do not mix old and new styles.
5. Reject repeated faces, malformed anatomy, pseudo-text, meaningless straps,
   literal basename props, baked green grading, fog, bloom, and rim light.

**Acceptance**

- [ ] A blind contact sheet reads as twelve distinct people, not one model in
  different costumes.
- [ ] Age, build, face, skin tone, demeanor, wear, and social background vary
  without stereotypes.
- [ ] Every portrait reads at 48px through silhouette, face value, and one color
  accent; background detail does not compete with the head.
- [ ] All twelve share the approved drawn grammar and neutral material lighting.
- [ ] Basenames, dimensions, pack ownership, and fallback behavior are unchanged.
- [ ] Browser evidence covers character creation, the 3+3 party rail, and dungeon HUD.

## IMP-010: Combat Information and Victory Flow Are Not Coherent

**Categories:** `command_shift`, `visual_mismatch`, `transition_break`

The exact old overlap was not reproduced on current `f6147b3`, but the combat
surface still has no coherent information rhythm:

- The log is a large focusable history box that also acts like playback control.
- Auto inserts a separate status strip. At 1920x1080 this leaves a large unused
  void between the strip and the bottom dock instead of giving that space to the
  battlefield or a deliberate command state.
- `0/6 ready` remains visible during states where it does not explain the current
  action.
- Victory is not a reliable owned phase. The focused result E2E failed because
  `combat-result` never appeared, while Browser Self-Play still passed by seeing
  the dungeon command window and continuing. The captured route jumps from the
  battlefield to exploration with only a one-line reward message.

**Evidence**

- `docs/evidence/browser-playtest-2026-07-14/02-1280-abrupt-post-combat-resume.png`
- `docs/evidence/browser-playtest-2026-07-14/04-1920-combat-auto.png`
- Design/implementation handoff:
  `docs/handoff/2026-07-14-codex-to-claude-combat-flow.md`

**Required flow**

```text
command entry -> round playback -> final blow -> victory hold
-> result/rewards -> same-cell exploration resume
```

- Give current beat, brief recent context, and skip/advance one fixed information
  band. Move full history out of the live combat surface.
- Make Auto/Repeat a stable state of the reserved command region. Show mode,
  speed, progress, and Stop without inserting height or moving focus.
- Model victory/result as an explicit game-flow state, not a React-local overlay
  discovered by rescanning historical logs after exploration has resumed.
- Stop automation before victory. One focused Continue returns to the exact cell
  and facing; its keypress must not leak into dungeon movement.

**Acceptance**

- [ ] At 1920x1080 the extra height strengthens stage composition; it does not
  become an unexplained gap between Auto status and the command dock.
- [ ] At 1280x720 manual, Repeat, Auto, and fast Auto never overlap, scroll, or
  move the stage, party strip, message band, command region, or dock.
- [ ] The current message is obvious and historical lines are not a focus stop.
- [ ] Final blow, victory hold, result, and exploration resume occur once and in order.
- [ ] Result shows rewards/level-ups and owns one controller-focused Continue.
- [ ] Continue restores dungeon focus without also moving or activating a command.
- [ ] Japanese copy has no one-character orphan and does not resize the regions.
- [ ] Browser Self-Play fails if the result phase is absent; helper tolerance may
  not silently convert an abrupt return to exploration into success.

## Verification

Run at minimum after the relevant implementation slice:

```sh
npm run build
npm run test
npm run test:e2e -- tests/e2e/controller-route.spec.ts
npm run test:e2e -- tests/e2e/combat-stage.spec.ts
npm run test:e2e -- tests/e2e/combat-regression.spec.ts
npm run selfplay:browser
```

Passing commands are necessary but not sufficient. Record 1920x1080 primary
screens and 1280x720 minimum-Gate screens, Japanese layout, exact focus, and the
past trouble most likely to recur before marking an item complete.
