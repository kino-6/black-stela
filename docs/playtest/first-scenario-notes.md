# First Scenario Manual Playtest Notes

Scope: `Black Stela - Gate of Ash`, B1F through B10F.

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
| B2F - The Branch Cisterns | The route to B3F must be player-visible, and the player must still be able to walk back toward the B1F return route; the door-choke 玄室 should read as rooms to clear, not corridors. |
| B3F - The Chain Descent | Block-1 cap: the Cistern Warden keep-boss gates the descent, and the descent room is a return-to-town rest point. Chamber traps should make a trap/mapping role matter. |
| B4F - The Dark Gallery | The winding maze must be readable from room prose, minimap state, and exits; the hidden-door shortcut is optional, never the only way down. |
| B5F - The Cinder Gate | The Cinder Keeper keep-boss should make preparation matter; the guaranteed-fight 玄室 give a prepared party room to spend resources. |
| B6F - The Oathvault | Block-2 cap: the Oath Warden keep-boss + rest point. Trap and ambush pressure should reward party composition, not punish unknown mechanics. |
| B7F - The Sealed Vaults | Act III opener: deep trash 玄室 before the true layer; density should feel earned, not grindy. |
| B8F - The Last Gate | Deep Act III trash; the descent to the votary's sanctum must read, and the finale approach should feel like it is escalating. |
| B9F - Votary's Sanctum | The scenario-clear boss (ash-votary); clearing it should open the descent to the 真層. |
| B10F - The Inmost Stela | The 完全クリア true boss; a commitment floor (no escape charm), still winnable prepared. |

## Red Flags

- A floor can only be cleared by a headless/debug-only command.
- A return route exists in scenario data but no player-visible room, stair, or
  path communicates it.
- Enemy, door, lock, or floor names are shown as raw data labels in normal UI.
- Japanese room text reads like literal English word order.
- Repeat/auto mode keeps running through branches, boss pressure, or low HP.
