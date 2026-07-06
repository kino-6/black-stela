import { test, expect } from "@playwright/test";

/**
 * Lane Z slice D-3 (darkness gimmick): a dark-zone room snuffs out the automap.
 * B4F "Unlit Square" carries the dark_zone gate.
 */
test("dark zone obscures the minimap", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_4");
  // b4f.001 (spinner hub) -> south -> b4f.003 (Unlit Square, dark zone)
  await page.getByRole("button", { name: "Turn right" }).click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByTestId("map-current")).toContainText("Unlit Square");
  await expect(page.getByTestId("minimap-dark")).toBeVisible();
});
