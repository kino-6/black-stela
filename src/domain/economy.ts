import type { Character, EquipmentSlot, InventoryItem, ScenarioEquipment, ScenarioItem, ScenarioWorld } from "./types";

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
  const existing = inventory.find((candidate) => candidate.id === item.id);
  if (!existing) {
    return [...inventory, item];
  }

  return inventory.map((candidate) =>
    candidate.id === item.id ? { ...candidate, quantity: candidate.quantity + item.quantity } : candidate
  );
}

export function removeInventoryItem(inventory: InventoryItem[], itemId: string, quantity = 1): InventoryItem[] {
  return inventory
    .map((item) => (item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item))
    .filter((item) => item.quantity > 0);
}

export function findCatalogItem(world: ScenarioWorld, itemId: string): ScenarioItem | undefined {
  return world.items.find((item) => item.id === itemId);
}

export function findEquipment(world: ScenarioWorld, equipmentId: string): ScenarioEquipment | undefined {
  return world.equipment.find((item) => item.id === equipmentId);
}

export function getEffectiveCharacterStats(character: Character, world: ScenarioWorld): EffectiveCharacterStats {
  const equipped = Object.values(character.equipment)
    .map((equipmentId) => (equipmentId ? findEquipment(world, equipmentId) : undefined))
    .filter((equipment): equipment is ScenarioEquipment => Boolean(equipment));
  const attackBonus = equipped.reduce((total, item) => total + (item.attackBonus ?? 0), 0);
  const defenseBonus = equipped.reduce((total, item) => total + (item.defenseBonus ?? 0), 0);
  const accuracyBonus = equipped.reduce((total, item) => total + (item.accuracyBonus ?? 0), 0);
  const speedBonus = equipped.reduce((total, item) => total + (item.speedBonus ?? 0), 0);

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
