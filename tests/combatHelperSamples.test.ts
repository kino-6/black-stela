import { describe, expect, it } from "vitest";
import { COMBAT_HELPER_SAMPLES_SCHEMA_VERSION, buildCombatHelperSamples, combatHelperSamplesToJson } from "../src/tools/combatHelperSamples";

// S3 chunk 3b: the attack-helper parity fixture the GDScript port is checked against.
describe("combat-helper samples (Godot migration S3)", () => {
  it("is stable — re-exporting produces byte-identical JSON", () => {
    expect(combatHelperSamplesToJson()).toBe(combatHelperSamplesToJson());
  });

  it("covers rollPercent / damageGroup / criticalChance", () => {
    const s = buildCombatHelperSamples();
    expect(s.schemaVersion).toBe(COMBAT_HELPER_SAMPLES_SCHEMA_VERSION);
    // Exact-lethal damage empties a single-body group; luck 2 → crit 11.
    expect(s.damageGroup[1].result[0]).toMatchObject({ count: 0, hpEach: 0 });
    expect(s.criticalChance.find((c) => c.luck === 2)?.value).toBe(11);
  });
});
