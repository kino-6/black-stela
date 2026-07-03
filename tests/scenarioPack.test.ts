import { describe, expect, it } from "vitest";
import defaultManifest from "../content/worlds/default/manifest.md?raw";
import { parseScenarioPackManifest } from "../src/domain/scenarioPack";

describe("scenario pack manifest", () => {
  it("parses the default scenario manifest", () => {
    expect(parseScenarioPackManifest(defaultManifest)).toMatchObject({
      id: "pack.default",
      supportedLanguages: ["en", "ja"],
      entryWorld: "world.md",
      dungeons: expect.arrayContaining(["dungeons/b1f.md", "dungeons/b8f.md"]),
      dataFiles: {
        items: "items.md",
        enemies: "enemies.md",
        encounters: "encounters.md",
        treasure: "treasure.md",
        progression: "progression.md"
      }
    });
  });

  it("rejects invalid manifests clearly", () => {
    expect(() => parseScenarioPackManifest("# Missing front matter")).toThrow(/front matter/i);
  });
});
