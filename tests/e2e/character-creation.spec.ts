import { expect, test } from "@playwright/test";
import { setTitleLanguage, startNewExpedition } from "./helpers";

test("guild registration supports quick and detailed recruits with coverage feedback", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("heading", { name: "Guild Registry" })).toBeVisible();
  await expect(page.getByLabel("Party coverage")).toContainText("Healing");
  await expect(page.getByLabel("Party coverage")).toContainText("Missing");

  await page.getByRole("button", { name: "Quick recruit" }).click();
  await expect(page.getByText("1/4")).toBeVisible();

  await page.getByLabel("Name").fill("Lena");
  await page.getByLabel("Title").fill("Candle Mapper");
  await page.getByLabel("Class", { exact: true }).selectOption("seeker");
  await page.getByLabel("Background", { exact: true }).selectOption("cartographer");
  await page.getByLabel("Trait", { exact: true }).selectOption("curious");
  await page.getByLabel("Aptitude", { exact: true }).selectOption("wit");
  await page.getByRole("button", { name: "Register adventurer" }).click();

  await expect(page.getByRole("heading", { name: "Lena" })).toBeVisible();
  await expect(page.getByText("Candle Mapper / Seeker / Cartographer")).toBeVisible();
  await expect(page.getByLabel("Party coverage")).toContainText("Trap handling");
});

test("starter templates create a legal party from the guild", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByRole("button", { name: "Beginner Safe" }).click();

  await expect(page.getByText("4/4")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rook" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vale" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sei" })).toBeVisible();
  await expect(page.getByLabel("Party coverage")).not.toContainText("Missing");
});

test("Japanese guild registration remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await expect(page.getByRole("heading", { name: "ギルド登録" })).toBeVisible();
  await expect(page.getByRole("button", { name: "即席登録" })).toBeVisible();
  await expect(page.getByLabel("隊列の備え")).toBeVisible();

  await page.getByLabel("名前").fill("ミラ");
  await page.getByLabel("二つ名").fill("灯の地図師");
  await page.getByLabel("クラス", { exact: true }).selectOption("seeker");
  await page.getByRole("button", { name: "冒険者を登録" }).click();
  await expect(page.getByText("灯の地図師 / 探索者")).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
