import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter, reclassCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";

describe("reclass (転職)", () => {
  it("recomputes class, stats, and MP while keeping identity", () => {
    const mender = createGuildCharacter({ name: "Cael", classId: "priest", seed: "r" });
    expect(mender.maxMp).toBeGreaterThan(0);

    const asVanguard = reclassCharacter(mender, "warrior", defaultWorld);
    expect(asVanguard.classId).toBe("warrior");
    expect(asVanguard.id).toBe(mender.id);
    expect(asVanguard.name).toBe("Cael");
    expect(asVanguard.maxMp).toBeGreaterThan(0); // vanguard now carries a 特技 気力 pool

    // §9.4b: 盾騎士 carries a 特技 line now, so it too has a 気力 pool — but a MARTIAL one, which is
    // smaller than the caster pool it just gave up. Retraining out of a caster is a real cost.
    const asKnight = reclassCharacter(mender, "knight", defaultWorld);
    expect(asKnight.maxMp).toBeGreaterThan(0);
    expect(asKnight.maxMp).toBeLessThan(mender.maxMp);
  });

  it("widens the pool when retraining a martial into a caster", () => {
    // Before §9.4b the Knight had NO pool at all and this test read `toBe(0)`. Every selectable class
    // now carries a line, so the zero branch of baseMaxMpForClass is no longer reachable from the
    // roster — it survives only for a class that declares no techniques.
    const knight = createGuildCharacter({ name: "Rook", classId: "knight", seed: "r" });
    expect(knight.maxMp).toBeGreaterThan(0);

    const asMender = reclassCharacter(knight, "priest", defaultWorld);
    expect(asMender.maxMp).toBeGreaterThan(knight.maxMp);
  });

  it("re-levels from carried XP under the new class", () => {
    const base = { ...createGuildCharacter({ name: "X", classId: "warrior", seed: "r" }), xp: 24 };
    const reclassed = reclassCharacter(base, "thief", defaultWorld);
    expect(reclassed.level).toBe(3); // 24 XP reaches level 3 regardless of class
    expect(reclassed.xp).toBe(24);
  });

  it("retrains a party member through the reclass_member command", () => {
    const state = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Y", classId: "warrior", seed: "r" }));
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "reclass_member", characterId: member.id, classId: "priest" });

    expect(after.party[0].classId).toBe("priest");
    expect(after.log.some((entry) => entry.text.includes("retrains"))).toBe(true);
  });
});
