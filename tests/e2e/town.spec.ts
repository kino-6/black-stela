import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createStarterParty, openTownService, registerAdventurer, resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("town modes expose guild, recovery, records, and dungeon entry", async ({ page }) => {
  await startNewExpedition(page);

  // A fresh expedition lands on the guild; the town hub (reached with "Back to
  // town") lists its services as a console menu instead of a tab bar.
  await page.getByRole("button", { name: "Back to town" }).click();
  await expect(page.getByRole("button", { name: "Guild" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shop" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Recovery" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Records" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter dungeon" })).toBeVisible();

  // Stage into the guild to register, then back out to the hub for services.
  await page.getByRole("button", { name: "Guild" }).click();
  await registerAdventurer(page, { name: "Mira" });
  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();

  await openTownService(page, "Recovery");
  await expect(page.getByRole("heading", { name: "Recovery" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guild Registry" })).toHaveCount(0);
  await expect(page.getByTestId("recovery-plan")).toBeVisible();
  await expect(page.getByTestId("recovery-plan").getByText(/Mira/)).toBeVisible();

  await openTownService(page, "Records");
  await expect(page.getByRole("heading", { name: "Records" })).toBeVisible();

  await openTownService(page, "Enter dungeon");
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
});

test("town shop supports buying, selling, and equipping without an admin table", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await openTownService(page, "Shop");

  await expect(page.getByRole("heading", { name: "Stela Gate General Store" })).toBeVisible();
  await expect(page.getByText("75 gold")).toBeVisible();
  await expect(page.getByText("Selected adventurer")).toBeVisible();

  // Weapons category is the default; other slots live under their own tabs.
  await expect(page.getByText(/Weapon · DMG/).first()).toBeVisible();
  await expect(page.getByTestId("shop-delta").first()).toBeVisible();
  await page.getByTestId("shop-category-offhand").click();
  await expect(page.getByText(/Offhand · ARM/).first()).toBeVisible();
  await page.getByTestId("shop-category-armor").click();
  await expect(page.getByText(/Body · ARM/).first()).toBeVisible();
  await page.getByTestId("shop-category-trinket").click();
  await expect(page.getByText("Head", { exact: true }).first()).toBeVisible();

  // Buy a consumable from its category, then a weapon, then equip it.
  await page.getByTestId("shop-category-consumable").click();
  await page.getByRole("button", { name: "Buy Healing Draught" }).click();
  await expect(page.getByText("Bought Healing Draught for 25 gold.")).toBeVisible();
  await page.getByTestId("shop-category-weapon").click();
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
  await expect(page.getByTestId("town-cockpit")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toHaveCount(0);
  await expect(page.getByText("Return record")).toBeVisible();
  await page.getByTestId("town-cockpit").getByRole("button", { name: "Recovery" }).click();

  await expect(page.getByText(/Recovery cost: [1-9]/)).toBeVisible();
  await expect(page.getByTestId("recovery-plan")).toBeVisible();
  await page.getByRole("button", { name: "Recover party" }).click();
  await expect(page.getByText(/The party rests in town for [1-9]/)).toBeVisible();
});

test("Japanese shop equipment stays readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await createStarterParty(page, "ja");
  await openTownService(page, "商店", "ja");

  await expect(page.getByRole("heading", { name: "黒碑門の雑貨店" })).toBeVisible();
  await expect(page.getByText("見る冒険者")).toBeVisible();
  // Weapons category is default and readable, then switch categories on mobile.
  await expect(page.getByText(/武器 ·/).first()).toBeVisible();
  await expect(page.getByLabel("品揃え").getByText("民兵の湾刀")).toBeVisible();
  await page.getByTestId("shop-category-offhand").click();
  await expect(page.getByText(/副手 ·/).first()).toBeVisible();
  await page.getByTestId("shop-category-trinket").click();
  await expect(page.getByLabel("品揃え").getByText("滑り止め手袋")).toBeVisible();
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
  for (let step = 0; step < 40; step += 1) {
    if (await page.getByRole("heading", { name: "Black Marker" }).isVisible().catch(() => false)) {
      return;
    }
    await page.getByRole("button", { name: "Move", exact: true }).click();
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
      await resolveVisibleCombat(page);
    }
  }
}
