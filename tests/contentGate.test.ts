import { describe, expect, it } from "vitest";
import { validateScenarioGraph } from "../src/services/scenarioPackLoader";
import { defaultWorld } from "../src/data/defaultWorld";
import type { ScenarioAffix, ScenarioVocation, ScenarioWorld } from "../src/domain/types";

// IMP-023 (the deterministic content Gate, Claude's slice — the seeded economy simulator + AI loop
// are Codex). Static, deterministic rejections that must hold before any playtest.
describe("deterministic content validation gate", () => {
  it("passes the shipped default world", () => {
    const errors = validateScenarioGraph(defaultWorld).filter((e) => e.severity !== "warning");
    expect(errors, JSON.stringify(errors)).toHaveLength(0);
  });

  it("rejects a DEAD affix that can never roll (no equipment for its slot)", () => {
    const deadAffix: ScenarioAffix = { id: "affix.dead", label: "Dead", slots: ["accessory"], minFloor: 1, rarity: "rare" };
    const world: ScenarioWorld = {
      ...defaultWorld,
      equipment: defaultWorld.equipment.filter((gear) => gear.slot !== "accessory"),
      affixes: [deadAffix]
    };
    const errors = validateScenarioGraph(world);
    expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ fieldPath: "affix.dead.slots" })]));
  });

  it("rejects a vocation unlock CYCLE", () => {
    const a: ScenarioVocation = { id: "voc.a", tier: "advanced", name: "A", requires: { mastered: ["voc.b"] } };
    const b: ScenarioVocation = { id: "voc.b", tier: "advanced", name: "B", requires: { mastered: ["voc.a"] } };
    const errors = validateScenarioGraph({ ...defaultWorld, vocations: [a, b] });
    expect(errors.some((e) => e.reason.includes("cycle"))).toBe(true);
  });

  it("rejects a vocation prerequisite that names an unknown vocation", () => {
    const orphan: ScenarioVocation = { id: "voc.orphan", tier: "advanced", name: "Orphan", requires: { mastered: ["voc.ghost"] } };
    const errors = validateScenarioGraph({ ...defaultWorld, vocations: [orphan] });
    expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ fieldPath: "voc.orphan.requires.mastered" })]));
  });
});
