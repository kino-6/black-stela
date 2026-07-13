# Handoff to Codex — Improve.md, slices 0–4

Branch `main`, on top of `1c7e3cf`. Per the handoff contract, **nothing below is marked
visually or controller accepted — that is yours.**

```sh
npm run build && npm run test    # 326 unit
npm run gate:final               # 91 e2e, no expected-failure markers left. THIS is the gate.
npm run selfplay:browser
```

`npm run test:e2e` and `npm run gate:final` are now identical in outcome — there is no
`test.fail()` anywhere. If you add one, `gate:final` must still fail on it.

## Status against your eight items

| Item | State | Owner |
|---|---|---|
| IMP-001 Gate cannot fail | done | — |
| IMP-002 Scenario picker: no controller entry, raw ids | done | — |
| IMP-003 Guild: simultaneous, clipped, focus loss | done | — |
| IMP-004 Cursor vs focus disagree | done | — |
| IMP-005 Combat overflows 720p, log occludes commands | done | — |
| IMP-006A Verdant Act-I wall | **done** (Codex, landed in d79ed99) — my table was stale | — |
| IMP-006B Stair art unwired | done (by you) | — |
| IMP-007 Enemy staging | done | — |
| IMP-008 First departure reads as a return | in progress | Claude |

---

# WHAT I NEED FROM YOU

## A. ~~IMP-006A~~ — already done, and I was wrong to ask

`stone-wall-block1.jpg` was retaken as roots/bark/moss and landed in `d79ed99` (evidence:
`docs/evidence/browser-playtest-2026-07-13/08-verdant-g1f-organic-wall-and-stair.png`). My table
above said otherwise; it was stale. The organic wall is visible in my own combat screenshots and
I did not update this document to match. **There is no outstanding art work.**

## B. Verify, by hand, at 1280×720, on a controller

The whole normal route is now keyboard-only. Please play it that way and tell me where it
still feels wrong — the automated gate proves it is *reachable*, not that it is *good*.

1. **Scenario picker** — cursor on arrival, Down/Up moves, Confirm starts the scenario the
   cursor is on, Escape returns to the title. Japanese line layout of the new titles/taglines.
2. **Guild** — the hall vs the registration form vs the proposal modal. Is the split legible?
   Does registering someone returning you to the hall feel right, or does it interrupt a player
   who wanted to make three characters in a row?
3. **Town** — gold means focus, and Enter goes where the cursor is.
4. **Combat at exactly 1280×720** — every command pressable; the log never covers the commands.
5. **Enemy staging** — spacing, contact shadows, hovering vs grounded.

## C. Three judgement calls I want challenged

1. **The enemy stage is only 227px tall at 720p.** That is the honest budget once the party
   strip, the log and the command menu have their fixed rows. If the creatures still read as too
   small, the fix is to take height from something else — say so and I will.
2. **`hover` vs `elevation`.** I first gave Verdant's spore-gnat `elevation: air` so it would
   float, and deadlocked a fight: `elevation` is a COMBAT field — `enemyGroupIsBack()` shields
   air/mid groups from melee while a ground group stands, which is how the front-blocker /
   back-caster squads work. The user's call was *"a hovering enemy melee can't reach is just
   tedious — make it presentation only"*, so there are now two fields: `elevation` (combat) and
   `hover` (presentation). **Should any Verdant enemy actually be a shielded back-liner by
   design?** If yes, that is a balance change and the act curve must be re-tuned.
3. **Registration returns you to the hall.** See B2.

## D. Rules for anything you add to the UI

- **Never use `::before { content: "▸" }` as a cursor.** Chrome folds `::before` content into
  the accessible name, so a text caret silently renamed the town button to `"▸Enter dungeon"`
  and every exact-name query for it broke — *only while focused*, so it surfaced as an
  intermittent failure of a completely unrelated test. Carets are CSS shapes now.
- **Every command belongs to a controller surface.** "Back to town" did not, so a gamepad player
  could enter the guild and never leave. Mark always-present navigation
  `data-controller-chrome="true"`: it joins the focus ring, answers Cancel, and is never the
  cursor's starting place.
- **Same-specificity CSS loses on source order.** `styles.css` sets that trap repeatedly; my
  picker heading override was defeated by a `.title-mark h1` further down the file.

## E. What the gate now proves (so you know what it does NOT)

`tests/e2e/controllerGate.ts` + `controller-route.spec.ts`:

- **"No mouse" is measured**, not declared — real `pointerdown`/`mousedown` are counted, so a
  helper that quietly reverts to `locator.click()` fails loudly. (Keyboard Enter fires `click`
  but never a pointer event, so no false positives.)
- Focus must be **enabled, on screen, not clipped, not aria-hidden/inert, and inside an ACTIVE
  surface**. `exclusive` forbids a second *non-chrome* surface sharing the ring.
- Viewport is checked on **all four edges** and **per command**, but a command a scrollable panel
  can bring into view is NOT a defect — a long roster and an unreachable combat dock are
  different things.
- Combat asserts **all six actors commanded, in formation order, and the round resolves**.
- One test walks the **shipped defaults** (no localStorage tampering).

It does **not** prove anything about how the game *feels*, or that the Japanese reads well, or
that a screen is worth looking at. That is what I am asking you for.

---

## Mistakes I made and corrected — worth your scrutiny

- The ▸ caret / accessible-name bug above. Mine, and it broke an unrelated test intermittently.
- My first IMP-005 fix **reintroduced the reflow it was fixing** (an auto-height message band grew
  when the log's "show the rest" row appeared). My own no-reflow lock caught it.
- My id-leak test was itself broken: `/\bdefault\b/` never matches inside `"Gate of Ashdefault"`.
  It passed on a card that plainly leaked the id.
- I changed combat while trying to change a picture (`elevation`). Reverted.

## Findings that were not in your report

- **Nothing on any screen said which world you were in.** A picker that started the wrong world
  would have left no trace. There is a badge now (top right).
- **`.combat-message` was 47px tall while the log inside it was 58px** — that, not the dock alone,
  is why your second log line hid behind the commands.
- **You could not leave the guild on a controller**, and **Escape in the name field ejected you
  from registration entirely**.
