# Combat Plan

Design intent for Black Stela's battle system. The bar we are clearing: a
Famicom-era DRPG (Dragon Quest 1 / Wizardry NES) and then some. Decided
direction: **deep** — growth + MP magic + status ailments + elements/weakness +
criticals + enemy AI variety.

## Where we are (and why it's thin)

Current combat (`declareRound` in `rulesEngine.ts`):

- Commands: attack (accuracy roll → damage `min..max − armor`), defend (+2 armor
  ward for one round), use_item (heal), cast.
- `cast` is a **single hard-coded "sleep"** — no MP, no spell list.
- Enemies just pick a target and swing; a lethal hit "wounds" a character (HP 1
  + injury) rather than killing.

The core gaps that put it below Famicom:

1. **No growth.** XP accrues on `Character.xp` but there is *no* level-up logic
   anywhere — defeating enemies never makes the party stronger.
2. **No real magic.** No `mp`, no spell catalog, no per-class spells. Caster
   classes (mender, chanter, occultist…) do nothing special in a fight.
3. **Status/elements unused.** `CombatStatus` (poison/fear/silence/sleep/ward)
   and `resistance(s)` fields exist in the types but only sleep/ward are wired.
   No elements, weaknesses, or criticals.
4. **Flat enemy behaviour.** Every enemy just attacks.

Latent infrastructure we can build on: the `CombatStatus` union, the
`resistance?`/`resistances?` fields on characters and enemies, group-based
targeting, and deterministic seeded rolls (`rollPercent`/`rollDamage`).

## Target systems

- **Growth.** `Character.level` (start 1) + an XP curve. On victory, XP is
  shared (already), then level-ups apply class/aptitude-scaled stat gains (HP,
  MP, attack, damage, accuracy, armour, speed) and unlock spells. HP/MP refresh
  on level-up.
- **MP + spells/skills.** `mp`/`maxMp` + a spell catalog (id, MP cost, target
  shape, effect: damage{element}/heal/status/buff). Spells are learned on a
  per-class level schedule (derived, not saved). `cast` becomes generic; MP is
  restored at rest points / town recovery like HP.
- **Status ailments.** Wire the existing `CombatStatus` set: poison (damage over
  time), sleep (skip turn — extend to the party), silence (blocks casting),
  fear (accuracy/participation penalty), ward (defend). Apply per-round ticks
  and roll against `resistance(s)`.
- **Elements & weakness & criticals.** Element tags on attacks/spells
  (physical/fire/ice/…); enemy weakness/resist multipliers; a crit chance
  (luck-driven) for bonus damage.
- **Enemy AI variety.** Enemies gain optional spells/behaviours (attacker,
  caster, ailment-slinger, fleer); a small AI picks an action each turn.

## Implementation slices (build up; suite green after each)

1. **Growth foundation.** `level` field + XP-threshold curve +
   `src/domain/leveling.ts` (`xpForLevel`, `applyLevelUps`) + level-up on
   victory with stat growth + `character_leveled_up` event/log + level shown in
   the party HUD. No magic yet.
2. **MP + spell system.** `mp`/`maxMp`, spell catalog + per-class learn table,
   generic `cast` (heal / damage / sleep) with MP cost, MP restore on rest/town,
   spell menu + targeting UI.
3. **Status ailments.** Poison/silence/fear + party sleep, per-round ticks and
   resist rolls; enemies can inflict them.
4. **Elements + weakness + criticals.** Element tags + enemy weakness/resist
   multipliers + crit chance.
5. **Enemy AI variety.** Enemy spell/behaviour data + an action-selection AI.

Guardrails: deterministic seeded rolls stay deterministic (tests depend on it);
each slice is one focused commit kept green (unit + e2e); balance numbers are
first-pass and explicitly tunable.
