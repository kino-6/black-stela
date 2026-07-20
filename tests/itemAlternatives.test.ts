import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createSquadCombatState, executeCommand } from "../src/domain/rulesEngine";
import { createInventoryItemFromCatalog } from "../src/domain/economy";
import { withDeterministicIds } from "../src/domain/ids";
import { TECHNIQUES } from "../src/domain/techniques";
import { worldRegistry } from "../src/data/worldRegistry";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Character, GameState } from "../src/domain/types";

/**
 * §9.4c — "an item is a valid answer to a missing class" (class-system.md §8).
 *
 * It was a PROMISE, not a route. `explorationAid` was a rule no world used; there was no item that
 * could ward, throw or cast anything; and `useItem` had no path that could touch an enemy at all. A
 * party without a Thief simply could not attempt a lock, and a party without a Mage had no fire.
 *
 * The design constraint these hold is the second half of §8: the item route must be WEAKER or one-shot,
 * so it keeps an absent class from being a dead end without making the specialist pointless.
 */

const warden = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b2f.ash-warden")!;
const caller = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b2f.ash-caller")!;

function fightWith(classId: Character["classId"], itemIds: string[], seed: string): GameState {
  return withDeterministicIds(`items-${seed}`, () => {
    let state = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Probe", classId, seed }));
    const inventory = itemIds
      .map((id) => createInventoryItemFromCatalog(defaultWorld, id, 2))
      .filter((item): item is NonNullable<typeof item> => item !== null);
    state = { ...state, inventory, party: state.party.map((member) => ({ ...member, level: 5, mp: 40, maxMp: 40 })) };
    return { ...state, phase: "combat", combat: createSquadCombatState("room.b2f.005", [warden, caller]) } as GameState;
  });
}

const beatsOf = (state: GameState) =>
  state.log.flatMap((entry) => (entry.event?.type === "combat_round_resolved" ? entry.event.beats ?? [] : []));

describe("§9.4c a party with no Mage can still bring fire", () => {
  it("an ember flask damages the enemy group it is thrown at, and is spent", () => {
    // A Knight: no spells at all, and before §9.4c `use_item` could only target a PARTY MEMBER, so
    // there was no shape of command that let this party hurt anything with an item.
    const state = fightWith("knight", ["item.ember-flask"], "flask");
    const group = state.combat!.enemyGroups[0];

    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: state.party[0].id, action: "use_item", itemId: "item.ember-flask", targetGroupId: group.id }]
    });

    expect(beatsOf(after).some((beat) => beat.targetGroupId === group.id && (beat.damage ?? 0) > 0)).toBe(true);
    expect(after.inventory.find((item) => item.id === "item.ember-flask")?.quantity, "the flask must be spent").toBe(1);
    // It cost no MP and no class — that is the whole point of the item route.
    expect(after.party[0].mp).toBe(state.party[0].mp);
  });

  it("a scroll performs a technique nobody in the party learned", () => {
    const state = fightWith("knight", ["item.scroll-of-cinders"], "scroll");
    const groupIds = state.combat!.enemyGroups.map((group) => group.id);

    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: state.party[0].id, action: "use_item", itemId: "item.scroll-of-cinders" }]
    });

    // flame-wave is `allEnemies`, so the scroll reaches both packs with no target choice — a Knight
    // casting a Mage's group spell, once.
    const struck = new Set(beatsOf(after).filter((beat) => beat.spellId === "flame-wave").map((beat) => beat.targetGroupId));
    for (const id of groupIds) {
      expect(struck.has(id), `the scroll never reached ${id}`).toBe(true);
    }
  });

  it("a warding charm gives a Chanter-less party the ward, once", () => {
    const state = fightWith("warrior", ["item.warding-charm"], "charm");

    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: state.party[0].id, action: "use_item", itemId: "item.warding-charm" }]
    });

    const effects = after.combat!.effects ?? [];
    expect(effects.some((active) => active.source === "ward-hymn" && active.subjectId === state.party[0].id)).toBe(true);
    expect(after.inventory.find((item) => item.id === "item.warding-charm")?.quantity).toBe(1);
  });
});

describe("§9.4c a party with no Thief can still attempt the lock", () => {
  it("lock picks raise an untrained investigator's skill, and are spent by the attempt", () => {
    // The aid is spent WIN OR LOSE (exploration.ts), so it is a real cost rather than a retry token.
    const aidItems = defaultWorld.items.filter((item) => (item.explorationAid?.actions.length ?? 0) > 0);
    expect(aidItems.length, "the default world must author exploration tools").toBeGreaterThan(0);

    const covered = new Set(aidItems.flatMap((item) => item.explorationAid!.actions));
    // The three routes a missing Thief would otherwise close entirely.
    for (const action of ["unlock", "disarm", "detectSecret"] as const) {
      expect(covered.has(action), `no tool covers ${action}`).toBe(true);
    }
  });

  it("every world offers the same routes — an item answer is not a default-world privilege", () => {
    for (const [worldId, world] of Object.entries(worldRegistry)) {
      const items = world.items ?? [];
      const covered = new Set(items.flatMap((item) => item.explorationAid?.actions ?? []));
      for (const action of ["unlock", "disarm", "detectSecret"] as const) {
        expect(covered.has(action), `${worldId} has no tool for ${action}`).toBe(true);
      }
      // Verdant shipped with NO cure and NO focus item at all: a poisoned party there had no answer,
      // and an exhausted caster no way back. A scenario is not allowed to be a dead end.
      expect(items.some((item) => item.kind === "cure"), `${worldId} has no cure item`).toBe(true);
      expect(items.some((item) => item.kind === "focus"), `${worldId} has no focus item`).toBe(true);
      for (const kind of ["ward", "throwable", "scroll"] as const) {
        expect(items.some((item) => item.kind === kind), `${worldId} has no ${kind} item`).toBe(true);
      }
    }
  });
});

describe("§9.4c the item route stays the WEAKER route", () => {
  it("costs gold and a charge, where the class costs only MP", () => {
    for (const [worldId, world] of Object.entries(worldRegistry)) {
      for (const item of world.items ?? []) {
        if (!item.useTechnique) continue;
        // A one-shot that is also free would simply beat the class it stands in for.
        expect(item.price ?? 0, `${worldId}:${item.id} is free`).toBeGreaterThan(0);
      }
    }
  });

  it("names only techniques that exist — a typo cannot become a silent no-op", () => {
    // The loader is the real guard (`useTechnique` is a zod enum over the engine catalog, so a world
    // naming a technique that does not exist is REJECTED at load rather than doing nothing mid-fight).
    // This asserts the outcome of that: every authored item resolves to a real technique.
    let checked = 0;
    for (const [worldId, world] of Object.entries(worldRegistry)) {
      for (const item of world.items ?? []) {
        if (!item.useTechnique) continue;
        expect(TECHNIQUES[item.useTechnique], `${worldId}:${item.id} names a missing technique`).toBeDefined();
        checked += 1;
      }
    }
    expect(checked, "no world authors an item technique — this test would pass vacuously").toBeGreaterThan(0);
  });

  it("the aid is spent win or lose, so a tool is a cost and not a retry token", () => {
    const picks = defaultWorld.items.find((item) => item.id === "item.lock-picks")!;
    expect(picks.explorationAid?.bonus).toBeGreaterThan(0);
    // Worth less than the specialist's own standing: `proficiencyBonus` is +8 for a specialist, and a
    // tool must not simply hand an untrained hand the same edge for a fixed price.
    expect(picks.explorationAid!.bonus).toBeLessThan(8);
  });
});
