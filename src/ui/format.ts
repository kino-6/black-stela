import { getEffectiveCharacterStats } from "../domain/economy";
import type { Character, EquipmentSlot, GameState, InventoryItem, ScenarioEquipment } from "../domain/types";
import type { DebugProgress } from "../debug/debugStart";
import type { Translator } from "../i18n";

/**
 * Pure presentation helpers: turn domain values into localized display strings.
 * No world/catalog lookups here — see the catalog helpers for those.
 */

export function formatPhase(phase: GameState["phase"], t: Translator) {
  if (phase === "town") {
    return t("play.town");
  }

  if (phase === "combat") {
    return t("play.combat");
  }

  return t("play.dungeon");
}

export function formatCombatRow(row: GameState["party"][number]["row"], t: Translator) {
  return row === "front" ? t("play.frontRow") : t("play.backRow");
}

export function getMemberRecoveryCost(member: Character) {
  return Math.max(0, member.maxHp - member.hp) + (member.injury ? 8 : 0);
}

export function isShopEventType(type: string | undefined) {
  return type === "item_bought" || type === "item_sold" || type === "equipment_changed";
}

export function isRecoveryEventType(type: string | undefined) {
  return type === "party_recovered" || type === "recovery_blocked";
}

export function formatStatDelta(
  current: ReturnType<typeof getEffectiveCharacterStats>,
  next: ReturnType<typeof getEffectiveCharacterStats>,
  t: Translator
) {
  const parts = [
    formatSignedDelta(t("town.effectAttack"), next.damageMax - current.damageMax),
    formatSignedDelta(t("town.effectAccuracy"), next.accuracy - current.accuracy),
    formatSignedDelta(t("town.effectDefense"), next.armor - current.armor),
    formatSignedDelta(t("town.effectSpeed"), next.speed - current.speed)
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : t("town.noStatChange");
}

export function formatSignedDelta(label: string, value: number) {
  if (value === 0) {
    return "";
  }

  return `${label} ${value > 0 ? "+" : ""}${value}`;
}

export function formatEquipmentSlot(slot: EquipmentSlot, t: Translator) {
  return t(`town.slots.${slot}` as Parameters<Translator>[0]);
}

export function formatEquipmentEffect(equipment: ScenarioEquipment, t: Translator) {
  return formatBonusParts(
    equipment.attackBonus,
    equipment.defenseBonus,
    equipment.accuracyBonus,
    equipment.speedBonus,
    t
  );
}

export function formatInventoryEffect(item: InventoryItem, t: Translator) {
  return formatBonusParts(item.attackBonus, item.defenseBonus, item.accuracyBonus, item.speedBonus, t);
}

export function formatBonusParts(
  attackBonus: number | undefined,
  defenseBonus: number | undefined,
  accuracyBonus: number | undefined,
  speedBonus: number | undefined,
  t: Translator
) {
  const parts = [
    formatSignedBonus(t("town.effectAttack"), attackBonus),
    formatSignedBonus(t("town.effectDefense"), defenseBonus),
    formatSignedBonus(t("town.effectAccuracy"), accuracyBonus),
    formatSignedBonus(t("town.effectSpeed"), speedBonus)
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : t("aptitude.balanced");
}

export function formatSignedBonus(label: string, value: number | undefined) {
  if (!value) {
    return "";
  }

  return `${label} ${value > 0 ? "+" : ""}${value}`;
}

export function formatDebugProgress(progress: DebugProgress, t: Translator) {
  if (progress === "ready") {
    return t("debug.ready");
  }

  if (progress === "after_encounter") {
    return t("debug.afterEncounter");
  }

  if (progress === "return_ready") {
    return t("debug.returnReady");
  }

  return t("debug.floorStart", { floor: progress.replace("floor_", "B") + "F" });
}
