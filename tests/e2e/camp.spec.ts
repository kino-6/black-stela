import { test, expect } from "@playwright/test";

/** The party menu is the same controller surface in town and in the dungeon. */
test("party menu opens in the dungeon, exposes real stats, and closes on Escape", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_2");

  await page.getByTestId("party-menu-open").focus();
  await page.keyboard.press("Enter");
  const menu = page.getByTestId("party-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("HP");
  await expect(menu).toContainText("Evasion");
  await expect(menu).toContainText("Spell power");

  await page.keyboard.press("r");
  await expect(page.getByTestId("tempo-indicator")).toHaveCount(0);

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(menu.getByTestId("party-menu-equipment")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
});

test("party menu opens from town without a mouse", async ({ page }) => {
  await page.goto("/?debug=1&progress=ready");
  const backToTown = page.getByRole("button", { name: "Back to town" });
  await backToTown.focus();
  await page.keyboard.press("Enter");

  // IMP-025: the party menu now lives in the Guild hall — reach it without a mouse.
  await page.getByTestId("town-location-hall").focus();
  await page.keyboard.press("Enter");

  const open = page.getByTestId("town-party-menu");
  await expect(open).toBeVisible();
  await open.press("Enter");
  const menu = page.getByTestId("party-menu");
  await expect(menu).toBeVisible();

  await menu.getByTestId("party-menu-tab-items").press("Enter");
  await expect(menu.getByTestId("party-menu-items")).toBeVisible();
  await menu.getByTestId("party-menu-tab-valuables").press("Enter");
  await expect(menu.getByTestId("party-menu-valuables")).toBeVisible();
  await menu.getByTestId("party-menu-tab-status").press("Enter");

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(menu.getByTestId("party-menu-member-name")).not.toHaveText("Mira");

  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
});

test("Japanese party menu stays inside a 1280x720 viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
  await page.goto("/?debug=1&progress=floor_2");
  await page.getByTestId("party-menu-open").press("Enter");

  const menu = page.getByTestId("party-menu");
  await expect(menu).toContainText("回避");
  await expect(menu).toContainText("術威力");
  const panelBox = await menu.locator(".party-menu-panel").boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.y).toBeGreaterThanOrEqual(0);
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(720);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(1280);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.screenshot({
    path: "docs/evidence/party-menu-2026-07-14/party-menu-ja-1280x720.png",
    fullPage: false
  });
});
