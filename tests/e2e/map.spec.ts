import { expect, test } from "@playwright/test";
import { advanceToB1fMarker, registerAdventurer, resolveVisibleCombat, startNewExpedition } from "./helpers";

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`shows surrounding ways on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await startNewExpedition(page);

    await registerAdventurer(page, { name: "Mira" });
    await page.getByRole("button", { name: "Enter dungeon" }).click();

    await expect(page.getByRole("heading", { name: "Area" })).toBeVisible();
    await expect(page.getByTestId("map-current")).toContainText("Silent Stone Chamber");
    await expect(page.getByLabel("Mini-map")).toBeVisible();
    await expect(page.getByTestId("minimap-current")).toHaveCount(1);
    await expect(page.getByTestId("minimap-unseen")).toHaveCount(0);
    await expect(page.getByTestId("minimap-facing")).toBeVisible();
    await expect
      .poll(async () =>
        page
          .getByTestId("minimap-grid")
          .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)
      )
      .toBe(5);
    await expect
      .poll(async () => page.getByTestId("minimap-grid").evaluate((element) => getComputedStyle(element).gap))
      .toBe("0px");
    await expect(page.locator(".mini-map-link")).toHaveCount(0);
    await expect(page.getByTestId("map-directions")).toHaveCount(0);

    await page.getByRole("button", { name: "Move" }).click();
    if (await page.getByLabel("Battle screen").isVisible()) {
      await resolveVisibleCombat(page);
    }

    await expect(page.getByTestId("map-current")).toContainText("Hall of Old Dust");
    await expect(page.getByTestId("minimap-visited")).toHaveCount(1);
    await expect(page.getByTestId("minimap-current")).toHaveCount(1);
    await expect(page.getByTestId("minimap-facing")).toBeVisible();
    await expect(page.getByTestId("map-directions")).toHaveCount(0);
  });
}

test("minimap centers the party and shows walls, doors, and landmarks", async ({ page }) => {
  await startNewExpedition(page);
  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByTestId("minimap")).toBeVisible();

  // 5x5 grid: the current cell sits at the centre (row 2, col 2 -> index 12).
  await expect(page.locator(".mini-map-cell")).toHaveCount(25);
  await expect(page.locator(".mini-map-cell").nth(12)).toHaveClass(/(^|\s)current(\s|$)/);

  // Starting cell reads its real edges: an open corridor south, stone elsewhere.
  const current = page.getByTestId("minimap-current");
  await expect(current).toHaveClass(/edge-south-open/);
  await expect(current).toHaveClass(/edge-north-wall/);
  await expect(current).toHaveClass(/edge-east-wall/);

  // Advance to the black-marker cell and confirm its return landmark shows.
  await advanceToB1fMarker(page);
  await expect(page.getByRole("button", { name: "Use return marker" })).toBeVisible();
  await expect(page.getByTestId("minimap-marker-return")).toHaveCount(1);
});
