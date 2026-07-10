import { test, expect } from "@playwright/test";

/**
 * The dungeon camp overlay (CampPanel): between fights the party can re-order rows
 * and heal. Guards the extracted panel — it must open from the dock, show the
 * party, and close on Escape.
 */
test("camp overlay opens from the dock, shows the party, and closes on Escape", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_2");

  await page.getByTestId("camp-open").click();
  const camp = page.getByTestId("camp-panel");
  await expect(camp).toBeVisible();
  await expect(camp).toContainText("HP");

  // Escape closes the overlay (shared overlay-close handler).
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("camp-panel")).toHaveCount(0);
});
