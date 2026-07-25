# Black Stela Active Improvement Backlog

Last browser review: 2026-07-18, Chromium. Primary review at 1280x720;
career presentation also checked at 1920x1080.

## 2026-07-25 — Verdant 3-minute playtest (verdict: "not properly playable")

A human played the real **Godot** build for ~3 minutes and found 21 player-facing
defects that **every green gate missed**. Record:
`docs/reviews/2026-07-25-verdant-3min-playtest.md`. Mechanism to stop the repeat:
`docs/gates/played-build-gate.md`. Most findings were **already reproduced and
unfixed** (`IMP-024..029`) while advanced content shipped on top.

**Process rules now in force** (from `played-build-gate.md`):
- **P1** player-facing work is not done without `gate:play` green **and** visual
  acceptance by the other agent on the real Godot build; "V blocked/pending" is
  not a done state.
- **P2** while any reproduced core-loop/feel defect is open, no advanced-content
  slice may be marked complete — base playability first.
- **P3** every hand-found defect earns a regression lock **and**, if a gate should
  have caught it, the missing gate.

New numbered items from this playtest: `IMP-030..IMP-054` (below). `IMP-024`,
`IMP-025`, `IMP-026`, `IMP-028`, `IMP-029` were **re-confirmed by live play** and
are now under the P2 priority guard. `IMP-030/031/032/033/034/038/040/044` are
**done and archived** — [completion record](docs/archive/Improve.completed-imp-030-044-2026-07-25.md).

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
| `IMP-025` | P2 | Done | `town.gd` is a two-level hub: a status ledger over four peer destinations (ギルド館・市場通り・記録の間・施療院) plus the separated 迷宮に入る; each location holds its services one step in. Cursor starts on the descent; Cancel resolves one step. Locked by `verify_town_controller.gd`. |
| `IMP-026` | P2 | Done | The dungeon dock holds only current-cell actions (探索・聞く・全体図・隊列, plus stairs/return/disarm only when the cell offers them); movement/turn/strafe are owned by the arrow keys (`dungeon.gd _input` consumes them), never buttons. Locked by `verify_dungeon_controller.gd`. |
| `IMP-027` | P1 | Done (not reproducible in Godot) | The React root cause (persisted town service-mode + a direct 6/6-guild departure) does not exist in the Godot build: every transition rebuilds the scene, the town forces `phase="town"` on entry and always starts on the square (`_service=""`, cursor on 迷宮に入る), and the only descent path is from the square. Locked by `verify_return_loop.gd` (return preserves the party + lands on the town loop from any incoming phase). |
| `IMP-028` | P1 | Reproduced | Character creation remains a scrolling card catalog and stat-entry form rather than a focused adventurer-making flow. |
| `IMP-029` | High | Done | The chamber-fight → grounded chest → investigate/disarm/open loop is ported to Godot: `rules/chests.gd` (one attempt each, outcome fixed per chest, trap springs but never destroys the reward), `dungeon/chest_panel.gd` (the chest holds the cell, stops auto/movement). Parity-locked (`b2f-chest`/`b3f-disarm`/`b1f-trap`/`b3f-gather` traces), UI-locked (ux-parity `dungeon-chest`, 4 states), and every fight room is seated in an open 玄室 hall (`verify_verdant_chambers.gd`). |
| `IMP-035` | P2 | Done | The 能力 (bonus) step in `guild.gd` renders each aptitude's effect (`partyMenu.aptitudeEffect.*`, the same words the party menu shows), so a point's effect is visible before spending it. Locked by `verify_guild_controller.gd` (fails if any aptitude effect is missing). |
| `IMP-036` | P2 | Done (#15) | The enemy stage now lays each world's `ui/combat-vignette.jpg` environment backdrop, tinted by `world.palette` (ambient/fog) — Ash reads an ash pit, Verdant a canopy, neither pure FC-black. Delivered by the Codex #15 palette work; rendered evidence for both worlds. |
| `IMP-037` | P2 | Done | Dungeon lighting (ambient colour/energy, fog colour/density, torch colour/range) is now driven by `world.palette` (`dungeon.gd` env setup) — Verdant renders a green/lush corridor, Ash a dark pit, neither pitch-black. Rendered evidence for Verdant. Granularity is per-world (scenario-authored); the same palette hook extends to per-floor if a floor ever needs its own. |
| `IMP-039` | P2 | Done | Creation polish complete: `guild_draft.gd` gives 顔 / 来歴 / 気質 each their own reroll seed (`reroll_face` on a `faceSeed`), so a face is a player choice decoupled from the origin, and 名前 / 二つ名 / 覚え書き reroll per field (`_reroll_field`). Shipped in `8d1ebc6` (#6). |
| `IMP-041` | P3 | Confirmed intended (feel open) | First-contact encounters go silent per floor visit; make density/respawn scenario-authored rather than fixed. |
| `IMP-042` | P1 | Done | Global party-status glance (`status_overlay.gd` autoload, hotkey **C**) opens read-only from ANY scene, pauses the scene beneath, hands the cursor to a controller, and refuses to open with no party. Locked by `verify_status_overlay.gd` (`gate:migration`). The old "720p fit of the town rows" clause is moot — Godot is 1920-only (go-no-go); the overlay was real-render verified at capture res. |
| `IMP-043` | P1 | Done | `gate:ux-parity` title now passes (9 keys over 2 states, evidence present) and the whole `gate:migration` chain is green (22/22) and watched. The product call resolved as EN runtime support shipped (en pack exported, `verify_i18n_locale` green) with ja the default. |
| `IMP-045` | P1 | Partly done (gate debt) | `verify_dungeon_controller` now drives the real dungeon scene for #13 (Esc) and #17 (held repeat); the remaining gap is #3's loot-delta on the real scene/input path (town-side, not yet gate-driven). |
| `IMP-046` | P1 | Partly done (flag fix + gate) | `-- --debug-mode` now mounts the panel (get_cmdline_user_args) and `gate:debug-start` proves it. Remaining: named QA fixture starts (open_corridor / map_modal / combat_victory / return_ready / loot_delta / shop_description), in-mode diagnostics, and action-trace replay. |
| `IMP-047` | P1 | Partly done (title fixed) | title.gd loads the backdrop as an imported resource (export-safe) with `gate:title-asset`. Remaining: the same `_texture` pattern in town.gd/dungeon.gd, and a real packaged-export `gate:package-smoke`. |
| `IMP-048` | P2 | Done | `verify_scenario_picker.gd` now locks the full contract: initial focus on a card, the select/confirm/back legend, ≥2 navigable cards, Down/Up moving the selection, a focusable 戻る, and Confirm recording the chosen world (advances to that world's guild). Cancel→戻る is wired in `_unhandled_input`. The 1280×720 clause is moot — Godot is 1920-only (go-no-go). |
| `IMP-049` | P1 | Approved gate design | Verification is either too weak (hand-picked headless checks) or too expensive (full E2E per edit). Add a scoped, executable change gate that runs fast affected checks by default and escalates native/full routes only for defined risk. |
| `IMP-050` | P1 | Proposed refactor — after active rule fixes land | `slice_rules.gd` is a 1,235-line dispatcher plus exploration, expedition, party lifecycle, item, and grid helpers. Split cohesive pure command handlers while preserving TS parity. |
| `IMP-051` | P2 | Proposed refactor — defer while dungeon UX is active | `dungeon.gd` is a 1,095-line scene that owns rendering, assets, HUD, modal UI, input repeat, rule dispatch, and scene handoff. Give it a thin scene spine with renderer/HUD/input collaborators. |
| `IMP-052` | P2 | Proposed refactor — defer while combat presentation is active | `combat.gd` is a 1,037-line scene that owns command flow, stage layout, party vitals, animation playback, assets, and result handoff. Extract presentation collaborators without moving combat truth out of `CombatRound`. |
| `IMP-053` | P1 | Proposed refactor; coordinate with IMP-047 | Title, town, guild, dungeon, combat, and result duplicate dynamic JSON/image/asset-path loading. Divergent world-id and export behavior is already observable; centralize the runtime resource boundary. |
| `IMP-054` | P1 | Proposed refactor; prerequisite for IMP-046/049 | Scene captures rely on scattered `set_state_override`/`set_ui_state` seams and direct fixture loading. Make named fixtures and native-route observation one test harness so gate evidence describes the screen actually exercised. |

## IMP-046: Make QA Debug Starts Reproducible And Observable

**Category:** Native Godot QA / debug tooling

**Evidence:** On 2026-07-25 Codex launched the documented command
`godot --path godot/ -- --debug-mode`, then sent F12 in the visible title
screen. No debug overlay appeared. `debug_overlay.gd` tests only
`OS.get_cmdline_args()` for `--debug-mode` / `--debug-panel`; arguments after
`--` must be read through `OS.get_cmdline_user_args()`. Further, F12 can only
toggle an overlay that Boot has already mounted, so it cannot rescue a failed
debug-start flag.

**Why this matters:** a human found 21 problems in three minutes partly because
the other agent cannot quickly and repeatably inspect the dangerous states in
the native build. A QA shortcut must use the same `Run` and scene code as play,
but it must also be reliably launchable and leave no control in normal play.

### Implementation Slices

- [ ] Recognize debug flags from both engine and user argument arrays; keep the
  overlay absent in a normal launch and document one canonical command.
- [ ] Add deterministic, named QA starts for `open_corridor`, `map_modal`,
  `combat_victory`, `return_ready`, `loot_delta`, and `shop_description`.
  Fixtures may seed a known state, but actions from that state must dispatch
  through the same `Run` commands and scenes as normal play.
- [ ] In debug mode only, show current scene, phase, state hash, focused
  control, and the most recent input actions. On a script error, persist this
  short trace and a screenshot beside the test artifact.
- [ ] Keep raw state ids, force-victory, and fixture controls out of normal
  play; this is a developer tool, not a player-facing menu.

### Acceptance / Gate

- [ ] `gate:debug-start` launches the native Godot executable with
  `-- --debug-mode`, proves the overlay Control exists, and proves it is absent
  without that flag.
- [ ] Every named QA start renders its target scene and can take one real
  player action without a `SCRIPT ERROR`.
- [ ] A recorded action trace can be replayed to reproduce the same scene,
  phase, and state hash. This is diagnostic evidence, not a substitute for the
  title-to-town normal route.

**Past trouble likely to recur:** a green headless fixture being described as
real play; defects that only appear on scene handoff or held input; debug
controls leaking into normal UI.

## IMP-047: Verify Player-Facing Assets In the Exported Build

**Category:** Packaging / native presentation gate

**Evidence:** The native Godot title launch on 2026-07-25 printed:

```text
WARNING: Loaded resource as image file, this will not work on export:
'res://assets/worlds/default/title/black-stela-title.jpg'.
```

`title.gd:_texture()` currently uses `Image.load_from_file()` on a dynamic
`res://` path. The source checkout displays the image, so a development
screenshot cannot establish that the exported application contains it.

**Player outcome:** the shipped macOS/Web title keeps its authored background
and starts without missing-resource warnings; a release cannot silently turn
the opening screen into a black or fallback panel.

### Implementation Slices

- [ ] Resolve world title art as an imported `Texture2D`/exported resource (or
  explicitly register dynamic assets in the export contract), rather than an
  image-file path that Godot excludes from the package.
- [ ] Make missing mandatory title art a visible development failure, not a
  silent null texture fallback.
- [ ] Preserve scenario-specific title art; do not solve this by hardcoding the
  Default world into the title scene.

### Acceptance / Gate

- [ ] `gate:package-smoke` builds the macOS and Web artifacts, starts each
  exported artifact at the title, and fails on missing-resource/export warnings
  or `SCRIPT ERROR` output.
- [ ] The exported title has a non-null background texture in the actual scene
  (and screenshot evidence shows the authored image, not merely a file on disk).
- [ ] Run the smoke after `npm run package`, not only against `godot/` in the
  source tree.

**Past trouble likely to recur:** source-tree screenshots being mistaken for
evidence of the shipped artifact; player-facing assets becoming invisible in a
release without changing any deterministic state hash.

## IMP-048: Teach the First Scenario Choice Through the Screen Itself

**Category:** First-play controller UX

**Evidence:** In native play on 2026-07-25, title → `新たな探索` opened the
scenario picker. The selected scenario has a gold border and Enter works, but
the screen does not display the title screen's `↑↓ 選択・Enter 決定・Esc 戻る`
legend. A first-time player is asked to choose a world without seeing how to
choose, confirm, or return.

**Player outcome:** every first decision visibly explains its controller/keyboard
contract without reading a manual or guessing from an earlier screen.

### Implementation Slices

- [ ] Add a compact, fixed legend for selection, confirm, and cancel to the
  scenario picker; it must not compete with the world descriptions.
- [ ] Keep a focusable initial scenario and make Esc return exactly one level to
  the title.
- [ ] Use the same component or contract as other staged first-play choices so
  a later screen cannot silently omit its interaction help.

### Acceptance / Gate

- [ ] Native controller test: initial focus is on an enabled scenario; Down/Up
  changes selection; Confirm advances; Cancel returns to title.
- [ ] Screen contract: the picker renders an in-world select/confirm/cancel
  legend at 1280x720 and it is not clipped or obscured.

**Past trouble likely to recur:** keyboard support existing in code but being
invisible to a first-time player; controller gates proving action dispatch while
missing the player-facing affordance.

## IMP-049: Add a Scoped Change Gate Instead of Requiring Full E2E Per Edit

**Category:** Developer workflow / regression prevention

**Decision:** player-facing work must have an executable self-check before it is
reported ready, but full title-to-town E2E is reserved for integration risk and
merge. This avoids both failure modes seen in this project: a cheap gate that
never reaches the broken behavior, and a slow gate that agents defer or bypass.
The policy belongs in a versioned script and manifest, not in a Claude prompt
or a self-reported checklist.

**Why this matters:** the existing fast gates are useful components
(`gate:play`, controller and focused `verify_*.gd` scripts), but they are not
selected consistently by the changed player contract. Conversely,
`gate:migration` is a broad chain and full normal-route E2E is disproportionate
for a localized dungeon input or scenario-picker change. A predictable local
gate gives Claude a fast, honest stop condition while preserving stronger
coverage where a local test cannot be trusted.

### Implementation Slices

- [ ] Add a versioned impact manifest (for example
  `godot/gates/change-impact.json`) that maps task scopes and high-risk files to
  required checks. Initial scopes: `dungeon`, `combat`, `town`, `guild`,
  `scenario-picker`, `content`, `save`, `package`, and `docs`.
- [ ] Add `npm run gate:changed -- --scope <scope>`. It must print the selected
  contract, commands run, commands deliberately not run, and exit non-zero when
  any required command fails. A shared dirty worktree must not silently make an
  agent claim another agent's files; the task explicitly names its owned scope.
- [ ] Define three levels:
  1. **Fast (always):** diff check, compile/shell, and the relevant deterministic
     validator or focused test.
  2. **Affected (player-facing Godot change):** relevant `verify_*.gd`,
     `gate:play`/controller checks, and an exact screen/state assertion.
  3. **Native slice:** only when input, modal, scene handoff, or rendering is
     touched; launch one named debug fixture and prove one real action, expected
     screen/state, and zero `SCRIPT ERROR` output.
- [ ] Escalate automatically to the full normal-route E2E and independent visual
  review when a change touches `scene_manager.gd`, `run_state.gd`, save/schema,
  `input_actions.gd`, common UI kit, package/export, cross-scene transition, or
  an `IMP` P0/P1 regression. Run the same full route before merge even if no
  single trigger fired.
- [ ] Keep `gate:play`'s current pure rules contract explicitly named as such;
  do not describe it as native interaction proof. `IMP-045` owns the native
  route extension.

### Example Contracts

| Scope | Fast + affected checks | Native slice | Full-route escalation |
| --- | --- | --- | --- |
| `dungeon` | shell, played-loop, dungeon-controller, controller coverage | `open_corridor`: hold forward; assert repeat and stop conditions | input map, return/combat/result handoff, P0/P1 item |
| `scenario-picker` | shell + picker/controller contract | selected scenario → Confirm; Esc → title | shared UI kit or first-play route changes |
| `content` | export pack + schema/topology/content validators | only if its player-facing renderer changed | save schema, generated asset/export contract |
| `docs` | diff check | none | none |

### Acceptance / Gate

- [ ] A player-facing task cannot be reported ready without one successful
  `gate:changed` result and its scope in the handoff.
- [ ] The gate fails if the named scope has no mapping, a required command is
  skipped, or a declared high-risk file lacks a full-route requirement.
- [ ] A normal dungeon input edit completes fast + affected + one native slice
  without running full E2E; a `SceneManager` or save edit demonstrably requests
  the full route.
- [ ] Handoff format is machine-readable enough to audit: scope, player
  contract, commands, result, native evidence path if required, and why full
  E2E was or was not selected.

**Past trouble likely to recur:** headless rules proof being called real play;
agents skipping slow verification; controller/input regressions hidden until a
human plays; a broad, permanently red gate being ignored rather than repaired.

## IMP-050: Split the Pure Command Dispatcher by Gameplay Boundary

**Category:** Rules architecture / parity safety

**Evidence:** `godot/scripts/rules/slice_rules.gd` is 1,235 lines. Its public
`resolve()` dispatcher is correctly central, but the same file also implements
dungeon exploration and grid queries, stairs/return/checkpoints, party roster
lifecycle, debug commands, item use, and low-level collection helpers. This is
already larger than `combat_round.gd`, despite several command families having
their own modules (`Economy`, `Loot`, `Quests`, `Vocations`, `Chests`).

**Decision:** retain one thin `SliceRules.resolve()` entry point and the exact
`{ state, events }` contract. Extract handlers verbatim into leaf modules; do
not alter command ordering, random seeds, event text, or dictionary shape as
part of this refactor.

### Implementation Slices

- [ ] Extract `exploration_commands.gd`: turn, move, search/listen, grid edge
  lookup, cell effects, and map discovery.
- [ ] Extract `expedition_commands.gd`: enter, stairs, return, checkpoint,
  combat continuation, and expedition baseline handling.
- [ ] Extract `party_commands.gd`: row changes, bench/recall/retire/erase,
  identity edits, reclass, and import.
- [ ] Extract `item_commands.gd`: normal/growth item use and inventory helpers.
- [ ] Leave `SliceRules` as imports + command-to-handler routing only. Shared
  helpers move to a named leaf module only after both consumers exist; do not
  create a generic utilities dumping ground.

### Acceptance / Gate

- [ ] Every extracted module is pure: no `Node`, scene, input, renderer, or
  file-system dependency.
- [ ] Existing TS↔Godot trace parity, save checks, and all focused rule tests
  pass unchanged; add a trace for each command family if one is missing.
- [ ] The dispatcher's public commands and unknown-command no-op behavior are
  byte-for-byte compatible before and after the split.
- [ ] Refactor commits are separate from gameplay features and each is small
  enough to revert independently.

**Non-goals:** porting unported commands, renaming player-facing events, or
changing the TypeScript oracle.

## IMP-051: Turn Dungeon Into a Thin Scene Spine

**Category:** Dungeon presentation maintainability

**Evidence:** `godot/scripts/dungeon.gd` is 1,095 lines and currently combines
first-person mesh generation/materials, world asset lookup, minimap/party/dock
construction, map and party modals, held-key repeat, rule dispatch, event log
projection, and combat/town scene handoff. A change to one concern requires
reading and rebuilding controls from several others; the `position = null`
return bug (IMP-044) is an example of lifecycle work leaking across boundaries.

**Decision:** keep `Dungeon` responsible for acquiring `Run`, selecting the
current scene state, and coordinating transitions. Move rendering and screen
regions behind explicit collaborators with no authority to mutate game state.

### Implementation Slices

- [ ] Extract `dungeon_renderer.gd`: SubViewport, environment, geometry,
  camera/light placement, materials, and current-cell view updates.
- [ ] Extract `dungeon_hud.gd`: header, minimap, party rail, fixed dock, and
  full-map/party modal construction. It accepts state and callbacks; it does
  not call `SliceRules` directly.
- [ ] Extract `dungeon_input.gd`: named input mapping, held-repeat timing, and
  stop conditions. It emits an action callback; `Dungeon` remains the sole
  command dispatcher and scene-transition owner.
- [ ] Keep `set_state_override` / `set_ui_state` as explicit test seams until
  IMP-054 supplies a shared fixture harness.

### Acceptance / Gate

- [ ] Normal and fixture paths render the same state; no collaborator silently
  fabricates `position`, map, inventory, or encounter state.
- [ ] `gate:play`, dungeon-controller checks, and the native corridor slice
  cover held repeat, map cancel, chest/modal stop, victory resume, and return.
- [ ] Geometry/minimap/facing agreement remains covered by the Grid Labyrinth
  Gate; screenshots are reviewed at the project viewport.

**Non-goals:** visual reskin, lighting rebalance, changing command layout, or
changing dungeon topology. Defer this item until active dungeon UX work lands.

## IMP-052: Separate Combat Orchestration From Combat Presentation

**Category:** Combat presentation maintainability

**Evidence:** `godot/scripts/combat.gd` is 1,037 lines. It owns per-member
command collection, target selection, repeat/auto, `CombatRound` dispatch,
playback effects, enemy-stage geometry, party-vital rendering, asset loading,
and victory/wipe routing. `combat/command_menu.gd` already demonstrates the
desired boundary, but the remaining visual regions cannot evolve independently.

**Decision:** retain `CombatRound` as the pure deterministic authority and keep
`Combat` as the single scene-level coordinator. Extract only state-derived
presentation and playback helpers; no combat rule moves into Controls.

### Implementation Slices

- [ ] Extract `combat_stage.gd`: enemy marks, target reticle, condition labels,
  placement bounds, and environment backdrop.
- [ ] Extract `combat_party_hud.gd`: fixed 3+3 formation, vitals, active actor
  emphasis, and status indicators.
- [ ] Extract `combat_playback.gd`: damage/defeat flourishes and animation-safe
  presentation from resolved events. It may not change state or decide victory.
- [ ] Let `combat.gd` own only state acquisition, menu phase, order commit,
  dispatch, result routing, and coordination of the three collaborators.

### Acceptance / Gate

- [ ] State hash and emitted combat events remain identical for the same round.
- [ ] Controller flow still advances standing members in formation order; target
  selection, Cancel, repeat, auto interruption, victory, and wipe retain their
  current semantics.
- [ ] Combat screenshot and geometry gates prove HUD regions do not hide enemy
  marks, and party vitals remain visible.

**Non-goals:** combat balance, new techniques, a different auto-battle policy,
or a visual redesign. Defer while IMP-024/036 presentation changes are active.

## IMP-053: Centralize Runtime Resource and World-Asset Resolution

**Category:** Runtime boundary / packaging safety

**Evidence:** title, town, guild, dungeon, combat, and result each implement
their own JSON/image/asset helpers. Several use `Image.load_from_file()` and
different world-id fallbacks. `dungeon.gd` contains a historical workaround for
registry id versus internal world id; title loading currently raises the export
warning tracked by IMP-047. Repeated resource behavior makes a correct local
fix easy to miss on another screen.

**Decision:** define one small runtime resource boundary that knows the registry
world id, pack locations, required-versus-optional assets, imported textures,
and diagnostic errors. Scenes request named assets; they do not compose raw
`res://assets/worlds/%s/...` paths independently.

### Implementation Slices

- [ ] Add a `world_resources.gd` leaf service for world pack/engine JSON and
  world-relative asset paths, with explicit required/optional loading results.
- [ ] Route title, town, guild, dungeon, combat, and result through it in
  isolated commits, retaining their visible fallback behavior until IMP-047's
  exported-build acceptance is available.
- [ ] Resolve packaged textures through imported resources or an explicit export
  registry; never suppress a missing required image with a silent null texture.
- [ ] Make asset diagnostics name the world registry id and logical asset key,
  not just an opaque path.

### Acceptance / Gate

- [ ] Default and Verdant resolve the same logical title/portrait/dungeon asset
  keys without a scene-local id conversion.
- [ ] `verify_assets`, UX captures, and the package smoke from IMP-047 pass;
  exported builds have no dynamic-image warning or missing mandatory art.
- [ ] No resource service imports scene code or game rules.

**Non-goals:** changing art direction or merging scenario-specific assets into
a universal shared pack.

## IMP-054: Unify Native Scene Fixtures and Observation

**Category:** Test harness / evidence integrity

**Evidence:** individual scenes expose similar but separate
`set_state_override` / `set_ui_state` test seams, while captures and verifiers
also load JSON traces directly. This has previously permitted an assertion and
its screenshot to describe different fixture states. It also prevents the
scoped native slices in IMP-049 from saying exactly which scene, inputs, and
output they proved.

**Decision:** create a test-only harness for named runtime states and observable
native actions. Fixtures may establish a deterministic state, but all follow-up
actions travel through normal input/command/scene code. The harness is never
mounted in normal play.

### Implementation Slices

- [ ] Define named fixture documents for `open_corridor`, `map_modal`,
  `combat_victory`, `return_ready`, `loot_delta`, and `shop_description`; reuse
  them in both captures and assertions.
- [ ] Provide one test helper to start a scene with a fixture, send a named
  input/action, wait for its declared idle/transition condition, and collect
  scene, phase, state hash, errors, and screenshot evidence.
- [ ] Migrate one existing gate at a time; preserve its old fixture and compare
  state hash/screenshot before deleting duplicate setup.
- [ ] Feed the harness into IMP-046's debug state deck and IMP-049's native
  slice without exposing fixture selection to players.

### Acceptance / Gate

- [ ] A capture and its paired assertion consume the identical named fixture
  and UI state; the harness rejects a missing or mismatched name.
- [ ] A native corridor test proves hold-repeat and stop-on-modal; a return test
  proves no script error; both leave reproducible artifacts.
- [ ] The harness works in CI/headless where appropriate and labels any visual
  native-desktop requirement rather than pretending headless pixels prove it.

**Non-goals:** replacing deterministic TS/Godot parity, making debug controls
player-visible, or treating fixture playback as the title-to-town full route.

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
- `IMP-030/031/032/033/034/038/040/044` (2026-07-25 playtest core-loop fixes):
  [completion record](docs/archive/Improve.completed-imp-030-044-2026-07-25.md)

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
