import { expect, test } from "@playwright/test";
import { registerAdventurer, startNewExpedition } from "./helpers";

test("autosaves current state and continues from the title screen", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira", notes: "Maps every room by hand." });
  await expect(page.locator(".party-member").filter({ hasText: "Mira" }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator(".party-member").filter({ hasText: "Mira" }).first()).toBeVisible();
});

test("deletes the autosave from the title behind a confirm (T6)", async ({ page }) => {
  await startNewExpedition(page);
  await registerAdventurer(page, { name: "Mira", notes: "Maps every room by hand." });

  await page.reload();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();

  // 削除 is a two-step gate — the first press only reveals はい、削除する / やめる, never destroys.
  await page.getByTestId("title-delete-save").click();
  await expect(page.getByTestId("title-delete-confirm")).toBeVisible();
  await page.getByTestId("title-delete-cancel").click();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();

  // Confirming removes the save: Continue goes dead and the delete control disappears.
  await page.getByTestId("title-delete-save").click();
  await page.getByTestId("title-delete-confirm").click();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await expect(page.getByTestId("title-delete-save")).toHaveCount(0);

  // The deletion survives a reload — the save is really gone, not just hidden.
  await page.reload();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
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
