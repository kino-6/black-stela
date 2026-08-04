import type { Translator, TranslationKey } from "../i18n";
import type { CombatBeat } from "./types";

// Localize a combat beat for display. The domain stores an English `text` fallback
// plus structured fields; this rebuilds the line in the active language, localizing
// enemy names via the passed resolver (party names are player-entered, shown as-is).
/**
 * The one place a technique id becomes a player-visible name. It was copied into three files (this one,
 * the command menu and the career panel), so adding a technique meant remembering three edits or
 * shipping a raw id on screen; §9.4 made it exported and shared. `Record<TechniqueId, …>` is what forces
 * a new technique to be NAMED before it can ship.
 */
// The BUILT-IN id→i18n-key table. An AUTHORED technique carries its own per-locale name and resolves
// through `localizeTechnique`, so this no longer has to be exhaustive over every id in play.
export const SPELL_LABEL: Record<string, TranslationKey> = {
  heal: "play.spellHeal",
  firebolt: "play.spellFirebolt",
  sleep: "play.spellSleep",
  "power-strike": "play.skillPowerStrike",
  purge: "play.spellPurge",
  "ward-hymn": "play.spellWardHymn",
  "battle-hymn": "play.spellBattleHymn",
  sunder: "play.spellSunder",
  "star-nova": "play.spellStarNova",
  "spore-burst": "play.spellSporeBurst",
  "ash-stance": "play.spellAshStance",
  "sheltering-prayer": "play.spellShelteringPrayer",
  "needle-flurry": "play.spellNeedleFlurry",
  "dust-volley": "play.spellDustVolley",
  "candle-ward": "play.spellCandleWard",
  "thorn-guard": "play.spellThornGuard",
  "bark-field": "play.spellBarkField",
  "dew-cut": "play.spellDewCut",
  "canopy-read": "play.spellCanopyRead",
  "sap-weave": "play.spellSapWeave",
  "lesser-heal": "play.spellLesserHeal",
  "greater-heal": "play.spellGreaterHeal",
  "sanctuary": "play.spellSanctuary",
  "purification": "play.spellPurification",
  "blessing": "play.spellBlessing",
  "ember-chant": "play.spellEmberChant",
  "clarion-hymn": "play.spellClarionHymn",
  "force-lance": "play.spellForceLance",
  "flame-wave": "play.spellFlameWave",
  "conflagration": "play.spellConflagration",
  "immolation": "play.spellImmolation",
  "enfeeble": "play.spellEnfeeble",
  "dread": "play.spellDread",
  "silence-hex": "play.spellSilenceHex",
  "wither": "play.spellWither",
  "life-siphon": "play.spellLifeSiphon",
  "shield-splitter": "play.spellShieldSplitter",
  "war-cry": "play.spellWarCry",
  "sweeping-blow": "play.spellSweepingBlow",
  "second-wind": "play.spellSecondWind",
  "executioner": "play.spellExecutioner",
  "bulwark-blow": "play.spellBulwarkBlow",
  "shield-wall": "play.spellShieldWall",
  "cover": "play.spellCover",
  "challenge": "play.spellChallenge",
  "iron-oath": "play.spellIronOath",
  "unbroken": "play.spellUnbroken",
  "precise-thrust": "play.spellPreciseThrust",
  "flowing-stance": "play.spellFlowingStance",
  "riposte": "play.spellRiposte",
  "crescent-cut": "play.spellCrescentCut",
  "still-water": "play.spellStillWater",
  "finishing-cut": "play.spellFinishingCut",
  "hamstring": "play.spellHamstring",
  "smoke-veil": "play.spellSmokeVeil",
  "shadow-step": "play.spellShadowStep",
  "blinding-dust": "play.spellBlindingDust",
  "backstab": "play.spellBackstab"
};

// Past-tense attack verbs, mirrored with the Godot combat log (combat.gd `_attack_verb`): a member's
// blow is narrated in past tense — then its damage lands as "…に N ダメージ！" (the number also pops on
// the creature). Stable per actor (a hash of the name) so an adventurer always swings the same way — it
// reads as their style, not random — with a distinct line for a crit. Presentation only; the numbers
// come from the beat and the parity oracle ignores beat text, so this need not byte-match the engine —
// only the wording/structure, so a future refactor keeps one shared shape across both engines.
const ATTACK_VERB_KEYS: TranslationKey[] = ["beat.verbSlash", "beat.verbCut", "beat.verbCharge", "beat.verbStrike"];
function attackVerbKey(actor: string, crit: boolean): TranslationKey {
  if (crit) return "beat.verbCrit";
  if (!actor) return "beat.verbGeneric";
  let h = 0;
  for (let i = 0; i < actor.length; i += 1) h = (h * 31 + actor.charCodeAt(i)) | 0;
  return ATTACK_VERB_KEYS[Math.abs(h) % ATTACK_VERB_KEYS.length];
}

const STATUS_LABEL: Record<string, TranslationKey> = {
  sleep: "beat.statusSleep",
  poison: "beat.statusPoison",
  silence: "beat.statusSilence",
  fear: "beat.statusFear"
};

/** The built-in display name for a technique id: its i18n name, or the raw id when it is not a built-in
 *  (an AUTHORED technique resolves through localizeTechnique instead). Never throws on an unknown id —
 *  the failure mode the old exhaustive Record could not have. */
export function techniqueLabel(id: string, t: Translator): string {
  const key = SPELL_LABEL[id];
  return key ? t(key) : id;
}

export function formatCombatBeat(
  beat: CombatBeat,
  t: Translator,
  localizeEnemy: (enemyId: string) => string,
  localizeAbility?: (enemyId: string | undefined, rawName: string) => string,
  localizeTechnique?: (id: string) => string
): string {
  const actor = beat.actorName ?? (beat.actorEnemyId ? localizeEnemy(beat.actorEnemyId) : "");
  const target = beat.targetName ?? (beat.targetEnemyId ? localizeEnemy(beat.targetEnemyId) : "");
  const ability = beat.spellId
    ? localizeTechnique?.(beat.spellId) ?? techniqueLabel(beat.spellId, t)
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
      return t("beat.hit", { actor, target, damage, verb: t(attackVerbKey(actor, !!beat.crit)) });
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
