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
