# Black Stela — Godot migration runtime

The Godot 4.7.1 (GDScript) runtime for the active full migration. **TypeScript
remains the oracle and authoring toolchain**: this project consumes normalized
world packs, engine data, and golden traces exported from the TS side, then
replays those traces for byte-for-byte rules parity.

## Migration References

Read these in order before adding a migrated subsystem:

1. [`../docs/architecture.md`](../docs/architecture.md) for the durable
   core/presentation boundary and command loop.
2. [`../docs/design/godot-full-migration-plan.md`](../docs/design/godot-full-migration-plan.md)
   for the active milestone, exit criteria, and parity process.
3. [`../docs/design/ai-godot-migration-contract.md`](../docs/design/ai-godot-migration-contract.md)
   before touching scenario AI, narration, canonical events, records, or saves.
4. [`../AIPlan.md`](../AIPlan.md) for the AI scenario and realtime GM product
   direction.

M3 does not implement live AI. Town service rules keep returning canonical
typed events; Godot scenes render those results but do not call providers or
store generated prose in `Run.state`.

## Prerequisites

- Godot **4.7.1** (`godot --version` → `4.7.1.stable...`).
- The exported data under `data/` — it is generated and gitignored. Regenerate
  from the repo root:

  ```sh
  npm run export:godot     # packs + traces + shared engine/character data
  ```

  This writes `godot/data/worlds/<id>.json` and `godot/data/traces/<route>.json`,
  which Godot loads via `res://data/...`.

## Run

```sh
godot --path godot/                 # windowed: Boot → Title → Town → Dungeon → Combat → Result
godot --headless --path godot/      # headless: Boot loads the default world, prints a summary, quits
```

Navigation is controller-only — `confirm` (Enter/Space) advances, `cancel`
(Escape) goes back. The named input actions live in `scripts/input_actions.gd`.

## Verify (headless smoke)

```sh
godot --headless --path godot/ --script res://tests/verify_shell.gd
```

Confirms every scene root compiles and the exported world packs + golden traces
parse in Godot. Exits non-zero on any failure.

## Structure

```
project.godot            Project config, autoloads, InputMap (via code), gl_compatibility
scripts/
  input_actions.gd       Registers the DRPG named input actions
  world_loader.gd        Loads res://data/worlds/<id>.json (the S1 bridge)
  scene_manager.gd       Scene navigation seam
  slice_scene.gd         Placeholder scene root (title + confirm/cancel nav)
  boot.gd                Loads the default world, then advances to Title
scenes/                  boot / title / town / dungeon / combat / result (.tscn)
tests/verify_shell.gd    Headless smoke check
data/                    GENERATED (gitignored): world packs + golden traces
```

## Status

The validated spike has moved into the full migration and M3 town-service work
is active. This README is an entry point rather than a milestone tracker; use
[`godot-full-migration-plan.md`](../docs/design/godot-full-migration-plan.md)
for current scope and exit criteria.
