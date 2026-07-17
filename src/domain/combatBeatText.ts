import type { Translator, TranslationKey } from "../i18n";
import type { CombatBeat } from "./types";

// Localize a combat beat for display. The domain stores an English `text` fallback
// plus structured fields; this rebuilds the line in the active language, localizing
// enemy names via the passed resolver (party names are player-entered, shown as-is).
const SPELL_LABEL: Record<NonNullable<CombatBeat["spellId"]>, TranslationKey> = {
  heal: "play.spellHeal",
  firebolt: "play.spellFirebolt",
  sleep: "play.spellSleep",
  "power-strike": "play.skillPowerStrike"
};

const STATUS_LABEL: Record<string, TranslationKey> = {
  sleep: "beat.statusSleep",
  poison: "beat.statusPoison",
  silence: "beat.statusSilence",
  fear: "beat.statusFear"
};

export function formatCombatBeat(
  beat: CombatBeat,
  t: Translator,
  localizeEnemy: (enemyId: string) => string,
  localizeAbility?: (enemyId: string | undefined, rawName: string) => string
): string {
  const actor = beat.actorName ?? (beat.actorEnemyId ? localizeEnemy(beat.actorEnemyId) : "");
  const target = beat.targetName ?? (beat.targetEnemyId ? localizeEnemy(beat.targetEnemyId) : "");
  const ability = beat.spellId
    ? t(SPELL_LABEL[beat.spellId])
    : beat.abilityName
      ? localizeAbility?.(beat.actorEnemyId, beat.abilityName) ?? beat.abilityName
      : "";
  const statusKey = beat.statusName ? STATUS_LABEL[beat.statusName] : undefined;
  const status = statusKey ? t(statusKey) : beat.statusName ?? "";
  const damage = beat.damage ?? 0;

  switch (beat.kind) {
    case "hit":
      if (beat.spellId) {
        return t("beat.skill", { actor, ability, target, damage }) + (beat.weak ? t("beat.weak") : "");
      }
      return beat.crit ? t("beat.crit", { actor, target, damage }) : t("beat.hit", { actor, target, damage });
    case "cast":
      if (beat.damage != null) {
        return t("beat.skill", { actor, ability, target, damage }) + (beat.weak ? t("beat.weak") : "");
      }
      if (beat.statusName) {
        return t("beat.castStatus", { actor, ability, target, status });
      }
      return t("beat.cast", { actor, ability, target });
    case "heal":
      return t("beat.heal", { actor, target });
    case "defend":
      return t("beat.defend", { actor });
    case "miss":
      return t("beat.miss", { actor });
    case "enemyHit":
      return beat.abilityName
        ? t("beat.enemyAbility", { actor, ability, target, damage })
        : t("beat.enemyHit", { actor, target, damage });
    case "status":
      // A named enemy ability reads richer than a bare affliction: name the spell that landed
      // (or was shrugged off). An unnamed on-hit rider (inflicts) keeps the terse afflict line.
      if (beat.abilityName && status) {
        return t("beat.castStatus", { actor, ability, target, status });
      }
      if (beat.abilityName) {
        return t("beat.resistStatus", { actor, ability, target });
      }
      return status ? t("beat.afflict", { target, status }) : beat.text;
    case "poison":
      return t("beat.poison", { target, damage });
    case "asleep":
      return t("beat.asleep", { actor: actor || target });
    default:
      return beat.text;
  }
}
