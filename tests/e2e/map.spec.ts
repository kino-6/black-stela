import { expect, test } from "@playwright/test";
import { registerAdventurer, startNewExpedition } from "./helpers";

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
      .toBe(4);
    await expect(page.getByTestId("map-directions")).toHaveCount(0);

    await page.getByRole("button", { name: "Move" }).click();

    await expect(page.getByTestId("map-current")).toContainText("Hall of Old Dust");
    await expect(page.getByTestId("minimap-visited")).toHaveCount(1);
    await expect(page.getByTestId("minimap-current")).toHaveCount(1);
    await expect(page.getByTestId("minimap-facing")).toBeVisible();
    await expect(page.getByTestId("map-directions")).toHaveCount(0);
  });
}
