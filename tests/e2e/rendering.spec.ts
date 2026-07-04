import { expect, test } from "@playwright/test";
import { registerAdventurer, startNewExpedition } from "./helpers";

async function enterDungeon(page: import("@playwright/test").Page) {
  await startNewExpedition(page);
  await registerAdventurer(page, { name: "Vale" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`renders a nonblank dungeon canvas on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await enterDungeon(page);

    const canvas = page.getByTestId("dungeon-canvas").locator("canvas");
    await expect(canvas).toBeVisible();
    await expect(page.getByLabel("Visible dungeon features")).toHaveCount(0);

    const screenshot = await canvas.screenshot();
    expect(screenshot.byteLength).toBeGreaterThan(1_000);

    const pixels = await canvas.evaluate((element) => {
      const webglCanvas = element as HTMLCanvasElement;
      const gl = webglCanvas.getContext("webgl2") ?? webglCanvas.getContext("webgl");
      if (!gl) {
        return null;
      }

      const samplePoints = [
        [0.25, 0.25],
        [0.5, 0.35],
        [0.75, 0.25],
        [0.35, 0.65],
        [0.5, 0.5],
        [0.65, 0.65]
      ];

      return samplePoints.map(([x, y]) => {
        const data = new Uint8Array(4);
        gl.readPixels(
          Math.floor(gl.drawingBufferWidth * x),
          Math.floor(gl.drawingBufferHeight * y),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          data
        );
        return Array.from(data);
      });
    });

    expect(pixels).not.toBeNull();
    expect(pixels!.flatMap((pixel) => pixel.slice(0, 3)).some((channel) => channel > 8)).toBe(true);

    await page.getByRole("button", { name: "Move" }).click();
    await expect(page.getByLabel("Battle screen")).toBeVisible();
    await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
    await expect(page.getByText("Ash Slime blocks the passage.")).toHaveCount(0);
    await expect(page.getByLabel("Visible dungeon features")).toHaveCount(0);
  });
}
