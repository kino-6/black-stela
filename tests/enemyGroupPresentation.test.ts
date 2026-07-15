import { describe, expect, it } from "vitest";
import { enemyGroupHealthPercent } from "../src/ui/enemyGroupPresentation";

describe("enemy group presentation", () => {
  it("depletes monotonically when one member falls and the next member is unhurt", () => {
    const snapshots = [
      { count: 2, hpEach: 4 },
      { count: 2, hpEach: 2 },
      { count: 1, hpEach: 4 },
      { count: 1, hpEach: 2 },
      { count: 0, hpEach: 0 }
    ];

    expect(
      snapshots.map((snapshot) =>
        enemyGroupHealthPercent({ ...snapshot, maxHpEach: 4, initialCount: 2 })
      )
    ).toEqual([100, 75, 50, 25, 0]);
  });
});
