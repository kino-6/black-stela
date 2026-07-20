# Godot Migration And Runtime Comparison Plan

Status: Proposed

## Goal

Determine whether Black Stela should move its player-facing runtime from
React/Three.js/Tauri to Godot 4.7.1, or to a TypeScript-native Babylon.js
runtime, without discarding deterministic rules, external world packs, save
compatibility, simulation, or regression evidence.

The migration is successful only if it reduces the recurring cost of making the
game feel like a controller-first DRPG. A different engine is not success by
itself.

## Verified Baseline

- The installed executable is `4.7.1.stable.official.a13da4feb`, not Godot 5.
- Godot 4.7 provides `Control` focus navigation and `InputMap` actions for
  keyboard and gamepad input.
- The installed build is the standard GDScript build. No .NET editor is
  installed.
- Godot 4 C# projects cannot currently export to Web. Retaining browser delivery
  therefore favors GDScript unless the product explicitly becomes desktop-only.
- The current repository has substantial reusable value: external world packs,
  deterministic `GameState` transitions, save migrations, simulation, and a
  large unit/E2E regression suite.

## Candidate Decision

The investigation leaves two serious candidates:

| Candidate | Reason to retain | Main cost |
| --- | --- | --- |
| Godot 4.7.1 + GDScript | Integrated 2D/3D scenes, controller focus, transitions, animation, audio, and asset workflow directly address the recurring game-UI problems. | Runtime rules must eventually be ported and parity-proven against TypeScript. |
| Babylon.js + TypeScript | Reuses the rules, schemas, tests, Web delivery, and language while replacing React/DOM normal play with one 3D scene and game GUI. | RPG focus navigation, scene policy, and command-window behavior remain project-owned. |

Godot is the leading product-runtime candidate because the current failures are
concentrated in presentation composition, controller flow, transitions, and
asset staging. Babylon.js is the required control experiment because it tests
whether removing React, while retaining TypeScript, achieves comparable quality
at substantially lower migration cost.

The following are not primary spike candidates:

- Phaser is a strong TypeScript 2D framework, but keeping the current 3D dungeon
  would require a second renderer or a deliberate move to 2D/pseudo-3D.
- PixiJS is primarily a renderer; scene lifecycle, focus navigation, and game UI
  policy would still be hand-built.
- Defold provides compact native/Web builds and gamepad input, but requires a Lua
  rewrite without a clear advantage over Godot for this UI-heavy 2D/3D DRPG.
- Unity provides mature game tooling, but a C# rewrite and heavier project
  workflow add cost without solving a requirement Godot cannot meet here.
- Bevy and Unreal are excluded because their complexity and UI workflow are
  disproportionate to this game.

## Product Invariants

- Six-person, 3+3 formation and controller-first confirm/cancel navigation remain
  blocking rules.
- Default and Verdant remain external, replaceable world packs rather than
  engine scenes containing scenario truth.
- The dungeon view, minimap, movement, doors, stairs, traps, and encounters
  continue to derive from one grid model.
- Player-authored portraits and profiles remain portable and visible in guild,
  party, event, and combat framing.
- Japanese line layout, hidden local AI, deterministic rules, and versioned saves
  survive the runtime change.
- Headless state reachability remains separate from visual and controller proof.

## Non-Goals

- Do not rewrite the full game before the comparison Gate.
- Do not add new gameplay systems during the spike.
- Do not expand the comparison beyond Godot and Babylon.js without a new
  product constraint that disqualifies both.
- Do not maintain a permanent TypeScript-to-Godot runtime bridge unless the
  spike proves that its operational cost is lower than a rules port.
- Do not adopt development snapshots or hypothetical Godot 5 APIs.
- Do not call a reskinned web layout a successful migration.

## Proposed Boundary

### Reuse unchanged

- `content/worlds/<id>/` source packs and asset contracts.
- Canonical command, event, save, and normalized world-data schemas.
- TypeScript simulation, content validation, and balance reports.
- Existing browser screenshots and traces as before/after evidence.

### Introduce

- A build-time TypeScript exporter that converts validated world packs into
  versioned JSON consumed by both spikes. Godot does not become a second
  Markdown/YAML parser with subtly different rules.
- A Godot project under `godot/` and a bounded Babylon.js comparator under
  `spikes/babylon/`, both isolated from the production runtime during evaluation.
- Scene roots for Boot, Title, Town, Guild, Dungeon, Combat, Result, Camp, and
  Configuration, with shared theme and transition layers.
- Named input actions for movement, focus, confirm, cancel, menu, actor cycling,
  target cycling, Repeat, Auto, and Auto interruption.
- A deterministic trace fixture containing initial state, commands, events, and
  expected state hashes so Godot behavior can be compared with the TS oracle.

### Language decision

- Use GDScript for the spike because the installed standard editor supports it
  and it preserves the option of Web export.
- Reconsider C# only if desktop-only distribution is approved and the .NET
  editor/toolchain is installed deliberately.
- Do not depend on unofficial TypeScript bindings for the product runtime.

## Migration Phases

### Phase 0: Freeze the comparison contract

1. Record the current command, event, normalized world, portrait, and save DTOs.
2. Export deterministic fixtures for title, town, B1F movement, one normal
   encounter, victory, result, return, and recovery.
3. Capture current 1920x1080 primary and 1280x720 compact evidence.
4. Freeze unrelated feature work on the selected comparison route.

Exit: the same player route, data, and expected outcomes can be replayed without
reading React component state.

### Phase 1: Build equivalent presentation spikes

1. In Godot, create the project, theme, viewport policy, input map, focus cursor,
   and transition layer.
2. In Babylon.js, create an equivalent non-React scene, fullscreen game GUI,
   named input actions, focus cursor, and transition state machine.
3. Load the same normalized Default and Verdant JSON and existing assets in both.
4. Implement Title -> Town -> Dungeon -> Combat -> Result -> Dungeon -> Town.
5. Drive both slices from the same deterministic fixtures; do not port the full
   rules to Godot yet or give Babylon access to hidden React state.
6. Show six-member 3+3 formation, current-cell dungeon actions, readable enemy
   staging, and stable command/message regions.

Exit: both routes are playable without mouse input and expose the real
differences in visual composition, input, asset workflow, transition quality,
implementation size, and adjustment cost.

### Phase 2: Go/No-Go Gate

Approve migration only when all of the following are true:

- Controller-only traversal completes with confirm, cancel, directional focus,
  actor/target cycling, and no pointer dependency.
- At 1920x1080 and 1280x720, enemies, portraits, vitals, messages, and commands do
  not overlap or leave the viewport.
- Town reads as a preparation location, dungeon commands are contextual, and
  combat keeps enemy and 3+3 formation context visible.
- Combat victory, result, exploration resume, and return form one continuous
  presentation rather than abrupt app-like page changes.
- Default and Verdant use the same scene code with different data and assets.
- The selected slice is materially easier to adjust than the current React
  surfaces; the review identifies specific simplifications and compares the
  Godot and Babylon implementations rather than relying on engine reputation.

Select Godot when its scene, focus, transition, and asset workflow produces
materially better results that justify a rules port. Select Babylon.js when it
reaches comparable player-facing quality while retaining the TS rules and tests.
Reject or pause migration if both merely reproduce the same dashboard, card
catalog, button toolbar, or focus problems in a different renderer.

### Phase 3: Port one real vertical slice

1. For Godot, port the minimum command/state rules needed by the spike. For
   Babylon.js, connect the existing rules through a narrow runtime adapter.
2. Compare every resulting event and state hash against the frozen TS fixtures.
3. Load and save through the versioned DTO without destroying TS saves.
4. Add selected-runtime rule, scripted input, and screenshot tests.
5. If Godot wins, keep TS as the oracle until the slice has parity. If Babylon
   wins, prove the adapter does not fork or duplicate domain rules.

Exit: one real expedition loop runs through the selected runtime with
deterministic parity and no duplicate source of gameplay truth.

### Phase 4: Incremental production migration

Migrate in dependency order:

1. Boot, title, configuration, save selection.
2. Town return loop and core services.
3. Guild creation, roster, party, and equipment.
4. Dungeon grid, minimap, current-cell actions, and event presentation.
5. Combat command entry, resolution playback, Auto/Repeat, and results.
6. Remaining services, progression, records, quests, appraisal, and forging.
7. Local narration adapter and debug/developer tooling.

Each slice must keep schema parity, controller evidence, Japanese review, and
the relevant Past Trouble Gate. The React runtime remains runnable until the
selected replacement route passes.

### Phase 5: Cutover

1. Run save migration and Default/Verdant content parity suites.
2. Complete native desktop packaging and selected-runtime Web export checks.
3. Archive the React player runtime only after the replacement route covers
   every normal-play surface.
4. Retain TypeScript authoring, simulation, and validation tools when they still
   provide value; remove only duplicated runtime code.
5. Record the final engine and language decision in an ADR.

## Verification Strategy

- **Rules:** golden command/event/state traces shared between TS and the
  selected runtime.
- **Content:** one normalized manifest and asset audit per world pack.
- **Input:** scripted Godot `InputEventAction` or browser keyboard/gamepad routes,
  plus physical controller smoke for the selected runtime.
- **Visual:** fixed-state screenshots at 1920x1080 and 1280x720, reviewed for
  composition rather than viewport fit alone.
- **Saves:** round-trip and migration fixtures across both runtimes during the
  transition.
- **Normal route:** title -> party -> dungeon -> combat -> stairs/return -> town
  using only player-visible controls.

## Risks

| Risk | Mitigation |
| --- | --- |
| Full rules rewrite introduces semantic drift | Keep TS as oracle and compare state hashes per command. |
| Two runtimes double maintenance | Time-box the spike and forbid indefinite bridge architecture. |
| A new runtime repeats web composition mistakes | Gate on scene composition and controller flow, not engine adoption. |
| External packs become engine-specific | Compile to versioned JSON; keep authored source outside Godot scenes. |
| Save compatibility breaks | Freeze DTOs first and keep bidirectional fixtures until cutover. |
| Web delivery is lost accidentally | Keep both spikes Web-capable; make C# or desktop-only adoption an explicit product decision. |
| Concurrent feature work invalidates comparison | Freeze the selected vertical slice during the spike. |
| The engine comparison becomes a second project | Share one fixture and route, prohibit feature work, and stop both spikes at the Go/No-Go Gate. |

## Decisions Required Before Phase 3

1. Does Godot or Babylon.js pass the comparison Gate, or should migration stop?
2. Is browser delivery a supported product target after migration, or is the
   product desktop-first only?
3. If Godot wins, is the production rules language GDScript, or is desktop-only
   important enough to install Godot .NET and evaluate C#?
4. Which current screen is the visual reference for the spike, and which
   defects must disappear rather than be carried forward?
5. After the Gate, who owns the selected runtime while TypeScript simulation
   and content tooling continue?

## Official References

- [Godot 4.7 keyboard/controller navigation and focus](https://docs.godotengine.org/en/4.7/tutorials/ui/gui_navigation.html)
- [Godot 4.7 scripting languages](https://docs.godotengine.org/en/4.7/getting_started/step_by_step/scripting_languages.html)
- [Godot 4.7 Web platform documentation](https://docs.godotengine.org/en/4.7/tutorials/platform/web/index.html)
- [Godot 4 Web export and C# limitation](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html)
- [Babylon.js fullscreen game GUI](https://doc.babylonjs.com/features/featuresDeepDive/gui/gui)
- [Babylon.js gamepad input](https://doc.babylonjs.com/features/featuresDeepDive/input/gamepads)
- [Phaser TypeScript game framework](https://github.com/phaserjs/phaser)
- [Defold GUI manual](https://defold.com/manuals/gui/)
- [Defold gamepad manual](https://defold.com/manuals/input-gamepads/)
