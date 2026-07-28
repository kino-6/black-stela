import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import type { GameState } from "../src/domain/types";

// Playtest: 退却 left the party standing on the fight cell, so retreating then advancing "broke through" a
// guardian for free. Retreat must drop them BACK to the cell they stepped in from.
const verdant = worldRegistry.verdant;
function party(n: number): GameState {
  let s = createInitialGameState();
  for (let i = 0; i < n; i += 1) s = addCharacter(s, createCharacter({ name: `A${i}`, notes: "x" }));
  return s;
}

describe("retreat", () => {
  it("falls back to the cell the party stepped in from — a fled fight cannot be walked past", () => {
    let s = party(3);
    s = executeCommand(s, verdant, { type: "enter_dungeon" });
    let fromCell: string | undefined;
    let fightCell: string | undefined;
    for (let step = 0; step < 300 && s.phase !== "combat"; step += 1) {
      const before = s.position?.cellId;
      s = executeCommand(s, verdant, { type: "move_forward" });
      if (s.phase === "combat") {
        fromCell = before;
        fightCell = s.position?.cellId;
      } else if (s.position?.cellId === before) {
        s = executeCommand(s, verdant, { type: "turn_right" });
      }
    }

    expect(s.phase, "walking the maze should start a fight").toBe("combat");
    expect(s.combat?.retreatPosition?.cellId, "the fight remembers the cell stepped in from").toBe(fromCell);
    expect(fightCell, "moved onto a new cell to fight").not.toBe(fromCell);

    const retreated = executeCommand(s, verdant, { type: "retreat" });
    expect(retreated.phase).toBe("dungeon");
    // Back on the pre-fight cell, NOT left standing on the fight cell.
    expect(retreated.position?.cellId).toBe(fromCell);
    expect(retreated.position?.cellId).not.toBe(fightCell);
    // The retreat narrates + moves (a backward room entry) so the renderer pulls the party back.
    expect(retreated.log.at(-1)?.event?.type === "room_entered" || retreated.log.some((l) => l.event?.type === "room_entered")).toBe(true);
  });
});
