import { expect, test } from "@playwright/test";

test("create party, import portrait, enter dungeon, fight, return, and view log", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Name").fill("Mira");
  await page.getByLabel("Notes").fill("Maps every room by hand.");
  await page.getByTestId("portrait-input").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    )
  });
  await page.getByRole("button", { name: "Add adventurer" }).click();

  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByText("Ash Slime stands in the party's path.")).toBeVisible();
  await page.getByRole("button", { name: "Attack" }).click();
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();

  await page.getByRole("button", { name: "Return" }).click();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await expect(page.getByText("The party returns to town.")).toBeVisible();
});
