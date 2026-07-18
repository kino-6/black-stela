import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { SLICE_ROUTES, TRACE_SCHEMA_VERSION, buildTraceFixture, traceFixtureToJson } from "../src/tools/traceExport";

// S1 migration parity targets: the golden trace fixtures a GDScript port must reproduce. These lock
// that every slice route builds, is STABLE (re-export → identical bytes), and carries a replayable
// initial state + per-step hashes.
describe("golden trace fixtures (Godot migration S1)", () => {
  it("builds every slice route with a versioned, non-trivial trace", () => {
    expect(SLICE_ROUTES.length).toBeGreaterThan(0);
    for (const route of SLICE_ROUTES) {
      const world = worldRegistry[route.worldId];
      const fixture = buildTraceFixture(route, world);
      expect(fixture.schemaVersion).toBe(TRACE_SCHEMA_VERSION);
      expect(fixture.name).toBe(route.name);
      expect(fixture.steps.length).toBe(fixture.commands.length);
      expect(fixture.initialStateHash).toMatch(/^[0-9a-f]{8}$/);
      // The route actually changed the world (first step differs from the start).
      expect(fixture.steps[0].stateHash).not.toBe(fixture.initialStateHash);
    }
  });

  it("is stable — re-exporting a route produces byte-identical JSON (reproducible parity target)", () => {
    for (const route of SLICE_ROUTES) {
      const world = worldRegistry[route.worldId];
      expect(traceFixtureToJson(route, world)).toBe(traceFixtureToJson(route, world));
    }
  });

  it("carries a serialized initial state so a runtime can replay from it", () => {
    const route = SLICE_ROUTES[0];
    const fixture = buildTraceFixture(route, worldRegistry[route.worldId]);
    expect(fixture.initialState.party.length).toBeGreaterThan(0);
    // Character ids are stable under the route's deterministic-id seed (not random UUIDs), so the
    // fixture reproduces across runs and a port can start from the exact same state.
    expect(fixture.initialState.party[0].id).toMatch(/^b1f-combat-victory:init-/);
  });
});
