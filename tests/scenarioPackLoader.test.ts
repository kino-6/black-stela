import { describe, expect, it } from "vitest";
import defaultManifest from "../content/worlds/default/manifest.md?raw";
import defaultWorld from "../content/worlds/default/world.md?raw";
import defaultB1f from "../content/worlds/default/dungeons/b1f.md?raw";
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
      "dungeons/b1f.md": defaultB1f
    });

    expect(result).toMatchObject({
      ok: true,
      manifest: { id: "pack.default" },
      world: { id: "world.default" }
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
      "manifest.md": defaultManifest,
      "world.md": "---\nid: [broken\n---",
      "dungeons/b1f.md": defaultB1f
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
      errors: [{ fieldPath: "room.invalid.001.exits.east" }]
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
      errors: [{ fieldPath: "aiPolicy" }]
    });
  });
});
