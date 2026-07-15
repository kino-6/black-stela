import { expect, test } from "@playwright/test";

test.describe("Verdant ladder art", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("uses the pack ascent at the surface landing", async ({ page }) => {
    await page.goto("/?debug=1&world=verdant&progress=floor_1&at=room.verdant.g1f.001&facing=east");
    const canvas = page.getByTestId("dungeon-canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("data-return-visual", "asset");
    await page.screenshot({ path: "docs/evidence/verdant-stair-retake-2026-07-14/ladder-up-1920.png" });
  });

  test("uses the pack descent at the next-floor edge", async ({ page }) => {
    await page.goto("/?debug=1&world=verdant&progress=floor_1&at=room.verdant.g1f.exit&facing=west");
    const canvas = page.getByTestId("dungeon-canvas");
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute("data-front-stair-visual", "asset");
    await expect(canvas).toHaveAttribute("data-front-stair-placement", "floor");
    await page.screenshot({ path: "docs/evidence/verdant-stair-retake-2026-07-14/ladder-down-1920.png" });
  });
});
