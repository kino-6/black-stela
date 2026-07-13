import { describe, expect, it } from "vitest";
import { createTranslator, createWorldTranslator } from "../src/i18n";
import { worldRegistry } from "../src/data/worldRegistry";

// Player-facing copy belongs to the SCENARIO, not to a React component or a shared dictionary.
// AGENTS.md: "Prefer moving dialogue, service copy, room text, item text, and tutorial-like
// messages into scenario/localization data instead of hardcoding them inside React components."
// The ash town and a drowned grove have no business greeting the player with the same sentence.
describe("world-owned copy", () => {
  it("lets a world overrule the dictionary in its own voice", () => {
    const dictionary = createTranslator("ja");
    const verdant = createWorldTranslator("ja", worldRegistry.verdant.copy);
    expect(verdant("town.departureHeading")).not.toBe(dictionary("town.departureHeading"));
    expect(verdant("town.departureHeading")).toBe("梢が閉じる前に");
  });

  it("falls through to the dictionary for anything the world does not say itself", () => {
    const dictionary = createTranslator("ja");
    const verdant = createWorldTranslator("ja", worldRegistry.verdant.copy);
    // Verdant overrides the town's greeting, not its service names — so a world only has to
    // author what it wants to say differently.
    expect(verdant("town.guild")).toBe(dictionary("town.guild"));
  });

  it("a world that says nothing keeps the dictionary's voice exactly", () => {
    const dictionary = createTranslator("en");
    const ash = createWorldTranslator("en", worldRegistry.default.copy);
    for (const key of ["town.statusHeading", "town.departureHeading", "town.guild"] as const) {
      expect(ash(key)).toBe(dictionary(key));
    }
  });

  it("interpolates variables in world copy, exactly as the dictionary does", () => {
    const world = createWorldTranslator("en", { en: { "town.partyReady": "{count} souls, roped and ready." } });
    expect(world("town.partyReady", { count: 6 })).toBe("6 souls, roped and ready.");
  });

  it("does not apply another locale's overrides", () => {
    const dictionary = createTranslator("en");
    // Verdant authors both en and ja; asking for a locale it never wrote must not fall over.
    const unknown = createWorldTranslator("en", { ja: { "town.statusHeading": "光の下へ戻って" } });
    expect(unknown("town.statusHeading")).toBe(dictionary("town.statusHeading"));
  });
});
