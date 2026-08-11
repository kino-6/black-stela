import { describe, expect, it } from "vitest";
import { hasSecondaryExplorationClass, partyPlans, simulateCoverage, type Coverage, type Problem } from "../src/headless/coverageSim";
import { defaultWorld } from "../src/data/defaultWorld";

/**
 * §9.4e / §10 — the varied-party contract.
 *
 * Two claims, and they pull against each other, which is the point:
 *   1. NO CLASS IS COMPULSORY (§4). Every problem is resolvable without its specialist — by a second-
 *      best class, by items, or at worst slowly and badly. A party missing one class is never a dead end.
 *   2. THE SPECIALIST IS STILL THE ANSWER (§8). It is cheaper, safer, or reaches further than the
 *      alternatives. A world where the item route matched the class would fail this as surely as a world
 *      where the class were mandatory fails the first.
 *
 * These are ordering assertions rather than absolute numbers on purpose: the numbers are balance and
 * will move, but if the ORDER ever inverts, the class has stopped meaning anything.
 */

const rows = simulateCoverage(defaultWorld);
const find = (problem: Problem, coverage: Coverage) => rows.find((row) => row.problem === problem && row.coverage === coverage);

describe("§9.4e no class is compulsory", () => {
  it("every coverage level resolves every problem it is offered", () => {
    for (const row of rows) {
      expect(row.resolved, `${row.problem}/${row.coverage} is a dead end: ${row.detail}`).toBe(true);
    }
  });

  it("a party with NO answer still makes progress on each problem", () => {
    // The weakest possible party on each axis. It must be worse, never blocked.
    expect(find("recovery", "none")!.cost, "a healer-less party cannot fight at all").toBeGreaterThan(0);
    // `cost` for traps is (traps left armed) x100 from the EXPECTED value, so an untrained party must
    // still expect to clear some — never zero, which would mean a locked door with no Thief.
    const noTrapCover = find("traps", "none")!;
    expect(noTrapCover.detail).toMatch(/expected [1-9]/);
  });
});

describe("§9.4e the specialist is still the best answer", () => {
  it("recovery: a healer carries the party further than any substitute", () => {
    const specialist = find("recovery", "specialist")!;
    const secondary = find("recovery", "secondary")!;
    const item = find("recovery", "item")!;
    const none = find("recovery", "none")!;
    // `cost` here is fights survived, so MORE is better.
    expect(specialist.cost).toBeGreaterThan(secondary.cost);
    expect(specialist.cost).toBeGreaterThan(item.cost);
    expect(item.cost).toBeGreaterThanOrEqual(none.cost);
    // And the item route is the one you pay for, in gold and in charges that run out.
    expect(item.gold).toBeGreaterThan(0);
    expect(item.charges).toBeGreaterThan(0);
    expect(specialist.gold).toBe(0);
  });

  it("ward: the ward line beats the substitutes, and the substitutes beat nothing", () => {
    // `cost` is afflictions landed per able member-round, so LESS is better. This ordering is what
    // §9.4e's content tuning was for: the world used to present poison and silence almost exclusively —
    // both answered by CURES — so the Chanter's ward had nothing to stop and scored no better than an
    // empty back-row slot. The threat mix was the bug, not the ward.
    const specialist = find("ward", "specialist")!;
    const secondary = find("ward", "secondary")!;
    const item = find("ward", "item")!;
    const none = find("ward", "none")!;
    expect(specialist.cost).toBeLessThan(secondary.cost);
    expect(specialist.cost).toBeLessThan(item.cost);
    expect(secondary.cost).toBeLessThanOrEqual(none.cost);
    expect(item.cost).toBeLessThanOrEqual(none.cost);
  });

  it("traps: a Thief clears what tools only partly reach", () => {
    // `cost` is traps left armed, so LESS is better.
    const specialist = find("traps", "specialist")!;
    const item = find("traps", "item")!;
    const none = find("traps", "none")!;
    expect(specialist.cost).toBeLessThan(item.cost);
    expect(item.cost).toBeLessThan(none.cost);
    expect(item.gold).toBeGreaterThan(0);
  });
});

describe("§9.4e what the roster does NOT cover", () => {
  it("records that TRAPS (disarm) has no second-best class, only tools", () => {
    // D6 (2026-08-12) gave the Swordmaster a TRAINED `unlock` band, so a second exploration-capable class
    // now exists — but at UNLOCK (a chest problem), not at any of the three coverage problems below. On
    // DISARM/investigate/detect the Thief is still the only proficient class, so traps keep specialist /
    // item / none while recovery and ward each still have a real secondary. This tripwire now guards that
    // split: if a class ever gains `disarm`/recovery/ward proficiency, the matching plan must grow a
    // `secondary` party — the reminder to write one.
    expect(hasSecondaryExplorationClass()).toBe(true);
    expect(Object.keys(partyPlans("traps", defaultWorld)).sort()).toEqual(["item", "none", "specialist"]);
    expect(Object.keys(partyPlans("recovery", defaultWorld)).sort()).toEqual(["item", "none", "secondary", "specialist"]);
  });
});
