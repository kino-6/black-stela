import { describe, expect, it } from "vitest";
import { asset, catalogIconUrl, cssArtVariables, portraitUrl } from "../src/ui/artAssets";
import { scenarioWorldSchema } from "../src/domain/scenario";

// Locks the pack-scoped, own-basename-first resolver contract (Art.md §2). These
// are build-time-glob facts, so they assert against the bundled default pack.
describe("art resolver", () => {
  it("falls back to the placeholder icon when an id has no own-basename file", () => {
    // equip.warlord-blade has no icons/equip-warlord-blade.png yet, so it resolves
    // via ICON_PLACEHOLDER -> the existing equip-militia-sabre icon. (If real art is
    // later dropped in as equip-warlord-blade.png, own-basename-first will correctly
    // win and this test should be pointed at another still-placeholdered id — that
    // flip IS the drop-in contract working.)
    expect(catalogIconUrl("equip.warlord-blade")).toBe(asset("equip-militia-sabre"));
  });

  it("uses the own-basename file (id dots->dashes) in preference to any placeholder", () => {
    // equip.rusted-dirk HAS icons/equip-rusted-dirk.png, so the resolver returns
    // that own file — not a substituted placeholder. This is the branch that makes
    // a dropped-in real file win the moment it exists (P10/P11 drop-in contract).
    expect(catalogIconUrl("equip.rusted-dirk")).toBe(asset("equip-rusted-dirk"));
    // And an own-basename hit is a genuinely different url from the placeholder a
    // missing file would have fallen back to (equip.short-bow -> equip-rusted-dirk),
    // so own-first is observable, not a coincidence of the two mapping to one file.
    expect(catalogIconUrl("equip.rusted-dirk")).not.toBe(asset("equip-militia-sabre"));
  });

  it("exposes every CSS-referenced art slot (minimap markers, title, combat vignette)", () => {
    const vars = cssArtVariables("default");
    const expected = [
      "--art-marker-return", "--art-marker-stairs", "--art-marker-spinner",
      "--art-marker-teleporter", "--art-marker-hazard", "--art-marker-gather",
      "--art-marker-event", "--art-marker-treasure", "--art-marker-trap",
      "--art-title", "--art-combat-vignette"
    ];
    for (const key of expected) {
      expect(vars[key], `${key} missing`).toMatch(/^url\(".+"\)$/);
    }
  });

  it("falls back to the default pack for an unknown asset pack", () => {
    const unknown = "no-such-pack";
    expect(catalogIconUrl("equip.rusted-dirk", unknown)).toBe(catalogIconUrl("equip.rusted-dirk", "default"));
    expect(portraitUrl("cloak", unknown)).toBe(portraitUrl("cloak", "default"));
    expect(asset("stone-wall", unknown)).toBe(asset("stone-wall", "default"));
    expect(cssArtVariables(unknown)).toEqual(cssArtVariables("default"));
  });
});

describe("ScenarioWorld.assetPack schema", () => {
  const field = scenarioWorldSchema.shape.assetPack;

  it("accepts a pack name and is optional (does not drop or reject)", () => {
    expect(field.safeParse("verdant").success).toBe(true);
    expect(field.safeParse(undefined).success).toBe(true); // optional
  });

  it("rejects a non-string pack", () => {
    expect(field.safeParse(123).success).toBe(false);
    expect(field.safeParse("").success).toBe(false); // min(1)
  });
});
