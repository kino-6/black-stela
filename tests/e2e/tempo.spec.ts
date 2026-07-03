import { expect, test } from "@playwright/test";
import { resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("repeat and keyboard commands keep the dungeon loop fast", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Register adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByRole("button", { name: "Repeat" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
  await expect(page.getByText("Repeat stopped.")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();

  await page.getByRole("button", { name: "Repeat" }).click();
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText("Auto move stopped: interesting event or unsafe state.")).toBeVisible();
});

test("combat and town recovery keep the loop playable", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Register adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use stairs" })).toHaveCount(0);

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return" })).toHaveCount(0);
  await page.getByRole("button", { name: "Use stairs" }).click();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await page.getByRole("button", { name: "Recovery" }).click();
  await expect(page.getByRole("button", { name: "Recover party" })).toBeVisible();
});

test("Japanese tempo controls fit on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await page.getByLabel("名前").fill("ミラ");
  await page.getByRole("button", { name: "冒険者を登録" }).click();
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByRole("button", { name: "リピート" })).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
