import { expect, test } from "@playwright/test";
import { setTitleLanguage, startNewExpedition } from "./helpers";

test("guild registration supports quick and detailed recruits with coverage feedback", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("heading", { name: "Character Studio" })).toBeVisible();
  await expect(page.getByLabel("Party coverage")).toContainText("Healing");
  await expect(page.getByLabel("Party coverage")).toContainText("Missing");
  await expect(page.getByTestId("stat-preview")).toContainText("Damage");
  await expect(page.getByTestId("character-profile")).toContainText("A player-authored adventurer");

  await page.getByRole("button", { name: "Quick recruit" }).click();
  await expect(page.getByText("1/6")).toBeVisible();

  await page.getByLabel("Name").fill("Lena");
  await page.getByLabel("Title").fill("Candle Mapper");
  await expect(page.getByTestId("stat-preview")).toContainText("Front row");
  await page.getByLabel("Class", { exact: true }).selectOption("seeker");
  await page.getByLabel("Background", { exact: true }).selectOption("cartographer");
  await page.getByLabel("Trait", { exact: true }).selectOption("curious");
  await page.getByLabel("Aptitude", { exact: true }).selectOption("wit");
  await expect(page.getByTestId("stat-preview")).toContainText("Trap handling");
  await page.getByLabel("Notes").fill("Keeps a second map in mirror script.");
  await page.getByTestId("portrait-input").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    )
  });
  await expect(page.getByTestId("portrait-preview")).toBeVisible();
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

  await page.getByLabel("名前").fill("ミラ");
  await page.getByLabel("二つ名").fill("灯の地図師");
  await page.getByLabel("クラス", { exact: true }).selectOption("seeker");
  await page.getByRole("button", { name: "冒険者を登録" }).click();
  await expect(page.getByTestId("character-profile")).toContainText("灯の地図師 / 探索者");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
