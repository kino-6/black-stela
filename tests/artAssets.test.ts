import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  asset,
  catalogIconUrl,
  cssArtVariables,
  getEnemySpriteTextureUrl,
  hasEnemySpriteTexture,
  ICON_PLACEHOLDER,
  portraitUrl
} from "../src/ui/artAssets";
import { worldRegistry } from "../src/data/worldRegistry";
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
  "enemy-verdant-g8-rootheart",
  "enemy-verdant-rare-gilded-sporecloud"
] as const;

const verdantIcons = [
  "item-verdant-sap-draught",
  "item-verdant-pollen-salve",
  "item-verdant-homing-spore",
  "item-verdant-greater-sap",
  "item-verdant-heartseed",
  "equip-verdant-thorn-lash",
  "equip-verdant-bark-plate",
  "equip-verdant-living-charm",
  "equip-verdant-heartwood-ward",
  "item-verdant-heartsap-tonic",
  "item-verdant-rootgrowth-seed",
  "equip-verdant-iron-edge",
  "equip-verdant-reaver-axe"
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

const defaultOwnBasenameEnemies = [
  "enemy-b2f-ash-warden",
  "enemy-b2f-ash-caller",
  "enemy-rare-ashsilver-glimmer"
] as const;

const completedEnemyCoverage = [
  { pack: "default", id: "enemy.b2f.ash-warden", basename: "enemy-b2f-ash-warden" },
  { pack: "default", id: "enemy.b2f.ash-caller", basename: "enemy-b2f-ash-caller" },
  { pack: "default", id: "enemy.rare.ashsilver-glimmer", basename: "enemy-rare-ashsilver-glimmer" },
  {
    pack: "verdant",
    id: "enemy.verdant.rare.gilded-sporecloud",
    basename: "enemy-verdant-rare-gilded-sporecloud"
  }
] as const;

const portraitKeys = [
  "gate", "ruin", "vial", "coin", "map", "ward",
  "road", "pit", "ink", "grave", "dock", "cloak"
] as const;

const supportNpcs = [
  "npc-appraiser",
  "npc-smith",
  "npc-archivist",
  "npc-vocation-master",
  "npc-quest-broker"
] as const;

const supportDungeonObjects = [
  "treasure-chest-closed",
  "treasure-chest-open",
  "rest-point",
  "gather-cache",
  "teleporter-floor",
  "spinner-floor",
  "secret-door-revealed"
] as const;

const defaultSupportIcons = [
  "item-ashroot-tonic",
  "item-whetstone-rite",
  "item-emberwit-ash",
  "item-deed-of-passage",
  "equip-ember-brand",
  "equip-salt-etched-blade",
  "equip-starlit-needle",
  "equip-cinder-warded-jack"
] as const;

const facilityBackgrounds = [
  "market-workshop",
  "infirmary",
  "archive-lodge",
  "dungeon-entrance"
] as const;

const adventurerClasses = [
  "vanguard",
  "sellsword",
  "bulwark",
  "duelist",
  "seeker",
  "scout",
  "cutpurse",
  "mender",
  "chanter",
  "occultist",
  "arcanist",
  "wayfinder"
] as const;

const adventurerSpecies = ["human", "sylvan", "beastkin"] as const;
const adventurerGenders = ["male", "female"] as const;
const adventurerPoses = ["base", "attack"] as const;

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

  it("resolves the completed enemy-coverage sprites instead of fallback art", () => {
    for (const { pack, id, basename } of completedEnemyCoverage) {
      expect(hasEnemySpriteTexture(id, pack), id).toBe(true);
      expect(getEnemySpriteTextureUrl(id, pack), id).toBe(asset(basename, pack));
    }
  });

  it("keeps every authored enemy in every built-in world on a declared sprite path", () => {
    for (const [pack, world] of Object.entries(worldRegistry)) {
      for (const enemy of world.enemies) {
        expect(hasEnemySpriteTexture(enemy.id, pack), `${pack}: ${enemy.id}`).toBe(true);
      }
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

  it("ships twelve distinct 512px Verdant portraits under the shared basenames", () => {
    const hashes = portraitKeys.map((name) => {
      const path = new URL(`../content/worlds/verdant/assets/portraits/${name}.png`, import.meta.url);
      expect(pngSize(path), name).toEqual({ width: 512, height: 512 });
      return createHash("sha256").update(readFileSync(path)).digest("hex");
    });

    expect(new Set(hashes).size).toBe(portraitKeys.length);
  });

  it("keeps Default enemy and hurt sprites on the P14 square canvas", () => {
    for (const name of [...defaultEnemies, ...defaultOwnBasenameEnemies]) {
      for (const suffix of ["", "-hurt"]) {
        expect(pngSize(new URL(`../content/worlds/default/assets/dungeon/${name}${suffix}.png`, import.meta.url))).toEqual({
          width: 768,
          height: 768
        });
      }
    }
  });

  it("ships every P18 support asset at its authored size with distinct RGBA data", () => {
    const paths = [
      ...supportNpcs.map((name) => new URL(`../content/worlds/default/assets/characters/${name}.png`, import.meta.url)),
      ...supportDungeonObjects.map((name) => new URL(`../content/worlds/default/assets/dungeon/${name}.png`, import.meta.url)),
      ...defaultSupportIcons.map((name) => new URL(`../content/worlds/default/assets/icons/${name}.png`, import.meta.url)),
      ...verdantIcons.slice(-4).map((name) => new URL(`../content/worlds/verdant/assets/icons/${name}.png`, import.meta.url))
    ];
    const hashes: string[] = [];

    for (const path of paths) {
      const png = readFileSync(path);
      const expected = path.pathname.includes("/characters/")
        ? { width: 1024, height: 1536 }
        : path.pathname.includes("/icons/")
          ? { width: 256, height: 256 }
          : { width: 768, height: 768 };

      expect(pngSize(path), path.pathname).toEqual(expected);
      expect(png[25], `${path.pathname} must use PNG color type 6 (RGBA)`).toBe(6);
      hashes.push(createHash("sha256").update(png).digest("hex"));
    }

    expect(paths).toHaveLength(24);
    expect(new Set(hashes).size).toBe(paths.length);
  });

  it("resolves every newly supplied catalog icon by its own basename", () => {
    const entries = [
      ...defaultSupportIcons.map((basename) => ({
        basename,
        id: basename.replace("-", "."),
        pack: "default"
      })),
      ...verdantIcons.slice(-4).map((basename) => ({
        basename,
        id: basename.replace(/^([^-]+)-verdant-/, "$1.verdant."),
        pack: "verdant"
      }))
    ];

    for (const { basename, id, pack } of entries) {
      expect(catalogIconUrl(id, pack), `${pack}:${id}`).toBe(asset(basename, pack));
    }
  });

  it("ships distinct lossless P19 facility backgrounds for both worlds", () => {
    const hashes: string[] = [];

    for (const pack of ["default", "verdant"] as const) {
      for (const name of facilityBackgrounds) {
        const path = new URL(`../content/worlds/${pack}/assets/ui/${name}.png`, import.meta.url);
        const png = readFileSync(path);

        expect(pngSize(path), `${pack}:${name}`).toEqual({ width: 1600, height: 900 });
        expect(png[25], `${pack}:${name} must be an opaque RGB PNG`).toBe(2);
        expect(asset(name, pack), `${pack}:${name}`).toBeDefined();
        hashes.push(createHash("sha256").update(png).digest("hex"));
      }
    }

    expect(hashes).toHaveLength(8);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe("adventurer source-art contract", () => {
  it("ships every class, species, gender, and pose as a distinct 1024x1536 RGBA master", () => {
    const hashes: string[] = [];

    for (const characterClass of adventurerClasses) {
      for (const species of adventurerSpecies) {
        for (const gender of adventurerGenders) {
          for (const pose of adventurerPoses) {
            const path = new URL(
              `../content/worlds/default/source-art/adventurers/adventurer-${characterClass}-${species}-${gender}-${pose}.png`,
              import.meta.url
            );
            const png = readFileSync(path);

            expect(pngSize(path), path.pathname).toEqual({ width: 1024, height: 1536 });
            expect(png[25], `${path.pathname} must use PNG color type 6 (RGBA)`).toBe(6);
            hashes.push(createHash("sha256").update(png).digest("hex"));
          }
        }
      }
    }

    expect(hashes).toHaveLength(144);
    expect(new Set(hashes).size).toBe(144);
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
