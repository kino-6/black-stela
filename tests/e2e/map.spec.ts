import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test(`shows map progress on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    await page.getByLabel("Name").fill("Mira");
    await page.getByRole("button", { name: "Add adventurer" }).click();
    await page.getByRole("button", { name: "Enter dungeon" }).click();

    await expect(page.getByRole("heading", { name: "Map" })).toBeVisible();
    await expect(page.getByTestId("map-current")).toContainText("Silent Stone Chamber");
    await expect(page.getByLabel("Known exits")).toContainText("east");

    await page.getByRole("button", { name: "Move" }).click();

    await expect(page.getByTestId("map-current")).toContainText("Hall of Old Dust");
    await expect(page.getByTestId("map-visited")).toContainText("Silent Stone Chamber");
    await expect(page.getByTestId("map-visited")).toContainText("Hall of Old Dust");
  });
}
