# First Scenario Manual Playtest Notes

Scope: `Black Stela - Gate of Ash`, B1F through B8F.

Use these notes after `npm run headless:reachability`, unit tests, and the
player-clear E2E pass. The notes are not a substitute for gates; they capture
human DRPG feel that automation can miss.

## Party Baseline

- Start with four registered adventurers, including at least one front liner,
  one trap/mapping role, and one recovery or status-safety role.
- Confirm portraits, titles, notes, and profile details are still visible in
  the guild before entering.
- Carry at least one healing draught before testing B3F or deeper.

## Floor Notes

| Floor | Manual check |
| --- | --- |
| B1F - Silent Approach | The first fight, map reveal, stair return, and town loop must be understandable without debug commands. |
| B2F - Split Dust | The route to B3F must be player-visible, and the player must still be able to walk back toward the B1F return route. |
| B3F - Cistern Teeth | Treasure and encounter pressure should make healing meaningful without forcing a reload. |
| B4F - Turned Lanterns | Navigation twists must be readable from room prose, minimap state, and exits; avoid hidden-only solutions. |
| B5F - Toll of Cinders | The midpoint gate and miniboss should make preparation matter, and the shortcut should be recognizable after discovery. |
| B6F - Narrow Oaths | Trap and ambush pressure should reward party composition rather than punish unknown mechanics. |
| B7F - Side Ash Vaults | Optional lock/reward content should feel skippable, not required for basic progression. |
| B8F - Gate of Ash | Finale pressure should still leave a visible return route after victory or retreat. |

## Red Flags

- A floor can only be cleared by a headless/debug-only command.
- A return route exists in scenario data but no player-visible room, stair, or
  path communicates it.
- Enemy, door, lock, or floor names are shown as raw data labels in normal UI.
- Japanese room text reads like literal English word order.
- Repeat/auto mode keeps running through branches, boss pressure, or low HP.
