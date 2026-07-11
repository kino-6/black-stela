import { expect, test } from "@playwright/test";
import { createStarterParty, registerAdventurer, resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("resolves combat through the nested command menu", async ({ page }) => {
  await startNewExpedition(page);
  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  // The enemy is the stage: a large figure with its name + HP, not a text list.
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");

  // The per-actor input is a command MENU (not a flat button toolbar): a heading for
  // the current actor plus attack / defend rows.
  const menu = page.getByTestId("combat-command-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("Mira");
  await expect(page.getByTestId("combat-menu-attack")).toBeVisible();
  await expect(page.getByTestId("combat-menu-defend")).toBeVisible();

  // Fixed single-screen frame: the cockpit fits the viewport and the page never scrolls.
  const cockpitFitsViewport = await page.locator(".adventure-cockpit").evaluate((element) => {
    return element.getBoundingClientRect().bottom <= window.innerHeight + 1;
  });
  expect(cockpitFitsViewport).toBe(true);

  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText(/Victory.*XP.*gold/i)).toBeVisible();
});

test("six-member party keeps front and back rows visible; the menu does not reflow", async ({ page }) => {
  await startNewExpedition(page);
  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByTestId("party-front-row").getByTestId("party-token")).toHaveCount(3);
  await expect(page.getByTestId("party-back-row").getByTestId("party-token")).toHaveCount(3);
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  // The six members are one compact strip: three front, three back, no reflow.
  await expect(page.getByTestId("combat-front-row").getByTestId("combat-actor")).toHaveCount(3);
  await expect(page.getByTestId("combat-back-row").getByTestId("combat-actor")).toHaveCount(3);
  await expect(page.getByTestId("combat-actor")).toHaveCount(6);

  // #68: descending command → target submenu must not resize the menu panel (its
  // fixed min-height absorbs the shorter list) — so the command area never reflows.
  const menu = page.getByTestId("combat-command-menu");
  const height = () => menu.evaluate((el) => el.getBoundingClientRect().height);
  const heightBefore = await height();
  await page.keyboard.press("Enter"); // attack → target submenu
  await expect(menu).toContainText(/target|標的/i);
  expect(Math.abs((await height()) - heightBefore)).toBeLessThan(2);
});

test("Japanese mobile combat menu stays readable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});
  await createStarterParty(page, "ja");
  await page.getByRole("button", { name: "迷宮に入る" }).click();
  await page.getByRole("button", { name: "進む" }).click();

  await expect(page.getByRole("heading", { name: "戦闘", exact: true })).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("灰泥");
  await expect(page.getByTestId("combat-command-menu")).toBeVisible();
  await expect(page.getByTestId("combat-menu-attack")).toContainText("攻撃");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
