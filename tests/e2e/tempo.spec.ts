import { expect, test } from "@playwright/test";

test("repeat, shortcuts, and compact log controls are available", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Confirm retreat/return")).toBeVisible();
  await page.getByLabel("Compact log").check();
  await expect(page.getByText(/Shortcuts:/)).toBeVisible();

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Add adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await page.keyboard.press("KeyW");
  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
  await page.keyboard.press("KeyF");
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();

  await page.getByRole("button", { name: "Repeat" }).click();
  await expect(page.getByText("The last command cannot be repeated here.")).toBeVisible();
});

test("auto combat and town shortcuts keep the loop playable", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Add adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await page.getByRole("button", { name: "Auto combat" }).click();
  await expect(page.getByText("Auto combat stopped: combat ended.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();

  await page.getByRole("button", { name: "Return" }).click();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Recover all" })).toBeVisible();
});

test("Japanese tempo controls fit on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Language").selectOption("ja");

  await expect(page.getByLabel("記録を圧縮")).toBeVisible();
  await expect(page.getByText(/ショートカット:/)).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
