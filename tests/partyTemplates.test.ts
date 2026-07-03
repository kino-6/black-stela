import { describe, expect, it } from "vitest";
import { analyzePartyCoverage, createStarterParty, starterTemplates, type StarterTemplateId } from "../src/domain/characterCreation";

describe("partyTemplates", () => {
  it.each(Object.keys(starterTemplates) as StarterTemplateId[])("%s creates a legal four-member party", (templateId) => {
    const party = createStarterParty(templateId, 2);

    expect(party).toHaveLength(4);
    expect(new Set(party.map((member) => member.id)).size).toBe(4);
    expect(party.every((member) => member.creation.method === "template")).toBe(true);
    expect(party.every((member) => member.hp === member.maxHp)).toBe(true);
    expect(party.filter((member) => member.row === "front").length).toBeGreaterThanOrEqual(1);
  });

  it("beginner-safe template covers the essential DRPG roles", () => {
    const coverage = analyzePartyCoverage(createStarterParty("beginner"));

    expect(coverage.filter((item) => item.status === "missing")).toEqual([]);
    expect(coverage.find((item) => item.id === "front_line")?.status).not.toBe("missing");
    expect(coverage.find((item) => item.id === "healing")?.status).toBe("covered");
  });
});
