import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceToB1fMarkerViaNeedle, createStarterParty, openTownService, registerAdventurer, resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("the town square offers a few destinations plus a separated departure", async ({ page }) => {
  await startNewExpedition(page);

  // IMP-025: the town square (reached with "Back to town") is a handful of DESTINATIONS — guild hall,
  // market, archive, the infirmary — plus the way down, not a grid of ten equal systems.
  await page.getByRole("button", { name: "Back to town" }).click();
  await expect(page.getByRole("button", { name: "Guild hall" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Market row" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Recovery" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Records hall" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter dungeon" })).toBeVisible();
  // The systems themselves are one step inside a destination, not on the square.
  await expect(page.getByRole("button", { name: "Shop", exact: true })).toHaveCount(0);

  // Stage into the guild hall to register, then back out for services.
  await openTownService(page, "Guild");
  await registerAdventurer(page, { name: "Mira" });
  await expect(page.locator(".party-member").filter({ hasText: "Mira" }).first()).toBeVisible();

  await openTownService(page, "Recovery");
  await expect(page.getByRole("heading", { name: "Recovery" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guild Registry" })).toHaveCount(0);
  await expect(page.getByTestId("recovery-plan")).toBeVisible();
  // IMP-014: an unhurt party is one line, not a card per member saying "No treatment." Mira is
  // fine, so she is not on the bill — the counter lists who needs treating, and nobody does.
  await expect(page.getByTestId("recovery-plan")).toContainText("No treatment needed");
  await expect(page.locator(".recovery-row")).toHaveCount(0);

  await openTownService(page, "Records");
  await expect(page.getByRole("heading", { name: "Records" })).toBeVisible();

  await openTownService(page, "Enter dungeon");
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
});

test("town shop is an Etrian buy/sell split — buying fills the shared bag, not a character", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await openTownService(page, "Shop");

  await expect(page.getByRole("heading", { name: "Stela Gate General Store" })).toBeVisible();
  await expect(page.getByText("75 gold")).toBeVisible();
  // T8: 買う/売る are top-level modes; there is no per-adventurer purchase scope anymore.
  await expect(page.getByTestId("shop-mode-buy")).toBeVisible();
  await expect(page.getByTestId("shop-mode-sell")).toBeVisible();
  await expect(page.getByText("Selected adventurer")).toHaveCount(0);

  // 買う mode: browse by category. The item detail names who CAN equip it — information, not a scope.
  await expect(page.getByText(/Weapon · DMG/).first()).toBeVisible();
  await expect(page.getByTestId("shop-who-can-equip").first()).toBeVisible();
  await page.getByTestId("shop-category-offhand").click();
  await expect(page.getByText(/Offhand · ARM/).first()).toBeVisible();
  await page.getByTestId("shop-category-armor").click();
  await expect(page.getByText(/Body · ARM/).first()).toBeVisible();

  // Buy a consumable and a weapon — both land in the SHARED inventory (equipping is the party menu's job).
  await page.getByTestId("shop-category-consumable").click();
  await page.getByRole("button", { name: "Buy Healing Draught" }).click();
  await expect(page.getByText("Bought Healing Draught for 25 gold.")).toBeVisible();
  await page.getByTestId("shop-category-weapon").click();
  await page.getByRole("button", { name: "Buy Militia Sabre" }).click();
  await expect(page.getByText("Bought Militia Sabre for 45 gold.")).toBeVisible();

  // 売る mode lists the shared bag we just filled, each with a Sell action.
  await page.getByTestId("shop-mode-sell").click();
  await expect(page.getByText("Militia Sabre", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sell" }).first()).toBeVisible();
});

test("recovery costs gold and blocks free healing", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  // Route across the needle trap so the party returns injured and recovery has a cost.
  await advanceToB1fMarkerViaNeedle(page);
  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByTestId("town-cockpit")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toHaveCount(0);
  // The party came back injured — the return note and the wounds ledger are both present (the labelled
  // 帰還記録 row was dropped in the town redesign for the world-title heading + last-log note).
  await expect(page.getByTestId("town-return-note")).toBeVisible();
  await expect(page.getByTestId("town-return-ledger")).toBeVisible();
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
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});
  await createStarterParty(page, "ja");
  await openTownService(page, "商店", "ja");

  await expect(page.getByRole("heading", { name: "黒碑門の雑貨店" })).toBeVisible();
  // T8: the 買う/売る split replaced the per-adventurer picker.
  await expect(page.getByTestId("shop-mode-buy")).toBeVisible();
  await expect(page.getByTestId("shop-mode-sell")).toBeVisible();
  await expect(page.getByText("見る冒険者")).toHaveCount(0);
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
  await page.keyboard.press("w");

  // The command menu exposes Defend (always) and Use item (when an item is carried).
  await expect(page.getByTestId("combat-command-menu")).toBeVisible();
  await expect(page.getByTestId("combat-menu-defend")).toBeVisible();
  await expect(page.getByTestId("combat-menu-item")).toBeVisible();
});

