import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createSquadCombatState, executeCommand } from "../src/domain/rulesEngine";
import { BUILTIN_VOCATION_IDS, findVocation } from "../src/domain/vocations";
import { knownSpells } from "../src/domain/spells";
import { findTechnique } from "../src/domain/techniques";
import { withDeterministicIds } from "../src/domain/ids";
import { defaultWorld } from "../src/data/defaultWorld";
import { worldRegistry } from "../src/data/worldRegistry";
const verdantWorld = worldRegistry.verdant;
import type { CharacterClassId, CombatStatus, GameState } from "../src/domain/types";

/**
 * §7B — the first advanced-vocation signatures, and the DETONATE primitive (§7A gap 2) they needed.
 *
 * The damage effect could not read a target's status, so the hexer's "detonate the afflicted" and the
 * assassin's "exploit the afflicted" were unbuildable. `bonusVsStatus` closes that. These prove the two
 * halves of it — detonate SPENDS the status, exploit does NOT — change a real combat OUTCOME, and that
 * the exclusive techniques are what the two vocations grant (no basic class teaches them).
 */

const warden = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b2f.ash-warden")!;

function caster(classId: "occultist" | "thief", technique: string, seed: string): { state: GameState; actorId: string; groupId: string } {
  return withDeterministicIds(`adv-${seed}`, () => {
    let state = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Cael", classId, seed }));
    state = {
      ...state,
      party: state.party.map((member) => ({
        ...member,
        level: 8,
        mp: 40,
        maxMp: 40,
        // Give the actor the exclusive technique on its loadout (an adopter of the vocation would carry it).
        vocation: { current: classId, mastery: {}, progress: {}, learned: [technique], loadout: [technique] }
      })),
      phase: "combat",
      combat: createSquadCombatState("room.b2f.005", [warden])
    } as GameState;
    // Give the target a wall of HP so one cast can never end the fight — this measures DAMAGE, and a
    // group that dies (combat → null) can't be measured. maxHpEach too, so a felled body would re-stand
    // full rather than skew the reading.
    state = {
      ...state,
      combat: {
        ...state.combat!,
        enemyGroups: state.combat!.enemyGroups.map((g) => ({ ...g, hpEach: 999, maxHpEach: 999 }))
      }
    } as GameState;
    return { state, actorId: state.party[0].id, groupId: state.combat!.enemyGroups[0].id };
  });
}

/** hpEach lost by the target group after one cast — the damage that landed on the front body. */
function damageDealt(before: GameState, after: GameState, groupId: string): number {
  const b = before.combat!.enemyGroups.find((g) => g.id === groupId)!;
  const a = after.combat!.enemyGroups.find((g) => g.id === groupId);
  // The warden is a single tough body, so it never dies to one cast here — hpEach falls by the damage.
  return b.hpEach - (a?.hpEach ?? 0);
}

function withStatus(state: GameState, groupId: string, status: CombatStatus): GameState {
  return {
    ...state,
    combat: {
      ...state.combat!,
      enemyGroups: state.combat!.enemyGroups.map((g) => (g.id === groupId ? { ...g, status: [status] } : g))
    }
  } as GameState;
}

const cast = (state: GameState, actorId: string, technique: string, groupId: string) =>
  executeCommand(state, defaultWorld, {
    type: "declare_round",
    actions: [{ actorId, action: "cast", spellId: technique as never, targetGroupId: groupId }]
  });

describe("§7B star-nova — the hexer's detonate", () => {
  it("hits a bound pack far harder than a clean one, and SPENDS the status", () => {
    const clean = caster("occultist", "star-nova", "nova-clean");
    const afflicted = { ...clean, state: withStatus(clean.state, clean.groupId, "sleep") };

    const cleanHit = cast(clean.state, clean.actorId, "star-nova", clean.groupId);
    const bonusHit = cast(afflicted.state, afflicted.actorId, "star-nova", afflicted.groupId);

    const cleanDmg = damageDealt(clean.state, cleanHit, clean.groupId);
    const bonusDmg = damageDealt(afflicted.state, bonusHit, afflicted.groupId);
    expect(bonusDmg, `detonate ${bonusDmg} must exceed the clean hit ${cleanDmg}`).toBeGreaterThan(cleanDmg);

    // A detonation is a one-shot: the status is spent, so a second nova finds nothing to detonate.
    const group = bonusHit.combat!.enemyGroups.find((g) => g.id === afflicted.groupId);
    expect(group?.status ?? [], "star-nova must consume the status it detonated").not.toContain("sleep");
  });
});

describe("§7B spore-burst — the assassin's exploit", () => {
  it("hits a poisoned pack harder, and LEAVES the status so it can keep exploiting", () => {
    const clean = caster("thief", "spore-burst", "burst-clean");
    const afflicted = { ...clean, state: withStatus(clean.state, clean.groupId, "poison") };

    const cleanHit = cast(clean.state, clean.actorId, "spore-burst", clean.groupId);
    const bonusHit = cast(afflicted.state, afflicted.actorId, "spore-burst", afflicted.groupId);

    expect(damageDealt(afflicted.state, bonusHit, afflicted.groupId)).toBeGreaterThan(
      damageDealt(clean.state, cleanHit, clean.groupId)
    );
    // Unlike the detonate, exploit does NOT consume — the affliction is still there to exploit again.
    const group = bonusHit.combat!.enemyGroups.find((g) => g.id === afflicted.groupId);
    expect(group?.status ?? [], "spore-burst must not consume the status it exploited").toContain("poison");
  });
});

describe("§7B the vocations grant their exclusive signature", () => {
  it("star-votary grants star-nova, spore-seer grants spore-burst — techniques no basic class teaches", () => {
    expect(findVocation(defaultWorld, "vocation.star-votary")?.grantsTechniques).toEqual(["star-nova"]);
    expect(findVocation(verdantWorld, "vocation.verdant.spore-seer")?.grantsTechniques).toEqual(["spore-burst"]);
  });
});

/**
 * §7B is DONE when every advanced vocation — not just the two the detonate primitive needed — grants one
 * exclusive signature technique. This locks the whole roster: exactly one grant apiece, present in the
 * catalog, taught by NO basic class (that is what "exclusive" means and what makes the vocation a real
 * destination rather than a stat block, §7), and DISTINCT across the twelve (no two names for one move).
 */
describe("§7B every advanced vocation ships one exclusive signature", () => {
  const allBasicTechniques = new Set<string>(
    BUILTIN_VOCATION_IDS.flatMap((classId) => knownSpells(classId as CharacterClassId, 99))
  );
  const advanced = [defaultWorld, verdantWorld].flatMap((world) =>
    world.vocations.filter((vocation) => vocation.tier === "advanced")
  );

  it("adopts all twelve — none left as a bare stat block", () => {
    expect(advanced.length, "the two worlds ship twelve advanced vocations between them").toBe(12);
  });

  for (const vocation of advanced) {
    it(`${vocation.id} grants exactly one exclusive, catalogued, parent-free technique`, () => {
      const grants = vocation.grantsTechniques ?? [];
      expect(grants.length, `${vocation.id} must grant its one signature`).toBe(1);
      const [technique] = grants;
      expect(findTechnique(technique), `${vocation.id} grants ${technique}, absent from the catalog`).toBeDefined();
      expect(
        allBasicTechniques.has(technique),
        `${vocation.id} grants ${technique}, which a basic class teaches — that is not exclusive`
      ).toBe(false);
    });
  }

  it("no two vocations grant the same technique — twelve distinct signatures", () => {
    const grants = advanced.flatMap((vocation) => vocation.grantsTechniques ?? []);
    expect(new Set(grants).size, "each advanced vocation opens a DIFFERENT play pattern").toBe(grants.length);
    expect(grants.length).toBe(12);
  });
});

/**
 * Each new signature is a COMBINATION of primitives under ONE target scope — and the resolver applies
 * every effect against the same subject set. The trap I had to avoid is a second effect that silently
 * no-ops because its natural scope differs from the technique's (a heal on an enemy-scope cast, a ward on
 * a self cast). These prove all effects of a representative self / party / enemy technique actually land.
 */
describe("§7B the combined signatures land ALL their effects (no target-scope no-op)", () => {
  function combatFor(classId: CharacterClassId, technique: string, tune: (member: GameState["party"][number]) => GameState["party"][number]) {
    return withDeterministicIds(`combo-${technique}`, () => {
      let state = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Ada", classId, seed: technique }));
      state = {
        ...state,
        party: state.party.map((member) =>
          tune({ ...member, level: 8, mp: 40, maxMp: 40, vocation: { current: classId, mastery: {}, progress: {}, learned: [technique], loadout: [technique] } })
        ),
        phase: "combat",
        combat: createSquadCombatState("room.b2f.005", [warden])
      } as GameState;
      // A wall of HP so one cast never ends the fight (combat → null would break the reads below).
      state = {
        ...state,
        combat: { ...state.combat!, enemyGroups: state.combat!.enemyGroups.map((g) => ({ ...g, hpEach: 999, maxHpEach: 999 })) }
      } as GameState;
      return state;
    });
  }
  const castNoTarget = (state: GameState, actorId: string, technique: string) =>
    executeCommand(state, defaultWorld, { type: "declare_round", actions: [{ actorId, action: "cast", spellId: technique as never }] });

  it("sap-weave heals the party AND raises a fire ward (party scope, heal + ward)", () => {
    const state = combatFor("priest", "sap-weave", (m) => ({ ...m, hp: 5 }));
    const actorId = state.party[0].id;
    const after = castNoTarget(state, actorId, "sap-weave");
    const healed = after.party.find((m) => m.id === actorId)!;
    expect(healed.hp, "the party heal half landed").toBeGreaterThan(5);
    const ward = (after.combat!.effects ?? []).find((e) => e.source === "sap-weave" && e.effect.kind === "ward");
    expect(ward, "the ward half must land too, not be a no-op").toBeDefined();
  });

  it("sheltering-prayer heals the warden AND leaves a cover in force (self scope, cover + heal)", () => {
    const state = combatFor("priest", "sheltering-prayer", (m) => ({ ...m, hp: 5 }));
    const actorId = state.party[0].id;
    const after = castNoTarget(state, actorId, "sheltering-prayer");
    expect(after.party.find((m) => m.id === actorId)!.hp, "the restore half landed").toBeGreaterThan(5);
    const cover = (after.combat!.effects ?? []).find((e) => e.source === "sheltering-prayer" && e.effect.kind === "cover");
    expect(cover?.subjectId, "cover must attach to the casting warden").toBe(actorId);
  });

  it("dew-cut damages the pack AND slows it (enemy scope, damage + debuff)", () => {
    const state = combatFor("swordmaster", "dew-cut", (m) => m);
    const groupId = state.combat!.enemyGroups[0].id;
    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: state.party[0].id, action: "cast", spellId: "dew-cut" as never, targetGroupId: groupId }]
    });
    expect(after.combat!.enemyGroups[0].hpEach, "the strike half landed").toBeLessThan(999);
    const slow = (after.combat!.effects ?? []).find((e) => e.subjectId === groupId && e.effect.kind === "debuff");
    expect(slow, "the slow half must land too").toBeDefined();
  });
});
