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

## COMPLETED — B3, branch `feat/party-menu` (2026-07-14)

### B3 — Party menu and meaningful aptitudes  *(large)*

The original audit correctly found that there was no real party menu. Its aptitude note
was partly stale by implementation time: agility already fed accuracy/speed, and wit fed
MP, but neither had a clear defensive/offensive payoff or any player-visible explanation.

Delivered:

1. A shared town/dungeon party menu with a fixed controller surface, 3+3 formation,
   portraits, level/XP, effective combat stats, aptitude effects, resistances, all six
   equipment slots, carried items, and protected valuables.
2. Item use and confirmed discard from the menu. Key items, treasure, return items, and
   equipped instances cannot be discarded. Equipment can be changed in town and reviewed
   in the dungeon.
3. Agility now drives effective initiative and evasion. Wit drives MP as before and now
   also modifies spell power and status-spell success. The status page reports the same
   calculations used by combat.
4. Browser/controller proof at 1280x720 plus the full unit and relevant E2E Gates.

Evidence: `docs/evidence/party-menu-2026-07-14/README.md`.

---

## Merge sequence — DONE

1. ✅ B2 (unblocks debugging Verdant)
2. ✅ B1 (rebuild the balance model + re-tune + Gates)
3. ✅ Full suite green (unit + e2e)
4. ✅ Merged `feat/verdant-scenario` → `main` (2026-07-13, `c03c58f`)
5. ✅ `feat/party-menu` B3 implementation complete; merge remains a separate action

Step 3 originally read "…+ **user real-play**". That was wrong to put on a list I own: verifying
a player-facing change in a real browser is my job, and the user reviews continuously and raises
what is wrong. A pending item with his name on it reserves his time on my behalf and makes the
work look stalled on him when it is stalled on me. Removed. See
`black-stela-acceptance-discipline` (2026-07-14).
