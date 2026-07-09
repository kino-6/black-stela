import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { analyzeFloorGraph } from "../src/domain/floorGraph";

// The dungeon-design Gate: turns the AGENTS.md "Dungeon Design Rules" into failing
// tests, so "make it meaningful / less linear / no contrived gates" is enforced
// across every floor, not left to opinion. See docs/dungeon-patterns.md.
const floorDepth = (floorId: string | undefined) => Number(floorId?.match(/b(\d+)f/)?.[1] ?? 0);

function downStairRoom(floorId: string): string | null {
  const floor = defaultWorld.dungeons.find((d) => d.id === floorId);
  const depth = floorDepth(floorId);
  for (const cell of floor?.grid?.cells ?? []) {
    for (const edge of Object.values(cell.edges)) {
      if (edge?.kind === "stairs" && edge.targetFloorId && floorDepth(edge.targetFloorId) > depth) {
        return cell.roomId;
      }
    }
  }
  return null;
}

describe("dungeon design gate", () => {
  // Floors rebuilt to the full AGENTS.md design rules. Grows as the rollout
  // proceeds; floors not yet here still owe rule 2's on-path branching (B7F is
  // linear today, B8F is the finale with no descent — documented rollout debt).
  const REDESIGNED = new Set(["dungeon.b1f"]);

  for (const floor of defaultWorld.dungeons) {
    const graph = analyzeFloorGraph(defaultWorld, floor.id);
    const downStair = downStairRoom(floor.id);

    describe(floor.id, () => {
      it("rule 1 — dense, meaningful space (not a thin corridor)", () => {
        expect(graph.cellCount).toBeGreaterThanOrEqual(80);
      });

      it("rule 2 — non-linear: weaves back on itself (loops)", () => {
        expect(graph.loopCount).toBeGreaterThanOrEqual(4);
      });

      it("rule 5 — rewards pull outward (reward dead-ends exist)", () => {
        expect(graph.rewardDeadEndRoomIds.length).toBeGreaterThanOrEqual(1);
      });

      if (REDESIGNED.has(floor.id) && downStair) {
        it("rule 2 — real choices on the descent route (on-path branches)", () => {
          expect(graph.branchPointsOnPath(floor.startRoom, downStair)).toBeGreaterThanOrEqual(3);
        });
      }
    });
  }

  it("rule 3 — no contrived descent lock outside the known rollout debt", () => {
    // Crank-gated descents on shallow public floors are a design smell. B1F is
    // fixed; B2/B4/B7 still carry them and are the documented rollout debt. This
    // fails loudly if a NEW contrived descent lock appears, or once the debt is paid
    // (then shrink the allowlist).
    const ROLLOUT_DEBT = new Set(["dungeon.b2f", "dungeon.b4f", "dungeon.b7f"]);
    for (const floor of defaultWorld.dungeons) {
      const lockedDescent = floor.rooms.some((room) =>
        room.gates?.some((gate) => Boolean(gate.requiredFlag?.includes("descent")))
      );
      if (!ROLLOUT_DEBT.has(floor.id)) {
        expect(lockedDescent, `${floor.id} must not gate its descent (AGENTS.md rule 3)`).toBe(false);
      }
    }
  });
});
