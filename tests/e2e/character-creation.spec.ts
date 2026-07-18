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

  // The Guild Master's offer stands in the HALL, beside the party you already have — it is no
  // longer a card sitting next to a half-filled registration form (IMP-003).
  await expect(page.getByText("Want me to pick one?")).toBeVisible();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.getByTestId("guild-suggestion")).toContainText("How about this one?");
  await expect(page.getByTestId("guild-suggestion")).toContainText("What are they good at?");
  await expect(page.getByTestId("guild-suggestion")).toContainText("Equipment");
  // The proposal is a modal question: it owns the screen until it is answered.
  await page.getByTestId("guild-suggestion").getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.getByText("1/6")).toBeVisible();

  // Registering by hand is a separate path, and the roster is NOT beside it.
  await page.getByRole("button", { name: "Skip explanation" }).click();
  await expect(page.getByTestId("guild-suggestion")).toHaveCount(0);
  await expect(page.getByText("Want me to pick one?")).toHaveCount(0);
  // IMP-028: a bounded class list beside a stable detail pane, not a two-column card wall.
  await expect(page.getByTestId("guild-step-class").locator(".guild-class-option")).toHaveCount(12);
  // The pane reads the calling under the cursor — focus Seeker and its signature + gear appear there.
  await page.getByTestId("guild-class-seeker").focus();
  const classDetail = page.getByTestId("guild-class-detail");
  await expect(classDetail).toContainText("Seeker");
  await expect(classDetail).toContainText("Reads hinges, dust, and floor scars");
  await expect(classDetail).toContainText("Equipment");
  await expect(page.getByText("Front line")).toHaveCount(0);
  await expect(page.getByText("Retreat guard")).toHaveCount(0);
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

  // IMP-013: the character sheet is roster ADMINISTRATION and lives behind "Manage roster" now —
  // registering someone returns you to the hall, not to a wall of forms.
  await page.getByTestId("guild-roster-open").click();
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
  await page.getByTestId("guild-roster-open").click();
  await page.getByRole("button", { name: /Lena/ }).click();
  await expect(page.getByTestId("character-profile")).toContainText("Keeps a second map in mirror script.");
  await expect(page.getByTestId("profile-portrait")).toBeVisible();
});

test("guild master proposals can fill a legal party", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("button", { name: "Beginner Safe" })).toHaveCount(0);
  await createStarterParty(page);

  await expect(page.getByText("6/6")).toBeVisible();
  await expect(page.getByTestId("guild-front-row").locator(".party-member")).toHaveCount(3);
  await expect(page.getByTestId("guild-back-row").locator(".party-member")).toHaveCount(3);
  await expect(page.getByText("Bulwark / Bulwark")).toHaveCount(0);
  await expect(page.getByText("Arcanist / Arcanist")).toHaveCount(0);
  await expect(page.getByText("Wayfinder / Wayfinder")).toHaveCount(0);
  await expect(page.getByLabel("Party coverage")).toHaveCount(0);
});

test("Japanese starter roster shows front and back rows without duplicate class titles", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});
  await createStarterParty(page, "ja");

  await expect(page.getByTestId("guild-front-row")).toContainText("前衛");
  await expect(page.getByTestId("guild-back-row")).toContainText("後衛");
  await expect(page.getByTestId("guild-front-row").locator(".party-member")).toHaveCount(3);
  await expect(page.getByTestId("guild-back-row").locator(".party-member")).toHaveCount(3);
  await expect(page.getByText("探索者 / 探索者")).toHaveCount(0);
  await expect(page.getByText("癒し手 / 癒し手")).toHaveCount(0);
});

test("Japanese guild registration remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});

  await expect(page.getByRole("heading", { name: "冒険者登録" })).toBeVisible();
  await expect(page.getByRole("button", { name: "炉端の連中を誘う" })).toHaveCount(0);
  await expect(page.getByLabel("隊列の備え")).toHaveCount(0);
  await expect(page.getByTestId("guild-step-briefing")).toContainText("潜る気か");
  await expect(page.getByText("名前は最後でいい")).toHaveCount(0);
  await expect(page.getByText("どの才がまだ伸びるのか")).toHaveCount(0);
  await expect(page.getByText("顔と来歴")).toHaveCount(0);
  await expect(page.getByText("ボーナスポイント")).toHaveCount(0);

  await expect(page.getByText("迷うなら、見繕うが？")).toBeVisible();
  await expect(page.getByRole("button", { name: "はい" })).toBeVisible();
  await expect(page.getByRole("button", { name: "いいえ" })).toBeVisible();

  await page.getByRole("button", { name: "説明を聞かない" }).click();
  await expect(page.getByText("迷うなら、見繕うが？")).toHaveCount(0);
  await expect(page.getByTestId("guild-step-class").locator(".guild-class-option")).toHaveCount(12);
  await page.getByTestId("guild-class-seeker").focus();
  await expect(page.getByTestId("guild-class-detail")).toContainText("蝶番、埃、床の傷を読み");
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
  await page.getByTestId("guild-roster-open").click();
  await expect(page.getByTestId("character-profile")).toContainText("灯の地図師 / 探索者");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
