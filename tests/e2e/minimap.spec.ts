import { expect, test } from "@playwright/test";

// Regression guard for the "warp cell isn't registered on the map" report:
// stepping onto a teleporter (which warps the party away the same instant) must
// still register the warp cell in the discovered map, drawn with its teleporter
// marker. In the maze the teleporter sends the party far off, so the honest check
// is the whole-floor map, not the local (windowed) minimap centered on the player.
test("stepping onto a warp registers the warp cell on the discovered map", async ({ page }) => {
  // Seed the party one cell east of B4F's One-Way Walk teleporter (room.b4f.002),
  // facing west toward it; stepping on warps them back to 001 "Lanterns Facing
  // Inward". (Seeded on the approach cell so the maze layout can't drift the test.)
  await page.goto("/?debug=1&progress=floor_4&at=room.b4f.c16_11&facing=west");
  await expect(page.getByTestId("minimap")).toBeVisible();

  // Step west onto the teleporter — it wrenches the party back to the entrance.
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("map-current")).toContainText("Lanterns Facing Inward");

  // The teleporter cell is now discovered and drawn with its teleporter marker,
  // even though the party was warped off it the instant they stepped on.
  await page.getByTestId("full-map-open").click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(page.locator(".floor-map-grid .marker-teleporter")).toBeVisible();
});

test("the full-floor map view opens over the whole explored floor and closes", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_4&at=room.b4f.c16_11&facing=west");
  await expect(page.getByTestId("minimap")).toBeVisible();
  await page.keyboard.press("ArrowUp"); // step onto the teleporter, warping back to 001
  await expect(page.getByTestId("map-current")).toContainText("Lanterns Facing Inward");

  // Open the whole-floor map from the dock; it shows the explored cells at once.
  await page.getByTestId("full-map-open").click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(page.getByTestId("floor-map-current")).toBeVisible();
  expect(await page.locator(".floor-map-grid .mini-map-cell:not(.empty)").count()).toBeGreaterThanOrEqual(2);

  // The M key toggles it closed.
  await page.keyboard.press("m");
  await expect(page.getByTestId("floor-map")).toHaveCount(0);
});
