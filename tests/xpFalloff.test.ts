import { describe, expect, it } from "vitest";
import { enemyLevel, rewardXpFor, xpFalloffMultiplier } from "../src/domain/leveling";

// Slice 3: grinding a floor you have outgrown pays visibly less each level over — but never zero,
// and preparation (fighting things that are actually a threat) always pays full. The user's call:
// "頭打ちは言い過ぎで、成長速度がUXとして明らかに鈍るがいい." And the growth MEANS the player earns
// through effort — bounty targets, the rare prized runners — bypass it entirely.
describe("XP falloff (diminishing returns, not a cap)", () => {
  it("pays full XP for a fight at or above your level", () => {
    expect(xpFalloffMultiplier(3, 3)).toBe(1);
    expect(xpFalloffMultiplier(3, 5)).toBe(1); // the enemy out-levels you — full value
  });

  it("visibly slows as you out-level the content, but never stops", () => {
    const one = xpFalloffMultiplier(4, 3);
    const four = xpFalloffMultiplier(7, 3);
    const far = xpFalloffMultiplier(20, 3);
    expect(one).toBeLessThan(1); // one level over already trims it
    expect(four).toBeLessThan(one); // and it keeps shrinking
    expect(far).toBeGreaterThan(0); // …but a trickle always remains — not a wall
    expect(far).toBeLessThan(0.2);
  });

  it("derives an enemy level from dangerTier when none is authored", () => {
    expect(enemyLevel({ dangerTier: 1 })).toBe(1);
    expect(enemyLevel({ dangerTier: 5 })).toBe(9);
    expect(enemyLevel({ dangerTier: 5, level: 3 })).toBe(3); // an authored level wins
  });

  it("trims a veteran's take from trash, but a fresh recruit still banks the full worth", () => {
    const trash = { dangerTier: 1 }; // enemyLevel 1
    const recruit = rewardXpFor(20, 1, trash);
    const veteran = rewardXpFor(20, 9, trash);
    expect(recruit).toBe(20);
    expect(veteran).toBeLessThan(recruit / 2);
    expect(veteran).toBeGreaterThanOrEqual(1); // still something
  });

  it("a prized runner pays in full at ANY level — the growth reward bypasses the falloff", () => {
    const prized = { dangerTier: 2, prizedXp: true };
    expect(rewardXpFor(60, 1, prized)).toBe(60);
    expect(rewardXpFor(60, 20, prized)).toBe(60); // even a maxed party earns the whole prize
  });
});
