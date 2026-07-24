# Codex handoff — 2026-07-25 Verdant playtest follow-up

Prepared for the other agent (Codex): art direction, image gen/retakes, asset
contracts, pack placement, and independent browser-visible review. Context and
full findings: `docs/reviews/2026-07-25-verdant-3min-playtest.md`; the mechanism
that governs "done": `docs/gates/played-build-gate.md` (esp. P1 — player-facing
work is not done without visual/feel acceptance on the real Godot build).

Claude Code has landed the code for the core-loop fixes; the pieces below need
Codex's independent play review, art, or an asset decision.

---

## ① Verify the landed core-loop fixes on the REAL Godot build (independent review)

Headless gates prove the flow decisions (gate:play, 12/12) but cannot judge feel
or scene transitions. Commit `fc2f367` (#11/#12/#13) plus the follow-up commit
for #3/#17. Play the build and confirm:

- **#11** — win a dungeon combat → "続ける" RESUMES exploration on the same cell
  (is NOT thrown back to town).
- **#12** — explore to fill the automap → return to town → re-descend → the
  explored map PERSISTS (is not reset to the entrance / wiped).
- **#13** — open the full map (M) → Esc closes it.
- **#17** — hold ↑ → the party keeps stepping while held; ←/→, S, and Q/E also
  auto-repeat on hold (tap is still one step).
- **#3** — a brand-new party's first return shows "持ち帰った物はない" (the
  untouched starting potion is NOT reported as loot); after actually looting,
  the new item appears.

If any is wrong, return repro steps + screenshots so it earns a regression lock.

## ② Codex-led visual reskin — "enterprise form → character-first game HUD"

The user chose a Codex-led reskin. Claude prepares the layout receptacle; Codex
owns the look (background, frames, ornament) and final visual sign-off. Bundle
these three screens under one art direction:

- **#15 combat backdrop** — the enemy stage sits on pure black. Lay an
  environment background (the dived floor/area) behind the creatures, per
  world/floor. Verdant = green drowned-light (a `ui/combat-vignette.jpg` already
  exists in the verdant pack — confirm/extend).
- **#14 acting character featured** — during command SELECTION, feature the
  acting character's figure as the subject (today it is a corner thumbnail while
  the enemy owns the screen). Playback keeps the enemy stage. Must support an
  ON/OFF option.
- **#21 dungeon HUD** — feature the party at the bottom of the screen; move the
  command cluster (探索/聞く/全体図/隊列/オート) to under the minimap.
- **#4 / #9 character-creation flow** — reskin the card-wall + ±-stepper +
  bare-text-field "business app" into an authored, character-first screen.

## ③ Asset decisions / additions needed for content work

- **#6 decouple the face from origin** — the plan is to make the portrait its
  own pick, independent of 来歴 (background). Question for Codex: is there a face
  POOL separate from backgrounds with enough faces per class/sex to pick from,
  or must faces be generated/added? (Codex already made the class step preview a
  per-class figure — related.)
- **#18 Verdant is too dark** — Claude will make view distance / ambient light /
  fog scenario- and floor-authored (content-is-data). Codex: specify the
  intended brightness/fog LOOK so "Verdant/lush" reads (a default that isn't
  pitch-black).
- **#19 玄室 (open rooms)** — once Claude authors open chambers (a block of `.`
  cells), confirm the first-person 3D renders them as a ROOM distinct from a
  1-wide corridor; supply room-appropriate art if the corridor look doesn't
  read as a chamber.

---

Granularity: if any ②/③ item needs its own detailed brief (reference art,
dimensions, pack path, asset contract), ask and Claude will expand it.
