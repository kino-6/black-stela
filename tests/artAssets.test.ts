import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { asset, catalogIconUrl, cssArtVariables, ICON_PLACEHOLDER, portraitUrl } from "../src/ui/artAssets";
import { scenarioWorldSchema } from "../src/domain/scenario";

const verdantEnemies = [
  "enemy-verdant-g1-moss-mite",
  "enemy-verdant-g1-spore-gnat",
  "enemy-verdant-g2-thorn-crawler",
  "enemy-verdant-g7-husk-spawn",
  "enemy-verdant-g2-spore-caster",
  "enemy-verdant-g4-pollen-drifter",
  "enemy-verdant-g6-thorn-cutter",
  "enemy-verdant-g2-bramble-shield",
  "enemy-verdant-g3-bloom-warden",
  "enemy-verdant-g4-bark-ward",
  "enemy-verdant-g5-sap-keeper",
  "enemy-verdant-g6-strangler-warden",
  "enemy-verdant-g7-heartwood-husk",
  "enemy-verdant-g8-rootheart"
] as const;

const verdantIcons = [
  "item-verdant-sap-draught",
  "item-verdant-pollen-salve",
  "item-verdant-homing-spore",
  "item-verdant-greater-sap",
  "item-verdant-heartseed",
  "equip-verdant-thorn-lash",
  "equip-verdant-bark-plate",
  "equip-verdant-living-charm"
] as const;

const defaultEnemies = [
  "ash-slime",
  "dust-crawler",
  "hook-rat",
  "bitter-mote",
  "lantern-ward",
  "oath-cutter",
  "vault-husk",
  "cistern-warden",
  "cinder-keeper",
  "oath-warden",
  "ash-votary"
] as const;

function pngSize(path: URL): { width: number; height: number } {
  const png = readFileSync(path);
  expect(png.subarray(1, 4).toString("ascii"), `${path.pathname} is not PNG`).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

function jpegSize(path: URL): { width: number; height: number } {
  const jpeg = readFileSync(path);
  expect(jpeg.readUInt16BE(0), `${path.pathname} is not JPEG`).toBe(0xffd8);

  for (let offset = 2; offset < jpeg.length - 9;) {
    if (jpeg[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = jpeg[offset + 1];
    const length = jpeg.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { width: jpeg.readUInt16BE(offset + 7), height: jpeg.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }

  throw new Error(`${path.pathname} has no supported JPEG size marker`);
}

// Locks the pack-scoped, own-basename-first resolver contract (docs/art/common.md). These
// are build-time-glob facts, so they assert against the bundled default pack.
describe("art resolver", () => {
  it("resolves every placeholder id to real art — own-basename if delivered, else the placeholder", () => {
    // Durable against ongoing drop-ins: for each ICON_PLACEHOLDER entry, if the real
    // own-basename art has been dropped in it must win (the drop-in contract); until
    // then the mapped placeholder icon is used. Never undefined either way. (As of
    // now all P10/P11 art has landed, so every id takes the own-basename branch.)
    for (const [id, target] of Object.entries(ICON_PLACEHOLDER)) {
      const ownBasename = id.replace(/\./g, "-");
      let ownExists = true;
      try {
        asset(ownBasename);
      } catch {
        ownExists = false;
      }
      const expected = ownExists ? asset(ownBasename) : asset(target);
      expect(catalogIconUrl(id), `${id} -> ${ownExists ? "own art" : target}`).toBe(expected);
    }
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

  it("ships every required Verdant enemy and icon under its own basename", () => {
    for (const name of verdantEnemies) {
      expect(asset(name, "verdant"), name).not.toBe(asset("ash-slime", "default"));
      expect(pngSize(new URL(`../content/worlds/verdant/assets/dungeon/${name}.png`, import.meta.url))).toEqual({
        width: 768,
        height: 768
      });
    }

    for (const name of verdantIcons) {
      expect(pngSize(new URL(`../content/worlds/verdant/assets/icons/${name}.png`, import.meta.url))).toEqual({
        width: 256,
        height: 256
      });
    }
  });

  it("keeps every Verdant block texture at the authored resolution", () => {
    for (const surface of ["wall", "floor"] as const) {
      for (const block of [1, 2, 3] as const) {
        expect(
          jpegSize(new URL(`../content/worlds/verdant/assets/dungeon/stone-${surface}-block${block}.jpg`, import.meta.url))
        ).toEqual({ width: 1024, height: 1024 });
      }
    }
  });

  it("keeps Default enemy and hurt sprites on the P14 square canvas", () => {
    for (const name of defaultEnemies) {
      for (const suffix of ["", "-hurt"]) {
        expect(pngSize(new URL(`../content/worlds/default/assets/dungeon/${name}${suffix}.png`, import.meta.url))).toEqual({
          width: 768,
          height: 768
        });
      }
    }
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
