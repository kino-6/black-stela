import { getEffectiveCharacterStats } from "../domain/economy";
import type {
  Character,
  CharacterAptitudes,
  CombatActionKind,
  CombatEnemyGroup,
  EquipmentSlot,
  GameState,
  InventoryItem,
  ScenarioEquipment
} from "../domain/types";
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

// The full effect a piece of gear carries — the four combat stats PLUS hp/mp/regen and a 耐性(ward) marker for
// any resist/element bonus. The old 4-stat-only summary fell back to the aptitude word "均等" for an accessory
// whose whole point is HP or resistances, so a ward charm read as meaningless「装身具・均等」(playtest 2026-08-03
// 「均等とは？」). Truly effect-less gear reads 変化なし, never 均等.
function gearEffectSummary(
  g: {
    attackBonus?: number;
    defenseBonus?: number;
    accuracyBonus?: number;
    speedBonus?: number;
    hpBonus?: number;
    mpBonus?: number;
    regen?: number;
    resistBonus?: Partial<Record<string, number>>;
    elementResist?: Partial<Record<string, number>>;
  },
  t: Translator
) {
  const parts = [
    formatSignedBonus(t("town.effectAttack"), g.attackBonus),
    formatSignedBonus(t("town.effectDefense"), g.defenseBonus),
    formatSignedBonus(t("town.effectAccuracy"), g.accuracyBonus),
    formatSignedBonus(t("town.effectSpeed"), g.speedBonus),
    formatSignedBonus(t("town.effectHp"), g.hpBonus),
    formatSignedBonus(t("town.effectMp"), g.mpBonus),
    formatSignedBonus(t("town.effectRegen"), g.regen)
  ].filter(Boolean);
  const hasWard =
    (g.resistBonus && Object.keys(g.resistBonus).length > 0) ||
    (g.elementResist && Object.keys(g.elementResist).length > 0);
  if (hasWard) parts.push(t("town.effectWard"));
  return parts.length > 0 ? parts.join(" / ") : t("town.noStatChange");
}

export function formatEquipmentEffect(equipment: ScenarioEquipment, t: Translator) {
  return gearEffectSummary(equipment, t);
}

export function formatInventoryEffect(item: InventoryItem, t: Translator) {
  return gearEffectSummary(item, t);
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

export function formatEnemyGroupStatus(group: CombatEnemyGroup, t: Translator) {
  const ratio = group.maxHpEach > 0 ? group.hpEach / group.maxHpEach : 0;
  const condition = ratio <= 0.35
    ? t("play.enemyConditionWeak")
    : ratio < 1
      ? t("play.enemyConditionWounded")
      : t("play.enemyConditionFresh");
  return t("play.enemyGroupStatus", { count: group.count, condition });
}

export function formatCombatAction(action: CombatActionKind, t: Translator) {
  switch (action) {
    case "attack":
      return t("play.attack");
    case "defend":
      return t("play.defend");
    case "use_item":
      return t("play.useItem");
    case "cast":
      return t("play.sleep");
  }
}

export function formatAptitudes(aptitude: CharacterAptitudes, t: Translator) {
  return (["might", "agility", "spirit", "wit", "luck"] as const)
    .map((key) => `${t(`aptitude.${key}` as Parameters<Translator>[0])} ${aptitude[key]}`)
    .join(" / ");
}
