import { expect, test } from "@playwright/test";
import { setTitleLanguage, startNewExpedition } from "./helpers";

test("guild registration supports quick and detailed recruits with coverage feedback", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toBeVisible();
  await expect(page.getByLabel("Party coverage")).toContainText("Healing");
  await expect(page.getByLabel("Party coverage")).toContainText("Missing");
  await expect(page.getByTestId("guild-step-briefing")).toContainText("Guild master");
  await expect(page.getByTestId("character-profile")).toHaveCount(0);

  await page.getByRole("button", { name: "Quick recruit" }).click();
  await expect(page.getByText("1/6")).toBeVisible();

  await page.getByRole("button", { name: "Skip explanation" }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: /Seeker/ }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Background", { exact: true }).selectOption("cartographer");
  await page.getByLabel("Trait", { exact: true }).selectOption("curious");
  await page.getByTestId("portrait-input").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    )
  });
  await expect(page.getByTestId("portrait-preview")).toBeVisible();
  await page.getByTestId("guild-step-appearance").getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Reroll bonus" }).click();
  const witPlus = page.getByLabel("Wit +");
  for (let index = 0; index < 8; index += 1) {
    if (await witPlus.isDisabled()) {
      break;
    }
    await witPlus.click();
  }
  await expect(page.getByTestId("stat-preview")).toContainText("Damage");
  await page.getByTestId("guild-step-bonus").getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Name").fill("Lena");
  await page.getByLabel("Title").fill("Candle Mapper");
  await page.getByLabel("Notes").fill("Keeps a second map in mirror script.");
  await page.getByRole("button", { name: "Register adventurer" }).click();

  await expect(page.getByTestId("character-profile")).toContainText("Lena");
  await expect(page.getByTestId("character-profile")).toContainText("Candle Mapper / Seeker / Cartographer");
  await expect(page.getByTestId("character-profile")).toContainText("Keeps a second map in mirror script.");
  await expect(page.getByTestId("character-profile")).toContainText("Deepest floor");
  await expect(page.getByTestId("character-profile")).toContainText("Injuries");
  await expect(page.getByTestId("profile-portrait")).toBeVisible();
  await expect(page.getByLabel("Party coverage")).toContainText("Trap handling");

  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem("black-stela:save:autosave") ?? ""))
    .toContain("Lena");
  await page.reload();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Lena/ }).click();
  await expect(page.getByTestId("character-profile")).toContainText("Keeps a second map in mirror script.");
  await expect(page.getByTestId("profile-portrait")).toBeVisible();
});

test("starter templates create a legal party from the guild", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByRole("button", { name: "Beginner Safe" }).click();

  await expect(page.getByText("6/6")).toBeVisible();
  await expect(page.getByRole("button", { name: /Rook/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Vale/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sei/ })).toBeVisible();
  await expect(page.getByLabel("Party coverage")).not.toContainText("Missing");
});

test("Japanese guild registration remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await expect(page.getByRole("heading", { name: "冒険者登録" })).toBeVisible();
  await expect(page.getByRole("button", { name: "即席登録" })).toBeVisible();
  await expect(page.getByLabel("隊列の備え")).toBeVisible();

  await page.getByRole("button", { name: "説明を聞かない" }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: /探索者/ }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: "次へ" }).click();
  await page.getByTestId("guild-step-appearance").getByRole("button", { name: "次へ" }).click();
  const agilityPlus = page.getByLabel("敏捷 +");
  for (let index = 0; index < 8; index += 1) {
    if (await agilityPlus.isDisabled()) {
      break;
    }
    await agilityPlus.click();
  }
  await page.getByTestId("guild-step-bonus").getByRole("button", { name: "次へ" }).click();
  await page.getByLabel("名前").fill("ミラ");
  await page.getByLabel("二つ名").fill("灯の地図師");
  await page.getByRole("button", { name: "冒険者を登録" }).click();
  await expect(page.getByTestId("character-profile")).toContainText("灯の地図師 / 探索者");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
