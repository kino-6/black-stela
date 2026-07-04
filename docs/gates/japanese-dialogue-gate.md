# Japanese Dialogue Gate

Use this gate for Japanese lines spoken by NPCs, system-facing characters, or
localized command guidance that is meant to sound like speech.

## Blocking Checks

- [ ] The line has a clear speaker, listener, and immediate intent.
- [ ] It sounds speakable when read aloud.
- [ ] It is not a UI procedure disguised as dialogue.
- [ ] It does not use stacked rhetorical clauses to explain multiple fields.
- [ ] It does not rely on fake gravitas, abstract nouns, or translated-English
  sentence shape.
- [ ] The UI, not the dialogue, carries mechanical detail where possible.

## Red Flags

- `名は最後でいい`, `どの才がまだ伸びるのか`, `それを見てから...`
  style phrasing that sounds written, not spoken.
- Dialogue names every creation step, stat, payment, or command.
- The line would sound strange if said aloud by a shopkeeper, guild master, or
  wounded adventurer.
- The line speaks to the player as a designer, not as someone in the world.

## Required Evidence

- [ ] Before/after prose diff for the changed line.
- [ ] Japanese browser or E2E assertion covers the changed copy.
- [ ] Regression check rejects at least one removed unnatural phrase when the
  issue is a repeated user-visible failure.
