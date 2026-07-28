import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import type { GameState } from "../src/domain/types";

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
    const chambers = chamberRoomIds("dungeon.verdant.g1f");
    const everyType = [...new Set(verdant.encounterTables.flatMap((t) => t.entries.map((e) => e.enemyId)))];

    let s = party(4);
    s = executeCommand(s, verdant, { type: "enter_dungeon" });
    const foughtIn = new Set<string>();

    // Keep EVERY enemy type permanently "already cleared", so first-contact suppression is fully on. Under
    // the old rules that silenced all chambers; chamberGuardian must make each chamber fight regardless.
    for (let step = 0; step < 400 && foughtIn.size < 3; step += 1) {
      const before = s.position?.roomId;
      s = { ...s, floorClearedEnemies: [...everyType] } as GameState;
      s = executeCommand(s, verdant, { type: "move_forward" });
      // A 玄室 is entered through a CLOSED door: the first step opens it, the next enters.
      const doorEv1 = s.log.at(-1)?.event;
      if (doorEv1?.type === "door_opened") {
        s = executeCommand(s, verdant, { type: "open_door" });
        s = { ...s, floorClearedEnemies: [...everyType] } as GameState;
        s = executeCommand(s, verdant, { type: "move_forward" });
      }
      if (s.phase === "combat") {
        if (chambers.has(s.combat!.roomId)) foughtIn.add(s.combat!.roomId);
        // Shrug the fight off WITHOUT claiming the chest, and keep every type cleared.
        s = { ...s, phase: "dungeon", combat: null, floorClearedEnemies: [...everyType] } as GameState;
      }
      if (s.position?.roomId === before) s = executeCommand(s, verdant, { type: "turn_right" });
    }

    expect(
      foughtIn.size,
      "multiple distinct 玄室 must each fire their guardian even with the shared type cleared"
    ).toBeGreaterThanOrEqual(2);
  });

  it("a chamber leaves its guarded chest only after the guardian is beaten", () => {
    const chambers = chamberRoomIds("dungeon.verdant.g1f");
    const everyType = [...new Set(verdant.encounterTables.flatMap((t) => t.entries.map((e) => e.enemyId)))];

    let s = party(4);
    s = executeCommand(s, verdant, { type: "enter_dungeon" });
    let chamberRoom: string | null = null;

    for (let step = 0; step < 400 && !chamberRoom; step += 1) {
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
  });
});
