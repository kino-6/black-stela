import { describe, expect, it } from "vitest";
import { remapRepeatOrders } from "../src/domain/rulesEngine";
import type { CombatActionDeclaration } from "../src/domain/types";

// #67: リピート (Repeat) re-issues the previous round's orders against the current
// board — distinct from オート (continuous auto-battle). These lock the remap that
// keeps a replay valid when the board has changed since the round it copies.
const orders: CombatActionDeclaration[] = [
  { actorId: "rook", action: "attack", targetGroupId: "g1" },
  { actorId: "mira", action: "cast", spellId: "firebolt", targetGroupId: "g2" },
  { actorId: "sei", action: "defend" }
];

describe("remapRepeatOrders", () => {
  it("passes orders through unchanged when everyone and every target still stands", () => {
    const replay = remapRepeatOrders(orders, new Set(["rook", "mira", "sei"]), ["g1", "g2"]);
    expect(replay).toEqual(orders);
  });

  it("drops orders for actors who have fallen", () => {
    const replay = remapRepeatOrders(orders, new Set(["rook", "sei"]), ["g1", "g2"]);
    expect(replay.map((order) => order.actorId)).toEqual(["rook", "sei"]);
  });

  it("retargets attack/cast orders whose group was wiped to the first living group", () => {
    const replay = remapRepeatOrders(orders, new Set(["rook", "mira", "sei"]), ["g2"]);
    // g1 is gone: Rook's attack retargets to g2; Mira's cast at g2 is untouched.
    expect(replay[0]).toMatchObject({ actorId: "rook", targetGroupId: "g2" });
    expect(replay[1]).toMatchObject({ actorId: "mira", targetGroupId: "g2" });
    expect(replay[2]).toMatchObject({ actorId: "sei", action: "defend" });
  });

  it("leaves a group-target order alone when there is no living group to fall back to", () => {
    const replay = remapRepeatOrders(orders, new Set(["rook"]), []);
    expect(replay[0]).toEqual({ actorId: "rook", action: "attack", targetGroupId: "g1" });
  });

  it("returns nothing to repeat when no listed actor is still active", () => {
    expect(remapRepeatOrders(orders, new Set(["ghost"]), ["g1"])).toEqual([]);
  });
});
