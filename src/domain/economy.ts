import type { Character, EquipmentSlot, InventoryItem, ScenarioEquipment, ScenarioItem, ScenarioWorld } from "./types";
import { equipmentInstanceKey, findAffix, plusPrimaryStat } from "./affixes";

export const STARTING_PARTY_GOLD = 75;
const RECOVERY_HP_COST = 1;
const RECOVERY_INJURY_COST = 8;

export interface EffectiveCharacterStats {
  attack: number;
  damageMin: number;
  damageMax: number;
  accuracy: number;
  armor: number;
  speed: number;
}

export function createInventoryItemFromCatalog(world: ScenarioWorld, itemId: string, quantity = 1): InventoryItem | null {
  const item = findCatalogItem(world, itemId);
  if (item) {
    return {
      id: item.id,
      name: item.name,
      kind: item.kind,
      quantity,
      healAmount: item.healAmount,
      sellValue: item.sellValue
    };
  }

  const equipment = findEquipment(world, itemId);
  if (equipment) {
    return {
      id: equipment.id,
      name: equipment.name,
      kind: "equipment",
      quantity,
      slot: equipment.slot,
      attackBonus: equipment.attackBonus,
      defenseBonus: equipment.defenseBonus,
      accuracyBonus: equipment.accuracyBonus,
      speedBonus: equipment.speedBonus,
      sellValue: equipment.sellValue
    };
  }

  return null;
}

export function addInventoryItem(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const key = equipmentInstanceKey(item.id, item.plus, item.affix);
  const existing = inventory.find((candidate) => equipmentInstanceKey(candidate.id, candidate.plus, candidate.affix) === key);
  if (!existing) {
    return [...inventory, item];
  }

  return inventory.map((candidate) =>
    equipmentInstanceKey(candidate.id, candidate.plus, candidate.affix) === key
      ? { ...candidate, quantity: candidate.quantity + item.quantity }
      : candidate
  );
}

export function removeInventoryItem(
  inventory: InventoryItem[],
  itemId: string,
  quantity = 1,
  plus?: number,
  affix?: string
): InventoryItem[] {
  const key = equipmentInstanceKey(itemId, plus, affix);
  return inventory
    .map((item) =>
      equipmentInstanceKey(item.id, item.plus, item.affix) === key
        ? { ...item, quantity: Math.max(0, item.quantity - quantity) }
        : item
    )
    .filter((item) => item.quantity > 0);
}

export function findCatalogItem(world: ScenarioWorld, itemId: string): ScenarioItem | undefined {
  return world.items.find((item) => item.id === itemId);
}

export function findEquipment(world: ScenarioWorld, equipmentId: string): ScenarioEquipment | undefined {
  return world.equipment.find((item) => item.id === equipmentId);
}

export function getEffectiveCharacterStats(character: Character, world: ScenarioWorld): EffectiveCharacterStats {
  let attackBonus = 0;
  let defenseBonus = 0;
  let accuracyBonus = 0;
  let speedBonus = 0;

  for (const equipped of Object.values(character.equipment)) {
    const catalog = equipped ? findEquipment(world, equipped.id) : undefined;
    if (!equipped || !catalog) {
      continue;
    }

    attackBonus += catalog.attackBonus ?? 0;
    defenseBonus += catalog.defenseBonus ?? 0;
    accuracyBonus += catalog.accuracyBonus ?? 0;
    speedBonus += catalog.speedBonus ?? 0;

    // A numeric "+N" upgrade reinforces the slot's primary stat.
    if (equipped.plus) {
      const primary = plusPrimaryStat(catalog.slot);
      if (primary === "attackBonus") {
        attackBonus += equipped.plus;
      } else if (primary === "defenseBonus") {
        defenseBonus += equipped.plus;
      } else {
        accuracyBonus += equipped.plus;
      }
    }

    // A named enchant adds its own stat bonuses on top.
    const affix = findAffix(equipped.affix);
    if (affix) {
      attackBonus += affix.attackBonus ?? 0;
      defenseBonus += affix.defenseBonus ?? 0;
      accuracyBonus += affix.accuracyBonus ?? 0;
      speedBonus += affix.speedBonus ?? 0;
    }
  }

  return {
    attack: character.attack + attackBonus,
    damageMin: character.damageMin + attackBonus,
    damageMax: character.damageMax + attackBonus,
    accuracy: Math.max(0, Math.min(100, character.accuracy + accuracyBonus)),
    armor: character.armor + defenseBonus,
    speed: Math.max(0, character.speed + speedBonus)
  };
}

export function getEquipmentSlot(world: ScenarioWorld, equipmentId: string): EquipmentSlot | null {
  return findEquipment(world, equipmentId)?.slot ?? null;
}

export function isEquipmentUsableBy(equipment: ScenarioEquipment, character: Character) {
  return !equipment.allowedClasses?.length || equipment.allowedClasses.includes(character.classId);
}

export function calculateRecoveryCost(party: Character[]) {
  return party.reduce((total, member) => {
    const missingHp = Math.max(0, member.maxHp - member.hp);
    return total + missingHp * RECOVERY_HP_COST + (member.injury ? RECOVERY_INJURY_COST : 0);
  }, 0);
}
