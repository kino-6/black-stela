# AI Scenario / GM Godot Migration Contract

Status: **Proposed implementation seam**

This document tells the Godot migration worker what must be preserved now so
the AI scenario compiler and bounded realtime GM described in
[`AIPlan.md`](../../AIPlan.md) can be added without another rules or save
migration.

It is not a request to add live AI during M3. M3 owns the town preparation loop.
Its responsibility here is to leave an engine-neutral, event-driven boundary
for the later concept slice.

## Read Order

1. [`docs/architecture.md`](../architecture.md) for the authoritative layer
   boundaries and command loop.
2. [`docs/design/godot-full-migration-plan.md`](godot-full-migration-plan.md)
   for the active milestone and parity process.
3. [`AIPlan.md`](../../AIPlan.md) for the product promise, authority model, and
   phased AI work.
4. This document for the TypeScript-to-Godot implementation contract.
5. [`docs/examples/gm-runtime-contract-v1.example.json`](../examples/gm-runtime-contract-v1.example.json)
   for a concrete Verdant-shaped request, proposal, command, event, and memory
   exchange.

## Capability

Black Stela must eventually support both of these without making either runtime
the content authority:

- An authoring-time Scenario Forge compiles AI-assisted drafts into the same
  validated external world-pack format as human-authored scenarios.
- A hidden local GM receives a redacted view of canonical play, returns a typed
  proposal, and lets deterministic rules resolve a player-confirmed intent.

The resulting scenario and accepted outcome must replay identically in React
and Godot. Generated wording may differ and is not game truth.

## Fixed Boundaries

```text
Markdown/YAML scenario source
        |
        | TypeScript parse + validate + normalize
        v
versioned world-pack JSON --------------------------+
        |                                            |
        v                                            v
TypeScript rules oracle                       Godot rules port
        |                                            |
        +------ Command -> { state, events } <-------+
                               |
                               v
                     public-context builder
                               |
                               v
                      local GM proposal
                               |
                      validate + player confirm
                               |
                               v
                    deterministic GM command
```

The following are blocking rules:

1. Godot never parses scenario Markdown/YAML. New NPC, storylet, rumor, voice,
   and asset-manifest data must enter the normalized export produced by
   TypeScript.
2. Scene scripts never call a model provider directly. A later `GmService`
   adapter owns provider I/O, timeout, validation, fallback, and diagnostics.
3. AI output is never a `GameState` patch, a rules command, or an effect list.
   It is a proposal containing only ids already authorized by the world pack.
4. Only a player-confirmed intent becomes a normal deterministic command.
   Rules choose rolls, success, damage, rewards, flags, and memory.
5. Provider settings, prompts, model names, health checks, and repair logs do
   not appear in normal-play Godot scenes.
6. Generated prose is presentation. It is excluded from state hashes and does
   not need byte-for-byte cross-runtime parity.
7. Accepted intent, resolved consequence ids, and canonical `GmMemory` are
   rules state. Once introduced, they are included in save migration and state
   parity.

## M3 Requirements

M3 does not add AI behavior. While porting town services, preserve these seams:

- Every service action continues to resolve through one command entry point and
  returns `{ state, events }`.
- Godot emits the same typed events as the TypeScript oracle. A scene may render
  an event, but must not replace it with a Godot-only message as the sole record.
- Events retain stable catalog and character ids wherever the TypeScript
  contract provides them. When an event contract is deliberately strengthened,
  change TypeScript first, export a golden trace, then port it.
- Town copy remains world/localization data. Do not put prospective GM dialogue
  into service scripts.
- Records and service feedback project from canonical events. This gives the
  later GM a bounded recent-event source without scraping labels or logs.
- No provider field is added to `Run.state`, the town UI, or the save DTO.
- M3 service results must expose enough canonical facts for later reactions:
  quest ids, item ids, costs, rewards, vocation ids, character ids where
  applicable, and recovery outcomes.

Current M3 events such as `quest_accepted`, `quest_claimed`,
`item_appraised`, `bulk_converted`, `equipment_reinforced`,
`party_recovered`, and `recovery_blocked` are the correct shape of seam. They
remain deterministic facts; the future GM may comment on them but cannot create
or alter them.

### Observed Contract Gaps

These are not reasons to fork the active M3 port. Resolve them in TypeScript
first, then regenerate traces and port the accepted event shape:

- `equipment_changed` and `equipment_reinforced` identify the member by display
  name but not `characterId`.
- `item_bought` does not retain `shopId`.
- `quest_claimed` retains a reward `itemName` but not its catalog `itemId`.
- `party_recovered` records aggregate cost but not which members or injuries
  changed.

The future context builder can derive some facts from before/after state, but a
canonical event should carry stable ids when the identity is part of the event.
Do not compensate by adding richer Godot-only dictionaries.

## Target World-Pack Extension

Authoring files proposed by `AIPlan.md` include `npcs.md`, `storylets.md`,
`rumors.md`, `ai_style.md`, and an asset manifest. The accepted implementation
must follow the existing pipeline:

1. Add Zod schemas and parsers in TypeScript.
2. Validate ids, localization, trigger reachability, knowledge boundaries, and
   allowed consequences in `scenarioPackLoader`.
3. Normalize the parsed data into `ScenarioWorld`.
4. Export it through `export:packs`.
5. Bump `WORLD_PACK_SCHEMA_VERSION` when the consumer must distinguish the new
   shape.
6. Add loader fixtures proving Godot reads the normalized values without
   interpreting source files.

A suggested normalized block is shown below. The final field names are frozen
only when Phase 1 of `AIPlan.md` lands.

```ts
interface ScenarioGmData {
  schemaVersion: 1;
  style: GmStyle;
  npcs: ScenarioNpc[];
  storylets: ScenarioStorylet[];
  rumors: ScenarioRumor[];
  assetManifest: ScenarioAssetReference[];
}

interface ScenarioWorld {
  // Existing deterministic world data...
  gm?: ScenarioGmData;
}
```

Keeping this data inside the versioned `ScenarioWorld` export avoids a second
Godot-only content registry.

## Runtime Contracts

### Public Context

`GmPublicContext` is a redacted snapshot assembled from the normalized world,
canonical state, and recent typed events. It may contain:

- world, phase, turn, public location, danger band, and locale;
- bounded party identity: id, name, title, class, background, traits, visible
  condition, and established deeds;
- already-known NPC facts and accepted `GmMemory`;
- eligible storylet ids and their authorized intent ids;
- recent canonical events that the player could know.

It must not contain undiscovered rooms, unseen enemies, secret triggers,
unidentified item truth, future rewards, private NPC facts, provider secrets,
or arbitrary save data.

### Proposal

`GmProposal` may choose only:

- one eligible storylet id;
- one permitted subject character id;
- concise framing and optional NPC reaction;
- an ordered subset of that storylet's allowed intent ids;
- continuity tags from an allowlist.

Unknown ids, hidden-fact references, PC speech, PC feelings, state patches,
numeric effects, or free-form commands make the proposal invalid. The authored
fallback is used on absence, timeout, or rejection.

### Confirmed Intent

The presentation sends a deterministic command only after player confirmation:

```ts
type ResolveStoryletIntentCommand = {
  type: "resolve_storylet_intent";
  storyletId: string;
  intentId: string;
  subjectCharacterId?: string;
};
```

The rules engine verifies that the storylet is eligible at the current
location, the intent belongs to it, and the subject is allowed. It then performs
the seeded check and emits typed result events. The model does not supply the
roll or consequence.

### Canonical Memory

`GmMemory` stores accepted facts only:

```ts
interface GmMemory {
  storyletId: string;
  intentId: string;
  result: "success" | "failure" | "withdrawn";
  consequenceEventIds: string[];
  npcId?: string;
  subjectCharacterId?: string;
  turn: number;
}
```

Do not persist raw prompts, model responses, provider configuration, or
replaceable prose in this record.

## Target Module Map

These paths are targets, not files M3 must create.

| Responsibility | TypeScript authority | Godot consumer/port |
| --- | --- | --- |
| Storylet/NPC schema | `src/domain/scenario.ts`, `src/domain/types.ts` | normalized dictionaries from `WorldLoader` |
| Pack assembly/validation | `src/services/scenarioPackLoader.ts` | none; Godot consumes output |
| Normalized export | `src/tools/packExport.ts`, `scripts/export-packs.ts` | `godot/scripts/world_loader.gd` |
| GM runtime contracts | future `src/domain/gm.ts` | future `godot/scripts/rules/gm_adjudicator.gd` |
| Public context/redaction | future `src/services/gmContext.ts` | parity port or shared exported fixture |
| Provider/fallback | future `src/services/gmProvider.ts` | future `godot/scripts/gm_service.gd` |
| Canonical memory/save | `src/domain/saveData.ts` | `Run.state` only after M6 schema migration |
| Scene presentation | current React GM scene | future Godot town/dungeon scene adapter |

Godot scene scripts should consume a validated proposal and submit a command.
They do not own storylet eligibility, redaction, adjudication, or memory.

## Milestone Hooks

- **M3, town:** preserve canonical service events and event-based records. Do
  not add AI/provider UI.
- **M4, dungeon:** add current-cell storylet eligibility and presentation hooks
  only after the normalized storylet schema exists. Storylets never invent map
  topology.
- **M5, combat:** expose canonical encounter and result events to context.
  Reactions do not change initiative, targets, rewards, or enemy actions.
- **M6, saves:** version and round-trip canonical `GmMemory`. Generated prose
  and provider diagnostics remain outside the save contract.
- **Post-migration concept slice:** connect the provider adapter, fallback, and
  one controller-first scene only after TS/Godot replay fixtures agree.

## Parity and Verification

The first implementation must turn the example JSON into a real fixture and
prove:

1. The same normalized storylet loads in TypeScript and Godot.
2. The same confirmed intent and seed emit semantically identical typed events
   and the same state hash.
3. AI enabled, rejected, timed out, and absent all offer the same authorized
   intent ids and deterministic outcomes.
4. Generated wording can differ without changing the state hash.
5. Hidden facts never enter `GmPublicContext`.
6. Godot controller input can open the scene, select an intent, cancel, confirm,
   resolve, and return without a pointer.
7. Japanese fallback and generated copy pass line-layout review.

Headless parity proves the contract. A real Godot play pass proves the scene.
Neither substitutes for the other.

## Failure Patterns

Reject a migration change that does any of the following:

- parses `storylets.md` or `npcs.md` in GDScript;
- adds a Godot-only storylet schema;
- calls HTTP/Ollama from a scene script;
- stores generated prose in the canonical log, state hash, or save;
- lets a proposal contain effects, rewards, map changes, or arbitrary commands;
- derives GM context by scraping Japanese UI text;
- makes provider availability a prerequisite for movement or town services;
- adds model setup or an AI toggle to normal play;
- treats a successful mock response as proof that the GM scene is enjoyable.

## Handoff

M3 can proceed when its service commands remain parity-clean and event-complete;
no live AI work is required. The AI lane begins with `AIPlan.md` Phase 0 and
Phase 1: freeze these interfaces, extend the TS scenario schema, export one
Default and one Verdant storylet, then add a Godot loader fixture before any
provider or scene work.
