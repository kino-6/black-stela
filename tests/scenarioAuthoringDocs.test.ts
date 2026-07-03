import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import authoringGuide from "../docs/scenario/authoring.md?raw";
import playtestNotes from "../docs/playtest/first-scenario-notes.md?raw";

describe("scenario authoring documentation", () => {
  it("covers every authored floor in manual playtest notes", () => {
    for (const floor of defaultWorld.dungeons) {
      expect(playtestNotes).toContain(floor.name);
    }
  });

  it("documents import and validation expectations for authors", () => {
    expect(authoringGuide).toContain("Import scenario pack");
    expect(authoringGuide).toContain("grid.cells");
    expect(authoringGuide).toContain("edge metadata");
    expect(authoringGuide).toContain("Non-adjacent movement is invalid");
    expect(authoringGuide).toContain("Every reachable room must be able to route back");
    expect(authoringGuide).toContain("next-floor links");
  });
});
