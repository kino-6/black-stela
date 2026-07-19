import { expect, test } from "@playwright/test";
import { registerAdventurer, resolveVisibleCombat, setTitleLanguage } from "./helpers";

test("switches to Japanese from title config and persists the selected language", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});

  await expect(page.getByRole("heading", { name: "冒険者登録" })).toBeVisible();
  await expect(page.getByRole("button", { name: "説明を聞かない" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "新たな探索" })).toBeVisible();
});

test("plays the MVP flow with Japanese room text and log projection", async ({ page }) => {
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});

  await registerAdventurer(page, { locale: "ja", name: "ミラ" });
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByRole("heading", { name: "静まり返った石室" })).toBeVisible();
  // IMP-029 — no auto-collect on entry; the safe landing shows no "found treasure" line.

  await page.keyboard.press("w");
  await expect(page.getByRole("heading", { name: "戦闘", exact: true })).toBeVisible();
  await expect(page.getByLabel("戦闘画面")).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("灰泥");
  await expect(page.getByText("Ash Slime")).toHaveCount(0);
  await expect(page.getByText("gold")).toHaveCount(0);
  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "古い塵の広間" })).toBeVisible();
  await expect(page.getByText("gold")).toHaveCount(0);
});

test("keeps Japanese layout usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});

  await expect(page.getByRole("button", { name: "説明を聞かない" })).toBeVisible();
  await registerAdventurer(page, { locale: "ja", name: "ミラ" });
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByText("冷たい切石が近く迫る。背後には町へ上る階段。先へ続く唯一の道は、南へ乾いた空気を漏らしている。")).toBeVisible();
  await expect(page.getByTestId("party-hud").getByTestId("party-hud-portrait")).toBeVisible();
  await expect(page.getByTestId("party-hud")).toContainText(/威力 \d+-\d+/);
  await expect(page.getByTestId("party-hud")).toContainText(/防御 \d+/);
  await expect(page.getByTestId("party-hud")).toContainText(/速度 \d+/);
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
