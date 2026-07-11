import { afterEach, describe, expect, it } from "vitest";
import { getActiveWorld, setActiveWorld } from "../src/data/activeWorld";
import { defaultWorld } from "../src/data/defaultWorld";
import { findEquipmentById } from "../src/ui/catalog";
import type { ScenarioWorld } from "../src/domain/types";

// Restore the default so a mutated active world never leaks into other suites.
afterEach(() => setActiveWorld(defaultWorld));

describe("active world accessor", () => {
  it("defaults to the default world", () => {
    expect(getActiveWorld()).toBe(defaultWorld);
  });

  it("catalog lookups resolve against whatever world is active", () => {
    // A synthetic world with a single bespoke equipment id the default world lacks.
    const bespoke = { id: "equip.bespoke-blade", name: "Bespoke Blade", slot: "weapon" } as unknown;
    const otherWorld = { ...defaultWorld, equipment: [bespoke] } as ScenarioWorld;

    setActiveWorld(otherWorld);
    expect(findEquipmentById("equip.bespoke-blade")).toBe(bespoke);
    // The default world's gear is no longer resolvable while otherWorld is active.
    expect(findEquipmentById(defaultWorld.equipment[0]?.id)).toBeUndefined();

    setActiveWorld(defaultWorld);
    expect(findEquipmentById("equip.bespoke-blade")).toBeUndefined();
    expect(findEquipmentById(defaultWorld.equipment[0]?.id)).toBe(defaultWorld.equipment[0]);
  });
});
