import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";

// T14: the delivered enemy sprites must actually be USED, no encounter table may name a non-existent
// enemy, and each exploration floor should field real silhouette variety (so a whole act does not reuse
// the same 2 shapes). The tutorial first floor is allowed to stay simpler.
const NEW_VARIETY: Record<string, string[]> = {
  default: ["enemy.b1f.ember-beetle", "enemy.b3f.salt-leech", "enemy.b5f.ledger-wisp", "enemy.b7f.sealbreaker"],
  verdant: ["enemy.verdant.g1.bark-tick", "enemy.verdant.g3.sporerook", "enemy.verdant.g5.sap-eel", "enemy.verdant.g7.root-moth"]
};

describe("T14 encounter variety coverage", () => {
  for (const worldId of ["default", "verdant"] as const) {
    const world = worldRegistry[worldId];
    const referenced = new Set(world.encounterTables.flatMap((t) => t.entries.map((e) => e.enemyId)));
    const enemyIds = new Set(world.enemies.map((e) => e.id));

    describe(worldId, () => {
      it("every new variety enemy (its art is delivered) is reachable in an encounter table", () => {
        for (const id of NEW_VARIETY[worldId]) {
          expect(referenced.has(id), `${id} is not in any encounter table — its sprite would never appear`).toBe(true);
        }
      });

      it("no encounter table names an enemy that does not exist (catches typos / renamed ids)", () => {
        for (const id of referenced) {
          expect(enemyIds.has(id), `${id} is referenced by an encounter table but has no enemy definition`).toBe(true);
        }
      });

      it("each exploration floor fields ≥3 distinct silhouettes (the tutorial first floor may stay at 2)", () => {
        for (const floor of world.dungeons) {
          // Only the normal-exploration tables (not the single-boss `keep` chokes) count toward variety.
          const types = new Set(
            world.encounterTables
              .filter((t) => t.floorId === floor.id && !t.id.includes("keep"))
              .flatMap((t) => t.entries.map((e) => e.enemyId))
          );
          if (types.size === 0) continue; // a boss-only floor with its fight authored on the room
          const isTutorial = /\.b1f$|\.g1f$/.test(floor.id);
          expect(types.size, `${floor.id} silhouettes`).toBeGreaterThanOrEqual(isTutorial ? 2 : 3);
        }
      });
    });
  }
});
