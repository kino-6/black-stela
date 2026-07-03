import { describe, expect, it } from "vitest";
import { parseDungeonFloor, parseScenarioWorld } from "../src/domain/scenario";
import { defaultWorld } from "../src/data/defaultWorld";

describe("scenario validation", () => {
  it("loads the editable default world from Markdown and YAML front matter", () => {
    expect(defaultWorld.id).toBe("world.default");
    expect(defaultWorld.dungeons[0].rooms).toHaveLength(3);
    expect(defaultWorld.aiPolicy.forbidden).toContain("speak_for_pc");
  });

  it("rejects a dungeon room without a deterministic id", () => {
    const invalid = `---
id: dungeon.invalid
name: Broken
startRoom: room.missing
rooms:
  - name: No Id
    description: Bad data
    exits: {}
---

# Broken`;

    expect(() => parseDungeonFloor(invalid)).toThrow();
  });

  it("combines world metadata with dungeon files", () => {
    const world = `---
id: world.test
title: Test
startDungeon: dungeon.test
startRoom: room.test.001
aiPolicy:
  allowed: [environment_flavor]
  forbidden: [move_pc]
---

# Test`;
    const dungeon = `---
id: dungeon.test
name: Test Floor
startRoom: room.test.001
rooms:
  - id: room.test.001
    name: Start
    description: Start room
    exits: {}
---

# Test Floor`;

    expect(parseScenarioWorld(world, [dungeon]).dungeons[0].id).toBe("dungeon.test");
  });
});
