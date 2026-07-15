import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { validateScenarioGraph } from "../src/services/scenarioPackLoader";

// Elements are the world's own cosmology (2026-07-15), not a fixed engine union. The ash pit
// fights with fire / salt / star; the drowned wood with fire / wood / metal — and the counterplay
// the design is built on (hit the weakness, don't get your own weakness hit) only means anything
// if a weakness can NEVER silently name an element the world doesn't have.
describe("world elements", () => {
  it("each world declares its own cosmology", () => {
    const ids = (world: (typeof worldRegistry)[string]) => (world.elements ?? []).map((e) => e.id).sort();
    expect(ids(worldRegistry.default)).toEqual(["fire", "salt", "star"]);
    expect(ids(worldRegistry.verdant)).toEqual(["fire", "metal", "wood"]);
  });

  it("every declared element carries a Japanese label", () => {
    for (const world of Object.values(worldRegistry)) {
      for (const element of world.elements ?? []) {
        expect(element.locales?.ja?.label, `${element.id} has no ja label`).toBeTruthy();
      }
    }
  });

  it("both shipped worlds validate — no weakness or threat names an undeclared element", () => {
    for (const world of Object.values(worldRegistry)) {
      expect(validateScenarioGraph(world), `${world.id} has element errors`).toEqual([]);
    }
  });

  it("the loader REJECTS a weakness that names an element the world never declared", () => {
    // physical is universal; salt is not declared in verdant. Naming it must fail at load, not
    // read as a multiplier of 1 forever.
    const verdant = worldRegistry.verdant;
    const broken = {
      ...verdant,
      enemies: verdant.enemies.map((enemy, index) =>
        index === 0 ? { ...enemy, weaknesses: { ...enemy.weaknesses, salt: 1.5 } } : enemy
      )
    };
    const errors = validateScenarioGraph(broken);
    expect(errors.some((error) => error.reason.includes("salt")), "an undeclared salt weakness passed").toBe(true);
  });

  it("physical is universal — a physical weakness never needs declaring", () => {
    const world = worldRegistry.verdant;
    const withPhysical = {
      ...world,
      enemies: world.enemies.map((enemy, index) =>
        index === 0 ? { ...enemy, weaknesses: { physical: 1.5 } } : enemy
      )
    };
    expect(validateScenarioGraph(withPhysical)).toEqual([]);
  });
});
