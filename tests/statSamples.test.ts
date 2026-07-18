import { describe, expect, it } from "vitest";
import { STAT_SAMPLES_SCHEMA_VERSION, buildStatSamples, statSamplesToJson } from "../src/tools/statSamples";

// S3 chunk 3a: the getEffectiveCharacterStats parity fixture the GDScript port is checked against.
describe("effective-stats samples (Godot migration S3)", () => {
  it("is stable — re-exporting produces byte-identical JSON", () => {
    expect(statSamplesToJson()).toBe(statSamplesToJson());
  });

  it("covers base / plus / affix cases with a version envelope", () => {
    const fixture = buildStatSamples();
    expect(fixture.schemaVersion).toBe(STAT_SAMPLES_SCHEMA_VERSION);
    expect(fixture.samples.map((s) => s.name)).toEqual([
      "vanguard-base",
      "vanguard-plus2-weapon",
      "vanguard-saltbitten-weapon"
    ]);
    // Anchor the base case: vanguard 7 atk + Militia Sabre +2 = 9; Padded Jack +1 def over 3 armor = 4.
    const base = fixture.samples[0].stats;
    expect(base.attack).toBe(9);
    expect(base.armor).toBe(4);
    expect(base.attackElement).toBe("physical");
  });
});
