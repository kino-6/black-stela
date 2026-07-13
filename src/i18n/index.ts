import { en, type Dictionary } from "./en";
import { ja } from "./ja";

export type Locale = "en" | "ja";
export type TranslationKey = DotPath<typeof en>;
export type Translator = (key: TranslationKey, values?: Record<string, string | number>) => string;

export const dictionaries: Record<Locale, Dictionary> = { en, ja };

type DotPath<T> = {
  [Key in keyof T & string]: T[Key] extends string ? Key : `${Key}.${DotPath<T[Key]>}`;
}[keyof T & string];

export function parseLocale(value: string | null | undefined): Locale {
  return value === "ja" || value === "en" ? value : "en";
}

export function createTranslator(locale: Locale): Translator {
  return (key, values = {}) => interpolate(readKey(dictionaries[locale], key), values);
}

/**
 * A translator that lets the SCENARIO overrule the dictionary.
 *
 * AGENTS.md: "Prefer moving dialogue, service copy, room text, item text, and tutorial-like
 * messages into scenario/localization data instead of hardcoding them inside React components."
 * The town's voice is world-flavour — the ash town and the drowned grove should not greet you
 * with the same sentence — so a world can supply any translation key in `world.copy[locale]`,
 * with the same `{variable}` interpolation. Anything it omits falls through to the dictionary,
 * so a world need only say what it wants to say differently.
 */
export function createWorldTranslator(
  locale: Locale,
  copy: Partial<Record<string, Record<string, string>>> | undefined
): Translator {
  const base = createTranslator(locale);
  const overrides = copy?.[locale];
  if (!overrides) {
    return base;
  }

  return (key, values = {}) => {
    const override = overrides[key as string];
    return override === undefined ? base(key, values) : interpolate(override, values);
  };
}

function readKey(dictionary: Dictionary, key: TranslationKey): string {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }

    throw new Error(`Missing translation key: ${key}`);
  }, dictionary) as string;
}

function interpolate(template: string, values: Record<string, string | number>) {
  return template.replaceAll(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
