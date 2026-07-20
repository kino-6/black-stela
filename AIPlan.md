# Black Stela AI Scenario + GM Plan

Status: Proposed

> **Godot migration handoff:** This document owns the product promise and
> authority model. During the active migration, implementation boundaries,
> M3 requirements, target modules, parity rules, and a concrete JSON exchange
> are defined in
> [`docs/design/ai-godot-migration-contract.md`](docs/design/ai-godot-migration-contract.md).
> M3 does not implement live AI; it preserves the event and export seams that
> the later concept slice requires.

## Product promise

Black Stela is a controller-first grid DRPG in which the player brings authored
adventurers into an external scenario prepared with AI assistance. The AI has
two distinct time boundaries: before play it helps build and validate a scenario
pack; during play it acts as a bounded reactive game master when the local
provider is available. These are co-equal product pillars, not alternatives.
The labyrinth, combat, checks, rewards, and saves remain deterministic.

The intended feeling is not "a DRPG with generated flavor text." It is:

> My party entered a mechanically real labyrinth; the game master recognized
> these adventurers, reacted to what they had done, and the world remembered the
> choice they made.

## Why validate it now

The repository now has enough of the DRPG loop to test the concept: six-person
party creation, a continuous-grid dungeon, combat, return, town services,
portable adventurers, canonical events, roster memory, scenario switching, and
Default/Verdant world packs.

The AI side is not yet a product experience:

- `NarratorService` and provider health/guard tests exist, but normal play does
  not request and present live narration.
- The current contract permits non-canonical prose only. It cannot create a
  consequential TRPG scene.
- GM-aware subject selection can safely expose bounded identity and deeds, but
  it is not connected to a scene loop.
- Built-in and debug-imported world packs are playable, but NPC knowledge,
  storylets, GM moves, checks, and continuity memory are not externalized.
- `rules.md` says `ai_default: disabled` while new `GameState` sets
  `aiEnabled: true`; the concept lane must establish one authoritative policy.

Finishing every DRPG subsystem before testing the product premise would defer
the highest-risk question: whether a generated, party-aware scenario is
enjoyable. The safest first proof is generation before play. Runtime AI can then
be layered onto that validated base in the same concept milestone.

## Recommended strategy: compile first, improvise later

Use three capability levels. The order below is an implementation dependency,
not a product-priority ranking:

1. **Scenario compiler (foundation):** AI turns a premise and optional party dossier
   into a complete external pack before play. The pack must pass the same parser,
   structural Gates, simulations, and browser proof as a human-authored pack.
2. **Expedition preparation (bridge):** before departure, AI selects and
   configures already-authored storylets for the current party, then freezes the
   resulting session plan. Play remains deterministic.
3. **Runtime GM (realtime pillar):** AI reacts to current play, varies
   scene framing and NPC responses, selects among eligible authored GM moves,
   and eventually maps optional free intent to an authorized intent. It never
   creates unchecked rules content in a live save.

This avoids a model inventing a door, reward, enemy, or rule while the player is
waiting. It also makes failures repairable before they become player-visible.
The generated pack can be inspected, versioned, shared, replayed, and loaded by
React or Godot without either runtime knowing which model prepared it.

Generation runs in a separate **Scenario Forge** authoring process. Normal play
shows only frozen packs in the scenario library; it does not expose prompts,
model names, repair logs, or provider settings. Local generation is the default
product path. A different authoring provider may be supported later without
changing the pack or runtime contracts.

## Realtime GM promise

Realtime play is where the TRPG quality becomes visible. It remains in the
product plan with the following bounded freedoms:

- notice the current location, danger, recent canonical events, injuries,
  established deeds, NPC knowledge, and unresolved story threads;
- decide when an eligible authored storylet deserves emphasis, within cadence
  and repetition budgets;
- frame a scene differently for the current party and choose an established
  adventurer as its subject without inventing that character's feelings;
- answer questions through an NPC's declared knowledge and admit uncertainty
  outside it;
- vary rumors, reactions, warnings, discoveries, and return commentary;
- interpret optional text or voice input into scenario-authorized intents,
  asking for clarification when no safe mapping exists;
- carry accepted outcomes forward through canonical `GmMemory`.

It may not alter the map, mint rewards, set difficulty, choose PC actions, or
apply effects directly. Runtime AI creates immediacy and responsiveness; the
scenario pack and adjudicator define what can become true.

Provider failure is a resilience case, not the intended presentation. Authored
fallbacks keep the run playable, while a healthy local provider supplies the
reactive layer without exposing setup controls during normal play.

## Authority model

| Layer | Owns | Must not own |
| --- | --- | --- |
| AI scenario author | Premise expansion, world bible, catalog drafts, room purposes, NPC/storylet drafts, prose and asset briefs | Runtime state, final ids, unchecked topology, direct pack publication |
| Scenario compiler | Stable ids, schema-compliant files, deterministic map/template expansion, normalized export | Creative prose or live game state |
| Scenario pack | NPC facts, storylets, available intents, checks, consequences, fallback copy, GM voice | Runtime state |
| Deterministic rules | State transitions, checks, combat, inventory, flags, rewards, accepted memory | Generated prose |
| AI GM | Scene framing, NPC reaction wording, selection among allowed GM moves, mapping optional free intent to an allowed intent | Direct `GameState` mutation, PC speech/actions, new rewards/exits/enemies |
| Presentation | Controller choices, scene staging, portraits, messages, confirm/cancel | Hidden truth or provider configuration |

AI output is a typed proposal, not a command and not a state patch. A
deterministic `GmAdjudicator` validates its ids against the active world pack.
Only a player-confirmed intent becomes a normal canonical command/event. The
accepted intent, check result, and consequence are saved; generated wording is
replaceable presentation.

## First concept slice

Generate a small **compiler proof pack** first, then use its strongest 15-20
minute route as the concept slice. A one-floor proof is acceptable for compiler
development but is not a product scenario; a publishable Black Stela scenario
still targets 6-8 substantial floors.

1. The player supplies a premise and either an existing party dossier or a
   declared starting-party profile.
2. AI produces a scenario blueprint; deterministic tooling compiles, validates,
   repairs, and freezes an importable pack.
3. In town, an authored NPC gives a short lead relevant to the generated world.
4. In the labyrinth, a visible current-cell event opens a GM scene instead of
   adding prose to the adventure log.
5. The scene frames the situation and may identify one rule-selected adventurer
   by an established title, background, condition, or deed.
6. A stable command window offers two or three scenario-authored intents such
   as inspect, parley, use a specialty, withdraw, or fight.
7. The player chooses. Rules perform any aptitude/resource check and emit typed
   events; the AI never decides success.
8. On return, the NPC or records surface recalls the accepted choice and its
   consequence.
9. With the runtime provider unavailable, frozen fallback framing and the same
   intents complete the identical route.

The first slice deliberately excludes open-ended chat. Generated menu wording
may vary, but intent ids and consequences do not. Optional typed or spoken free
intent is a later experiment after the bounded loop proves fun.

## Concrete output example: Verdant

This example extends Verdant with a generated shallow-floor storylet. The ids
and data shape are illustrative target contracts; the current parser does not
yet support `storylets.md` or `npcs.md`.

### 1. Scenario Forge brief

```yaml
baseWorld: world.verdant
title: 根が息をする場所
partyPolicy:
  useImportedAdventurers: true
  allowedFields: [name, title, classId, backgroundId, traitIds, condition, deeds]
scope:
  floors: 6
  conceptRouteMinutes: 20
themes: [水没した樹海, 胞子, 鉄による対処, 生きた迷宮]
forbidden:
  - PCの台詞や感情を決める
  - 未宣言の出口や報酬を作る
  - 火を常に正解として扱う
```

### 2. Generated blueprint fragment

```yaml
storylets:
  - key: breathing_root
    floorRole: onboarding
    roomPurpose: optional_risk_reward
    premise: 水面下の根が一定の間隔で膨らみ、通路の空気を奪っている
    requiredIntents: [withdraw]
    optionalIntents: [measure_breath, cut_with_metal, burn_growth]
    outcomes:
      measure_breath: reveal_authored_secret
      cut_with_metal: open_authored_shortcut
      burn_growth: start_authored_ambush
      withdraw: no_change
    returnMemory: grovekeeper_reacts_to_root_choice
```

The blueprint does not choose room ids, DC values, enemies, rewards, or map
coordinates. The compiler allocates those from declared budgets and validates
that the secret, shortcut, and ambush all exist before emitting the pack.

### 3. Compiled pack fragment

```yaml
storylets:
  - id: storylet.verdant.g1.breathing-root
    trigger:
      roomId: room.verdant.g1f.breathing-root
      once: true
    subjectPolicy: able_member_with_relevant_deed
    intents:
      - id: intent.verdant.measure-breath
        label:
          ja: 呼吸の間を測る
        eligibility:
          aptitude: wit
        check:
          aptitude: wit
          difficulty: 9
        success:
          - effect: reveal_secret
            targetId: secret.verdant.g1.root-vein
      - id: intent.verdant.cut-with-metal
        label:
          ja: 鉄器で脈を断つ
        eligibility:
          equippedElement: metal
        success:
          - effect: open_shortcut
            targetId: shortcut.verdant.g1.root-vein
      - id: intent.verdant.burn-growth
        label:
          ja: 火を入れる
        success:
          - effect: start_encounter
            targetId: encounter.verdant.g1.angry-spores
      - id: intent.verdant.withdraw
        label:
          ja: 手を出さず戻る
        mandatory: true
        success: []
```

The exact effect vocabulary and eligibility schema are Phase 0/1 work. The
important property is that every target already exists in the frozen pack and
the runtime AI cannot replace it.

### 4. Validation report

```text
Schema                         PASS
Cross references               PASS
G1F reachable cells            126
G1F cyclomatic loops           6
Entrance -> descent branches   4
Town return route              PASS
Storylet mandatory exit        PASS
Prepared-party simulation      PASS
Naive-party pressure           PASS
Japanese line-layout review    1 warning
Required assets                2 missing
Publishable                    NO
```

The candidate is parser-valid but not publishable until its Japanese warning
and two missing assets are resolved. This distinction prevents "parser passed"
from being reported as "scenario completed."

### 5. Runtime GM request

At the breathing root, the provider receives a bounded context resembling:

```json
{
  "storyletId": "storylet.verdant.g1.breathing-root",
  "visibleFacts": ["the root swells at regular intervals", "airflow stops while it swells"],
  "recentEvents": ["the party survived a spore encounter", "one member is poisoned"],
  "subject": {
    "id": "character.sei",
    "name": "セイ",
    "backgroundId": "scriptorium",
    "condition": "able",
    "deeds": ["花の番人を退けた"]
  },
  "eligibleIntentIds": [
    "intent.verdant.measure-breath",
    "intent.verdant.cut-with-metal",
    "intent.verdant.withdraw"
  ]
}
```

Hidden rooms, check results, reward values, private notes, and ineligible
`burn-growth` are absent.

### 6. Structured realtime proposal

```json
{
  "storyletId": "storylet.verdant.g1.breathing-root",
  "subjectId": "character.sei",
  "framing": "根が膨らむたび、樹洞の空気が止まる。セイの外套に残った胞子だけが、その脈に合わせて淡く明滅している。",
  "intentOrder": [
    "intent.verdant.measure-breath",
    "intent.verdant.cut-with-metal",
    "intent.verdant.withdraw"
  ],
  "continuityTags": ["noticed_breath_cycle"]
}
```

The player sees the framing followed by the three fixed command choices. The
rules, not the model, resolve the chosen check or effect.

### 7. How realtime output changes

The frozen storylet stays the same while the reaction reflects canonical state:

**First visit, no relevant deed**

> 根が膨らむたび、樹洞の空気が止まる。水面の泡も、同じ間隔で途切れている。

**After a spore fight, with an eligible subject**

> 根が膨らむたび、樹洞の空気が止まる。セイの外套に残った胞子だけが、その脈に合わせて淡く明滅している。

**Return to town after opening the shortcut**

> 森守は持ち帰った記録を確かめ、根脈の近道を地図へ加えた。「次からは、あの樹洞を迂回できる」

The last line is NPC speech grounded in an accepted outcome. The GM still does
not invent speech or intent for an adventurer.

### 8. Default equivalent

The same mechanics can be authored differently in Gate of Ash:

- location: B1F Warden's Hall and its stopped winch;
- facts: dry chain, capped shaft, sealed passage, strongbox in the gears;
- intents: inspect the gears, spend lantern oil, turn the winch, leave;
- outcomes: reveal the existing mechanism, open an authored shortcut, trigger
  an authored noise encounter, or leave unchanged;
- realtime reaction: mention a cartographer's established map work, a wounded
  member's condition, or the party's previous discovery without deciding what
  anyone thinks or does.

This proves Default and Verdant can share one GM/rules contract while producing
different scenes rather than recolored prose.

## External scenario contract

Extend each pack without putting scenario truth in React or Godot scenes:

- `blueprint.json`: generation intermediate; world premise, floor roles,
  factions, catalog budgets, story arcs, and selected layout patterns.
- `gm_style.md`: voice, cadence, forbidden habits, Japanese line limits.
- `npcs.md`: identity, role, public facts, goals, knowledge boundaries, portrait.
- `storylets.md`: triggers, eligibility, participants, allowed intent ids,
  deterministic checks/effects, fallback copy, cooldown/once rules.
- `rumors.md`: sourced claims with truth status and unlock conditions.
- `assets.md`: machine-readable basenames, roles, dimensions, variants, and
  allowed fallback policy for every required visual/audio asset.
- `manifest.md`: versioned references to these files and capability requirements.

Every storylet must include localized fallback text. Effects use a small
whitelist such as setting an authored flag, spending an item, starting an
authored encounter, revealing an authored fact, or granting an authored reward.
Unknown ids, undeclared effects, missing localization, and unreachable triggers
fail pack validation. A storylet can mark mandatory intents; the AI may reorder
or omit optional approaches, but it can never remove required fight, withdraw,
cancel, or other author-defined safety routes.

Existing `world.md`, `dungeons/*.md`, `items.md`, `enemies.md`,
`encounters.md`, `treasure.md`, `progression.md`, `quests.md`,
`vocations.md`, and `affixes.md` remain the shipping format. The blueprint is
not read by gameplay; it is provenance that lets the authoring loop explain and
repair its output.

`town.md`, `rules.md`, and `ai_style.md` currently exist but are not all consumed
by the pack loader as authoritative data. Phase 1 must either add them to the
manifest/parser or fold their fields into an already-authoritative file. Do not
leave decorative external files whose values the game silently ignores.

## Scenario generation pipeline

Do not ask one model call to emit an entire Markdown pack. Generate in dependency
order and make the compiler own syntax and identity:

1. **Brief:** premise, tone, supported locales, floor count, target play length,
   difficulty, allowed themes, party dossier policy, and asset budget.
2. **World blueprint:** cosmology, factions, town services, campaign question,
   6-8 floor roles, progression curve, and ending conditions.
3. **Topology:** AI selects declared layout patterns and room purposes;
   deterministic generators/templates create continuous grids, stable room ids,
   stairs, loops, return routes, secrets, and content sockets.
4. **Catalogs:** enemies, items, equipment, affixes, vocations, treasure,
   encounters, quests, NPCs, rumors, and storylets are drafted against compiler-
   supplied ids and budgets.
5. **Prose and art orders:** localized names/copy and asset briefs are generated
   only after facts and ids are frozen.
6. **Compile:** a serializer writes Markdown/YAML and a normalized JSON export.
7. **Validate and repair:** structured diagnostics are returned to the relevant
   generation stage; never silently coerce a broken reference or rule.
8. **Freeze:** version, schema version, generation provenance, content hash,
   required assets, and validation report are stored with the candidate pack.

### Validation ladder

Passing the parser is necessary, not sufficient:

1. **Syntax/schema:** Markdown front matter and Zod contracts parse.
2. **References:** every room, stair, enemy, item, table, flag, NPC, storylet,
   localization key, and asset basename resolves.
3. **Dungeon structure:** continuous grids, required density, loops, branches,
   visible stairs/returns, no unreachable content, no accidental node graph.
4. **Rules reachability:** deterministic probes can enter, descend, resolve
   required events, return, recover, and finish without debug commands.
5. **Balance/economy:** seeded simulations check attrition, preparation value,
   progression, rewards, shop prices, rare loot, and resource sinks.
6. **Content quality:** Japanese prose/line layout, repetition, NPC knowledge,
   story consistency, PC-agency rules, and genre vocabulary pass.
7. **Asset audit:** required portraits, enemies, facilities, objects, icons, and
   fallback assets exist with the declared contracts.
8. **Player proof:** controller-only browser/Godot play and screenshot review
   show that the pack is understandable and enjoyable.

A failed step produces machine-readable findings tied to source ids. The repair
loop regenerates only the failed layer; it does not rewrite a validated dungeon
because one item description was poor.

## Runtime contracts

### `GmPublicContext`

Built from canonical state and limited to the active scene: location, visible
facts, recent typed events, eligible NPC facts, allowed intents, and one
rule-selected adventurer's bounded identity/deeds. Private notes, hidden map
truth, undiscovered rewards, raw save data, and arbitrary prompt text are
excluded.

### `GmProposal`

Structured output contains only:

- storylet and subject ids already present in the request;
- concise framing and optional NPC reaction;
- an ordered subset of allowed intent ids;
- continuity tags drawn from the storylet's allowlist;
- prompt/schema/model metadata for diagnostics.

Free-form effects, commands, numeric rewards, map edits, and invented ids are
schema-invalid.

### `GmMemory`

Canonical memory records accepted facts, not model improvisation: storylet id,
chosen intent, check result, consequence event ids, involved NPC, involved
adventurer, and turn. It supports later reactions and replay while remaining
portable across React and Godot.

## Delivery phases

### Phase 0: Freeze the product contract

- Define `ScenarioBlueprint`, generation brief, validation report, and frozen
  pack provenance contracts.
- Resolve the `ai_default` contradiction: hidden local GM on by default when
  available, deterministic fallback always active, no normal-play provider UI.
- Freeze the line between authoring-time generation and runtime state.

Exit: one generated candidate can be described without naming React, Godot, or
a model.

### Phase 1: Close the external-pack schema

- Add manifest fields and parsers for town/rules/AI style, NPCs, storylets,
  rumors, machine-readable assets, and generation provenance.
- Remove or migrate duplicate non-authoritative fields such as the current
  `ai_default` split; one parsed source owns each rule.
- Add cross-reference, localization, trigger-reachability, and effect-whitelist
  validation.
- Export the normalized contract with the existing Godot world-pack JSON.

Exit: Default and Verdant each validate one equivalent storylet without code
changes.

### Phase 2: Build the deterministic scenario compiler

- Define the staged blueprint schemas and stable id allocator.
- Add topology templates/generators that satisfy the existing Dungeon Design
  Gate by construction.
- Serialize validated blueprints to the existing Markdown/YAML pack shape.
- Emit structured diagnostics and support layer-scoped repair.

Exit: a non-AI fixture blueprint compiles into a pack that the current import
path and Godot exporter both accept.

### Phase 3: Add AI scenario authoring

- Generate the brief and blueprint in bounded stages using current schemas,
  examples, Gates, and scenario bibles as retrieval context.
- Run the full validation ladder after compilation.
- Repair only failed layers under iteration/time budgets.
- Produce a review report that separates parser success from unresolved design,
  balance, prose, and asset findings.

Exit: AI can generate a compiler-proof pack repeatedly without manual YAML or id
repair. This still does not count as a publishable scenario.

### Phase 4: Generate and play the concept pack

- Generate one candidate with a 6-8-floor product blueprint while initially
  reviewing its strongest shallow-floor route.
- Create or bind the required assets from the frozen asset manifest.
- Install the frozen pack into a scenario library; use the existing debug import
  only as development proof, not as the final player-facing authoring workflow.
- Run deterministic reachability, combat/economy simulation, controller-only
  play, screenshots, and human review.
- Preserve the pack and its report so the same candidate can be replayed in
  React and Godot.

Exit: the player can finish the selected route and distinguish the generated
world from Default/Verdant without seeing authoring or AI controls.

### Phase 5: Build the bounded runtime GM pipeline

- Compile `GmPublicContext` from canonical state.
- Request structured output from the existing local provider adapters.
- Reject prompt injection, PC agency, unknown ids, hidden-fact leakage, and
  malformed output; use the authored fallback on any failure.
- Record developer diagnostics silently.

Exit: provider success, rejection, timeout, and absence all return a valid scene
proposal without changing `GameState`.

### Phase 6: Add deterministic adjudication and continuity

- Add explicit storylet intent commands and typed result events.
- Resolve checks/effects through normal seeded rules.
- Save accepted `GmMemory` and project it into later public context.
- Add replay fixtures proving identical consequences with AI on and off.

Exit: two prose variants can never produce different rules outcomes for the
same selected intent and seed.

### Phase 7: Present one controller-first GM scene

- Use the dungeon/town scene, NPC/adventurer art, and a fixed message/command
  region; do not introduce a chat panel or web form.
- Preserve the enemy field, party vitals, current-cell truth, confirm/cancel,
  and Japanese line layout.
- Make generation latency invisible through immediate authored framing and
  replaceable reaction text; never block movement indefinitely on a model.

Exit: the entire slice is playable with controller/keyboard and zero pointer
events in both provider and fallback modes.

### Phase 8: Concept playtest and decision

Test the route as a player, not only through headless reachability. Accept the
concept only if:

- the player can identify what the GM noticed about their adventurer;
- no line assigns speech, feelings, or decisions to a player character;
- the choice changes a canonical consequence and is recalled after return;
- the scene still feels like a DRPG command encounter rather than a chatbot;
- AI-off play has the same mechanics and does not expose a broken placeholder;
- Default and Verdant feel authored differently through data and art;
- two runs through the same authored situation produce meaningfully different,
  state-grounded framing without changing mechanical truth;
- a healthy provider feels more responsive than fallback rather than merely
  substituting synonyms;
- the player wants to take the party into another GM scene.

If this is not convincing, revise or stop before adding open-ended input,
procedural campaigns, or more providers.

### Phase 9: Expand only after the concept passes

In order:

1. NPC relationships and recurring consequences.
2. Rumor contradiction, discovery, and town reaction.
3. Optional free-intent interpretation mapped to authored intents, with
   clarification instead of guessing.
4. Between-expedition GM preparation that assembles authored storylets under
   scenario budgets.
5. Authoring/simulation tools that test coverage, repetition, economy, and
   unreachable branches.

Runtime dungeon geometry, combat rules, loot generation, and PC control remain
deterministic even in this phase.

## Verification and gates

- Unit: schema validation, allowed-effect adjudication, memory migration,
  context redaction, prompt-injection rejection, deterministic fallback.
- Property/eval: arbitrary model output cannot create a command, reveal a hidden
  fact, invent an id, or alter canonical outcomes.
- Replay: accepted intent + seed reproduces the same events and state hash with
  AI disabled.
- Browser/current runtime: controller-only town -> scene -> choice -> result ->
  return route, Japanese line-layout screenshots, no AI/provider controls.
- Authoring: the frozen candidate pack is reproducible from its blueprint and
  passes parser, graph, simulation, prose, and asset reports independently.
- Godot: consume the same normalized storylet/context/memory contracts and
  replay fixtures; do not fork GM rules into scene scripts.
- Human Gate: review two runs with different adventurers and one provider-off
  run. Headless and mock-provider success do not prove the concept.

## Non-goals

- A free-form chatbot available everywhere.
- Runtime-generated dungeon topology or mid-run balance changes.
- AI control of party members, combat orders, rewards, or save state.
- Endless generated prose, mandatory network service, or visible model setup.
- Full campaign generation before the first authored vertical slice passes.

## Recommended next handoff

Treat Phases 0-8 as one concept milestone. Implement the compiler boundary first
because realtime GM depends on its authorized facts and intents, then continue
directly into the runtime scene and playtest rather than leaving it as an
indefinite follow-up. Keep asset generation independent and keep the contract
engine-neutral so current React evidence and the Godot migration can share it.
