import { describe, expect, it } from "vitest";
import { worldRegistry, listScenarios } from "../src/data/worldRegistry";
import { classCatalog } from "../src/domain/characterCreation";

describe("verdant scenario", () => {
  const verdant = worldRegistry.verdant;

  it("is registered as a switchable scenario", () => {
    expect(verdant).toBeDefined();
    expect(verdant.title).toContain("Verdant");
    expect(verdant.assetPack).toBe("verdant");
    expect(listScenarios().some((s) => s.worldId === "verdant")).toBe(true);
  });

  it("ships eight floors G1F..G8F in descent order", () => {
    expect(verdant.dungeons.map((d) => d.id)).toEqual([
      "dungeon.verdant.g1f", "dungeon.verdant.g2f", "dungeon.verdant.g3f", "dungeon.verdant.g4f",
      "dungeon.verdant.g5f", "dungeon.verdant.g6f", "dungeon.verdant.g7f", "dungeon.verdant.g8f"
    ]);
    expect(verdant.startRoom).toBe("room.verdant.g1f.001");
  });

  it("connects the descent: each floor's exit stair leads to the next floor's landing", () => {
    for (let n = 1; n <= 7; n += 1) {
      const floor = verdant.dungeons.find((d) => d.id === `dungeon.verdant.g${n}f`)!;
      const exitCell = floor.grid?.cells.find((c) => c.roomId === `room.verdant.g${n}f.exit`);
      const down = Object.values(exitCell?.edges ?? {}).find((e) => e?.kind === "stairs" && e.targetFloorId);
      expect(down?.targetFloorId, `g${n}f exit should descend`).toBe(`dungeon.verdant.g${n + 1}f`);
      expect(down?.targetRoomId).toBe(`room.verdant.g${n + 1}f.001`);
    }
  });

  it("ends at the G8F rootheart boss (finale, no deeper stair)", () => {
    const g8 = verdant.dungeons.find((d) => d.id === "dungeon.verdant.g8f")!;
    expect(g8.tags).toContain("boss");
    const keep = g8.rooms.find((r) => r.id === "room.verdant.g8f.keep");
    expect(keep?.encounterTable).toBe("encounters.verdant.g8.keep");
    const rootheart = verdant.enemies.find((e) => e.id === "enemy.verdant.g8.rootheart");
    expect(rootheart?.isBoss).toBe(true);
    const bossTable = verdant.encounterTables.find((tbl) => tbl.id === "encounters.verdant.g8.keep");
    expect(bossTable?.entries[0].enemyId).toBe("enemy.verdant.g8.rootheart");
    const hasDeeper = g8.grid?.cells.some((c) =>
      Object.values(c.edges).some((e) => e?.kind === "stairs" && e.targetFloorId && e.targetFloorId !== "dungeon.verdant.g7f")
    );
    expect(hasDeeper).toBeFalsy();
  });

  it("has a defined enemy for every encounter-table and squad reference", () => {
    const enemyIds = new Set(verdant.enemies.map((e) => e.id));
    for (const table of verdant.encounterTables) {
      for (const entry of table.entries) {
        expect(enemyIds.has(entry.enemyId), `${table.id} -> missing ${entry.enemyId}`).toBe(true);
      }
    }
    for (const floor of verdant.dungeons) {
      for (const room of floor.rooms) {
        for (const id of room.encounterSquad ?? []) {
          expect(enemyIds.has(id), `${room.id} squad -> missing ${id}`).toBe(true);
        }
      }
    }
  });

  it("inherits the shared base catalog (starter gear resolvable) despite no items.md", () => {
    const starterIds = new Set(classCatalog.flatMap((c) => Object.values(c.equipment ?? {})));
    const verdantEquipIds = new Set(verdant.equipment.map((e) => e.id));
    for (const id of starterIds) {
      expect(verdantEquipIds.has(id), `verdant missing starter ${id}`).toBe(true);
    }
    expect(verdant.items.some((i) => i.id === "item.healing-draught")).toBe(true);
  });
});
