import { expect, test } from "@playwright/test";
import { setTitleLanguage } from "./helpers";

test("switches to Japanese from title config and persists the selected language", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await expect(page.getByRole("heading", { name: "ギルド登録" })).toBeVisible();
  await expect(page.getByRole("button", { name: "迷宮に入る" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "新たな探索" })).toBeVisible();
});

test("plays the MVP flow with Japanese room text and log projection", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await page.getByLabel("名前").fill("ミラ");
  await page.getByRole("button", { name: "冒険者を登録" }).click();
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByRole("heading", { name: "静まり返った石室" })).toBeVisible();
  await expect(page.getByText("隊列は黒い石碑の下へ降りた。")).toBeVisible();

  await page.getByRole("button", { name: "進む" }).click();
  await expect(page.getByRole("heading", { name: "戦闘" })).toBeVisible();
  await expect(page.getByLabel("戦闘画面")).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
  await expect(page.getByText("Ash Slime が通路を塞いでいる。")).toHaveCount(0);
  for (let round = 0; round < 6; round += 1) {
    if (await page.getByRole("heading", { name: "戦闘" }).isHidden()) {
      break;
    }
    await page.getByRole("button", { name: "攻撃" }).click();
  }
  await expect(page.getByRole("heading", { name: "古い塵の広間" })).toBeVisible();
});

test("keeps Japanese layout usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await expect(page.getByRole("button", { name: "迷宮に入る" })).toBeVisible();
  await page.getByLabel("名前").fill("ミラ");
  await page.getByRole("button", { name: "冒険者を登録" }).click();
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByText("冷たい切石が隊列を囲む。東には細い扉が待っている。")).toBeVisible();
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
