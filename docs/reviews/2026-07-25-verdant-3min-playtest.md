# Verdant 3-minute playtest — 2026-07-25

**Reviewer:** the project owner, playing the real Godot build (`Black Stela
(DEBUG)`, stamp `4cff396+`).
**Verdict, verbatim:** "after ~3 minutes of touching it, my assessment is that it
is not properly playable."
**Why this document exists:** the owner asked to record the feedback and build a
mechanism so the same rut is not repeated. The mechanism is
`docs/gates/played-build-gate.md`. This is the raw record and the gate-gap
diagnosis behind it.

Every gate was green. Three minutes of real play found 21 defects. That gap is
the subject of the mechanism.

---

## The 21 findings (in the order they were raised)

Tracked live as session tasks #1–#21; folded into `Improve.md` as IMP-030+ where
new, or mapped to an existing reproduced item.

### Character creation
1. **Portrait coupled to origin.** Picking a 来歴 (background) also picks the face;
   選ぶ＝顔が決まる. "来歴を見繕う" reads as nonsense for what is effectively a face
   pick. Face should be its own choice. *(new; refines IMP-028)*
2. **Aptitudes unexplained.** 筋力/敏捷/精神/知恵/運 and the derived HP/威力/命中/速度
   have **no in-UI explanation** of what they do. *(new; IMP-028 covers the screen
   but not this dimension)*
3. **Placeholder name "名を待つ者" is overwrought.** The unnamed-header default reads
   as cheesy. *(new)*
4. **The whole flow looks like a business app.** Card walls, ± steppers, bare OS
   text fields, dead right-hand space. *(= IMP-028, reproduced, unfixed)*
5. **One "名を見繕う" rerolls everything.** Name, title, and notes change together —
   lazy. Each field should reroll independently. *(new)*

### Town / return
6. **Fresh start shows "持ち帰った物: 治癒の水薬".** The starting potion is labeled as
   loot brought back from an expedition that never happened. *(new; near IMP-027)*
7. **No always-visible party status; no menu openable any time.** *(new)*
16. **Flavor-status lines are lies.** 帰還記録「もう一度潜れる」/ 次の支度「先に傷を診せる」 —
    poetic filler that contradicts the broken loop. Cut them for honest,
    concrete state. *(new)*

### Shop
8. **Consumables show no description.** Data has `description`; the equipment tab
   renders it; the consumables tab does not. A surfacing gap, not a data gap.
   *(new)*
9. **Stock has no design shape.** Should mix immediately-useful cheap gear,
   expensive aspirational gear, and mystery items. Encode as a scenario Skill or
   gate. *(new; design)*

### Dungeon / exploration
11. **Auto-return to town after combat.** *Confirmed intended* — the first-contact
    model — but the feel is questioned. *(design, not a bug — see §encounter)*
12. **Map resets on return to town.** Explored `visitedCells` appears to clear.
    *(Bug suspected; needs the town↔dungeon persistence check — which no gate has.)*
13. **Esc does not close the full-map modal.** Only the 立ち去る button closes it.
    *(new; controller bug)*
17. **Held-key movement does not repeat.** Holding forward steps once. *(new)*
18. **View distance / lighting is pitch-black, contradicting "Verdant."** Should be
    scenario- and floor-authored (content-is-data). *(new; = past-trouble cousin)*
19. **No 玄室 (open rooms).** Floors are all 1-wide corridors. Not unimplemented —
    the format supports a `.` block auto-connecting as a chamber — but
    un-authored, and the 3D room rendering is unverified. *(= IMP-029)*
20. **First-contact encounter feel.** *Confirmed intended*: each enemy type fights
    once per floor visit; the floor then goes silent (repopulates on re-entry).
    Not a bug; feel is up for reconsideration and should be authorable. *(design)*
21. **Dungeon command bar looks like a business app.** Move commands under the
    minimap; feature the party at the bottom. *(= IMP-026, reproduced, unfixed)*

### Combat
14. **Acting character is never featured.** During command selection the enemy owns
    the screen; the actor is a tiny corner thumbnail. Feature the acting character
    during selection (with an ON/OFF option). *(= IMP-024, reproduced, unfixed)*
15. **Combat background is pure black (FC-like).** The full-frame stage has no
    environment backdrop. *(new)*

### The verdict finding
- **"Not properly playable in 3 minutes."** Most of the above was **already logged
  as reproduced-and-unfixed** while advanced content shipped on top. That is the
  rut. See the mechanism.

---

## Confirmed intended (not bugs), for the record

- **#11 auto-return / #20 encounter silence** — the deliberate first-contact model
  (`rulesEngine.ts`: each enemy type suppressed per floor visit via
  `floorClearedEnemies`, repopulated on re-entry). Kept explicit and authorable
  rather than "fixed"; the *feel* is the open question.
- **#19 玄室** — supported by `floorMap.ts` (adjacent `.` cells auto-connect as
  `open`); simply un-authored in current floors. Needs authoring + 3D verification.

---

## Appendix — gate-gap diagnosis (why green missed all 21)

Full analysis drove `docs/gates/played-build-gate.md`. The structural holes:

1. **The truth-gate plays the wrong program.** `gate:final` = Playwright over
   **React** (`playwright.config.ts` webServer = vite). The shipped artifact is
   **Godot**. No gate plays the Godot build end-to-end. The one Godot loop check,
   `verify_flow.gd`, is rules-only and has been **RED and unwatched**.
2. **Parity is state-hash only.** `verify_parity.gd` defines presentation out;
   black backgrounds, toolbar layouts, unfeatured actors, corridor floors change
   no hash.
3. **No gate closes the loop.** `selfplay.spec.ts` returns to town and stops;
   `verify_flow.gd` ends at "combat cleared"; no trace walks
   town→dungeon→town→dungeon and hashes the map. The map-reset bug has no owner.
4. **Controller gates cover only town and guild.** Combat, dungeon, shop, and the
   map modal — where held-key, Esc-modal, and the toolbar feel live — have none.
5. **Info surfacing is a manual allowlist.** `verify_ux_parity.gd` checks curated
   `requiredKeys` and that a screenshot *file exists*. Un-listed data (shop
   descriptions, aptitude explanations) is invisible; pixels are never read.
6. **Copy honesty and coherence are prose-only.** `player-facing-red-flags.md`
   and kin describe these exact failures in English but nothing executes them.

Every bucket maps to a gate that **describes** it; none to a gate that **executes
against the Godot binary and can go red on it.**
