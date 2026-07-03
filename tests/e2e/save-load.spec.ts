import { expect, test } from "@playwright/test";
import { startNewExpedition } from "./helpers";

test("autosaves current state and continues from the title screen", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByLabel("Name").fill("Mira");
  await page.getByLabel("Notes").fill("Maps every room by hand.");
  await page.getByRole("button", { name: "Add adventurer" }).click();
  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();
});

test("shows a visible message for corrupt autosave data", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.setItem("black-stela:save:autosave", "{not json"));
  await page.reload();

  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await expect(page.getByText("Corrupt save")).toBeVisible();

  await page.getByRole("button", { name: "New expedition" }).click();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
});
