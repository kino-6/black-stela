import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { simulateDescent } from "../src/headless/descentSim";
import { validateScenarioGraph } from "../src/services/scenarioPackLoader";
import type { ScenarioWorld } from "../src/domain/types";

// IMP-041 — wandering-encounter DENSITY is scenario-authored (world.balance.wanderingEncounterPct /
// wanderingCooldownSteps), not a fixed engine constant. A world with no override keeps the engine
// defaults (proven cross-runtime by verify_parity's traces, which stay byte-identical); a world that
// authors a denser table walks into more fights. The same balance block ships to Godot, whose
// encounters.gd reads the same keys with the same defaults.

function withDensity(world: ScenarioWorld, pct: number, cooldown: number): ScenarioWorld {
  return { ...world, balance: { ...(world.balance ?? {}), wanderingEncounterPct: pct, wanderingCooldownSteps: cooldown } };
}

describe("wandering density is scenario-authored (IMP-041)", () => {
  const verdant = worldRegistry.verdant; // wandering-only world — its corridors draw ambushes

  it("a denser authored table produces more fights than the default", () => {
    // Survive the first floor either way (prepared, well above the curve) so the comparison is the
    // number of encounters DRAWN, not who wiped first.
    const opts = { policy: "prepared" as const, heal: "none" as const, startLevel: 14 };
    const base = simulateDescent(verdant, opts);
    const dense = simulateDescent(withDensity(verdant, 100, 0), opts); // every eligible step, no cooldown

    expect(base.floors.length).toBeGreaterThan(0);
    expect(dense.floors[0].fights).toBeGreaterThan(base.floors[0].fights);
  });

  it("the density knobs pass scenario validation", () => {
    const authored = withDensity(verdant, 6, 10);
    expect(() => validateScenarioGraph(authored)).not.toThrow();
  });

  it("an omitted override leaves the world's other balance knobs intact", () => {
    const authored = withDensity(verdant, 6, 10);
    expect(authored.balance?.threatScalar).toBe(verdant.balance?.threatScalar);
  });
});
