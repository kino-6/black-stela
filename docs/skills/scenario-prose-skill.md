# Scenario Prose Skill

Use this skill before writing or revising player-facing prose: town copy, room
descriptions, event text, item descriptions, enemy introductions, records, and
Japanese localization.

Start by using `docs/skills/black-stela-gate-review-skill.md`; it routes prose
work through the Past Trouble Regression Gate and Scenario Prose Gate.
For NPC/service spoken lines, also use
`docs/skills/japanese-dialogue-skill.md` and
`docs/gates/japanese-dialogue-gate.md`.

## Goal

Black Stela prose should feel written in Japanese first when shown in Japanese,
not like a literal English translation. The text should support play: mood,
orientation, risk, and memory, without telling the player what their characters
think or do.

## Source Basis

- Culture Agency guidance: write for the reader and use clear, audience-fit
  expression.
- Fiction craft guidance: use concrete sensory detail beyond sight; avoid static
  scenery when motion, sound, temperature, or texture can carry the scene.
- Game narrative guidance: keep player-facing text lean; let environment,
  props, layout, audio, and player action carry story instead of exposition.

## Voice Contract

- Tone: restrained, physical, cold, old, local to the room.
- Viewpoint: what the party can perceive now, not an omniscient explanation.
- Length: one or two short Japanese sentences for normal room/town copy.
- Content: one concrete object plus one sensory or spatial cue.
- Function: every line must help orientation, risk, mood, or memory.

## Writing Loop

1. Name the gameplay job: orient, warn, reward, return, lock, enemy, or record.
2. Pick one anchor object: stair, hook, dust, salt, chain, bowl, slab, lantern.
3. Add one sense beyond abstract sight: cold, dry, rasp, oil, ash, metal, stale
   air, pressure underfoot.
4. Add motion or tension only if it is visible or physically implied.
5. Cut any sentence that explains theme, destiny, story, courage, memory, or
   player-character emotion.
6. Read the Japanese aloud. If it sounds like translated English, rewrite from
   Japanese word order and image first.
7. For guild, shop, inn, and other service copy, do not list UI steps. Rewrite
   the same information as the speaker's job, test, warning, or offer inside
   the world.
8. If the line is spoken, pass the Japanese Dialogue Gate: speaker, listener,
   immediate intent, and read-aloud naturalness.

## Rewrite Pattern

Bad:

> ギルドホールの灯は低く燃えている。古い黒い石碑の下へ続く階段は、物語を持ち帰れる隊列を待っている。

Problems:

- "物語を持ち帰れる隊列" explains theme instead of showing place.
- The stair "waits" in an English-like personification.
- The line says what the game wants the player to feel.

Better direction:

> ギルドの灯は油を切らし、石床に短く揺れている。黒碑の下り口から、冷えた土の匂いが上がる。

Why:

- Concrete: oil, stone floor, descent, cold soil.
- Physical: light motion and smell.
- No claim about the player character's story or feelings.

## Ban List

- Abstract destiny words: 物語, 運命, 伝説, 英雄, 真実, 闇の秘密.
- Translation-tinted phrases: 〜を待っている, 〜することになる, 〜の下へ続く.
- Player-character interiority: 決意する, 恐れる, 勇気を出す, 胸が高鳴る.
- Explaining the game loop: 帰還できる, 記録を残す, 冒険が始まる.
- UI-step narration in costume: 職業を選び, ボーナスポイントを振り分け,
  最後に名前を決める.
- Written lines pretending to be speech: 名は最後でいい, どの才がまだ伸びる,
  それを見てから帳面を開く.
- Overfamiliar fantasy fillers: 古の, 神秘的な, 禍々しい, 静寂が支配する.

## Checks

- [ ] Is the line natural Japanese, not English syntax with Japanese words?
- [ ] Does it include a concrete object visible or implied in the scene?
- [ ] Does it include a sensory/spatial cue?
- [ ] Does it avoid speaking for player characters?
- [ ] Does it avoid explaining theme or UI function?
- [ ] Is it short enough to read during play?
- [ ] Does the English version localize the same scene rather than force the
  Japanese into a literal translation?
