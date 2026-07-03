import { parseLocale, type Locale } from "../i18n";

const LOCALE_KEY = "black-stela:settings:locale";

export function loadLocale(storage: Storage | null = getBrowserStorage()): Locale {
  return parseLocale(storage?.getItem(LOCALE_KEY));
}

export function saveLocale(locale: Locale, storage: Storage | null = getBrowserStorage()): void {
  storage?.setItem(LOCALE_KEY, locale);
}

function getBrowserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}
