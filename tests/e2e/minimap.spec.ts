import { expect, test } from "@playwright/test";

// Regression guard for the "warp cell isn't registered on the minimap" report:
// stepping onto a teleporter (which warps the party away) must still register
// the warp cell in the discovered map and draw it on the minimap.
test("stepping onto a warp registers the warp cell on the minimap", async ({ page }) => {
  // Debug floor_4 starts on B4F's spinner cell (room.b4f.001), facing east; the
  // One-Way Walk teleporter (room.b4f.002) sits one step east and warps back.
  await page.goto("/?debug=1&progress=floor_4");
  await expect(page.getByTestId("minimap")).toBeVisible();

  const drawnCells = page.locator('.mini-map-cell.current, .mini-map-cell.visited');
  const before = await drawnCells.count();

  // Step east onto the teleporter — it wrenches the party back to the spinner.
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("map-current")).toContainText("Lanterns Facing Inward");

  // The teleporter cell is now discovered and drawn with its teleporter marker,
  // even though the party was warped off it the instant they stepped on.
  await expect(page.getByTestId("minimap-marker-teleporter")).toBeVisible();
  expect(await drawnCells.count()).toBeGreaterThan(before);
});
