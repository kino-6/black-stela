import { defaultWorld } from "../data/defaultWorld";
import { findBackground, findClass } from "../domain/characterCreation";
import { getEffectiveCharacterStats } from "../domain/economy";
import type { Character, CombatActionDeclaration, EquippedItem, GameState, ScenarioEquipment } from "../domain/types";
import type { Locale, TranslationKey, Translator } from "../i18n";
import { formatCombatAction, formatCombatRow } from "./format";

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

// Decorate a base equipment name with its enchant prefix and "+N" suffix, e.g.
// "Keen Militia Sabre +1". Plain gear returns just the base name.
export function describeEquipmentInstance(
  itemId: string | undefined,
  locale: Locale,
  t: Translator,
  plus?: number,
  affix?: string
) {
  if (!itemId) {
    return "-";
  }
  const prefix = affix ? `${t(`affix.${affix}` as TranslationKey)} ` : "";
  const suffix = plus ? ` +${plus}` : "";
  return `${prefix}${localizedCatalogName(itemId, locale)}${suffix}`;
}

export function equippedName(equipped: EquippedItem | undefined, locale: Locale, t: Translator) {
  return equipped ? describeEquipmentInstance(equipped.id, locale, t, equipped.plus, equipped.affix) : "-";
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
        [equipment.slot]: { id: equipment.id }
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

export function formatCombatOrder(order: CombatActionDeclaration, state: GameState, locale: Locale, t: Translator) {
  const actor = state.party.find((member) => member.id === order.actorId);
  const target = state.combat?.enemyGroups.find((group) => group.id === order.targetGroupId);
  const action = formatCombatAction(order.action, t);
  if (target) {
    return t("play.orderWithTarget", { actor: actor?.name ?? order.actorId, action, target: localizedEnemyGroupName(target, locale) });
  }

  return t("play.orderWithoutTarget", { actor: actor?.name ?? order.actorId, action });
}

export function formatCharacterTitle(title: string, classId: GameState["party"][number]["classId"], locale: Locale) {
  const classDef = findClass(classId);
  return title === classDef.label.en ? classDef.label[locale] : title;
}

export function formatCharacterSummary(
  member: GameState["party"][number],
  locale: Locale,
  t: Translator,
  options: { includeRow?: boolean } = {}
) {
  const classDef = findClass(member.classId);
  const title = formatCharacterTitle(member.title, member.classId, locale);
  const row = options.includeRow === false ? "" : formatCombatRow(member.row, t);
  const parts = isDefaultClassTitle(member.title, member.classId)
    ? [classDef.label[locale], row]
    : [title, classDef.label[locale], row];

  return Array.from(new Set(parts.filter(Boolean))).join(" / ");
}

export function isDefaultClassTitle(title: string, classId: GameState["party"][number]["classId"]) {
  const classDef = findClass(classId);
  const defaultAliases: Partial<Record<GameState["party"][number]["classId"], string[]>> = {
    vanguard: ["Vanguard", "前衛"],
    seeker: ["Seeker", "探索者"],
    mender: ["Mender", "癒し手"],
    occultist: ["Occultist", "秘術師"]
  };
  return [classDef.label.en, classDef.label.ja, ...(defaultAliases[classId] ?? [])].includes(title);
}

export function formatCharacterNotes(notes: string, backgroundId: GameState["party"][number]["backgroundId"], locale: Locale) {
  const background = findBackground(backgroundId);
  return notes === background.notes.en ? background.notes[locale] : notes;
}

export function localizedShopName(shop: (typeof defaultWorld.shops)[number], locale: Locale) {
  return shop.locales?.[locale]?.name ?? shop.name;
}
