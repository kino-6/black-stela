import { expect, test } from "@playwright/test";
import { resolveVisibleCombat, startNewExpedition } from "./helpers";

test("resolves tactical combat through visible actor, target, and combat commands", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Register adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enemy groups" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Party formation" })).toBeVisible();
  await expect(page.getByTestId("party-hud")).toHaveCount(0);
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
  await expect(page.getByTestId("combat-actor")).toContainText("Mira");
  await expect(page.getByRole("button", { name: "Attack" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resolve round" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sleep" })).toBeVisible();

  const combatBoardHeight = await page.getByLabel("Battle screen").evaluate((element) => element.getBoundingClientRect().height);
  expect(combatBoardHeight).toBeLessThan(430);

  await resolveVisibleCombat(page);

  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText(/Victory.*XP.*gold/i)).toBeVisible();
});

test("six-member party keeps front and back rows visible in combat", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByRole("button", { name: "Beginner Safe" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByTestId("party-front-row")).toContainText("Rook");
  await expect(page.getByTestId("party-back-row")).toContainText("Sei");
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByTestId("combat-front-row")).toContainText("Front row");
  await expect(page.getByTestId("combat-back-row")).toContainText("Back row");
  await expect(page.getByTestId("combat-actor")).toHaveCount(6);

  const commandDockBefore = await page.getByLabel("Combat commands").evaluate((element) => element.getBoundingClientRect().top);
  await page.getByRole("button", { name: "Defend" }).click();
  const commandDockAfter = await page.getByLabel("Combat commands").evaluate((element) => element.getBoundingClientRect().top);
  expect(Math.abs(commandDockAfter - commandDockBefore)).toBeLessThan(2);
});

test("keyboard-only command flow keeps command windows stable", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByRole("button", { name: "Beginner Safe" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  const dungeonDockBefore = await page
    .getByTestId("dungeon-command-window")
    .evaluate((element) => element.getBoundingClientRect().top);
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Battle screen")).toBeVisible();

  const combatDockBefore = await page
    .getByTestId("combat-command-window")
    .evaluate((element) => element.getBoundingClientRect().top);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("g");
  await expect(page.getByText("Round 2")).toBeVisible();
  const combatDockAfter = await page
    .getByTestId("combat-command-window")
    .evaluate((element) => element.getBoundingClientRect().top);

  expect(Math.abs(combatDockAfter - combatDockBefore)).toBeLessThan(2);
  expect(dungeonDockBefore).toBeGreaterThan(0);
});
