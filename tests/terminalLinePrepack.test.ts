import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadScenarioPack } from "../src/services/scenarioPackLoader";

const root = resolve(process.cwd(), "content/worlds/terminal-line");
const dungeon = resolve(root, "assets/dungeon");

const enemyBasenames = [
  "enemy-tl1f-drain-rat",
  "enemy-tl1f-baton-unit",
  "enemy-tl1f-breath-collector",
  "enemy-tl1f-unmanned-stationmaster",
  "enemy-tl2f-cable-hound",
  "enemy-tl2f-rain-reclaimer",
  "enemy-tl3f-relay-tick",
  "enemy-tl3f-platform-auditor",
  "enemy-tl3f-transfer-warden",
  "enemy-tl4f-silt-lamprey",
  "enemy-tl4f-pump-sentinel",
  "enemy-tl5f-ration-porter",
  "enemy-tl5f-cold-store-widow",
  "enemy-tl6f-quarantine-orderly",
  "enemy-tl6f-archive-pallbearer",
  "enemy-tl7f-clearance-bailiff",
  "enemy-tl8f-signal-marshal",
  "enemy-tl9f-lift-custodian",
  "enemy-tl10f-zero-line-stationmaster"
];

const enemyIds = [
  "enemy.tl1f.drain-rat",
  "enemy.tl1f.baton-unit",
  "enemy.tl1f.breath-collector",
  "enemy.tl1f.unmanned-stationmaster",
  "enemy.tl2f.cable-hound",
  "enemy.tl2f.rain-reclaimer",
  "enemy.tl3f.relay-tick",
  "enemy.tl3f.platform-auditor",
  "enemy.tl3f.transfer-warden",
  "enemy.tl4f.silt-lamprey",
  "enemy.tl4f.pump-sentinel",
  "enemy.tl5f.ration-porter",
  "enemy.tl5f.cold-store-widow",
  "enemy.tl6f.quarantine-orderly",
  "enemy.tl6f.archive-pallbearer",
  "enemy.tl7f.clearance-bailiff",
  "enemy.tl8f.signal-marshal",
  "enemy.tl9f.lift-custodian",
  "enemy.tl10f.zero-line-stationmaster"
];

const itemIcons = [
  "item-tl-universal-round",
  "item-tl-field-dressing",
  "item-tl-terminal-fuse",
  "item-tl-transit-key-fragment"
];

function pngInfo(path: string) {
  const png = readFileSync(path);
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    // PNG colour type 6 is RGBA. These combat sprites must not silently lose alpha.
    colorType: png[25]
  };
}

function packFiles(directory = root, relative = ""): Record<string, string> {
  return Object.fromEntries(
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(directory, entry.name);
      const key = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return Object.entries(packFiles(path, key));
      return entry.name.endsWith(".md") && statSync(path).isFile() ? [[key, readFileSync(path, "utf8")]] : [];
    })
  );
}

describe("Terminal Line F1–F10 canonical pack", () => {
  it("loads its authored map, events, enemies, encounters, treasure, and progression as one pack", () => {
    const result = loadScenarioPack(packFiles());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result).toMatchObject({ ok: true, manifest: { id: "pack.terminal-line" } });

    expect(result.world.id).toBe("world.terminal-line");
    expect(result.world.dungeons.map((floor) => floor.id)).toEqual([
      "dungeon.tl1f", "dungeon.tl2f", "dungeon.tl3f", "dungeon.tl4f", "dungeon.tl5f",
      "dungeon.tl6f", "dungeon.tl7f", "dungeon.tl8f", "dungeon.tl9f", "dungeon.tl10f"
    ]);
    expect(result.world.enemies.map((enemy) => enemy.id)).toEqual(enemyIds);
    expect(result.world.dungeons[0].grid?.cells.length).toBeGreaterThanOrEqual(80);
    for (const floor of result.world.dungeons) expect(floor.grid?.cells.length).toBeGreaterThanOrEqual(80);
    expect(result.world.dungeons[0].rooms.some((room) => room.id === "room.tl1f.signal-office" && room.event)).toBe(true);
    expect(result.world.dungeons[1].rooms.some((room) => room.id === "room.tl2f.power-terminal" && (room.gates?.length ?? 0) > 0)).toBe(true);
    expect(result.world.dungeons.at(-1)?.rooms.some((room) => room.id === "room.tl10f.zero-core" && room.chamberGuardian)).toBe(true);
  });

  it("delivers every F1-F10 enemy as a 768-square RGBA base/hurt pair", () => {
    for (const basename of enemyBasenames) {
      for (const suffix of ["", "-hurt"]) {
        const info = pngInfo(resolve(dungeon, `${basename}${suffix}.png`));
        expect(info).toEqual({ width: 768, height: 768, colorType: 6 });
      }
    }
  });

  it("replaces the F1/F2 deep-table placeholder roster with three or more silhouettes per floor", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tables = new Map(result.world.encounterTables.map((table) => [table.id, table]));
    for (const floor of result.world.dungeons.slice(2)) {
      const tableIds = floor.rooms.flatMap((room) => room.encounterTable ? [room.encounterTable] : []);
      const ids = new Set(tableIds.flatMap((id) => tables.get(id)?.entries.map((entry) => entry.enemyId) ?? []));
      expect(ids.size).toBeGreaterThanOrEqual(3);
      expect([...ids].some((id) => /enemy\.tl(?:[3-9]f|10f)\./.test(id))).toBe(true);
    }
    expect(tables.get("encounters.tl10f.core")?.entries.map((entry) => entry.enemyId)).toEqual([
      "enemy.tl10f.zero-line-stationmaster"
    ]);
  });

  it("delivers every Terminal Line item and equipment icon as 256-square RGBA", () => {
    for (const basename of itemIcons) {
      expect(pngInfo(resolve(root, "assets/icons", `${basename}.png`))).toEqual({ width: 256, height: 256, colorType: 6 });
    }

    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const equipment of result.world.equipment) {
      const basename = equipment.id.replaceAll(".", "-");
      expect(pngInfo(resolve(root, "assets/icons", `${basename}.png`))).toEqual({ width: 256, height: 256, colorType: 6 });
    }
  });

  it("ships the shared stills and landmark props in the canonical pack", () => {
    for (const relative of [
      "assets/dungeon/stone-wall-block4.jpg",
      "assets/dungeon/stone-floor-block4.jpg",
      "assets/dungeon/sealed-door.jpg",
      "assets/dungeon/supply-locker.png",
      "assets/dungeon/maintenance-terminal.png",
      "assets/ui/town-hub.jpg",
      "assets/ui/dungeon-entrance.png",
      "assets/ui/combat-vignette.jpg"
    ]) {
      expect(existsSync(resolve(root, relative))).toBe(true);
    }
  });

  it("carries a Terminal Line-only equipment ladder through the F10 rewards", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const equipment = result.world.equipment;
    expect(equipment.length).toBeGreaterThanOrEqual(20);
    expect(equipment.every((piece) => piece.id.startsWith("equip.tl-"))).toBe(true);
    expect(new Set(equipment.map((piece) => piece.slot))).toEqual(
      new Set(["weapon", "offhand", "body", "head", "hands", "accessory"])
    );
    expect(new Set(equipment.map((piece) => piece.tier))).toEqual(new Set([1, 2, 3, 4, 5, 6]));

    const terminus = result.world.treasureTables.find((table) => table.id === "treasure.tl10f.terminus-cache");
    expect(terminus?.entries.map((entry) => entry.itemId)).toEqual(expect.arrayContaining([
      "equip.tl-platform-zero-plate", "equip.tl-zero-line-conductor", "equip.tl-end-marker-signet"
    ]));
  });
});
