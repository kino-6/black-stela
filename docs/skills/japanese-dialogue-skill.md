# Japanese Dialogue Skill

Use this skill before writing or revising Japanese speaker lines: guild master,
shopkeeper, inn, recovery, combat barks, warnings, and any localized line that
is meant to sound spoken.

## Goal

Dialogue should sound like someone in the scene is speaking to the player or
party now. It must not be written exposition, a UI checklist, or literary
summary with quote marks around it.

## Basis

- Culture Agency writing guidance separates purpose, reader, and situation.
  Spoken lines should fit the listener and scene, not just convey complete
  information.
- Natural dialogue is selective. Real speakers omit obvious context, use short
  turns, and speak to change the listener's next action.
- Narrative design connects story to moment-to-moment player experience. Game
  text should let UI, state, and player action carry part of the meaning.

## Dialogue Contract

- Name the speaker, listener, and immediate intent before writing.
- Use one conversational move: ask, warn, offer, refuse, test, or confirm.
- Keep the line short enough to say aloud without sounding like narration.
- Keep the displayed line short enough to wrap cleanly in its target message
  box. If the rendered line leaves a one-character orphan, rewrite it.
- Let surrounding UI carry procedure. Dialogue should not list every step.
- Prefer concrete spoken nouns and verbs: 腕, 出, 得意, 載せる, 払う, 戻れ.
- Use plain Japanese word order. If it reads like an essay, rewrite it.

## Rewrite Loop

1. Write the UI fact separately: class, origin, talent, name, payment, return.
2. Decide what the speaker wants from the player now.
3. Say only that, as a spoken line.
4. Read it aloud once. If a person would not say it, cut or rephrase.
5. Check the target message box. If wrapping leaves one character alone or
   strands punctuation, rewrite for that box instead of accepting the wrap.
6. Delete stacked rhetorical lists such as `何で...、どこで...、どの...`.
7. Delete stagey wrap-up phrases such as `それを見てから帳面を開く`.
8. Put reusable lines in scenario/localization data where practical.

## Bad Patterns

- UI checklist: `職業を選び、来歴を決め、最後に名前を記せ。`
- Written exposition: `何で生き延び、どこで覚え、どの才が伸びるのか。`
- Fake gravitas: `黒碑の下へ降りるなら、名は最後でいい。`
- Overexplaining kindness: `迷うなら、炉端で杯を抱えている連中にも声は掛けられる。`

## Better Direction

- `潜る気か。なら、まず腕を見せてくれ。`
- `迷うようなら、こちらで見繕うか？`
- `治療はただじゃない。払える分だけだ。`

## Checks

- [ ] Would a person in this role say this aloud?
- [ ] Does the line speak to the player/party, not to the design document?
- [ ] Is there one intent, not a list of UI steps?
- [ ] Does it avoid fake literary symmetry and abstract noun chains?
- [ ] Can the UI still explain the mechanics without the line carrying them all?
- [ ] Does it wrap cleanly in the actual Japanese message box?
- [ ] Is it externalized or ready to externalize if reused across scenes?
