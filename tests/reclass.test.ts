import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter, reclassCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";

describe("reclass (転職)", () => {
  it("recomputes class, stats, and MP while keeping identity", () => {
    const mender = createGuildCharacter({ name: "Cael", classId: "mender", seed: "r" });
    expect(mender.maxMp).toBeGreaterThan(0);

    const asVanguard = reclassCharacter(mender, "vanguard", defaultWorld);
    expect(asVanguard.classId).toBe("vanguard");
    expect(asVanguard.id).toBe(mender.id);
    expect(asVanguard.name).toBe("Cael");
    expect(asVanguard.maxMp).toBeGreaterThan(0); // vanguard now carries a 特技 気力 pool

    const asScout = reclassCharacter(mender, "scout", defaultWorld);
    expect(asScout.maxMp).toBe(0); // a class with no abilities keeps no pool
  });

  it("grants a pool when retraining a plain martial into a caster", () => {
    const scout = createGuildCharacter({ name: "Rook", classId: "scout", seed: "r" });
    expect(scout.maxMp).toBe(0);

    const asMender = reclassCharacter(scout, "mender", defaultWorld);
    expect(asMender.maxMp).toBeGreaterThan(0);
  });

  it("re-levels from carried XP under the new class", () => {
    const base = { ...createGuildCharacter({ name: "X", classId: "vanguard", seed: "r" }), xp: 24 };
    const reclassed = reclassCharacter(base, "seeker", defaultWorld);
    expect(reclassed.level).toBe(3); // 24 XP reaches level 3 regardless of class
    expect(reclassed.xp).toBe(24);
  });

  it("retrains a party member through the reclass_member command", () => {
    const state = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Y", classId: "vanguard", seed: "r" }));
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "reclass_member", characterId: member.id, classId: "mender" });

    expect(after.party[0].classId).toBe("mender");
    expect(after.log.some((entry) => entry.text.includes("retrains"))).toBe(true);
  });
});
