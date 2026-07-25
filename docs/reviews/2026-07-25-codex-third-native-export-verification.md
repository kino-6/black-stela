# Codex Third Native/Export Verification — 2026-07-25

**Requested baseline:** `ee49257` (current-floor geometry) and `2f96b20`
(embedded Noto Sans JP), reviewed independently after the second-pass record.

## Result

| Request | Result | Evidence |
| --- | --- | --- |
| `gate:font` | **Pass** | `npm run gate:font` exits 0 and reports that the embedded font renders `あ` and `険`. |
| B2F geometry data path | **Gate pass** | `verify_dungeon_controller.gd` now reports `the 3D geometry follows the party to B2F (#29)`. The code selects geometry from the live `map.floorId` rather than `startDungeon`. |
| IMP-044 null guard | **Gate pass; native route not approved** | `verify_played_loop.gd` passes both null-position `_position()` and `_current_cell()` assertions. The requested native `return_ready` route was not completed through the debug fixture. |
| #17 all held directions | **Not approved** | The existing controller gate still demonstrates one held `turn_left` action. The requested native B2F start could not be selected through the debug overlay under this review environment, so ↑/↓/S/Q/E and wall-stop have no independent native evidence. |
| B2F/B3F/B4F native render | **Not approved** | The B2F state/geometry gate passes, but no reliable native fixture launch reached B2F/B3F/B4F for visual comparison. |
| Web Japanese | **Not approved** | The old-origin Safari capture remained tofu; it may be cache-contaminated. A new origin triggered macOS's persistent local-network permission for Python, which was not accepted without explicit user approval. Thus the actual fresh Web canvas remains unverified despite `gate:font`. |
| #27 package smoke | **Fail** | `npm run package` exits 0 but emits 22 `WARNING: Missing .uid file ... re-created from cache` lines. That violates the requested warning count of zero. There is still no `gate:package-smoke` command. |

## Concrete findings

### Package warning debt

The package log names missing, untracked Godot UID sidecars under
`godot/scripts/` and `godot/tests/` (for example `debug_overlay.gd.uid`,
`dungeon_entry.gd.uid`, and `verify_dungeon_controller.gd.uid`). Godot recreates
them, so the export completes, but a clean checkout emits warnings.

**Required fix:** decide and document the source-control policy, then make a
clean checkout produce them before export. For normal Godot scripts the
appropriate policy is to track the generated `.gd.uid` sidecars; test screenshot
`.png.import` files should be handled deliberately rather than bundled
accidentally. Re-run `npm run package` from a clean worktree and require zero
matching warning lines before calling `gate:package-smoke` green.

### Native fixture evidence gap

The debug panel itself mounts and F12 works. Under OS-level review automation,
clicking its floor controls did not reliably select the displayed fixture; the
underlying title/town surface received the transition instead. This is recorded
as an **unresolved native-review path**, not a claim about ordinary manual
mouse play. A durable solution is a launchable fixture contract (for example
`--qa-fixture=open_corridor`) that asserts the active scene, starting cell,
facing, and floor before input is reviewed.

For #17, `open_corridor` must have at least three safe cells in all requested
directions or reset between actions, and must emit an on-screen fixture label
outside normal play. For #44, `return_ready` must prove the screen is dungeon,
the stair action is available, and the destination is town without an error.

### Web-font evidence gap

The font resource is correctly staged and the headless character-coverage gate
passes. That is necessary but not sufficient: the Web binary must be launched
from a fresh origin/browser profile and inspected for readable Japanese.
The review did not accept the macOS prompt that would grant Python persistent
local-network discovery permission; explicit user approval is needed to take
that step on this machine.

## Visual and asset direction (unchanged, still pending implementation)

- **#15:** bind combat to world/floor environment art with a legibility veil;
  no black stage behind the enemy.
- **#14:** a large acting-character portrait during command selection only;
  enemy remains primary during action resolution; option persists.
- **#21:** a lower-third party strip with portraits, condition, HP/MP; commands
  are vertically grouped below the minimap.
- **#9:** fixed identity rail plus one dominant choice panel and outcome preview;
  avoid equal-weight form cards.

The face decision remains **insufficient pool**: current portrait files are
one per origin (`background.portraitKey`), not independent faces. Add a
world-scoped `faceId` catalog before decoupling the model.

For Verdant, preserve the current intended defaults (`ambientEnergy 0.85`,
`fogDensity 0.06`, `torchRange 10`): wet stone readable for 2–3 cells, cool
green distance, warm torch as accent. Native visual approval is pending the
fixture path.

For chambers, grid geometry can widen the footprint but still lacks a unique
room treatment. Approve only after a fixture proves a single first-person frame
distinguishes the room from a corridor through light, ceiling break, floor motif,
pillars, or a landmark prop.

## Ownership recommendation

**Claude should implement `loot_delta`.** It belongs with the debug-fixture
state/scene contract and needs to wire a real gained item through the town
ledger. Codex will independently accept it through the native player path after
the fixture launch contract is reliable.
