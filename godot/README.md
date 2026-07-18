# Black Stela — Godot vertical-slice project

The Godot 4.7.1 (GDScript) runtime spike for the migration. **TypeScript remains
the oracle**: this project consumes the world packs and golden traces exported
from the TS side and (from S3) replays those traces for byte-for-byte parity. See
`../docs/design/migration-execution-plan.md` for the plan and
`../docs/architecture.md` §2 for the durable-core-vs-UI boundary.

## Prerequisites

- Godot **4.7.1** (`godot --version` → `4.7.1.stable...`).
- The exported data under `data/` — it is generated and gitignored. Regenerate
  from the repo root:

  ```sh
  npm run export:godot     # = export:packs + export:traces
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

- **S2 (this):** project shell — boots, loads a world pack, scene roots compile
  and navigate. No rules yet.
- **Next (S3):** port the slice's minimum rules to GDScript and replay the golden
  traces for state-hash parity against the TS oracle.
