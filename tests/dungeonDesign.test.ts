import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { analyzeFloorGraph } from "../src/domain/floorGraph";
import type { ScenarioWorld } from "../src/domain/types";

// The dungeon-design Gate: turns the AGENTS.md "Dungeon Design Rules" into failing
// tests, so "make it meaningful / less linear / no contrived gates" is enforced
// across every floor of EVERY registered world (not just the default) — a new
// scenario cannot ship thin corridors, forced-combat landings, or a floor with no
// loop-back shortcut and escape the gate the way Verdant did (playtest). See
// docs/dungeon-patterns.md.
const floorDepth = (floorId: string | undefined) => Number(floorId?.match(/[bg](\d+)f/i)?.[1] ?? 0);

function downStairRoom(world: ScenarioWorld, floorId: string): string | null {
  const floor = world.dungeons.find((d) => d.id === floorId);
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

// On-floor loop-back shortcuts. A shortcut is EITHER a `shortcut` (warp) or — the Verdant rule, playtest —
// a `secret` hidden door whose far side is a physical passage (warps are banned there). Both stay on this
// floor. Returns every candidate (secret overrides are reciprocal, so a hidden door appears twice); rule 4
// then takes whichever collapses the descent best.
function shortcutEdges(world: ScenarioWorld, floorId: string): Array<{ from: string; to: string; kind: string }> {
  const floor = world.dungeons.find((d) => d.id === floorId);
  const roomByCellId = new Map((floor?.grid?.cells ?? []).map((c) => [c.id, c.roomId]));
  const out: Array<{ from: string; to: string; kind: string }> = [];
  for (const cell of floor?.grid?.cells ?? []) {
    for (const edge of Object.values(cell.edges)) {
      if (
        (edge?.kind === "shortcut" || edge?.kind === "secret") &&
        edge.targetCellId &&
        roomByCellId.has(edge.targetCellId)
      ) {
        out.push({ from: cell.roomId, to: roomByCellId.get(edge.targetCellId)!, kind: edge.kind });
      }
    }
  }
  return out;
}

// The full maze rules (frame-fill, honest sweep 300-360, shortcut collapse) are tuned for a
// 20×20 generated labyrinth. Every generated floor is held to them; the allowlist is where a
// floor is a DELIBERATE exception (a small set-piece or a boss finale), documented per entry.
const MAZE_EXEMPT = new Set<string>([
  // Default rollout debt: only B1F was ever rebuilt to the full maze rules; B2F–B7F are the older
  // hand-authored floors that still owe the shortcut / on-path-branch / honest-sweep work (documented
  // rollout debt — shrink this list as they are redesigned). B8F is the boss finale (boss-exempt already).
  "dungeon.b2f", "dungeon.b3f", "dungeon.b4f", "dungeon.b5f", "dungeon.b6f", "dungeon.b7f",
  // Verdant is generated (genVerdantFloors.mjs) and now meets the maze rules on EVERY floor — g2f's honest
  // sweep debt (was 286, under the 300 floor) is cleared by a windier seed (50522 → sweep 342), so it is no
  // longer exempt. Keep this list at default rollout debt only.
]);

describe("dungeon design gate", () => {
  for (const world of Object.values(worldRegistry)) {
    describe(world.id, () => {
      for (const floor of world.dungeons) {
        const graph = analyzeFloorGraph(world, floor.id);
        const downStair = downStairRoom(world, floor.id);
        const isMaze = !MAZE_EXEMPT.has(floor.id) && !(floor.tags ?? []).includes("boss");

        // Wiz-style 玄室: a room whose entry is a guaranteed fight AND that holds treasure. The early Verdant
        // floors owe a dense set of these (playtest); the gate stops them regressing below the agreed floor.
        const chamberFloor = /dungeon\.verdant\.g[123]f/.test(floor.id) ? 6 : 0;

        describe(floor.id, () => {
          it("rule 1 — dense, meaningful space (not a thin corridor)", () => {
            expect(graph.cellCount).toBeGreaterThanOrEqual(80);
          });

          if (chamberFloor > 0) {
            it(`玄室 — a guaranteed-fight + treasure room count of ≥ ${chamberFloor}`, () => {
              // A real 玄室 is a chamberGuardian room (its guardian is gated PER-ROOM, so every chamber fights
              // even sharing a pack table — NOT the old structural "has an encounter table" which let 6-8
              // chambers share one type and suppress each other) that ALSO holds treasure to guard.
              const genshitsu = floor.rooms.filter(
                (r) =>
                  (r as { chamberGuardian?: boolean }).chamberGuardian &&
                  (r.treasureTable || (r as { chest?: unknown }).chest)
              ).length;
              expect(genshitsu, `${floor.id} needs ≥ ${chamberFloor} 玄室`).toBeGreaterThanOrEqual(chamberFloor);
            });
          }

          it("rule 2 — non-linear: weaves back on itself (loops)", () => {
            expect(graph.loopCount).toBeGreaterThanOrEqual(4);
          });

          it("rule 5 — rewards pull outward (reward dead-ends exist)", () => {
            expect(graph.rewardDeadEndRoomIds.length).toBeGreaterThanOrEqual(1);
          });

          if (isMaze) {
            it("rule 1 — fills the whole 20×20 frame (no dead border regions)", () => {
              const cells = floor.grid?.cells ?? [];
              const xs = cells.map((c) => c.x);
              const ys = cells.map((c) => c.y);
              expect(Math.min(...xs)).toBeLessThanOrEqual(2);
              expect(Math.max(...xs)).toBeGreaterThanOrEqual(17);
              expect(Math.min(...ys)).toBeLessThanOrEqual(2);
              expect(Math.max(...ys)).toBeGreaterThanOrEqual(17);
            });

            it("rule 1+4 — a winding maze, not an open room: the honest sweep is long", () => {
              const sweep = graph.fullSweepSteps(floor.startRoom);
              expect(sweep).toBeGreaterThanOrEqual(300);
              expect(sweep).toBeLessThanOrEqual(360);
            });

            if (downStair) {
              it("rule 2 — real choices on the descent route (on-path branches)", () => {
                expect(graph.branchPointsOnPath(floor.startRoom, downStair)).toBeGreaterThanOrEqual(3);
              });

              it("rule 4 — a warp collapses the descent, or a hidden door short-circuits a long loop", () => {
                const candidates = shortcutEdges(world, floor.id);
                expect(candidates.length, `${floor.id} needs an on-floor shortcut (warp or hidden door)`).toBeGreaterThan(0);
                const warp = candidates.find((c) => c.kind === "shortcut");
                if (warp) {
                  // A magic warp can drop the party right by the deep stair: entrance → sealed door → (warp)
                  // → near the stair, in a few moves. (Default world; Verdant bans warps — see the world rule.)
                  const legIn = graph.shortestPathCells(floor.startRoom, warp.from).length - 1;
                  const legOut = graph.shortestPathCells(warp.to, downStair).length - 1;
                  expect(legIn + 1 + legOut, `${floor.id} warp collapse`).toBeLessThanOrEqual(15);
                } else {
                  // A PHYSICAL hidden door is bound to real adjacency — it can't teleport to the stair, so its
                  // worth is the loop it short-circuits: the open-only way round between its two sides (the
                  // secret edge itself is not walkable until found). A big loop = a real shortcut once revealed.
                  const loop = Math.max(
                    ...candidates.map((sc) => graph.shortestPathCells(sc.from, sc.to).length - 1)
                  );
                  expect(loop, `${floor.id} hidden-door loop ${loop} is too small to be a real shortcut`).toBeGreaterThanOrEqual(15);
                }
              });
            }
          }
        });
      }

      it("rule — every floor's landing is safe (no forced combat on arrival by stair)", () => {
        // The player must never be dropped into a fight the instant they take a stair
        // ("階段に強制戦闘置かないで"). A floor's startRoom is its arrival cell; it must carry
        // no encounter table.
        for (const floor of world.dungeons) {
          const landing = floor.rooms.find((room) => room.id === floor.startRoom);
          expect(landing, `${world.id} ${floor.id} startRoom ${floor.startRoom} not found`).toBeTruthy();
          expect(
            landing?.encounterTable,
            `${world.id} ${floor.id} landing ${floor.startRoom} must not force combat on arrival`
          ).toBeUndefined();
        }
      });

      if (world.id === "verdant") {
        it("rule — Verdant shortcuts are physical hidden doors, never warps (playtest: no teleport shortcuts)", () => {
          // The player rejected warp shortcuts ("ワープによるショートカットではなく、隠し扉、隠しみちのみ").
          // Every Verdant floor's shortcut must be a `secret` hidden door — spatially adjacent (a real door in a
          // wall, not a disguised teleport) — and NO floor may carry a `shortcut` (warp) edge.
          for (const floor of world.dungeons) {
            if ((floor.tags ?? []).includes("boss")) continue;
            const cellById = new Map((floor.grid?.cells ?? []).map((c) => [c.id, c]));
            const shortcuts = shortcutEdges(world, floor.id);
            expect(
              shortcuts.some((s) => s.kind === "shortcut"),
              `${floor.id} has a warp shortcut — Verdant allows only hidden doors`
            ).toBe(false);
            const secrets = shortcuts.filter((s) => s.kind === "secret");
            expect(secrets.length, `${floor.id} has no hidden-door shortcut`).toBeGreaterThan(0);
            // Every secret edge must join spatially-adjacent cells (a door in a wall), never a far cell (a warp
            // wearing a `secret` label). Look it up from the raw grid edge, not the room ids.
            for (const cell of floor.grid?.cells ?? []) {
              for (const edge of Object.values(cell.edges)) {
                if (edge?.kind !== "secret" || !edge.targetCellId) continue;
                const target = cellById.get(edge.targetCellId);
                expect(target, `${floor.id} secret edge targets an unknown cell`).toBeTruthy();
                const manhattan = Math.abs(cell.x - target!.x) + Math.abs(cell.y - target!.y);
                expect(
                  manhattan,
                  `${floor.id} secret edge spans ${manhattan} cells — a hidden door must join adjacent cells`
                ).toBe(1);
              }
            }
          }
        });
      }

      it("rule — a 玄室-dense floor's pack has ≥2 enemy types (playtest: chambers must not all be the same foe)", () => {
        // With 6-8 玄室 sharing one pack table, a single-type table made EVERY chamber the same fight
        // ("常時同じ敵"). Any floor carrying ≥2 chamberGuardian rooms must draw from ≥2 distinct enemy types
        // so the chambers vary.
        for (const floor of world.dungeons) {
          const chambers = floor.rooms.filter((r) => (r as { chamberGuardian?: boolean }).chamberGuardian).length;
          if (chambers < 2) continue;
          const table = (world.encounterTables ?? []).find((t) => t.floorId === floor.id && (t.entries?.length ?? 0) > 0);
          const distinctTypes = new Set((table?.entries ?? []).map((e) => e.enemyId)).size;
          expect(
            distinctTypes,
            `${world.id} ${floor.id} has ${chambers} 玄室 but its pack table draws only ${distinctTypes} enemy type(s)`
          ).toBeGreaterThanOrEqual(2);
        }
      });

      it("rule — a walkable floor can actually FIGHT: it has a wandering encounter table for its own id", () => {
        // Verdant is wandering-only (no set-piece encounters) — without a table whose floorId matches, a
        // party walks the whole maze and never fights (playtest "ランダムエンカウントがない"). Every
        // non-boss floor must own an encounter table so the corridor can ambush.
        for (const floor of world.dungeons) {
          if ((floor.tags ?? []).includes("boss")) continue;
          const table = (world.encounterTables ?? []).find((t) => t.floorId === floor.id && (t.entries?.length ?? 0) > 0);
          expect(
            table,
            `${world.id} ${floor.id} has no non-empty encounterTable for its floorId — the corridors can never ambush`
          ).toBeTruthy();
        }
      });
    });
  }
});
