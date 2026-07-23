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

## 7. Advanced vocations: authored synthesis, not stat upgrades

Advanced vocations are the reward for accumulated training. They must be more
tempting than an ordinary lateral vocation change because they open a play
pattern, not because they add a larger number to the stat sheet.

Every advanced vocation needs all of the following:

- one active **signature mechanism** that changes a meaningful decision;
- two to four exclusive techniques or spells that use that mechanism;
- a clear bridge between two or three mastered basic disciplines;
- a positive equipment, resource, or formation expression; and
- a bounded loadout trade-off so mastering it never means equipping every
  technique learned in the campaign.

Basic classes remain viable. An advanced vocation is a focused destination, not
a mandatory replacement, and no normal route may require one.

### Two-discipline advanced vocations

Two-discipline vocations are the first major synthesis. They normally require
meaningful mastery in two basics and offer a new interaction between them.
Candidate families include:

| Foundations | Advanced direction | Signature play pattern |
| --- | --- | --- |
| Warrior + Knight | fortress guard | intercept attacks, then answer with a shielded counter |
| Warrior + Swordmaster | war master | convert stance changes into chained weapon skills |
| Warrior + Thief | raider | opening ambush followed by a controlled withdrawal |
| Warrior + Priest | holy warrior | spend offence to protect or restore a threatened ally |
| Warrior + Chanter | banner captain | turn successful attacks into short party-wide momentum buffs |
| Warrior + Mage | spellblade | mark a foe with steel, then discharge an elemental technique |
| Warrior + Occultist | ash berserker | trade safety for controlled fear, pressure, or life-drain effects |
| Knight + Priest | paladin | cover an ally and carry their ward or ailment away |
| Knight + Chanter | warder | maintain a defensive field over a row or the whole party |
| Knight + Mage | rune knight | prepare defensive runes that answer a named threat or element |
| Knight + Occultist | dark knight | convert a ward or received hit into a controlled curse |
| Swordmaster + Thief | ninja | evade, exploit an opening, and handle ordinary locks/traps |
| Swordmaster + Mage | magic swordsman | choose a weapon stance that alters the next spell or strike |
| Swordmaster + Occultist | hexblade | turn precision hits into debuffs instead of raw damage alone |
| Thief + Priest | relic hunter | identify cursed treasure and convert danger into limited aid |
| Thief + Chanter | trickster | disrupt enemy intent and create safe escape windows |
| Thief + Mage | arcane thief | open magical seals and use prepared one-shot spell tools efficiently |
| Thief + Occultist | assassin | exploit sleeping, feared, or weakened targets |
| Priest + Chanter | hierophant | chain cure, ward, and recovery across the party |
| Priest + Mage | sage | analyse enemies and turn elemental knowledge into healing or resistance |
| Priest + Occultist | exorcist | purge curses and punish afflicted enemies |
| Chanter + Mage | elementalist | reshape party buffs into elemental protection or bursts |
| Chanter + Occultist | curse singer | apply debuffs that spread or change when a chant is maintained |
| Mage + Occultist | hexer | prepare control effects, then detonate or extend them with magic |

The labels above are directions, not mandatory final Japanese names. No entry
ships until its signature mechanism exists in deterministic rules and has a
distinct combat or exploration proof.

### Three-discipline high vocations

Three-discipline vocations are rare, authored capstones. They should require
one fully mastered foundation plus meaningful progress in two others, rather
than demanding complete mastery of three jobs. Their purpose is synthesis, not
another layer of passive stat inflation.

| Foundations | High-vocation direction | New decision it creates |
| --- | --- | --- |
| Warrior + Knight + Priest | sacred sentinel | decide whether a limited holy guard saves a member now or preserves the party later |
| Warrior + Swordmaster + Thief | battlefield shadow | choose between a lethal opening and preserving an escape route |
| Warrior + Mage + Occultist | ash reaver | layer elemental pressure and fear, then choose when to consume the setup |
| Knight + Priest + Chanter | grand guardian | allocate a finite sanctuary between rows, ailments, and an emergency recovery |
| Knight + Mage + Occultist | rune warden | predict an enemy pattern, inscribe a counter, and accept the risk of choosing wrong |
| Thief + Mage + Occultist | night weaver | trade scarce preparation for control of seals, secrets, and enemy actions |
| Thief + Priest + Chanter | reliquary keeper | decide whether a relic's limited blessing solves exploration danger or protects the next battle |
| Priest + Chanter + Mage | oracle | convert observation into party protection or a costly, precise magical answer |
| Priest + Chanter + Occultist | spirit guide | redirect fear and curses between allies, enemies, and expendable wards |
| Mage + Chanter + Occultist | astral cantor | sustain a field that can become damage, control, or resistance, but not all three |

These are a deliberately authored catalog, not all 28 pairs and 56 triples.
The target is enough tempting, different destinations to reward experimentation
without flooding the player with empty class names. A world may author its own
advanced vocations through the normalized vocation data only after the
underlying technique ids and rules exist.

### 7A. Audit and the adopted roster (2026-07-21)

**Audit finding.** All twelve advanced vocations shipped in the two worlds are, at the
rules level, a stat block. Each carries `statModifiers`, a prerequisite pair, and a
`signature` sentence — and grants a technique its parent classes already teach (three of
them the *same* `power-strike`). None has the one active signature mechanism §7 requires,
and none grants a technique a basic class does not. A stat modifier and a signature
sentence is not an implementation.

That grant is also *redundant*: reaching an advanced vocation means mastering both parents,
so the adopter has already learned both parents' lines (§6, the learned set is a union). An
advanced vocation can therefore only add value through an EXCLUSIVE technique — one no basic
class teaches — which is 7B's work. Until then the honest state of the roster is:
prerequisites + stat profile + a named mechanism awaiting its techniques. The reused grants
are removed rather than left to imply an implementation that is not there.

**The adopted roster.** The twelve are kept — their art shipped (P21) and their pair graph
is already legal (every basic class opens at least one destination, none gates all). Each is
now bound to one §7 direction and one signature mechanism 7B will implement as 2–4 exclusive
techniques:

| Vocation | Pair | §7 direction | Signature mechanism (7B implements) |
| --- | --- | --- | --- |
| 灰の刃 ash-reaver | Warrior+Swordmaster | war master | a **stance** self-buff whose follow-up strike chains harder off it |
| 塩の守り手 salt-warden | Knight+Priest | paladin | **cover** an ally, then a shielded restore that heals the one covered |
| 星の信徒 star-votary | Occultist+Mage | hexer | **detonate**: bonus damage to a pack already afflicted, spending the status |
| 針舞い needle-dancer | Swordmaster+Thief | ninja | an **evasion** window that converts a dodged blow into a guaranteed opening |
| 塵路師 dust-ranger | Thief+Mage | arcane thief | mark **distance**: a ranged strike that grows the longer a foe is untouched |
| 灯巡り candle-pilgrim | Chanter+Thief | trickster | a **ward that also buys a withdrawal** — keep the light, keep the way out |
| 茨砕き briar-reaver | Warrior+Knight | fortress guard | **intercept**, then a shielded counter that sunders what it blocked |
| 樹皮守 bark-keeper | Knight+Chanter | warder | a maintained **defensive field** over a row that decays if not re-sung |
| 露刃 dewblade | Swordmaster+Thief | ninja (grove) | precision from concealment: a first-strike bonus while unhit |
| 梢読み canopy-reader | Thief+Chanter | trickster (grove) | read intent: pre-empt an enemy's telegraphed action with a debuff |
| 樹液結び sap-binder | Priest+Mage | sage | convert an enemy's element read into a matched heal or resistance |
| 胞子見 spore-seer | Occultist+Thief | assassin | exploit the afflicted: a strike amplified against sleeping/feared targets |

**Two rules gaps 7B must close before those mechanisms are real** (surfaced by this audit,
not yet built — the technique model from §9.4 does not carry them):

1. **Exploration proficiency does not persist through mastery.** `trapSkill` /
   `resolveAttempt` read `classProficiency(character.classId, …)` — the *current* base class
   only. A ninja who mastered Thief but whose base class is Swordmaster does not inherit
   Thief's disarm/unlock specialism, which contradicts §6 ("earned proficiencies always
   persist"). 7B must make exploration proficiency aggregate over mastered vocations (and
   port it to Godot to keep parity) before any exploration-bridge vocation delivers its
   promise.
2. **The technique model has no conditional / detonate effect.** `damage` cannot read a
   target's status, so hexer/assassin's "amplified against the afflicted" and star-votary's
   detonate are unexpressible today. 7B adds the primitive with the technique that needs it.

### 7B. The exclusive signatures, built (2026-07-21)

Both rules gaps above are closed. Gap 1: `characterProficiency` (`chests.ts`, ported to
`exploration.gd`) aggregates a character's exploration proficiency over their current class **and every
basic class they have mastered**, so a mastered-Thief keeps the disarm/unlock specialism — the
`mastered-explorer` parity trace proves Godot matches. Gap 2: the `damage.bonusVsStatus` primitive
(detonate when `consume`, exploit otherwise), ported to `combat_round.gd` and proven by the `detonate`
trace.

**All twelve advanced vocations now grant one exclusive signature technique** — never a re-granted
parent technique (§7A forbids that), each a distinct COMBINATION of §9.4 primitives under one target
scope, so the vocation opens a play pattern rather than a bigger stat line (§7):

| Vocation | Exclusive technique | Combination |
| --- | --- | --- |
| 灰の刃 ash-reaver | `ash-stance` | self buff: damage + accuracy (the banked stance) |
| 塩の守り手 salt-warden | `sheltering-prayer` | self: cover + a scaling restore |
| 星の信徒 star-votary | `star-nova` | fire damage, detonate (consumes the status) |
| 針舞い needle-dancer | `needle-flurry` | self buff: evasion + accuracy (dodge into opening) |
| 塵路師 dust-ranger | `dust-volley` | enemy group: physical burst + accuracy debuff |
| 灯巡り candle-pilgrim | `candle-ward` | party: fear/sleep ward + evasion (the withdrawal) |
| 茨砕き briar-reaver | `thorn-guard` | self: cover + attack buff (the braced counter) |
| 樹皮守 bark-keeper | `bark-field` | party: armour buff + fire ward, decays (rounds, re-sung) |
| 露刃 dewblade | `dew-cut` | enemy group: heavy physical cut + speed debuff |
| 梢読み canopy-reader | `canopy-read` | enemy group: accuracy + damage debuff (pre-empt) |
| 樹液結び sap-binder | `sap-weave` | party: scaling heal + fire ward (read and match) |
| 胞子見 spore-seer | `spore-burst` | physical damage, exploit (does not consume) |

Guards: `advancedVocations.test.ts` locks the whole-roster contract (one exclusive apiece, in the
catalog, taught by no basic class, twelve distinct) **and** a falsifiable behavioural proof that every
effect of a self / party / enemy technique lands (guarding against a second effect silently no-oping
because its natural scope differs from the technique's). The combined effects reuse only primitives the
`technique-families` and `detonate` parity traces already prove, so the catalog re-export keeps Godot
parity at 33/33 without a new trace per vocation.

## 8. Proficiency and item model

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

## 9. Required remediation of the existing implementation

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

## 10. Completion proof

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
