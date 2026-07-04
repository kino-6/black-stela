# Scenario Prose Gate

This gate blocks player-facing prose that sounds translated, generic, or
expository. Apply it to town copy, room descriptions, event text, item text,
enemy text, records, and Japanese localization.

## Blocking Checks

- [ ] Japanese text is authored as natural Japanese, not a literal English
  sentence order.
- [ ] Normal room/town copy is one or two short sentences.
- [ ] The line contains at least one concrete scene object.
- [ ] The line contains a sensory, spatial, material, or motion cue.
- [ ] The line does not describe player-character thoughts, feelings, speech, or
  unapproved actions.
- [ ] The line does not explain the theme, game loop, UI purpose, or intended
  emotion.
- [ ] English and Japanese are equivalent scene localizations, not strict
  word-for-word translations.
- [ ] Spoken/service lines also pass
  [`japanese-dialogue-gate.md`](japanese-dialogue-gate.md).

## Red Flags

- Abstract nouns carry the line: story, fate, darkness, truth, mystery,
  adventure, legend.
- Personification is doing work that a prop, texture, sound, smell, or light
  should do.
- The sentence would fit any fantasy game if "Black Stela" were removed.
- The text tells the player what the party is supposed to feel.
- The line repeats information already visible in the first-person view or map.
- The Japanese reads as a calque: noun-heavy, passive, or "X waits for Y."
- NPC or service text sounds like written exposition instead of a person
  speaking in the scene.

## Required Evidence

- [ ] Prose diff includes before/after examples for at least one representative
  town line and one room/event line.
- [ ] Japanese UI or E2E check covers the changed copy.
- [ ] Scenario summary or content QA identifies prose fields that still need a
  pass.
- [ ] Reviewer note names which job each changed line serves: orientation, risk,
  reward, return, lock, enemy, or record.

## Source References

- Culture Agency, "公用文作成の考え方": reader-fit clarity and expression.
- Game Developer, "Narrative Design Tips I Wish I'd Known": keep game text lean
  and let other parts of the game carry story.
- Environmental storytelling references: use spatial/visual/audio cues and
  props to communicate story without exposition.
- Japanese fiction craft references: use concrete sensory detail and motion,
  not only visual description.
