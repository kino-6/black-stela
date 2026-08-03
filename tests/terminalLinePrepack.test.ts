import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "content/worlds/cordon");
const dungeon = resolve(root, "assets/dungeon");

const enemies = [
  "enemy-tl1f-drain-rat",
  "enemy-tl1f-baton-unit",
  "enemy-tl1f-breath-collector",
  "enemy-tl1f-unmanned-stationmaster",
  "enemy-tl2f-cable-hound",
  "enemy-tl2f-rain-reclaimer"
];

const icons = [
  "item-tl-universal-round",
  "item-tl-field-dressing",
  "item-tl-terminal-fuse",
  "item-tl-transit-key-fragment",
  "equip-tl-service-pistol",
  "equip-tl-crowbar",
  "equip-tl-rain-jacket"
];

function pngInfo(path: string) {
  const png = readFileSync(path);
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    // PNG colour type 6 is RGBA. These combat sprites must not silently lose alpha.
    colorType: png[25]
  };
}

describe("Terminal Line pre-canonical art batch", () => {
  it("remains outside the runtime registry until accepted scenario data arrives", () => {
    expect(existsSync(resolve(root, "world.md"))).toBe(false);
  });

  it("delivers every W0 F1/F2 enemy as a 768-square RGBA base/hurt pair", () => {
    for (const basename of enemies) {
      for (const suffix of ["", "-hurt"]) {
        const info = pngInfo(resolve(dungeon, `${basename}${suffix}.png`));
        expect(info).toEqual({ width: 768, height: 768, colorType: 6 });
      }
    }
  });

  it("delivers every W0 F1/F2 item and equipment icon as 256-square RGBA", () => {
    for (const basename of icons) {
      expect(pngInfo(resolve(root, "assets/icons", `${basename}.png`))).toEqual({ width: 256, height: 256, colorType: 6 });
    }
  });

  it("keeps the shared stills and sealed-door ready for promotion", () => {
    for (const relative of [
      "assets/dungeon/sealed-door.jpg",
      "assets/dungeon/supply-locker.png",
      "assets/dungeon/maintenance-terminal.png",
      "assets/ui/town-hub.jpg",
      "assets/ui/dungeon-entrance.png",
      "assets/ui/combat-vignette.jpg"
    ]) {
      expect(existsSync(resolve(root, relative))).toBe(true);
    }
  });
});
