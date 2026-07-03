import { describe, expect, it } from "vitest";
import { createTranslator, dictionaries, parseLocale } from "../src/i18n";

describe("i18n", () => {
  it("uses a stable default locale", () => {
    expect(parseLocale("ja")).toBe("ja");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("unknown")).toBe("en");
    expect(parseLocale(null)).toBe("en");
  });

  it("translates typed keys", () => {
    expect(createTranslator("en")("party.heading")).toBe("Party Roster");
    expect(createTranslator("ja")("party.heading")).toBe("隊列");
  });

  it("keeps English and Japanese dictionary keys aligned", () => {
    expect(flattenKeys(dictionaries.ja)).toEqual(flattenKeys(dictionaries.en));
  });
});

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") {
    return [prefix];
  }

  return Object.entries(value)
    .flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key))
    .sort();
}
