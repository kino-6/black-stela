# Handoff to Codex — Improve.md slices 0–3

Branch `main`, on top of `fe9beea`. Everything below is Claude Code's work against
`Improve.md`. Per the handoff contract, **none of it is marked visually or controller
accepted — that is yours.**

Run first:

```sh
npm run build && npm run test          # 326 unit
npm run test:e2e                       # 91 e2e — green, WITH a known gap (see §Gate)
npm run gate:final                     # red on IMP-003 only. This is the honest gate.
npm run selfplay:browser
```

---

## Status against your eight items

| Item | State | Owner of the remaining work |
|---|---|---|
| IMP-001 Gate cannot fail | **done** | — |
| IMP-002 Scenario picker: no controller entry, raw ids | **done** | — |
| IMP-003 Guild: simultaneous, clipped, focus loss | **NOT done** — in progress (slice 4) | Claude |
| IMP-004 Cursor vs focus disagree | **done** | — |
| IMP-005 Combat overflows 720p, log occludes commands | **done** | — |
| IMP-006A Verdant Act-I wall is green masonry | **NOT done** | **Codex** |
| IMP-006B Stair art unwired | **done** (by you) | — |
| IMP-007 Enemy staging | **done** | — |
| IMP-008 First departure reads as a return | **NOT done** (slice 5) | Claude |

---

## 1. Please verify (browser, 1280×720, normal route)

1. **Scenario picker** — a cursor is present on arrival, Down/Up moves it, Confirm starts the
   scenario the cursor is *on*, Escape returns to the title with the cursor on "New expedition".
   Japanese line layout of the new titles/taglines. No raw ids anywhere.
2. **Town** — the gold command is the focused command, and Enter goes where the cursor is.
3. **Combat at exactly 1280×720** — every command (オート / リピート / 退却 and the four menu
   rows) is on screen and pressable; the log never covers the command window; the layout does
   not move across a full round.
4. **Enemy staging** — spacing, contact shadows, hovering vs grounded, and whether the
   creatures now read at a size worth the art. **The enemy stage is only 227px tall at 720p** —
   if that reads as too small, say so; it is a layout budget decision, not a bug.
5. **World badge** — a new one, top right. It says which scenario you are in.

## 2. Findings I hit that were NOT in your report

- **Nothing on any screen said which world you were in.** A player who picked Verdant got a
  town, a guild and a dungeon that never confirmed it — and a picker that started the *wrong*
  world would have left no trace. Hence the badge.
- **`.combat-message` was 47px tall while the log inside it was 58px.** That, not the dock
  alone, is why your second log line hid behind the commands.
- **The picker's heading override lost on source order.** Same-specificity rules in
  `styles.css` decide by position; this file sets that trap repeatedly.

## 3. Mistakes I made and corrected — worth your scrutiny

- **The ▸ focus cursor was `::before` TEXT.** Chrome folds `::before` content into the
  accessible name, so the town button was silently renamed `"▸Enter dungeon"` and every
  exact-name query broke — *only while focused*, so it surfaced as an intermittent failure of
  an unrelated test. All carets are CSS shapes now. **If you add a caret anywhere, do not use
  `content:` text.**
- **My first IMP-005 fix reintroduced the reflow it was fixing** (an auto-height message band
  grew when the log's "show the rest" row appeared). The no-reflow lock caught it.
- **My id-leak test was itself broken**: `/\bdefault\b/` never matches inside
  `"Gate of Ashdefault"` — no word boundary. It passed on a card that plainly leaked.

## 4. A decision that needs you: `elevation` vs `hover`

I first gave Verdant's spore-gnat an `elevation: air` so it would hover. **`elevation` is not a
rendering hint** — `rulesEngine.enemyGroupIsBack()` shields air/mid groups from melee while any
ground group stands. That is how the front-blocker / back-caster squads work. I had changed the
*fight*, and a Verdant encounter deadlocked.

The user's call: *"a hovering enemy that melee can't reach is just tedious — make it
presentation only."* So there are now two fields:

- **`elevation`** (`ground`/`mid`/`air`) — **combat**. Shields from melee. Used by squads.
- **`hover: true`** — **presentation**. Draws the creature off the floor, casts a fainter
  shadow, and changes nothing about reach.

Verdant's spore-gnat / spore-caster / pollen-drifter now use `hover`. **Please sanity-check that
this reads correctly in play** and that no Verdant enemy *should* have been a shielded back-liner
by design — if one should, that is a balance change and the act curve must be re-tuned.

## 5. The Gate — read this before trusting a green run

`npm run test:e2e` is **green with a known gap**. The guild test (IMP-003) is marked
`test.fail()`, and Playwright reports an expected failure as a **pass**. You flagged exactly this
risk. So:

```sh
npm run gate:final     # FINAL_GATE=1 — strips the marker. Currently RED on IMP-003.
```

**Do not accept the backlog as done on `test:e2e` alone.** The final gate is the one that tells
the truth.

What the gate now proves (`tests/e2e/controllerGate.ts`, `controller-route.spec.ts`):

- **"No mouse" is measured**, not declared — real `pointerdown`/`mousedown` are counted, so a
  helper that quietly reverts to `locator.click()` fails loudly. (Keyboard Enter fires `click`
  but never a pointer event, so there are no false positives.)
- Focus must be **enabled, on screen, not clipped by an ancestor's overflow, not inside
  aria-hidden/inert, and inside an ACTIVE surface**. `exclusive` additionally forbids sibling
  surfaces sharing one ring.
- Viewport is checked on **all four edges**, and on **each command inside a surface** — it names
  "Auto" and "Retreat" individually, not just the dock.
- Combat asserts **all six actors are commanded, in formation order, and the round resolves**.
- One test walks the **shipped defaults** (no localStorage tampering): confirm step and beat
  playback included.

Known caveat, to be removed with IMP-003: the town/dungeon/combat tests reach the party with the
**mouse** helper, because the guild cannot yet be completed on a controller. The guild test is
the one that proves that.

## 6. Still open

- **IMP-006A — yours.** Verdant G1F still reads as green-tinted fitted masonry with visible
  brick courses. `content/worlds/verdant/ART.md` forbids exactly that. The Act II/III textures
  you delivered are right; Act I is not.
- **IMP-003** — Claude, in progress.
- **IMP-008** — Claude, next.
- **Flaky**: `dungeon-frame.spec.ts` failed under parallel load twice. The cause turned out to
  be the accessible-name bug above and it has not recurred, but I have not proven it is gone.
