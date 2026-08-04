import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadScenarioPack } from "../src/services/scenarioPackLoader";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { findTechnique } from "../src/domain/techniques";
import { combatLoadout } from "../src/domain/vocations";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { createInitialGameState } from "../src/domain/gameState";

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
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const item of result.world.items) {
      const basename = item.id.replaceAll(".", "-");
      expect(pngInfo(resolve(root, "assets/icons", `${basename}.png`))).toEqual({ width: 256, height: 256, colorType: 6 });
    }
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
    expect(equipment.length).toBeGreaterThanOrEqual(48);
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

  it("puts supplies and lateral equipment across the complete descent", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const itemIds = result.world.items.map((item) => item.id);
    expect(itemIds).toEqual(expect.arrayContaining([
      "item.tl-rainwater-flask", "item.tl-trauma-seal", "item.tl-chime-muffler",
      "item.tl-dispatch-stimulant", "item.tl-breach-wedge", "item.tl-tripwire-shim"
    ]));
    const treasure = new Map(result.world.treasureTables.map((table) => [table.id, table]));
    expect(treasure.get("treasure.tl4f.rainworks-cache")?.entries.map((entry) => entry.itemId)).toEqual(expect.arrayContaining([
      "item.tl-breach-wedge", "item.tl-tripwire-shim"
    ]));
    expect(treasure.get("treasure.tl9f.lift-cache")?.entries.map((entry) => entry.itemId)).toContain("equip.tl-route-seal");
  });

  it("keeps four five-step firearm update lines, including the Type 38 infantry rifle", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const firearms = new Map(result.world.equipment.map((equipment) => [equipment.id, equipment]));
    const lines = {
      sidearm: ["equip.tl-service-pistol", "equip.tl-concourse-6-pistol", "equip.tl-relay-11-pistol", "equip.tl-bureau-sidearm", "equip.tl-zero-line-heavy-pistol"],
      longGun: ["equip.tl-platform-38-rifle", "equip.tl-relay-carbine", "equip.tl-ironrain-74-rifle", "equip.tl-quarantine-62-dmr", "equip.tl-evacuation-carbine"],
      smg: ["equip.tl-drain-5-smg", "equip.tl-ticket-7-smg", "equip.tl-turnstile-9-smg", "equip.tl-bureau-17-smg", "equip.tl-zero-line-21-smg"],
      shotgun: ["equip.tl-maintenance-10-shotgun", "equip.tl-pump-8-shotgun", "equip.tl-sluice-shotgun", "equip.tl-floodgate-12-shotgun", "equip.tl-terminus-14-shotgun"]
    };
    for (const ids of Object.values(lines)) {
      expect(ids.map((id) => firearms.get(id)?.slot)).toEqual(["weapon", "weapon", "weapon", "weapon", "weapon"]);
      expect(ids.map((id) => firearms.get(id)?.tier)).toEqual([1, 2, 3, 4, 5]);
      expect(ids.every((id) => firearms.get(id)?.tags?.includes("firearm"))).toBe(true);
    }
    expect(firearms.get("equip.tl-platform-38-rifle")?.locales?.ja?.name).toBe("三八式歩兵銃");
  });

  it("binds ten real active techniques to each firearm family and six automatic firearm passives", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const firearms = new Map(result.world.equipment.map((equipment) => [equipment.id, equipment]));
    const lines = {
      pistol: ["equip.tl-service-pistol", "equip.tl-concourse-6-pistol", "equip.tl-relay-11-pistol", "equip.tl-bureau-sidearm", "equip.tl-zero-line-heavy-pistol"],
      rifle: ["equip.tl-platform-38-rifle", "equip.tl-relay-carbine", "equip.tl-ironrain-74-rifle", "equip.tl-quarantine-62-dmr", "equip.tl-evacuation-carbine"],
      smg: ["equip.tl-drain-5-smg", "equip.tl-ticket-7-smg", "equip.tl-turnstile-9-smg", "equip.tl-bureau-17-smg", "equip.tl-zero-line-21-smg"],
      shotgun: ["equip.tl-maintenance-10-shotgun", "equip.tl-pump-8-shotgun", "equip.tl-sluice-shotgun", "equip.tl-floodgate-12-shotgun", "equip.tl-terminus-14-shotgun"]
    };

    for (const ids of Object.values(lines)) {
      const active = ids.flatMap((id) => firearms.get(id)?.grantsTechniques ?? []);
      expect(active, ids.join(", ")).toHaveLength(10);
      expect(new Set(active).size, ids.join(", ")).toBe(10);
    }
    for (const [family, ids] of Object.entries(lines)) {
      for (const techniqueId of ids.flatMap((id) => firearms.get(id)?.grantsTechniques ?? [])) {
        expect(findTechnique(techniqueId)!.tags).toContain(family);
      }
    }
    for (const equipment of [...firearms.values()].filter((candidate) => candidate.tags?.includes("firearm"))) {
      expect(equipment.grantsTechniques, equipment.id).toHaveLength(2);
      expect(equipment.grantsTechniques?.every((id) => equipment.tags?.some((tag) => findTechnique(id)!.tags?.includes(tag))), equipment.id).toBe(true);
    }
    const passives = new Set([...firearms.values()].flatMap((equipment) => equipment.grantsPassives ?? []));
    expect(passives).toEqual(new Set([
      "quick-draw", "sidearm-discipline", "steady-sight", "close-control", "breach-brace", "last-platform-stance"
    ]));

    for (const equipment of firearms.values()) {
      const passiveIds = equipment.grantsPassives ?? [];
      if (passiveIds.length === 0) continue;
      expect(passiveIds).toHaveLength(1);
      expect(findTechnique(passiveIds[0])!.passiveBonus).toEqual(equipment.passiveBonus);
    }
  });

  it("makes firearm techniques and their passive stats exist only while their source weapon is equipped", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const hero = createGuildCharacter({ name: "試射手", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"] });
    const withRifle = { ...hero, equipment: { ...hero.equipment, weapon: { id: "equip.tl-relay-carbine" } } };
    expect(combatLoadout(withRifle, result.world)).toEqual(expect.arrayContaining(["rifle-brace", "rifle-hamper"]));

    const withoutRifle = {
      ...withRifle,
      equipment: { ...withRifle.equipment, weapon: { id: "equip.tl-crowbar" } },
      vocation: { current: "warrior", mastery: {}, progress: {}, learned: ["rifle-brace"], loadout: ["rifle-brace"] }
    };
    expect(combatLoadout(withoutRifle, result.world)).not.toEqual(expect.arrayContaining(["rifle-brace", "rifle-hamper"]));

    const worldWithoutPassive = {
      ...result.world,
      equipment: result.world.equipment.map((equipment) => equipment.id === "equip.tl-relay-carbine" ? { ...equipment, passiveBonus: undefined } : equipment)
    };
    expect(getEffectiveCharacterStats(withRifle, result.world).accuracy).toBe(getEffectiveCharacterStats(withRifle, worldWithoutPassive).accuracy + 4);

    // Use the final guardian so a successful shot cannot immediately award a level-up and refill MP;
    // this assertion is about the cost actually being paid, not post-victory growth.
    const enemy = result.world.enemies.at(-1)!;
    const fight = {
      ...createInitialGameState(),
      phase: "combat" as const,
      party: [withRifle],
      combat: createCombatState("room.tl1f.entry", enemy, 1)
    };
    const groupId = fight.combat.enemyGroups[0].id;
    const afterRifleShot = executeCommand(fight, result.world, {
      type: "declare_round",
      actions: [{ actorId: withRifle.id, action: "cast", spellId: "rifle-brace", targetGroupId: groupId }]
    });
    expect(afterRifleShot.party[0].mp).toBe(withRifle.mp - 3);

    const invalidFight = { ...fight, party: [withoutRifle] };
    const afterUnequippedShot = executeCommand(invalidFight, result.world, {
      type: "declare_round",
      actions: [{ actorId: withoutRifle.id, action: "cast", spellId: "rifle-brace", targetGroupId: groupId }]
    });
    expect(afterUnequippedShot.party[0].mp).toBe(withoutRifle.mp);
  });
});
