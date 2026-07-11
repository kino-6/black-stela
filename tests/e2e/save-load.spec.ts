import { expect, test } from "@playwright/test";
import { registerAdventurer, startNewExpedition } from "./helpers";

test("autosaves current state and continues from the title screen", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira", notes: "Maps every room by hand." });
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
  await page
    .getByTestId("scenario-card-default")
    .click({ timeout: 5000 })
    .catch(() => {});
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
});
