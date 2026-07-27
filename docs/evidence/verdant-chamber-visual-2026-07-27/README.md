# Verdant chamber visual review — 2026-07-27

Native Godot review of the real Verdant pack, not a Web mock or an editor-camera render.
`capture_verdant_chamber_visual.gd` puts the party on the walkable approach to a guardian room and
faces through the normal threshold. Captures are 3456×1944 from the macOS Godot build.

| Evidence | What it establishes |
| --- | --- |
| [Before — G1F](before-g1f-chamber.png) | The former thin disk and full-height columns repeat through open halls, read as green props, and block the approach sightline. |
| [After — G1F](after-g1f-chamber.png) | Only a data-authored `chamberGuardian` room receives the low stone dais, amber inlay, boundary cairns, and raised ceiling. The approach remains open. |
| [After — G2F](after-g2f-chamber.png) | The same renderer and palette treatment resolve against G2's own floor block texture. |
| [After — G3F](after-g3f-chamber.png) | The same renderer and palette treatment resolve against G3's own floor block texture. |

## Art decision

The chamber is a constructed **guardian-and-reward space**, not a pre-spawned chest: a desaturated wet
stone dais and root-bound boundary stones contain a sap-amber inlay. The inlay is intentionally low and
only faintly emissive, so it remains visible under Verdant's green canopy light without becoming a green
pickup or a gold UI marker. The higher ceiling and matching ceiling crown make the mark architectural;
the actual chest remains exclusively the post-victory game state.

The palette is owned by `content/worlds/verdant/world.md`:
`chamberFloor`, `chamberWall`, and `chamberAccent`. The renderer applies this treatment only when a
shape-qualified cell belongs to a room marked `chamberGuardian`; ordinary three-way intersections keep
ordinary hall geometry. This is important: G1F contains many intersection cells, but only its authored
guardian rooms should announce a fight and reward.

## Door readiness

No Verdant G1–G3 edge is currently authored as `kind: door`, so there is no fabricated door screenshot.
The Godot renderer is ready for that data: a `door` edge renders the world pack's split-root texture as an
ajar two-leaf threshold with a palette-coloured frame, while remaining traversable exactly as the rules
already define it. `genVerdantFloors` / edge authoring remains the data lane; no chamber rule, collision,
or traversal behavior was changed here.

## Reproduction

```sh
godot --path godot/ --script res://tests/capture_verdant_chamber_visual.gd -- \
  /absolute/path/to/output.png g1f
```

The capture is deliberately non-headless. `npm run gate:chambers` validates the shipped generated pack's
open halls and guardian-room placement; `npm run gate:migration` and `npm run gate:final` remain the
release gates for this change.
