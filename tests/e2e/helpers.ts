import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function startNewExpedition(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New expedition" }).click();
}

export async function setTitleLanguage(page: Page, locale: "en" | "ja") {
  await page.goto("/");
  await page.getByRole("button", { name: "Config" }).click();
  await page.getByLabel("Language").selectOption(locale);
}

export async function resolveVisibleCombat(page: Page) {
  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByTestId("combat-actor").first()).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group").first()).toBeVisible();

  for (let round = 0; round < 6; round += 1) {
    if (await page.getByRole("heading", { name: "Combat" }).isHidden()) {
      return;
    }

    await page.getByRole("button", { name: "Attack" }).click();
  }

  await expect(page.getByRole("heading", { name: "Combat" })).toHaveCount(0);
}
