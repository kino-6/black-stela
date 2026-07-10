import { describe, expect, it } from "vitest";
import { collectCombatBeats } from "../src/domain/combatLog";
import type { AdventureLogEntry, GameEvent } from "../src/domain/types";

// #69: the combat log reveals the fight blow-by-blow. collectCombatBeats is the
// data behind that — the ordered beats of the CURRENT fight, with numbers intact.
let seq = 0;
function entry(event: GameEvent): AdventureLogEntry {
  seq += 1;
  return { id: `e${seq}`, turn: seq, text: "", tags: [], event };
}

const encounter = (): GameEvent => ({ type: "enemy_encountered", enemyId: "e", enemyName: "Slime", roomId: "room.b1f.001" });
const round = (n: number, summaries: string[]): GameEvent => ({ type: "combat_round_resolved", round: n, summaries });

describe("collectCombatBeats", () => {
  it("flattens the current fight's round summaries in order", () => {
    const beats = collectCombatBeats([
      entry(encounter()),
      entry(round(1, ["Rook hits the slime for 7. 1 remain.", "Mira scorches the slime for 5. 1 remain."])),
      entry(round(2, ["Rook hits the slime for 6. 0 remain."]))
    ]);
    expect(beats).toEqual([
      "Rook hits the slime for 7. 1 remain.",
      "Mira scorches the slime for 5. 1 remain.",
      "Rook hits the slime for 6. 0 remain."
    ]);
    // Numbers survive so the player gets 数字感.
    expect(beats.every((line) => /\d/.test(line))).toBe(true);
  });

  it("keeps only the most recent encounter's beats", () => {
    const beats = collectCombatBeats([
      entry(encounter()),
      entry(round(1, ["old fight beat"])),
      entry(encounter()),
      entry(round(1, ["new fight beat"]))
    ]);
    expect(beats).toEqual(["new fight beat"]);
  });

  it("returns nothing before any blow has landed", () => {
    expect(collectCombatBeats([entry(encounter())])).toEqual([]);
    expect(collectCombatBeats([])).toEqual([]);
  });
});
