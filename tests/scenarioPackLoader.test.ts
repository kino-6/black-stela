import { describe, expect, it } from "vitest";
import defaultManifest from "../content/worlds/default/manifest.md?raw";
import defaultWorld from "../content/worlds/default/world.md?raw";
import defaultB1f from "../content/worlds/default/dungeons/b1f.md?raw";
import defaultB2f from "../content/worlds/default/dungeons/b2f.md?raw";
import defaultB3f from "../content/worlds/default/dungeons/b3f.md?raw";
import defaultB4f from "../content/worlds/default/dungeons/b4f.md?raw";
import defaultB5f from "../content/worlds/default/dungeons/b5f.md?raw";
import defaultB6f from "../content/worlds/default/dungeons/b6f.md?raw";
import defaultB7f from "../content/worlds/default/dungeons/b7f.md?raw";
import defaultB8f from "../content/worlds/default/dungeons/b8f.md?raw";
import defaultItems from "../content/worlds/default/items.md?raw";
import defaultEnemies from "../content/worlds/default/enemies.md?raw";
import defaultEncounters from "../content/worlds/default/encounters.md?raw";
import defaultTreasure from "../content/worlds/default/treasure.md?raw";
import defaultProgression from "../content/worlds/default/progression.md?raw";
import defaultQuests from "../content/worlds/default/quests.md?raw";
import defaultVocations from "../content/worlds/default/vocations.md?raw";
import missingDungeonManifest from "./fixtures/scenarios/missing-dungeon/manifest.md?raw";
import missingDungeonWorld from "./fixtures/scenarios/missing-dungeon/world.md?raw";
import invalidExitManifest from "./fixtures/scenarios/invalid-exit/manifest.md?raw";
import invalidExitWorld from "./fixtures/scenarios/invalid-exit/world.md?raw";
import invalidExitB1f from "./fixtures/scenarios/invalid-exit/dungeons/b1f.md?raw";
import invalidAiManifest from "./fixtures/scenarios/invalid-ai-policy/manifest.md?raw";
import invalidAiWorld from "./fixtures/scenarios/invalid-ai-policy/world.md?raw";
import invalidAiB1f from "./fixtures/scenarios/invalid-ai-policy/dungeons/b1f.md?raw";
import { loadScenarioPack } from "../src/services/scenarioPackLoader";

describe("scenario pack loader", () => {
  it("loads the default scenario pack", () => {
    const result = loadScenarioPack({
      "manifest.md": defaultManifest,
      "world.md": defaultWorld,
      "dungeons/b1f.md": defaultB1f,
      "dungeons/b2f.md": defaultB2f,
      "dungeons/b3f.md": defaultB3f,
      "dungeons/b4f.md": defaultB4f,
      "dungeons/b5f.md": defaultB5f,
      "dungeons/b6f.md": defaultB6f,
      "dungeons/b7f.md": defaultB7f,
      "dungeons/b8f.md": defaultB8f,
      "items.md": defaultItems,
      "enemies.md": defaultEnemies,
      "encounters.md": defaultEncounters,
      "treasure.md": defaultTreasure,
      "progression.md": defaultProgression,
      "quests.md": defaultQuests,
      "vocations.md": defaultVocations
    });

    expect(result).toMatchObject({
      ok: true,
      manifest: { id: "pack.default" },
      world: { id: "world.default", dungeons: expect.arrayContaining([expect.objectContaining({ id: "dungeon.b8f" })]) }
    });
  });

  it("reports missing required files", () => {
    const result = loadScenarioPack({
      "manifest.md": missingDungeonManifest,
      "world.md": missingDungeonWorld
    });

    expect(result).toMatchObject({
      ok: false,
      errors: [{ filePath: "dungeons/missing.md", fieldPath: "dungeons" }]
    });
  });

  it("reports YAML parse errors with file context", () => {
    const result = loadScenarioPack({
      ...defaultPackFiles(),
      "world.md": "---\nid: [broken\n---",
    });

    expect(result).toMatchObject({
      ok: false,
      errors: [{ filePath: "world.md", fieldPath: "yaml" }]
    });
  });

  it("reports invalid exit references", () => {
    const result = loadScenarioPack({
      "manifest.md": invalidExitManifest,
      "world.md": invalidExitWorld,
      "dungeons/b1f.md": invalidExitB1f
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ fieldPath: "room.invalid.001.exits.east" })])
    });
  });

  it("reports invalid AI policy fixtures", () => {
    const result = loadScenarioPack({
      "manifest.md": invalidAiManifest,
      "world.md": invalidAiWorld,
      "dungeons/b1f.md": invalidAiB1f
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ fieldPath: "aiPolicy" })])
    });
  });

  it("reports broken catalog references with file and field context", () => {
    const manifest = `---
id: pack.broken-catalog
title: Broken Catalog
version: 0.1.0
supportedLanguages: [en]
entryWorld: world.md
dungeons:
  - dungeons/b1f.md
dataFiles:
  items: items.md
  enemies: enemies.md
  encounters: encounters.md
  treasure: treasure.md
compatibility:
  minAppVersion: 0.1.0
---

# Broken`;
    const world = `---
id: world.broken
title: Broken
startDungeon: dungeon.b1f
startRoom: room.broken.001
aiPolicy:
  allowed: [environment_flavor]
  forbidden: [move_pc]
---

# Broken`;
    const dungeon = `---
id: dungeon.b1f
name: Broken Floor
startRoom: room.broken.001
rooms:
  - id: room.broken.001
    name: Broken
    description: Broken refs
    exits: {}
    encounterTable: encounters.missing
    treasureTable: treasure.missing
---

# Broken`;
    const result = loadScenarioPack({
      "manifest.md": manifest,
      "world.md": world,
      "dungeons/b1f.md": dungeon,
      "items.md": "---\nitems: []\nequipment: []\nshops: []\n---",
      "enemies.md": "---\nenemies: []\n---",
      "encounters.md": "---\nencounterTables: []\n---",
      "treasure.md": "---\ntreasureTables: []\n---"
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ fieldPath: "room.broken.001.encounterTable" }),
        expect.objectContaining({ fieldPath: "room.broken.001.treasureTable" })
      ])
    });
  });

  it("reports unreachable rooms before authors playtest", () => {
    const result = loadScenarioPack({
      "manifest.md": `---
id: pack.unreachable
title: Unreachable
version: 0.1.0
supportedLanguages: [en]
entryWorld: world.md
dungeons:
  - dungeons/b1f.md
compatibility:
  minAppVersion: 0.1.0
---`,
      "world.md": `---
id: world.unreachable
title: Unreachable
startDungeon: dungeon.b1f
startRoom: room.reachable
aiPolicy:
  allowed: [environment_flavor]
  forbidden: [move_pc]
---`,
      "dungeons/b1f.md": `---
id: dungeon.b1f
name: Unreachable Floor
startRoom: room.reachable
rooms:
  - id: room.reachable
    name: Reachable
    description: Start
    exits: {}
  - id: room.lost
    name: Lost
    description: No route reaches this room.
    exits: {}
---`
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ fieldPath: "room.lost.reachability" })])
    });
  });

  it("reports reachable rooms that cannot route back to a town return", () => {
    const result = loadScenarioPack({
      "manifest.md": `---
id: pack.no-return
title: No Return
version: 0.1.0
supportedLanguages: [en]
entryWorld: world.md
dungeons:
  - dungeons/b1f.md
compatibility:
  minAppVersion: 0.1.0
---`,
      "world.md": `---
id: world.no-return
title: No Return
startDungeon: dungeon.b1f
startRoom: room.start
aiPolicy:
  allowed: [environment_flavor]
  forbidden: [move_pc]
---`,
      "dungeons/b1f.md": `---
id: dungeon.b1f
name: No Return Floor
startRoom: room.start
rooms:
  - id: room.start
    name: Start
    description: A one-way descent starts here.
    exits:
      east: room.trapped
  - id: room.trapped
    name: Trapped
    description: No authored return route leaves this room.
    exits: {}
---`
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ fieldPath: "room.start.returnability" })])
    });
  });

  it("reports missing authored floor-to-floor progression", () => {
    const result = loadScenarioPack({
      "manifest.md": `---
id: pack.no-next-floor
title: No Next Floor
version: 0.1.0
supportedLanguages: [en]
entryWorld: world.md
dungeons:
  - dungeons/b1f.md
  - dungeons/b2f.md
compatibility:
  minAppVersion: 0.1.0
---`,
      "world.md": `---
id: world.no-next-floor
title: No Next Floor
startDungeon: dungeon.b1f
startRoom: room.b1f.start
aiPolicy:
  allowed: [environment_flavor]
  forbidden: [move_pc]
---`,
      "dungeons/b1f.md": `---
id: dungeon.b1f
name: First
startRoom: room.b1f.start
rooms:
  - id: room.b1f.start
    name: First Start
    description: A return stair is present, but no descent exists.
    exits: {}
    stairsToTown: true
---`,
      "dungeons/b2f.md": `---
id: dungeon.b2f
name: Second
startRoom: room.b2f.start
rooms:
  - id: room.b2f.start
    name: Second Start
    description: This floor has no authored entrance.
    exits: {}
    stairsToTown: true
---`
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ fieldPath: "dungeon.b1f.floorProgression" })])
    });
  });

  it("rejects non-adjacent grid movement unless it is declared special", () => {
    const result = loadScenarioPack({
      "manifest.md": `---
id: pack.bad-grid
title: Bad Grid
version: 0.1.0
supportedLanguages: [en]
entryWorld: world.md
dungeons:
  - dungeons/b1f.md
compatibility:
  minAppVersion: 0.1.0
---`,
      "world.md": `---
id: world.bad-grid
title: Bad Grid
startDungeon: dungeon.b1f
startRoom: room.start
aiPolicy:
  allowed: [environment_flavor]
  forbidden: [move_pc]
---`,
      "dungeons/b1f.md": `---
id: dungeon.b1f
name: Bad Grid
startRoom: room.start
grid:
  cells:
    - id: cell.start
      roomId: room.start
      x: 0
      y: 0
      edges:
        east:
          kind: open
          targetRoomId: room.jump
          targetCellId: cell.jump
    - id: cell.jump
      roomId: room.jump
      x: 3
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.start
          targetCellId: cell.start
rooms:
  - id: room.start
    name: Start
    description: The bad edge skips cells.
    exits:
      east: room.jump
  - id: room.jump
    name: Jump
    description: The return marker masks a broken topology.
    exits:
      west: room.start
    stairsToTown: true
---`
    });

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({
          fieldPath: "room.start.grid.east"
        })
      ])
    });
  });
});

function defaultPackFiles() {
  return {
    "manifest.md": defaultManifest,
    "world.md": defaultWorld,
    "dungeons/b1f.md": defaultB1f,
    "dungeons/b2f.md": defaultB2f,
    "dungeons/b3f.md": defaultB3f,
    "dungeons/b4f.md": defaultB4f,
    "dungeons/b5f.md": defaultB5f,
    "dungeons/b6f.md": defaultB6f,
    "dungeons/b7f.md": defaultB7f,
    "dungeons/b8f.md": defaultB8f,
    "items.md": defaultItems,
    "enemies.md": defaultEnemies,
    "encounters.md": defaultEncounters,
    "treasure.md": defaultTreasure,
    "progression.md": defaultProgression,
    "quests.md": defaultQuests,
      "vocations.md": defaultVocations
  };
}
