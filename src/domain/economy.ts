import type { Character, CombatStatus, Element, EquipmentSlot, InventoryItem, ScenarioEquipment, ScenarioItem, ScenarioWorld } from "./types";
import { PHYSICAL } from "./types";
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
  maxHp: number;
  maxMp: number;
  resistance: Partial<Record<CombatStatus, number>>;
  /** The element this character's basic attack deals (from the equipped weapon; default physical). */
  attackElement: Element;
  /** Incoming-damage multiplier per element, aggregated across worn gear (default 1 = no resist). */
  elementResist: Record<string, number>;
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
      restoreMp: item.restoreMp,
      curesStatuses: item.curesStatuses,
      grants: item.grants,
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

// A `reach` weapon (bow, long spear) lets its wielder strike from the back row
// even while a front line stands — the melee-can't-reach rule is lifted for it.
export function weaponReaches(character: Character, world: ScenarioWorld): boolean {
  const weapon = character.equipment.weapon;
  const catalog = weapon ? findEquipment(world, weapon.id) : undefined;
  return catalog?.tags?.includes("reach") ?? false;
}

export function getEffectiveCharacterStats(character: Character, world: ScenarioWorld): EffectiveCharacterStats {
  let attackBonus = 0;
  let defenseBonus = 0;
  let accuracyBonus = 0;
  let speedBonus = 0;
  let hpBonus = 0;
  let mpBonus = 0;
  const resistance: Partial<Record<CombatStatus, number>> = { ...(character.resistance ?? {}) };
  let attackElement: Element = PHYSICAL;
  const elementResist: Record<string, number> = {};

  for (const equipped of Object.values(character.equipment)) {
    const catalog = equipped ? findEquipment(world, equipped.id) : undefined;
    if (!equipped || !catalog) {
      continue;
    }

    attackBonus += catalog.attackBonus ?? 0;
    defenseBonus += catalog.defenseBonus ?? 0;
    accuracyBonus += catalog.accuracyBonus ?? 0;
    speedBonus += catalog.speedBonus ?? 0;
    hpBonus += catalog.hpBonus ?? 0;
    mpBonus += catalog.mpBonus ?? 0;
    for (const [status, value] of Object.entries(catalog.resistBonus ?? {})) {
      resistance[status as CombatStatus] = (resistance[status as CombatStatus] ?? 0) + (value ?? 0);
    }
    // A weapon's element becomes the wielder's basic-attack element (last weapon worn wins).
    if (catalog.slot === "weapon" && catalog.element) {
      attackElement = catalog.element;
    }
    // Element resistances MULTIPLY across gear — two 0.5 pieces stack to 0.25 — so a build can
    // commit to shrugging off one threat entirely, at the cost of the slots it took.
    for (const [element, value] of Object.entries(catalog.elementResist ?? {})) {
      elementResist[element] = (elementResist[element] ?? 1) * (value ?? 1);
    }

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

  // IMP-021A: the ACTIVE vocation's stat modifiers layer on top of the aptitude-derived base. Only
  // AUTHORED vocations carry modifiers (a basic/class vocation's stats are already the character's
  // base, so it is absent from world.vocations and contributes nothing). Read inline — importing
  // domain/vocations here would cycle through characterCreation → economy. See docs/design/vocation-mastery.md.
  const currentVocation = character.vocation?.current ?? character.classId;
  const voc = world.vocations.find((vocation) => vocation.id === currentVocation)?.statModifiers ?? {};

  return {
    attack: character.attack + attackBonus + (voc.attack ?? 0),
    damageMin: character.damageMin + attackBonus + (voc.damageMin ?? voc.attack ?? 0),
    damageMax: character.damageMax + attackBonus + (voc.damageMax ?? voc.attack ?? 0),
    accuracy: Math.max(0, Math.min(100, character.accuracy + accuracyBonus + (voc.accuracy ?? 0))),
    armor: character.armor + defenseBonus + (voc.armor ?? 0),
    speed: Math.max(0, character.speed + speedBonus + (voc.speed ?? 0)),
    maxHp: Math.max(1, character.maxHp + hpBonus + (voc.maxHp ?? 0)),
    maxMp: Math.max(0, character.maxMp + mpBonus + (voc.maxMp ?? 0)),
    resistance,
    attackElement,
    elementResist
  };
}

// Effective HP/MP caps including gear bonuses — equipping raises the ceiling;
// resting/recovery fills into it. Cheap enough to call from the view.
export function effectiveMaxHp(character: Character, world: ScenarioWorld): number {
  return getEffectiveCharacterStats(character, world).maxHp;
}

export function effectiveMaxMp(character: Character, world: ScenarioWorld): number {
  return getEffectiveCharacterStats(character, world).maxMp;
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
