import { expect, test } from "@playwright/test";
import { startNewExpedition } from "./helpers";

test("town modes expose guild, recovery, records, and dungeon entry", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("button", { name: "Guild" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Recovery" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Records" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dungeon Entry" })).toBeVisible();

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Register adventurer" }).click();
  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();

  await page.getByRole("button", { name: "Recovery" }).click();
  await expect(page.getByRole("heading", { name: "Recovery" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guild Registry" })).toHaveCount(0);
  await expect(page.getByText(/Mira: \d+\/\d+/)).toBeVisible();

  await page.getByRole("button", { name: "Records" }).click();
  await expect(page.getByRole("heading", { name: "Records" })).toBeVisible();

  await page.getByRole("button", { name: "Dungeon Entry" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
});

test("combat exposes defend and item use choices", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Register adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("button", { name: "Defend" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use item" })).toBeVisible();
});
