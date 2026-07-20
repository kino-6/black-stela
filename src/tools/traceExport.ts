import { createInitialGameState } from "../domain/gameState";
import { createGuildCharacter } from "../domain/characterCreation";
import { createCombatState } from "../domain/rulesEngine";
import { createDebugStateFromProgress, withDebugStartCell } from "../debug/debugStart";
import { withDeterministicIds } from "../domain/ids";
import { runTrace, hashState } from "../headless/traceFixture";
import { canonicalize } from "./packExport";
import type { Command, GameState, ScenarioWorld } from "../domain/types";

// S1 of the Godot migration: emit golden trace fixtures — the parity targets a GDScript port must
// reproduce. Each fixture is a serialized initial state, a command sequence, and the per-step events
// and canonical state hashes the TS oracle produced. Godot loads the initial state, replays the
// commands through its own rules, and must match every event and hash.

export const TRACE_SCHEMA_VERSION = 1;

export interface TraceFixtureFile {
  schemaVersion: number;
  name: string;
  worldId: string;
  initialState: GameState;
  initialStateHash: string;
  commands: Command[];
  steps: { command: Command; events: unknown[]; stateHash: string }[];
  finalStateHash: string;
}

// A route builds a reproducible initial state + the commands to replay from it. Building under a fixed
// deterministic-id seed keeps character ids stable, so re-exporting produces byte-identical fixtures.
export interface TraceRoute {
  name: string;
  worldId: string;
  build: (world: ScenarioWorld) => { initial: GameState; commands: Command[] };
}

// Assemble one fixture. The initial state is built under `<name>:init` ids (stable character ids); the
// replay fold uses `<name>:run` ids for anything minted mid-route (log entries — excluded from the
// hash — so no collision matters).
export function buildTraceFixture(route: TraceRoute, world: ScenarioWorld): TraceFixtureFile {
  const { initial, commands } = withDeterministicIds(`${route.name}:init`, () => route.build(world));
  const trace = runTrace(world, initial, commands, `${route.name}:run`);
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    name: route.name,
    worldId: route.worldId,
    initialState: canonicalize(initial),
    initialStateHash: hashState(initial),
    commands,
    steps: trace.steps,
    finalStateHash: trace.finalStateHash
  };
}

export function traceFixtureToJson(route: TraceRoute, world: ScenarioWorld): string {
  return `${JSON.stringify(canonicalize(buildTraceFixture(route, world)), null, 2)}\n`;
}

// --- The vertical-slice routes ----------------------------------------------------------------------

// A front-line vanguard vs. the first B1F slime: three attack rounds, resolving to victory. Exercises
// the seeded combat RNG and the victory/result transition — the parity-critical path.
function combatRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const hero = { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "slice" }), row: "front" as const };
  const enemy = world.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime") ?? world.enemies[0];
  const base = { ...createInitialGameState(), party: [hero] };
  const initial: GameState = {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
  const group = initial.combat!.enemyGroups[0];
  const actions = initial.party
    .filter((member) => member.hp > 0)
    .map((member) => ({ actorId: member.id, action: "attack" as const, targetGroupId: group.id }));
  const commands: Command[] = Array.from({ length: 3 }, () => ({ type: "declare_round", actions }));
  return { initial, commands };
}

// A MULTI-ROUND fight: one hero vs. a PACK of two slimes. A single attack kills at most one body, so
// the pack survives round 1 and the ENEMY TURN fires (basic front-first swings) before the party
// finishes them — the parity path for the ported enemy turn + round-end + round advance.
function combatRoundsRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const hero = { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "slice" }), row: "front" as const };
  const enemy = world.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime") ?? world.enemies[0];
  const base = { ...createInitialGameState(), party: [hero] };
  const initial: GameState = {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 2)
  };
  const group = initial.combat!.enemyGroups[0];
  const actions = initial.party
    .filter((member) => member.hp > 0)
    .map((member) => ({ actorId: member.id, action: "attack" as const, targetGroupId: group.id }));
  const commands: Command[] = Array.from({ length: 5 }, () => ({ type: "declare_round", actions }));
  return { initial, commands };
}

// A fight vs. a chosen enemy pack — parameterized so a route can exercise a specific enemy turn path
// (an authored ability, a poison inflict) against the ported rules.
function combatVsRoute(enemyId: string, count: number, rounds: number) {
  return (world: ScenarioWorld): { initial: GameState; commands: Command[] } => {
    const hero = { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "slice" }), row: "front" as const };
    const enemy = world.enemies.find((candidate) => candidate.id === enemyId) ?? world.enemies[0];
    const base = { ...createInitialGameState(), party: [hero] };
    const initial: GameState = {
      ...base,
      phase: "combat",
      position: { roomId: "room.b1f.001", facing: "east" },
      map: { ...base.map, floorId: "dungeon.b1f" },
      combat: createCombatState("room.b1f.001", enemy, count)
    };
    const group = initial.combat!.enemyGroups[0];
    const actions = initial.party
      .filter((member) => member.hp > 0)
      .map((member) => ({ actorId: member.id, action: "attack" as const, targetGroupId: group.id }));
    const commands: Command[] = Array.from({ length: rounds }, () => ({ type: "declare_round", actions }));
    return { initial, commands };
  };
}

// M5: a party that DEFENDS, CASTS, and USES AN ITEM — the three declare_round branches beyond attack —
// then the fight's exits (retreat / continue). A mender and an arcanist bring heal + firebolt on their
// default loadouts; the vanguard's 特技 power-strike costs 気力.

/**
 * §9.5 — the trace the parity gate was MISSING.
 *
 * Every other combat trace casts only the four techniques the game shipped with (firebolt, heal,
 * power-strike, sleep), so Godot's combat resolver stayed on the pre-§9.4 narrow shape — one `effect`,
 * ally-or-enemyGroup — right through §9.4a..e and parity never noticed. A gate is only as strong as the
 * paths it walks.
 *
 * This walks the ones it did not: a party-scope WARD, a party BUFF, an enemy DEBUFF, a CURE, the
 * Knight's COVER, a multi-effect strike, a DRAIN (enemy-scope technique whose heal returns to the
 * caster), an allEnemies group spell, and an ITEM that performs a technique.
 */
function techniqueFamiliesRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const at = (classId: Parameters<typeof createGuildCharacter>[0]["classId"], name: string, row: "front" | "back", level: number) => ({
    ...createGuildCharacter({ name, classId, seed: "families" }),
    row,
    level,
    mp: 60,
    maxMp: 60
  });
  // Level 9: high enough that every class has its whole six-technique line available.
  const party = [
    at("knight", "Bran", "front", 9),
    at("chanter", "Lio", "back", 9),
    at("occultist", "Mira", "back", 9),
    at("priest", "Sei", "back", 9)
  ];
  const enemy = world.enemies.find((candidate) => candidate.id === "enemy.b2f.ash-caller") ?? world.enemies[0];
  const base = { ...createInitialGameState(), party };
  const initial: GameState = {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    inventory: [
      { id: "item.ember-flask", name: "Ember Flask", kind: "throwable", quantity: 2, useTechnique: "firebolt" },
      { id: "item.warding-charm", name: "Warding Charm", kind: "ward", quantity: 1, useTechnique: "ward-hymn" }
    ],
    combat: createCombatState("room.b1f.001", enemy, 4)
  };
  const group = initial.combat!.enemyGroups[0];
  const [knight, chanter, occultist, priest] = party;

  return {
    initial,
    commands: [
      // Lasting effects on both sides at once: cover (self), a party ward, an enemy armour debuff.
      { type: "declare_round", actions: [
        { actorId: knight.id, action: "cast", spellId: "cover" },
        { actorId: chanter.id, action: "cast", spellId: "ward-hymn" },
        { actorId: occultist.id, action: "cast", spellId: "sunder", targetGroupId: group.id },
        { actorId: priest.id, action: "cast", spellId: "purge", targetCharacterId: knight.id }
      ] },
      // A party buff on a timer, a drain (heal returns to the caster), and an item that casts.
      { type: "declare_round", actions: [
        { actorId: knight.id, action: "cast", spellId: "shield-wall" },
        { actorId: chanter.id, action: "cast", spellId: "battle-hymn" },
        { actorId: occultist.id, action: "cast", spellId: "life-siphon", targetGroupId: group.id },
        { actorId: priest.id, action: "use_item", itemId: "item.ember-flask", targetGroupId: group.id }
      ] },
      // A multi-effect strike (damage + debuff), a group-scope heal, an enemy accuracy debuff, and a
      // charm performing a party ward with no target field at all.
      { type: "declare_round", actions: [
        { actorId: knight.id, action: "cast", spellId: "challenge", targetGroupId: group.id },
        { actorId: chanter.id, action: "cast", spellId: "lesser-heal", targetCharacterId: knight.id },
        { actorId: occultist.id, action: "cast", spellId: "wither", targetGroupId: group.id },
        { actorId: priest.id, action: "use_item", itemId: "item.warding-charm" }
      ] },
      { type: "declare_round", actions: [
        { actorId: knight.id, action: "cast", spellId: "bulwark-blow", targetGroupId: group.id },
        { actorId: chanter.id, action: "cast", spellId: "sleep", targetGroupId: group.id },
        { actorId: occultist.id, action: "cast", spellId: "dread", targetGroupId: group.id },
        { actorId: priest.id, action: "cast", spellId: "greater-heal", targetCharacterId: knight.id }
      ] }
    ]
  };
}

function combatActionsRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const party = [
    { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "acts" }), row: "front" as const },
    { ...createGuildCharacter({ name: "Sella", classId: "priest", seed: "acts" }), row: "back" as const },
    { ...createGuildCharacter({ name: "Mira", classId: "mage", seed: "acts" }), row: "back" as const }
  ];
  const enemy = world.enemies.find((candidate) => candidate.id === "enemy.b2f.ash-caller") ?? world.enemies[0];
  const base = { ...createInitialGameState(), party };
  const initial: GameState = {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    inventory: [{ id: "item.healing-draught", name: "Healing Draught", kind: "healing", quantity: 2, healAmount: 6 }],
    combat: createCombatState("room.b1f.001", enemy, 3)
  };
  const group = initial.combat!.enemyGroups[0];
  const rounds: Command[] = [
    { type: "declare_round", actions: [
      { actorId: party[0].id, action: "defend" },
      { actorId: party[1].id, action: "cast", spellId: "heal", targetCharacterId: party[0].id },
      { actorId: party[2].id, action: "cast", spellId: "firebolt", targetGroupId: group.id }
    ] },
    { type: "declare_round", actions: [
      { actorId: party[0].id, action: "cast", spellId: "power-strike", targetGroupId: group.id },
      { actorId: party[1].id, action: "use_item", itemId: "item.healing-draught", targetCharacterId: party[0].id },
      { actorId: party[2].id, action: "cast", spellId: "sleep", targetGroupId: group.id }
    ] },
    { type: "declare_round", actions: [
      { actorId: party[0].id, action: "attack", targetGroupId: group.id },
      { actorId: party[1].id, action: "defend" },
      { actorId: party[2].id, action: "cast", spellId: "firebolt", targetGroupId: group.id }
    ] },
    { type: "retreat" }
  ];
  return { initial, commands: rounds };
}

// M2 roster commands: build a town party of four and reshuffle it — set-row, swap-rows, bench→recall,
// retire→unretire, erase. Exercises every ported roster op (party/reserve/retired moves + events).
function rosterRoute(): { initial: GameState; commands: Command[] } {
  const party = ["vanguard", "mender", "arcanist", "seeker"].map((classId, index) =>
    createGuildCharacter({ name: `M${index}`, classId: classId as never, seed: "roster" })
  );
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party, reserve: [], retired: [] };
  const commands: Command[] = [
    { type: "set_member_row", characterId: party[0].id, row: "back" },
    { type: "swap_member_rows", characterId: party[0].id, targetCharacterId: party[1].id },
    { type: "bench_member", characterId: party[3].id },
    { type: "recall_member", characterId: party[3].id },
    { type: "retire_member", characterId: party[2].id },
    { type: "unretire_member", characterId: party[2].id },
    { type: "edit_member_identity", characterId: party[1].id, name: "Renamed", title: "Hero", notes: "revised", accentColor: "#ff3366" },
    { type: "reclass_member", characterId: party[0].id, classId: "thief" }, // re-derive the base at the retained level
    { type: "erase_member", characterId: party[3].id }
  ];
  return { initial, commands };
}

// M3 economy: a town shopping trip — buy consumables + gear, equip a clean slot, sell one, discard one.
// Exercises buy_item (item + equipment), equip_item, sell_item, discard_item + the inventory helpers.
function economyRoute(): { initial: GameState; commands: Command[] } {
  const hero = createGuildCharacter({ name: "Rook", classId: "warrior", seed: "econ" });
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party: [hero], partyGold: 300 };
  const commands: Command[] = [
    { type: "buy_item", shopId: "shop.stela-general", itemId: "item.healing-draught" },
    { type: "buy_item", shopId: "shop.stela-general", itemId: "item.healing-draught" },
    { type: "buy_item", shopId: "shop.stela-general", itemId: "equip.iron-cap" },
    { type: "equip_item", characterId: hero.id, equipmentId: "equip.iron-cap" },
    { type: "sell_item", itemId: "item.healing-draught" },
    { type: "discard_item", itemId: "item.healing-draught" }
  ];
  return { initial, commands };
}

// M3 recovery (infirmary): a wounded party is healed for gold, then a no-cost re-heal, then a blocked
// heal when the purse is empty. Exercises recover_party (cost, injury clear, block).
function recoveryRoute(): { initial: GameState; commands: Command[] } {
  const hurt = { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "rec" }), hp: 5, injury: "wounded" as const };
  const mender = { ...createGuildCharacter({ name: "Sella", classId: "priest", seed: "rec" }), hp: 4 };
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party: [hurt, mender], partyGold: 100 };
  const commands: Command[] = [
    { type: "recover_party" }, // heals both, docks cost
    { type: "recover_party" } // already full → cost 0, party_recovered gold 0
  ];
  return { initial, commands };
}

function recoveryBlockedRoute(): { initial: GameState; commands: Command[] } {
  const hurt = { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "recb" }), hp: 3, injury: "wounded" as const };
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party: [hurt], partyGold: 2 };
  return { initial, commands: [{ type: "recover_party" }] }; // too poor → recovery_blocked
}

// M3 quests: accept a fresh bounty, then claim a met bounty whose 55-XP reward crosses several level
// thresholds — exercises accept_quest, claim_quest, the XP grant, and applyLevelUps (level growth).
function questRoute(): { initial: GameState; commands: Command[] } {
  const hero = createGuildCharacter({ name: "Rook", classId: "warrior", seed: "quest" });
  const base = createInitialGameState();
  const initial: GameState = {
    ...base,
    phase: "town",
    party: [hero],
    partyGold: 0,
    quests: [{ questId: "quest.glimmer-hunt", status: "active", killCount: 1, claims: 0 }]
  };
  const commands: Command[] = [
    { type: "accept_quest", questId: "quest.cull-the-ash" },
    { type: "claim_quest", questId: "quest.glimmer-hunt" }
  ];
  return { initial, commands };
}

// M3 loot / workshop: appraise an unidentified rare, lock + favorite two instances, reinforce a worn
// slot with materials, then bulk-dismantle every unprotected equipment (the appraised rare now sweeps,
// the locked/favorited ones are spared). Exercises appraise_item, toggle_item_lock/favorite,
// reinforce_equipment, and bulk_convert + the rarity fee/yield tables.
function lootRoute(): { initial: GameState; commands: Command[] } {
  const hero = {
    ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "loot" }),
    equipment: { head: { id: "equip.iron-cap", plus: 0 } }
  };
  const base = createInitialGameState();
  const initial: GameState = {
    ...base,
    phase: "town",
    party: [hero],
    partyGold: 100,
    materials: 10,
    inventory: [
      { id: "equip.iron-cap", name: "Iron Cap", kind: "equipment", quantity: 1, slot: "head", sellValue: 10, rarity: "rare", identified: false, affix: "warding", instanceId: "loot.rare-1" },
      { id: "equip.oak-buckler", name: "Oak Buckler", kind: "equipment", quantity: 1, slot: "offhand", sellValue: 8, instanceId: "loot.lock-1" },
      { id: "equip.leather-vest", name: "Leather Vest", kind: "equipment", quantity: 1, slot: "body", sellValue: 6, instanceId: "loot.fav-1" },
      { id: "equip.rusty-dagger", name: "Rusty Dagger", kind: "equipment", quantity: 2, slot: "weapon", sellValue: 3 },
      { id: "equip.worn-gloves", name: "Worn Gloves", kind: "equipment", quantity: 1, slot: "hands", sellValue: 4, rarity: "common" }
    ]
  };
  const commands: Command[] = [
    { type: "appraise_item", instanceId: "loot.rare-1" },
    { type: "toggle_item_lock", instanceId: "loot.lock-1" },
    { type: "toggle_item_favorite", instanceId: "loot.fav-1" },
    { type: "reinforce_equipment", characterId: hero.id, slot: "head" },
    { type: "bulk_convert", mode: "dismantle" }
  ];
  return { initial, commands };
}

// M3 career (vocation board): a level-6 vanguard who has mastered vanguard + sellsword reclasses to the
// basic Sellsword (re-derives the class base at level 6 via reclassCharacter), edits its bounded loadout,
// then adopts the advanced ash-reaver (prereqs met → layers modifiers + grants power-strike). Exercises
// change_vocation's basic-reclass AND advanced-adopt paths, the prereq gate, and set_loadout.
function vocationRoute(): { initial: GameState; commands: Command[] } {
  const hero = {
    ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "voc" }),
    level: 6,
    xp: 120, // xpForLevel(6) = 4*5*6 — enough for level 6, short of 7 (168), so reclass re-levels to 6
    vocation: {
      // 戦士 with two disciplines mastered — the consolidated pair the ash-reaver now asks for.
      current: "warrior",
      mastery: { warrior: 5, swordmaster: 5 },
      progress: {},
      learned: ["power-strike"],
      loadout: ["power-strike"]
    }
  };
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party: [hero] };
  const commands: Command[] = [
    { type: "change_vocation", characterId: hero.id, vocationId: "swordmaster" },
    { type: "set_loadout", characterId: hero.id, loadout: ["power-strike", "spell.not-learned"] },
    { type: "change_vocation", characterId: hero.id, vocationId: "vocation.ash-reaver" }
  ];
  return { initial, commands };
}

// A short exploration route from a known B1F progress state: turn, search, listen, turn back. Exercises
// dungeon movement + current-cell probes without minting characters.
function dungeonRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const initial = createDebugStateFromProgress(world, "after_encounter");
  const commands: Command[] = [
    { type: "turn_left" },
    { type: "search" },
    { type: "listen" },
    { type: "turn_right" }
  ];
  return { initial, commands };
}

// Turning and listening only — no world lookup, no RNG. The first route brought to full GDScript
// parity (S3); movement/search/combat routes follow as their rules are ported.
function turnsRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const initial = createDebugStateFromProgress(world, "after_encounter");
  const commands: Command[] = [
    { type: "turn_left" },
    { type: "turn_right" },
    { type: "turn_right" },
    { type: "turn_left" },
    { type: "listen" }
  ];
  return { initial, commands };
}

// Turn to face a wall (east at room.b1f.002 has no exit) and step into it — exercises move_forward's
// blocked-wall branch (movement_blocked + map_exit_blocked, blockedExits updated). Room entry and
// encounter creation are the larger remaining move_forward work.
function wallRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const initial = createDebugStateFromProgress(world, "after_encounter");
  const commands: Command[] = [
    { type: "turn_left" }, // face east from the default south facing
    { type: "move_forward" }
  ];
  return { initial, commands };
}

// M4: place the party ON the cell before a floor feature and step into it, so the branch under test is
// guaranteed to fire (walking a maze path to it is what made these fixtures brittle). Each route also
// strafes/backs up, exercising moveForward's requestedDirection + motion.
function cellFeatureRoute(
  progress: Parameters<typeof createDebugStateFromProgress>[1],
  fromRoomId: string,
  facing: "north" | "south" | "east" | "west",
  extra: Command[] = []
) {
  return (world: ScenarioWorld): { initial: GameState; commands: Command[] } => {
    const seeded = createDebugStateFromProgress(world, progress);
    const initial = withDebugStartCell(seeded, world, fromRoomId, facing);
    return { initial, commands: [{ type: "move_forward" }, ...extra] };
  };
}

// The remaining command set: entering the dungeon from town, resuming at a rest point, an escape charm
// home, and GROWTH items (permanent aptitude/stat raises; a deed grants xp through the level curve).
function expeditionRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const seeded = createDebugStateFromProgress(world, "ready");
  const initial: GameState = { ...seeded, phase: "town", position: null };
  return { initial, commands: [{ type: "enter_dungeon" }, { type: "turn_left" }] };
}

function growthItemsRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const seeded = createDebugStateFromProgress(world, "ready");
  const target = seeded.party[0];
  const initial: GameState = {
    ...seeded,
    phase: "town",
    position: null,
    inventory: [
      { id: "item.ashroot-tonic", name: "Ashroot Tonic", kind: "growth", quantity: 1, grants: { maxHp: 6 } },
      { id: "item.emberwit-ash", name: "Emberwit Ash", kind: "growth", quantity: 1, grants: { wit: 1 } },
      { id: "item.deed-of-passage", name: "Deed of Passage", kind: "growth", quantity: 1, grants: { xp: 60 } },
      { id: "item.healing-draught", name: "Healing Draught", kind: "healing", quantity: 1, healAmount: 6 }
    ]
  };
  return {
    initial,
    commands: [
      { type: "use_item", itemId: "item.ashroot-tonic", targetCharacterId: target.id },
      { type: "use_item", itemId: "item.emberwit-ash", targetCharacterId: target.id },
      { type: "use_item", itemId: "item.deed-of-passage", targetCharacterId: target.id }, // crosses levels
      { type: "use_item", itemId: "item.deed-of-passage", targetCharacterId: target.id }  // spent — no-op
    ]
  };
}

// An escape charm from inside the dungeon, and a resume at a rest point already reached.
function escapeAndResumeRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const seeded = withDebugStartCell(createDebugStateFromProgress(world, "floor_3"), world, "room.b3f.003", "east");
  const initial: GameState = {
    ...seeded,
    inventory: [{ id: "item.return-charm", name: "Return Charm", kind: "escape", quantity: 1 }]
  };
  return {
    initial,
    commands: [
      { type: "use_item", itemId: "item.return-charm", targetCharacterId: seeded.party[0].id }, // home
      { type: "resume_at_checkpoint", roomId: "room.b3f.003" }                                   // back
    ]
  };
}

// The legacy one-button combat verbs (attack / defend). import_member mints an id internally, so it
// is proven by SAMPLE (export:character-samples + verify_character_creation), not a state-hash trace.
function legacyCombatRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const hero = { ...createGuildCharacter({ name: "Rook", classId: "warrior", seed: "legacy" }), row: "front" as const };
  const enemy = world.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime") ?? world.enemies[0];
  const base = { ...createInitialGameState(), party: [hero] };
  const initial: GameState = {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 3)
  };
  return { initial, commands: [{ type: "defend" }, { type: "attack" }, { type: "defend" }] };
}

// Verdant is wandering-encounter-driven and gate-flagged; walking it proves the ported rules are
// world-agnostic rather than tuned to the default pack.
function verdantExpeditionRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const seeded = createDebugStateFromProgress(world, "ready");
  const initial: GameState = { ...seeded, phase: "town", position: null };
  return { initial, commands: [{ type: "enter_dungeon" }, { type: "move_forward" }, { type: "search" }, { type: "turn_right" }] };
}

function verdantWalkRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const initial = withDebugStartCell(createDebugStateFromProgress(world, "ready"), world, "room.verdant.g1f.c2_1", "east");
  return {
    initial,
    commands: [
      { type: "move_forward" },   // into the flagged gate room
      { type: "move_forward" },
      { type: "move_backward" },
      { type: "listen" }
    ]
  };
}

// The slice's golden routes. More can be added as the vertical slice grows.
export const SLICE_ROUTES: TraceRoute[] = [
  { name: "b1f-turns", worldId: "default", build: turnsRoute },
  { name: "b1f-wall", worldId: "default", build: wallRoute },
  { name: "b1f-combat-victory", worldId: "default", build: combatRoute },
  { name: "b1f-combat-rounds", worldId: "default", build: combatRoundsRoute },
  // Enemy-turn coverage: b2f ash-caller fires the "Cinder Lash" damage ABILITY; b3f bitter-mote lands a
  // poison INFLICT that then bites at round-end. Both exercise the ported enemy turn beyond basic melee.
  { name: "b2f-ability", worldId: "default", build: combatVsRoute("enemy.b2f.ash-caller", 2, 6) },
  { name: "b3f-poison", worldId: "default", build: combatVsRoute("enemy.b3f.bitter-mote", 2, 8) },
  // b4f lantern-ward mixes a damage ability + a status ability (Blinding Glare) — exercises the enemy
  // ability STATUS branch. rootheart out-damages a lone hero over many rounds → the PARTY-WIPE path
  // (every member wounded → dragged back to town minus a rescue fee).
  { name: "b4f-caster", worldId: "default", build: combatVsRoute("enemy.b4f.lantern-ward", 1, 8) },
  { name: "verdant-wipe", worldId: "verdant", build: combatVsRoute("enemy.verdant.g8.rootheart", 1, 14) },
  { name: "roster", worldId: "default", build: rosterRoute },
  { name: "economy", worldId: "default", build: economyRoute },
  { name: "recovery", worldId: "default", build: recoveryRoute },
  { name: "recovery-blocked", worldId: "default", build: recoveryBlockedRoute },
  { name: "quests", worldId: "default", build: questRoute },
  { name: "loot", worldId: "default", build: lootRoute },
  { name: "vocation", worldId: "default", build: vocationRoute },
  { name: "b1f-exploration", worldId: "default", build: dungeonRoute },
  // M7 content parity: the SAME rules driven by the other world's data — Verdant enters, walks its
  // grove corridors (wandering-only floors), takes its shortcut gate, and descends.
  { name: "verdant-expedition", worldId: "verdant", build: verdantExpeditionRoute },
  { name: "verdant-walk", worldId: "verdant", build: verdantWalkRoute },
  { name: "combat-actions", worldId: "default", build: combatActionsRoute },
  // §9.5 — the families the other traces never cast (see techniqueFamiliesRoute).
  { name: "technique-families", worldId: "default", build: techniqueFamiliesRoute },
  { name: "expedition", worldId: "default", build: expeditionRoute },
  { name: "legacy-combat", worldId: "default", build: legacyCombatRoute },
  { name: "growth-items", worldId: "default", build: growthItemsRoute },
  { name: "escape-resume", worldId: "default", build: escapeAndResumeRoute },
  // M4 floor features: a one-shot room TRAP, a Wizardry SPINNER, a TELEPORTER (transit only, no
  // encounter on arrival), and a gate that GRANTS a shortcut flag on entry.
  { name: "b1f-trap", worldId: "default", build: cellFeatureRoute("ready", "room.b1f.c13_4", "south", [{ type: "move_backward" }, { type: "strafe_left" }]) },
  { name: "b2f-hazard", worldId: "default", build: cellFeatureRoute("floor_2", "room.b2f.c1_2", "south", [{ type: "strafe_right" }]) },
  { name: "b4f-spinner", worldId: "default", build: cellFeatureRoute("floor_4", "room.b4f.c2_1", "west", [{ type: "inspect_wall" }, { type: "move_forward" }]) },
  { name: "b4f-teleport", worldId: "default", build: cellFeatureRoute("floor_4", "room.b4f.c16_11", "west", [{ type: "open_door" }]) },
  { name: "b1f-shortcut", worldId: "default", build: cellFeatureRoute("ready", "room.b1f.c9_12", "south", [{ type: "move_backward" }]) },
  // Descending, resting and coming home. use_stairs REPOPULATES the floor arrived on (floor-scoped
  // clear state resets); return_to_town only answers on a landing or rest point, and refuses elsewhere.
  {
    name: "b1f-stairs",
    worldId: "default",
    build: (world: ScenarioWorld) => ({
      initial: withDebugStartCell(createDebugStateFromProgress(world, "ready"), world, "room.b1f.012", "west"),
      commands: [{ type: "use_stairs" }, { type: "return_to_town" }] // arrives on B2F, then refuses (not a landing)
    })
  },
  {
    name: "b1f-return",
    worldId: "default",
    build: (world: ScenarioWorld) => ({
      initial: withDebugStartCell(createDebugStateFromProgress(world, "ready"), world, "room.b1f.001", "north"),
      commands: [{ type: "return_to_town" }] // a town-stair landing: the party goes home
    })
  },
  // A searchable resource node yields its item ONCE, and a room trap can be disarmed before it bites.
  {
    name: "b3f-gather",
    worldId: "default",
    build: (world: ScenarioWorld) => ({
      initial: withDebugStartCell(createDebugStateFromProgress(world, "floor_3"), world, "room.b3f.001", "north"),
      commands: [{ type: "search" }, { type: "search" }]
    })
  },
  // IMP-029 chests: walk onto a chamber's reward cell, investigate, disarm, open — one attempt each,
  // and an undisarmed trap springs on open without destroying the reward.
  {
    name: "b2f-chest",
    worldId: "default",
    build: (world: ScenarioWorld) => ({
      initial: withDebugStartCell(createDebugStateFromProgress(world, "floor_2"), world, "room.b2f.c1_2", "south"),
      commands: [
        { type: "move_forward" },        // leaves a closed chest on the cell
        { type: "investigate_chest" },
        { type: "investigate_chest" },   // spent — already_tried
        { type: "disarm_chest" },
        { type: "open_chest" },
        { type: "open_chest" }           // spent — already_open
      ]
    })
  },
  {
    name: "b3f-disarm",
    worldId: "default",
    build: (world: ScenarioWorld) => ({
      initial: withDebugStartCell(createDebugStateFromProgress(world, "floor_3"), world, "room.b3f.002", "north"),
      commands: [{ type: "search" }, { type: "disarm_trap" }, { type: "disarm_trap" }]
    })
  }
];
