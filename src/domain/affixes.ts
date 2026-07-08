import type { EquipmentSlot } from "./types";

/**
 * Equipment affixes ("named enchants") and the numeric "+N" upgrade rules that
 * ride on dropped gear. Affix effects stay on the four stat dimensions the
 * combat engine already folds (attack / defense / accuracy / speed), so an
 * affixed item needs no new combat math — only the stat summation in
 * getEffectiveCharacterStats reads them.
 */
export interface EquipmentAffix {
  id: string;
  attackBonus?: number;
  defenseBonus?: number;
  accuracyBonus?: number;
  speedBonus?: number;
  /** Slots this enchant can roll on. */
  slots: EquipmentSlot[];
  /** Earliest floor (1-based) this enchant appears on. */
  minFloor: number;
}

export const EQUIPMENT_AFFIXES: EquipmentAffix[] = [
  { id: "keen", accuracyBonus: 4, slots: ["weapon"], minFloor: 1 },
  { id: "heavy", attackBonus: 1, slots: ["weapon"], minFloor: 1 },
  { id: "cruel", attackBonus: 2, slots: ["weapon"], minFloor: 4 },
  { id: "warding", defenseBonus: 1, slots: ["offhand", "body", "head", "hands"], minFloor: 2 },
  { id: "bulwark", defenseBonus: 2, slots: ["offhand", "body"], minFloor: 5 },
  { id: "fleet", speedBonus: 1, slots: ["body", "hands", "accessory"], minFloor: 2 },
  { id: "deft", accuracyBonus: 2, speedBonus: 1, slots: ["accessory", "hands"], minFloor: 3 }
];

export function findAffix(affixId: string | undefined): EquipmentAffix | undefined {
  return affixId ? EQUIPMENT_AFFIXES.find((affix) => affix.id === affixId) : undefined;
}

/** The stat a numeric "+N" upgrade reinforces, chosen by the item's slot. */
export function plusPrimaryStat(slot: EquipmentSlot): "attackBonus" | "defenseBonus" | "accuracyBonus" {
  if (slot === "weapon") {
    return "attackBonus";
  }
  if (slot === "accessory") {
    return "accuracyBonus";
  }
  return "defenseBonus";
}

/**
 * A stable key that distinguishes affixed / upgraded copies from plain ones, so
 * inventory rows only stack when the base id, +N tier, and enchant all match.
 */
export function equipmentInstanceKey(id: string, plus?: number, affix?: string) {
  return `${id}${plus ? `+${plus}` : ""}${affix ? `@${affix}` : ""}`;
}
