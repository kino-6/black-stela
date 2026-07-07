import { defaultWorld } from "../data/defaultWorld";
import { getEffectiveCharacterStats } from "../domain/economy";
import type { Character, ScenarioEquipment } from "../domain/types";
import type { Locale } from "../i18n";

/**
 * Catalog lookups against the loaded world: localized item/equipment/enemy
 * names, equipment resolution, and shop categorisation. Kept out of App so the
 * view only wires these into JSX.
 */

export function localizedCatalogName(itemId: string | undefined, locale: Locale) {
  if (!itemId) {
    return "-";
  }

  const item = defaultWorld.items.find((candidate) => candidate.id === itemId);
  if (item) {
    return item.locales?.[locale]?.name ?? item.name;
  }

  const equipment = defaultWorld.equipment.find((candidate) => candidate.id === itemId);
  return equipment?.locales?.[locale]?.name ?? equipment?.name ?? itemId;
}

export function localizedCatalogDescription(itemId: string | undefined, locale: Locale) {
  if (!itemId) {
    return "";
  }

  const item = defaultWorld.items.find((candidate) => candidate.id === itemId);
  if (item) {
    return item.locales?.[locale]?.description ?? "";
  }

  const equipment = findEquipmentById(itemId);
  return equipment?.locales?.[locale]?.description ?? equipment?.description ?? "";
}

export function equippedName(itemId: string | undefined, locale: Locale) {
  return itemId ? localizedCatalogName(itemId, locale) : "-";
}

export function localizedEnemyGroupName(group: { enemyId: string; name: string }, locale: Locale) {
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === group.enemyId);
  return enemy?.locales?.[locale]?.name ?? enemy?.name ?? group.name;
}

export function previewEquipmentStats(member: Character, equipment: ScenarioEquipment) {
  return getEffectiveCharacterStats(
    {
      ...member,
      equipment: {
        ...member.equipment,
        [equipment.slot]: equipment.id
      }
    },
    defaultWorld
  );
}

export function findEquipmentById(itemId: string | undefined) {
  return defaultWorld.equipment.find((candidate) => candidate.id === itemId);
}

export type ShopCategory = "weapon" | "armor" | "offhand" | "trinket" | "tool" | "consumable";
export const SHOP_CATEGORY_ORDER: ShopCategory[] = ["weapon", "armor", "offhand", "trinket", "tool", "consumable"];

export function shopCategoryFor(itemId: string): ShopCategory {
  const equipment = findEquipmentById(itemId);
  if (equipment) {
    if (equipment.slot === "weapon") return "weapon";
    if (equipment.slot === "body") return "armor";
    if (equipment.slot === "offhand") return "offhand";
    return "trinket";
  }
  const item = defaultWorld.items.find((candidate) => candidate.id === itemId);
  return item?.kind === "healing" || item?.kind === "escape" ? "consumable" : "tool";
}
