# Black Stela — Class, Ability, and Party-Coverage Design Rules

Status: **design authority for the next class-system revision**. This document
supersedes the assumption that the existing twelve basic classes are a fixed
player-facing taxonomy. It does not weaken the TypeScript-oracle, scenario-data,
or save/parity boundaries in `docs/architecture.md`.

## 1. Product promise

Making an adventurer is making a member of a six-person expedition, not filling
out an administrative form. A class must be recognisable before its lore is
read, and its promise must be felt in combat and exploration after registration.

Black Stela does **not** require one prescribed party. A specialist makes an
action safe, efficient, and capable at high difficulty; a different class or a
well-stocked party can still cover a gap at a cost. The player learns that in
the expedition, not from an always-on coverage grade in the guild.

## 2. Non-negotiable rules

1. **A class is a rules identity, not a label.** Every selectable class needs a
   combat action or spell family, an exploration proficiency or clearly stated
   absence of one, equipment/row consequences, and an observable weakness.
   A stat line, initial equipment, flavour copy, or `roleTags` alone does not
   justify a class.
2. **Use legible archetypes first.** Do not invent opaque names to simulate
   originality. Familiar anchors such as warrior, knight, thief, priest, mage,
   and illusionist let the player form an expectation; Black Stela's voice lives
   in the Japanese job description, portrait, gear, techniques, and world
   context.
3. **No hard composition locks.** Never make a class the only way to advance a
   normal route. Use three levels of access: `untrained`, `trained`, and
   `specialist`. Specialists safely handle high difficulty and yield better
   information; others can attempt ordinary work with lower odds, more cost, or
   less information.
4. **Items are valid answers.** Potions, antidotes, wards, scrolls, tools, and
   throwables may cover absent roles. Their limits are price, inventory space,
   consumption, turn cost, effect ceiling, or risk -- not an arbitrary refusal
   to let the player try.
5. **Secondary coverage is intentional.** A support/debuff class may have a
   small heal; a martial class may use a ward item; a future ninja may handle
   ordinary locks. Borrowed access must stop below the specialist's high-value
   techniques and difficult checks.
6. **No roster lecture.** Guild UI may show what an individual can do now and
   later, but it must not rate, shame, or prescribe the party. Trial, error,
   attrition, and a prepared bag are part of the DRPG.
7. **The rules oracle changes first.** TypeScript defines classes, abilities,
   proficiency checks, events, saves, and traces. Godot consumes exported data
   and parity-ports the rules; it must not invent a second class taxonomy or
   class-only scene behaviour.
8. **Changing vocation adds history; it does not erase a character.** A change
   of vocation must never silently delete learned techniques, force-equipped
   gear off, erase exploration access already earned, or make a developed
   adventurer substantially worse than their starting discipline. The active
   vocation changes the build's focus; mastery widens its options.

## 3. Current-state finding

The former catalog has twelve labels but only four shared abilities (`heal`,
`firebolt`, `sleep`, and `power-strike`). `seeker`, `scout`, and `cutpurse`
share the same trap-specialist bonus. Several other distinctions are only
stats, equipment, or prose. That is not enough to make separate classes.

Do not hide this gap with class-card art, unusual Japanese names, English
subtitles, raw role tags, or a larger character-creation screen.

## 4. Recommended basic roster

This is the working target to implement and balance before adding further base
classes. Exact Japanese in-world wording can vary by scenario, but its player
meaning cannot.

| Class | Current source | Primary promise | Secondary coverage |
| --- | --- | --- | --- |
| Warrior | vanguard + sellsword | reliable front damage and weapon skills | simple defence / item wards |
| Knight | bulwark | cover, defence, formation stability | front damage and resistance items |
| Swordmaster | duelist | precision, stance, single-target finish | evasive self-protection |
| Thief | seeker + scout + cutpurse | traps, locks, secrets, escape tools | skirmish damage |
| Priest | mender | healing, cures, purification | simple wards |
| Chanter | chanter | party wards, buffs, ailment defence | small emergency healing |
| Mage | arcanist | elemental and group damage | low-tier analysis / scroll use |
| Occultist | occultist | sleep, fear, accuracy/defence disruption | small emergency recovery or drains |

`wayfinder` and `sellsword` are better represented as backgrounds, epithets,
or later learned techniques than as separate base classes. A Ninja is not added
merely by renaming Scout: it needs a distinct, implemented stealth/initiative/
evasion/escape identity before it is selectable.

## 5. Ability families and growth

One spell per class is not a class system. Each base class needs a small,
readable growth line: normally two or three usable choices at creation and
roughly six to ten techniques across the intended level range. The loadout
remains bounded so combat commands stay legible.

- **Weapon skills:** Warrior, Knight, and Swordmaster have different resource
  spends and target profiles -- heavy pressure, protection, and precision --
  rather than three copies of Attack.
- **Thief techniques:** investigation, disarm, unlock, secret detection, and
  escape form one exploration family; combat tools support that identity rather
  than replace it.
- **Priest arts:** recovery, poison/sleep cure, purification, and later larger
  recovery.
- **Chants:** wards, buffs, resistance, and debuff removal, with a deliberately
  weaker emergency heal.
- **Mage arts:** single-target and group elemental attacks plus analysis or
  utility.
- **Occult arts:** sleep, fear, silence, accuracy/defence weakening, and a
  limited survival tool. Mage damage and Occult control must not be duplicated.

The desired structure takes Wizardry's readable spell families and level bands,
then gives each class an Etrian-style reason to occupy a party slot. It does not
require an opaque, universal skill tree.

## 6. Vocation change: accumulation with a bounded loadout

Starting class is the adventurer's first discipline and visual/biographical
anchor. Vocation is training they acquire during the campaign. A character has
three distinct layers:

| Layer | Meaning | What persists on a change |
| --- | --- | --- |
| Starting discipline | original class, baseline growth, starting gear and identity | always |
| Mastered vocations | training history, learned techniques, earned proficiencies | always |
| Active vocation | the current signature, positive focus, and recommended combat set | changes |

Changing vocation is therefore a sideways or upward build decision, not a
respec punishment. It may change which positive signature is active, but it
must not remove the character's permanent baseline or invalidate gear they were
already legitimately using. A new vocation starts with its basic identity and
grows into its stronger techniques through mastery; it does not make the player
re-earn their existing character.

Power is kept from becoming "every job at once" by a bounded combat loadout,
technique costs, equipment choices, and a limited number of active signature
effects -- not by deleting learned spells or imposing a crippling stat reset.
Cross-trained low-tier techniques and item use are valid ways to form unusual
parties. A specialist still wins through stronger techniques, deeper
proficiency, better efficiency, and high-difficulty access.

## 7. Proficiency and item model

Rules should model the action, not ask whether a class id has permission.

```ts
type Proficiency = "untrained" | "trained" | "specialist";

type ClassCapabilities = {
  combatTechniques: TechniqueId[];
  exploration: Partial<Record<ExplorationAction, Proficiency>>;
  equipmentProfile: EquipmentProfile;
  rowPreference: "front" | "back";
};
```

For example, anyone may inspect a chest; a trained character can handle a
normal lock or trap; a specialist identifies its kind, attempts high difficulty,
and mitigates failure. The chest command must identify the acting adventurer so
the player sees who took the risk. Auto-selecting a hidden "best handler" is
not a substitute for class identity.

Items provide lower-tier or one-shot access: recovery/antidote items, ward
charms, elemental throwables, scrolls, lock tools, and trap protection. Their
limits preserve class value without turning an absent class into a dead end.

## 8. Required remediation of the existing implementation

Do this in the stated order. Do not begin by rebuilding `godot/scripts/guild.gd`.

1. **TypeScript rules and data:** Replace the current class catalog's
   explanatory `roleTags` as the class contract with explicit combat techniques
   and exploration proficiencies. Expand `src/domain/spells.ts` into a
   data-driven technique catalog that can represent healing, cure, ward, buff,
   debuff, target scope, duration, and resource cost. Keep the existing bounded
   vocation loadout concept.
2. **Deterministic commands:** Make chest/trap/lock/secret resolution use the
   declared actor and proficiency, rather than silently calling
   `selectTrapHandler`. Add typed events that record actor id, action, result,
   difficulty band, and item consumed where relevant. All normal routes retain
   an untrained and item-based attempt.
3. **Class consolidation and vocation semantics:** Introduce the target classes
   and migrate the old ids deliberately. Separate permanent starting discipline,
   mastered-vocation history, and active-vocation focus. Change the current
   basic-vocation path so it cannot discard learned techniques, exploration
   access, or legitimately equipped gear through a stat reset. Update
   prerequisites, equipment permissions, starter templates, localization,
   tests, traces, and any saved character fixture together. Never remap an
   existing save silently without a versioned migration and a documented
   mapping.
4. **Content and balance:** Add the item alternatives and technique families to
   the TypeScript-authoritative catalogs/world packs. Simulate varied parties:
   specialist present, secondary coverage, item-only coverage, and no useful
   coverage. No one basic class may become compulsory for every viable party.
5. **Godot parity:** Export the revised engine data and traces, then port the
   same rule modules and events. Remove class-specific hard-coded lists and
   portrait fallbacks that collapse distinct jobs. Godot scenes render exported
   class data and submit commands; they do not choose hidden handlers or define
   class effects.
6. **Player surface last:** Rebuild the guild only once the above is green. It
   is a staged, controller-first ceremony: choose a class from a bounded list,
   read its immediate and future promise, see portrait/gear/3+3 formation, then
   choose background, temperament, identity, and registration. Do not expose
   English aliases, raw tags, coverage scores, or a data-entry grid.

## 9. Completion proof

The class revision is not done until all of the following are true:

- Every selectable class has deterministic tests for one distinctive combat
  outcome and one exploration or explicitly documented non-exploration role.
- Tests prove a specialist, a secondary class, and an item-only party can each
  resolve representative recovery, ward/status, and trap/lock problems with
  different cost, risk, or ceiling.
- A vocation-change trace proves that level, learned techniques, prior
  exploration proficiency, and legitimately equipped gear survive; only the
  bounded active loadout and current positive focus change.
- TypeScript/Godot traces agree for every revised command and save migration.
- Browser evidence proves the guild's controller flow, Japanese layout, and
  visible class promise; it does not merely prove that a class id was stored.
- A party can depart without an "incomplete coverage" warning, while later play
  makes the trade-offs legible through outcomes.
