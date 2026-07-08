# Grid-Dungeon Structural Patterns — Authoring Reference

A catalog of ~20 structural (layout-level) patterns for authoring floors in this
first-person grid DRPG, drawn from tabletop dungeon-design theory, the classic
DRPG canon, and roguelike level-generation writing. Each entry notes how it maps
to our 20×20 ASCII / edge / gate / gimmick system, and whether it helps gate
descent behind broad exploration.

The single most important organizing idea is **Jaquaysing** (a.k.a. "Xandering")
the dungeon: replace linear room-chains with loops, branches, multiple
connections, and secret paths so the player chooses order and route, and so the
exit requires understanding the whole space rather than walking a straight line
([Bumbling Through Dungeons](https://bumblingthroughdungeons.com/jaquaying-a-dungeon/),
[RPG Museum](https://rpgmuseum.fandom.com/wiki/Jaquaysing),
[The Alexandrian: Xandering the Dungeon](https://thealexandrian.net/wordpress/13085/roleplaying-games/xandering-the-dungeon)).

---

## Group A — Connectivity & flow (Jaquays loops and branches)

**1. Loop-back shortcut**
- *Structure:* A door/corridor connects two areas normally separated by many rooms, folding a long path into a short one.
- *Experience:* Relief and mastery — the player "solves" the floor's topology and earns a fast route home.
- *Force exploration:* The shortcut only opens from the far side, so the player must traverse the long way first before the loop exists. ([Bumbling Through Dungeons](https://bumblingthroughdungeons.com/jaquaying-a-dungeon/))
- *Maps to our system:* `shortcut` edge kind / gate `kind: shortcut` (our one-way winch), opened from the deep side via `grantsFlag`.

**2. Figure-eight**
- *Structure:* Two loops sharing a central pinch-point, so paths cross at a hub and diverge again.
- *Experience:* Constant meaningful route choices; the crossing point becomes a mental landmark.
- *Force exploration:* Each lobe holds a fragment (key, flag, switch) needed elsewhere, so both loops must be walked. ([The Alexandrian](https://thealexandrian.net/wordpress/13085/roleplaying-games/xandering-the-dungeon))
- *Maps to our system:* Pure `open`-edge topology; place a crank room in one lobe whose `grantsFlag` unlocks the other.

**3. Nested loops (Jaquays)**
- *Structure:* Loops inside loops — small circuits embedded in larger circuits at multiple scales.
- *Experience:* The floor feels like a real place with depth; navigation rewards a mental map, not a memorized line.
- *Force exploration:* Inner loops hide the flags that gate the outer loop's exit, so coverage compounds. ([The Alexandrian](https://thealexandrian.net/wordpress/13085/roleplaying-games/xandering-the-dungeon), [SlyFlourish](https://slyflourish.com/simpler_jaquay_style_maps.html))
- *Maps to our system:* Nested `open` circuits; layer `lock`/`shortcut` gates so inner rings feed outer rings.

**4. Hub-and-spoke**
- *Structure:* A central room with several dead-end or semi-dead-end spokes radiating out.
- *Experience:* Clear home base; each spoke is a self-contained excursion with a return trip.
- *Force exploration:* The exit spoke stays locked until every other spoke's objective is cleared. ([Level Design Book: Typology](https://book.leveldesignbook.com/process/layout/typology))
- *Maps to our system:* Central room, spokes as corridors; exit spoke edge is `locked` with a `requiredFlag` granted only after visiting all spokes.

**5. Elevator hub (discontinuous connections)**
- *Structure:* A vertical connector linking non-adjacent points across floors, so levels interleave rather than stack cleanly.
- *Experience:* Disorientation then insight — the player realizes floors are woven together, not a tidy pancake stack.
- *Force exploration:* Reaching the "real" down-stairs may require riding a connector that only two distant rooms can reach. ([The Alexandrian](https://thealexandrian.net/wordpress/13085/roleplaying-games/xandering-the-dungeon), [LP Archive: Wizardry IV](https://lparchive.org/Wizardry-IV/Update%2011/))
- *Maps to our system:* `stairs` edges placed at deliberately awkward, non-obvious cells; multiple stair pairs per floor.

**6. Moat / ring layout**
- *Structure:* An outer ring corridor encircling an inner core reachable only via a few guarded crossings.
- *Experience:* Tension of the "gap" — the goal is visible/central but not directly approachable.
- *Force exploration:* Crossings into the core are individually gated, forcing a full lap of the ring to find the opener. ([Level Design Book: Typology](https://book.leveldesignbook.com/process/layout/typology))
- *Maps to our system:* Ring of `open` cells, core sealed by `wall`/`locked` except at crank-controlled crossings (`grantsFlag`).

**7. Broken bridge / return-trip**
- *Structure:* A forward path is severed; the player must go around, find the mechanism, and return to restore the crossing.
- *Experience:* The classic Metroidvania "I'll be back" — a remembered obstacle resolved by later knowledge.
- *Force exploration:* The mechanism sits on the far side of a large detour, guaranteeing map coverage before the crossing works. ([ACM hybrid generation paper](https://dl.acm.org/doi/fullHtml/10.1145/3402942.3402945))
- *Maps to our system:* A `locked`/`wall` edge on the direct path + a distant crank room whose `grantsFlag` converts it to passable (or a `shortcut` that opens the return).

---

## Group B — Gating & keys (lock-and-key progression)

Lock-and-key structures split a floor into subsections whose keys must be found before their locks; the design goal is that the shortest path to the goal not repeat the same corridor, and that backtracking feel optional ([Boris the Brave: Lock and Key Dungeons](https://www.boristhebrave.com/2021/02/27/lock-and-key-dungeons/), [Boss Keys analysis](https://roomescapeartist.com/2017/09/10/boss-keys-analysis-zelda-dungeons/)).

**8. Keyed gate / lock-and-key**
- *Structure:* A locked barrier whose key/flag lives in a different subsection of the floor.
- *Experience:* Directed curiosity — a remembered locked door pulls the player onward.
- *Force exploration:* Placing the key deep and the lock near the exit forces a long traversal between them. ([Boris the Brave](https://www.boristhebrave.com/2021/02/27/lock-and-key-dungeons/))
- *Maps to our system:* `locked` edge with `requiredKeyId` or `requiredFlag`; key/crank placed in a distant room.

**9. Two-key convergence**
- *Structure:* One barrier requires two independent keys/flags gathered from two different branches.
- *Experience:* A satisfying "both halves" payoff; neither branch can be skipped.
- *Force exploration:* Forces coverage of two separate regions before the single gate opens — strong anti-shortcut device. ([metazelda](https://github.com/tcoxon/metazelda))
- *Maps to our system:* Final `locked` edge with `requiredFlag`, plus two crank rooms each `grantsFlag`; gate opens only when both flags are set.

**10. Riddle / switch gate**
- *Structure:* A gate opened by a puzzle, lever sequence, or clue found elsewhere rather than a physical key.
- *Experience:* Cognitive engagement; the "aha" of connecting a clue to a mechanism.
- *Force exploration:* The clue and the switch are in separate rooms, so the player must find both. ([Five Room Dungeon](https://www.roleplayingtips.com/5-room-dungeons/))
- *Maps to our system:* Gate `clue` field on a hint room; a crank room `grantsFlag`; target edge `requiredFlag`.

**11. Vault behind exploration threshold**
- *Structure:* Optional treasure/vault reachable only after the player has already opened much of the floor.
- *Experience:* Reward for the thorough; a completionist's carrot.
- *Force exploration:* Its opener is a flag granted only late, so the vault self-gates behind broad coverage. ([Boris the Brave](https://www.boristhebrave.com/2021/02/27/lock-and-key-dungeons/))
- *Maps to our system:* Our **locked vault** — room gate `kind: lock` with `requiredFlag`/`requiredKeyId` accumulated across the floor.

**12. Boss antechamber**
- *Structure:* A staging room immediately before the floor boss/exit, locked by a "big key" that gathers the floor's progress.
- *Experience:* Ritual threshold — the player knows the climax is next and preps deliberately.
- *Force exploration:* The big key is the culmination of the floor's other gates, so it cannot be reached early. ([Boss Keys](https://roomescapeartist.com/2017/09/10/boss-keys-analysis-zelda-dungeons/), [Five Room Dungeon](https://www.roleplayingtips.com/5-room-dungeons/))
- *Maps to our system:* Antechamber room gated `lock` with a boss-`requiredKeyId`; down-`stairs` sit behind it.

---

## Group C — Vertical shifts & one-way flow

**13. One-way drop**
- *Structure:* A passage that only permits travel in one direction (winch, drop, one-way door).
- *Experience:* Commitment tension — crossing means you can't immediately return the way you came.
- *Force exploration:* Prevents backtracking as a shortcut, forcing the player to loop the long way around. ([Wizardry one-way doors](https://steamcommunity.com/sharedfiles/filedetails/?id=3165599518))
- *Maps to our system:* `one_way` edge / gate `kind: one_way` with `direction` — our winch shortcut.

**14. Pit / level-skip**
- *Structure:* A pit or chute that drops the party to a lower floor (or distant cell), bypassing the normal stairs.
- *Experience:* Surprise and disorientation; a "trap" that doubles as a discovered shortcut once mapped.
- *Force exploration:* Landing spot is off the beaten path, so the player must re-orient and explore to recover route knowledge. ([Wizardry pits/chutes](https://steamcommunity.com/sharedfiles/filedetails/?id=3165599518))
- *Maps to our system:* A one-way `stairs`/teleporter tile that deposits the party at a fixed far cell; combine with our teleporter gimmick.

**15. Gauntlet corridor**
- *Structure:* A long, low-branch stretch of concentrated hazards or roaming enemies that must be run to proceed.
- *Experience:* Sustained pressure and resource attrition; a test of preparation and nerve.
- *Force exploration:* Being unavoidable on the critical path, it forces engagement — and pairs well with a loop that lets the *return* trip bypass it. ([Bumbling Through Dungeons](https://bumblingthroughdungeons.com/jaquaying-a-dungeon/), [Etrian FOE corridors](https://tvtropes.org/pmwiki/pmwiki.php/ThatOneLevel/EtrianOdyssey))
- *Maps to our system:* Narrow run of `open` cells lined with **damage tiles** and/or patrolling enemies; a parallel `shortcut` loop rewards mastery.

---

## Group D — Disorientation gimmicks (mapping challenges)

These attack the player's *mental map* rather than route options — the defining texture of Wizardry-style mazes: teleport/spinner tiles, dark areas, false walls ([Wizardry Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3165599518), [Etrian B24F](https://tvtropes.org/pmwiki/pmwiki.php/ThatOneLevel/EtrianOdyssey)).

**16. Teleporter maze**
- *Structure:* Tiles that silently relocate the party, so adjacency on the map is not adjacency in space.
- *Experience:* Deep disorientation; the floor becomes a logic puzzle of "where did that send me?"
- *Force exploration:* Reaching the exit requires discovering the correct teleporter chain, which means probing most tiles first. ([Wizardry teleports](https://steamcommunity.com/sharedfiles/filedetails/?id=3165599518))
- *Maps to our system:* Our **teleporter tiles**; chain several so the down-stairs is only reachable via a specific sequence.

**17. Spinner disorientation**
- *Structure:* Tiles that rotate the party's facing without their knowledge, corrupting dead-reckoning.
- *Experience:* Creeping doubt — corridors that "should" go north now betray the player.
- *Force exploration:* Combined with dark or mapless zones, spinners force careful, repeated traversal to establish true geometry. ([Etrian spinner maze](https://tvtropes.org/pmwiki/pmwiki.php/ThatOneLevel/EtrianOdyssey))
- *Maps to our system:* Our **spinner tiles** (rotate facing); layer near junctions.

**18. Dark zone**
- *Structure:* A region where auto-map / light is suppressed, hiding layout and often paired with a teleport.
- *Experience:* Vulnerability and reliance on memory or utility spells; slow, deliberate movement.
- *Force exploration:* The player must feel out every edge by hand, and the exit is often deliberately buried. ([Wizardry dark areas](https://steamcommunity.com/sharedfiles/filedetails/?id=3165599518))
- *Maps to our system:* Room gate `kind: dark_zone` — our dark-zone gimmick; combine with a teleporter.

**19. False wall / secret**
- *Structure:* A wall that is actually passable if searched, hiding a path, room, or shortcut.
- *Experience:* The thrill of discovery; rewards the player who tests suspicious dead-ends.
- *Force exploration:* Making a mandatory path run through a secret forces thorough searching of the whole floor. ([Wizardry secret doors](https://steamcommunity.com/sharedfiles/filedetails/?id=3165599518))
- *Maps to our system:* `secret` edge / gate `kind: hidden` — our **searchable secret rooms**.

**20. Mimic dead-end (false objective / red herring)**
- *Structure:* A dead-end that looks like the goal (chest, door, alcove) but is a trap or nothing, masking the real route.
- *Experience:* Cultivated distrust; the player must reason about the map rather than chase the obvious.
- *Force exploration:* By making the plausible "exit" a fake, the true exit is displaced to a less-obvious cell. ([Gnome Stew: Nine Forms](https://gnomestew.com/the-nine-forms-of-the-five-room-dungeon/))
- *Maps to our system:* A tempting dead-end room (chest + damage tile, or a `locked` door with no key) while the real `stairs` sit behind a secret/loop.

---

## Patterns best for an 80%-coverage descent gate (exploration-gated descent)

Ranked by how reliably they force covering most of the floor before the down-stairs open:

1. **Two-key convergence (#9)** — mandates covering two separate regions; strongest single anti-shortcut device.
2. **Hub-and-spoke with locked exit spoke (#4)** — exit gated on *all* spokes cleared = near-total coverage by construction.
3. **Nested loops feeding a boss antechamber (#3 + #12)** — inner loops grant the flags/big-key the final gate needs.
4. **Moat/ring layout (#6)** — a full lap of the ring is required to find each core crossing's opener.
5. **Teleporter/spinner/dark maze to a buried exit (#16–18)** — the exit chain is only found by probing most tiles.
6. **Vault/threshold gating on the stairs (#11 applied to descent)** — down-stairs behind a flag accumulated late.
7. **Loop-back shortcut opened only from the deep side (#1)** — guarantees the long traversal happens *before* any fast route exists.

Design rule of thumb (lock-and-key theory): keys go *deep*, locks go *near the exit*,
and the shortest solution path should not reuse the same corridor — so the natural
route to the stairs sweeps the map once, with loops/shortcuts making the *return*
trip painless without shortening the *first* pass
([Boris the Brave](https://www.boristhebrave.com/2021/02/27/lock-and-key-dungeons/),
[The Alexandrian](https://thealexandrian.net/wordpress/13085/roleplaying-games/xandering-the-dungeon)).

---

### Sources
- Jaquaysing / non-linear design: [Bumbling Through Dungeons](https://bumblingthroughdungeons.com/jaquaying-a-dungeon/), [RPG Museum](https://rpgmuseum.fandom.com/wiki/Jaquaysing), [The Alexandrian](https://thealexandrian.net/wordpress/13085/roleplaying-games/xandering-the-dungeon), [SlyFlourish](https://slyflourish.com/simpler_jaquay_style_maps.html)
- Five Room Dungeon: [Roleplaying Tips](https://www.roleplayingtips.com/5-room-dungeons/), [Gnome Stew](https://gnomestew.com/the-nine-forms-of-the-five-room-dungeon/)
- Lock-and-key theory: [Boris the Brave](https://www.boristhebrave.com/2021/02/27/lock-and-key-dungeons/), [Boss Keys](https://roomescapeartist.com/2017/09/10/boss-keys-analysis-zelda-dungeons/), [metazelda](https://github.com/tcoxon/metazelda), [Level Design Book](https://book.leveldesignbook.com/process/layout/typology)
- Roguelike / metroidvania generation: [ACM paper](https://dl.acm.org/doi/fullHtml/10.1145/3402942.3402945)
- Wizardry maze gimmicks: [Steam: Exploring the Maze](https://steamcommunity.com/sharedfiles/filedetails/?id=3165599518), [LP Archive: Wizardry IV](https://lparchive.org/Wizardry-IV/Update%2011/)
- Etrian Odyssey design: [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/ThatOneLevel/EtrianOdyssey), [dungeoncrawlers.org](https://www.dungeoncrawlers.org/game/etrian-odyssey/)
