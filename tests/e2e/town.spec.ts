import { expect, test } from "@playwright/test";
import { resolveVisibleCombat, startNewExpedition } from "./helpers";

test("town modes expose guild, recovery, records, and dungeon entry", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("button", { name: "Guild" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shop" })).toBeVisible();
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

test("town shop supports buying, selling, and equipping without an admin table", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByRole("button", { name: "Beginner Safe" }).click();
  await page.getByRole("button", { name: "Shop" }).click();

  await expect(page.getByRole("heading", { name: "Stela Gate General Store" })).toBeVisible();
  await expect(page.getByText("75 gold")).toBeVisible();
  await page.getByRole("button", { name: "Buy" }).first().click();
  await expect(page.getByText("Bought Healing Draught for 25 gold.")).toBeVisible();
  await page.getByRole("button", { name: "Buy" }).nth(2).click();
  await expect(page.getByText("Bought Iron Knife for 40 gold.")).toBeVisible();
  await page.getByRole("button", { name: "Iron Knife" }).first().click();
  await expect(page.getByText(/equips Iron Knife/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sell" }).last()).toBeVisible();
});

test("recovery costs gold and blocks free healing", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Register adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();
  await resolveVisibleCombat(page);
  await page.getByRole("button", { name: "Move" }).click();
  await page.getByRole("button", { name: "Use return marker" }).click();
  await page.getByRole("button", { name: "Recovery" }).click();

  await expect(page.getByText(/Recovery cost: [1-9]/)).toBeVisible();
  await page.getByRole("button", { name: "Recover party" }).click();
  await expect(page.getByText(/The party rests in town for [1-9]/)).toBeVisible();
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
