import { expect, test } from "@playwright/test";
import { startNewExpedition } from "./helpers";

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`shows surrounding ways on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await startNewExpedition(page);

    await page.getByLabel("Name").fill("Mira");
    await page.getByRole("button", { name: "Add adventurer" }).click();
    await page.getByRole("button", { name: "Enter dungeon" }).click();

    await expect(page.getByRole("heading", { name: "Area" })).toBeVisible();
    await expect(page.getByTestId("map-current")).toContainText("Silent Stone Chamber");
    await expect(page.getByLabel("Mini-map")).toBeVisible();
    await expect(page.getByTestId("minimap-current")).toHaveCount(1);
    await expect(page.getByTestId("minimap-unseen")).toHaveCount(1);
    await expect(page.getByLabel("Ways")).toContainText("east");
    await expect(page.getByTestId("map-direction-east")).toContainText("Unseen");

    await page.getByRole("button", { name: "Move" }).click();

    await expect(page.getByTestId("map-current")).toContainText("Hall of Old Dust");
    await expect(page.getByTestId("minimap-visited")).toHaveCount(1);
    await expect(page.getByTestId("minimap-current")).toHaveCount(1);
    await expect(page.getByTestId("map-direction-west")).toContainText("Open");
    await expect(page.getByTestId("map-directions")).not.toContainText("Visited");
  });
}
