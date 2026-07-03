import { expect, test } from "@playwright/test";

test("blocks start and shows actionable scenario validation errors", async ({ page }) => {
  await page.goto("/?scenario=invalid");

  await expect(page.getByRole("heading", { name: "Scenario Validation" })).toBeVisible();
  await expect(page.getByText("Exit references unknown room: room.missing")).toBeVisible();
  await expect(page.getByText("dungeons/b1f.md")).toBeVisible();
  await expect(page.getByText("rooms[0].exits.east")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter dungeon" })).toHaveCount(0);
});

test("scenario validation UI supports Japanese labels", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
  await page.goto("/?scenario=invalid");

  await expect(page.getByRole("heading", { name: "シナリオ検証" })).toBeVisible();
  await expect(page.getByText("シナリオを開始できません。")).toBeVisible();
});
