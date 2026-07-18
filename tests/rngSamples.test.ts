import { describe, expect, it } from "vitest";
import { hashSeed } from "../src/domain/rulesEngine";
import { RNG_SAMPLES_SCHEMA_VERSION, buildRngSamples, rngSamplesToJson } from "../src/tools/rngSamples";

// S3 combat groundwork: the RNG parity fixture the GDScript port is checked against. These lock that
// the fixture is stable and pin the offset-basis edge case (empty seed) the port has to reproduce.
describe("combat RNG samples (Godot migration S3)", () => {
  it("is stable — re-exporting produces byte-identical JSON", () => {
    expect(rngSamplesToJson()).toBe(rngSamplesToJson());
  });

  it("covers all three primitives with a version envelope", () => {
    const samples = buildRngSamples();
    expect(samples.schemaVersion).toBe(RNG_SAMPLES_SCHEMA_VERSION);
    expect(samples.hashSeed.length).toBeGreaterThan(0);
    expect(samples.rollDamage.length).toBeGreaterThan(0);
    expect(samples.chip.length).toBeGreaterThan(0);
  });

  it("pins the empty-seed offset basis (Math.abs never int32-truncates the final value)", () => {
    expect(hashSeed("")).toBe(2166136261);
  });
});
