import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { withDebugStartCell } from "../src/debug/debugStart";
import { executeCommand } from "../src/domain/rulesEngine";
import type { Direction, GameState } from "../src/domain/types";

const OFFSET: Record<Direction, [number, number]> = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP: Record<Direction, Direction> = { north: "south", south: "north", east: "west", west: "east" };

// Where a 玄室 (an enclosed room now) is entered from: the corridor cell outside its ONE door, and the facing
// that looks through the door into the room.
function chamberApproach(floorId: string, chamberRoomId: string): { outsideRoomId: string; facing: Direction } | null {
  const floor = worldRegistry.verdant.dungeons.find((d) => d.id === floorId);
  const cell = floor?.grid?.cells.find((c) => c.roomId === chamberRoomId);
  if (!cell) return null;
  for (const [dir, edge] of Object.entries(cell.edges)) {
    if (edge?.kind !== "door") continue;
    const [dx, dy] = OFFSET[dir as Direction];
    const outside = floor!.grid!.cells.find((c) => c.x === cell.x + dx && c.y === cell.y + dy);
    if (outside) return { outsideRoomId: outside.roomId, facing: OPP[dir as Direction] };
  }
  return null;
}

// The 玄室 (Wiz-style guaranteed-fight + treasure room) gate. Playtest bug: the early Verdant floors seat
// 6–8 chambers that all SHARE one pack table, and the encounter model suppresses an enemy TYPE once it has
// been met this floor visit (first-contact). So clearing the first chamber suppressed every other chamber's
// guardian — they sat empty, and each empty chamber's chest was gated behind a fight that never fired, so
// the treasure was unreachable. `chamberGuardian` fixes it by gating each chamber PER-ROOM (its own chest
// claim), not by type. These tests would fail under the old type-only suppression (0 chamber fights once the
// type is cleared) and lock the fix in.
const verdant = worldRegistry.verdant;

function party(size: number): GameState {
  let s = createInitialGameState();
  for (let i = 0; i < size; i += 1) s = addCharacter(s, createCharacter({ name: `A${i}`, notes: "x" }));
  return s;
}

const chamberRoomIds = (floorId: string) =>
  new Set(
    (verdant.dungeons.find((d) => d.id === floorId)?.rooms ?? [])
      .filter((r) => (r as { chamberGuardian?: boolean }).chamberGuardian)
      .map((r) => r.id)
  );

describe("玄室 chamber guardians", () => {
  it("data — the early Verdant floors author ≥6 chamberGuardian rooms each", () => {
    for (const floorId of ["dungeon.verdant.g1f", "dungeon.verdant.g2f", "dungeon.verdant.g3f"]) {
      expect(chamberRoomIds(floorId).size, `${floorId} 玄室`).toBeGreaterThanOrEqual(6);
    }
  });

  it("every chamber is its OWN fight — they don't suppress each other once the shared type is met", () => {
    const everyType = [...new Set(verdant.encounterTables.flatMap((t) => t.entries.map((e) => e.enemyId)))];
    // Walk into each of two DIFFERENT chambers from outside its door (they are enclosed rooms now), with every
    // enemy type kept "already cleared" so first-contact suppression is fully on. chamberGuardian must make
    // each fire regardless — the old type-only suppression silenced all but the first.
    const chamberIds = [...chamberRoomIds("dungeon.verdant.g1f")]
      .map((id) => ({ id, approach: chamberApproach("dungeon.verdant.g1f", id) }))
      .filter((c) => c.approach)
      .slice(0, 2);
    expect(chamberIds.length, "at least two 玄室 have a reachable door").toBe(2);

    const foughtIn = new Set<string>();
    for (const { id, approach } of chamberIds) {
      let s = party(4);
      s = executeCommand(s, verdant, { type: "enter_dungeon" });
      s = withDebugStartCell(s, verdant, approach!.outsideRoomId, approach!.facing);
      s = { ...s, floorClearedEnemies: [...everyType] } as GameState;
      s = executeCommand(s, verdant, { type: "move_forward" }); // bump the closed door open
      s = { ...s, floorClearedEnemies: [...everyType] } as GameState;
      s = executeCommand(s, verdant, { type: "move_forward" }); // step into the room
      if (s.phase === "combat" && s.combat!.roomId === id) foughtIn.add(id);
    }
    expect(
      foughtIn.size,
      "each 玄室 fires its own guardian even with the shared type cleared"
    ).toBeGreaterThanOrEqual(2);
  });

  it("a chamber leaves its guarded chest only after the guardian is beaten", () => {
    const chambers = chamberRoomIds("dungeon.verdant.g1f");
    const everyType = [...new Set(verdant.encounterTables.flatMap((t) => t.entries.map((e) => e.enemyId)))];

    let s = party(4);
    s = executeCommand(s, verdant, { type: "enter_dungeon" });
    let chamberRoom: string | null = null;

    for (let step = 0; step < 1500 && !chamberRoom; step += 1) {
      const before = s.position?.roomId;
      s = { ...s, floorClearedEnemies: [...everyType] } as GameState;
      s = executeCommand(s, verdant, { type: "move_forward" });
      const doorEv2 = s.log.at(-1)?.event;
      if (doorEv2?.type === "door_opened") {
        s = executeCommand(s, verdant, { type: "open_door" });
        s = { ...s, floorClearedEnemies: [...everyType] } as GameState;
        s = executeCommand(s, verdant, { type: "move_forward" });
      }
      if (s.phase === "combat" && chambers.has(s.combat!.roomId)) {
        chamberRoom = s.combat!.roomId;
        // Before the win, the chamber's chest is NOT sitting out (it is gated behind the fight).
        expect((s.chests ?? []).some((c) => c.roomId === chamberRoom)).toBe(false);
        s = executeCommand(s, verdant, { type: "debug_force_victory" });
        break;
      }
      if (s.phase === "combat") s = { ...s, phase: "dungeon", combat: null } as GameState;
      if (s.position?.roomId === before) s = executeCommand(s, verdant, { type: "turn_right" });
    }

    expect(chamberRoom, "reached a 玄室 fight").not.toBeNull();
    // Victory leaves the chamber's chest on its cell, claimable now.
    expect((s.chests ?? []).some((c) => c.roomId === chamberRoom)).toBe(true);

    // ...and after dismissing the result, the party stands ON that chest cell so the dungeon raises the chest
    // panel — locks the full "win → chest is right here to open" path (playtest doubt: "宝箱が出ない").
    s = executeCommand(s, verdant, { type: "continue_after_combat" });
    expect(s.phase).toBe("dungeon");
    const chestHere = (s.chests ?? []).find((c) => c.cellId === s.position?.cellId);
    expect(chestHere?.roomId, "the chest sits on the party's cell after the fight").toBe(chamberRoom);
  });

  it("a BEATEN 玄室 never re-fights on re-entry — not even a fresh pack type (#15 re-fight bug)", () => {
    const chamber = [...chamberRoomIds("dungeon.verdant.g1f")]
      .map((id) => ({ id, approach: chamberApproach("dungeon.verdant.g1f", id) }))
      .find((c) => c.approach)!;
    let s = party(4);
    s = executeCommand(s, verdant, { type: "enter_dungeon" });
    s = withDebugStartCell(s, verdant, chamber.approach!.outsideRoomId, chamber.approach!.facing);
    // Mark the chamber BEATEN (its chest claimed) but leave floorClearedEnemies EMPTY — so the OLD logic
    // would re-roll its 3-type pack and fight a not-yet-seen type. The fix must keep a beaten chamber silent.
    s = { ...s, floorClaimedTreasures: [chamber.id], floorClearedEnemies: [] } as GameState;
    s = executeCommand(s, verdant, { type: "move_forward" }); // one-step door: opens AND enters
    if (s.phase === "dungeon" && s.position?.roomId !== chamber.id) {
      s = executeCommand(s, verdant, { type: "move_forward" });
    }
    expect(s.position?.roomId, "the party actually entered the beaten chamber").toBe(chamber.id);
    expect(s.phase, "a beaten 玄室 does not re-fight on re-entry").toBe("dungeon");
  });
});
