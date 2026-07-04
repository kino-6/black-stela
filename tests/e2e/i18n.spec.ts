import { expect, test } from "@playwright/test";
import { registerAdventurer, setTitleLanguage } from "./helpers";

test("switches to Japanese from title config and persists the selected language", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await expect(page.getByRole("heading", { name: "冒険者登録" })).toBeVisible();
  await expect(page.getByRole("button", { name: "説明を聞かない" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "新たな探索" })).toBeVisible();
});

test("plays the MVP flow with Japanese room text and log projection", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await registerAdventurer(page, { locale: "ja", name: "ミラ" });
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByRole("heading", { name: "静まり返った石室" })).toBeVisible();
  await expect(page.getByText("治癒の水薬 を 1 個見つけた。")).toBeVisible();

  await page.getByRole("button", { name: "進む" }).click();
  await expect(page.getByRole("heading", { name: "戦闘", exact: true })).toBeVisible();
  await expect(page.getByLabel("戦闘画面")).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("灰泥");
  await expect(page.getByText("Ash Slime")).toHaveCount(0);
  await expect(page.getByText("gold")).toHaveCount(0);
  for (let round = 0; round < 6; round += 1) {
    if (await page.getByRole("heading", { name: "戦闘", exact: true }).isHidden()) {
      break;
    }
    await page.getByRole("button", { name: "攻撃" }).click();
    await page.getByRole("button", { name: "決定" }).click();
  }
  await expect(page.getByRole("heading", { name: "古い塵の広間" })).toBeVisible();
  await expect(page.getByText("gold")).toHaveCount(0);
});

test("keeps Japanese layout usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await expect(page.getByRole("button", { name: "説明を聞かない" })).toBeVisible();
  await registerAdventurer(page, { locale: "ja", name: "ミラ" });
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByText("冷たい切石が近く迫る。東の細い扉から乾いた空気が漏れる。")).toBeVisible();
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
