import { parseLocale, type Locale } from "../i18n";

const LOCALE_KEY = "black-stela:settings:locale";
const AUTO_SAFETY_KEY = "black-stela:settings:auto-battle-safety-stops";
const INSTANT_LOG_KEY = "black-stela:settings:instant-combat-log";
const CONFIRM_ROUND_KEY = "black-stela:settings:confirm-round";

export function loadLocale(storage: Storage | null = getBrowserStorage()): Locale {
  return parseLocale(storage?.getItem(LOCALE_KEY));
}

export function saveLocale(locale: Locale, storage: Storage | null = getBrowserStorage()): void {
  storage?.setItem(LOCALE_KEY, locale);
}

// Auto-battle safety stops (hand control back at boss / danger). Default OFF.
export function loadAutoBattleSafety(storage: Storage | null = getBrowserStorage()): boolean {
  return storage?.getItem(AUTO_SAFETY_KEY) === "on";
}

export function saveAutoBattleSafety(enabled: boolean, storage: Storage | null = getBrowserStorage()): void {
  storage?.setItem(AUTO_SAFETY_KEY, enabled ? "on" : "off");
}

// Reveal the combat log blow-by-blow (default) or all at once. Default OFF = paced
// reveal, so the fight reads with weight and 数字感 instead of collapsing to one line.
export function loadInstantCombatLog(storage: Storage | null = getBrowserStorage()): boolean {
  return storage?.getItem(INSTANT_LOG_KEY) === "on";
}

export function saveInstantCombatLog(enabled: boolean, storage: Storage | null = getBrowserStorage()): void {
  storage?.setItem(INSTANT_LOG_KEY, enabled ? "on" : "off");
}

// Require a confirm step after all orders are set, before the round resolves.
// Default ON — you bothered to enter commands, so confirm is the sensible default.
export function loadConfirmRound(storage: Storage | null = getBrowserStorage()): boolean {
  return storage?.getItem(CONFIRM_ROUND_KEY) !== "off";
}

export function saveConfirmRound(enabled: boolean, storage: Storage | null = getBrowserStorage()): void {
  storage?.setItem(CONFIRM_ROUND_KEY, enabled ? "on" : "off");
}

function getBrowserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}
