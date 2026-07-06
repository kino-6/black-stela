import { expect, test } from "@playwright/test";
import { createStarterParty, setTitleLanguage, startNewExpedition } from "./helpers";

test("guild registration supports quick and detailed recruits without roster scoring", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toBeVisible();
  await expect(page.getByLabel("Party coverage")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ask the hearth drinkers" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Beginner Safe" })).toHaveCount(0);
  await expect(page.getByTestId("guild-step-briefing")).toContainText("Guild master");
  await expect(page.getByTestId("character-profile")).toHaveCount(0);

  await page.getByRole("button", { name: "Skip explanation" }).click();
  await expect(page.getByText("Want me to pick one?")).toBeVisible();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.getByTestId("guild-suggestion")).toContainText("How about this one?");
  await expect(page.getByTestId("guild-suggestion")).toContainText("What are they good at?");
  await expect(page.getByTestId("guild-suggestion")).toContainText("Equipment");
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.getByText("1/6")).toBeVisible();

  await expect(page.getByTestId("guild-step-class").locator(".class-card")).toHaveCount(12);
  await expect(page.getByTestId("guild-step-class").locator(".class-gear")).toHaveCount(12);
  await expect(page.getByTestId("guild-step-class").locator(".class-gear").first()).toContainText("Equipment:");
  await expect(page.getByText("Reads hinges, dust, and floor scars")).toBeVisible();
  await expect(page.getByText("Front line")).toHaveCount(0);
  await expect(page.getByText("Retreat guard")).toHaveCount(0);
  await page.getByTestId("guild-step-class").getByRole("button", { name: /Seeker/ }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("portrait-preview")).toBeVisible();
  await expect(page.getByLabel("Accent")).toHaveCount(0);
  await expect(page.getByLabel("Background", { exact: true }).locator("option")).toHaveCount(12);
  await expect(page.getByLabel("Trait", { exact: true }).locator("option")).toHaveCount(12);
  const originBefore = await page.getByLabel("Background", { exact: true }).inputValue();
  await page.getByRole("button", { name: "Pick origin" }).click();
  await expect.poll(async () => page.getByLabel("Background", { exact: true }).inputValue()).not.toBe(originBefore);
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
  await expect(page.getByTestId("guild-step-bonus").getByText(/^0$/)).toHaveCount(0);
  await page.getByRole("button", { name: "Reroll talent" }).click();
  const witPlus = page.getByLabel("Wit +");
  for (let index = 0; index < 8; index += 1) {
    if (await witPlus.isDisabled()) {
      break;
    }
    await witPlus.click();
  }
  await expect(page.getByTestId("stat-preview")).toContainText("Damage");
  await page.getByTestId("guild-step-bonus").getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("button", { name: "Roll identity" })).toBeVisible();
  const generatedName = await page.getByLabel("Name").inputValue();
  await page.getByRole("button", { name: "Roll identity" }).click();
  await expect.poll(async () => page.getByLabel("Name").inputValue()).not.toBe(generatedName);
  await page.getByLabel("Name").fill("Lena");
  await page.getByLabel("Epithet").fill("Candle Mapper");
  await page.getByLabel("Record").fill("Keeps a second map in mirror script.");
  await page.getByRole("button", { name: "Register adventurer" }).click();

  await expect(page.getByTestId("character-profile")).toContainText("Lena");
  await expect(page.getByTestId("character-profile")).toContainText("Candle Mapper / Seeker / Cartographer");
  await expect(page.getByTestId("character-profile")).toContainText("Keeps a second map in mirror script.");
  await expect(page.getByTestId("character-profile")).toContainText("Deepest floor");
  await expect(page.getByTestId("character-profile")).toContainText("Injuries");
  await expect(page.getByTestId("profile-portrait")).toBeVisible();
  await expect(page.getByLabel("Party coverage")).toHaveCount(0);

  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem("black-stela:save:autosave") ?? ""))
    .toContain("Lena");
  await page.reload();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Lena/ }).click();
  await expect(page.getByTestId("character-profile")).toContainText("Keeps a second map in mirror script.");
  await expect(page.getByTestId("profile-portrait")).toBeVisible();
});

test("guild master proposals can fill a legal party", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("button", { name: "Beginner Safe" })).toHaveCount(0);
  await createStarterParty(page);

  await expect(page.getByText("6/6")).toBeVisible();
  await expect(page.getByTestId("guild-front-row").getByRole("button")).toHaveCount(3);
  await expect(page.getByTestId("guild-back-row").getByRole("button")).toHaveCount(3);
  await expect(page.getByText("Bulwark / Bulwark")).toHaveCount(0);
  await expect(page.getByText("Arcanist / Arcanist")).toHaveCount(0);
  await expect(page.getByText("Wayfinder / Wayfinder")).toHaveCount(0);
  await expect(page.getByLabel("Party coverage")).toHaveCount(0);
});

test("Japanese starter roster shows front and back rows without duplicate class titles", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await createStarterParty(page, "ja");

  await expect(page.getByTestId("guild-front-row")).toContainText("前衛");
  await expect(page.getByTestId("guild-back-row")).toContainText("後衛");
  await expect(page.getByTestId("guild-front-row").getByRole("button")).toHaveCount(3);
  await expect(page.getByTestId("guild-back-row").getByRole("button")).toHaveCount(3);
  await expect(page.getByText("探索者 / 探索者")).toHaveCount(0);
  await expect(page.getByText("癒し手 / 癒し手")).toHaveCount(0);
});

test("Japanese guild registration remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();

  await expect(page.getByRole("heading", { name: "冒険者登録" })).toBeVisible();
  await expect(page.getByRole("button", { name: "炉端の連中を誘う" })).toHaveCount(0);
  await expect(page.getByLabel("隊列の備え")).toHaveCount(0);
  await expect(page.getByTestId("guild-step-briefing")).toContainText("潜る気か");
  await expect(page.getByText("名前は最後でいい")).toHaveCount(0);
  await expect(page.getByText("どの才がまだ伸びるのか")).toHaveCount(0);
  await expect(page.getByText("顔と来歴")).toHaveCount(0);
  await expect(page.getByText("ボーナスポイント")).toHaveCount(0);

  await page.getByRole("button", { name: "説明を聞かない" }).click();
  await expect(page.getByText("迷うなら、見繕うが？")).toBeVisible();
  await expect(page.getByRole("button", { name: "はい" })).toBeVisible();
  await expect(page.getByRole("button", { name: "いいえ" })).toBeVisible();
  await expect(page.getByTestId("guild-step-class").locator(".class-card")).toHaveCount(12);
  await expect(page.getByText("蝶番、埃、床の傷を読み")).toBeVisible();
  await page.getByTestId("guild-step-class").getByRole("button", { name: /探索者/ }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: "次へ" }).click();
  await expect(page.getByTestId("portrait-preview")).toBeVisible();
  await expect(page.getByLabel("色")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "来歴を見繕う" })).toBeVisible();
  await page.getByTestId("guild-step-appearance").getByRole("button", { name: "次へ" }).click();
  const agilityPlus = page.getByLabel("敏捷 +");
  for (let index = 0; index < 8; index += 1) {
    if (await agilityPlus.isDisabled()) {
      break;
    }
    await agilityPlus.click();
  }
  await page.getByTestId("guild-step-bonus").getByRole("button", { name: "次へ" }).click();
  await expect(page.getByRole("button", { name: "名を見繕う" })).toBeVisible();
  await expect(page.getByLabel("覚え書き")).not.toHaveValue("");
  await expect(page.getByLabel("メモ")).toHaveCount(0);
  await page.getByLabel("名前").fill("ミラ");
  await page.getByLabel("二つ名").fill("灯の地図師");
  await page.getByRole("button", { name: "冒険者を登録" }).click();
  await expect(page.getByTestId("character-profile")).toContainText("灯の地図師 / 探索者");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
