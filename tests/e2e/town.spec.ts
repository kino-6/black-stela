import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createStarterParty, registerAdventurer, resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("town modes expose guild, recovery, records, and dungeon entry", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("button", { name: "Guild" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shop" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Recovery" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Records" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dungeon Entry" })).toBeVisible();

  await registerAdventurer(page, { name: "Mira" });
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

  await createStarterParty(page);
  await page.getByRole("button", { name: "Shop" }).click();

  await expect(page.getByRole("heading", { name: "Stela Gate General Store" })).toBeVisible();
  await expect(page.getByText("75 gold")).toBeVisible();
  await page.getByRole("button", { name: "Buy" }).first().click();
  await expect(page.getByText("Bought Healing Draught for 25 gold.")).toBeVisible();
  await expect(page.getByText(/Weapon · DMG/).first()).toBeVisible();
  await expect(page.getByText(/Offhand · ARM/).first()).toBeVisible();
  await expect(page.getByText(/Body · ARM/).first()).toBeVisible();
  await expect(page.getByText("Head", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Buy Militia Sabre" }).click();
  await expect(page.getByText("Bought Militia Sabre for 45 gold.")).toBeVisible();
  const equipSabre = page.locator('button[aria-label^="Equip Militia Sabre to"]:not([disabled])').first();
  await expect(equipSabre).toBeVisible();
  await equipSabre.click();
  await expect(page.getByText(/equips Militia Sabre/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sell" }).last()).toBeVisible();
});

test("recovery costs gold and blocks free healing", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();
  await resolveVisibleCombat(page);
  await advanceToB1fMarker(page);
  await page.getByRole("button", { name: "Use return marker" }).click();
  await page.getByRole("button", { name: "Recovery" }).click();

  await expect(page.getByText(/Recovery cost: [1-9]/)).toBeVisible();
  await page.getByRole("button", { name: "Recover party" }).click();
  await expect(page.getByText(/The party rests in town for [1-9]/)).toBeVisible();
});

test("Japanese shop equipment stays readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await createStarterParty(page, "ja");
  await page.getByRole("button", { name: "店" }).click();

  await expect(page.getByRole("heading", { name: "黒碑門の雑貨店" })).toBeVisible();
  await expect(page.getByText(/武器 ·/).first()).toBeVisible();
  await expect(page.getByText(/副手 ·/).first()).toBeVisible();
  await expect(page.getByText("民兵の湾刀")).toBeVisible();
  await expect(page.getByText("滑り止め手袋")).toBeVisible();
  await expect(page.getByText("gold")).toHaveCount(0);
  await expect(page.getByText(/G/).first()).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});

test("combat exposes defend and item use choices", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("button", { name: "Defend" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use item" })).toBeVisible();
});

async function advanceToB1fMarker(page: Page) {
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: "Move" }).click();
  }
}
