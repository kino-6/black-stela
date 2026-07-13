import { expect, test } from "@playwright/test";

// Debug mode used to be hard-wired to the default world — Verdant could not be debugged
// at all. ?debug=1&world=<id> now boots the debug state IN that scenario.
test("debug mode boots into the verdant scenario", async ({ page }) => {
  await page.goto("/?debug=1&world=verdant&progress=floor_3");
  // Verdant's OWN third floor (G3F - Pollen Cistern), landing in its own room — not the
  // default world's B3F.
  await expect(page.getByText("G3F - Pollen Cistern").first()).toBeVisible();
  await expect(page.locator("#location-heading")).toHaveText("Root Landing");
  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();
  await expect(page.getByText("Cistern Teeth")).toHaveCount(0);
});

test("debug mode still boots the default world without ?world", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3");
  await expect(page.getByTestId("map-current")).toContainText("Cistern");
});

test("the debug panel can switch scenario in place", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_2");
  await page.getByTestId("debug-panel-toggle").click();
  await page.getByTestId("debug-scenario").selectOption("verdant");
  // The debug state is rebuilt inside verdant, at ITS second floor.
  await expect(page.getByText("G2F - Spore Drift").first()).toBeVisible();
  await expect(page.locator("#location-heading")).toHaveText("Root Landing");
});
