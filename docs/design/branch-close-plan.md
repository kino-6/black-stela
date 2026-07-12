# Close-out plan — `feat/verdant-scenario`

Decision (2026-07-13): close this branch with **B1 + B2 only**. **B3 is deferred to its
own branch** — it is a different axis from this branch's subject (scenario switching +
Verdant) and the branch is already 18 commits / a very large diff.

Status at time of writing: build clean, **315 unit + 75 e2e green**, 18 commits ahead of
`main`.

---

## BLOCKING — must land before merging this branch

### B1 — Balance is invalid after the encounter rework  *(medium)*
The encounter model was changed (see `feat: random encounters + 玄室 respawn`):
- wandering encounters (6%/step) now fire while walking,
- enemy/treasure suppression is scoped to the **floor visit**, so a re-entered floor
  repopulates its chambers.

`descentSim` still models the OLD economy (first-contact: each enemy type once per run,
~11–13 fights). Its Gates (`tests/descentSim.test.ts`, `tests/verdantBalance.test.ts`)
**still pass but no longer measure reality** — leaving them is a lie that says "tuned".

Work:
1. Teach `descentSim` the new economy: walking steps → wandering-encounter rolls, plus
   floor re-entry repopulation. It must estimate the *real* fight count per floor.
2. Re-tune both worlds against it, still using the **`none` model** and the act curve
   (`.claude/skills/drpg-balance` — never let the sim wipe; Act I ~0.85→0.65, Act II
   ~0.60→0.42, Act III ~0.38→0.28).
3. Rewrite the Gates on the new model.
4. Sanity-check the encounter RATE itself: 6%/step over ~300-step floors may still be
   far too many fights. Consider a cooldown (no wander within N steps of the last
   fight) — the classic DRPG safety window.

### B2 — Debug mode does not support scenario selection  *(small)*
Requested and not done. `?debug=1` bypasses the picker and
`createDebugStateFromProgress` is hard-wired to `defaultWorld`, so **Verdant cannot be
debugged at all**.

Work:
1. `?debug=1&world=verdant` (and/or a scenario dropdown in the debug panel) selects the
   world; `applyActiveWorld` it before building the debug state.
2. Make the debug progress states world-generic — `floor_2..floor_8` reference default
   room ids (`room.b1f.002` …). Derive them from `world.dungeons` instead.
3. e2e: debug-start into Verdant.

---

## DEFERRED — B3, its own branch (`feat/party-menu`) — DO NOT FORGET

### B3 — There is no menu/status screen, and half the stats are dead  *(large)*
Raised by the user and **confirmed in code**:

- **No menu screen at all.** In the dungeon there is only **Camp**, which offers exactly
  two things: change a member's row, and use a healing item. There is **no status screen,
  no inventory list, no valuables/key-item detail** anywhere.
- **Aptitudes are mostly decorative.** Of the five:
  - `might` / `spirit` → only feed **starting max HP / max MP** at character creation.
  - `luck` → **crit chance only** (`CRIT_BASE_CHANCE + luck * CRIT_PER_LUCK`).
  - **`agility` and `wit` are used NOWHERE in combat math.** They are rolled, stored,
    shown at creation — and then do nothing.

So the player cannot inspect their party, cannot manage items, and half of what they
"built" at creation has no effect. This is a core RPG gap, not polish.

Work:
1. **Menu screen** (town + dungeon): party status (full derived stats, equipment,
   resistances, level/xp to next), inventory (use / examine / discard), valuables &
   key items with descriptions.
2. **Make the aptitudes real**: `agility` → turn order + evasion; `wit` → spell power /
   status land-rate (and/or MP). Then surface them in the status screen so the build
   choice is legible.
3. Balance follow-through: giving agility/wit real effects changes combat math — re-run
   the Gates from B1.

---

## Merge sequence
1. B2 (unblocks debugging Verdant)
2. B1 (rebuild the balance model + re-tune + Gates)
3. Full suite green (unit + e2e) + **user real-play**
4. Merge `feat/verdant-scenario` → `main`
5. Start `feat/party-menu` for B3
