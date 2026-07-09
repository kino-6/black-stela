import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { floorForRoom, scaledEncounterCount, underpowerFactor } from "../src/domain/rulesEngine";
import type { Character } from "../src/domain/types";

// #3: an under-strength descent is punished by numbers — a party below a floor's
// recommended level and/or head-count meets bigger packs. These lock the tuning so
// "adequate party = base pack, low-level solo = swarm" can't silently drift.
const party = (count: number, level: number): Character[] =>
  Array.from({ length: count }, (_, i) => ({ id: `c${i}`, level }) as unknown as Character);

const b2f = defaultWorld.dungeons.find((d) => d.id === "dungeon.b2f")!; // rec: level 2, size 3
const b1f = defaultWorld.dungeons.find((d) => d.id === "dungeon.b1f")!; // rec: level 1, size 3

describe("under-strength descent scaling", () => {
  it("leaves an adequate party at the base pack size", () => {
    expect(underpowerFactor(party(3, 2), b2f)).toBe(1);
    expect(scaledEncounterCount(3, party(3, 2), b2f)).toBe(3);
    // An over-strength party is never scaled down below the base.
    expect(scaledEncounterCount(3, party(6, 5), b1f)).toBe(3);
  });

  it("swells packs for a low-level solo descent", () => {
    // Level short by 1, size short by 2 → factor 1 + 0.5 + 0.7 = 2.2.
    expect(underpowerFactor(party(1, 1), b2f)).toBeCloseTo(2.2, 5);
    // Base pack of 3 → ~7, capped by base+4.
    expect(scaledEncounterCount(3, party(1, 1), b2f)).toBe(7);
  });

  it("scales for a level shortfall alone and a size shortfall alone", () => {
    // Full party but under-levelled: level short by 1 → factor 1.5.
    expect(underpowerFactor(party(3, 1), b2f)).toBeCloseTo(1.5, 5);
    // Right level but two short on bodies → factor 1 + 0.7 = 1.7.
    expect(underpowerFactor(party(1, 2), b2f)).toBeCloseTo(1.7, 5);
  });

  it("caps the swarm so a group stays readable", () => {
    // Extreme shortfall is clamped by maxFactor (2.5) and the absolute cap (8).
    expect(underpowerFactor(party(1, 1), b2f)).toBeLessThanOrEqual(2.5);
    expect(scaledEncounterCount(5, party(1, 1), b2f)).toBeLessThanOrEqual(8);
  });

  it("resolves the floor that owns a room", () => {
    expect(floorForRoom(defaultWorld, "room.b2f.001")?.id).toBe("dungeon.b2f");
    expect(floorForRoom(defaultWorld, "room.b1f.hub")?.id).toBe("dungeon.b1f");
  });
});
