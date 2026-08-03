import { describe, expect, it } from "vitest";
import { getWorldById } from "../src/data/worldRegistry";
import type { ScenarioWorld } from "../src/domain/types";

// The "fun gate" (user request 2026-08-04). A scenario is not FUN to treasure-hunt in if its shop is a flat
// wall of starter gear — the player needs (a) an ASPIRATIONAL ladder: gear that is out of reach early, worth
// saving for, and still good at the end, so money and loot have a goal; and (b) UTILITY items that make
// exploring markedly easier (a way home, lockpicks, a trap shim, a wall-sight lens). This gate encodes that
// standard so every world has to offer both, and locks it against regressing to「初期装備の羅列」.
//
// The DEFAULT world (黒碑) already models it: tier-1 starter gear (18–48G) → tier-2 mid (78–165G) → tier-3
// endgame KNIGHT-PLATE (320G) and WARLORD-BLADE (340G) unlocked only at flag.b7f.descent, plus a utility
// lineup (return-charm/lock-picks/trap-shim/dust-lens/lantern-oil). So its aspirational ladder is asserted
// LIVE here as the reference bar.
//
// VERDANT does NOT meet the aspirational half yet, and raising it is NOT a pure content edit: adding an
// endgame metal weapon/armour to the grove shop makes descentSim's realistic `mid` party wear it and silently
// eases Verdant's CALIBRATED difficulty curve (measured 2026-08-04: it flipped verdantBalance's Act-I /
// escalation gates and the kit-runs-dry economy gate). Landing it needs a difficulty-integrated pass — re-tune
// the grove's deep enemies so the better-available gear preserves the intended curve, OR make the sim's
// whole-descent loadout availability-aware and re-verify BOTH worlds. Tracked as a TODO below + in Tasks.md.

const ASPIRATIONAL_PRICE = 250; // a save-up price: above the mid tier (~165G), plainly unaffordable at the start.
const ARMOR_SLOTS = new Set(["body", "offhand", "head"]);
const UTILITY_KINDS = new Set(["utility", "escape"]); // kinds that ease EXPLORATION (not combat consumables).
const MIN_UTILITY = 3;

const WORLDS = ["default", "verdant"];

function shopEntries(world: ScenarioWorld) {
  return (world.shops ?? []).flatMap((shop) => shop.stock ?? []);
}
function equipmentById(world: ScenarioWorld, id: string) {
  return (world.equipment ?? []).find((e) => e.id === id);
}
function itemById(world: ScenarioWorld, id: string) {
  return (world.items ?? []).find((i) => i.id === id);
}
function shopWeapons(world: ScenarioWorld) {
  return shopEntries(world)
    .map((e) => equipmentById(world, e.itemId))
    .filter((e): e is NonNullable<typeof e> => !!e && e.slot === "weapon");
}
function shopArmor(world: ScenarioWorld) {
  return shopEntries(world)
    .map((e) => equipmentById(world, e.itemId))
    .filter((e): e is NonNullable<typeof e> => !!e && ARMOR_SLOTS.has(e.slot ?? ""));
}

// The aspirational ladder — LIVE for the worlds that already meet the standard.
describe.each(["default"])("fun gate — aspirational ladder — %s", (worldId) => {
  const world = getWorldById(worldId)!;

  it("offers an aspirational WEAPON worth saving for (buyable, ≥ the save-up price)", () => {
    const best = Math.max(0, ...shopWeapons(world).map((w) => w.price ?? 0));
    expect(best).toBeGreaterThanOrEqual(ASPIRATIONAL_PRICE);
  });

  it("offers an aspirational ARMOR worth saving for (buyable, ≥ the save-up price)", () => {
    const best = Math.max(0, ...shopArmor(world).map((a) => a.price ?? 0));
    expect(best).toBeGreaterThanOrEqual(ASPIRATIONAL_PRICE);
  });

  it("the aspirational weapon is actually the STRONGEST on offer (saving is rewarded)", () => {
    const weapons = shopWeapons(world);
    const priciest = weapons.reduce((a, b) => ((b.price ?? 0) > (a.price ?? 0) ? b : a));
    const strongest = weapons.reduce((a, b) => ((b.attackBonus ?? 0) > (a.attackBonus ?? 0) ? b : a));
    expect(priciest.attackBonus ?? 0).toBeGreaterThanOrEqual(strongest.attackBonus ?? 0);
  });
});

// Verdant's aspirational tier is a documented, difficulty-integrated task — not a silent gap.
it.todo(
  "fun gate — verdant: raise the grove shop to an aspirational weapon+armor ladder (needs a Verdant difficulty re-tune; see Tasks.md P8/P9)"
);

// The utility lineup — EVERY world must make exploring easier, incl. a way home. LIVE for all worlds.
describe.each(WORLDS)("fun gate — utility lineup — %s", (worldId) => {
  const world = getWorldById(worldId)!;

  it("stocks a utility lineup that makes exploring easier (incl. a way home)", () => {
    const utility = shopEntries(world)
      .map((e) => itemById(world, e.itemId))
      .filter((i): i is NonNullable<typeof i> => !!i && UTILITY_KINDS.has(i.kind ?? ""));
    expect(utility.length).toBeGreaterThanOrEqual(MIN_UTILITY);
    expect(utility.some((i) => i.kind === "escape")).toBe(true);
  });
});
