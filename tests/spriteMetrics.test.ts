import { describe, expect, it } from "vitest";
import { measureFromPixels } from "../src/ui/spriteMetrics";

// Build an RGBA buffer whose opaque pixels form one known rectangle — the "creature" —
// inside an otherwise transparent canvas.
function pixelsWith(w: number, h: number, box: { left: number; top: number; width: number; height: number }) {
  const data = new Uint8ClampedArray(w * h * 4); // all zero = fully transparent
  for (let y = box.top; y < box.top + box.height; y += 1) {
    for (let x = box.left; x < box.left + box.width; x += 1) {
      data[(y * w + x) * 4 + 3] = 255;
    }
  }
  return data;
}

// The renderer plants creatures on the floor and scales them to a world size using ONLY
// these numbers. Get them wrong and every enemy floats at the wrong size — which is exactly
// the bug this replaced: one hand-tuned anchor constant (center.y = 0.38) applied to every
// sprite, so the padding in each image file decided where the creature stood.
describe("sprite silhouette metrics", () => {
  it("finds the creature inside a padded canvas — feet, height, width, and its own centre", () => {
    // 100x100 canvas; the creature is 40 wide and 50 tall, standing 10px above the bottom
    // edge and pushed right of the canvas centre.
    const m = measureFromPixels(pixelsWith(100, 100, { left: 40, top: 40, width: 40, height: 50 }), 100, 100);
    expect(m.bottomFrac).toBeCloseTo(0.1, 2); // 10px of empty canvas under its feet
    expect(m.heightFrac).toBeCloseTo(0.5, 2); // it is HALF the canvas, not all of it
    expect(m.widthFrac).toBeCloseTo(0.4, 2);
    expect(m.centerXFrac).toBeCloseTo(0.6, 2); // the SUBJECT's centre, not the canvas's
  });

  it("reports a frame-filling creature as filling the frame", () => {
    const m = measureFromPixels(pixelsWith(60, 60, { left: 0, top: 0, width: 60, height: 60 }), 60, 60);
    expect(m.bottomFrac).toBeCloseTo(0, 2);
    expect(m.heightFrac).toBeCloseTo(1, 2);
    expect(m.widthFrac).toBeCloseTo(1, 2);
    expect(m.centerXFrac).toBeCloseTo(0.5, 2);
  });

  it("keeps the image aspect, so the sprite plane never skews the art", () => {
    const m = measureFromPixels(pixelsWith(768, 512, { left: 0, top: 0, width: 768, height: 512 }), 768, 512);
    expect(m.imageAspect).toBeCloseTo(1.5, 2); // today's 3:2 art
    const square = measureFromPixels(pixelsWith(768, 768, { left: 0, top: 0, width: 768, height: 768 }), 768, 768);
    expect(square.imageAspect).toBeCloseTo(1, 2); // the reframed art, once it lands
  });

  it("scales the CREATURE to its world height, not the canvas", () => {
    // This is the whole point, expressed as the renderer uses it: a creature occupying half
    // its canvas must be drawn on a plane twice its world height, so the creature itself
    // ends up exactly `worldHeight` tall.
    const m = measureFromPixels(pixelsWith(100, 100, { left: 30, top: 50, width: 40, height: 50 }), 100, 100);
    const worldHeight = 2.4;
    const planeHeight = worldHeight / m.heightFrac;
    expect(planeHeight).toBeCloseTo(4.8, 2);
    expect(planeHeight * m.heightFrac).toBeCloseTo(worldHeight, 5);
  });

  it("survives a fully transparent image rather than reporting a bogus box", () => {
    const m = measureFromPixels(new Uint8ClampedArray(40 * 40 * 4), 40, 40);
    expect(m.heightFrac).toBe(1);
    expect(m.bottomFrac).toBe(0);
  });

  it("ignores the near-transparent halo the chroma-key leaves behind", () => {
    const data = pixelsWith(50, 50, { left: 20, top: 20, width: 10, height: 10 });
    data[(5 * 50 + 5) * 4 + 3] = 12; // a stray faint pixel far from the creature
    const m = measureFromPixels(data, 50, 50);
    expect(m.heightFrac).toBeCloseTo(0.2, 2); // still just the 10px creature
  });
});
