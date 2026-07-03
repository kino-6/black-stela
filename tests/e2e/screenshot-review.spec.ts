import { expect, test } from "@playwright/test";
import { resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("captures desktop screenshot review states", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: "test-results/screenshot-review/desktop-title.png", fullPage: true });

  await startNewExpedition(page);
  await page.getByRole("button", { name: "Beginner Safe" }).click();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-guild.png", fullPage: true });

  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-dungeon-start.png", fullPage: true });

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-combat.png", fullPage: true });

  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-map-after-move.png", fullPage: true });

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-return-stair.png", fullPage: true });

  await page.getByRole("button", { name: "Use stairs" }).click();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-post-return-town.png", fullPage: true });
});

test("captures mobile Japanese guild screenshot review state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByRole("button", { name: "初心者向け" }).click();

  await expect(page.getByRole("heading", { name: "ギルド登録" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/mobile-ja-guild.png", fullPage: true });
});
