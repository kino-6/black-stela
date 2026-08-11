import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";

// Design rule (user, 2026-08-10): a DAMAGE FLOOR (刃の床 / room.damageTile) is an obstacle to be solved on
// the PROGRESSION route — something the party has to reckon with while pushing forward — NOT attrition you
// silently eat while slipping through a bypass, and NEVER something a first floor (1F) inflicts on a fresh,
// cushion-less party. This gate locks the "no damage floor on 1F" half so it cannot regress. The companion
// "no attrition on a bypass/shortcut" half is a review-time judgement the gate cannot classify from data; it
// is recorded in the drpg-scenario skill.
describe("hazard placement gate — no damage floor on a first floor", () => {
  const firstFloors = Object.entries(worldRegistry).flatMap(([worldId, world]) =>
    world.dungeons.filter((floor) => floor.level === 1).map((floor) => ({ worldId, floor }))
  );

  it("some world actually ships a 1F to check (guards against the enumeration going silently empty)", () => {
    expect(firstFloors.length).toBeGreaterThan(0);
  });

  for (const { worldId, floor } of firstFloors) {
    it(`${worldId} / ${floor.id} (1F) places no damage floor`, () => {
      const offenders = floor.rooms.filter((room) => room.damageTile != null).map((room) => room.id);
      expect(offenders, `damageTile on 1F rooms: ${offenders.join(", ")}`).toHaveLength(0);
    });
  }
});
