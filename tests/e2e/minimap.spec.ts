import { expect, test } from "@playwright/test";

// T29 removed the B4F teleporter (default no longer has warps — the regenerated floors use only physical
// hidden doors), so the old "warp cell registers on the map" guard is gone. What remains is the whole-floor
// map view itself: it must open over the explored cells and close. We discover two cells with the
// deterministic, combat-free hidden-door step (gate → search → lift) so the map has real content to show.
test("the full-floor map view opens over the whole explored floor and closes", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_7&at=room.b7f.gate&facing=south");
  await expect(page.getByTestId("minimap")).toBeVisible();

  // Reveal and step through the hidden door, so at least two cells are discovered.
  await page.getByRole("button", { name: "Search" }).click();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("map-current")).toContainText("Hidden Passage");

  // Open the whole-floor map from the dock; it shows the explored cells at once.
  await page.getByTestId("full-map-open").click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(page.getByTestId("floor-map-current")).toBeVisible();
  expect(await page.locator(".floor-map-grid .mini-map-cell:not(.empty)").count()).toBeGreaterThanOrEqual(2);

  // The M key toggles it closed.
  await page.keyboard.press("m");
  await expect(page.getByTestId("floor-map")).toHaveCount(0);
});
