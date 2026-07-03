import { describe, expect, it } from "vitest";
import defaultManifest from "../content/worlds/default/manifest.md?raw";
import { parseScenarioPackManifest } from "../src/domain/scenarioPack";

describe("scenario pack manifest", () => {
  it("parses the default scenario manifest", () => {
    expect(parseScenarioPackManifest(defaultManifest)).toMatchObject({
      id: "pack.default",
      supportedLanguages: ["en", "ja"],
      entryWorld: "world.md",
      dungeons: ["dungeons/b1f.md"]
    });
  });

  it("rejects invalid manifests clearly", () => {
    expect(() => parseScenarioPackManifest("# Missing front matter")).toThrow(/front matter/i);
  });
});
