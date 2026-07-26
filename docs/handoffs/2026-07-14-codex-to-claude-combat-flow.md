# Handoff to Claude Code - IMP-010 Combat Log, Tempo Layout, and Victory Flow

## Verdict

The combat UI still has two separate failures:

1. The log, tempo/auto status, and command surfaces compete for the same vertical
   space. In the reported state the tempo strip overlaps the combat log.
2. Victory feels discontinuous: the fight ends, a result overlay appears, and
   dismissal exposes exploration with almost no connective state or focus handoff.

The screenshot badge reads `ad4287b`. Restart the dev server and reproduce on
the current commit first. Even if the exact overlap is stale, the current
component/state structure still permits both classes of failure.

## Root Cause in the Current Structure

- `CombatCockpit` renders `cockpit-message`, then an optional `tempo` node, then
  the fixed command zone. Tempo is an extra layout row that exists only while
  automation runs; it is not part of the fixed combat budget.
- `CombatLog` is a focusable button containing a scrolling list. It mixes three
  jobs: current combat message, historical record, and skip/advance control.
  The player cannot tell whether it is information, a command, or both.
- Victory is not an explicit game-flow state. `App.tsx` scans `state.log` for a
  new `combat_rewards` event in an effect and opens a React-local result overlay.
  By that point the rules state can already be back in exploration. The result
  is visually layered over the next phase instead of being a phase itself.

## Slice A - Combat Message and Tempo Layout

1. Define one fixed combat information band. It owns the current beat, at most
   two recent lines, and a clear reveal/skip affordance only while playback can
   actually be advanced.
2. Move detailed history out of the live combat surface. Keep it in replay or
   records data if needed; do not make a six-line scroll box the primary message.
3. Replace the inserted tempo row with a stable state of the command region.
   While Auto/Repeat runs, the same reserved command box shows:
   `Auto/Repeat`, speed, round/step, and Stop. It must not add height.
4. Do not show meaningless `0/6 orders` while a round is resolving. The message
   band should state the active beat or the automation state, not stale input
   progress.
5. Keep Stop immediately reachable by controller. Any button press may interrupt
   auto as already required, but the focused control must not jump when text
   changes.

## Slice B - Explicit Combat Conclusion Flow

Model the end of combat as explicit states rather than a log-watching overlay:

```text
command entry
  -> round playback
  -> final blow / victory hold
  -> result and rewards
  -> exploration resume
```

Required behavior:

1. The final blow completes on the battlefield. Defeated enemies disappear or
   settle before the result replaces the combat controls.
2. A short victory hold presents one concise victory cue. It may be time-bounded
   but must also remain deterministic under instant-log and fast tempo modes.
3. Result is an owned phase/subphase with rewards, level-ups, and one focused
   Continue command. Do not derive it by rescanning historical log entries.
4. Auto/Repeat stops before victory/result. It cannot dismiss the result or move
   the party after combat.
5. Confirming the result returns to the exact dungeon cell and facing. The first
   exploration frame restores the dungeon command focus and displays one concise
   return message; the same Enter press must not trigger movement or another
   command behind the result.
6. Preserve all result data in the domain/replay event stream. The UI phase must
   not become the source of reward truth.

## Presentation Direction

- Keep the battlefield visible behind the victory hold so the win has continuity.
- The result may replace the command/message area or use a restrained modal, but
  it must not look like an unrelated web dialog dropped over exploration.
- Exploration should resume from the same visual composition, with surviving
  party HP/status already updated. Avoid a black-frame cut unless loading is real.
- Use motion sparingly: 150-250ms fades for enemy/result surfaces are enough.
  Controller response and reduced-motion behavior take priority.

## Blocking Acceptance at 1280x720

- [ ] Log, tempo status, command menu, and dock never overlap in manual, Repeat,
  Auto normal-speed, or Auto fast-speed states.
- [ ] Starting/stopping Auto does not change enemy-stage, party-strip, message,
  or command-region bounding boxes.
- [ ] The live message has one obvious current line; historical lines cannot
  obscure it or become an unexplained focus stop.
- [ ] The final damaging beat is visible before result presentation.
- [ ] Result appears exactly once and cannot be skipped by the automation timer.
- [ ] Continue returns to the same dungeon cell/facing with dungeon focus restored.
- [ ] The Continue keypress cannot leak through and move or activate exploration.
- [ ] Japanese copy fits without one-character orphan lines or command movement.
- [ ] Reduced-motion mode preserves the same ordered states without animation.

## Browser Evidence

Capture these normal-route states at exactly 1280x720:

1. Manual command entry.
2. Third or later beat of a round with multiple log lines.
3. Auto normal and Auto fast, including Stop focus.
4. Final blow.
5. Victory hold.
6. Result with and without a level-up.
7. First exploration frame after Continue.

Record bounding boxes for enemy stage, party strip, message band, command region,
and dock in states 1-3. They must remain stable.

## Required Tests

- E2E: tempo start/stop does not change the five combat-region bounds.
- E2E: three or more beats never overlap the command region.
- E2E: final blow -> result -> exploration occurs in order using only Confirm.
- E2E: one Confirm dismisses result but performs no dungeon action.
- E2E: auto victory stops automation and leaves result focused.
- Unit/domain: combat conclusion state carries rewards once and resumes the exact
  dungeon position/facing.

Run at minimum:

```sh
npm run test:e2e -- tests/e2e/combat-stage.spec.ts
npm run test:e2e -- tests/e2e/combat-regression.spec.ts
npm run test:e2e -- tests/e2e/keyboard-combat.spec.ts
npm run gate:final
npm run build
```

## Suggested Claude Code Prompt

```text
Read AGENTS.md, Improve.md, this handoff, and the combat/browser Gates. Implement
only IMP-010 before IMP-011. Implement the combat-log/tempo layout fix and
explicit victory-result-resume flow without changing combat rewards or encounter
balance. Keep all combat regions stable at
1280x720, make Result an owned state rather than a log-watching overlay, and
prove final blow -> result -> same-cell exploration through controller-only E2E.
Report changed files, state transitions, bounding-box evidence, tests, and any
remaining reduced-motion or localization risk. Leave visual acceptance to Codex.
```
