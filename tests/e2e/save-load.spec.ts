import { expect, test } from "@playwright/test";
import { createStarterParty, openTownServiceByTestId, registerAdventurer, startNewExpedition } from "./helpers";

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

test("U4: manual saves from the records room appear in the title Load browser, newest first", async ({ page }) => {
  test.setTimeout(90000);
  await startNewExpedition(page);
  await createStarterParty(page);

  // The records room (記録の間) offers this scenario's three manual slots.
  await openTownServiceByTestId(page, "town-service-records");
  await expect(page.getByTestId("records-save")).toBeVisible();
  await expect(page.getByTestId("manual-slot-1")).toContainText("empty");
  await page.getByTestId("manual-save-1").click();
  await expect(page.getByTestId("manual-slot-1")).not.toContainText("empty");
  await page.getByTestId("manual-save-2").click();

  // From the title, Load opens a browser listing the autosave + both manual saves.
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  await page.getByTestId("title-load").click();
  await expect(page.getByTestId("save-browser")).toBeVisible();
  const rows = page.locator("[data-testid^='save-row-']");
  await expect(rows).toHaveCount(3); // auto + Save 1 + Save 2
  // Newest first: Save 2 was made last, so it heads the list.
  await expect(rows.first()).toContainText("Save 2");

  // Loading a manual save resumes the run.
  await page.getByRole("button", { name: "Load game" }).first().click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
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
