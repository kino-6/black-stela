import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadScenarioPack } from "../src/services/scenarioPackLoader";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { getEffectiveCharacterStats, weaponShots } from "../src/domain/economy";
import { resolveTechniqueCatalog } from "../src/domain/techniques";
import { CLASS_CAPABILITIES, resolveClassCapabilities } from "../src/domain/classCapabilities";
import { combatLoadout, resolveVocationCatalog } from "../src/domain/vocations";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { dungeonGroupOfFloor, resolveEntrances } from "../src/domain/scenario";
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

const firearmEffectBasenames = [
  "fx-tl-pistol-muzzle", "fx-tl-pistol-travel", "fx-tl-pistol-impact",
  "fx-tl-rifle-muzzle", "fx-tl-rifle-travel", "fx-tl-rifle-impact",
  "fx-tl-smg-muzzle", "fx-tl-smg-travel", "fx-tl-smg-impact",
  "fx-tl-shotgun-muzzle", "fx-tl-shotgun-travel", "fx-tl-shotgun-impact"
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
      // The ten-floor main descent, then the optional three-floor "depot" side dungeon (T30/U5),
      // ordered group-then-level (main's empty group sorts before "depot").
      "dungeon.tl1f", "dungeon.tl2f", "dungeon.tl3f", "dungeon.tl4f", "dungeon.tl5f",
      "dungeon.tl6f", "dungeon.tl7f", "dungeon.tl8f", "dungeon.tl9f", "dungeon.tl10f",
      "dungeon.tl-depot1", "dungeon.tl-depot2", "dungeon.tl-depot3"
    ]);
    // Two town portals: the main descent + the depot side dungeon.
    expect(resolveEntrances(result.world).map((entrance) => entrance.id)).toEqual(["main", "depot"]);
    expect(dungeonGroupOfFloor(result.world, "dungeon.tl-depot2")).toBe("depot");
    expect(result.world.enemies.map((enemy) => enemy.id)).toEqual(enemyIds);
    expect(result.world.dungeons[0].grid?.cells.length).toBeGreaterThanOrEqual(80);
    // The ≥80-cell maze rule is a MAIN-DESCENT quality gate; the optional depot side dungeon is a compact
    // farm loop by design, so it is exempt (only the ungrouped main floors must be full mazes).
    for (const floor of result.world.dungeons.filter((floor) => !floor.dungeon)) {
      expect(floor.grid?.cells.length, floor.id).toBeGreaterThanOrEqual(80);
    }
    expect(result.world.dungeons[0].rooms.some((room) => room.id === "room.tl1f.signal-office" && room.event)).toBe(true);
    expect(result.world.dungeons[1].rooms.some((room) => room.id === "room.tl2f.power-terminal" && (room.gates?.length ?? 0) > 0)).toBe(true);
    // The main descent's finale is F10 (now no longer the array tail — the depot floors follow it).
    const finale = result.world.dungeons.find((floor) => floor.id === "dungeon.tl10f");
    expect(finale?.rooms.some((room) => room.id === "room.tl10f.zero-core" && room.chamberGuardian)).toBe(true);
  });

  it("delivers every F1-F10 enemy as a 768-square RGBA base/hurt pair", () => {
    for (const basename of enemyBasenames) {
      for (const suffix of ["", "-hurt"]) {
        const info = pngInfo(resolve(dungeon, `${basename}${suffix}.png`));
        expect(info).toEqual({ width: 768, height: 768, colorType: 6 });
      }
    }
  });

  it("ships three restrained RGBA firearm effect frames for each gun family", () => {
    expect(firearmEffectBasenames).toHaveLength(12);
    for (const basename of firearmEffectBasenames) {
      expect(pngInfo(resolve(root, "assets/effects", `${basename}.png`))).toEqual({ width: 512, height: 512, colorType: 6 });
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

  // Terminal Line's whole concept is MOWING DOWN hordes with automatic fire. The horde spawns and the
  // spray mechanic (weaponShots > 1) both exist — but the concept only reaches the player if the DEFAULT
  // party actually fields automatic weapons. Every basic vocation must start on a gun that sprays (SMG 3 /
  // shotgun 2), or a normal party walks into the swarms holding single-shot sidearms and clubs and the
  // mow-down never happens (playtest 2026-08-13: "コンセプト未達").
  it("starts every basic vocation on an automatic firearm so the default party mows the hordes", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const basicClassIds = ["warrior", "knight", "swordmaster", "thief", "priest", "chanter", "mage", "occultist"] as const;
    for (const classId of basicClassIds) {
      const member = createGuildCharacter({ name: "配備", classId, backgroundId: "watch", traitIds: ["steady"] }, result.world);
      expect(weaponShots(member, result.world), `${classId} starting weapon must spray`).toBeGreaterThan(1);
    }
  });

  // #33 base building: the salvage-`materials` sink is scenario-authored world data. This locks the v1
  // facility set (医務室/補給所/通信室), their level costs, and the effect fields the Godot base resolver reads.
  it("authors the three base facilities (materials sink) as world data", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const facilities = result.world.facilities ?? [];
    expect(facilities.map((f) => f.id)).toEqual([
      "facility.tl-infirmary", "facility.tl-supply", "facility.tl-signals"
    ]);
    for (const f of facilities) {
      expect(f.levels.map((l) => l.cost), f.id).toEqual([8, 16, 32]);
    }
    const infirmary = facilities.find((f) => f.id === "facility.tl-infirmary")!;
    expect(infirmary.levels[0].restOnReturn).toBe(true);
    expect(infirmary.levels[1].restMp).toBe(true);
    expect(infirmary.levels[2].clearInjury).toBe(true);
    const supply = facilities.find((f) => f.id === "facility.tl-supply")!;
    expect(supply.levels.map((l) => l.shopDiscountPct)).toEqual([5, 10, 15]);
    const signals = facilities.find((f) => f.id === "facility.tl-signals")!;
    expect(signals.levels.map((l) => l.explorationBonus)).toEqual([3, 5, 8]);
  });

  // #31 boss reachability: a run must have GUARANTEED bosses at its bookends — a 玄室 guardian on the
  // first floor and the terminus core on the last — never left to a random-table roll the player may miss.
  // The entrance also signposts the floor-1 miniboss so an early party is drawn to it, not past it.
  it("guarantees bookend chamber bosses and signposts the first-floor miniboss", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rooms = result.world.dungeons.flatMap((d) => d.rooms);
    const first = rooms.find((r) => r.id === "room.tl1f.stationmaster-hall");
    expect(first?.chamberGuardian, "tl1f miniboss is a guaranteed chamber guardian").toBe(true);
    expect(first?.encounter ?? first?.encounterTable, "tl1f miniboss room places a boss").toBeTruthy();
    const last = rooms.find((r) => r.id === "room.tl10f.zero-core");
    expect(last?.chamberGuardian, "tl10f terminus core is a guaranteed chamber guardian").toBe(true);
    expect(last?.encounter ?? last?.encounterTable, "tl10f terminus core places a boss").toBeTruthy();

    const entrance = rooms.find((r) => r.id === "room.tl1f.entrance");
    expect(entrance?.event, "the entrance signposts the floor-1 miniboss").toBeTruthy();
  });

  it("binds ten real active techniques to each firearm family and six automatic firearm passives", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const firearms = new Map(result.world.equipment.map((equipment) => [equipment.id, equipment]));
    const catalog = resolveTechniqueCatalog(result.world);
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
        expect(catalog[techniqueId].tags).toContain(family);
      }
    }
    for (const equipment of [...firearms.values()].filter((candidate) => candidate.tags?.includes("firearm"))) {
      expect(equipment.grantsTechniques, equipment.id).toHaveLength(2);
      expect(equipment.grantsTechniques?.every((id) => equipment.tags?.some((tag) => catalog[id].tags?.includes(tag))), equipment.id).toBe(true);
    }
    const passives = new Set([...firearms.values()].flatMap((equipment) => equipment.grantsPassives ?? []));
    expect(passives).toEqual(new Set([
      "quick-draw", "sidearm-discipline", "steady-sight", "close-control", "breach-brace", "last-platform-stance"
    ]));

    for (const equipment of firearms.values()) {
      const passiveIds = equipment.grantsPassives ?? [];
      if (passiveIds.length === 0) continue;
      expect(passiveIds).toHaveLength(1);
      expect(catalog[passiveIds[0]].passiveBonus).toEqual(equipment.passiveBonus);
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
      actions: [{ actorId: withRifle.id, action: "cast", spellId: "rifle-hamper", targetGroupId: groupId }]
    });
    expect(afterRifleShot.party[0].mp).toBe(withRifle.mp - 3);
    const rifleBeat = afterRifleShot.log.flatMap((entry) => entry.event?.type === "combat_round_resolved" ? entry.event.beats ?? [] : [])
      .find((beat) => beat.spellId === "rifle-hamper" && beat.damage && beat.damage > 0);
    expect(rifleBeat).toMatchObject({ firearm: true, firearmFamily: "rifle", shotIndex: 0 });

    const invalidFight = { ...fight, party: [withoutRifle] };
    const afterUnequippedShot = executeCommand(invalidFight, result.world, {
      type: "declare_round",
      actions: [{ actorId: withoutRifle.id, action: "cast", spellId: "rifle-hamper", targetGroupId: groupId }]
    });
    expect(afterUnequippedShot.party[0].mp).toBe(withoutRifle.mp);
  });

  it("re-skins the eight basic class NAMES without disturbing the base ids", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const byId = new Map(resolveVocationCatalog(result.world).map((vocation) => [vocation.id, vocation]));
    const expected: Record<string, string> = {
      warrior: "Security Officer", knight: "Containment Guard", swordmaster: "Special Agent",
      thief: "Infiltrator", priest: "Field Medic", chanter: "Signals Operator",
      mage: "Demolition Tech", occultist: "Disruptor"
    };
    for (const [id, name] of Object.entries(expected)) {
      const vocation = byId.get(id);
      expect(vocation, id).toBeDefined();
      expect(vocation?.tier, id).toBe("basic");
      expect(vocation?.name, id).toBe(name);
    }
  });

  it("re-skins every class technique line: themed ids, all resolvable, no firearm, kind-preserving", () => {
    const result = loadScenarioPack(packFiles());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const catalog = resolveTechniqueCatalog(result.world);
    const resolved = resolveClassCapabilities(result.world);

    for (const classId of Object.keys(CLASS_CAPABILITIES) as (keyof typeof CLASS_CAPABILITIES)[]) {
      const base = CLASS_CAPABILITIES[classId].combatTechniques;
      const line = resolved[classId].combatTechniques;

      // Every class is re-skinned (not the base line) and keeps the base level bands 1:1.
      expect(line.length, classId).toBe(base.length);
      expect(line.map((grant) => grant.level), classId).toEqual(base.map((grant) => grant.level));
      expect(line.every((grant) => grant.techniqueId.startsWith("tl-")), classId).toBe(true);

      for (let i = 0; i < line.length; i += 1) {
        const themed = catalog[line[i].techniqueId];
        const original = catalog[base[i].techniqueId];
        expect(themed, `${classId}:${line[i].techniqueId}`).toBeDefined();
        // A class never natively learns a firearm — that invariant is gear-only.
        expect(themed.tags ?? [], line[i].techniqueId).not.toContain("firearm");
        // kind parity: MP / 気力 pool is seeded from the BASE class, so a re-skin must keep the kind.
        expect(themed.kind, `${classId}:${line[i].techniqueId}`).toBe(original.kind);
      }
    }

    // The runtime path (combatLoadout → knownSpells → resolveClassCapabilities) seeds the themed line:
    // a Terminal Line warrior opens with the security officer's own techniques, not the base fantasy ones.
    const hero = createGuildCharacter({ name: "試", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"] });
    expect(hero.classId).toBe("warrior");
    expect(combatLoadout(hero, result.world)).toEqual(["tl-riot-strike", "tl-armor-breach"]);
  });
});
