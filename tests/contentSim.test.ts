import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { worldRegistry } from "../src/data/worldRegistry";
import { reviewAffixProposal, reviewVocationProposal, simulateContent } from "../src/headless/contentSim";
import type { ScenarioAffix, ScenarioVocation } from "../src/domain/types";

// IMP-023A/B — the deterministic content/economy simulator. Same seed ⇒ same report; it uses the
// production drop/economy/mastery rules, not a second copy.
describe("content simulator", () => {
  it("is deterministic — identical seed and options produce an identical report", () => {
    const a = simulateContent(defaultWorld, { seed: "sim-1", drops: 400, floor: 6 });
    const b = simulateContent(defaultWorld, { seed: "sim-1", drops: 400, floor: 6 });
    expect(a).toEqual(b);
  });

  it("reports a sane rarity split and exercises every authored affix over a deep, long run", () => {
    const report = simulateContent(defaultWorld, { seed: "coverage", drops: 1500, floor: 8 });
    expect(report.rarity.common).toBeGreaterThan(report.rarity.rare + report.rarity.epic); // commons dominate
    expect(report.rarity.rare + report.rarity.epic).toBeGreaterThan(0); // but rares appear
    // Every authored 黒碑 affix should roll at least once at floor 8 over 1500 drops (no dead content).
    expect(report.unusedAffixes, `unused: ${report.unusedAffixes.join(", ")}`).toEqual([]);
    expect(report.economy.sellGold).toBeGreaterThan(0);
    expect(report.economy.dismantleMaterials).toBeGreaterThan(0);
    expect(report.fightsToFirstMasteryRank).toBeGreaterThan(0);
  });

  it.each([
    ["default", worldRegistry.default],
    ["verdant", worldRegistry.verdant]
  ] as const)("%s reports complete vocation routes, mastery decay, and enemy counter coverage", (worldId, world) => {
    const report = simulateContent(world, { seed: `${worldId}-coverage`, drops: 2400, floor: 8, memberLevel: 8 });
    expect(report.vocations.uncoveredBasics, `${worldId}: uncovered basics`).toEqual([]);
    expect(report.vocations.requiredByAllAdvanced, `${worldId}: compulsory basics`).toEqual([]);
    expect(report.vocations.weakFloorMasteryGain, `${worldId}: weak-floor mastery`).toBeLessThan(
      report.vocations.matchedFloorMasteryGain
    );
    expect(report.enemyCounters.uncoveredEnemies, `${worldId}: dangerous enemies without two affix strategies`).toEqual([]);
    expect(report.findings, `${worldId}: ${report.findings.join("; ")}`).toEqual([]);
  });

  it("flags an out-of-band rare rate against versioned, overridable thresholds", () => {
    const report = simulateContent(defaultWorld, { seed: "band", drops: 500, floor: 6, thresholds: { maxRareRate: 0.001 } });
    expect(report.findings.some((f) => f.includes("above"))).toBe(true);
  });

  // IMP-023C — the acceptance harness bounces a bad proposal on evidence and accepts a sound one.
  it("rejects a proposed affix that can never roll, accepts a sound one", () => {
    const deadProposal: ScenarioAffix = { id: "affix.proposed-dead", label: "Proposed Dead", slots: ["weapon"], minFloor: 40, rarity: "rare", weight: 3, attackBonus: 2 };
    const dead = reviewAffixProposal(defaultWorld, deadProposal);
    expect(dead.accepted).toBe(false);
    expect(dead.findings.length).toBeGreaterThan(0); // never rolls at the sim floor → flagged

    const soundProposal: ScenarioAffix = { id: "affix.proposed-sound", label: "Proposed Sound", slots: ["weapon", "offhand", "body"], minFloor: 2, rarity: "rare", weight: 6, attackBonus: 2 };
    const sound = reviewAffixProposal(defaultWorld, soundProposal);
    expect(sound.accepted, `errors: ${sound.errors.join("; ")} findings: ${sound.findings.join("; ")}`).toBe(true);
  });

  it("rejects a proposed vocation whose prerequisites form a cycle", () => {
    const cyclic: ScenarioVocation = { id: "voc.proposed", tier: "advanced", name: "Proposed", requires: { mastered: ["voc.proposed"] } };
    const review = reviewVocationProposal(defaultWorld, cyclic);
    expect(review.accepted).toBe(false);
    expect(review.errors.some((e) => e.includes("cycle"))).toBe(true);
  });
});
