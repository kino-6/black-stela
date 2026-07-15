# Black Stela Active Improvement Backlog

Last browser acceptance: 2026-07-14, Chromium, 1280x720 and 1920x1080.

## Active Status

`IMP-001` through `IMP-017` are archived. The next art/identity slices are
specified below but must not overlap the implementation currently in Claude's
worktree.

| Item | Priority | State | Player-visible problem |
| --- | --- | --- | --- |
| `IMP-018` | P1 | Planned | A player-authored adventurer is reduced to one face image and loses visual identity when moved between creation, saves, worlds, and gameplay contexts. |
| `IMP-019` | P1 | Planned | Combat and exploration use portraits mainly as 32-52px roster markers; the adventurer making the current decision never owns the scene. |
| `IMP-020` | P2 | Planned | Local narration knows only an anonymous environment, so an AI GM cannot visually acknowledge the authored adventurer without either ignoring them or improperly speaking for them. |

Archived work:

- `IMP-001` to `IMP-008`:
  [docs/archive/Improve.completed-browser-slices-2026-07-14.md](docs/archive/Improve.completed-browser-slices-2026-07-14.md)
- `IMP-009` to `IMP-011`:
  [docs/archive/Improve.completed-imp-009-011-2026-07-14.md](docs/archive/Improve.completed-imp-009-011-2026-07-14.md)
- `IMP-012`:
  [docs/archive/Improve.completed-imp-012-2026-07-14.md](docs/archive/Improve.completed-imp-012-2026-07-14.md)
- `IMP-015` to `IMP-016`:
  [docs/archive/Improve.completed-imp-015-016-2026-07-14.md](docs/archive/Improve.completed-imp-015-016-2026-07-14.md)
- `IMP-017`:
  [docs/archive/Improve.completed-imp-017-2026-07-14.md](docs/archive/Improve.completed-imp-017-2026-07-14.md)

## IMP-013: Separate Party Completion From Roster Administration

At 6/6, show the completed 3+3 formation and departure choice as one stable
screen. Reserve, retired, portable-vault, and repeated Bench controls belong in
the party/roster service and must not peek below the 720p completion frame.

## IMP-014: Recompose Recovery as a Town Command Window

Keep wounds, before/after HP, individual cost, total cost, affordability, and
confirm/cancel, but remove the large empty field and oversized web-form submit.
The selected treatment and result should read as one compact service exchange.

## IMP-018: Portable Adventurer Visual Identity

**Category:** Character authorship / art pipeline.  
**Evidence:** `Character` and `PortableAdventurer` retain only `portraitRef`;
combat renders it at `2rem`, exploration at `3.25rem`, and the party menu at
`4.25rem`. One square crop cannot serve icon, profile, and dramatic framing.

Replace the single opaque portrait reference with an externalizable visual
profile: base image, focal point/crop, and an optional transparent battle/bust
image. A single imported image remains sufficient; extra art and expression
variants are progressive enhancement, never an entry requirement. Scenario
defaults and player imports must use the same resolver and fallback path.

**Player-visible outcome:** The adventurer created or imported by the player
keeps a recognizable face and silhouette through save/reload, portable-vault
transfer, scenario changes, profile view, and combat presentation.

**Owner boundary:** Codex owns the art/data contract and visual acceptance.
Implementation is unassigned until Claude's current slice is merged; do not edit
its active party-menu, economy, rules, or scenario files from this item.

**Acceptance:**
- [ ] Import preview shows compact-token, profile, and battle framing before confirmation, with focal-point adjustment that works by controller except for the allowed file picker.
- [ ] Save/reload and portable transfer preserve the actual custom image and crop metadata, not only a machine-local dangling reference.
- [ ] Default, Verdant, and custom one-image fallbacks all remain readable without requiring expression or full-body files.

**Browser route:** Normal title -> register one imported adventurer -> enter
dungeon -> open party profile -> save/reload -> combat. Verify at 1920x1080 and
the 1280x720 no-overlap Gate.  
**Past trouble:** Character creation becoming data entry; portraits disappearing
at gameplay density; scenario assets falling back silently.

## IMP-019: Contextual Character Presence In Play

**Category:** Combat/exploration presentation. Depends on `IMP-018`.

Keep the six compact vital rows stable, but give the current subject a larger,
fixed presentation lane. During command input, show the active adventurer as a
waist-up or large portrait beside the command window, in formation command order.
During resolution, reserve brief cut-ins for skills, healing, critical danger,
and growth rather than flashing a portrait for every basic attack. Dungeon
events and party inspection use the same lane for the affected or selected
member. This borrows the clarity of character-forward Japanese DRPGs without
copying their compositions or covering the enemy field.

**Player-visible outcome:** The player can immediately tell whose decision,
reaction, or achievement is on screen, and their custom character art is seen at
a meaningful size during actual play rather than only in registration.

**Owner boundary:** UI implementation must be a separate slice after the current
Claude work. It may consume the visual-profile contract but must not redesign
combat rules, command order, or party-menu state.

**Acceptance:**
- [ ] Active art follows controller command order and Confirm/Cancel truth; no actor-card or mouse selection is introduced.
- [ ] The presentation lane never moves commands, hides enemy silhouettes, or removes the always-on six-member HP/MP/status strip.
- [ ] Hurt/critical/growth states have a restrained fallback treatment when no authored variant exists; level-up remains integrated with the game surface, not an app popup.
- [ ] Japanese copy and custom images fit at both review viewports without clipping, stretching, or a one-character orphan.

**Browser route:** Use one imported image and one scenario-default image through
command -> target -> resolution -> victory/growth, plus one dungeon event. Capture
the active-member change and the fallback path.  
**Past trouble:** Tiny portrait-only HUD; enemies receiving leftover space;
commands/logs moving; victory as an app popup; mouse-first actor selection.

## IMP-020: GM-Aware Adventurer Framing

**Category:** Local narration / character presence. Depends on `IMP-018`.

Add a guarded, read-only narration subject chosen by deterministic game rules:
character id, display name, title, background/temperament, current condition,
and selected recorded deeds. The local narrator may address or describe the
environment around that subject and return a validated presentation cue such as
`subjectId` and `tone`; it may not choose actions, invent PC dialogue or feelings,
change rules, or mutate `GameState`. Authored scenario text remains the canonical
fallback. The chosen subject's art appears in the event presentation lane from
`IMP-019`.

**Player-visible outcome:** The labyrinth appears to recognize the adventurer the
player made, while authorship of that character remains with the player.

**Owner boundary:** AI/provider settings remain hidden and outside normal play.
This item defines the policy/input/output contract only; broad procedural quest
or dungeon generation is a separate future capability.

**Acceptance:**
- [ ] Only a rule-selected existing character can be referenced, and user-authored fields are bounded/sanitized before entering a prompt.
- [ ] Rejected, unavailable, or malformed narration falls back silently to authored copy with identical canonical state.
- [ ] Gate tests prove the narrator cannot speak as a PC, select an action, award items, alter HP, or change position.
- [ ] Browser evidence shows the correct subject art and controller-controlled message advance without exposing AI terminology.

**Past trouble:** AI settings exposed to players; AI treated as canonical state;
translated-sounding prose; narration speaking for player characters.

## Review Baseline

- Use 1920x1080 as the primary desktop presentation target.
- Keep 1280x720 as the minimum no-overlap, no-scroll controller Gate.
- Verify through normal browser play. Debug routes are diagnostic and headless
  proves engine reachability only.
- A passing route is not visual acceptance. Review enemy readability, Japanese
  layout, focus truth, transition rhythm, and screenshots.
- Give one implementer ownership of a player-facing slice and use an independent
  browser verifier before acceptance.

## Next Improvement Rule

Add a new numbered item only for a concrete reproduced defect. Record category,
evidence, expected player-visible outcome, owner boundary, acceptance checks,
browser route, and the past-trouble regression most likely to recur. Do not
reopen an archived item merely because a later defect appears on the same screen.
