import { parseLocale, type Locale } from "../i18n";

const LOCALE_KEY = "black-stela:settings:locale";
const AUTO_SAFETY_KEY = "black-stela:settings:auto-battle-safety-stops";

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

function getBrowserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}
