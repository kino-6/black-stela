import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { resolveCommand } from "../src/domain/rulesEngine";
import type { Character, GameState } from "../src/domain/types";

// Playtest 2026-07-29: a wiped party (every member wounded / at 0 HP) could descend and WANDER a floor
// it can never fight through. The invariant: a party with no able member is never in the dungeon —
// enforced at the descend guard AND as a safety net on any explore command.

const able = (seed = "w1"): Character => ({ ...createGuildCharacter({ name: `Rook-${seed}`, classId: "warrior", seed }), row: "front" });
const downed = (seed = "w2"): Character => ({
  ...createGuildCharacter({ name: `Vale-${seed}`, classId: "thief", seed }),
  row: "back",
  hp: 1,
  injury: "wounded"
});

const townState = (party: Character[]): GameState => ({ ...createInitialGameState(), party, phase: "town" });

describe("a wiped party can never be in the dungeon", () => {
  it("blocks descent when no member can act", () => {
    const result = resolveCommand(townState([downed(), downed()]), defaultWorld, { type: "enter_dungeon" });
    expect(result.state.phase).toBe("town"); // did not descend
    expect(result.events.some((e) => e.type === "command_blocked" && e.reason === "party_downed")).toBe(true);
  });

  it("still lets a party with even one able member descend", () => {
    const result = resolveCommand(townState([able(), downed()]), defaultWorld, { type: "enter_dungeon" });
    expect(result.state.phase).toBe("dungeon");
  });

  it("recovers by benching the downed and fielding a fresh party (the Wiz B-team, no cash needed)", () => {
    // A wiped 6, back in town, too broke to heal. Bench them all to the guild reserve…
    let s = townState(Array.from({ length: 6 }, (_, i) => downed(`d${i}`)));
    for (const member of [...s.party]) {
      s = resolveCommand(s, defaultWorld, { type: "bench_member", characterId: member.id }).state;
    }
    expect(s.party).toHaveLength(0);
    expect(s.reserve).toHaveLength(6); // the wounded wait, unhealed, until gold allows

    // …field a fresh 6 and descend. No infirmary bill paid.
    s = { ...s, party: Array.from({ length: 6 }, (_, i) => able(`f${i}`)) };
    expect(resolveCommand(s, defaultWorld, { type: "enter_dungeon" }).state.phase).toBe("dungeon");
  });

  it("evacuates a fully-downed party to town on any explore command (the safety net)", () => {
    const inDungeon = resolveCommand(townState([able()]), defaultWorld, { type: "enter_dungeon" }).state;
    // Now wound the sole member and try to keep exploring.
    const wiped: GameState = { ...inDungeon, party: inDungeon.party.map((m) => ({ ...m, hp: 1, injury: "wounded" as const })) };
    const moved = resolveCommand(wiped, defaultWorld, { type: "move_forward" });
    expect(moved.state.phase).toBe("town");
    expect(moved.state.position).toBeNull();
    expect(moved.events.some((e) => e.type === "party_wiped")).toBe(true);
  });
});
