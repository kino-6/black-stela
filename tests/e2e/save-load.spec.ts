import { expect, test } from "@playwright/test";

test("saves current state and loads it after refresh", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Name").fill("Mira");
  await page.getByLabel("Notes").fill("Maps every room by hand.");
  await page.getByRole("button", { name: "Add adventurer" }).click();
  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();

  await page.getByRole("button", { name: "Save game" }).click();
  await expect(page.getByText("Saved autosave.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Create at least one adventurer")).toBeVisible();

  await page.getByRole("button", { name: "Load game" }).click();
  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();
  await expect(page.getByText("Loaded autosave.")).toBeVisible();
});

test("shows a visible message for corrupt save data", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.setItem("black-stela:save:broken", "{not json"));

  await page.getByLabel("Save slot").fill("broken");
  await page.getByRole("button", { name: "Load game" }).click();

  await expect(page.getByText(/corrupt save data/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
});
