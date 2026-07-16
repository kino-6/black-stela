import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { bestiaryEntries, recordDefeats, recordEncounters } from "../src/domain/bestiary";

const GLIMMER = "enemy.rare.ashsilver-glimmer"; // weaknesses include star

// IMP-022D — the enemy record. Encountering an enemy lists it; defeating it reveals its weaknesses
// and drop sources. Coarse only — no exact HP is ever stored or shown.
describe("bestiary / enemy record", () => {
  it("lists an encountered enemy but hides its weaknesses until it is defeated", () => {
    const seen = recordEncounters(undefined, [GLIMMER]);
    const beforeKill = bestiaryEntries(defaultWorld, seen, "en").find((e) => e.enemyId === GLIMMER)!;
    expect(beforeKill.encountered).toBe(1);
    expect(beforeKill.known).toBe(false);
    expect(beforeKill.weaknesses).toEqual([]); // not revealed yet

    const killed = recordDefeats(seen, [GLIMMER]);
    const afterKill = bestiaryEntries(defaultWorld, killed, "en").find((e) => e.enemyId === GLIMMER)!;
    expect(afterKill.defeated).toBe(1);
    expect(afterKill.known).toBe(true);
    expect(afterKill.weaknesses.map((w) => w.element)).toContain("star"); // revealed on defeat
  });

  it("accumulates counts across fights and never carries exact HP", () => {
    let record = recordEncounters(undefined, [GLIMMER, GLIMMER]);
    record = recordDefeats(record, [GLIMMER]);
    expect(record[GLIMMER]).toEqual({ encountered: 2, defeated: 1 });
    const entry = bestiaryEntries(defaultWorld, record, "en")[0];
    // The view is coarse: a threat rating and counts, but no hp/coefficient field.
    expect(Object.keys(entry)).not.toContain("hp");
    expect(entry.threat).toBeGreaterThan(0);
  });

  it("shows nothing before any enemy is met", () => {
    expect(bestiaryEntries(defaultWorld, undefined, "en")).toEqual([]);
  });
});
