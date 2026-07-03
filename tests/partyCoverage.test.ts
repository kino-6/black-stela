import { describe, expect, it } from "vitest";
import { analyzePartyCoverage, createGuildCharacter, createStarterParty } from "../src/domain/characterCreation";

describe("partyCoverage", () => {
  it("reports missing roles without blocking expressive parties", () => {
    const party = [
      createGuildCharacter({ name: "Rook", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"] })
    ];

    const coverage = analyzePartyCoverage(party);

    expect(coverage.find((item) => item.id === "front_line")?.status).toBe("thin");
    expect(coverage.find((item) => item.id === "healing")?.status).toBe("missing");
    expect(coverage.find((item) => item.id === "trap_handling")?.status).toBe("missing");
  });

  it("recognizes a rounded party", () => {
    const coverage = analyzePartyCoverage(createStarterParty("balanced"));

    expect(coverage.find((item) => item.id === "front_line")?.status).toBe("covered");
    expect(coverage.find((item) => item.id === "healing")?.status).toBe("covered");
    expect(coverage.find((item) => item.id === "trap_handling")?.status).toBe("covered");
    expect(coverage.find((item) => item.id === "damage")?.status).toBe("covered");
  });
});
