import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { worldRegistry } from "../src/data/worldRegistry";
import { minClearLevel, partySizeValue, provisionValue, simulateDescent } from "../src/headless/descentSim";
import type { ScenarioWorld } from "../src/domain/types";

// The difficulty Gate for the TWO axes slice 2 made measurable — party-size attrition and the
// resource-economy (kit) — as executable targets, so a knob change that quietly drains them is a red
// gate, not a feel call. The prepare-or-wipe + act-curve axes are gated per world in
// descentSim.test.ts / verdantBalance.test.ts; this file does not duplicate them. Read
// docs/design/difficulty-design.md for the theory and `npm run sim:balance` for the design surface.
const WORLDS: { id: string; world: ScenarioWorld }[] = [
  { id: "default", world: defaultWorld },
  { id: "verdant", world: worldRegistry.verdant }
];

describe("difficulty axes — party-size & resource-economy", () => {
  for (const { id, world } of WORLDS) {
    describe(id, () => {
      // PARTY-SIZE (Wiz-style proportional attrition): running solo/under-strength costs real levels,
      // but a path remains — never an impossible wall (levelsCost is finite, i.e. solo still clears
      // under the cap) and never trivial (a full party is worth a meaningful head start).
      it("running under-strength costs a large-but-finite number of levels", () => {
        const psv = partySizeValue(world, "prepared");
        expect(psv.soloMinLevel).toBeLessThanOrEqual(24); // a leveled solo still has a path
        expect(psv.levelsCost).toBeGreaterThanOrEqual(4); // …but solo is genuinely dangerous
        expect(psv.levelsCost).toBeLessThanOrEqual(18);
      });

      // PROVISION (the kit): carrying consumables never HURTS (levelsSaved >= 0) and never trivialises
      // the crawl (a kit worth many levels is the buy-99-heals faceroll the scarcity design exists to
      // prevent). 0 is honest for the current curve — the kit is a finale comfort, not yet a survival
      // enabler; making it load-bearing EARLY is the reshaping target in the design doc.
      it("the kit helps but never facerolls the descent", () => {
        const pv = provisionValue(world, "prepared");
        expect(pv.levelsSaved).toBeGreaterThanOrEqual(0);
        expect(pv.levelsSaved).toBeLessThanOrEqual(4);
      });

      // T13 (user, 2026-08-02): "作成したてのLv1では1F徘徊は困難 — 施設をしっかり使わないと攻略できない。"
      // A freshly created Lv1 party (naive = the class STARTING loadout, no shopping/provisioning) is
      // all-but-wiped clearing floor 1 — it cannot progress without using the town facilities. A facility-
      // equipped (mid = a shop general weapon+body) party clears floor 1 with real margin. This locks the
      // per-fight Act I weight that makes the town loop (稼ぐ→買う→突破) mandatory. It does NOT contradict
      // the "Act I teaches gently" act-curve gates — those measure a LEVELLED party at its clear level,
      // where floor 1 is genuinely gentle; THIS measures the fresh Lv1 party, for whom it is a wall.
      it("floor 1 gates on facilities — a fresh Lv1 party is all-but-wiped, a shopped party clears", () => {
        // The facility difference is SURVIVAL, not the floor-1 trough. With REALISTIC gear (the availability-aware
        // sim wears only tier-1 on floor 1, not the endgame reward it used to bake in), a fresh party's floor-1 dip
        // is scary for both — but the SHOPPED party (gear + a provisioned kit) SUSTAINS the descent while the naive
        // party cannot. The old ≥0.3-trough check only held under the over-geared sim (user "B" recalibration 2026-08-04).
        const naive = simulateDescent(world, { heal: "town", policy: "naive", startLevel: 1 });
        const shopped = simulateDescent(world, { heal: "town", policy: "mid", startLevel: 1, provision: { healThreshold: 0.6 } });
        // 施設なし: a blind first dive is a near-wipe on floor 1, and cannot sustain the descent.
        expect(naive.floors[0].lowestHpPct).toBeLessThanOrEqual(0.2);
        expect(naive.survived).toBe(false);
        // 施設あり: a shopped, provisioned party CAN sustain it — facility use IS the path, not a faceroll —
        // and fares no worse than the naive party on floor 1.
        expect(shopped.survived).toBe(true);
        expect(shopped.floors[0].downed).toBeLessThanOrEqual(naive.floors[0].downed);
      });
    });
  }
});

// RESOURCE-ECONOMY scarcity — only for a world that AUTHORS an economy block. A one-push must ration
// the kit to the finale and run it dry there (the retreat trigger), on a priced-and-affordable kit.
// A world that omits economy keeps modern no-scarcity play and is not gated here.
describe("resource-economy scarcity (worlds with an authored economy)", () => {
  for (const { id, world } of WORLDS) {
    if (!world.balance?.economy) {
      continue;
    }
    describe(id, () => {
      const clearLevel = minClearLevel(world, "prepared");
      // Scarcity is the RETREAT-TRIGGER of a one-push that pushes PAST comfort — measured one level under the
      // comfortable clear level. At the clear level itself a prepared, properly-armoured party is self-sufficient
      // and never rations dry (the armorBonus→defenseBonus fix made verdant's armour actually work); the bite that
      // empties the kit in the final act is the edge push (user "B" recalibration 2026-08-04).
      const run = simulateDescent(world, { heal: "none", policy: "prepared", startLevel: Math.max(1, clearLevel - 1), provision: true });
      const floors = world.dungeons.map((d) => d.id);
      const lastAct = new Set(floors.slice(Math.floor((floors.length * 2) / 3))); // final third

      it("carries a priced kit and actually spends it", () => {
        expect(run.provisioned).toBe(true);
        expect(run.kitCost).toBeGreaterThan(0);
        const burned = run.floors.reduce((total, f) => total + f.healsUsed + f.curesUsed, 0);
        expect(burned).toBeGreaterThan(0);
      });

      it("rations to the finale and runs dry in the final act (the retreat trigger)", () => {
        expect(run.kitExhaustedFloor).not.toBeNull();
        expect(lastAct.has(run.kitExhaustedFloor!)).toBe(true);
      });

      it("dive income covers a re-provision without flooding", () => {
        expect(Number.isFinite(run.economyBalance)).toBe(true);
        expect(run.economyBalance).toBeGreaterThanOrEqual(1); // you can afford to restock
        // T31 (2026-08-03): a 10-floor descent brings two more floors of dive income; the "not a flood"
        // ceiling rises a step with the deeper run (地続き). Default (still 8F) stays well under.
        expect(run.economyBalance).toBeLessThanOrEqual(8); // …but gold is not a flood
      });

      it("never wipes a prepared, provisioned party on the one-push", () => {
        expect(run.survived).toBe(true);
        expect(run.floors.every((f) => !f.wiped)).toBe(true);
      });
    });
  }
});
