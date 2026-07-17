// IMP-022A — rare-loot / affix / appraisal rules. Affix pools are data (content/worlds/<id>/
// affixes.md) merged with the built-in EQUIPMENT_AFFIXES; a drop rolls a rarity and (if rare+) an
// affix, producing a unique instance that may be unidentified until appraised. See
// docs/design/rare-loot.md. Pure + deterministic (seeded) so drops replay identically.
import { EQUIPMENT_AFFIXES, equipmentInstanceKey } from "./affixes";
import type { EquipmentSlot, InventoryItem, ItemRarity, ScenarioWorld } from "./types";

export interface ResolvedAffix {
  id: string;
  label: string;
  slots: EquipmentSlot[];
  minFloor: number;
  rarity: ItemRarity;
  weight: number;
  attackBonus?: number;
  defenseBonus?: number;
  accuracyBonus?: number;
  speedBonus?: number;
}

const RARITY_ORDER: ItemRarity[] = ["common", "rare", "epic"];

export function rarityRank(rarity: ItemRarity | undefined): number {
  return RARITY_ORDER.indexOf(rarity ?? "common");
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

// Built-in enchants are the common pool; authored affixes carry their own rarity. Authored wins on id.
export function resolveAffixCatalog(world: ScenarioWorld): ResolvedAffix[] {
  const authoredIds = new Set(world.affixes.map((affix) => affix.id));
  const builtIn: ResolvedAffix[] = EQUIPMENT_AFFIXES.filter((affix) => !authoredIds.has(affix.id)).map((affix) => ({
    id: affix.id,
    label: affix.id,
    slots: affix.slots,
    minFloor: affix.minFloor,
    rarity: "common",
    weight: 1,
    attackBonus: affix.attackBonus,
    defenseBonus: affix.defenseBonus,
    accuracyBonus: affix.accuracyBonus,
    speedBonus: affix.speedBonus
  }));
  const authored: ResolvedAffix[] = world.affixes.map((affix) => ({
    id: affix.id,
    label: affix.label,
    slots: affix.slots,
    minFloor: affix.minFloor,
    rarity: affix.rarity,
    weight: affix.weight ?? 1,
    attackBonus: affix.attackBonus,
    defenseBonus: affix.defenseBonus,
    accuracyBonus: affix.accuracyBonus,
    speedBonus: affix.speedBonus
  }));
  return [...builtIn, ...authored];
}

export function findResolvedAffix(world: ScenarioWorld, affixId: string | undefined): ResolvedAffix | undefined {
  return affixId ? resolveAffixCatalog(world).find((affix) => affix.id === affixId) : undefined;
}

// The rarity a drop rolls, biased deeper by floor. Kept modest — most drops are common.
function rollRarity(seed: string, floor: number): ItemRarity {
  const roll = hashSeed(`${seed}:rarity`) % 100;
  const epicChance = Math.min(6, 1 + Math.floor(floor / 3)); // 1%..6%
  const rareChance = Math.min(24, 10 + floor); // 10%..24%
  if (roll < epicChance) return "epic";
  if (roll < epicChance + rareChance) return "rare";
  return "common";
}

// Roll a dropped equipment instance from a base equipment id. A common drop is identified and
// stacks; a rare/epic drop is a unique, unidentified instance carrying one eligible affix.
export function rollEquipmentDrop(
  world: ScenarioWorld,
  baseEquipId: string,
  floor: number,
  seed: string
): InventoryItem | null {
  const equip = world.equipment.find((candidate) => candidate.id === baseEquipId);
  if (!equip) {
    return null;
  }
  const base: InventoryItem = {
    id: equip.id,
    name: equip.name,
    kind: "equipment",
    quantity: 1,
    slot: equip.slot,
    sellValue: equip.sellValue,
    rarity: "common",
    identified: true
  };

  const rarity = rollRarity(seed, floor);
  if (rarity === "common") {
    return base;
  }

  const eligible = resolveAffixCatalog(world).filter(
    (affix) => affix.slots.includes(equip.slot) && affix.minFloor <= floor && rarityRank(affix.rarity) >= 1
  );
  if (eligible.length === 0) {
    return base; // no rare affix fits this slot/floor — a plain common instead of an empty "rare"
  }
  const totalWeight = eligible.reduce((sum, affix) => sum + affix.weight, 0);
  let pick = hashSeed(`${seed}:affix`) % totalWeight;
  const chosen = eligible.find((affix) => (pick -= affix.weight) < 0) ?? eligible[0];

  return {
    ...base,
    rarity,
    affix: chosen.id,
    identified: false,
    instanceId: `loot-${hashSeed(`${seed}:${equip.id}:${chosen.id}`).toString(36)}`
  };
}

export function appraiseInstance(item: InventoryItem): InventoryItem {
  return { ...item, identified: true };
}

export function isUnidentifiedRare(item: InventoryItem): boolean {
  return rarityRank(item.rarity) >= 1 && item.identified === false;
}

// Bulk conversion (sell/dismantle) must never consume an item that is equipped, locked, favorited,
// or an unidentified rare (its value is unknown). equippedKeys is the set of equipmentInstanceKeys
// currently worn by the party.
export function isProtectedFromBulk(item: InventoryItem, equippedKeys: Set<string>): boolean {
  if (item.locked || item.favorite || isUnidentifiedRare(item)) {
    return true;
  }
  return equippedKeys.has(equipmentInstanceKey(item.id, item.plus, item.affix));
}

const RARITY_SELL_BONUS: Record<ItemRarity, number> = { common: 0, rare: 12, epic: 30 };
const RARITY_MATERIALS: Record<ItemRarity, number> = { common: 1, rare: 2, epic: 4 };

// IMP-022V: appraisal is a paid service, not free knowledge — the fee scales with how exclusive the
// find is (an epic costs more to read than a rare), so identifying is a spending decision. Kept
// below the item's own value so appraising a keeper is still worth it.
const RARITY_APPRAISAL_FEE: Record<ItemRarity, number> = { common: 0, rare: 20, epic: 55 };

export function appraisalFee(item: Pick<InventoryItem, "rarity">): number {
  return RARITY_APPRAISAL_FEE[item.rarity ?? "common"];
}

// Gold from selling — deliberately below any purchase price (no buy→resell loop).
export function sellValueOf(item: InventoryItem): number {
  return (item.sellValue ?? 0) + RARITY_SELL_BONUS[item.rarity ?? "common"];
}

// Materials from dismantling — a small count scaling with rarity (no appraisal→dismantle profit).
export function dismantleYield(item: InventoryItem): number {
  return RARITY_MATERIALS[item.rarity ?? "common"] * Math.max(1, item.quantity);
}
