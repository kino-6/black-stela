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
